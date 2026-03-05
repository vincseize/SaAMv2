/**
 * js/ui-manager.js
 * Gestion des panneaux latéraux et du redimensionnement (Resizers)
 */

function initResizer(resizerId, panelId, side) {
    const resizer = document.getElementById(resizerId);
    const panel = document.getElementById(panelId);
    if (!resizer || !panel) return;

    resizer.addEventListener('mousedown', (e) => {
        document.body.classList.add('resizing-active');
        document.body.style.cursor = 'col-resize';
        panel.classList.remove('closed');

        const resize = (moveEvent) => {
            let w = (side === 'left') ? moveEvent.clientX : window.innerWidth - moveEvent.clientX;
            // Limites de largeur (min 50px, max 600px)
            if (w > 50 && w < 600) {
                panel.style.width = w + 'px';
                const content = panel.querySelector('.panel-content');
                if (content) content.style.width = w + 'px';
            }
        };

        const stop = () => {
            document.body.classList.remove('resizing-active');
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stop);
        };

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stop);
    });
}

function togglePanel(id) {
    const panel = document.getElementById(id);
    if (panel) {
        panel.classList.toggle('closed');
    }
}