let chartInstances = {};
let state = JSON.parse(localStorage.getItem('solo_arise_v3')) || {
    xp: 0, lvl: 1, hp: 100, tasks: [], habits: [], 
    sleep: [0,0,0,0,0,0,0], totalQuests: 0,
    activeDays: [], damageDays: [], lastLogin: new Date().toDateString()
};

function save() { localStorage.setItem('solo_arise_v3', JSON.stringify(state)); render(); }

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
        state.habits.forEach(h => { h.history.push(0); if (h.history.length > 7) h.history.shift(); });
        state.lastLogin = today;
        save();
    }
}

function gainXP(amt) {
    state.xp += amt;
    const needed = state.lvl * 100;
    if(state.xp >= needed) { state.xp -= needed; state.lvl++; state.hp = 100; alert("LEVEL UP!"); }
    const today = new Date().toDateString();
    if(!state.activeDays.includes(today)) state.activeDays.push(today);
}

function takeDamage(amt) {
    state.hp = Math.max(0, state.hp - amt);
    state.xp = Math.max(0, state.xp - Math.floor(amt/2)); // Lose some XP on failure
    const today = new Date().toDateString();
    if(!state.damageDays.includes(today)) state.damageDays.push(today);
}

function handleHabit(index, success) {
    const h = state.habits[index];
    const todayIdx = h.history.length - 1;
    
    if (success) {
        h.history[todayIdx] = 1;
        gainXP(20);
        state.hp = Math.min(100, state.hp + 10); // HEAL 10
    } else {
        h.history[todayIdx] = -1; // -1 marks failure in graph
        takeDamage(20); // DAMAGE 20
    }
    save();
}

// REST OF ACTIONS
function addT() { 
    const val = document.getElementById('tIn').value; if(!val) return;
    state.tasks.push({ text: val, done: false }); document.getElementById('tIn').value = ''; save(); 
}
function completeTask(i) { if(state.tasks[i].done) return; state.tasks[i].done = true; gainXP(10); state.hp = Math.min(100, state.hp + 5); save(); }
function addH() {
    const n = document.getElementById('hIn').value; const t = document.getElementById('hType').value;
    if(!n) return; state.habits.push({ id: Date.now(), name: n, type: t, history: [0,0,0,0,0,0,0] });
    document.getElementById('hIn').value = ''; save();
}
function addS() { const v = parseFloat(document.getElementById('sIn').value); if(!v) return; state.sleep[6] = v; gainXP(15); save(); }

function toggleModal(show) {
    document.getElementById('historyModal').style.display = show ? 'flex' : 'none';
    if(show) {
        const grid = document.getElementById('calendarGrid'); grid.innerHTML = '';
        const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        for(let i=1; i<=days; i++) {
            const dStr = new Date(new Date().getFullYear(), new Date().getMonth(), i).toDateString();
            let cls = 'cal-day';
            if(state.activeDays.includes(dStr)) cls += ' cal-success';
            if(state.damageDays.includes(dStr)) cls += ' cal-damage';
            grid.innerHTML += `<div class="${cls}">${i}</div>`;
        }
    }
}

function render() {
    const needed = state.lvl * 100;
    document.getElementById('rankDisplay').innerText = state.lvl >= 10 ? "B-RANK HUNTER" : "E-RANK HUNTER";
    document.getElementById('levelDisplay').innerText = "LVL " + state.lvl;
    document.getElementById('hpFill').style.width = state.hp + "%";
    document.getElementById('xpFill').style.width = (state.xp / needed) * 100 + "%";
    document.getElementById('hpValue').innerText = `${state.hp} / 100`;
    document.getElementById('xpValue').innerText = `${state.xp} / ${needed}`;

    document.getElementById('tList').innerHTML = state.tasks.map((t, i) => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #1e293b;">
            <span style="${t.done ? 'text-decoration:line-through; opacity:0.3' : ''}">${t.text}</span>
            <button class="btn" style="padding:2px 8px" onclick="completeTask(${i})">${t.done ? '✓' : 'GO'}</button>
        </div>
    `).join('');

    const hList = document.getElementById('hList'); hList.innerHTML = '';
    state.habits.forEach((h, i) => {
        const isDone = h.history[h.history.length-1] !== 0;
        const card = document.createElement('div');
        card.className = `habit-card ${h.type === 'quit' ? 'habit-quit' : ''}`;
        
        let buttons = `<button class="btn" onclick="handleHabit(${i}, true)">${h.type==='quit'?"DIDN'T":"DONE"}</button>`;
        if(h.type === 'quit') {
            buttons += `<button class="btn btn-red" style="margin-left:5px" onclick="handleHabit(${i}, false)">DID</button>`;
        }

        card.innerHTML = `
            <div class="habit-header">
                <div><b>${h.type.toUpperCase()}</b> ${h.name} <span class="streak-badge">🔥${getStreak(h.history)}</span></div>
                <div style="display:flex;">${isDone ? '<span class="green-text">LOGGED</span>' : buttons}</div>
            </div>
            <div class="chart-box"><canvas id="hChart-${h.id}"></canvas></div>
        `;
        hList.appendChild(card);
        const ctx = document.getElementById(`hChart-${h.id}`).getContext('2d');
        if (chartInstances[h.id]) chartInstances[h.id].destroy();
        chartInstances[h.id] = new Chart(ctx, {
            type: 'line',
            data: { labels: ['','','','','','',''], datasets: [{ data: h.history, borderColor: '#10b981', tension: 0.4, pointRadius: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false } } }
        });
    });
}

function resetSystem() { if(confirm("RESET?")) { localStorage.clear(); location.reload(); } }
window.onload = () => { checkNewDay(); render(); };
