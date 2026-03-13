/**
 * Common App Utilities
 */

// Toast Notifications
function showToast(msg, duration = 3000) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
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

// Celebration (Confetti)
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
}

// Audio Utils
function playSuccessSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        function createOscillator(freq, time) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
            gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + 0.1);
        }
        createOscillator(523.25, 0);       
        createOscillator(659.25, 0.05);    
        createOscillator(783.99, 0.1);     
        createOscillator(1046.50, 0.15);   
    } catch(e) {}
}

// Date Utils
function formatStudyDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth()+1}/${date.getDate()}`;
}
