import * as THREE from 'three';

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

function createMoleculeFromAtoms(atoms, bondDistance = 1.1) {
    const group = new THREE.Group();
    
    atoms.forEach(data => {
        const mesh = new THREE.Mesh(data.type === 'hydrogen' ? smallSphereGeom : sphereGeom, materials[data.type]);
        mesh.position.set(...data.pos);
        group.add(mesh);
    });

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

export function buildCaffeineMolecule() {
    const atoms = [
        { pos: [0, 0, 0], type: 'nitrogen' },
        { pos: [0.5, 0.8, 0], type: 'carbon' },
        { pos: [1.3, 0.8, 0], type: 'carbon' },
        { pos: [1.8, 0, 0], type: 'nitrogen' },
        { pos: [1.3, -0.8, 0], type: 'carbon' },
        { pos: [0.5, -0.8, 0], type: 'carbon' },
        { pos: [2.5, -0.4, 0], type: 'carbon' },
        { pos: [2.5, 0.4, 0], type: 'nitrogen' },
        { pos: [0.1, 1.5, 0], type: 'oxygen' },
        { pos: [0.1, -1.5, 0], type: 'oxygen' },
        { pos: [-0.8, 0, 0], type: 'carbon' },
        { pos: [2.2, 1.2, 0], type: 'carbon' },
        { pos: [2.2, -1.2, 0], type: 'carbon' },
    ];
    
    const group = createMoleculeFromAtoms(atoms);
    group.scale.set(0.5, 0.5, 0.5);
    return group;
}

export function buildPhenobarbitalMolecule() {
    const atoms = [
        { pos: [0, 0.8, 0], type: 'nitrogen' },
        { pos: [-0.8, 0.4, 0], type: 'carbon' },
        { pos: [-0.8, -0.4, 0], type: 'nitrogen' },
        { pos: [0, -0.8, 0], type: 'carbon' },
        { pos: [0.8, 0, 0], type: 'carbon' },   
        { pos: [0, 0, 0], type: 'carbon' },   
        
        { pos: [0, 1, 0], type: 'carbon' },
        { pos: [0.86, 0.5, 0], type: 'nitrogen' },
        { pos: [0.86, -0.5, 0], type: 'carbon' },
        { pos: [0, -1, 0], type: 'nitrogen' },
        { pos: [-0.86, -0.5, 0], type: 'carbon' },
        { pos: [-0.86, 0.5, 0], type: 'carbon' },

        { pos: [0, 1.8, 0], type: 'oxygen' },
        { pos: [1.6, -0.8, 0], type: 'oxygen' },
        { pos: [0, -1.8, 0], type: 'oxygen' },

        { pos: [-1.8, -1.2, 0.5], type: 'carbon' },
        { pos: [-2.5, -0.8, 1.0], type: 'carbon' },
        { pos: [-3.3, -1.4, 1.5], type: 'carbon' },
        { pos: [-3.4, -2.4, 1.5], type: 'carbon' },
        { pos: [-2.7, -2.8, 1.0], type: 'carbon' },
        { pos: [-1.9, -2.2, 0.5], type: 'carbon' },

        { pos: [-1.5, 0, -1.0], type: 'carbon' },
        { pos: [-2.2, 0.5, -1.8], type: 'carbon' },
    ];
    
    const group = createMoleculeFromAtoms(atoms, 1.2);
    group.scale.set(0.4, 0.4, 0.4);
    return group;
}

export function buildStrychnineMolecule() {
    const atoms = [];
    
    const radius = 1.2;
    for (let i = 0; i < 14; i++) {
        atoms.push({
            pos: [
                (Math.random() - 0.5) * 2 * radius,
                (Math.random() - 0.5) * 2 * radius,
                (Math.random() - 0.5) * 2 * radius
            ],
            type: 'carbon'
        });
    }
    
    atoms.push({ pos: [1, 1, 0], type: 'nitrogen' });
    atoms.push({ pos: [-1, -1, 0.5], type: 'nitrogen' });
    
    atoms.push({ pos: [1.5, 0, 1.5], type: 'oxygen' });
    atoms.push({ pos: [1.2, -0.5, 1.2], type: 'oxygen' });

    const group = createMoleculeFromAtoms(atoms, 1.6);
    group.scale.set(0.4, 0.4, 0.4);
    return group;
}
