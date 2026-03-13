/**
 * Shared Viewer Logic
 */

let fullData = null;
let currentUnit = null;
let currentLesson = null;
let confettiFired = false;

async function initViewer(grade) {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUnitId = urlParams.get('unit') || '0101';
    
    try {
        const response = await fetch(`../data/math_${grade}/unit_${targetUnitId}.json`);
        const unitData = await response.json();
        fullData = unitData;
        currentUnit = unitData;

        document.getElementById('unit-title').innerText = `${unitData.curriculum} > ${unitData.title}`;
        
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

function renderLessonNav() {
    const nav = document.getElementById('lesson-nav');
    if (!nav) return;
    nav.innerHTML = '';
    currentUnit.lessons.forEach((lesson, idx) => {
        const isDone = isLessonComplete(currentUnit.unit_id, lesson.lesson_id);
        const item = document.createElement('div');
        item.className = 'nav-item' + (idx === 0 ? ' active' : '');
        
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

function loadLesson(index) {
    currentLesson = currentUnit.lessons[index];
    document.getElementById('lesson-title').innerText = currentLesson.title;
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

    const lessonIdx = currentUnit.lessons.findIndex(l => l.lesson_id === currentLesson.lesson_id);
    const hasNextLesson = lessonIdx !== -1 && lessonIdx < currentUnit.lessons.length - 1;

    let buttonsHtml = '';
    if (hasNextLesson) {
        buttonsHtml += `<button class="action-btn" style="background:#2563eb;" onclick="handleLessonNavigation('next')">다음 소단원 공부하기 🏃</button>`;
    }
    buttonsHtml += `<button class="action-btn" style="background:#059669; grid-column: ${hasNextLesson ? 'auto' : 'span 2'};" onclick="handleLessonNavigation('home')">학습 완료! 목록으로 🏁</button>`;

    btnContainer.innerHTML = buttonsHtml;
    completionNav.style.display = 'block';
    renderLessonNav();
    
    setTimeout(() => {
        completionNav.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
});

function handleLessonNavigation(type) {
    if (type === 'next') {
        const lessonIdx = currentUnit.lessons.findIndex(l => l.lesson_id === currentLesson.lesson_id);
        if (lessonIdx !== -1 && lessonIdx < currentUnit.lessons.length - 1) {
            loadLesson(lessonIdx + 1);
            updateViewerProgress(1);
            document.getElementById('completion-nav').style.display = 'none';
        }
    } else {
        location.href = 'index.html';
    }
}
