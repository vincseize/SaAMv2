/**
 * js/script.js - SaAMv2
 * Version : 4.0 - Statuts Dynamiques (Récupérés du Settings)
 */

let currentPage = 1;
const itemsPerPage = 36; 
let filteredAssets = [];
let allAssets = []; 
// Définition des projets possibles
const projects = ["Projet A", "Projet B", "Projet C"];
// Sélection aléatoire d'un index entre 0 et 2
let selectedProject = projects[Math.floor(Math.random() * projects.length)];
let lastClickedAssetName = null; // Mémorise le nom de l'asset sélectionné

// Privilèges
const HAS_DELETE_PRIVILEGES = (typeof USER_ROLE !== 'undefined' && (USER_ROLE === 'root' || USER_ROLE === 'admin'));
const CAN_EDIT_STATUS = (typeof USER_ROLE !== 'undefined' && USER_ROLE !== 'user');

// Récupération des statuts du settings.json (injectés dans index.php)
// Fallback sur votre liste si APP_STATUS_LIST n'est pas défini
const STATUS_CONFIG = window.APP_STATUS_LIST || [
    { "code": "hld", "label": "On Hold", "color": "#dc3545" },
    { "code": "wip", "label": "In Progress", "color": "#ffc107" },
    { "code": "rev", "label": "Review", "color": "#0d6efd" },
    { "code": "fin", "label": "Final", "color": "#198754" }
];

const assetGrid = document.getElementById('assetGrid');
const searchInput = document.getElementById('searchInput');
const assetCountEl = document.getElementById('assetCount');

document.addEventListener('DOMContentLoaded', () => {
    refreshAssetList();
    initProjectManagement();
    initFilters();
    initGridEvents();
    autoCheckFilters();
    updateDisplay();

    setTimeout(() => {
        const loader = document.getElementById('loader-wrapper');
        if (loader) loader.classList.add('fade-out');
    }, 500);
});

function refreshAssetList() {
    allAssets = Array.from(document.querySelectorAll('.asset-item:not(.js-no-filter)'));
}

function initProjectManagement() {
    const projectDisplay = document.getElementById('currentProjectDisplay');
    
    // 1. Appliquer la valeur aléatoire initiale à l'affichage HTML
    if (projectDisplay) {
        projectDisplay.innerText = selectedProject;
    }

    // 2. Gérer le changement de projet via le menu
    document.querySelectorAll('.project-select').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Récupère le nom depuis l'attribut data-project
            selectedProject = item.getAttribute('data-project');
            
            // Met à jour le texte dans le dropdown
            if (projectDisplay) {
                projectDisplay.innerText = selectedProject;
            }
            
            console.log("Projet sélectionné :", selectedProject);
            // Optionnel : refreshAssetList() ou updateDisplay() si le projet filtre les données
        });
    });
}

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

    // 1. Filtrage des assets
    filteredAssets = allAssets.filter(item => {
        const name = (item.getAttribute('data-name') || "").toLowerCase();
        const statusCode = item.getAttribute('data-status-code');
        const deptCode = item.getAttribute('data-dept-code');

        const matchesName = name.includes(term);
        const matchesStatus = checkedStatus.length === 0 || checkedStatus.includes(statusCode);
        const matchesDept = checkedDepts.length === 0 || checkedDepts.includes(deptCode);

        return matchesName && matchesStatus && matchesDept;
    });

    // Mise à jour du compteur
    if (assetCountEl) assetCountEl.innerText = filteredAssets.length;

    // 2. Réinitialisation de l'affichage
    allAssets.forEach(el => el.style.display = 'none');
    if (addBtnCard) addBtnCard.style.display = 'none';
    
    // Affichage du bouton "Ajouter" en première position sur la page 1
    if (currentPage === 1 && addBtnCard) {
        addBtnCard.style.display = 'block';
        assetGrid.prepend(addBtnCard); 
    }

    // 3. Calcul de la pagination
    const limit = (currentPage === 1 && addBtnCard) ? itemsPerPage - 1 : itemsPerPage;
    const start = (currentPage === 1) ? 0 : (currentPage - 1) * itemsPerPage;

    // 4. Affichage des assets filtrés pour la page courante
    filteredAssets.slice(start, start + limit).forEach(el => {
        el.style.display = 'block';
        const name = el.getAttribute('data-name');
        const card = el.querySelector('.card');

        // --- LOGIQUE DE SÉLECTION (Bordure blanche) ---
        if (card) {
            if (name === lastClickedAssetName) {
                card.style.outline = "2px solid white";
                card.style.outlineOffset = "-2px"; // Bordure vers l'intérieur
                card.style.boxShadow = "0 0 15px rgba(255,255,255,0.2)"; // Optionnel : lueur légère
            } else {
                card.style.outline = "none";
                card.style.boxShadow = "";
            }
        }

        // Gestion du bouton de suppression (Privilèges)
        const badgeContainer = el.querySelector('.position-absolute.top-0.end-0');
        if (HAS_DELETE_PRIVILEGES && badgeContainer && !badgeContainer.querySelector('.btn-delete-asset')) {
            const delBtn = document.createElement('span');
            delBtn.className = "badge bg-danger shadow-sm ms-1 btn-delete-asset";
            delBtn.style.cursor = "pointer";
            delBtn.innerHTML = '<i class="bi bi-x-lg" style="font-size: 0.6rem;"></i>';
            badgeContainer.appendChild(delBtn);
        }
    });

    // 5. Mise à jour du graphique (si chart-manager.js est présent)
    if (typeof updateChart === 'function') {
        updateChart(filteredAssets);
    }

    renderPagination();
}

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

