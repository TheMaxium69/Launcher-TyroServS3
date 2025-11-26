// const { ipcRenderer } = require("electron");
// const ipc=ipcRenderer; // just for shortened name

let title = document.getElementById("title");
title.innerText = window.NAME_LAUNCHER;

let maximizeBTN = document.getElementById("maximize");
if (window.FIRST_WINDOW_RESIZABLE){
    maximizeBTN.style.display = "block";
}

document.querySelector("#minimize").addEventListener("click", () => {
    ipc.send("manualMinimize");
});
document.querySelector("#maximize").addEventListener("click", () => {
    ipc.send("manualMaximize");
});
document.querySelector("#close").addEventListener("click", () => {
    ipc.send("manualClose");
});