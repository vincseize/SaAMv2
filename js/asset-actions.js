/**
 * js/asset-actions.js
 * Gestion des actions sur les assets : Statuts, Suppression, Ajout
 */

/** --- GESTION DU STATUT (DYNAMIQUE) --- **/
function openStatusModal(assetName) {
    const assetItem = document.querySelector(`.asset-item[data-name="${assetName}"]`);
    if (!assetItem) return;

    const currentStatus = assetItem.getAttribute('data-status-code');
    const statusArea = assetItem.querySelector('.card-status-area');
    
    // Empêche d'ouvrir plusieurs sélecteurs en même temps
    if (!statusArea || statusArea.querySelector('select')) return;

    const originalHTML = statusArea.innerHTML;

    // Création du select basé sur STATUS_CONFIG
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

        // Mise à jour visuelle immédiate
        const textColor = (val === 'wip' || selectedOpt.color === '#ffc107') ? 'text-dark' : '';
        statusArea.innerHTML = `<span class="badge w-100 ${textColor}" style="background-color: ${selectedOpt.color}; font-size: 0.65rem; padding: 2px 4px;">${selectedOpt.label}</span>`;
        
        console.log(`Statut de ${assetName} mis à jour : ${val}`);
        // Ici, on pourrait ajouter un fetch pour sauvegarder en base/JSON
    };

    select.onblur = () => {
        setTimeout(() => {
            if (statusArea.querySelector('select')) closeEditor();
        }, 150);
    };
}

/** --- SUPPRESSION --- **/
function deleteAsset(assetName) {
    if (!HAS_DELETE_PRIVILEGES) {
        alert("Droits insuffisants pour supprimer.");
        return;
    }

    if (confirm(`⚠️ Supprimer définitivement "${assetName}" ?`)) {
        const el = document.querySelector(`.asset-item[data-name="${assetName}"]`);
        if (el) {
            el.remove();
            // On rafraîchit la liste globale et l'affichage (fonctions de script.js)
            if (typeof refreshAssetList === 'function') refreshAssetList();
            if (typeof updateDisplay === 'function') updateDisplay();
            console.log(`${assetName} supprimé.`);
        }
    }
}

/** --- AJOUT D'ASSET --- **/
function confirmAddAsset(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('newAssetName');
    const deptInput = document.getElementById('newAssetDept');
    
    const assetName = (nameInput && nameInput.value.trim() !== "") ? nameInput.value : "";
    const assetDept = deptInput ? deptInput.value : "PRE";

    if (assetName === "") {
        alert("Veuillez saisir un nom d'asset.");
        return;
    }

    const formData = new FormData();
    formData.append('name', assetName);
    formData.append('dept', assetDept);
    formData.append('project', selectedProject); // Utilise la variable globale de script.js

    fetch('ajax_add_asset.php', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            console.log("Asset ajouté avec succès.");
            location.reload(); // On recharge pour voir le nouvel asset
        } else {
            alert("Erreur : " + data.error);
        }
    })
    .catch(err => console.error("Erreur Fetch Ajout :", err));
}