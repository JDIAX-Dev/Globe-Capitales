import * as THREE from '../../node_modules/three/build/three.module.js';

// Initialisation de la scène, de la caméra et du renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Création d'une sphère
const geometry = new THREE.SphereGeometry(1, 32, 32);
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('./assets/img/texture.jpg');
const material = new THREE.MeshStandardMaterial({ map: texture });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Création des lumières
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

const lightDirectional = new THREE.DirectionalLight(0xffffff, 2);
lightDirectional.position.set(5, 10, 7.5);
scene.add(lightDirectional);

// Positionnement de la caméra
camera.position.z = 3;

// Variables pour le contrôle du drag
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Zoom fluide
let targetZoom = camera.position.z;

// Création de l'infobulle
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
tooltip.style.color = 'white';
tooltip.style.padding = '10px';
tooltip.style.borderRadius = '5px';
tooltip.style.display = 'none';
tooltip.style.pointerEvents = 'none';
document.body.appendChild(tooltip);

// Raycaster pour la détection de survol
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Collection pour stocker les points et leurs données
const cityPoints = new THREE.Group();
sphere.add(cityPoints);

// Fonction pour calculer la couleur en fonction de la population
function getColorForPopulation(populationRatio) {
    // Convertir la population ratio (0-1) en couleur
    // Vert pour les petites populations, Rouge pour les grandes
    const r = Math.floor(populationRatio * 255);
    const g = Math.floor((1 - populationRatio) * 255);
    const b = 0;

    return new THREE.Color(r/255, g/255, b/255);
}

async function addCityMarkers() {
    const response = await fetch('./assets/location.json');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const cities = await response.json();

    // Trouver la population maximale pour normaliser les dimensions
    const maxPopulation = Math.max(...cities.map(city => parseInt(city.population)));

    cities.forEach(city => {
        const { name, latitude, longitude, countryname, population } = city;

        const phi = latitude * (Math.PI / 180);
        const theta = -longitude * (Math.PI / 180);
        const radius = 1.01;

        // Calculer les dimensions normalisées en fonction de la population
        const populationRatio = parseInt(population) / maxPopulation;
        const heightScale = 0.15;
        const height = 0.02 + (populationRatio * heightScale);

        // Calculer le rayon du cylindre en fonction de la population
        const minRadius = 0.003;
        const maxRadius = 0.015;
        const radiusScale = populationRatio * (maxRadius - minRadius) + minRadius;

        // Obtenir la couleur en fonction de la population
        const color = getColorForPopulation(populationRatio);

        // Créer un cylindre avec le rayon variable
        const pointGeometry = new THREE.CylinderGeometry(radiusScale, radiusScale, height, 8);
        const pointMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);

        // Calculer la position du point
        const x = radius * Math.cos(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi);
        const z = radius * Math.cos(phi) * Math.sin(theta);

        // Positionner le point
        point.position.set(x, y, z);

        // Orienter le cylindre pour qu'il pointe vers l'extérieur
        const direction = new THREE.Vector3(x, y, z).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        point.setRotationFromQuaternion(quaternion);

        // Stocker les données de la ville dans l'objet point
        point.userData = {
            name,
            countryname,
            population,
            baseHeight: height,
            baseRadius: radiusScale,
            baseColor: color.clone() // Stocker la couleur de base
        };

        cityPoints.add(point);
    });
}

// Gestionnaire de survol
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };
        sphere.rotation.y += deltaMove.x * 0.01;
        sphere.rotation.x += deltaMove.y * 0.01;
    }

    previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
    };

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cityPoints.children);

    if (intersects.length > 0) {
        const point = intersects[0].object;
        const { name, countryname, population } = point.userData;

        tooltip.innerHTML = `
            <strong>${name}</strong><br>
            Pays: ${countryname}<br>
            Population: ${Number(population).toLocaleString()}
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = event.clientX + 10 + 'px';
        tooltip.style.top = event.clientY + 10 + 'px';

        // Éclaircir la couleur au survol tout en gardant la teinte
        const highlightColor = point.userData.baseColor.clone();
        highlightColor.multiplyScalar(1.5); // Éclaircir la couleur
        point.material.color = highlightColor;
        point.scale.set(1.2, 1.2, 1.2);
    } else {
        tooltip.style.display = 'none';

        // Réinitialiser la couleur et les dimensions de tous les points
        cityPoints.children.forEach(point => {
            point.material.color = point.userData.baseColor;
            point.scale.set(1, 1, 1);
        });
    }
}

// Écouteurs d'événements
document.addEventListener('mousedown', () => isDragging = true);
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('wheel', (event) => {
    targetZoom += event.deltaY * 0.01;
    targetZoom = Math.max(1.5, Math.min(targetZoom, 8));
});

// Ajuster la taille du renderer lors du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
function animate() {
    requestAnimationFrame(animate);
    camera.position.z += (targetZoom - camera.position.z) * 0.1;
    renderer.render(scene, camera);
}

// Initialisation
await addCityMarkers();
animate();