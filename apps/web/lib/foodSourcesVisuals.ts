import * as THREE from 'three';

export const FOOD_VISUAL_IDS = [
  'rice',
  'tomato',
  'dal',
  'milk',
  'egg',
  'honey',
  'fish',
  'mushroom',
] as const;

export type FoodVisualId = (typeof FOOD_VISUAL_IDS)[number];

export interface FoodTokenVisual {
  root: THREE.Group;
  feedbackMaterial: THREE.MeshStandardMaterial;
}

function standard(color: THREE.ColorRepresentation, roughness = 0.62, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  scale?: [number, number, number],
  rotation?: [number, number, number],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addBowl(parent: THREE.Object3D, color: THREE.ColorRepresentation) {
  const bowl = addMesh(
    parent,
    new THREE.CylinderGeometry(0.2, 0.15, 0.13, 32),
    standard(color, 0.72),
    [0, 0.11, 0],
  );
  const rim = addMesh(
    parent,
    new THREE.TorusGeometry(0.2, 0.018, 10, 32),
    standard(0xf0c28b, 0.55),
    [0, 0.18, 0],
    undefined,
    [Math.PI / 2, 0, 0],
  );
  bowl.name = 'serving-bowl';
  rim.name = 'bowl-rim';
}

function addRice(parent: THREE.Object3D) {
  addBowl(parent, 0x8b4f2f);
  const grainGeometry = new THREE.SphereGeometry(0.026, 8, 6);
  const grainMaterial = standard(0xfff4d7, 0.9);
  for (let index = 0; index < 22; index += 1) {
    const angle = index * 2.399;
    const radius = 0.04 + (index % 5) * 0.028;
    addMesh(
      parent,
      grainGeometry,
      grainMaterial,
      [Math.cos(angle) * radius, 0.19 + (index % 3) * 0.018, Math.sin(angle) * radius],
      [1.55, 0.58, 0.72],
      [0, angle, (index % 4) * 0.35],
    ).name = 'rice-grain';
  }
}

function addTomato(parent: THREE.Object3D) {
  addMesh(
    parent,
    new THREE.SphereGeometry(0.21, 32, 20),
    standard(0xd92d27, 0.38),
    [0, 0.22, 0],
    [1, 0.88, 1],
  ).name = 'tomato-fruit';
  const leafMaterial = standard(0x2f7d32, 0.72);
  for (let index = 0; index < 5; index += 1) {
    const leaf = addMesh(
      parent,
      new THREE.ConeGeometry(0.055, 0.17, 5),
      leafMaterial,
      [0, 0.405, 0],
      [1, 1, 0.34],
      [Math.PI / 2, 0, (index / 5) * Math.PI * 2],
    );
    leaf.name = 'tomato-calyx';
  }
  addMesh(parent, new THREE.CylinderGeometry(0.018, 0.024, 0.1, 8), leafMaterial, [0, 0.45, 0]).name = 'tomato-stem';
}

function addDal(parent: THREE.Object3D) {
  addBowl(parent, 0x386a8f);
  const lentilGeometry = new THREE.SphereGeometry(0.025, 8, 6);
  const lentilMaterial = standard(0xf4a621, 0.82);
  for (let index = 0; index < 25; index += 1) {
    const angle = index * 2.12;
    const radius = 0.035 + (index % 6) * 0.024;
    addMesh(
      parent,
      lentilGeometry,
      lentilMaterial,
      [Math.cos(angle) * radius, 0.19 + (index % 3) * 0.016, Math.sin(angle) * radius],
      [1, 0.42, 1],
      [0, angle, 0],
    ).name = 'dal-lentil';
  }
}

function addMilk(parent: THREE.Object3D) {
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfefff,
    transparent: true,
    opacity: 0.34,
    roughness: 0.08,
    transmission: 0.4,
    side: THREE.DoubleSide,
  });
  addMesh(parent, new THREE.CylinderGeometry(0.15, 0.12, 0.36, 32, 1, true), glass, [0, 0.24, 0]).name = 'milk-glass';
  addMesh(parent, new THREE.CylinderGeometry(0.142, 0.112, 0.29, 32), standard(0xfffdf4, 0.3), [0, 0.215, 0]).name = 'milk';
  addMesh(
    parent,
    new THREE.TorusGeometry(0.15, 0.012, 8, 32),
    standard(0xe5f6ff, 0.22),
    [0, 0.42, 0],
    undefined,
    [Math.PI / 2, 0, 0],
  ).name = 'glass-rim';
}

