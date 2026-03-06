# SaAMv2 - Shots and Assets Manager

**SaAMv2** est un outil léger de gestion d'assets pour les pipelines de production 3D. Il permet de visualiser, filtrer et interagir directement avec les fichiers de production (notamment Blender) via une interface web locale.

---

## 🛠 Environnement Technique

* **Serveur Web :** Apache 2.4 (via XAMPP)
* **Backend :** PHP 8.2.12 (ZTS Visual C++ 2019 x64)
* **Frontend :** JavaScript Modulaire (Actions, Launcher, Grille)
* **Interopérabilité :** Exécution de commandes Shell Windows via PHP.

---

## Documentation
http://httpd.apache.org/docs/2.4
https://www.linuxtricks.fr/wiki/php-lancer-des-processus-shell-dans-une-page-php

---

## ⚠️ Configuration Critique : Windows "Session 0 Isolation"

Lors du développement, un obstacle majeur a été identifié : l'impossibilité de voir l'interface graphique de Blender lorsqu'il est lancé par PHP, bien que le processus soit visible dans le gestionnaire des tâches.

### Le Problème
Par défaut, si Apache (XAMPP/WAMP) est installé en tant que **Service Windows**, il tourne dans la **Session 0**. Cette session est isolée et n'a aucun droit d'affichage sur le bureau de l'utilisateur. Toute application lancée par PHP (comme `blender.exe`) restera donc invisible (processus fantôme).

### La Solution (Mode Manuel)
Pour permettre aux logiciels de "poper" visuellement sur votre écran, Apache doit être lancé dans la session utilisateur :

1.  Ouvrir le **Panneau de contrôle XAMPP** (en mode Administrateur).
2.  Arrêter le module **Apache** (bouton *Stop*).
3.  Cliquer sur la **coche verte** à gauche du nom "Apache" pour désinstaller le service (elle doit devenir une **croix rouge**).
4.  Relancer Apache via le bouton **Start**.



---

## 🚀 Implémentation du Lancement Logiciel

Nous utilisons une approche asynchrone pour éviter que l'interface web ne se fige pendant l'ouverture du logiciel.

### Utilisation de `pclose(popen())`
Contrairement à `exec()`, cette méthode détache le processus immédiatement après le lancement.

```php
// Extrait de ajax_launch_blender.php
$blenderPath = 'C:\Program Files\Blender Foundation\Blender 4.0\blender.exe';
$command = 'start /B "" "' . $blenderPath . '"';

// On ouvre le flux et on le referme aussitôt pour libérer PHP
pclose(popen($command, "r"));

