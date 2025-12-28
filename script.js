let xp = 0;
let level = 1;

// Run on page load
window.onload = function() {
    const savedName = localStorage.getItem('hunterName');
    if (!savedName) {
        document.getElementById('name-modal').classList.remove('hidden');
    } else {
        updateGreeting(savedName);
    }
}

function saveName() {
    const name = document.getElementById('name-input').value;
    if (name) {
        localStorage.setItem('hunterName', name);
        document.getElementById('name-modal').classList.add('hidden');
        updateGreeting(name);
    }
}

function updateGreeting(name) {
    const hour = new Date().getHours();
    let welcome = "";

    if (hour < 12) welcome = "GOOD MORNING";
    else if (hour < 18) welcome = "GOOD AFTERNOON";
    else welcome = "GOOD EVENING";

    document.getElementById('greeting').innerText = `[ SYSTEM: ${welcome} ]`;
    document.getElementById('hunter-display').innerHTML = `HUNTER: <span class="glow-text">${name.toUpperCase()}</span>`;
}

function completeTask(amount) {
    xp += amount;
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();

    if (xp >= 100) {
        xp = 0;
        level++;
        showLevelUp();
    }
    updateUI();
}

function showLevelUp() {
    const notif = document.getElementById('notification');
    notif.classList.remove('hidden');
    setTimeout(() => notif.classList.add('hidden'), 3000);
}

function updateUI() {
    document.getElementById('exp-bar').style.width = xp + "%";
    document.getElementById('level-val').innerText = level;
}
