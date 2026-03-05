<?php
/**
 * ajax_launch_blender.php
 * Lance Blender via le shell Windows
 */
header('Content-Type: application/json');

try {
    // La commande 'start' permet de lancer le processus en arrière-plan 
    // sans bloquer le serveur Apache. 
    // 'blender' fonctionne car il est dans votre PATH.
    
    $output = [];
    $resultCode = 0;
    
    // Commande : start /B blender 
    // /B lance sans ouvrir une nouvelle fenêtre CMD
    exec('start /B blender', $output, $resultCode);

    if ($resultCode === 0) {
        echo json_encode(['success' => true, 'message' => 'Blender lancé']);
    } else {
        throw new Exception("Erreur lors du lancement (Code: $resultCode)");
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}