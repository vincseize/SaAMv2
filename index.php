<?php
/**
 * index.php
 * SaAMv2 - Asset Management System
 * Version : 3.6 - Status Edition Security & Compact Grid
 */

// --- CONFIGURATION & SETTINGS ---
$settingsFile = 'config/settings.json';
$usersFile    = 'config/users.json';
$assetsFile   = 'datas/assets.json';

// Chargement Settings
$settings   = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];
$titre      = $settings['titre'] ?? 'SAAM';
$sousTitre  = $settings['sousTitre'] ?? 'Asset Manager';
$company    = $settings['company'] ?? 'Studio';
$version    = $settings['version'] ?? '1.0.0';
$statusList = $settings['status'] ?? [];
$deptList   = $settings['departements'] ?? [];

// Chargement Users & Choix d'un user au hasard pour la démo
$usersData = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : ['users' => []];
$randomUser = (!empty($usersData['users'])) ? $usersData['users'][array_rand($usersData['users'])] : ['nom' => 'User', 'prenom' => 'Admin', 'role' => 'Manager'];

// Génération des infos utilisateur
$initiales = strtoupper(substr($randomUser['prenom'], 0, 1) . substr($randomUser['nom'], 0, 1));
$fullName  = $randomUser['prenom'] . ' ' . $randomUser['nom'];
$role      = strtolower($randomUser['role']); 

// Vérification des droits (PHP côté serveur)
$canEditStatus = ($role !== 'user');
$isRootOrAdmin = ($role === 'root' || $role === 'admin');
$n_asset       = 82; // Assets de démo
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $titre; ?> | Asset Manager</title>
    
    <link rel="icon" type="image/svg+xml" href="img/icone_saam.svg">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/assets.css">
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script>
        /** PASSAGE DES VARIABLES PHP VERS JS **/
        const USER_ROLE     = "<?php echo $role; ?>";
        const CONFIG_STATUS = <?php echo json_encode($statusList); ?>;
        const CONFIG_DEPTS  = <?php echo json_encode($deptList); ?>;
    </script>
</head> 

