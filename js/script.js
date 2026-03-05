/**
 * js/script.js - SaAMv2
 * Version : 4.1 - Fix Context Menu & Blender Launcher
 */

let currentPage = 1;
const itemsPerPage = 36; 
let filteredAssets = [];
let allAssets = []; 

// Projets et sélection initiale
const projects = ["Projet A", "Projet B", "Projet C"];
let selectedProject = projects[Math.floor(Math.random() * projects.length)];
let lastClickedAssetName = null; 

// Privilèges
const HAS_DELETE_PRIVILEGES = (typeof USER_ROLE !== 'undefined' && (USER_ROLE === 'root' || USER_ROLE === 'admin'));
const CAN_EDIT_STATUS = (typeof USER_ROLE !== 'undefined' && USER_ROLE !== 'user');

// Statuts (depuis index.php ou fallback)
const STATUS_CONFIG = window.APP_STATUS_LIST || [
    { "code": "hld", "label": "On Hold", "color": "#dc3545" },
    { "code": "wip", "label": "In Progress", "color": "#ffc107" },
    { "code": "rev", "label": "Review", "color": "#0d6efd" },
    { "code": "fin", "label": "Final", "color": "#198754" }
];

const assetGrid = document.getElementById('assetGrid');
const searchInput = document.getElementById('searchInput');
const assetCountEl = document.getElementById('assetCount');
const contextMenu = document.getElementById('customContextMenu');

/** --- INITIALISATION --- **/
document.addEventListener('DOMContentLoaded', () => {
    refreshAssetList();
    initProjectManagement();
    initFilters();
    initGridEvents();
    initBlenderLauncher(); // Initialise les événements du menu contextuel
    autoCheckFilters();
    updateDisplay();

    // Loader
    setTimeout(() => {
        const loader = document.getElementById('loader-wrapper');
        if (loader) loader.classList.add('fade-out');
    }, 500);
});

function refreshAssetList() {
    allAssets = Array.from(document.querySelectorAll('.asset-item:not(.js-no-filter)'));
}

/** --- PROJETS --- **/
function initProjectManagement() {
    const projectDisplay = document.getElementById('currentProjectDisplay');
    if (projectDisplay) projectDisplay.innerText = selectedProject;

    document.querySelectorAll('.project-select').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            selectedProject = item.getAttribute('data-project');
            if (projectDisplay) projectDisplay.innerText = selectedProject;
        });
    });
}

/** --- FILTRES & AFFICHAGE --- **/
function initFilters() {
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-chk') || e.target.classList.contains('dept-chk')) {
            currentPage = 1; 
            updateDisplay();
        }
    });

    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => { 
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentPage = 1; 
                updateDisplay(); 
            }, 200);
        });
    }

    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            allAssets.sort((a, b) => a.getAttribute('data-name').localeCompare(b.getAttribute('data-name')));
            updateDisplay();
        });
    }
}

function autoCheckFilters() {
    const statusChks = document.querySelectorAll('.status-chk');
    const deptChks = document.querySelectorAll('.dept-chk');
    if (statusChks.length > 0 && Array.from(statusChks).every(c => !c.checked)) {
        statusChks.forEach(c => c.checked = true);
    }
    if (deptChks.length > 0 && Array.from(deptChks).every(c => !c.checked)) {
        deptChks.forEach(c => c.checked = true);
    }
}

function updateDisplay() {
    const term = searchInput ? searchInput.value.toLowerCase() : "";
    const checkedStatus = Array.from(document.querySelectorAll('.status-chk:checked')).map(c => c.value);
    const checkedDepts = Array.from(document.querySelectorAll('.dept-chk:checked')).map(c => c.value);
    const addBtnCard = document.querySelector('.js-no-filter');

    filteredAssets = allAssets.filter(item => {
        const name = (item.getAttribute('data-name') || "").toLowerCase();
        const statusCode = item.getAttribute('data-status-code');
        const deptCode = item.getAttribute('data-dept-code');
        return name.includes(term) && 
               (checkedStatus.length === 0 || checkedStatus.includes(statusCode)) &&
               (checkedDepts.length === 0 || checkedDepts.includes(deptCode));
    });

    if (assetCountEl) assetCountEl.innerText = filteredAssets.length;

    allAssets.forEach(el => el.style.display = 'none');
    if (addBtnCard) addBtnCard.style.display = (currentPage === 1) ? 'block' : 'none';
    
    const limit = (currentPage === 1 && addBtnCard) ? itemsPerPage - 1 : itemsPerPage;
    const start = (currentPage === 1) ? 0 : (currentPage - 1) * itemsPerPage;

    filteredAssets.slice(start, start + limit).forEach(el => {
        el.style.display = 'block';
        const name = el.getAttribute('data-name');
        const card = el.querySelector('.card');

        if (card) {
            if (name === lastClickedAssetName) {
                card.style.outline = "2px solid white";
                card.style.outlineOffset = "-2px";
            } else {
                card.style.outline = "none";
            }
        }
    });

    if (typeof updateChart === 'function') updateChart(filteredAssets);
    renderPagination();
}

