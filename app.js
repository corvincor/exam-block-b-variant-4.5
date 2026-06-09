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
        imageTargetSrc: './assets/targets.mind',
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no"
    });

    const { renderer, scene, camera } = mindarThree;

    // Lighting — ambient + two point lights for nice molecular shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xffffff, 1.2, 0);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x8888ff, 0.6, 0);
    fillLight.position.set(-5, -3, -5);
    scene.add(fillLight);

    // Build 3D Molecules
    const molecules = [
        buildCaffeineMolecule(),
        buildPhenobarbitalMolecule(),
        buildStrychnineMolecule()
    ];
    
    // Per-molecule rotation speeds
    const rotSpeeds = [0.01, 0.01, 0.01];

    // State
    let isScanning = false;
    let currentMoleculeId = null;

    // Setup Anchors
    molecules.forEach((mol, idx) => {
        const anchor = mindarThree.addAnchor(idx);
        anchor.group.add(mol);

        anchor.onTargetFound = () => {
            currentMoleculeId = idx;
            statusDot.className = 'dot green';
            statusText.innerText = 'Маркер знайдено!';
            infoPanel.classList.add('hidden');

            if (!isScanning && mlPanel.classList.contains('hidden')) {
                startAnalysis(idx);
            }
        };

        anchor.onTargetLost = () => {
            if (currentMoleculeId === idx) {
                currentMoleculeId = null;
                rotSpeeds[idx] = 0.01;
                statusDot.className = 'dot red';
                statusText.innerText = 'Шукаю маркер спектру...';
                mlPanel.classList.add('hidden');
                infoPanel.classList.remove('hidden');

                substanceNameEl.innerText = 'Невідомо';
                chemicalFormulaEl.style.color = 'var(--text-secondary)';
                chemicalFormulaEl.innerText = '-';
                probabilityTextEl.innerText = '0%';
                probabilityBarEl.style.width = '0%';
            }
        };
    });

    // Start Analysis
    async function startAnalysis(moleculeId) {
        if (moleculeId === null) return;

        isScanning = true;
        rotSpeeds[moleculeId] = 0.06; // spin faster while analyzing

        substanceNameEl.innerText = 'Аналізую...';
        substanceNameEl.style.color = 'var(--text-secondary)';
        chemicalFormulaEl.innerText = '...';
        probabilityTextEl.innerText = '';
        probabilityBarEl.style.width = '0%';
        mlPanel.classList.remove('hidden');

        const result = await mlAnalyzer.analyzeCurrentFrame(moleculeId);

        if (result && currentMoleculeId === moleculeId) {
            substanceNameEl.innerText = result.substance;
            substanceNameEl.style.color = 'var(--accent-color)';
            chemicalFormulaEl.innerText = result.formula;
            probabilityTextEl.innerText = `${result.probability}%`;
            setTimeout(() => { probabilityBarEl.style.width = `${result.probability}%`; }, 100);
            rotSpeeds[moleculeId] = 0.008; // slow relaxed spin
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
        molecules.forEach((mol, idx) => {
            mol.rotation.y += rotSpeeds[idx];
            mol.rotation.x += rotSpeeds[idx] * 0.4;
        });
        renderer.render(scene, camera);
    });
});
