// =============================
// Supabase 클라이언트 설정 (multi-user Auth)
// =============================
// [학습 진행도 저장 규칙]
// - 로컬/DB 공용 키 형식: math_tutor_math_{grade}_unit{unitId}_lesson{lessonId}
// - 예: math_tutor_math_1_unit0101_lesson0101-01
// - 테이블: rahee_progress (user_id, storage_key, completed_at)
// =============================
const SUPABASE_URL = 'https://gvgarbiuzgxppbhenhxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Z2FyYml1emd4cHBiaGVuaHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODM5NzEsImV4cCI6MjA4ODg1OTk3MX0.knjJf3RP6uSxaRRhpA4q1CCglRqfQKje1uROhLuK7yI';

// Supabase JS 클라이언트 초기화 (CDN 로드 후 사용 가능)
let _supabase = null;
function getSupabase() {
    if (!_supabase && window.supabase) {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,      // localStorage에 세션 저장
                autoRefreshToken: true,    // 만료 전 자동 갱신
                detectSessionInUrl: false  // URL 파라미터 세션 감지 비활성
            }
        });
    }
    return _supabase;
}

// 현재 로그인된 사용자 ID (auth.uid()) 반환
async function getCurrentUserId() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data?.user?.id || null;
}

// 현재 로그인된 사용자 이름 반환
async function getCurrentUserName() {
    const sb = getSupabase();
    if (!sb) return '공부 중';
    const { data } = await sb.auth.getUser();
    return data?.user?.user_metadata?.display_name || data?.user?.email?.split('@')[0] || '공부 중';
}

/**
 * 인증 체크 - 비로그인 시 login.html로 리다이렉트
 * 수학 페이지에서 호출
 */
