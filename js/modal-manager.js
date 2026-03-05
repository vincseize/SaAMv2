/**
 * js/modal-manager.js
 * Gestion de la Lightbox et interface avec le script principal
 */
let assetModal;

// Initialisation automatique au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('assetModal');
    if (modalEl) assetModal = new bootstrap.Modal(modalEl);
});

/**
 * Fonction appelée par initGridEvents() dans script.js
 */
function openAssetDetails(assetName) {
    const item = document.querySelector(`.asset-item[data-name="${assetName}"]`);
    if (!item) return;

    const data = {
        name: assetName,
        img: item.querySelector('.card-img-top').src,
        version: item.querySelector('.asset-version-badge')?.innerText || 'v01',
        status: item.getAttribute('data-status-code'),
        dept: item.getAttribute('data-dept-code'),
        statusColor: item.querySelector('.card-status-area')?.style.backgroundColor || '#666'
    };

    // 1. Mettre à jour et afficher la modale (Lightbox)
    const fullStatus = getFullStatus(data.status);
    const fullDept = getFullDept(data.dept);
    updatePreviewModal(data, fullStatus, fullDept);

    // 2. Mettre à jour le contenu du panneau latéral sans l'ouvrir
    if (typeof showAssetDetails === 'function') {
        // On appelle showAssetDetails pour charger les infos et le chat
        // mais on a SUPPRIMÉ le togglePanel() qui forçait l'ouverture
        showAssetDetails(data, getFullDept, getFullStatus);
    }
}

/**
 * Met à jour le contenu HTML de la modale
 */
function updatePreviewModal(data, fullStatus, fullDept) {
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');

    if (modalImg) modalImg.src = data.img;
    if (modalTitle) modalTitle.innerText = data.name;
    if (modalMeta) {
        modalMeta.innerHTML = `
            <span class="fw-bold" style="color:${data.statusColor}">${fullStatus.toUpperCase()}</span> | 
            <span class="text-white-50">Dept:</span> <b class="text-white">${fullDept}</b> | <b class="text-info">${data.version}</b>`;
    }
    
    if (assetModal) assetModal.show();
}