<body class="loading-active" data-user-role="<?php echo $role; ?>">

    <div id="loader-wrapper">
        <div class="spinner-saam mb-3"></div>
        <div class="text-white-50 small fw-bold text-uppercase ms-3 d-block" 
             style="letter-spacing: 1px; margin-top: -10px;">
            Initialisation...
        </div>
    </div>

    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div class="container-fluid px-4">
            <a class="navbar-brand fw-bold d-flex align-items-center" href="#">
                <span><?php echo $titre; ?></span>
                <span class="fw-light small ms-2 opacity-50">| <?php echo $sousTitre; ?></span>
            </a>

            <div class="collapse navbar-collapse" id="navbarSaam">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0 me-3 align-items-center"> 
                    <li class="nav-item"><a class="nav-link active" href="#">Assets</a></li>
                    
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle text-info fw-bold" href="#" id="projectDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-folder2-open me-1"></i>
                            <span id="currentProjectDisplay">Projet A</span> 
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-secondary bg-dark" aria-labelledby="projectDropdown">
                            <li><a class="dropdown-item text-white project-select" href="#" data-project="Projet A">Projet A</a></li>
                            <li><a class="dropdown-item text-white project-select" href="#" data-project="Projet B">Projet B</a></li>
                            <li><a class="dropdown-item text-white project-select" href="#" data-project="Projet C">Projet C</a></li>
                        </ul>
                    </li>

                    <li class="nav-item">
                        <a class="nav-link" href="#"><i class="bi bi-gear pe-1"></i>Settings</a>
                    </li>
                </ul>

                <div class="d-flex align-items-center" id="authContainer">
                    <div class="user-avatar me-3" title="<?php echo $fullName; ?>"><?php echo $initiales; ?></div>
                    <span class="text-white-50 small me-2 d-none d-md-inline">
                        <span id="currentUserName"><?php echo $fullName; ?></span> | 
                        <span class="badge bg-secondary" style="font-size:0.6rem;"><?php echo strtoupper($role); ?></span>
                    </span>
                    <a class="btn btn-xs btn-outline-danger" href="#">Logout</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="main-wrapper">
        <aside id="leftPanel" class="side-panel closed">
            <div class="panel-content p-3">
                <h6 class="border-bottom border-secondary pb-2 mb-3 text-uppercase small fw-bold text-white-50">Statistiques</h6>
                <div class="chart-wrapper" style="position: relative; height: 220px; width: 100%;">
                    <canvas id="myPieChart"></canvas>
                </div>
            </div>
        </aside>
        
        <div class="resizer" id="leftResizer"></div>

        <section class="center-content">
            <div class="assets-toolbar d-flex align-items-center p-2 border-bottom bg-light gap-2">
                <button class="btn btn-xs btn-secondary me-2" onclick="togglePanel('leftPanel'); setTimeout(updateChart, 350);">
                    <i class="bi bi-pie-chart-fill"></i> Stats
                </button>
                
                <div id="pagination-top" class="d-flex align-items-center gap-1"></div>
                <span id="assetCount" class="text-muted small px-2 opacity-75" style="font-size: 0.7rem; border-left: 1px solid #dee2e6;"></span>

                <div class="dropdown" id="deptFilterContainer">
                    <button class="btn btn-xs btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                        Départements
                    </button>
                    <ul class="dropdown-menu shadow-sm p-2" id="deptFilters" style="font-size: 0.75rem; min-width: 150px;">
                        <?php foreach($deptList as $d): ?>
                        <li>
                            <div class="form-check d-flex align-items-center m-0">
                                <input class="form-check-input dept-chk mt-0" type="checkbox" value="<?php echo $d['code']; ?>" id="dept_<?php echo $d['code']; ?>" checked>
                                <label class="form-check-label w-100 ms-2" for="dept_<?php echo $d['code']; ?>" style="cursor:pointer; line-height: 1;">
                                    <?php echo $d['label']; ?>
                                </label>
                            </div>
                        </li>
                        <?php endforeach; ?>
                    </ul>
                </div>

                <div id="statusFilters" class="d-flex align-items-center gap-3 ms-auto small px-3 border-start border-end">
                    <?php foreach($statusList as $s): ?>
                    <div class="form-check form-check-inline m-0">
                        <input class="form-check-input status-chk" type="checkbox" value="<?php echo $s['code']; ?>" id="stat_<?php echo $s['code']; ?>" checked>
                        <label class="form-check-label fw-bold" for="stat_<?php echo $s['code']; ?>" style="cursor:pointer; font-size: 0.65rem; color: #666;">
                            <?php echo strtoupper($s['label']); ?>
                        </label>
                    </div>
                    <?php endforeach; ?>
                </div>

                <div class="search-container position-relative" style="width: 200px;">
                    <input type="text" id="searchInput" class="form-control form-control-sm" placeholder="Rechercher...">
                    <span id="clearSearch" title="Effacer">&times;</span>
                </div>

                <button id="sortBtn" class="btn btn-xs btn-outline-secondary">A-Z</button>

                <button class="btn btn-xs btn-secondary ms-2" onclick="togglePanel('rightPanel')">
                    Détails <i class="bi bi-info-circle-fill"></i>
                </button>
            </div>

            <div class="assets-scroll-area">
                <div id="assetGrid" class="asset-grid p-3">
    
                    <?php if ($canEditStatus) : ?>
                    <div class="asset-item js-no-filter" id="addAssetBtn">
                        <div class="card h-100 shadow-sm asset-card border-dashed" 
                            style="border: 2px dashed #0dcaf0; background: rgba(13, 202, 240, 0.05); cursor: pointer;"
                            onclick="openAddAssetModal()">
                            <div class="card-header py-1 justify-content-center header-add" style="background: #2c313a !important;">
                                <span class="fw-bold small text-info text-uppercase">Nouvel Asset</span>
                            </div>
                            <div class="d-flex flex-column align-items-center justify-content-center" style="aspect-ratio: 16/10; color: #0dcaf0;">
                                <i class="bi bi-plus-circle" style="font-size: 2.5rem;"></i>
                                <span class="small fw-bold mt-2 text-uppercase">Ajouter</span>
                            </div>
                            <div class="card-status-area" style="background-color: #2c313a; height: 20px;"></div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <?php 
                    if (file_exists($assetsFile)) {
                        $realAssets = json_decode(file_get_contents($assetsFile), true) ?? [];
                        foreach ($realAssets as $asset) : 
                            $statusColor = "#f39c12"; 
                            foreach($statusList as $s) { if($s['code'] === $asset['status']) { $statusColor = $s['color']; break; } }
                    ?>
                    <div class="asset-item" 
                         data-name="<?php echo htmlspecialchars($asset['name']); ?>" 
                         data-status-code="<?php echo htmlspecialchars($asset['status']); ?>"
                         data-dept-code="<?php echo htmlspecialchars($asset['category']); ?>">
                        <div class="card h-100 shadow-sm asset-card position-relative border-info" style="border-width: 1px;">
                            <div class="position-absolute top-0 end-0 m-1" style="z-index: 2;">
                                <span class="badge bg-info text-dark shadow-sm" title="Sauvegardé en base">
                                    <i class="bi bi-floppy-fill" style="font-size: 0.6rem;"></i>
                                </span>
                                <?php if ($isRootOrAdmin): ?>
                                <span class="badge bg-danger shadow-sm ms-1 btn-delete-asset" style="cursor:pointer;">
                                    <i class="bi bi-x-lg" style="font-size: 0.6rem;"></i>
                                </span>
                                <?php endif; ?>
                            </div>

<div class="card-header py-1">
    <span class="dept-badge text-info"><?php echo strtoupper($asset['category']); ?></span>
    <span class="fw-bold small asset-name-link" 
          data-name="<?php echo htmlspecialchars($asset['name']); ?>" 
          style="cursor: pointer;">
        <?php echo htmlspecialchars($asset['name']); ?>
    </span>
</div>
                            <img src="<?php echo $asset['img']; ?>" class="card-img-top" alt="Thumb">
                            <div class="asset-version-badge"><?php echo $asset['version']; ?></div>
                            
                            <div class="card-status-area <?php echo $canEditStatus ? 'status-clickable' : 'status-readonly'; ?>" 
                                 style="background-color: <?php echo $statusColor; ?>;">
                                <span class="status-text"><?php echo strtoupper($asset['status']); ?></span>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; } ?>

                    <?php for ($i = 1; $i <= $n_asset; $i++) : 
                        $randomStat = (!empty($statusList)) ? $statusList[array_rand($statusList)] : ['code'=>'none', 'label'=>'N/A', 'color'=>'#ccc'];
                        $randomDept = (!empty($deptList)) ? $deptList[array_rand($deptList)] : ['code'=>'???'];
                    ?>
                    <div class="asset-item" 
                         data-name="Asset <?php echo str_pad($i, 2, '0', STR_PAD_LEFT); ?>" 
                         data-status-code="<?php echo $randomStat['code']; ?>"
                         data-dept-code="<?php echo $randomDept['code']; ?>">
                        
                        <div class="card h-100 shadow-sm asset-card position-relative">
                            <div class="position-absolute top-0 end-0 m-1" style="z-index: 2;">
                                <?php if ($isRootOrAdmin): ?>
                                <span class="badge bg-danger shadow-sm ms-1 btn-delete-asset" style="cursor:pointer;">
                                    <i class="bi bi-x-lg" style="font-size: 0.6rem;"></i>
                                </span>
                                <?php endif; ?>
                            </div>
                            <div class="card-header py-1">
                                <span class="dept-badge"><?php echo strtoupper($randomDept['code']); ?></span>
                                <span class="fw-bold small">Asset <?php echo str_pad($i, 2, '0', STR_PAD_LEFT); ?></span>
                            </div>
                            <img src="https://picsum.photos/seed/<?php echo $i + 100; ?>/200/120" class="card-img-top" alt="Thumb">
                            <div class="asset-version-badge">v01</div>
                            
                            <div class="card-status-area <?php echo $canEditStatus ? 'status-clickable' : 'status-readonly'; ?>" 
                                 style="background-color: <?php echo $randomStat['color']; ?>;">
                                <span class="status-text"><?php echo $randomStat['label']; ?></span>
                            </div>
                        </div>
                    </div>
                    <?php endfor; ?>
                </div>
            </div>
        </section>

        <aside id="rightPanel" class="side-panel closed">
            <div class="panel-content p-3">
                <h6 class="border-bottom border-secondary pb-2 mb-3 text-uppercase small fw-bold text-white-50">Détails Asset</h6>
                <div id="detailsPlaceholder" class="text-muted small italic">Sélectionnez un élément pour voir les détails.</div>
            </div>
        </aside>
    </div>

    <footer class="bg-dark text-white-50 text-center py-1 border-top border-secondary">
        <small style="font-size: 0.65rem;">
            <?php echo date('Y'); ?> <?php echo $titre; ?> | &copy; <?php echo $company; ?> v<?php echo $version; ?>
        </small>
    </footer>

    <div class="modal fade" id="assetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-secondary shadow-lg">
                <div class="modal-body p-0 position-relative">
                    <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" style="z-index:10"></button>
                    <img id="modalImg" src="" class="img-fluid w-100" style="border-radius: 4px; background: #111;">
                    <div class="p-3 border-top border-secondary bg-dark">
                        <h5 id="modalTitle" class="mb-1 text-info"></h5>
                        <div id="modalMeta" class="small opacity-75"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="addAssetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-info shadow-lg">
                <div class="modal-header border-secondary d-flex align-items-center">
                    <h5 class="modal-title text-info m-0"><i class="bi bi-plus-circle me-2"></i>Nouvel Asset</h5>
                    <div class="ms-auto d-flex align-items-center">
                        <span id="modalProjectBadge" class="badge border border-info text-info me-3" style="font-size: 0.7rem; letter-spacing: 1px;"></span>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                </div>
                <div class="modal-body">
                    <form id="addAssetForm">
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-white-50">NOM DE L'ASSET</label>
                            <input type="text" id="newAssetName" class="form-control form-control-sm bg-secondary text-white border-0" placeholder="ex: Character_Hero_01" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-white-50">DÉPARTEMENT</label>
                            <select id="newAssetDept" class="form-select form-select-sm bg-secondary text-white border-0">
                                <?php foreach($deptList as $d): ?>
                                    <option value="<?php echo $d['code']; ?>"><?php echo $d['label']; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="mb-1">
                            <label class="form-label small fw-bold text-white-50">STATUT INITIAL</label>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge" style="background-color: #f39c12;">ON HOLD</span>
                                <span class="text-muted" style="font-size: 0.7rem;">(Par défaut)</span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-secondary">
                    <button type="button" class="btn btn-xs btn-outline-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-info" onclick="confirmAddAsset(event)">Créer l'asset</button>
                </div>
            </div>
        </div>
    </div>

