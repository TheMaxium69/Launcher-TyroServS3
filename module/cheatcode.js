var konamiCode = "↑↑↓↓←→←→BA";
var cmd = null

document.addEventListener('keyup', function (e) {

    if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 65 || e.keyCode == 66) {
        cheatcode("key" + e.keyCode + "|");
    } else {
        cmd = null;
    }

});


function cheatcode(arg) {

    if(arg == "key38|"){
        if(cmd == null){
            cmd = "↑";
        } else if (cmd == "↑"){
            cmd = cmd + "↑";
        } else {
            cmd = null;
        }
    }

    if(arg == "key40|"){
        if(cmd == "↑↑"){
            cmd = "↑↑↓";
        } else if (cmd == "↑↑↓"){
            cmd = cmd + "↓";
        } else {
            cmd = null;
        }
    }

    if(arg == "key37|"){
        if(cmd == "↑↑↓↓"){
            cmd = "↑↑↓↓←";
        } else if (cmd == "↑↑↓↓←→"){
            cmd = cmd + "←";
        } else {
            cmd = null;
        }
    }

    if(arg == "key39|"){
        if(cmd == "↑↑↓↓←"){
            cmd = "↑↑↓↓←→";
        } else if (cmd == "↑↑↓↓←→←"){
            cmd = cmd + "→";
        } else {
            cmd = null;
        }
    }

    if(arg == "key66|"){
        if(cmd == "↑↑↓↓←→←→"){
            cmd = "↑↑↓↓←→←→B";
        } else {
            cmd = null;
        }
    }

    if(arg == "key65|"){
        if(cmd == "↑↑↓↓←→←→B"){
            cmd = "↑↑↓↓←→←→BA";
        } else {
            cmd = null;
        }
    }

    if(cmd){
        console.log(cmd);
    }

    let retro;
    if(arg == "konamicode" || cmd == konamiCode){
        cmd = null;
        retro = 0;
        // retro = getRandomInt(3)

        BackgroundFaction = "url('../asset/back/Retro "+(retro+1)+" (1920x1080).png')"
        if (hereServer === "faction") {
            let bodyPanelCheatCode = document.getElementById("panel");
            bodyPanelCheatCode.style.backgroundImage = BackgroundFaction;
        }

        alert("Mode Retro Activé !");



    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}