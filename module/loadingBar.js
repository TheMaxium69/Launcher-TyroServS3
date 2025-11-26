document.getElementById('toggleButton').addEventListener('click', function() {

    if (document.getElementById('play').innerText !== "SOON" && document.getElementById('play').innerText !== "EN COURS"){
        var bar = document.querySelector('.bar');
        bar.classList.toggle('show');
        var downpanel = document.getElementById('down-panel');
        downpanel.classList.toggle('up');
        var arrow = document.getElementById('arrow');
        arrow.classList.toggle('ri-arrow-up-s-line');
        arrow.classList.toggle('ri-arrow-down-s-line');
    }

});