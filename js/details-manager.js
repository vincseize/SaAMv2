/**
 * js/details-manager.js
 * Gestion du panneau latéral droit et de la discussion (Chat)
 * SaAMv2 - Asset Management System
 */

/**
 * Chef d'orchestre appelé lors du clic sur un asset
 * @param {Object} data - Données de l'asset (name, img, status, dept, statusColor, version)
 * @param {Function} getFullDept - Utilitaire de mapping département
 * @param {Function} getFullStatus - Utilitaire de mapping statut
 */
function showAssetDetails(data, getFullDept, getFullStatus) {
    const fullDept = (typeof getFullDept === 'function') ? getFullDept(data.dept) : data.dept;
    const fullStatus = (typeof getFullStatus === 'function') ? getFullStatus(data.status) : data.status;

    // 1. Mise à jour de la modale d'aperçu (si modal-manager.js est présent)
    if (typeof updatePreviewModal === 'function') {
        updatePreviewModal(data, fullStatus, fullDept);
    }

    // 2. Sélection du conteneur dans le panneau latéral droit
    const container = document.getElementById('detailsPlaceholder');
    if (!container) return;

    // Simulation de dates de production (Aujourd'hui + 15 jours)
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 15);
    const dateStr = `${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;

    // 3. Injection du HTML (Header, Tech Info, et Structure du Chat)
    container.className = "animate-fade-in"; 
    container.innerHTML = `
        <div class="detail-header mb-3">
            <img src="${data.img}" class="img-fluid rounded mb-2 shadow border border-secondary" style="width:100%; aspect-ratio:16/9; object-fit:cover;">
            <h5 class="mb-0 text-white">${data.name}</h5>
            <div class="small mt-1">
                <span class="badge" style="background:${data.statusColor}">${fullStatus}</span> 
                <span class="text-muted ms-1">${data.version}</span>
            </div>
        </div>
        
        <div class="mb-4 p-2 bg-dark rounded border border-secondary shadow-sm">
            <h6 class="small fw-bold text-uppercase border-bottom border-secondary pb-1 text-white-50" style="font-size:0.6rem; letter-spacing:1px;">Planning & Tech</h6>
            <div class="small text-light mt-2"><i class="bi bi-calendar3 me-2 text-primary"></i>${dateStr}</div>
            <div class="small text-white-50 mt-1"><i class="bi bi-cpu me-2"></i>Dept: <span class="text-white">${fullDept}</span></div>
            <div class="small text-white-50"><i class="bi bi-aspect-ratio me-2"></i>Res: <span class="text-white">1920x1080</span></div>
        </div>

        <div class="comment-section">
            <h6 class="small fw-bold text-uppercase border-bottom border-secondary pb-1 text-white-50" style="font-size:0.6rem; letter-spacing:1px;">Discussion</h6>
            <div id="chatBox" class="chat-box mb-2 pe-1" style="max-height: 350px; overflow-y:auto; min-height:150px; scrollbar-width: thin;">
                <div class="text-center py-4 text-muted small">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div> Chargement...
                </div>
            </div>
            <div class="input-group input-group-sm mt-3 shadow-sm">
                <input type="text" id="chatInput" class="form-control bg-dark text-white border-secondary" placeholder="Écrire un message...">
                <button class="btn btn-primary px-3" id="sendBtn"><i class="bi bi-send-fill"></i></button>
            </div>
        </div>
    `;

    // 4. Lancement du chargement des messages
    loadChatMessages(data.name);
}

/**
 * Charge les messages depuis le serveur (messages.json)
 */
function loadChatMessages(assetName) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    // Récupère les initiales de l'utilisateur via le DOM (Avatar du menu)
    const currentUser = document.querySelector('.user-avatar')?.innerText.trim() || "??";

    fetch('datas/messages.json?t=' + Date.now()) // Anti-cache
        .then(response => {
            if (!response.ok) throw new Error('Fichier non trouvé');
            return response.json();
        })
        .then(allMessages => {
            const messages = allMessages[assetName] || [];
            
            if (messages.length === 0) {
                chatBox.innerHTML = `<div class="text-muted small italic p-4 text-center">Aucun message pour le moment.</div>`;
            } else {
                chatBox.innerHTML = messages.map(msg => 
                    renderMsgTemplate(msg.user, msg.txt, msg.date, msg.user === currentUser)
                ).join('');
            }
            
            chatBox.scrollTop = chatBox.scrollHeight;
            setupChatSystem(chatBox, assetName, currentUser);
        })
        .catch(err => {
            console.warn("Chat info:", err.message);
            chatBox.innerHTML = `<div class="text-muted small p-4 text-center">Commencez la discussion...</div>`;
            setupChatSystem(chatBox, assetName, currentUser);
        });
}

/**
 * Génère le HTML pour une bulle de message
 */
function renderMsgTemplate(user, txt, fullDate, isMe = false) {
    const bgClass = isMe ? "bg-info text-dark border-info" : "bg-dark text-white border-secondary";
    const userLabel = isMe ? "MOI" : user;
    const avatarColor = isMe ? "#0dcaf0" : "#495057";
    const dateColorClass = isMe ? "text-secondary" : "text-white-50";
    const userColorClass = isMe ? "text-dark" : "text-primary";

    return `
        <div class="d-flex gap-2 mb-2 animate-slide-in">
            <div class="user-avatar shadow-sm" style="width:24px; height:24px; font-size:0.55rem; flex-shrink:0; background:${avatarColor}; border:1px solid rgba(255,255,255,0.1); color: ${isMe ? '#000' : '#fff'}; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                ${userLabel.substring(0,2)}
            </div>
            <div class="${bgClass} p-2 rounded small flex-grow-1 border shadow-sm">
                <div class="fw-bold mb-1 d-flex justify-content-between align-items-center" style="font-size:0.65rem;">
                    <span class="${userColorClass} text-uppercase">${userLabel}</span>
                    <span class="${dateColorClass} fw-normal" style="font-size:0.6rem;">${fullDate}</span>
                </div>
                <div style="font-size:0.75rem; line-height:1.4; word-break: break-word;">${txt}</div>
            </div>
        </div>`;
}

/**
 * Initialise les écouteurs d'événements pour l'envoi de messages
 */
function setupChatSystem(chatBox, assetName, currentUser) {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    if (!input || !sendBtn) return;

    const doSend = () => {
        const text = input.value.trim();
        if (text === "") return;

        // Verrouillage de l'UI
        input.disabled = true;
        sendBtn.disabled = true;

        fetch('save_message.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetName: assetName, user: currentUser, txt: text })
        })
        .then(response => response.json())
        .then(res => {
            if (res.status === 'success') {
                // Nettoyage si premier message
                if (chatBox.querySelector('.italic') || chatBox.innerText.includes('Commencez')) {
                    chatBox.innerHTML = "";
                }
                
                // Injection du nouveau message en local
                chatBox.insertAdjacentHTML('beforeend', renderMsgTemplate(currentUser, res.newMsg.txt, res.newMsg.date, true));
                input.value = "";
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                alert("Erreur lors de l'envoi : " + res.message);
            }
        })
        .catch(err => {
            console.error("Erreur Chat:", err);
            alert("Erreur de connexion au serveur.");
        })
        .finally(() => {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        });
    };

    // Click bouton
    sendBtn.onclick = (e) => { e.preventDefault(); doSend(); };

    // Touche Entrée
    input.onkeydown = (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            doSend(); 
        } 
    };
}