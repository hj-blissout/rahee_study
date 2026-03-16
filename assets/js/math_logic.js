/**
 * Math Curriculum Common Logic
 * Dependencies: supabase_service.js, app_utils.js
 */

// UI Helper to find root
const PROJECT_ROOT = (function() {
    const scripts = document.getElementsByTagName('script');
    for (let s of scripts) {
        if (s.src.includes('math_common.js')) {
            return s.src.replace('math_common.js', '');
        }
    }
    return '';
})();

// Auth Guard
async function requireAuth() {
    const session = await getSession();
    if (!session) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        const root = window.location.pathname.includes('/math_') ? '../../' : window.location.pathname.includes('/math/') ? '../' : './';
        window.location.href = `${root}login.html?returnTo=${returnTo}`;
        return false;
    }
    
    // Set user name in header
    const user = await getCurrentUser();
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '라희';
    const userEl = document.getElementById('current-user-name');
    if (userEl) userEl.textContent = name;
    
    return true;
}

async function signOut() {
    await logout();
}

/**
 * Math Progress: Supabase 기반 (in-memory cache)
 */
const _mathProgressCache = {};

function getMathProgress(key) {
    return _mathProgressCache[key] || null;
}

async function pullFromSupabase() {
    const rows = await pullProgress();
    let updated = 0;
    rows.forEach(row => {
        if (!row.storage_key || !row.storage_key.startsWith('math_tutor_')) return;
        const prev = _mathProgressCache[row.storage_key];
        if (!prev || new Date(row.completed_at) > new Date(prev)) {
            _mathProgressCache[row.storage_key] = row.completed_at;
            updated++;
        }
    });
    if (updated > 0) loadMathProgress();
}

async function syncProgress(key, date) {
    if (!key.startsWith('math_tutor_')) return;
    _mathProgressCache[key] = date;
    const { error } = await pushProgress(key, date);
    if (!error) {
        showToast("✅ 학습 기록이 안전하게 저장되었습니다!");
    } else {
        showToast("⚠️ 기록 저장에 실패했어요. (네트워크 확인)");
    }
}

/**
 * Data Fetching
 */
const _unitCache = {};
async function getUnitInfo(grade, unitId) {
    const key = `${grade}_${unitId}`;
    if (_unitCache[key]) return _unitCache[key];

    const pathname = window.location.pathname;
    let path;
    if (pathname.includes('/math')) {
        const basePath = pathname.includes('.') ? pathname.replace(/\/[^/]*$/, '/') : (pathname.endsWith('/') ? pathname : pathname + '/');
        path = `${window.location.origin}${basePath}data/math_${grade}/unit_${unitId}.json`;
    } else {
        path = `./math/data/math_${grade}/unit_${unitId}.json`;
    }

    try {
        const res = await fetch(path);
        const data = await res.json();
        _unitCache[key] = data;
        return data;
    } catch (e) {
        return null;
    }
}

/**
 * Progress Rendering (Index Pages)
 */
function loadMathProgress() {
    const cards = document.querySelectorAll('.card[data-unit]');
    if (cards.length === 0) return;

    const grade = window.currentGrade || (window.location.pathname.match(/math_(\d)/)?.[1]);
    if (!grade) return;

    let completedCount = 0;
    
    cards.forEach((card, index) => {
        const unitId = card.dataset.unit;
        const totalLessons = parseInt(card.dataset.totalLessons || "1");
        let completedInUnit = 0;
        let lastDate = null;

        for (let i = 1; i <= totalLessons; i++) {
            const lessonId = `${unitId}-${i < 10 ? '0' + i : i}`;
            const key = `math_tutor_math_${grade}_unit${unitId}_lesson${lessonId}`;
            const date = getMathProgress(key);
            if (date) {
                completedInUnit++;
                if (!lastDate || new Date(date) > new Date(lastDate)) lastDate = date;
            }
        }

        const isFullyDone = completedInUnit >= totalLessons;
        if (completedInUnit > 0) {
            const badge = card.querySelector('.status-badge');
            if (isFullyDone) {
                completedCount++;
                card.classList.add('completed');
                if (badge) {
                    badge.className = 'status-badge completed';
                    badge.innerHTML = '완료! 참 잘했어요 👑';
                }
                const dateEl = card.querySelector('.completed-date');
                if (dateEl && lastDate) {
                    dateEl.innerHTML = `🗓️ ${new Date(lastDate).toLocaleDateString()} 완료`;
                    dateEl.style.display = 'block';
                }
            } else {
                if (badge) {
                    badge.className = 'status-badge processing';
                    badge.innerHTML = `공부 중.. (${completedInUnit}/${totalLessons})`;
                }
            }
        }
        
        // Render lesson list hints
        renderLessonList(card, grade, unitId);
    });

    updateOverallProgressUI(completedCount, cards.length);
}

async function renderLessonList(card, grade, unitId) {
    const container = card.querySelector('.lesson-list');
    if (!container) return;
    const data = await getUnitInfo(grade, unitId);
    if (!data) return;

    container.innerHTML = data.lessons.map(lesson => {
        const storageKey = `math_tutor_math_${grade}_unit${unitId}_lesson${lesson.lesson_id}`;
        const isDone = getMathProgress(storageKey);
        return `
            <span class="lesson-chip ${isDone ? 'completed' : ''}">${lesson.title}${isDone ? ' <i class="fas fa-check-circle" style="font-size:0.75em; margin-left:4px;"></i>' : ''}</span>
        `;
    }).join('');
}