async function requireAuth() {
    const sb = getSupabase();
    if (!sb) return true; // Supabase CDN 미로드 시 그냥 통과 (로컬 개발용)

    const { data } = await sb.auth.getSession();
    if (!data.session) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        // login.html의 상대 경로 계산
        const depth = (window.location.pathname.match(/\//g) || []).length - 1;
        const prefix = '../'.repeat(depth);
        window.location.href = `${prefix}login.html?returnTo=${returnTo}`;
        return false;
    }

    // 사용자 이름을 헤더에 표시 (있는 경우)
    const name = await getCurrentUserName();
    const userEl = document.getElementById('current-user-name');
    if (userEl) userEl.textContent = name;

    return true;
}

/**
 * 로그아웃
 */
async function signOut() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    const depth = (window.location.pathname.match(/\//g) || []).length - 1;
    const prefix = '../'.repeat(depth);
    window.location.href = `${prefix}login.html`;
}

/**
 * Supabase에 학습 완료 기록을 저장 (upsert)
 */
async function pushToSupabase(storageKey, completedAt) {
    try {
        const sb = getSupabase();
        if (!sb) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        const { error } = await sb.from('rahee_progress').upsert({
            user_id: userId,
            storage_key: storageKey,
            completed_at: completedAt
        }, { onConflict: 'user_id,storage_key' });

        if (error) {
            console.warn('⚠️ Supabase 저장 실패:', error.message);
            showToast("⚠️ 기록 저장에 실패했어요. (네트워크 확인)");
        } else {
            console.log(`☁️ Supabase 동기화 완료: ${storageKey}`);
            showToast("✅ 학습 기록이 안전하게 저장되었습니다!");
        }
    } catch (e) {
        console.warn('⚠️ Supabase 연결 실패 (오프라인?)', e.message);
    }
}

/**
 * 간단한 토스트 알림 표시
 */
function showToast(msg, duration = 3000) {
    let toast = document.getElementById('math-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'math-toast';
        toast.style.cssText = `
            position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.9); color: white; padding: 14px 28px;
            border-radius: 50px; z-index: 100000; font-weight: 700; font-size: 0.95rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0; margin-bottom: -20px;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.marginBottom = '0';
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        toast.style.marginBottom = '-20px';
    }, duration);
}

/**
 * Supabase에서 학습 진행도를 가져와 localStorage에 병합
 */
async function pullFromSupabase() {
    try {
        const sb = getSupabase();
        if (!sb) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        const { data: rows, error } = await sb
            .from('rahee_progress')
            .select('storage_key, completed_at')
            .eq('user_id', userId);

        if (error) {
            console.warn('⚠️ Supabase 조회 실패:', error.message);
            return;
        }

        let updated = 0;
        rows.forEach(row => {
            const local = localStorage.getItem(row.storage_key);
            if (!local || new Date(row.completed_at) > new Date(local)) {
                localStorage.setItem(row.storage_key, row.completed_at);
                updated++;
            }
        });

        console.log(`☁️ Supabase 동기화 완료 (${rows.length}개 항목 확인, ${updated}개 로컬 업데이트)`);
        loadMathProgress(); // 데이터가 들어왔으니 화면을 다시 그립니다.
    } catch (e) {
        console.warn('⚠️ Supabase 동기화 실패 (오프라인?)', e.message);
    }
}

/**
 * 단원 JSON 데이터를 가져오는 유틸리티 (캐시 사용)
 */
const _unitCache = {};
async function getUnitInfo(grade, unitId) {
    const key = `${grade}_${unitId}`;
    if (_unitCache[key]) return _unitCache[key];

    // 경로 계산 (viewer.html 또는 index.html 위치 고려)
    const isSubDir = window.location.pathname.includes('/math_');
    const path = isSubDir ? `../data/math_${grade}/unit_${unitId}.json` : `./math/data/math_${grade}/unit_${unitId}.json`;

    try {
        const res = await fetch(path);
        const data = await res.json();
        _unitCache[key] = data;
        return data;
    } catch (e) {
        console.warn(`⚠️ 단원 데이터 로드 실패: ${unitId}`, e.message);
        return null;
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    loadMathProgress();
    // 비동기로 원격 데이터 동기화 (UI 블로킹 없음)
    pullFromSupabase();
});

/**
 * 뷰어의 특정 스텝 내의 인터랙티브 요소(힌트, 플래시카드 등)를 찾아 
 * 확인 전까지 '다음' 버튼을 비활성화하는 로직
 */
function initStepLock(stepNumber) {
    const card = document.getElementById('step' + stepNumber);
    if (!card) return;

    const btn = card.querySelector('.action-btn');
    if (!btn) return;

    // 상태 초기화
    btn.disabled = false;
    if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
    }

    const interactives = card.querySelectorAll('.interactive-box, .flashcard-container');
    if (interactives.length > 0) {
        btn.disabled = true;
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.innerHTML;
        }
        btn.innerHTML = "👆 위 카드를 모두 확인해주세요";
        
        // 플래시카드 클릭 이벤트 연결
        card.querySelectorAll('.flashcard-container').forEach(fc => {
            fc.addEventListener('click', () => {
                setTimeout(() => checkStepCompletion(card, btn), 100);
            });
        });
    }
}

// 진행도 로드 및 화면 반영 (인덱스 페이지용)
function loadMathProgress() {
    const cards = document.querySelectorAll('.card[data-unit], .card[id^="chapterCard"]');
    if (cards.length === 0) return;

    const path = window.location.pathname;
    const mathMatch = path.match(/math_(\d)/);
    if (!mathMatch) return;
    const grade = mathMatch[1];

    let completedCount = 0;
    const totalChapters = cards.length;

    cards.forEach((card, index) => {
        const unitId = card.dataset.unit;
        const totalLessons = parseInt(card.dataset.totalLessons || "1");
        
        let completedLessonsInUnit = 0;
        let lastCompletionDate = null;

        // 해당 단원의 모든 소단원 체크
        for (let i = 1; i <= totalLessons; i++) {
            const lessonNum = i < 10 ? `0${i}` : i;
            const lessonId = `${unitId}-${lessonNum}`;
            const storageKey = `math_tutor_math_${grade}_unit${unitId}_lesson${lessonId}`;
            const completionDate = localStorage.getItem(storageKey);
            
            if (completionDate) {
                completedLessonsInUnit++;
                if (!lastCompletionDate || new Date(completionDate) > new Date(lastCompletionDate)) {
                    lastCompletionDate = completionDate;
                }
            }
        }

        // --- [호환성 로직 추가] 예전 방식(chX) 또는 단원 전체 완료 키 체크 ---
        const legacyKey = `math_tutor_math_${grade}_unit${unitId}`;
        const legacyChKey = `math_tutor_math_${grade}_ch${index + 1}`; // 1번째 카드는 ch1
        const legacyCompletion = localStorage.getItem(legacyKey) || localStorage.getItem(legacyChKey);
        
        if (legacyCompletion) {
            // 업그레이드: 유닛 키가 없으면 로컬 스토리지 보완 (뷰어에서도 보이게)
            if (!localStorage.getItem(legacyKey)) {
                localStorage.setItem(legacyKey, legacyCompletion);
            }
            // 예전 기록이 있으면 전체 완료로 간주
            if (completedLessonsInUnit < totalLessons) {
                completedLessonsInUnit = totalLessons;
                lastCompletionDate = legacyCompletion;
            }
        }

        const isFullyCompleted = completedLessonsInUnit >= totalLessons;

        if (completedLessonsInUnit > 0) {
            if (isFullyCompleted) {
                completedCount++;
                card.classList.add('completed');
                
                const badge = card.querySelector('.status-badge');
                if (badge) {
                    badge.className = 'status-badge completed';
                    badge.innerHTML = '완료! 참 잘했어요 👑';
                }

                const dateEl = card.querySelector('.completed-date');
                if (dateEl && lastCompletionDate) {
                    const date = new Date(lastCompletionDate);
                    dateEl.dataset.completionDate = lastCompletionDate;
                    dateEl.innerHTML = `🗓️ ${date.toLocaleDateString()} 완료 <small style="color:#93c5fd; font-size:0.75em;">(터치해서 기록 보기)</small>`;
                    dateEl.style.display = 'block';
                    dateEl.style.cursor = 'pointer';
                    dateEl.style.pointerEvents = 'all';
                }

                const link = card.querySelector('.chapter');
                if (link) {
                    link.innerHTML = '다시 복습하기 🔁';
                    link.style.background = '#64748b';
                }
            } else {
                // 부분 완료 표시 (진행 중)
                const badge = card.querySelector('.status-badge');
                if (badge) {
                    badge.className = 'status-badge processing';
                    badge.style.background = '#fef9c3';
                    badge.style.color = '#854d0e';
                    badge.innerHTML = `공부 중.. (${completedLessonsInUnit}/${totalLessons})`;
                }
            }
        }
    });

    // 소단원 리스트 렌더링 (있는 경우)
    cards.forEach(async (card) => {
        const unitId = card.dataset.unit;
        const lessonListContainer = card.querySelector('.lesson-list');
        if (!lessonListContainer || !unitId) return;

        const unitData = await getUnitInfo(grade, unitId);
        if (!unitData) return;

        let html = '';
        unitData.lessons.forEach(lesson => {
            const isDone = isLessonComplete(unitId, lesson.lesson_id);
            const statusIcon = isDone ? '<i class="fas fa-check-circle" style="color:#10b981;"></i>' : '<i class="far fa-circle" style="color:#cbd5e1;"></i>';
            const statusClass = isDone ? 'completed' : '';
            
            html += `
                <div class="lesson-item ${statusClass}" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-radius:10px; margin-bottom:6px; background:#f8fafc; font-size:0.9rem;">
                    <span style="font-weight:700; color:${isDone ? '#1e293b' : '#94a3b8'};">${lesson.title}</span>
                    ${statusIcon}
                </div>
            `;
        });
        lessonListContainer.innerHTML = html;
    });

    // 진행도 바 업데이트
    updateProgressBar(completedCount, totalChapters);
}

// 진행도 바 및 오빠의 응원 메시지 업데이트
function updateProgressBar(completedCount, total) {
    const fill = document.getElementById('progress-fill');
    const icon = document.getElementById('progress-icon');
    const text = document.getElementById('progress-text');
    
    if (!fill || !icon || !text) return;

    const percent = total > 0 ? (completedCount / total) * 100 : 0;
    fill.style.width = percent + '%';
    icon.style.left = percent + '%';

    if (percent === 0) {
        text.textContent = "아직 시작 안 했네? 오빠랑 첫 단추부터 잘 꿰어보자! 💪";
    } else if (percent < 50) {
        text.textContent = `오~ 벌써 ${completedCount}개나 했어? 라희 대단한데? 🚀`;
    } else if (percent < 100) {
        text.textContent = `와! 절반 넘게 왔어! 조금만 더 힘내자, 라희야! 🔥`;
    } else {
        text.textContent = "대박! 모든 단원 마스터! 역시 우리 라희가 최고야! 🏆✨";
        fireConfetti(); // 전체 완료 시 폭죽!
    }
}

// 스텝 내의 모든 인터랙티브 요소가 확인되었는지 체크
function checkStepCompletion(card, btn) {
    if (!btn || !btn.disabled) return;
    
    let allRevealed = true;
    const interactives = card.querySelectorAll('.interactive-box, .flashcard-container');
    
    interactives.forEach(item => {
        if (item.classList.contains('flashcard-container')) {
            const flashcard = item.querySelector('.flashcard');
            if (flashcard && !flashcard.classList.contains('flipped')) {
                allRevealed = false;
            }
        } else if (item.classList.contains('interactive-box')) {
            if (item.dataset.revealed !== 'true') {
                allRevealed = false;
            }
        }
    });

    if (allRevealed) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || "다음 단계로 고고 🚀";
        btn.style.animation = "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    }
}

// 칭찬 사운드 재생
function playCuteSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        function createOscillator(freq, time, type = 'sine') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
            gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + 0.1);
        }
        createOscillator(523.25, 0);       // C5
        createOscillator(659.25, 0.05);    // E5
        createOscillator(783.99, 0.1);     // G5
        createOscillator(1046.50, 0.15);   // C6
    } catch(e) {}
}

// 탭해서 보기 (히든 텍스트 표시)
function reveal(el) {
    if (el.dataset.revealed === 'true') return;

    const hint = el.querySelector('.tap-hint');
    const content = el.querySelector('.hidden-content');
    if (hint) hint.style.display = 'none';
    if (content) content.style.display = 'block';
    el.style.background = '#eff6ff';
    el.style.borderStyle = 'solid';
    
    el.dataset.revealed = 'true';
    
    const card = el.closest('.step-card');
    const btn = card ? card.querySelector('.action-btn') : null;
    if (card && btn) {
        checkStepCompletion(card, btn);
    }
}

// 완료하고 다음 스텝으로 이동
function completeStep(currentStep) {
    playCuteSound();
    const currentCard = document.getElementById('step' + currentStep);
    if(currentCard) {
        currentCard.classList.remove('active');
        currentCard.classList.add('completed');
    }

    const btn = document.getElementById('btn-step' + currentStep);
    if(btn) {
        btn.style.display = 'none';
    }

    const nextStep = currentStep + 1;
    const nextCard = document.getElementById('step' + nextStep);
    if (nextCard) {
        nextCard.classList.add('active');
        updateViewerProgress(nextStep);
        setTimeout(() => {
            nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } else {
        // 마지막 스텝 완료 시 100%
        updateViewerProgress(5);

        // [추가] 퀴즈가 없는 레슨인 경우 여기서 완료 처리
        const lesson = window.currentLesson;
        if (lesson) {
            const quizStep = lesson.steps.find(s => s.type === 'quiz');
            if (!quizStep || !quizStep.items || quizStep.items.length === 0) {
                if (!window.confettiFired) {
                    window.confettiFired = true;
                    markChapterComplete();
                    // 뷰어 이벤트 발생
                    window.dispatchEvent(new CustomEvent('mathLessonComplete'));
                    fireConfetti();
                }
            }
        }
    }
}

// 뷰어 내부의 진행도 바 업데이트
function updateViewerProgress(step) {
    const mainProgress = document.getElementById('main-progress');
    if (mainProgress) {
        const percent = (step / 5) * 100;
        mainProgress.style.width = percent + '%';
    }
}

function checkAnswer(btn, isCorrect, feedbackId, customMsg = "") {
    const feedback = document.getElementById(feedbackId);
    const quizItem = btn.closest('.quiz-container') || btn.closest('[data-quiz-q]') || btn.parentElement;
    
    if (quizItem.dataset.completed === 'true') return;

    const optionsContainer = btn.parentElement;
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(b => b.classList.remove('correct', 'wrong'));

    if (isCorrect) {
        playCuteSound();
        btn.classList.add('correct');
        feedback.textContent = "🎉 정답이야 라희야! 완전 똑똑한데?! 찰칵 📸";
        feedback.style.color = "#047857";
        quizItem.dataset.completed = 'true';

        // 모든 문제 풀이 여부 확인
        const quizContainers = document.querySelectorAll('.quiz-container, [data-quiz-q]');
        const qList = Array.from(quizContainers).filter(q => q.querySelector('.option-btn'));
        const allDone = qList.length > 0 && qList.every(q => q.dataset.completed === 'true');

        if (allDone && !window.confettiFired) {
            window.confettiFired = true;
            markChapterComplete();
            
            // 뷰어 자체적으로 결과 영역을 렌더링하도록 이벤트 발생 (viewer.html에서 수신)
            const event = new CustomEvent('mathLessonComplete');
            window.dispatchEvent(event);
            
            fireConfetti();
            
            const returnBtn = document.getElementById('btn-return-home');
            if(returnBtn) returnBtn.style.display = 'block';
            
            const finalMsg = customMsg || "축하해! 이번 단원도 오빠랑 무사히 마스터 성공! 라희 마음에 저장~🌟";
            feedback.innerHTML += `<br><span style='font-size:1.2rem; color:#2563eb; display:block; margin-top:8px;'>${finalMsg}</span>`;
        }
    } else {
        btn.classList.add('wrong');
        feedback.textContent = "아고 아쉬워라! 라희야 다시 한 번 오빠랑 생각해보자!";
        feedback.style.color = "#be123c";
    }
}

// 로컬 스토리지 및 DB에 소단원 단위로 완료 기록
function markChapterComplete() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const mathMatch = path.match(/math_(\d)/);
    const unitId = urlParams.get('unit');
    
    // viewer.html의 전역 변수 (window.currentLesson) 활용
    const lessonId = window.currentLesson ? window.currentLesson.lesson_id : null;
    
    if (mathMatch && unitId && lessonId) {
        const grade = mathMatch[1];
        const storageKey = `math_tutor_math_${grade}_unit${unitId}_lesson${lessonId}`;
        const completedAt = new Date().toISOString();
        
        // 중복 저장 방지 (이미 오늘 완료했다면 스킵할 수도 있음 - 여기서는 그냥 덮어씀)
        localStorage.setItem(storageKey, completedAt);
        console.log(`💾 로컬 저장: ${storageKey}`);
        
        // Supabase에 비동기 동기화
        pushToSupabase(storageKey, completedAt);
    } else {
        console.warn('⚠️ 저장 실패: 필수 정보 부족', { mathMatch, unitId, lessonId });
    }
}

/**
 * 특정 소단원이 완료되었는지 확인 (뷰어 네비용 및 리스트 표시용)
 */
function isLessonComplete(unitId, lessonId) {
    const path = window.location.pathname;
    const mathMatch = path.match(/math_(\d)/);
    if (!mathMatch) return false;
    
    const grade = mathMatch[1];
    
    // 1. 신 형식 체크 (소단원 개별)
    const storageKey = `math_tutor_math_${grade}_unit${unitId}_lesson${lessonId}`;
    if (localStorage.getItem(storageKey)) return true;
    
    // 2. 레거시 형식 체크 (단원 전체 완료 - unitId)
    if (localStorage.getItem(`math_tutor_math_${grade}_unit${unitId}`)) return true;
    
    // 3. 레거시 형식 체크 (챕터 번호 기반 - chX)
    // 인덱스 페이지인 경우 카드 순서로 찾아서 정확히 매핑 (잘못된 매핑 방지)
    const cardList = Array.from(document.querySelectorAll('.card[data-unit]'));
    if (cardList.length > 0) {
        const foundIdx = cardList.findIndex(c => c.dataset.unit === unitId);
        if (foundIdx !== -1 && localStorage.getItem(`math_tutor_math_${grade}_ch${foundIdx + 1}`)) return true;
    }

    // 뷰어 등 인덱스 페이지가 아닌 경우, chX 기반의 추측(guessedCh)은 정확도가 떨어지므로 수행하지 않음.
    // 대신 인덱스 페이지 방문 시 unitId 키로 업그레이드된 데이터를 참조하게 됨.
    return false;
}

// 축하 폭죽 애니메이션 및 성공 팝업
function fireConfetti() {
    if (typeof confetti === 'function') {
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10001 };

        function randomInRange(min, max) { return Math.random() * (max - min) + min; }

        var interval = setInterval(function () {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            var particleCount = 50 * (timeLeft / duration);
            var colors = ['#2563eb', '#3b82f6', '#93c5fd', '#1e3a8a', '#1d4ed8'];
            confetti(Object.assign({}, defaults, { particleCount, colors: colors, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, colors: colors, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
    setTimeout(showSuccessCelebration, 1200);
}

// 성공 축하 팝업 표시
function showSuccessCelebration() {
    let overlay = document.getElementById('celebration-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'celebration-overlay';
        overlay.className = 'celebration-overlay';
        const imgPath = window.location.pathname.includes('/math/') ? '../data/pjh.jpeg' : './math/data/pjh.jpeg';
        
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-text" style="font-family: 'Do Hyeon', sans-serif;">내 마음속에 저장~ 📸</div>
                <img src="${imgPath}" alt="박지훈" class="celebration-img">
                <div class="celebration-subtext">라희야, 오늘도 한 단원 완벽하게 마스터했어! 진짜 멋지다! 👍</div>
                <button class="btn-close-celebration" onclick="closeCelebration()">다음에 또 만나요!</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        window.closeCelebration = function() {
            const ov = document.getElementById('celebration-overlay');
            ov.classList.remove('show');
            setTimeout(() => { ov.style.display = 'none'; }, 500);
        };
    }
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 50);
}