<div id="customContextMenu" style="display: none; position: absolute; z-index: 9999; background: #2b2b2b; border: 1px solid #444; border-radius: 4px; padding: 5px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
    <div id="openBlenderFolder" style="padding: 8px 15px; color: white; cursor: pointer; font-size: 12px;" onmouseover="this.style.background='#0dcaf0'; this.style.color='black'" onmouseout="this.style.background='transparent'; this.style.color='white'">
        🚀 Lancer Blender.exe
    </div>
</div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/config-utils.js"></script>
    <script src="js/ui-manager.js"></script>
    <script src="js/chart-manager.js"></script>
    <script src="js/modal-manager.js"></script>
    <script src="js/details-manager.js"></script>
<script>
    // Injection des statuts depuis le settings.json (via PHP) vers le JS
    window.APP_STATUS_LIST = <?php echo json_encode($statusList); ?>;
    // On définit aussi le rôle pour les privilèges
    window.USER_ROLE = "<?php echo $randomUser['role'] ?? 'user'; ?>";
</script>
    <script src="js/blender-launcher.js"></script>
    <script src="js/asset-actions.js"></script>
    <script src="js/script.js"></script>
    

    <script>
        function openAddAssetModal() {
            if(USER_ROLE === 'user') return;
            const myModal = new bootstrap.Modal(document.getElementById('addAssetModal'));
            const badge = document.getElementById('modalProjectBadge');
            if(badge) badge.innerText = (typeof selectedProject !== 'undefined') ? selectedProject.toUpperCase() : "PROJET A";
            myModal.show();
        }
    </script>
</body>
</html>