function updateOverallProgressUI(done, total) {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (!fill || !text) return;

    const percent = total > 0 ? (done / total) * 100 : 0;
    fill.style.width = percent + '%';
    
    if (percent === 100) {
        text.textContent = "대박! 모든 단원 마스터! 역시 우리 라희가 최고야! 🏆✨";
        fireConfetti();
    } else if (percent > 0) {
        text.textContent = `벌써 ${done}개 단원 완료! 라희야 조금만 더 힘내자! 🚀`;
    }
}

/**
 * Viewer: Lesson completion check (viewer_logic.js에서 사용)
 */
function isLessonComplete(unitId, lessonId) {
    const grade = window.currentGrade;
    if (!grade) return false;
    const key = `math_tutor_math_${grade}_unit${unitId}_lesson${lessonId}`;
    return !!getMathProgress(key);
}

/**
 * Viewer: 진행률 바 업데이트
 */
function updateViewerProgress(percent) {
    const el = document.getElementById('main-progress');
    if (el) el.style.width = (typeof percent === 'number' ? percent : 20) + '%';
}

/**
 * Viewer: 터치 시 정답/힌트 표시
 */
function reveal(el) {
    if (!el) return;
    const hint = el.querySelector('.tap-hint');
    const hidden = el.querySelector('.hidden-content');
    if (hint) hint.style.display = 'none';
    if (hidden) hidden.style.display = 'block';
    const card = el.closest('.step-card');
    if (card) {
        const btn = card.querySelector('.action-btn');
        const interactives = card.querySelectorAll('.interactive-box, .flashcard-container');
        const allRevealed = Array.from(interactives).every(box => {
            const h = box.querySelector('.hidden-content');
            return !h || h.style.display === 'block';
        });
        if (btn && allRevealed && btn.dataset.originalText) {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText;
        }
    }
}

/**
 * Viewer: 퀴즈 정답 체크
 */
function checkAnswer(btn, isCorrect, feedbackId) {
    if (!btn) return;
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    btn.disabled = true;
    const feedback = document.getElementById(feedbackId);
    if (feedback) {
        feedback.textContent = isCorrect ? '✅ 정답이야!' : '❌ 다시 생각해봐!';
        feedback.style.color = isCorrect ? '#059669' : '#be123c';
    }
    const container = btn.closest('.step-card');
    if (container && isCorrect) {
        // 문항별로 하나씩 선택하므로, 각 퀴즈 컨테이너에서 선택된 답이 정답인지 확인
        const quizContainers = container.querySelectorAll('[data-quiz-q]');
        let allAnswered = quizContainers.length > 0;
        let allCorrect = true;
        for (const qc of quizContainers) {
            const chosen = qc.querySelector('.option-btn:disabled');
            if (!chosen) {
                allAnswered = false;
                break;
            }
            if (!chosen.classList.contains('correct')) {
                allCorrect = false;
                break;
            }
        }
        if (allAnswered && allCorrect) {
            const stepBtn = container.querySelector('.action-btn');
            if (stepBtn && stepBtn.disabled) {
                stepBtn.disabled = false;
                stepBtn.innerHTML = stepBtn.dataset.originalText || stepBtn.innerHTML;
            }
            if (container.id === 'step5') {
                markChapterComplete();
                window.dispatchEvent(new Event('mathLessonComplete'));
            }
        }
    }
}

/**
 * Viewer: 단계 완료 → 다음 단계로
 */
function completeStep(stepNum) {
    const card = document.getElementById('step' + stepNum);
    if (!card) return;
    card.classList.add('completed');
    card.classList.remove('active');
    const nextCard = document.getElementById('step' + (stepNum + 1));
    if (nextCard) {
        nextCard.classList.add('active');
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const percent = (stepNum / 5) * 100;
    updateViewerProgress(percent);
    if (stepNum === 5) {
        markChapterComplete();
        window.dispatchEvent(new Event('mathLessonComplete'));
    }
}

/**
 * Viewer Core
 */
function initStepLock(step) {
    const card = document.getElementById('step' + step);
    const btn = card?.querySelector('.action-btn');
    if (!btn) return;

    const interactives = card.querySelectorAll('.interactive-box, .flashcard-container');
    if (interactives.length > 0) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = "👆 위 카드를 모두 확인해주세요";
    }
}

function markChapterComplete() {
    const urlParams = new URLSearchParams(window.location.search);
    const unitId = urlParams.get('unit');
    const grade = window.currentGrade;
    const lessonId = window.currentLesson?.lesson_id;

    if (grade && unitId && lessonId) {
        const key = `math_tutor_math_${grade}_unit${unitId}_lesson${lessonId}`;
        syncProgress(key, new Date().toISOString());
    }
}

// Lifecycle: Supabase에서 먼저 pull 후 렌더
document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    await pullFromSupabase();
    loadMathProgress();
});
