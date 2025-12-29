let chartInstances = {};
let state = JSON.parse(localStorage.getItem('solo_arise_v3')) || {
    name: "NEW HUNTER",
    xp: 0, lvl: 1, hp: 100, tasks: [], habits: [], 
    sleep: [0,0,0,0,0,0,0],
    activeDays: [], damageDays: [], lastLogin: new Date().toDateString()
};

function save() { localStorage.setItem('solo_arise_v3', JSON.stringify(state)); render(); }

function changeName() {
    let n = prompt("IDENTIFY YOURSELF, HUNTER:", state.name);
    if(n) { state.name = n.toUpperCase(); save(); }
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
            if(!h.history) h.history = [0,0,0,0,0,0,0];
            h.history.push(0); 
            if (h.history.length > 7) h.history.shift(); 
        });
        state.lastLogin = today;
        save();
    }
}

function gainXP(amt) {
    state.xp += amt;
    const needed = state.lvl * 100;
    if(state.xp >= needed) { state.xp -= needed; state.lvl++; state.hp = 100; alert("✨ LEVEL UP!"); }
    const today = new Date().toDateString();
    if(!state.activeDays.includes(today)) state.activeDays.push(today);
}

function takeDamage(amt) {
    state.hp = Math.max(0, state.hp - amt);
    state.xp = Math.max(0, state.xp - Math.floor(amt/2));
    const today = new Date().toDateString();
    if(!state.damageDays.includes(today)) state.damageDays.push(today);
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
    const val = document.getElementById('tIn').value; if(!val) return;
    state.tasks.push({ text: val, done: false }); document.getElementById('tIn').value = ''; save(); 
}

function completeTask(i) { 
    if(state.tasks[i].done) return; 
    state.tasks[i].done = true; gainXP(10); state.hp = Math.min(100, state.hp + 5); save(); 
}

function addH() {
    const n = document.getElementById('hIn').value; const t = document.getElementById('hType').value;
    if(!n) return; state.habits.push({ id: Date.now(), name: n, type: t, history: [0,0,0,0,0,0,0] });
    document.getElementById('hIn').value = ''; save();
}

function addS() { 
    const v = parseFloat(document.getElementById('sIn').value); 
    if(isNaN(v)) return; 
    state.sleep.push(v);
    if(state.sleep.length > 7) state.sleep.shift();
    gainXP(15); 
    document.getElementById('sIn').value = ''; 
    save(); 
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

function render() {
    const needed = state.lvl * 100;
    document.getElementById('hunterName').innerText = `[ ${state.name} ]`;
    document.getElementById('levelDisplay').innerText = "LVL " + state.lvl;
    document.getElementById('rankDisplay').innerText = state.lvl >= 10 ? "B-RANK HUNTER" : "E-RANK HUNTER";
    
    document.getElementById('hpFill').style.width = state.hp + "%";
    document.getElementById('xpFill').style.width = (state.xp / needed) * 100 + "%";
    document.getElementById('hpValue').innerText = `${state.hp} / 100`;
    document.getElementById('xpValue').innerText = `${state.xp} / ${needed}`;

    const sCtx = document.getElementById('sleepChart').getContext('2d');
    if (chartInstances['sleep']) chartInstances['sleep'].destroy();
    chartInstances['sleep'] = new Chart(sCtx, {
        type: 'bar',
        data: { labels: ['M','T','W','T','F','S','S'], datasets: [{ data: state.sleep.slice(-7), backgroundColor: '#38bdf8' }] },
        options: { responsive: true, maintainAspectRatio: false, scales:{y:{display:false}}, plugins: { legend: { display: false } } }
    });

    document.getElementById('tList').innerHTML = state.tasks.map((t, i) => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #1e293b;">
            <span style="${t.done ? 'text-decoration:line-through; opacity:0.3' : ''}">${t.text}</span>
            <button class="btn" onclick="completeTask(${i})">${t.done ? '✓' : 'GO'}</button>
        </div>
    `).join('');

    const hList = document.getElementById('hList'); hList.innerHTML = '';
    state.habits.forEach((h, i) => {
        const isDone = h.history[h.history.length-1] !== 0;
        const card = document.createElement('div');
        card.className = `habit-card ${h.type === 'quit' ? 'habit-quit' : ''}`;
        
        let actionButtons = '';
        if (!isDone) {
            // Both Build and Quit now have two options
            const posText = h.type === 'quit' ? "AVOIDED" : "DONE";
            const negText = h.type === 'quit' ? "FAILED" : "MISSED";
            
            actionButtons = `
                <button class="btn" onclick="handleHabit(${i}, true)">${posText}</button>
                <button class="btn btn-red" style="margin-left:5px" onclick="handleHabit(${i}, false)">${negText}</button>
            `;
        } else {
            const success = h.history[h.history.length-1] === 1;
            actionButtons = success ? '<span class="green-text">✓ SUCCESS</span>' : '<span class="yellow-text">⚠ FAILED</span>';
        }

        card.innerHTML = `
            <div class="habit-header">
                <div><b>${h.type.toUpperCase()}</b> ${h.name} <span class="streak-badge">🔥${getStreak(h.history)}</span></div>
                <div style="display:flex; align-items:center;">${actionButtons}</div>
            </div>
            <div class="chart-box"><canvas id="hChart-${h.id}"></canvas></div>
        `;
        hList.appendChild(card);
        
        const pointColors = h.history.map(val => val === 1 ? '#10b981' : val === -1 ? '#ef4444' : 'transparent');
        const ctx = document.getElementById(`hChart-${h.id}`).getContext('2d');
        if (chartInstances[h.id]) chartInstances[h.id].destroy();
        chartInstances[h.id] = new Chart(ctx, {
            type: 'line',
            data: { 
                labels: ['','','','','','',''], 
                datasets: [{ 
                    data: h.history, 
                    borderColor: h.type === 'quit' ? '#ef4444' : '#10b981', 
                    tension: 0.4, 
                    pointRadius: 4,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: 'transparent'
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                animation: false, 
                scales: { x: { display: false }, y: { display: false, min: -1.5, max: 1.5 } }, 
                plugins: { legend: { display: false } } 
            }
        });
    });
}

function resetSystem() { if(confirm("RESET ALL DATA?")) { localStorage.clear(); location.reload(); } }
window.onload = () => { checkNewDay(); render(); };
