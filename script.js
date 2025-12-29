let chartInstances = {};
let state = JSON.parse(localStorage.getItem('solo_arise_v3')) || {
    name: "NEW HUNTER",
    xp: 0, lvl: 1, hp: 100, tasks: [], habits: [],
    sleep: [0,0,0,0,0,0,0],
    activeDays: [], damageDays: [], lastLogin: new Date().toDateString()
};

const dailyQuotes = [
    "Arise.", 
    "The weak have no rights.",
    "Get stronger. Nobody cares.",
    "In a world full of monsters, become the strongest.",
    "Level up in silence.",
    "The System chose you. Now prove it.",
    "Shadows obey only the strong.",
    "One more day. One more level.",
    "The hunt never ends.",
    "Become the Monarch."
];

function getDailyQuote() {
    const day = new Date().getDate();
    return dailyQuotes[day % dailyQuotes.length];
}

function getRank(lvl) {
    if (lvl >= 100) return "NATIONAL LEVEL HUNTER";
    if (lvl >= 50) return "S-RANK HUNTER";
    if (lvl >= 40) return "A-RANK HUNTER";
    if (lvl >= 30) return "B-RANK HUNTER";
    if (lvl >= 20) return "C-RANK HUNTER";
    if (lvl >= 10) return "D-RANK HUNTER";
    return "E-RANK HUNTER";
}

function save() { localStorage.setItem('solo_arise_v3', JSON.stringify(state)); render(); }

function changeName() {
    let n = prompt("IDENTIFY YOURSELF, HUNTER:", state.name);
    if (n && n.trim()) { state.name = n.trim().toUpperCase(); save(); }
}

function getStreak(history) {
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] === 1) streak++; else break;
    }
    return streak;
}

function checkNewDay() {
    const today = new Date().toDateString();
    if (state.lastLogin !== today) {
        state.tasks = [];
        state.habits.forEach(h => {
            if (!h.history) h.history = [0,0,0,0,0,0,0];
            h.history.push(0);
            if (h.history.length > 7) h.history.shift();
        });
        state.lastLogin = today;
        save();
    }
}

function gainXP(amt) {
    const oldLvl = state.lvl;
    state.xp += amt;
    let needed = state.lvl * 100;
    while (state.xp >= needed) {
        state.xp -= needed;
        state.lvl++;
        state.hp = 100;
        needed = state.lvl * 100;
    }
    const today = new Date().toDateString();
    if (!state.activeDays.includes(today)) state.activeDays.push(today);
    if (state.lvl > oldLvl) {
        document.getElementById('newLevelNum').innerText = state.lvl;
        document.getElementById('newRankText').innerText = getRank(state.lvl);
        document.getElementById('levelUpModal').style.display = 'flex';
    }
    save();
}

function closeLevelUp() {
    document.getElementById('levelUpModal').style.display = 'none';
}

function takeDamage(amt) {
    state.hp = Math.max(0, state.hp - amt);
    state.xp = Math.max(0, state.xp - Math.floor(amt / 2));
    const today = new Date().toDateString();
    if (!state.damageDays.includes(today)) state.damageDays.push(today);
}

function handleHabit(index, success) {
    const h = state.habits[index];
    const todayIdx = h.history.length - 1;
    if (success) {
        h.history[todayIdx] = 1;
        gainXP(20);
        state.hp = Math.min(100, state.hp + 10);
    } else {
        h.history[todayIdx] = -1;
        takeDamage(20);
    }
    save();
}

function addT() {
    const val = document.getElementById('tIn').value.trim();
    if (!val) return;
    state.tasks.push({ text: val, done: false });
    document.getElementById('tIn').value = '';
    save();
}

function completeTask(i) {
    if (state.tasks[i].done) return;
    state.tasks[i].done = true;
    gainXP(10);
    state.hp = Math.min(100, state.hp + 5);
    save();
}

function addH() {
    const n = document.getElementById('hIn').value.trim();
    const t = document.getElementById('hType').value;
    if (!n) return;
    state.habits.push({ id: Date.now(), name: n, type: t, history: [0,0,0,0,0,0,0] });
    document.getElementById('hIn').value = '';
    save();
}

function addS() {
    const v = parseFloat(document.getElementById('sIn').value);
    if (isNaN(v) || v < 0) return;
    state.sleep.push(v);
    if (state.sleep.length > 7) state.sleep.shift();
    gainXP(15);
    document.getElementById('sIn').value = '';
    save();
}

