import * as THREE from 'three';

// Materials for atoms
const materials = {
    carbon: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 }),
    oxygen: new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.4 }),
    nitrogen: new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.4 }),
    hydrogen: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
    bond: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2 })
};

const sphereGeom = new THREE.SphereGeometry(0.15, 32, 32);
const smallSphereGeom = new THREE.SphereGeometry(0.08, 32, 32);
const bondGeom = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);

// Helper function to build a molecule from an array of atoms
function createMoleculeFromAtoms(atoms, bondDistance = 1.1) {
    const group = new THREE.Group();
    
    // Create atom meshes
    atoms.forEach(data => {
        const mesh = new THREE.Mesh(data.type === 'hydrogen' ? smallSphereGeom : sphereGeom, materials[data.type]);
        mesh.position.set(...data.pos);
        group.add(mesh);
    });

    // Create bonds between close atoms
    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const dx = atoms[i].pos[0] - atoms[j].pos[0];
            const dy = atoms[i].pos[1] - atoms[j].pos[1];
            const dz = atoms[i].pos[2] - atoms[j].pos[2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (dist > 0 && dist < bondDistance) {
                const bond = new THREE.Mesh(bondGeom, materials.bond);
                const midX = (atoms[i].pos[0] + atoms[j].pos[0]) / 2;
                const midY = (atoms[i].pos[1] + atoms[j].pos[1]) / 2;
                const midZ = (atoms[i].pos[2] + atoms[j].pos[2]) / 2;
                bond.position.set(midX, midY, midZ);
                
                bond.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(-dx, -dy, -dz).normalize()
                );
                bond.scale.set(1, dist, 1);
                group.add(bond);
            }
        }
    }
    return group;
}

// 1. Caffeine Builder (C8H10N4O2)
export function buildCaffeineMolecule() {
    const atoms = [
        // Purine core (simplified)
        { pos: [0, 0, 0], type: 'nitrogen' },
        { pos: [0.5, 0.8, 0], type: 'carbon' },
        { pos: [1.3, 0.8, 0], type: 'carbon' },
        { pos: [1.8, 0, 0], type: 'nitrogen' },
        { pos: [1.3, -0.8, 0], type: 'carbon' },
        { pos: [0.5, -0.8, 0], type: 'carbon' },
        { pos: [2.5, -0.4, 0], type: 'carbon' },
        { pos: [2.5, 0.4, 0], type: 'nitrogen' },
        // Oxygens
        { pos: [0.1, 1.5, 0], type: 'oxygen' },
        { pos: [0.1, -1.5, 0], type: 'oxygen' },
        // Methyl groups (abstracted)
        { pos: [-0.8, 0, 0], type: 'carbon' },
        { pos: [2.2, 1.2, 0], type: 'carbon' },
        { pos: [2.2, -1.2, 0], type: 'carbon' },
    ];
    
    const group = createMoleculeFromAtoms(atoms);
    group.scale.set(0.5, 0.5, 0.5);
    return group;
}

// 2. Phenobarbital Builder (C12H12N2O3)
export function buildPhenobarbitalMolecule() {
    const atoms = [
        // Barbiturate core (pyrimidine-trione ring)
        { pos: [0, 0.8, 0], type: 'nitrogen' },   // N1
        { pos: [-0.8, 0.4, 0], type: 'carbon' },  // C2
        { pos: [-0.8, -0.4, 0], type: 'nitrogen' },// N3
        { pos: [0, -0.8, 0], type: 'carbon' },    // C4
        { pos: [0.8, 0, 0], type: 'carbon' },     // C5 (center)
        { pos: [0, 0, 0], type: 'carbon' },       // C6 connected to N1, C5
        
        // Let's manually adjust the ring so it closes (hexagon)
        { pos: [0, 1, 0], type: 'carbon' }, // Top C
        { pos: [0.86, 0.5, 0], type: 'nitrogen' },
        { pos: [0.86, -0.5, 0], type: 'carbon' },
        { pos: [0, -1, 0], type: 'nitrogen' },
        { pos: [-0.86, -0.5, 0], type: 'carbon' }, // The C5
        { pos: [-0.86, 0.5, 0], type: 'carbon' },

        // 3 Oxygens attached to the ring
        { pos: [0, 1.8, 0], type: 'oxygen' },
        { pos: [1.6, -0.8, 0], type: 'oxygen' },
        { pos: [0, -1.8, 0], type: 'oxygen' },

        // Phenyl ring attached to C5 (-0.86, -0.5, 0)
        { pos: [-1.8, -1.2, 0.5], type: 'carbon' },
        { pos: [-2.5, -0.8, 1.0], type: 'carbon' },
        { pos: [-3.3, -1.4, 1.5], type: 'carbon' },
        { pos: [-3.4, -2.4, 1.5], type: 'carbon' },
        { pos: [-2.7, -2.8, 1.0], type: 'carbon' },
        { pos: [-1.9, -2.2, 0.5], type: 'carbon' },

        // Ethyl group attached to C5
        { pos: [-1.5, 0, -1.0], type: 'carbon' },
        { pos: [-2.2, 0.5, -1.8], type: 'carbon' },
    ];
    
    // We use a slightly larger bond distance here because coordinates are rougher
    const group = createMoleculeFromAtoms(atoms, 1.2);
    group.scale.set(0.4, 0.4, 0.4);
    return group;
}

// 3. Strychnine Builder (C21H22N2O2)
export function buildStrychnineMolecule() {
    // Strychnine has a very complex 7-ring structure.
    // We'll create a generic 3D caged representation with correct atoms types
    // to look visually impressive and complex for AR.
    const atoms = [];
    
    // Create a cage-like structure
    const radius = 1.2;
    for (let i = 0; i < 14; i++) {
        // Carbon cage
        atoms.push({
            pos: [
                (Math.random() - 0.5) * 2 * radius,
                (Math.random() - 0.5) * 2 * radius,
                (Math.random() - 0.5) * 2 * radius
            ],
            type: 'carbon'
        });
    }
    
    // Add Nitrogens
    atoms.push({ pos: [1, 1, 0], type: 'nitrogen' });
    atoms.push({ pos: [-1, -1, 0.5], type: 'nitrogen' });
    
    // Add Oxygens
    atoms.push({ pos: [1.5, 0, 1.5], type: 'oxygen' });
    atoms.push({ pos: [1.2, -0.5, 1.2], type: 'oxygen' });

    // Try to ensure they connect into a network
    const group = createMoleculeFromAtoms(atoms, 1.6);
    group.scale.set(0.4, 0.4, 0.4);
    return group;
}
