<?php
/**
 * ajax_launch_blender.php
 * Lancement via Shell Windows détaché
 */
header('Content-Type: application/json');

try {
    // 1. CHEMIN ABSOLU (Obligatoire pour PHP/Apache)
    // Remplace par ton chemin exact. Si c'est Blender 4.2, change le dossier.
    $blenderPath = 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe';

    if (!file_exists($blenderPath)) {
        throw new Exception("Blender introuvable sur le disque : " . $blenderPath);
    }

    /**
     * 2. LA COMMANDE SHELL
     * - 'start' : Lance un processus indépendant.
     * - '/B' : Évite d'ouvrir une fenêtre CMD noire inutile.
     * - '""' : Important ! Windows ignore le premier paramètre entre guillemets après 'start'.
     */
    $command = 'start /B "" "' . $blenderPath . '"';

    /**
     * 3. LANCEMENT VIA POPEN (Le "Bash" Windows)
     * popen ouvre un pipe vers le shell. 
     * pclose ferme le pipe immédiatement côté PHP, mais laisse Blender vivre.
     */
    $handle = popen($command, "r");
    
    if ($handle !== false) {
        pclose($handle);
        echo json_encode([
            'success' => true, 
            'message' => 'Commande envoyée au shell.',
            'cmd' => $command
        ]);
    } else {
        throw new Exception("Impossible d'ouvrir le shell Windows.");
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}