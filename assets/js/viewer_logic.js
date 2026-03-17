/**
 * Shared Viewer Logic
 */

let fullData = null;
let currentUnit = null;
let currentLesson = null;
let confettiFired = false;

async function initViewer() {
    const url = new URL(window.location.href);
    const gradeFromUrl = url.searchParams.get('grade');
    const unitFromUrl = url.searchParams.get('unit');
    const grade = gradeFromUrl || sessionStorage.getItem('math_grade') || '1';
    const targetUnitId = unitFromUrl || sessionStorage.getItem('math_unit') || '0101';
    // URL에 파라미터가 있으면 sessionStorage 동기화 (다음 방문 시 stale 방지)
    if (gradeFromUrl) sessionStorage.setItem('math_grade', gradeFromUrl);
    if (unitFromUrl) sessionStorage.setItem('math_unit', unitFromUrl);
    window.currentGrade = grade;

    await pullFromSupabase();

    try {
        const pathname = window.location.pathname;
        const mathMatch = pathname.match(/^(.*\/math)\/?/);
        const basePath = mathMatch ? mathMatch[1] + '/' : pathname.replace(/\/[^/]*$/, '/');
        const dataUrl = `${window.location.origin}${basePath}data/math_${grade}/unit_${targetUnitId}.json`;
        const indexUrl = `${window.location.origin}${basePath}data/math_${grade}/index.json`;

        const [unitRes, indexRes] = await Promise.all([fetch(dataUrl), fetch(indexUrl)]);
        const unitData = await unitRes.json();
        let indexData = null;
        try { indexData = await indexRes.json(); } catch (_) {}

        fullData = unitData;
        currentUnit = unitData;
        window.currentUnit = currentUnit;

        const curriculumLabel = unitData.curriculum || `중${grade} 수학`;
        document.getElementById('unit-title').innerText = `${curriculumLabel} > ${unitData.title}`;
        const backBtn = document.getElementById('btn-back-list');
        if (backBtn) backBtn.href = `../?grade=${grade}`;

        const unitMeta = indexData?.units?.find(u => u.unit_id === targetUnitId);
        renderLectureLinks(unitMeta?.lectures || unitMeta?.youtube);

        renderLessonNav();
        loadLesson(0);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('lesson-content').style.display = 'block';
    } catch (error) {
        console.error(error);
        document.getElementById('loading').innerHTML = `
            <div style="color: #be123c; font-weight: bold;">
                <i class="fas fa-exclamation-triangle"></i> 데이터를 불러오지 못했어요.
            </div>
        `;
    }
}

function renderLectureLinks(lecturesOrUrls) {
    const container = document.getElementById('youtube-links');
    if (!container) return;
    const LABELS = { jungseungje: '정승제', quebon: '깨봉수학' };
    let html = '';
    if (lecturesOrUrls && typeof lecturesOrUrls === 'object' && !Array.isArray(lecturesOrUrls)) {
        for (const [key, url] of Object.entries(lecturesOrUrls)) {
            if (url) html += `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i> ${LABELS[key] || key}</a>`;
        }
    } else if (Array.isArray(lecturesOrUrls) && lecturesOrUrls.length > 0) {
        html = lecturesOrUrls.map((url, i) =>
            `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i> 영상 ${i + 1}</a>`
        ).join('');
    }
    if (!html) {
        container.style.display = 'none';
        return;
    }
    container.innerHTML = html;
    container.style.display = 'flex';
}

function renderLessonNav() {
    const nav = document.getElementById('lesson-nav');
    if (!nav) return;
    nav.innerHTML = '';
    currentUnit.lessons.forEach((lesson, idx) => {
        const isDone = isLessonComplete(currentUnit.unit_id, lesson.lesson_id);
        const isActive = currentLesson ? currentLesson.lesson_id === lesson.lesson_id : (idx === 0);
        const item = document.createElement('div');
        item.className = 'nav-item' + (isActive ? ' active' : '');
        
        const checkMark = isDone ? ' <i class="fas fa-check-circle" style="color:var(--secondary-color); margin-left:5px;"></i>' : '';
        item.innerHTML = `${lesson.title}${checkMark}`;
        
        item.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            loadLesson(idx);
            updateViewerProgress(1);
        };
        nav.appendChild(item);
    });
}

