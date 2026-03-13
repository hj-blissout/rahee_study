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
        const root = window.location.pathname.includes('/math/') ? '../../' : './';
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
 * Sync Progress
 */
async function pullFromSupabase() {
    const rows = await pullProgress();
    let updated = 0;
    rows.forEach(row => {
        const local = localStorage.getItem(row.storage_key);
        if (!local || new Date(row.completed_at) > new Date(local)) {
            localStorage.setItem(row.storage_key, row.completed_at);
            updated++;
        }
    });
    if (updated > 0) loadMathProgress();
}

async function syncProgress(key, date) {
    localStorage.setItem(key, date);
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

    const isSubDir = window.location.pathname.includes('/math_');
    const path = isSubDir ? `../data/math_${grade}/unit_${unitId}.json` : `./math/data/math_${grade}/unit_${unitId}.json`;

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
            const date = localStorage.getItem(key);
            if (date) {
                completedInUnit++;
                if (!lastDate || new Date(date) > new Date(lastDate)) lastDate = date;
            }
        }

        // Legacy check
        if (localStorage.getItem(`math_tutor_math_${grade}_unit${unitId}`) || localStorage.getItem(`math_tutor_math_${grade}_ch${index+1}`)) {
            if (completedInUnit < totalLessons) {
                completedInUnit = totalLessons;
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
        const isDone = localStorage.getItem(storageKey);
        return `
            <div class="lesson-item ${isDone ? 'completed' : ''}" style="display:flex; justify-content:space-between; padding:8px 12px; margin-bottom:4px; background:#f8fafc; border-radius:10px;">
                <span style="font-weight:700; color:${isDone ? '#059669' : '#64748b'}">${lesson.title}</span>
                <i class="${isDone ? 'fas fa-check-circle' : 'far fa-circle'}" style="color:${isDone ? '#10b981' : '#cbd5e1'}"></i>
            </div>
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

// Lifecycle
document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadMathProgress();
    pullFromSupabase();
});
