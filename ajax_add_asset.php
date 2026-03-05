<?php
// ajax_add_asset.php
error_reporting(E_ALL); 
header('Content-Type: application/json');

$jsonFile = 'datas/assets.json';

try {
    if (!is_dir('datas')) mkdir('datas', 0777, true);

    $name = isset($_POST['name']) ? strtoupper(trim($_POST['name'])) : '';
    $dept = $_POST['dept'] ?? 'PRE';
    $project = $_POST['project'] ?? 'Projet A';

    if (empty($name)) throw new Exception("Nom vide.");

    $assets = [];
    if (file_exists($jsonFile)) {
        $assets = json_decode(file_get_contents($jsonFile), true) ?: [];
    }

    $newAsset = [
        "id"       => time(),
        "name"     => $name,
        "category" => $dept,       // On utilise 'category' pour matcher les anciens
        "project"  => $project,
        "status"   => "hld",        // Code court 'hld' au lieu de 'On Hold'
        "version"  => "v001",
        "img"      => "https://picsum.photos/seed/" . md5($name) . "/300/170"
    ];

    array_unshift($assets, $newAsset);

    if (file_put_contents($jsonFile, json_encode($assets, JSON_PRETTY_PRINT)) === false) {
        throw new Exception("Erreur écriture JSON.");
    }

    echo json_encode(['success' => true, 'asset' => $newAsset]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}