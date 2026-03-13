/**
 * Shared Calendar UI Module
 */

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function openCalendar(date) {
    if (date) {
        calYear = date.getFullYear();
        calMonth = date.getMonth();
    }
    const overlay = document.getElementById('cal-overlay');
    const panel = document.getElementById('cal-panel');
    if (overlay) overlay.classList.add('open');
    if (panel) panel.classList.add('open');
    renderCalendar();
}

function closeCalendar() {
    const overlay = document.getElementById('cal-overlay');
    const panel = document.getElementById('cal-panel');
    if (overlay) overlay.classList.remove('open');
    if (panel) panel.classList.remove('open');
}

function changeMonth(dir) {
    calMonth += dir;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
}

async function renderCalendar() {
    const label = document.getElementById('cal-month-label');
    const body = document.getElementById('cal-body');
    if (!label || !body) return;

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    label.textContent = `${calYear}년 ${monthNames[calMonth]}`;

    body.innerHTML = '<div class="cal-loading"><i class="fas fa-spinner fa-spin"></i> 불러오는 중...</div>';

    const activities = await getActivitiesGroupedByDay(calYear, calMonth);
    const today = new Date();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    let html = '';
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(calYear, calMonth, d);
        const dayName = dayNames[dayDate.getDay()];
        const acts = activities[d] || [];
        const isToday = today.getDate() === d && today.getMonth() === calMonth && today.getFullYear() === calYear;

        html += `
            <div class="cal-day-row ${acts.length ? 'has-activity' : ''} ${isToday ? 'today' : ''}">
                <div class="cal-date-label">${calMonth + 1}/${d} (${dayName})${isToday ? ' ★ 오늘' : ''}</div>
                ${acts.length ? acts.map(a => `
                    <div class="cal-lesson-item"><i class="fas fa-book-open"></i><span>${a.title}</span></div>
                `).join('') : '<div class="cal-empty">공부 기록 없음</div>'}
            </div>
        `;
    }
    body.innerHTML = html;
}

async function getActivitiesGroupedByDay(year, month) {
    const activities = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith('math_tutor_') && !key.startsWith('rahee_eng_')) continue;
        
        const dateStr = localStorage.getItem(key);
        const date = new Date(dateStr);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const day = date.getDate();
            if (!activities[day]) activities[day] = [];
            
            let title = "학습 완료";
            if (key.includes('unit')) {
                const match = key.match(/unit(\d+)_lesson([\w-]+)/);
                if (match) title = `${match[1]}단원 (${match[2]})`;
            }
            activities[day].push({ title, key });
        }
    }
    return activities;
}
