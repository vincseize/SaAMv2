<?php
/**
 * ajax_launch_blender.php
 * Lancement via Shell Windows (CMD)
 */
header('Content-Type: application/json');

try {
    // 1. CHEMIN ABSOLU : C'est le point critique. 
    // PHP n'a pas accès à ton "PATH" utilisateur.
    $blenderPath = 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe';

    if (!file_exists($blenderPath)) {
        throw new Exception("Fichier introuvable : " . $blenderPath);
    }

    // 2. CONSTRUCTION DE LA COMMANDE
    // 'start' : commande Windows pour lancer un processus indépendant
    // /B : évite l'ouverture d'une fenêtre de terminal noire
    // "" : obligatoire si le chemin contient des espaces
    $command = 'start /B "" "' . $blenderPath . '"';

    // 3. EXÉCUTION VIA SHELL_EXEC
    // Sous Windows, pour que ce soit asynchrone (ne pas bloquer la page), 
    // on peut rediriger la sortie.
    shell_exec($command);

    echo json_encode([
        'success' => true,
        'message' => 'Commande envoyée au shell Windows',
        'exec' => $command
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}