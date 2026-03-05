<?php
// save_message.php
header('Content-Type: application/json');

// Récupération des données envoyées par le JS
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['assetName']) || !isset($data['txt'])) {
    echo json_encode(['status' => 'error', 'message' => 'Données invalides']);
    exit;
}

$file = 'datas/messages.json';
$assetName = $data['assetName'];

// 1. Lire le fichier existant
$messagesAll = [];
if (file_exists($file)) {
    $messagesAll = json_decode(file_get_contents($file), true) ?? [];
}

// 2. Préparer le nouveau message avec date complète + secondes
$newMessage = [
    'user' => $data['user'] ?? '??',
    'txt'  => htmlspecialchars($data['txt']), // Sécurité contre injection XSS
    'date' => date('d/m H:i:s') // Format : Jour/Mois Heure:Minutes:Secondes
];

// 3. Ajouter à la liste de l'asset concerné
if (!isset($messagesAll[$assetName])) {
    $messagesAll[$assetName] = [];
}
$messagesAll[$assetName][] = $newMessage;

// 4. Écrire dans le fichier (avec verrouillage pour éviter les conflits)
if (file_put_contents($file, json_encode($messagesAll, JSON_PRETTY_PRINT), LOCK_EX)) {
    echo json_encode(['status' => 'success', 'message' => 'Enregistré', 'newMsg' => $newMessage]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Erreur d\'écriture']);
}