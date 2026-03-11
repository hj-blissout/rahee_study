// 수학 공통 함수들 (불꽃놀이 효과, 칭찬 사운드 등)

// 페이지 로드 시 인터랙티브 요소가 있는 스텝의 버튼 비활성화
document.addEventListener('DOMContentLoaded', () => {
    const stepCards = document.querySelectorAll('.step-card');
    
    stepCards.forEach(card => {
        const btn = card.querySelector('.action-btn');
        if (!btn || card.classList.contains('completed')) return;
        
        const interactives = card.querySelectorAll('.interactive-box, .flashcard-container');
        if (interactives.length > 0) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML; // 기존 텍스트 저장
            btn.innerHTML = "👆 위 카드를 모두 확인해주세요";
            
            // 플래시카드 이벤트 리스너 추가
            card.querySelectorAll('.flashcard-container').forEach(fc => {
                fc.addEventListener('click', () => {
                    // 약간의 딜레이로 inline onclick(.flipped 클래스 토글) 이후에 체크
                    setTimeout(() => checkStepCompletion(card, btn), 50);
                });
            });
        }
    });
});

// 스텝 내의 모든 인터랙티브 요소가 확인되었는지 체크
function checkStepCompletion(card, btn) {
    if (!btn || !btn.disabled) return; // 이미 활성화되었으면 무시
    
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
        // 시각적 강조 피드백
        btn.style.animation = "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    }
}

// 칭찬 사운드 재생
function playCuteSound() {
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
    // "띠리링~" 귀여운 아르페지오 효과음
    createOscillator(523.25, 0);       // C5
    createOscillator(659.25, 0.05);    // E5
    createOscillator(783.99, 0.1);     // G5
    createOscillator(1046.50, 0.15);   // C6
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
        setTimeout(() => {
            nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// 축하 폭죽 애니메이션
function fireConfetti() {
    // 만약 canvas-confetti 라이브러리가 로드되지 않았다면 무시
    if (typeof confetti !== 'function') return;

    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

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