/** --- GESTION DU STATUT (DYNAMIQUE) --- **/
function openStatusModal(assetName) {
    const assetItem = document.querySelector(`.asset-item[data-name="${assetName}"]`);
    if (!assetItem) return;

    const currentStatus = assetItem.getAttribute('data-status-code');
    const statusArea = assetItem.querySelector('.card-status-area');
    if (!statusArea || statusArea.querySelector('select')) return;

    const originalHTML = statusArea.innerHTML;

    // Création du select basé sur STATUS_CONFIG (issu du JSON)
    let selectHTML = `<select class="form-select form-select-sm" style="font-size:0.65rem; padding:0; height:18px; width:100%; border-radius:2px;">`;
    STATUS_CONFIG.forEach(opt => {
        selectHTML += `<option value="${opt.code}" ${opt.code === currentStatus ? 'selected' : ''}>${opt.label}</option>`;
    });
    selectHTML += `</select>`;

    statusArea.innerHTML = selectHTML;
    const select = statusArea.querySelector('select');
    setTimeout(() => { if(select) select.focus(); }, 10);

    const closeEditor = () => {
        if (statusArea && statusArea.contains(select)) {
            statusArea.innerHTML = originalHTML;
        }
    };

    select.onchange = () => {
        const val = select.value;
        const selectedOpt = STATUS_CONFIG.find(o => o.code === val);
        
        // Mise à jour de l'attribut pour le filtrage JS
        assetItem.setAttribute('data-status-code', val);

        // Affichage du LABEL complet (ex: "In Progress") et non le code ("wip")
        const textColor = (val === 'wip' || selectedOpt.color === '#ffc107') ? 'text-dark' : '';
        statusArea.innerHTML = `<span class="badge w-100 ${textColor}" style="background-color: ${selectedOpt.color}; font-size: 0.65rem; padding: 2px 4px;">${selectedOpt.label}</span>`;
    };

    select.onblur = () => {
        setTimeout(() => {
            if (statusArea.querySelector('select')) closeEditor();
        }, 150);
    };
}

/** --- SUPPRESSION --- **/
function deleteAsset(assetName) {
    if (!HAS_DELETE_PRIVILEGES) return;
    if (confirm(`⚠️ Supprimer "${assetName}" ?`)) {
        const el = document.querySelector(`.asset-item[data-name="${assetName}"]`);
        if (el) el.remove();
        refreshAssetList();
        updateDisplay();
    }
}

