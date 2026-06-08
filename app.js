import { buildCaffeineMolecule } from './molecule-builder.js';
import { MLAnalyzer } from './ml-analyzer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById('loading-screen');
    const topBar = document.getElementById('top-bar');
    const infoPanel = document.getElementById('info-panel');
    const mlPanel = document.getElementById('ml-panel');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    const substanceNameEl = document.getElementById('substance-name');
    const chemicalFormulaEl = document.getElementById('chemical-formula');
    const probabilityTextEl = document.getElementById('probability-text');
    const probabilityBarEl = document.getElementById('probability-bar');
    const scanBtn = document.getElementById('scan-btn');

    const mlAnalyzer = new MLAnalyzer();
    await mlAnalyzer.loadModel();

    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.getElementById('ar-container'),
        imageTargetSrc: './assets/targets.mind',
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no"
    });

    const { renderer, scene, camera } = mindarThree;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    const caffeineMolecule = buildCaffeineMolecule();
    
    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(caffeineMolecule);

    let isScanning = false;
    let moleculeRotationSpeed = 0.01;

    anchor.onTargetFound = () => {
        statusDot.className = 'dot green';
        statusText.innerText = 'Маркер знайдено!';
        infoPanel.classList.add('hidden');
        
        if (!isScanning && mlPanel.classList.contains('hidden')) {
            startAnalysis();
        }
    };

    anchor.onTargetLost = () => {
        statusDot.className = 'dot red';
        statusText.innerText = 'Шукаю маркер спектру...';
        mlPanel.classList.add('hidden');
        infoPanel.classList.remove('hidden');
        
        substanceNameEl.innerText = "Невідомо";
        chemicalFormulaEl.style.color = "var(--text-secondary)";
        chemicalFormulaEl.innerText = "-";
        probabilityTextEl.innerText = "0%";
        probabilityBarEl.style.width = "0%";
        moleculeRotationSpeed = 0.01;
    };
    async function startAnalysis() {
        isScanning = true;
        moleculeRotationSpeed = 0.05;
        
        substanceNameEl.innerText = "Аналізую...";
        substanceNameEl.style.color = "var(--text-secondary)";
        chemicalFormulaEl.innerText = "...";
        probabilityTextEl.innerText = "";
        probabilityBarEl.style.width = "0%";
        
        mlPanel.classList.remove('hidden');

        const result = await mlAnalyzer.analyzeCurrentFrame(null);

        if (result) {
            substanceNameEl.innerText = result.substance;
            substanceNameEl.style.color = "var(--accent-color)";
            chemicalFormulaEl.innerText = result.formula;
            probabilityTextEl.innerText = `${result.probability}%`;
            
            setTimeout(() => {
                probabilityBarEl.style.width = `${result.probability}%`;
            }, 100);
            
            moleculeRotationSpeed = 0.01;
        }
        
        isScanning = false;
    }
    scanBtn.addEventListener('click', () => {
        startAnalysis();
    });

    await mindarThree.start();
    
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        topBar.classList.remove('hidden');
        infoPanel.classList.remove('hidden');
    }, 500);

    renderer.setAnimationLoop(() => {
        if (caffeineMolecule) {
            caffeineMolecule.rotation.y += moleculeRotationSpeed;
            caffeineMolecule.rotation.x += moleculeRotationSpeed * 0.5;
        }
        renderer.render(scene, camera);
    });
});
