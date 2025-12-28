let chartInstances = {};
let state = JSON.parse(localStorage.getItem('solo_arise_pro')) || {
    xp: 0, lvl: 1, hp: 100, tasks: [], habits: [],
    activeDays: [], damageDays: [], lastLogin: new Date().toDateString()
};

function save() { 
    localStorage.setItem('solo_arise_pro', JSON.stringify(state)); 
    render(); 
}

function gainXP(amt) {
    state.xp += amt;
    const needed = state.lvl * 100;
    if(state.xp >= needed) { 
        state.xp -= needed; 
        state.lvl++; 
        state.hp = 100; 
        alert("✨ LEVEL UP: HP FULLY RESTORED"); 
    }
    const today = new Date().toDateString();
    if(!state.activeDays.includes(today)) state.activeDays.push(today);
    save();
}

function takeDamage(amt) {
    state.hp = Math.max(0, state.hp - amt);
    state.xp = Math.max(0, state.xp - 5);
    const today = new Date().toDateString();
    if(!state.damageDays.includes(today)) state.damageDays.push(today);
    save();
}

function handleHabit(index, success) {
    const h = state.habits[index];
    const today = new Date().toDateString();
    if(h.lastLogged === today) return; 

    h.lastLogged = today;
    if(success) {
        h.history.push(1);
        state.hp = Math.min(100, state.hp + 10);
        gainXP(20);
    } else {
        h.history.push(-1);
        takeDamage(20);
    }
    if(h.history.length > 7) h.history.shift();
    save();
}

function addT() {
    const val = document.getElementById('tIn').value; 
    if(!val) return;
    state.tasks.push({ text: val, done: false });
    document.getElementById('tIn').value = ''; 
    save();
}

function completeTask(i) {
    if(state.tasks[i].done) return;
    state.tasks[i].done = true;
    state.hp = Math.min(100, state.hp + 5);
    gainXP(15);
}

function addH() {
    const n = document.getElementById('hIn').value;
    const t = document.getElementById('hType').value;
    if(!n) return;
    state.habits.push({ id: Date.now(), name: n, type: t, history: [0], lastLogged: '' });
    document.getElementById('hIn').value = ''; 
    save();
}

function render() {
    const needed = state.lvl * 100;
    const rankDisp = document.getElementById('rankDisplay');
    const lvlDisp = document.getElementById('levelDisplay');
    
    if(rankDisp) rankDisp.innerText = state.lvl >= 10 ? "B-RANK HUNTER" : "E-RANK HUNTER";
    if(lvlDisp) lvlDisp.innerText = "LVL " + state.lvl;
    
    document.getElementById('hpFill').style.width = state.hp + "%";
    document.getElementById('xpFill').style.width = (state.xp / needed) * 100 + "%";
    document.getElementById('hpValue').innerText = `${state.hp} / 100`;
    document.getElementById('xpValue').innerText = `${state.xp} / ${needed}`;

    document.getElementById('tList').innerHTML = state.tasks.map((t, i) => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #1e293b;">
            <span style="${t.done ? 'text-decoration:line-through; opacity:0.3' : ''}">${t.text}</span>
            <button class="btn" onclick="completeTask(${i})">${t.done ? '✓' : 'GO'}</button>
        </div>
    `).join('');

    const hList = document.getElementById('hList'); 
    hList.innerHTML = '';
    state.habits.forEach((h, i) => {
        const today = new Date().toDateString();
        const isLogged = h.lastLogged === today;
        const streak = h.history.filter(x => x === 1).length;
        
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.innerHTML = `
            <div class="habit-header">
                <div><b>${h.type.toUpperCase()}</b> ${h.name} <span class="streak-badge">🔥 ${streak}</span></div>
                <div>
                    ${isLogged ? '<span class="green-text">COMPLETE</span>' : `
                        <button class="btn" onclick="handleHabit(${i}, true)">${h.type==='quit'?"DIDN'T":"DONE"}</button>
                        ${h.type==='quit' ? `<button class="btn btn-red" onclick="handleHabit(${i}, false)">DID</button>` : ''}
                    `}
                </div>
            </div>
            <div class="chart-box"><canvas id="hChart-${h.id}"></canvas></div>
        `;
        hList.appendChild(card);
        const ctx = document.getElementById(`hChart-${h.id}`).getContext('2d');
        if (chartInstances[h.id]) chartInstances[h.id].destroy();
        chartInstances[h.id] = new Chart(ctx, {
            type: 'line',
            data: { labels: h.history.map(()=>''), datasets: [{ data: h.history, borderColor: '#38bdf8', tension: 0.4, pointRadius: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false } } }
        });
    });
}

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

function resetSystem() { 
    if(confirm("ERASE DATA?")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

window.onload = render;
