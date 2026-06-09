import * as THREE from 'three';

// ─── CPK Color scheme (standard chemistry) ─────────────────────────────────
const ATOM_COLORS = {
    carbon:   0x404040,
    nitrogen: 0x3050f8,
    oxygen:   0xff2010,
    hydrogen: 0xffffff,
    bond:     0x888888,
};

// Atom radii (visual, not real scale)
const ATOM_RADIUS = {
    carbon:   0.13,
    nitrogen: 0.12,
    oxygen:   0.12,
    hydrogen: 0.07,
};

// ─── Helper: build material with nice shading ───────────────────────────────
function atomMat(type) {
    return new THREE.MeshPhongMaterial({
        color: ATOM_COLORS[type],
        shininess: 80,
        specular: 0x444444,
    });
}

const bondMat = new THREE.MeshPhongMaterial({
    color: ATOM_COLORS.bond,
    shininess: 40,
});

// ─── Helper: create one atom sphere ────────────────────────────────────────
function makeAtom(type, pos) {
    const r = ATOM_RADIUS[type] || 0.10;
    const geo = new THREE.SphereGeometry(r, 24, 24);
    const mesh = new THREE.Mesh(geo, atomMat(type));
    mesh.position.set(...pos);
    return mesh;
}

// ─── Helper: create one bond cylinder between two vec3-like arrays ──────────
function makeBond(posA, posB) {
    const a = new THREE.Vector3(...posA);
    const b = new THREE.Vector3(...posB);
    const dist = a.distanceTo(b);

    const geo = new THREE.CylinderGeometry(0.035, 0.035, dist, 12);
    const mesh = new THREE.Mesh(geo, bondMat);

    // Position at midpoint
    mesh.position.copy(a).lerp(b, 0.5);

    // Orient along the bond direction
    const dir = b.clone().sub(a).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    return mesh;
}

// ─── Helper: add bonds between explicitly listed atom pairs ────────────────
function addBonds(group, atoms, pairs) {
    pairs.forEach(([i, j]) => {
        group.add(makeBond(atoms[i].pos, atoms[j].pos));
    });
}