/** --- AJOUT --- **/
function confirmAddAsset(event) {
    if (event) event.preventDefault();

    // On cible les IDs EXACTS de votre formulaire HTML
    const nameInput = document.getElementById('newAssetName');
    const deptInput = document.getElementById('newAssetDept');
    
    // Récupération des valeurs
    const assetName = (nameInput && nameInput.value.trim() !== "") ? nameInput.value : "";
    const assetDept = deptInput ? deptInput.value : "PRE";

    if (assetName === "") {
        alert("Veuillez saisir un nom d'asset.");
        return;
    }

    const formData = new FormData();
    formData.append('name', assetName);
    formData.append('dept', assetDept);
    formData.append('project', selectedProject); // Utilise la variable random du haut du script

    fetch('ajax_add_asset.php', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            console.log("Succès :", data.asset);
            location.reload(); // Recharge pour voir l'asset dans la grille
        } else {
            alert("Erreur : " + data.error);
        }
    })
    .catch(err => console.error("Erreur Fetch :", err));
}

/** --- EVENTS --- **/
function initGridEvents() {
    if (!assetGrid) return;

    assetGrid.addEventListener('click', (e) => {
        // On récupère l'élément parent .asset-item qui contient la data
        const assetItem = e.target.closest('.asset-item');
        if (!assetItem) return;

        const name = assetItem.getAttribute('data-name');

        // 1. Mémorisation de la sélection pour la bordure blanche
        // On met à jour la variable globale et on rafraîchit l'affichage
        lastClickedAssetName = name;
        updateDisplay(); 

        // 2. Gestion des actions spécifiques selon la zone cliquée
        
        // Clic sur le bouton supprimer (croix rouge)
        if (e.target.closest('.btn-delete-asset')) {
            e.stopPropagation(); // Empêche d'ouvrir la modale en même temps
            deleteAsset(name);
        } 
        
        // Clic sur l'image (Ouvre la Lightbox / Modale)
        else if (e.target.classList.contains('card-img-top')) {
            if (typeof openAssetDetails === 'function') {
                openAssetDetails(name);
            }
        } 
        
        // Clic sur la zone de statut (Change le statut)
        else if (e.target.closest('.card-status-area')) {
            if (CAN_EDIT_STATUS) {
                openStatusModal(name);
            }
        }
    });
}

// Variable pour le chemin Blender
const BLENDER_PATH = "file:///C:/Users/vincs/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Blender/";

/** --- GESTION DU MENU CONTEXTUEL & BLENDER --- **/

// Dans votre DOMContentLoaded ou votre fonction d'initialisation :
function initBlenderLauncher() {
    const contextMenu = document.getElementById('customContextMenu');
    const btnOpen = document.getElementById('openBlenderFolder'); // Garde l'ID existant ou renommez-le

    if (btnOpen) {
        // On change le texte pour être plus précis
        btnOpen.innerHTML = "🚀 Lancer Blender";

        btnOpen.addEventListener('click', () => {
            console.log("Appel du lancement Blender via PHP...");
            
            // Appel AJAX vers notre fichier PHP
            fetch('ajax_launch_blender.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log("Blender a été démarré avec succès.");
                    } else {
                        alert("Erreur lors du lancement : " + data.error);
                    }
                })
                .catch(err => {
                    console.error("Erreur Fetch :", err);
                    alert("Impossible de joindre le serveur pour lancer Blender.");
                });

            // On cache le menu après le clic
            if (contextMenu) contextMenu.style.display = 'none';
        });
    }
}

// Assurez-vous d'appeler cette fonction au chargement :
document.addEventListener('DOMContentLoaded', () => {
    
    initBlenderLauncher();
});


/** --- LOGIQUE D'AFFICHAGE DU MENU CONTEXTUEL --- **/

// 1. Détecter le clic droit sur le nom de l'asset
document.addEventListener('contextmenu', (e) => {
    const contextMenu = document.getElementById('customContextMenu');
    
    // On vérifie si on a cliqué sur le nom de l'asset (span avec la classe asset-name-link)
    if (e.target.classList.contains('asset-name-link')) {
        e.preventDefault(); // Empêche le menu contextuel par défaut du navigateur
        
        // Positionnement du menu à l'endroit de la souris
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
    } else {
        // Si on clique droit ailleurs, on cache le menu
        if (contextMenu) contextMenu.style.display = 'none';
    }
});

// 2. Fermer le menu si on fait un clic gauche n'importe où
document.addEventListener('click', () => {
    const contextMenu = document.getElementById('customContextMenu');
    if (contextMenu) contextMenu.style.display = 'none';
});