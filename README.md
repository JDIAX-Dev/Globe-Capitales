# Globe Interactif avec Capitales

Ce script crée une visualisation interactive en 3D d'un globe terrestre avec les capitales représentées par des points dont la taille, la hauteur et la couleur varient en fonction de leur population.
on a accès au contenu par /public

## Fonctionnalités

### Visualisation des Capitales
- Points 3D représentant chaque capitale
- La hauteur du point augmente avec la population
- Le diamètre du point augmente avec la population
- Code couleur : 
  - Rouge : populations importantes
  - Vert : populations faibles
  - Dégradé entre les deux pour les populations intermédiaires

### Interactivité
- Rotation du globe avec la souris (cliquer-glisser)
- Zoom avec la molette de la souris
- Au survol d'une capitale :
  - Affichage d'une infobulle avec le nom, le pays et la population
  - Le point s'éclaircit et grossit légèrement
  - Retour à l'état normal en quittant le survol

## Configuration Requise

- Three.js
- Un serveur web local pour charger les textures et le fichier JSON

## Structure des Données

Le fichier JSON des capitales doit suivre ce format :
```json
[
  {
    "id": "11",
    "latitude": "34.5227939",
    "longitude": "69.1742023",
    "name": "Kabul",
    "countryname": "Afghanistan",
    "population": "4601789"
  },
  ...
]
```

## Organisation du Code

### Initialisation
- Configuration de la scène Three.js
- Création du globe
- Mise en place des lumières
- Configuration de la caméra

### Gestion des Points
- Chargement des données depuis le JSON
- Calcul des dimensions basé sur la population :
  - Hauteur : de 0.02 à 0.17 unités
  - Rayon : de 0.003 à 0.015 unités
- Positionnement sur le globe avec conversion latitude/longitude
- Attribution des couleurs selon la population

### Interactivité
- Gestion du drag & drop pour la rotation
- Système de raycasting pour la détection du survol
- Gestion du zoom avec limites min/max
- Création et positionnement des infobulles

## Personnalisation

Vous pouvez ajuster plusieurs paramètres :

```javascript
// Dimensions des points
const heightScale = 0.15;    // Échelle de hauteur
const minRadius = 0.003;     // Rayon minimum
const maxRadius = 0.015;     // Rayon maximum

// Zoom
const minZoom = 1.5;        // Zoom minimum
const maxZoom = 8;          // Zoom maximum

// Effet de survol
point.scale.set(1.2, 1.2, 1.2);  // Grossissement au survol
```

## Notes d'Utilisation

1. Assurez-vous que le fichier de texture est disponible dans `./assets/img/texture.jpg`
2. Le fichier JSON des capitales doit être accessible à `./assets/location.json`
3. Three.js doit être correctement importé depuis les node_modules
4. L'application doit être servie depuis un serveur web pour fonctionner correctement

## Performance

- Les points sont créés une seule fois au chargement
- Utilisation de la géométrie instanciée pour optimiser les performances
- Animation fluide grâce à requestAnimationFrame

## Limitations Connues

- Nécessite un navigateur moderne avec support WebGL
- Performance peut varier selon le nombre de capitales affichées
- Le texte des infobulles peut parfois déborder de l'écran pour les points en bordure
