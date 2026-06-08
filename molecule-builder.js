// Builder for 3D chemical molecules using THREE.js
export function buildCaffeineMolecule() {
    const group = new THREE.Group();

    // Materials
    const materials = {
        carbon: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 }),
        oxygen: new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.4 }),
        nitrogen: new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.4 }),
        hydrogen: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
        bond: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2 })
    };

    const sphereGeom = new THREE.SphereGeometry(0.15, 32, 32);
    const smallSphereGeom = new THREE.SphereGeometry(0.08, 32, 32);

    // Atom definitions (simplified positions for Caffeine C8H10N4O2)
    // Core double ring (purine-like)
    const atoms = [
        // Ring 1 (6-membered)
        { pos: [0, 0, 0], type: 'nitrogen' },    // N1
        { pos: [0.5, 0.8, 0], type: 'carbon' },  // C2
        { pos: [1.3, 0.8, 0], type: 'carbon' },  // C3
        { pos: [1.8, 0, 0], type: 'nitrogen' },  // N4
        { pos: [1.3, -0.8, 0], type: 'carbon' }, // C5
        { pos: [0.5, -0.8, 0], type: 'carbon' }, // C6
        
        // Ring 2 (5-membered attached to C5, C6)
        { pos: [2.5, -0.4, 0], type: 'carbon' }, // C7
        { pos: [2.5, 0.4, 0], type: 'nitrogen' },// N8

        // Oxygens
        { pos: [0.1, 1.5, 0], type: 'oxygen' },  // O1 (attached to C2)
        { pos: [0.1, -1.5, 0], type: 'oxygen' }, // O2 (attached to C6)

        // Methyl groups (simplified as Carbon + 1 Hydrogen for visual rep)
        { pos: [-0.8, 0, 0], type: 'carbon' },   // C (attached to N1)
        { pos: [2.2, 1.2, 0], type: 'carbon' },  // C (attached to N8)
        { pos: [2.2, -1.2, 0], type: 'carbon' }, // C (attached to N4)
    ];

    // Create atom meshes
    const atomMeshes = [];
    atoms.forEach(data => {
        const mesh = new THREE.Mesh(data.type === 'hydrogen' ? smallSphereGeom : sphereGeom, materials[data.type]);
        mesh.position.set(...data.pos);
        group.add(mesh);
        atomMeshes.push(mesh);
    });

    // Simple bonds logic: Connect nodes that are close to each other
    const bondGeom = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const dx = atoms[i].pos[0] - atoms[j].pos[0];
            const dy = atoms[i].pos[1] - atoms[j].pos[1];
            const dz = atoms[i].pos[2] - atoms[j].pos[2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (dist > 0 && dist < 1.1) {
                // Create bond
                const bond = new THREE.Mesh(bondGeom, materials.bond);
                const midX = (atoms[i].pos[0] + atoms[j].pos[0]) / 2;
                const midY = (atoms[i].pos[1] + atoms[j].pos[1]) / 2;
                const midZ = (atoms[i].pos[2] + atoms[j].pos[2]) / 2;
                bond.position.set(midX, midY, midZ);
                
                // Orient bond
                bond.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(-dx, -dy, -dz).normalize()
                );
                bond.scale.set(1, dist, 1);
                group.add(bond);
            }
        }
    }

    // Scale and adjust
    group.scale.set(0.5, 0.5, 0.5);
    
    // Add subtle animation rotation to the group in the app.js update loop
    return group;
}