/** --- PAGINATION --- **/
function renderPagination() {
    const container = document.getElementById('pagination-top');
    if (!container) return;
    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
    container.innerHTML = ''; 
    if (totalPages <= 1) return;

    container.appendChild(createPageBtn('<', currentPage > 1, () => { currentPage--; updateDisplay(); }));
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            container.appendChild(createPageBtn(i, true, () => { currentPage = i; updateDisplay(); }, i === currentPage));
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const dots = document.createElement('span');
            dots.innerText = '...';
            dots.className = 'text-muted px-1 small align-self-end';
            container.appendChild(dots);
        }
    }
    container.appendChild(createPageBtn('>', currentPage < totalPages, () => { currentPage++; updateDisplay(); }));
}

function createPageBtn(text, enabled, callback, isActive = false) {
    const btn = document.createElement('button');
    btn.className = `btn btn-xs ${isActive ? 'btn-info text-dark' : 'btn-outline-secondary text-muted'}`;
    btn.innerText = text;
    btn.disabled = !enabled;
    if (enabled) {
        btn.onclick = (e) => {
            e.preventDefault();
            callback();
            const scrollArea = document.querySelector('.assets-scroll-area');
            if (scrollArea) scrollArea.scrollTop = 0;
        };
    }
    return btn;
}

/** --- ACTIONS ASSETS (STATUT, DELETE, ADD) --- **/
function openStatusModal(assetName) {
    const assetItem = document.querySelector(`.asset-item[data-name="${assetName}"]`);
    const statusArea = assetItem?.querySelector('.card-status-area');
    if (!statusArea || statusArea.querySelector('select')) return;

    const currentStatus = assetItem.getAttribute('data-status-code');
    const originalHTML = statusArea.innerHTML;

    let selectHTML = `<select class="form-select form-select-sm" style="font-size:0.65rem; padding:0; height:18px; width:100%;">`;
    STATUS_CONFIG.forEach(opt => {
        selectHTML += `<option value="${opt.code}" ${opt.code === currentStatus ? 'selected' : ''}>${opt.label}</option>`;
    });
    selectHTML += `</select>`;

    statusArea.innerHTML = selectHTML;
    const select = statusArea.querySelector('select');
    setTimeout(() => select?.focus(), 10);

    select.onchange = () => {
        const selectedOpt = STATUS_CONFIG.find(o => o.code === select.value);
        assetItem.setAttribute('data-status-code', select.value);
        statusArea.innerHTML = `<span class="badge w-100" style="background-color: ${selectedOpt.color}; font-size: 0.65rem;">${selectedOpt.label}</span>`;
    };

    select.onblur = () => setTimeout(() => { if (statusArea.querySelector('select')) statusArea.innerHTML = originalHTML; }, 150);
}

function deleteAsset(assetName) {
    if (!HAS_DELETE_PRIVILEGES) return;
    if (confirm(`⚠️ Supprimer "${assetName}" ?`)) {
        document.querySelector(`.asset-item[data-name="${assetName}"]`)?.remove();
        refreshAssetList();
        updateDisplay();
    }
}

function confirmAddAsset(event) {
    if (event) event.preventDefault();
    const nameInput = document.getElementById('newAssetName');
    const deptInput = document.getElementById('newAssetDept');
    const name = nameInput?.value.trim();

    if (!name) return alert("Nom requis.");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('dept', deptInput.value);
    formData.append('project', selectedProject);

    fetch('ajax_add_asset.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => data.success ? location.reload() : alert(data.error));
}

/** --- EVENTS GRILLE & CLIC DROIT --- **/
function initGridEvents() {
    if (!assetGrid) return;

    assetGrid.addEventListener('click', (e) => {
        const assetItem = e.target.closest('.asset-item');
        if (!assetItem) return;

        const name = assetItem.getAttribute('data-name');
        lastClickedAssetName = name;
        updateDisplay(); 

        if (e.target.closest('.btn-delete-asset')) {
            e.stopPropagation();
            deleteAsset(name);
        } else if (e.target.classList.contains('card-img-top')) {
            if (typeof openAssetDetails === 'function') openAssetDetails(name);
        } else if (e.target.closest('.card-status-area') && CAN_EDIT_STATUS) {
            openStatusModal(name);
        }
    });
}

/** --- BLENDER LAUNCHER & CONTEXT MENU --- **/
function initBlenderLauncher() {
    const btnLaunch = document.getElementById('openBlenderFolder');

    // 1. Affichage du menu sur clic droit
    document.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('asset-name-link')) {
            e.preventDefault();
            if (contextMenu) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;
            }
        } else {
            if (contextMenu) contextMenu.style.display = 'none';
        }
    });

    // 2. Action du bouton "Lancer Blender"
    if (btnLaunch) {
        btnLaunch.innerHTML = "🚀 Lancer Blender.exe";
        btnLaunch.addEventListener('click', () => {
            fetch('ajax_launch_blender.php')
                .then(r => r.json())
                .then(data => {
                    if (!data.success) alert("Erreur : " + data.error);
                })
                .catch(err => alert("Erreur serveur : " + err));
            if (contextMenu) contextMenu.style.display = 'none';
        });
    }

    // 3. Fermer le menu sur clic gauche
    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.style.display = 'none';
    });
}