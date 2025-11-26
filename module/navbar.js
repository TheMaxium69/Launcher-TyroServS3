
// TITLE NAVBAR
document.getElementById("title").innerText = window.NAME_LAUNCHER;

// METTRE EN PETIT L'ONGLET PRINCIPAL
document.querySelector("#minimize").addEventListener("click", () => {
    ipc.send("manualMinimize");
});

// MAXIMIZE DE L'ONGLET PRINCIPAL
if (window.FIRST_WINDOW_RESIZABLE){
    document.getElementById("maximize").style.display = "block";
}
document.querySelector("#maximize").addEventListener("click", () => {
    ipc.send("manualMaximize");
});

// FERMETURE DE L'ONGLET PRINCIPAL
document.querySelector("#close").addEventListener("click", () => {
    ipc.send("manualClose");
});