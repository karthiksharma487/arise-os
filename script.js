let xp = 0;
let level = 1;

// Set name and greeting immediately
window.onload = function() {
    let name = localStorage.getItem('hunterName') || "SOLO PLAYER";
    document.getElementById('display-name').innerText = name;
    
    let hour = new Date().getHours();
    let greet = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
    document.getElementById('time-greeting').innerText = `[ SYSTEM: ${greet} ]`;
}

function changeName() {
    let newName = prompt("Enter Hunter Name:");
    if(newName) {
        localStorage.setItem('hunterName', newName);
        document.getElementById('display-name').innerText = newName;
    }
}

function addXP(amount) {
    xp += amount;
    if (xp >= 100) {
        xp = 0;
        level++;
        alert("LEVEL UP!");
    }
    document.getElementById('exp-bar').style.width = xp + "%";
    document.getElementById('lvl').innerText = level;
}
