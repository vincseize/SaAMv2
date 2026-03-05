<?php
// ajax_delete_asset.php
header('Content-Type: application/json');

$jsonFile = 'datas/assets.json';

try {
    $nameToDelete = $_POST['name'] ?? '';

    if (empty($nameToDelete)) {
        throw new Exception("Nom de l'asset manquant.");
    }

    if (file_exists($jsonFile)) {
        $assets = json_decode(file_get_contents($jsonFile), true) ?: [];
        
        // On filtre pour garder tout SAUF celui qu'on veut supprimer
        $newData = array_filter($assets, function($a) use ($nameToDelete) {
            return $a['name'] !== $nameToDelete;
        });

        // Réindexer le tableau et sauvegarder
        file_put_contents($jsonFile, json_encode(array_values($newData), JSON_PRETTY_PRINT));
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Fichier non trouvé']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}