function addEgg(parent: THREE.Object3D) {
  addMesh(
    parent,
    new THREE.SphereGeometry(0.2, 32, 24),
    standard(0xfff8df, 0.48),
    [0, 0.24, 0],
    [0.76, 1.15, 0.76],
    [0, 0, -0.12],
  ).name = 'egg-shell';
  addMesh(parent, new THREE.TorusGeometry(0.13, 0.025, 10, 28), standard(0xc28b55, 0.8), [0, 0.055, 0], undefined, [Math.PI / 2, 0, 0]).name = 'egg-cup';
}

function addHoney(parent: THREE.Object3D) {
  const honeyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe89212,
    emissive: 0x5b2600,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.86,
    roughness: 0.28,
    transmission: 0.08,
  });
  addMesh(parent, new THREE.CylinderGeometry(0.16, 0.18, 0.32, 10), honeyMaterial, [0, 0.22, 0]).name = 'honey-jar';
  addMesh(parent, new THREE.CylinderGeometry(0.17, 0.17, 0.055, 24), standard(0xe3b341, 0.42, 0.18), [0, 0.405, 0]).name = 'honey-lid';
  addMesh(parent, new THREE.BoxGeometry(0.22, 0.105, 0.012), standard(0xffefd0, 0.75), [0, 0.23, 0.17]).name = 'honey-label';
}

function addFish(parent: THREE.Object3D) {
  const bodyMaterial = standard(0x5ba8c8, 0.38, 0.08);
  addMesh(parent, new THREE.SphereGeometry(0.2, 28, 18), bodyMaterial, [0, 0.23, 0], [1.28, 0.65, 0.52]).name = 'fish-body';
  addMesh(parent, new THREE.ConeGeometry(0.17, 0.23, 3), standard(0x397b9b, 0.48), [-0.28, 0.23, 0], undefined, [0, 0, Math.PI / 2]).name = 'fish-tail';
  addMesh(parent, new THREE.ConeGeometry(0.075, 0.16, 3), standard(0x397b9b, 0.48), [0, 0.38, 0], undefined, [0, 0, Math.PI]).name = 'fish-fin';
  addMesh(parent, new THREE.SphereGeometry(0.025, 12, 8), standard(0x081827, 0.25), [0.17, 0.27, 0.09]).name = 'fish-eye';
  addMesh(parent, new THREE.SphereGeometry(0.009, 8, 6), standard(0xffffff, 0.25), [0.178, 0.278, 0.109]).name = 'fish-eye-glint';
}

function addMushroom(parent: THREE.Object3D) {
  addMesh(parent, new THREE.CylinderGeometry(0.07, 0.105, 0.27, 18), standard(0xf0d7b0, 0.78), [0, 0.19, 0]).name = 'mushroom-stem';
  addMesh(parent, new THREE.SphereGeometry(0.2, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), standard(0xa64b35, 0.68), [0, 0.34, 0], [1.15, 0.7, 1.15]).name = 'mushroom-cap';
  const spotMaterial = standard(0xf7dfb6, 0.72);
  for (const [x, y, z] of [[-0.08, 0.445, 0.07], [0.07, 0.46, 0.02], [0.02, 0.43, -0.1]] as const) {
    addMesh(parent, new THREE.SphereGeometry(0.025, 10, 6), spotMaterial, [x, y, z], [1, 0.35, 1]).name = 'mushroom-spot';
  }
}

