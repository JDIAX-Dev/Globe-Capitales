import * as THREE from '../../node_modules/three/build/three.module.js';

// Initialisation de la scène, de la caméra et du renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75, // Angle de champ de vision
    window.innerWidth / window.innerHeight, // Ratio largeur/hauteur
    0.1, // Plan de découpe proche
    1000 // Plan de découpe éloigné
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Ajout du canvas à la page

// Création d'une sphère
const geometry = new THREE.SphereGeometry(1, 32, 32); // Sphère avec un rayon de 1, et 32 segments horizontaux et verticaux

// Chargement de la texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('./assets/img/texture.jpg'); // Remplacez 'path/to/your/texture.jpg' par le chemin de votre fichier de texture

// Matériau de la sphère avec texture
const material = new THREE.MeshStandardMaterial({ map: texture });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere); // Ajout de la sphère à la scène

// Création des lumières
const light = new THREE.AmbientLight(0xffffff, 1); // Lumière ambiante blanche
scene.add(light);

const lightDirectional = new THREE.DirectionalLight(0xffffff, 2); // Lumière directionnelle blanche
lightDirectional.position.set(5, 10, 7.5);
scene.add(lightDirectional);

// Positionnement de la caméra
camera.position.z = 3;

// Variables pour le contrôle du drag
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Raycaster et souris
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const intersects = [];

// Informations à afficher au survol
const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
infoDiv.style.color = 'white';
infoDiv.style.padding = '10px';
infoDiv.style.borderRadius = '5px';
infoDiv.style.pointerEvents = 'none';
infoDiv.style.display = 'none'; // Cachée par défaut
document.body.appendChild(infoDiv);

// Fonction pour gérer les événements de souris
function onMouseMove(event) {
    // Normaliser la position de la souris pour le raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculer les intersections entre le rayon et les objets de la scène
    raycaster.setFromCamera(mouse, camera);
    intersects.length = 0; // Réinitialiser les intersections
    raycaster.intersectObject(sphere, false, intersects);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        if (intersectedObject.city) {
            // Afficher les informations de la capitale survolée
            const city = intersectedObject.city;

            // Convertir la position 3D du point en coordonnées 2D à l'écran
            const vector = new THREE.Vector3();
            intersectedObject.getWorldPosition(vector);
            vector.project(camera); // Transformation 3D -> 2D

            // Positionner la fenêtre de manière à ce qu'elle soit près du point rouge
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth; // Conversion en pixels
            const y = ( -vector.y * 0.5 + 0.5) * window.innerHeight; // Conversion en pixels
            infoDiv.style.left = `${x}px`;
            infoDiv.style.top = `${y}px`;

            // Mettre à jour les informations de la capitale dans la fenêtre
            infoDiv.innerHTML = `
                <strong>${city.name}</strong><br>
                <em>${city.country}</em><br>
                Population: ${city.population.toLocaleString()}
            `;
            infoDiv.style.display = 'block'; // Afficher la fenêtre
        }
    } else {
        infoDiv.style.display = 'none'; // Masquer la fenêtre si aucun point n'est survolé
    }
}

// Ajouter les points pour les capitales
async function addCityMarkers() {
    const response = await fetch('./assets/location.json');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const cities = await response.json();

    cities.forEach(city => {
        const { name, country, population, latitude, longitude } = city;

        const phi = latitude * (Math.PI / 180);  // Latitude en radians
        const theta = -longitude * (Math.PI / 180); // Longitude en radians (négatif pour respecter l'orientation)

        const radius = 1.01; // Légèrement au-dessus de la sphère pour éviter les intersections

        // Conversion en coordonnées cartésiennes
        const x = radius * Math.cos(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi);
        const z = radius * Math.cos(phi) * Math.sin(theta);

        // Création du point rouge
        const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);

        point.position.set(x, y, z);
        point.city = { name, country, population }; // Stocker les infos sur la capitale dans l'objet

        sphere.add(point); // Ajouter à la sphère
    });
}

// Fonction de rotation de la sphère avec la souris
function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseUp() {
    isDragging = false;
}

function onMouseMoveWithDrag(event) {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        // Rotation de la sphère en fonction des mouvements de la souris
        sphere.rotation.y += deltaMove.x * 0.005;
        sphere.rotation.x += deltaMove.y * 0.005;

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY,
        };
    }
}

// Animation
function animate() {
    requestAnimationFrame(animate); // Boucle d'animation continue

    // Rendu de la scène
    renderer.render(scene, camera);
}

// Écouteurs pour les événements de souris
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mouseup', onMouseUp, false);
document.addEventListener('mousemove', onMouseMoveWithDrag, false);
document.addEventListener('mousemove', onMouseMove, false);

// Démarrer l'animation
addCityMarkers().then(() => {
    animate();
});