// ─── Helper: add atom meshes ───────────────────────────────────────────────
function addAtoms(group, atoms) {
    atoms.forEach(a => group.add(makeAtom(a.type, a.pos)));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CAFFEINE  C8H10N4O2
//    Xanthine core: 6-membered + 5-membered fused ring, 3 methyl groups, 2 C=O
//    Coordinates derived from standard crystal geometry (simplified planar).
// ═══════════════════════════════════════════════════════════════════════════
export function buildCaffeineMolecule() {
    const group = new THREE.Group();

    // Scale factor so molecule fits nicely over a small AR marker
    const s = 0.55;

    // ── Atoms ──────────────────────────────────────────
    // 6-membered ring  N1-C2-N3-C4-C5-C6
    const N1  = { type: 'nitrogen', pos: [ 0.00 * s,  1.20 * s,  0] };
    const C2  = { type: 'carbon',   pos: [ 1.14 * s,  0.60 * s,  0] };
    const N3  = { type: 'nitrogen', pos: [ 1.14 * s, -0.60 * s,  0] };
    const C4  = { type: 'carbon',   pos: [ 0.00 * s, -1.20 * s,  0] };
    const C5  = { type: 'carbon',   pos: [-1.14 * s, -0.60 * s,  0] };
    const C6  = { type: 'carbon',   pos: [-1.14 * s,  0.60 * s,  0] };

    // 5-membered ring  C4-C5-N7-C8-N9 (fused at C4-C5 bond)
    const N7  = { type: 'nitrogen', pos: [-1.90 * s, -1.50 * s,  0] };
    const C8  = { type: 'carbon',   pos: [-1.00 * s, -2.50 * s,  0] };
    const N9  = { type: 'nitrogen', pos: [ 0.20 * s, -2.20 * s,  0] };

    // Carbonyl oxygens
    const O2  = { type: 'oxygen',   pos: [ 2.30 * s,  1.20 * s,  0] }; // on C2
    const O6  = { type: 'oxygen',   pos: [-2.30 * s,  1.20 * s,  0] }; // on C6

    // Methyl carbons (N1-CH3, N3-CH3, N7-CH3)
    const Me1 = { type: 'carbon',   pos: [ 0.00 * s,  2.60 * s,  0] }; // N1-CH3
    const Me3 = { type: 'carbon',   pos: [ 2.35 * s, -1.40 * s,  0] }; // N3-CH3
    const Me7 = { type: 'carbon',   pos: [-3.30 * s, -1.80 * s,  0] }; // N7-CH3

    const atoms = [N1, C2, N3, C4, C5, C6, N7, C8, N9, O2, O6, Me1, Me3, Me7];
    // indices:   0   1   2   3   4   5   6   7   8   9   10  11  12  13

    addAtoms(group, atoms);

    // ── Bonds ──────────────────────────────────────────
    const pairs = [
        // 6-membered ring
        [0,1], [1,2], [2,3], [3,4], [4,5], [5,0],
        // 5-membered ring (fused)
        [4,6], [6,7], [7,8], [8,3],
        // Carbonyls
        [1,9], [5,10],
        // Methyl groups
        [0,11], [2,12], [6,13],
    ];

    addBonds(group, atoms, pairs);
    return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. PHENOBARBITAL  C12H12N2O3
//    Barbiturate ring (6-membered with 2 N and 3 C=O),
//    phenyl ring and ethyl chain on C5.
// ═══════════════════════════════════════════════════════════════════════════
export function buildPhenobarbitalMolecule() {
    const group = new THREE.Group();
    const s = 0.50;

    // ── Barbiturate ring  N1-C2-N3-C4-C5-C6 ───────────
    // Regular hexagon, radius 1.2
    const r = 1.2 * s;
    const barb = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        barb.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    // Assign atom types: N1(0), C2(1), N3(2), C4(3), C5(4), C6(5)
    const barbTypes = ['nitrogen','carbon','nitrogen','carbon','carbon','carbon'];

    const atoms = [
        // Barbiturate ring
        { type: 'nitrogen', pos: [barb[0].x, barb[0].y, 0] }, // N1
        { type: 'carbon',   pos: [barb[1].x, barb[1].y, 0] }, // C2  → O (carbonyl)
        { type: 'nitrogen', pos: [barb[2].x, barb[2].y, 0] }, // N3
        { type: 'carbon',   pos: [barb[3].x, barb[3].y, 0] }, // C4  → O (carbonyl)
        { type: 'carbon',   pos: [barb[4].x, barb[4].y, 0] }, // C5  (quaternary)
        { type: 'carbon',   pos: [barb[5].x, barb[5].y, 0] }, // C6  → O (carbonyl)

        // Carbonyl oxygens (3 C=O groups)
        { type: 'oxygen',   pos: [barb[1].x + 0.0 * s, barb[1].y + 1.1 * s, 0.4 * s] }, // O on C2
        { type: 'oxygen',   pos: [barb[3].x + 0.7 * s, barb[3].y - 0.8 * s, 0.4 * s] }, // O on C4
        { type: 'oxygen',   pos: [barb[5].x - 0.7 * s, barb[5].y - 0.8 * s, 0.4 * s] }, // O on C6

        // Phenyl ring on C5 (6 carbons, in a tilted plane)
        { type: 'carbon',   pos: [barb[4].x + 1.3 * s, barb[4].y,           0.3 * s] }, // Ph-C1
        { type: 'carbon',   pos: [barb[4].x + 1.9 * s, barb[4].y + 0.7 * s, 0.8 * s] }, // Ph-C2
        { type: 'carbon',   pos: [barb[4].x + 3.0 * s, barb[4].y + 0.7 * s, 0.9 * s] }, // Ph-C3
        { type: 'carbon',   pos: [barb[4].x + 3.6 * s, barb[4].y,           0.5 * s] }, // Ph-C4
        { type: 'carbon',   pos: [barb[4].x + 3.0 * s, barb[4].y - 0.7 * s, 0.1 * s] }, // Ph-C5
        { type: 'carbon',   pos: [barb[4].x + 1.9 * s, barb[4].y - 0.7 * s, 0.0 * s] }, // Ph-C6

        // Ethyl group on C5: -CH2-CH3
        { type: 'carbon',   pos: [barb[4].x - 0.3 * s, barb[4].y - 1.4 * s, -0.6 * s] }, // C-alpha
        { type: 'carbon',   pos: [barb[4].x - 0.5 * s, barb[4].y - 2.6 * s, -1.0 * s] }, // C-beta (CH3)
    ];
    // Indices:   0     1     2     3     4     5     6     7     8     9    10    11    12    13    14    15    16

    addAtoms(group, atoms);

    const pairs = [
        // Barbiturate ring
        [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],
        // Carbonyls
        [1,6],[3,7],[5,8],
        // C5 → Phenyl
        [4,9],
        // Phenyl ring
        [9,10],[10,11],[11,12],[12,13],[13,14],[14,9],
        // C5 → Ethyl
        [4,15],[15,16],
    ];
    addBonds(group, atoms, pairs);

    group.rotation.x = -0.3;
    return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. STRYCHNINE  C21H22N2O2
//    Very complex cage alkaloid — 7 fused rings.
//    We represent the main scaffold with deterministic atom positions
//    derived from the known crystal structure layout (stylised for AR).
// ═══════════════════════════════════════════════════════════════════════════
export function buildStrychnineMolecule() {
    const group = new THREE.Group();
    const s = 0.42;

    // Strychnine scaffold — hand-placed atoms
    // based on the 3D shape: indole fused with piperidine + oxepane cage
    const atoms = [
        // Indole bicyclic part (aromatic, planar)
        { type: 'carbon',   pos: [ 0.00,  2.80, 0.00].map(v=>v*s) }, // 0  C2  (indole)
        { type: 'carbon',   pos: [ 1.20,  2.20, 0.00].map(v=>v*s) }, // 1  C3
        { type: 'carbon',   pos: [ 1.40,  0.80, 0.00].map(v=>v*s) }, // 2  C4
        { type: 'carbon',   pos: [ 0.30, -0.10, 0.00].map(v=>v*s) }, // 3  C5  (junction)
        { type: 'carbon',   pos: [-1.00,  0.40, 0.00].map(v=>v*s) }, // 4  C6
        { type: 'carbon',   pos: [-1.20,  1.80, 0.00].map(v=>v*s) }, // 5  C7
        { type: 'carbon',   pos: [ 2.60,  0.20, 0.00].map(v=>v*s) }, // 6  C8
        { type: 'carbon',   pos: [ 2.80, -1.20, 0.10].map(v=>v*s) }, // 7  C9
        { type: 'carbon',   pos: [ 1.70, -2.00, 0.20].map(v=>v*s) }, // 8  C10
        { type: 'carbon',   pos: [ 0.50, -1.50, 0.10].map(v=>v*s) }, // 9  C11

        // Piperidine + Aliphatic cage (3D, lifts out of plane)
        { type: 'nitrogen', pos: [-0.30, -2.40, 0.40].map(v=>v*s) }, // 10 N4   tertiary
        { type: 'carbon',   pos: [-1.60, -2.00, 0.80].map(v=>v*s) }, // 11 C15
        { type: 'carbon',   pos: [-2.40, -1.00, 0.60].map(v=>v*s) }, // 12 C16
        { type: 'carbon',   pos: [-2.20,  0.00,-0.20].map(v=>v*s) }, // 13 C17
        { type: 'carbon',   pos: [-1.00, -0.90,-0.60].map(v=>v*s) }, // 14 C18
        { type: 'nitrogen', pos: [-0.20, -2.40,-0.80].map(v=>v*s) }, // 15 N1  (aminal)
        { type: 'carbon',   pos: [ 1.00, -2.90,-0.60].map(v=>v*s) }, // 16 C20
        { type: 'carbon',   pos: [ 1.80, -2.00,-0.30].map(v=>v*s) }, // 17 C21

        // Ether bridge + oxepane oxygens
        { type: 'oxygen',   pos: [-2.80,  1.00,-0.80].map(v=>v*s) }, // 18 O1  (ether)
        { type: 'oxygen',   pos: [ 0.50, -3.80,-1.20].map(v=>v*s) }, // 19 O2  (lactam)

        // A couple more cage carbons for visual complexity
        { type: 'carbon',   pos: [-1.80, -3.20, 0.20].map(v=>v*s) }, // 20 C14
        { type: 'carbon',   pos: [ 0.00, -0.80,-1.20].map(v=>v*s) }, // 21 C13
    ];
    // Total: 22 atoms, close to real 23 heavy atoms

    addAtoms(group, atoms);

    const pairs = [
        // Indole aromatic ring (6-mem)
        [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],
        // Indole 5-mem ring
        [2,6],[6,7],[7,8],[8,9],[9,3],
        // Piperidine ring
        [9,10],[10,11],[11,12],[12,13],[13,14],[14,9],
        // Cage bridges
        [10,15],[15,16],[16,17],[17,8],
        // Ether bridge
        [13,18],[18,12],
        // Lactam
        [15,19],[19,16],
        // Extra cage
        [11,20],[10,20],
        [14,21],[15,21],
    ];

    addBonds(group, atoms, pairs);

    group.rotation.x = 0.4;
    group.rotation.y = 0.2;
    return group;
}