const FOOD_BUILDERS: Record<FoodVisualId, (parent: THREE.Object3D) => void> = {
  rice: addRice,
  tomato: addTomato,
  dal: addDal,
  milk: addMilk,
  egg: addEgg,
  honey: addHoney,
  fish: addFish,
  mushroom: addMushroom,
};

export function createFoodTokenVisual(id: FoodVisualId): FoodTokenVisual {
  const root = new THREE.Group();
  root.name = `food-token-${id}`;
  root.userData.foodVisualId = id;

  const feedbackMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9c46a,
    emissive: 0x000000,
    roughness: 0.48,
    metalness: 0.08,
  });
  const pedestal = addMesh(root, new THREE.CylinderGeometry(0.34, 0.38, 0.075, 32), feedbackMaterial, [0, 0.025, 0]);
  pedestal.name = `${id}-feedback-pedestal`;

  FOOD_BUILDERS[id](root);
  return { root, feedbackMaterial };
}

function addTree(parent: THREE.Object3D, x: number, z: number, scale: number) {
  addMesh(parent, new THREE.CylinderGeometry(0.09 * scale, 0.13 * scale, 0.75 * scale, 10), standard(0x74452a, 0.88), [x, 0.37 * scale, z]);
  for (const [dx, dy, dz] of [[0, 0, 0], [-0.18, -0.04, 0.04], [0.16, -0.02, -0.03]] as const) {
    addMesh(parent, new THREE.SphereGeometry(0.32 * scale, 18, 12), standard(0x3f7c3e, 0.92), [x + dx * scale, 0.92 * scale + dy * scale, z + dz * scale]);
  }
}

export function createFoodSourcesEnvironment() {
  const root = new THREE.Group();
  root.name = 'food-sources-environment';

  const ground = addMesh(root, new THREE.CircleGeometry(10, 72), standard(0x6d8f45, 0.98), [0, -0.02, 0], undefined, [-Math.PI / 2, 0, 0]);
  ground.receiveShadow = true;
  ground.castShadow = false;

  const path = addMesh(root, new THREE.PlaneGeometry(2.4, 8), standard(0xc9a66b, 0.96), [0, 0.005, -4.9], undefined, [-Math.PI / 2, 0, 0]);
  path.receiveShadow = true;
  path.castShadow = false;

  // A small farm stall makes the sorting table feel connected to real food sources.
  addMesh(root, new THREE.BoxGeometry(6.2, 0.16, 0.45), standard(0x7d4b2f, 0.82), [0, 1.58, -2.85]);
  addMesh(root, new THREE.BoxGeometry(0.18, 1.6, 0.18), standard(0x5c3825, 0.9), [-2.72, 0.78, -2.78]);
  addMesh(root, new THREE.BoxGeometry(0.18, 1.6, 0.18), standard(0x5c3825, 0.9), [2.72, 0.78, -2.78]);
  for (let index = 0; index < 7; index += 1) {
    addMesh(root, new THREE.BoxGeometry(0.82, 0.08, 1.1), standard(index % 2 ? 0xc06b3e : 0xd99a52, 0.82), [-2.47 + index * 0.82, 1.72, -2.8], undefined, [0, 0, index % 2 ? 0.05 : -0.05]);
  }

  addTree(root, -4.7, -3.9, 1.15);
  addTree(root, 4.8, -4.2, 1.05);
  addTree(root, -5.1, 1.5, 0.9);
  addTree(root, 5.2, 1.8, 0.92);

  const cropMaterial = standard(0x84a93b, 0.9);
  for (let row = 0; row < 4; row += 1) {
    for (let plant = 0; plant < 9; plant += 1) {
      const x = -4.2 + plant * 0.45;
      const z = -1.1 + row * 0.45;
      addMesh(root, new THREE.ConeGeometry(0.075, 0.34, 5), cropMaterial, [x, 0.17, z]);
    }
  }

  return root;
}