function render() {
    const needed = state.lvl * 100;
    document.getElementById('hunterName').innerText = state.name;
    document.getElementById('dailyQuote').innerText = getDailyQuote();
    document.getElementById('levelDisplay').innerText = "LVL " + state.lvl;
    document.getElementById('rankDisplay').innerText = getRank(state.lvl);

    document.getElementById('hpFill').style.width = state.hp + "%";
    document.getElementById('xpFill').style.width = (state.xp / needed * 100) + "%";
    document.getElementById('hpValue').innerText = `${state.hp} / 100`;
    document.getElementById('xpValue').innerText = `${state.xp} / ${needed}`;

    // Sleep Chart
    const sCtx = document.getElementById('sleepChart').getContext('2d');
    if (chartInstances.sleep) chartInstances.sleep.destroy();
    chartInstances.sleep = new Chart(sCtx, {
        type: 'bar',
        data: { labels: ['M','T','W','T','F','S','S'], datasets: [{ data: state.sleep.slice(-7), backgroundColor: '#38bdf8' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false } }, plugins: { legend: { display: false } } }
    });

    // Daily Tasks
    document.getElementById('tList').innerHTML = state.tasks.map((t, i) => `
        <div>
            <span style="${t.done ? 'text-decoration:line-through; opacity:0.4;' : ''}">${t.text}</span>
            <button class="btn system-btn" onclick="completeTask(${i})" ${t.done ? 'disabled' : ''}>
                ${t.done ? 'CLEARED' : 'CLEAR'}
            </button>
        </div>
    `).join('');

    // Habits with mini calendar
    const hList = document.getElementById('hList');
    hList.innerHTML = '';
    const days = ['M','T','W','T','F','S','S'];
    state.habits.forEach((h, i) => {
        const isDone = h.history[h.history.length - 1] !== 0;
        const card = document.createElement('div');
        card.className = `habit-card ${h.type === 'quit' ? 'habit-quit' : ''}`;

        let actionButtons = '';
        if (!isDone) {
            const posText = h.type === 'quit' ? "AVOIDED" : "DONE";
            const negText = h.type === 'quit' ? "FAILED" : "MISSED";
            actionButtons = `
                <button class="btn system-btn" onclick="handleHabit(${i}, true)">${posText}</button>
                <button class="btn system-btn" style="background:#ef4444;" onclick="handleHabit(${i}, false)">${negText}</button>
            `;
        } else {
            actionButtons = h.history[h.history.length - 1] === 1
                ? '<span class="green-text" style="font-weight:bold;">SUCCESS</span>'
                : '<span class="yellow-text" style="font-weight:bold;">FAILED</span>';
        }

        const miniCal = '<div class="mini-calendar">' + h.history.map((val, d) => {
            let cls = 'mini-day';
            if (val === 1) cls += ' mini-success';
            if (val === -1) cls += ' mini-damage';
            return `<div class="${cls}">${days[d]}</div>`;
        }).join('') + '</div>';

        card.innerHTML = `
            <div class="habit-header">
                <div>${h.name.toUpperCase()} <span class="streak-badge">🔥 ${getStreak(h.history)}</span></div>
                <div>${actionButtons}</div>
            </div>
            ${miniCal}
        `;
        hList.appendChild(card);
    });

    // Calendar in sidebar
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dStr = new Date(year, month, i).toDateString();
        let cls = 'cal-day';
        if (state.activeDays.includes(dStr)) cls += ' cal-success';
        if (state.damageDays.includes(dStr)) cls += ' cal-damage';
        grid.innerHTML += `<div class="${cls}">${i}</div>`;
    }
}

function resetSystem() {
    if (confirm("REAWAKEN THE SYSTEM? ALL DATA WILL BE LOST.")) {
        localStorage.removeItem('solo_arise_v3');
        location.reload();
    }
}

window.onload = () => {
    checkNewDay();
    if (state.name === "NEW HUNTER") {
        setTimeout(() => changeName(), 1000);
    }
    render();

    document.getElementById('menuBtn').onclick = () => document.getElementById('sidebar').classList.add('open');
    document.getElementById('closeSidebar').onclick = () => document.getElementById('sidebar').classList.remove('open');
};