function updateLessonTitle() {
    const titleEl = document.getElementById('lesson-title');
    if (!titleEl || !currentLesson) return;
    titleEl.textContent = '';
    titleEl.appendChild(document.createTextNode(currentLesson.title));
    if (isLessonComplete(currentUnit.unit_id, currentLesson.lesson_id)) {
        const check = document.createElement('span');
        check.innerHTML = ' <i class="fas fa-check-circle" style="color:var(--secondary-color); margin-left:6px;"></i>';
        titleEl.appendChild(check);
    }
}

function loadLesson(index) {
    currentLesson = currentUnit.lessons[index];
    window.currentLesson = currentLesson;
    updateLessonTitle();
    confettiFired = false;
    
    for(let i=1; i<=5; i++) {
        const card = document.getElementById('step'+i);
        if (card) {
            card.classList.remove('active', 'completed');
            if(i === 1) card.classList.add('active');
        }
        const btn = document.getElementById('btn-step'+i);
        if(btn) btn.style.display = 'block';
    }
    const completionNav = document.getElementById('completion-nav');
    if (completionNav) completionNav.style.display = 'none';

    renderRecall(currentLesson.steps.find(s => s.type === 'recall'));
    renderConcept(currentLesson.steps.find(s => s.type === 'concept'));
    renderPattern(currentLesson.steps.find(s => s.type === 'pattern'));
    renderGuided(currentLesson.steps.find(s => s.type === 'guided_example'));
    renderQuiz(currentLesson.steps.find(s => s.type === 'quiz'));

    for(let i=1; i<=5; i++) initStepLock(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRecall(step) {
    if(!step) return;
    const container = document.getElementById('recall-content');
    if (!container) return;
    container.innerHTML = `
        <h2 class="math-question">${step.prompt}</h2>
        <div class="interactive-box" onclick="reveal(this)">
            <div class="tap-hint">터치해서 정답 확인 👀</div>
            <div class="hidden-content" style="display:none">
                <div class="answer-box">정답은 <b>${step.reveal_answer}</b>!</div>
            </div>
        </div>
    `;
}

function renderConcept(step) {
    if(!step) return;
    const container = document.getElementById('concept-content');
    if (!container) return;
    let conceptsHtml = step.concepts.map(c => `<li><i class="fas fa-check" style="color:var(--primary-color)"></i> ${c}</li>`).join('');
    let misconceptionsHtml = step.misconceptions ? 
        `<div class="tip-box" style="margin-top:20px; background:#fff1f2; border-color:#fda4af;">
            <strong>⚠️ 라희야, 이건 조심해!</strong><br>
            ${step.misconceptions.join(', ')}
        </div>` : '';
    
    container.innerHTML = `<ul class="concept-list" style="list-style:none; padding:0; font-size:1.1rem; line-height:1.8;">${conceptsHtml}</ul>${misconceptionsHtml}`;
}

function renderPattern(step) {
    if(!step) return;
    const container = document.getElementById('pattern-content');
    if (!container) return;
    let examplesHtml = step.examples.map(ex => {
        const keys = Object.keys(ex);
        if (keys.length >= 2) {
             // Basic generic rendering for pattern examples
             let content = "";
             if (ex.expr && ex.value) content = `${ex.expr} = <b>${ex.value}</b>`;
             else if (ex.from && ex.to) content = `${ex.from} → <b>${ex.to}</b>`;
             else content = `${ex[keys[0]]}: <b>${ex[keys[1]]}</b>`;
             return `<div class="answer-box" style="margin-bottom:10px; width:100%;">${content}</div>`;
        }
        return '';
    }).join('');
    container.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; width:100%;">${examplesHtml}</div>`;
}

function renderGuided(step) {
    if(!step) return;
    const container = document.getElementById('guided-content');
    if (!container) return;
    let solText = typeof step.solution === 'object' ? 
        Object.entries(step.solution).map(([k,v]) => `${k}: ${v}`).join(', ') : step.solution;

    container.innerHTML = `
        <div class="step-desc">${step.problem}</div>
        <div class="interactive-box" onclick="reveal(this)">
            <div class="tap-hint"><i class="fas fa-lightbulb"></i> 힌트 보기</div>
            <div class="hidden-content" style="display:none; color:var(--primary-color); font-weight:bold;">${step.hint}</div>
        </div>
        <div class="interactive-box" onclick="reveal(this)" style="margin-top:10px; border-color:#10b981;">
            <div class="tap-hint" style="color:#10b981;">풀이 확인 👀</div>
            <div class="hidden-content" style="display:none">
                <div class="answer-box" style="border-color:#10b981">${solText}</div>
            </div>
        </div>
    `;
}

function renderQuiz(step) {
    if(!step) return;
    const container = document.getElementById('quiz-content');
    if (!container) return;
    container.innerHTML = step.items.map((item, qIdx) => {
        const optionsHtml = item.choices.map((choice, cIdx) => `
            <button class="option-btn" onclick="checkAnswer(this, ${cIdx === item.answer}, 'feedback-${qIdx}')">${choice}</button>
        `).join('');

        return `
            <div class="quiz-container" data-quiz-q="${qIdx}" style="margin-bottom: 30px; background:#fff; padding:20px; border-radius:20px; box-shadow:0 4px 6px rgba(0,0,0,0.02); border:1px solid #f1f5f9;">
                <h3 class="quiz-question">${qIdx+1}. ${item.q}</h3>
                <div class="options-grid" style="display:grid; grid-template-columns: 1fr; gap:10px;">${optionsHtml}</div>
                <div id="feedback-${qIdx}" class="feedback-msg"></div>
            </div>
        `;
    }).join('');
}

window.addEventListener('mathLessonComplete', () => {
    const completionNav = document.getElementById('completion-nav');
    const btnContainer = document.getElementById('completion-buttons');
    if (!completionNav || !btnContainer) return;

    // 콘페티 + 박지훈 응원 모달
    if (typeof fireConfetti === 'function') fireConfetti();
    setTimeout(showMathLessonCelebration, 1200);

    const lessonIdx = currentUnit.lessons.findIndex(l => l.lesson_id === currentLesson.lesson_id);
    const hasNextLesson = lessonIdx !== -1 && lessonIdx < currentUnit.lessons.length - 1;

    let buttonsHtml = '';
    if (hasNextLesson) {
        buttonsHtml += `<button class="action-btn" style="background:#2563eb;" onclick="handleLessonNavigation('next')">다음 소단원 공부하기 🏃</button>`;
    }
    buttonsHtml += `<button class="action-btn" style="background:#059669; grid-column: ${hasNextLesson ? 'auto' : 'span 2'};" onclick="handleLessonNavigation('home')">학습 완료! 목록으로 🏁</button>`;

    btnContainer.innerHTML = buttonsHtml;
    completionNav.style.display = 'block';
    updateLessonTitle();
    renderLessonNav();
    
    setTimeout(() => {
        completionNav.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
});

function showMathLessonCelebration() {
    let overlay = document.getElementById('math-celebration-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'math-celebration-overlay';
        overlay.className = 'celebration-overlay';
        const imgPath = '../assets/images/pjh.jpeg';
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-text">내 마음속에 저장~ 📸</div>
                <img src="${imgPath}" alt="박지훈" class="celebration-img">
                <div class="celebration-subtext">라희야, 수학도 완벽하게 마스터했어! 진짜 멋지다! 👍</div>
                <button class="btn-close-celebration" onclick="closeMathCelebration()">오빠랑 또 공부하자!</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 50);
}

window.closeMathCelebration = function() {
    const ov = document.getElementById('math-celebration-overlay');
    if (!ov) return;
    ov.classList.remove('show');
    setTimeout(() => { ov.style.display = 'none'; }, 500);
};

function handleLessonNavigation(type) {
    if (type === 'next') {
        const lessonIdx = currentUnit.lessons.findIndex(l => l.lesson_id === currentLesson.lesson_id);
        if (lessonIdx !== -1 && lessonIdx < currentUnit.lessons.length - 1) {
            loadLesson(lessonIdx + 1);
            updateViewerProgress(1);
            document.getElementById('completion-nav').style.display = 'none';
        }
    } else {
        const grade = window.currentGrade || '1';
        location.href = `../?grade=${grade}`;
    }
}
