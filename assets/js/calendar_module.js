/**
 * Shared Calendar UI Module - 주간 뷰
 */

// 표시할 주의 월요일 (0시 0분)
let calWeekStart = getMondayOfWeek(new Date());

function getMondayOfWeek(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;  // 일요일=0 → 월요일로
    date.setDate(date.getDate() + diff);
    return date;
}

function openCalendar(date) {
    if (date) {
        calWeekStart = getMondayOfWeek(date);
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
    calWeekStart.setDate(calWeekStart.getDate() + dir * 7);
    renderCalendar();
}

async function renderCalendar() {
    const label = document.getElementById('cal-month-label');
    const body = document.getElementById('cal-body');
    if (!label || !body) return;

    const mon = calWeekStart;
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    label.textContent = `${mon.getMonth() + 1}/${mon.getDate()} ~ ${sun.getMonth() + 1}/${sun.getDate()} (${monthNames[mon.getMonth()]})`;

    body.innerHTML = '<div class="cal-loading"><i class="fas fa-spinner fa-spin"></i> 불러오는 중...</div>';

    const activities = await getActivitiesForWeek(calWeekStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    let html = '';

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(calWeekStart);
        dayDate.setDate(dayDate.getDate() + i);
        const dayName = dayNames[dayDate.getDay()];
        const dateKey = dayDate.toISOString().split('T')[0];
        const acts = activities[dateKey] || [];
        const isToday = dayDate.getTime() === today.getTime();

        html += `
            <div class="cal-day-row ${acts.length ? 'has-activity' : ''} ${isToday ? 'today' : ''}">
                <div class="cal-date-label">${dayDate.getMonth() + 1}/${dayDate.getDate()} (${dayName})${isToday ? ' ★ 오늘' : ''}</div>
                ${acts.length ? acts.map(a => `
                    <div class="cal-lesson-item"><i class="fas fa-book-open"></i><span>${a.title}</span></div>
                `).join('') : '<div class="cal-empty">공부 기록 없음</div>'}
            </div>
        `;
    }
    body.innerHTML = html;
}

function addActivityForWeek(activities, weekStart, key, val) {
    const date = new Date(val);
    if (isNaN(date.getTime())) return;
    const mon = new Date(weekStart);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    if (date < mon || date > sun) return;

    const dateKey = date.toISOString().split('T')[0];
    if (!activities[dateKey]) activities[dateKey] = [];
    let title = "학습 완료";
    if (key.includes('math_drill_')) {
        const m = key.match(/math_drill_g(\d)_s(\d+)/);
        title = m ? `연산 중${m[1]} SET${m[2]}` : "연산 연습";
    } else if (key.includes('unit')) {
        const match = key.match(/unit(\d+)_lesson([\w-]+)/);
        if (match) title = `수학 ${match[1]}단원`;
    } else if (key.startsWith('rahee_eng_')) {
        title = "영어 학습";
    }
    activities[dateKey].push({ title, key });
}

async function getActivitiesForWeek(weekStart) {
    const activities = {};

    const rows = await pullProgress();
    rows.forEach(row => {
        if (row.storage_key && row.storage_key.startsWith('math_tutor_') && row.completed_at) {
            addActivityForWeek(activities, weekStart, row.storage_key, row.completed_at);
        }
    });

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith('rahee_eng_') && !key.startsWith('math_drill_')) continue;
        const val = localStorage.getItem(key);
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) || (parsed && parsed.word_ids)) continue;
        } catch (_) {}
        addActivityForWeek(activities, weekStart, key, val);
    }
    return activities;
}
