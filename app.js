import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { buildCaffeineMolecule, buildPhenobarbitalMolecule, buildStrychnineMolecule } from './molecule-builder.js';
import { MLAnalyzer } from './ml-analyzer.js';

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const loadingScreen = document.getElementById('loading-screen');
    const topBar = document.getElementById('top-bar');
    const infoPanel = document.getElementById('info-panel');
    const mlPanel = document.getElementById('ml-panel');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    // ML Results Elements
    const substanceNameEl = document.getElementById('substance-name');
    const chemicalFormulaEl = document.getElementById('chemical-formula');
    const probabilityTextEl = document.getElementById('probability-text');
    const probabilityBarEl = document.getElementById('probability-bar');
    const scanBtn = document.getElementById('scan-btn');

    // Initialize ML
    const mlAnalyzer = new MLAnalyzer();
    await mlAnalyzer.loadModel();

    // Initialize MindAR
    // NOTE: This default target might only have 1 or 2 images. 
    // To see all 3, you MUST compile your own targets.mind with the 3 PNG markers.
    const mindarThree = new MindARThree({
        container: document.getElementById('ar-container'),
        imageTargetSrc: 'https://hiukim.github.io/mind-ar-js-doc/assets/targets.mind',
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no"
    });

    const { renderer, scene, camera } = mindarThree;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Build 3D Molecules
    const molecules = [
        buildCaffeineMolecule(),
        buildPhenobarbitalMolecule(),
        buildStrychnineMolecule()
    ];
    
    let isScanning = false;
    let moleculeRotationSpeed = 0.01;
    let currentMoleculeId = null;

    // Setup Anchors
    for(let i = 0; i < molecules.length; i++) {
        const anchor = mindarThree.addAnchor(i);
        anchor.group.add(molecules[i]);

        anchor.onTargetFound = () => {
            currentMoleculeId = i;
            statusDot.className = 'dot green';
            statusText.innerText = 'Маркер знайдено!';
            infoPanel.classList.add('hidden');
            
            if (!isScanning && mlPanel.classList.contains('hidden')) {
                startAnalysis(currentMoleculeId);
            }
        };

        anchor.onTargetLost = () => {
            if (currentMoleculeId === i) {
                currentMoleculeId = null;
                statusDot.className = 'dot red';
                statusText.innerText = 'Шукаю маркер спектру...';
                mlPanel.classList.add('hidden');
                infoPanel.classList.remove('hidden');
                
                // Reset ML UI
                substanceNameEl.innerText = "Невідомо";
                chemicalFormulaEl.style.color = "var(--text-secondary)";
                chemicalFormulaEl.innerText = "-";
                probabilityTextEl.innerText = "0%";
                probabilityBarEl.style.width = "0%";
                moleculeRotationSpeed = 0.01;
            }
        };
    }

    // Start Analysis
    async function startAnalysis(moleculeId) {
        if (moleculeId === null) return;

        isScanning = true;
        moleculeRotationSpeed = 0.05; // Spin faster while analyzing
        
        substanceNameEl.innerText = "Аналізую...";
        substanceNameEl.style.color = "var(--text-secondary)";
        chemicalFormulaEl.innerText = "...";
        probabilityTextEl.innerText = "";
        probabilityBarEl.style.width = "0%";
        
        mlPanel.classList.remove('hidden');

        // Call ML Model
        const result = await mlAnalyzer.analyzeCurrentFrame(moleculeId);

        if (result && currentMoleculeId === moleculeId) { // Check if we are still looking at the same marker
            substanceNameEl.innerText = result.substance;
            substanceNameEl.style.color = "var(--accent-color)";
            chemicalFormulaEl.innerText = result.formula;
            probabilityTextEl.innerText = `${result.probability}%`;
            
            // Animate progress bar
            setTimeout(() => {
                probabilityBarEl.style.width = `${result.probability}%`;
            }, 100);
            
            moleculeRotationSpeed = 0.01; // Back to normal spin
        }
        
        isScanning = false;
    }

    // Manual Scan Button
    scanBtn.addEventListener('click', () => {
        startAnalysis(currentMoleculeId);
    });

    // Start AR Engine
    await mindarThree.start();
    
    // Hide Loading, Show UI
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        topBar.classList.remove('hidden');
        infoPanel.classList.remove('hidden');
    }, 500);

    // Render Loop
    renderer.setAnimationLoop(() => {
        // Animate all molecules
        molecules.forEach(mol => {
            mol.rotation.y += moleculeRotationSpeed;
            mol.rotation.x += moleculeRotationSpeed * 0.5;
        });
        renderer.render(scene, camera);
    });
});
