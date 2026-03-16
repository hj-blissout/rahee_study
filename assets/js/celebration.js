/**
 * English Common Assets for Celebration
 */

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
    // "띠리링~" 아르페지오 효과음
    createOscillator(523.25, 0);       // C5
    createOscillator(659.25, 0.05);    // E5
    createOscillator(783.99, 0.1);     // G5
    createOscillator(1046.50, 0.15);   // C6
}

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
            var colors = ['#7c4dff', '#b388ff', '#ff4081', '#7c4dff', '#00f2fe'];
            confetti(Object.assign({}, defaults, { particleCount, colors: colors, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, colors: colors, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
    setTimeout(showSuccessCelebration, 1200);
}

function showSuccessCelebration() {
    let overlay = document.getElementById('celebration-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'celebration-overlay';
        overlay.className = 'celebration-overlay';
        
        // 이미지 경로: english/ 폴더 아래에서 실행되므로
        const imgPath = '../assets/images/pjh.jpeg';
        
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-text">내 마음속에 저장~ 📸</div>
                <img src="${imgPath}" alt="박지훈" class="celebration-img">
                <div class="celebration-subtext">라희야, 영어 공부도 완벽하게 마스터했어! 진짜 멋지다! 👍</div>
                <button class="btn-close-celebration" onclick="closeCelebration()">오빠랑 또 공부하자!</button>
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
