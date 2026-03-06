/** --- GESTION DU MENU CONTEXTUEL & BLENDER --- **/
function initBlenderLauncher() {
    const contextMenu = document.getElementById('customContextMenu');
    const btnOpen = document.getElementById('openBlenderFolder');

    // 1. Affichage du menu sur clic droit sur le NOM uniquement
    document.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('asset-name-link')) {
            e.preventDefault();
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
        } else {
            if (contextMenu) contextMenu.style.display = 'none';
        }
    });

    // 2. Fermeture au clic gauche ailleurs
    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.style.display = 'none';
    });

    // 3. Action de lancement
    if (btnOpen) {
        btnOpen.innerHTML = "🚀 Lancer Blender";
        btnOpen.addEventListener('click', () => {
            console.log("Tentative de lancement Blender...");
            fetch('ajax_launch_blender.php')
                .then(r => r.json())
                .then(data => {
                    if (!data.success) alert("Erreur PHP : " + data.error);
                })
                .catch(err => alert("Erreur serveur : " + err));
            contextMenu.style.display = 'none';
        });
    }
}