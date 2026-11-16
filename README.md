# Maquette France 2027-2037

Site statique : un modèle néo-keynésien annuel de l'économie française, pour tester les programmes économiques des candidats à la présidentielle de 2027. On coche les mesures d'un programme, le site recalcule croissance, emploi, déficit, dette, inflation et revenus jusqu'en 2037.

Aucune installation, aucun serveur : tout le calcul se fait dans le navigateur.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page de garde |
| `programmes.html` | Un programme, ses mesures cochables, le résultat en direct |
| `comparer.html` | Programmes côte à côte : tableau de bord, courbes, alertes européennes |
| `detail.html` | Finances publiques, Sécurité sociale, entreprises, secteurs, ménages |
| `chocs.html` | Chocs exogènes et pilotage direct (taux BCE, demande mondiale…) |
| `reglages.html` | Paramètres du modèle, en mode simple ou expert |
| `scenarios.html` | Enregistrer, recharger, copier un scénario |
| `methode.html` | Méthode, limites, sources |
| `css/style.css` | Toute la mise en forme |
| `js/moteur.js` | Le modèle. Aucun affichage, que du calcul |
| `js/programmes.js` | Les programmes par défaut : LFI, RN, Philippe, Lisnard, deux exemples fictifs |
| `js/app.js` | L'interface, commune à toutes les pages |

## Mettre en ligne avec GitHub Pages

1. Déposer tous ces fichiers à la racine d'un dépôt GitHub (branche `main`).
2. Dans le dépôt : Settings › Pages › Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est en ligne une à deux minutes plus tard à l'adresse `https://<compte>.github.io/<dépôt>/`.

## Essayer sur son ordinateur

Ouvrir `index.html` dans un navigateur suffit. Les réglages et les cases cochées sont gardés dans le navigateur, sur l'appareil.

## Pour modifier

- Ajouter ou corriger un programme : `js/programmes.js`. Chaque mesure est une ligne ; le champ `sec` ouvre une nouvelle rubrique.
- Changer une valeur du modèle : `js/moteur.js`, ou la page Réglages pour un essai sans toucher au code.
- Les programmes des candidats sont des extrapolations, pas des chiffrages officiels : voir la page Méthode.
