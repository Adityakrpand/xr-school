import * as THREE from "three";
import type { PloughingStageId, PloughingState } from "./ploughingLesson";

export function createPloughingScene(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = "ploughing-field";
  scene.add(root);
  const targets = new Map<string, THREE.Object3D>();
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const mat = (
    colour: THREE.ColorRepresentation,
    roughness = 0.78,
    metalness = 0,
  ) => {
    const value = new THREE.MeshStandardMaterial({
      color: colour,
      roughness,
      metalness,
    });
    materials.add(value);
    return value;
  };
  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = root,
    position: [number, number, number] = [0, 0, 0],
  ) => {
    geometries.add(geometry);
    materials.add(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addInstanced = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
    parent: THREE.Object3D = root,
  ) => {
    geometries.add(geometry);
    materials.add(material);
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const group = (
    name: string,
    x = 0,
    y = 0,
    z = 0,
    parent: THREE.Object3D = root,
  ) => {
    const value = new THREE.Group();
    value.name = name;
    value.position.set(x, y, z);
    parent.add(value);
    return value;
  };
  const ellipsoid = (
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number],
    segments = 24,
  ) => {
    const mesh = add(
      new THREE.SphereGeometry(radius, segments, Math.max(12, segments / 2)),
      material,
      parent,
      position,
    );
    mesh.scale.set(...scale);
    return mesh;
  };
  const cylinderBetween = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    radialSegments = 12,
  ) => {
    const direction = end.clone().sub(start);
    const mesh = add(
      new THREE.CylinderGeometry(
        radius * 0.9,
        radius,
        direction.length(),
        radialSegments,
      ),
      material,
      parent,
      start.clone().add(end).multiplyScalar(0.5).toArray() as [
        number,
        number,
        number,
      ],
    );
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    return mesh;
  };
  const target = (id: string, object: THREE.Object3D) => {
    targets.set(id, object);
    object.traverse((child) => {
      child.userData.targetId = id;
    });
    return object;
  };
  const soil = mat(0x745036, 1);
  const looseSoil = mat(0x6b4024, 1);
  const fineSoil = mat(0x80583a, 1);
  const soilMaterials = [soil, looseSoil, fineSoil];
  if (typeof document !== "undefined" && typeof Image !== "undefined") {
    const colourTexture = new THREE.TextureLoader().load(
      "/images/ploughing-soil-preparation/soil-albedo-v2.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3.5, 3.5);
        const heightTexture = texture.clone();
        heightTexture.colorSpace = THREE.NoColorSpace;
        heightTexture.needsUpdate = true;
        textures.add(heightTexture);
        for (const material of soilMaterials) {
          material.map = texture;
          material.bumpMap = heightTexture;
          material.bumpScale = material === fineSoil ? 0.035 : 0.065;
          material.color.set(material === looseSoil ? 0xe0b58d : 0xffffff);
          material.needsUpdate = true;
        }
      },
    );
    textures.add(colourTexture);
  }

  const field = group("field");
  const fieldMesh = add(new THREE.PlaneGeometry(10, 7, 40, 28), soil, field);
  fieldMesh.rotation.x = -Math.PI / 2;
  target("hard-soil", fieldMesh);
  const hardClods = group("hard-clods");
  const clodInstances = addInstanced(
    new THREE.DodecahedronGeometry(0.13, 1),
    soil,
    72,
    hardClods,
  );
  const clodTransform = new THREE.Object3D();
  for (let i = 0; i < clodInstances.count; i++) {
    const row = Math.floor(i / 12);
    const column = i % 12;
    const scale = 0.55 + ((i * 17) % 13) / 18;
    clodTransform.position.set(
      -4.45 + column * 0.8 + Math.sin(i * 2.17) * 0.16,
      0.045 + scale * 0.035,
      -2.75 + row * 1.05 + Math.cos(i * 1.31) * 0.2,
    );
    clodTransform.rotation.set(i * 0.31, i * 0.67, i * 0.19);
    clodTransform.scale.set(scale, scale * 0.55, scale * 0.85);
    clodTransform.updateMatrix();
    clodInstances.setMatrixAt(i, clodTransform.matrix);
  }
  clodInstances.instanceMatrix.needsUpdate = true;

  const stubble = addInstanced(
    new THREE.CylinderGeometry(0.007, 0.011, 0.18, 5),
    mat(0xb79858, 0.94),
    96,
    hardClods,
  );
  const stubbleTransform = new THREE.Object3D();
  for (let i = 0; i < stubble.count; i++) {
    stubbleTransform.position.set(
      -4.6 + ((i * 41) % 94) / 10,
      0.085,
      -3.05 + ((i * 67) % 61) / 10,
    );
    stubbleTransform.rotation.set(
      Math.sin(i) * 0.18,
      i * 0.7,
      Math.cos(i * 0.7) * 0.22,
    );
    stubbleTransform.scale.setScalar(0.7 + (i % 5) * 0.1);
    stubbleTransform.updateMatrix();
    stubble.setMatrixAt(i, stubbleTransform.matrix);
  }
  stubble.instanceMatrix.needsUpdate = true;

  const featuredClod = group("featured-soil-clod", -0.3, 0.13, 0.45);
  const featuredClodMesh = add(
    new THREE.DodecahedronGeometry(0.3, 2),
    soil,
    featuredClod,
  );
  featuredClodMesh.scale.set(1.3, 0.67, 1);
  featuredClodMesh.rotation.set(0.12, -0.34, 0.08);
  target("soil-clod", featuredClod);

  const skin = mat(0x8f5436, 0.72);
  const shirt = mat(0xe3d9be, 0.96);
  const indigo = mat(0x263f57, 0.9);
  const leather = mat(0x3a2418, 0.9);
  const farmer = group("farmer", -2.1, 0, -0.15);
  farmer.rotation.y = -0.08;
  ellipsoid(0.37, shirt, farmer, [0, 1.08, 0], [0.72, 1.05, 0.48], 28);
  add(
    new THREE.CylinderGeometry(0.23, 0.27, 0.23, 20),
    shirt,
    farmer,
    [0, 0.76, 0],
  );
  for (const x of [-0.12, 0.12]) {
    cylinderBetween(
      new THREE.Vector3(x, 0.74, 0),
      new THREE.Vector3(x * 1.06, 0.25, 0.01),
      0.065,
      indigo,
      farmer,
    );
    ellipsoid(
      0.08,
      leather,
      farmer,
      [x * 1.07, 0.07, 0.055],
      [1.05, 0.45, 1.65],
      16,
    );
  }
  const head = ellipsoid(
    0.18,
    skin,
    farmer,
    [0, 1.62, 0],
    [0.86, 1.06, 0.9],
    30,
  );
  head.rotation.x = -0.04;
  ellipsoid(0.045, skin, farmer, [-0.16, 1.63, 0], [0.55, 1, 0.5], 14);
  ellipsoid(0.045, skin, farmer, [0.16, 1.63, 0], [0.55, 1, 0.5], 14);
  const turbanMaterial = mat(0xc5532e, 0.91);
  const turbanCrown = ellipsoid(
    0.2,
    turbanMaterial,
    farmer,
    [0, 1.79, -0.005],
    [1.03, 0.55, 1.02],
    28,
  );
  turbanCrown.rotation.z = 0.05;
  for (let i = 0; i < 4; i++) {
    const wrap = add(
      new THREE.TorusGeometry(0.15 + i * 0.008, 0.018, 8, 30),
      turbanMaterial,
      farmer,
      [0, 1.72 + i * 0.035, 0],
    );
    wrap.rotation.x = Math.PI / 2;
  }
  const dark = mat(0x241a15, 0.92);
  for (const x of [-0.06, 0.06])
    ellipsoid(0.018, dark, farmer, [x, 1.64, 0.155], [1, 0.65, 0.55], 12);
  const nose = add(
    new THREE.ConeGeometry(0.025, 0.08, 12),
    skin,
    farmer,
    [0, 1.59, 0.19],
  );
  nose.rotation.x = Math.PI / 2;
  const moustache = add(
    new THREE.TorusGeometry(0.055, 0.012, 6, 20, Math.PI),
    dark,
    farmer,
    [0, 1.545, 0.17],
  );
  moustache.rotation.z = Math.PI;
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Vector3(side * 0.22, 1.28, 0);
    const elbow = new THREE.Vector3(side * 0.33, 1.02, 0.08);
    const hand = new THREE.Vector3(side * 0.24, 0.82, 0.17);
    cylinderBetween(shoulder, elbow, 0.055, shirt, farmer);
    cylinderBetween(elbow, hand, 0.045, skin, farmer);
    ellipsoid(
      0.06,
      skin,
      farmer,
      hand.toArray() as [number, number, number],
      [0.65, 1.05, 0.55],
      14,
    );
  }
  const scarf = add(
    new THREE.TorusGeometry(0.2, 0.028, 8, 28, Math.PI * 1.6),
    mat(0xc7a43d, 0.93),
    farmer,
    [0, 1.36, 0],
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.rotation.z = -0.3;
  target("farmer", farmer);

  const traditional = group("traditional-team");
  traditional.rotation.y = -0.82;
  const wood = mat(0x7d4624, 0.86);
  const horn = mat(0xe3d2a6, 0.74);
  const bullockMat = mat(0xc9b99b, 0.94);
  const bullockDark = mat(0x4d3b30, 0.94);
  const bullocks = group("bullocks", -0.25, 0, -0.6, traditional);
  const bullockLegs: THREE.Group[] = [];
  const bullockTails: THREE.Mesh[] = [];
  for (const x of [-0.58, 0.58]) {
    const animal = group(`bullock-${x}`, x, 0, 0, bullocks);
    ellipsoid(0.52, bullockMat, animal, [0, 0.86, 0], [0.72, 0.78, 1.45], 30);
    ellipsoid(
      0.34,
      bullockMat,
      animal,
      [0, 1.11, -0.26],
      [0.92, 0.7, 1.02],
      26,
    );
    cylinderBetween(
      new THREE.Vector3(0, 0.98, -0.48),
      new THREE.Vector3(0, 1.02, -0.72),
      0.23,
      bullockMat,
      animal,
      18,
    );
    const head = ellipsoid(
      0.3,
      bullockMat,
      animal,
      [0, 1.02, -0.83],
      [0.75, 0.9, 1.08],
      28,
    );
    head.rotation.x = -0.1;
    for (const side of [-1, 1]) {
      const coatPatch = ellipsoid(
        0.29,
        bullockDark,
        animal,
        [side * 0.34, 0.92, 0.08],
        [0.16, 0.74, 1.28],
        20,
      );
      coatPatch.rotation.z = side * 0.12;
    }
    ellipsoid(
      0.2,
      bullockMat,
      animal,
      [0, 0.82, -0.57],
      [0.72, 0.84, 0.42],
      20,
    );
    ellipsoid(
      0.19,
      bullockDark,
      animal,
      [0, 0.92, -1.1],
      [0.82, 0.62, 0.72],
      22,
    );
    for (const side of [-1, 1]) {
      const ear = ellipsoid(
        0.13,
        bullockMat,
        animal,
        [side * 0.24, 1.12, -0.84],
        [1.2, 0.34, 0.58],
        18,
      );
      ear.rotation.z = side * 0.2;
      ellipsoid(
        0.023,
        bullockDark,
        animal,
        [side * 0.12, 1.09, -1.08],
        [1, 0.72, 0.58],
        12,
      );
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.12, 1.23, -0.92),
        new THREE.Vector3(side * 0.22, 1.39, -0.94),
        new THREE.Vector3(side * 0.32, 1.42, -0.88),
        new THREE.Vector3(side * 0.37, 1.35, -0.82),
      ]);
      add(new THREE.TubeGeometry(curve, 24, 0.024, 8, false), horn, animal);
    }
    for (const legX of [-0.2, 0.2]) {
      for (const legZ of [-0.43, 0.43]) {
        const leg = group(`leg-${legX}-${legZ}`, 0, 0, 0, animal);
        const stride = legZ < 0 ? 0.035 : -0.035;
        cylinderBetween(
          new THREE.Vector3(legX, 0.68, legZ),
          new THREE.Vector3(legX + stride, 0.36, legZ + 0.02),
          0.075,
          bullockMat,
          leg,
        );
        cylinderBetween(
          new THREE.Vector3(legX + stride, 0.36, legZ + 0.02),
          new THREE.Vector3(legX - stride, 0.1, legZ + 0.06),
          0.058,
          bullockMat,
          leg,
        );
        ellipsoid(
          0.085,
          bullockDark,
          leg,
          [legX - stride, 0.055, legZ + 0.045],
          [0.75, 0.45, 1.05],
          14,
        );
        leg.userData.phase = bullockLegs.length % 2 ? Math.PI : 0;
        bullockLegs.push(leg);
      }
    }
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1, 0.68),
      new THREE.Vector3(0.03, 0.83, 0.91),
      new THREE.Vector3(-0.02, 0.58, 1.0),
      new THREE.Vector3(0.06, 0.42, 0.96),
    ]);
    const tail = add(
      new THREE.TubeGeometry(tailCurve, 24, 0.022, 7, false),
      bullockDark,
      animal,
    );
    bullockTails.push(tail);
    add(
      new THREE.SphereGeometry(0.055, 12, 8),
      bullockDark,
      animal,
      [0.06, 0.4, 0.96],
    );
    const shoulderBand = add(
      new THREE.TorusGeometry(0.32, 0.035, 8, 30, Math.PI * 1.25),
      mat(0x9b3326, 0.78),
      animal,
      [0, 1.0, -0.4],
    );
    shoulderBand.rotation.x = Math.PI / 2;
  }
  add(new THREE.BoxGeometry(1.65, 0.1, 0.12), wood, bullocks, [0, 1.24, -0.72]);
  for (const x of [-0.58, 0.58]) {
    cylinderBetween(
      new THREE.Vector3(x, 1.24, -0.72),
      new THREE.Vector3(x, 1.05, -0.6),
      0.018,
      mat(0x8b6a3d, 1),
      bullocks,
      7,
    );
  }
  target("bullocks", bullocks);
  const plough = group("traditional-plough", -0.25, 0, 0.72, traditional);
  cylinderBetween(
    new THREE.Vector3(0, 0.26, 0.58),
    new THREE.Vector3(0, 1.23, -1.31),
    0.045,
    wood,
    plough,
    12,
  );
  cylinderBetween(
    new THREE.Vector3(0, 0.22, 0.45),
    new THREE.Vector3(-0.2, 1.08, 0.92),
    0.038,
    wood,
    plough,
    10,
  );
  cylinderBetween(
    new THREE.Vector3(-0.2, 1.08, 0.92),
    new THREE.Vector3(0.16, 1.1, 0.92),
    0.032,
    wood,
    plough,
    10,
  );
  const iron = mat(0x454b4b, 0.34, 0.72);
  const blade = add(
    new THREE.ConeGeometry(0.2, 0.52, 4),
    iron,
    plough,
    [0, 0.16, 0.52],
  );
  blade.rotation.x = Math.PI / 2;
  blade.scale.z = 0.58;
  const share = add(
    new THREE.BoxGeometry(0.48, 0.055, 0.18),
    iron,
    plough,
    [0, 0.09, 0.6],
  );
  share.rotation.y = -0.08;
  cylinderBetween(
    new THREE.Vector3(0, 1.23, -1.31),
    new THREE.Vector3(0, 1.23, -1.46),
    0.022,
    mat(0x846538, 1),
    plough,
    7,
  );
  target("plough", plough);
  const turned = group("turned-soil", 1.55, 0.02, 0.1, traditional);
  const turnedPatch = add(
    new THREE.PlaneGeometry(1.25, 3.2),
    looseSoil,
    turned,
    [0, 0.015, 0],
  );
  turnedPatch.rotation.x = -Math.PI / 2;
  const turnedClods = addInstanced(
    new THREE.DodecahedronGeometry(0.105, 1),
    looseSoil,
    64,
    turned,
  );
  const turnedTransform = new THREE.Object3D();
  for (let i = 0; i < turnedClods.count; i++) {
    const row = i % 4;
    const point = Math.floor(i / 4);
    turnedTransform.position.set(
      -0.47 + row * 0.31 + Math.sin(i * 1.7) * 0.035,
      0.055 + (i % 3) * 0.014,
      -1.47 + point * 0.195,
    );
    turnedTransform.rotation.set(i * 0.31, i * 0.79, i * 0.17);
    turnedTransform.scale.set(
      0.72 + (i % 4) * 0.08,
      0.5 + (i % 3) * 0.07,
      0.85 + (i % 5) * 0.06,
    );
    turnedTransform.updateMatrix();
    turnedClods.setMatrixAt(i, turnedTransform.matrix);
  }
  turnedClods.instanceMatrix.needsUpdate = true;
  target("turned-soil", turned);
  const furrows = group("furrows");
  const furrowPasses: THREE.Group[] = [];
  const furrowClodGeometry = new THREE.DodecahedronGeometry(0.095, 1);
  for (let i = 0; i < 3; i++) {
    const pass = group(`furrow-pass-${i + 1}`, (i - 1) * 0.78, 0, 0, furrows);
    const trough = add(
      new THREE.PlaneGeometry(0.42, 5.2),
      looseSoil,
      pass,
      [0, 0.012, 0],
    );
    trough.rotation.x = -Math.PI / 2;
    const ridgeClods = addInstanced(furrowClodGeometry, looseSoil, 52, pass);
    const ridgeTransform = new THREE.Object3D();
    for (let clodIndex = 0; clodIndex < ridgeClods.count; clodIndex++) {
      const side = clodIndex % 2 ? -1 : 1;
      const point = Math.floor(clodIndex / 2);
      ridgeTransform.position.set(
        side * (0.22 + Math.sin(clodIndex * 1.41 + i) * 0.035),
        0.055 + ((clodIndex + i) % 3) * 0.016,
        -2.48 + point * 0.195,
      );
      ridgeTransform.rotation.set(
        clodIndex * 0.21,
        clodIndex * 0.57,
        clodIndex * 0.13,
      );
      ridgeTransform.scale.set(
        0.75 + (clodIndex % 4) * 0.07,
        0.5 + (clodIndex % 3) * 0.08,
        0.86 + (clodIndex % 5) * 0.055,
      );
      ridgeTransform.updateMatrix();
      ridgeClods.setMatrixAt(clodIndex, ridgeTransform.matrix);
    }
    ridgeClods.instanceMatrix.needsUpdate = true;
    pass.visible = false;
    pass.userData.furrowIndex = i;
    furrowPasses.push(pass);
  }
  target("furrow", furrows);

  const modern = group("modern-team");
  modern.rotation.y = -0.42;
  const tractor = group("tractor", -0.2, 0, -0.1, modern);
  const tractorGreen = mat(0x235b38, 0.35, 0.18);
  const tractorDarkGreen = mat(0x163d2a, 0.42, 0.16);
  const tyre = mat(0x171a18, 0.97);
  const paintedMetal = mat(0xc39a2d, 0.42, 0.35);
  add(
    new THREE.BoxGeometry(1.1, 0.22, 1.55),
    tractorDarkGreen,
    tractor,
    [0, 0.56, -0.02],
  );
  const bonnet = add(
    new THREE.BoxGeometry(0.78, 0.5, 1.0, 4, 2, 5),
    tractorGreen,
    tractor,
    [0, 0.88, -0.48],
  );
  bonnet.rotation.x = -0.025;
  add(
    new THREE.BoxGeometry(0.8, 0.32, 0.07),
    mat(0x27322f, 0.45, 0.58),
    tractor,
    [0, 0.84, -0.995],
  );
  const lampMaterial = mat(0xffe6a1, 0.25, 0.15);
  lampMaterial.emissive.set(0xffd477);
  lampMaterial.emissiveIntensity = 0.85;
  for (const x of [-0.25, 0.25])
    add(
      new THREE.CylinderGeometry(0.085, 0.085, 0.045, 20),
      lampMaterial,
      tractor,
      [x, 0.93, -1.04],
    ).rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i++)
    add(
      new THREE.BoxGeometry(0.025, 0.2, 0.018),
      mat(0x101615, 0.65, 0.55),
      tractor,
      [-0.23 + i * 0.077, 0.8, -1.035],
    );

  const cabin = group("tractor-cabin", 0, 0, 0.42, tractor);
  add(
    new THREE.BoxGeometry(0.78, 0.11, 0.78),
    tractorDarkGreen,
    cabin,
    [0, 1.65, 0],
  );
  for (const x of [-0.34, 0.34]) {
    for (const z of [-0.31, 0.31]) {
      cylinderBetween(
        new THREE.Vector3(x, 0.76, z),
        new THREE.Vector3(x, 1.61, z),
        0.035,
        tractorDarkGreen,
        cabin,
        10,
      );
    }
  }
  const glass = mat(0x8fc5cf, 0.12, 0.08);
  glass.transparent = true;
  glass.opacity = 0.38;
  glass.depthWrite = false;
  add(new THREE.BoxGeometry(0.62, 0.62, 0.018), glass, cabin, [0, 1.25, -0.32]);
  add(
    new THREE.BoxGeometry(0.42, 0.52, 0.36),
    mat(0x4a3829, 0.93),
    cabin,
    [0, 0.93, 0.13],
  );
  const steering = add(
    new THREE.TorusGeometry(0.16, 0.018, 8, 28),
    mat(0x252b29, 0.82, 0.3),
    cabin,
    [0, 1.12, -0.21],
  );
  steering.rotation.x = -0.5;
  cylinderBetween(
    new THREE.Vector3(0, 0.9, -0.1),
    new THREE.Vector3(0, 1.11, -0.2),
    0.025,
    mat(0x323a38, 0.45, 0.55),
    cabin,
    9,
  );

  const tractorWheels: THREE.Group[] = [];
  const wheelSpecs = [
    [-0.62, 0.38, 0.48],
    [0.62, 0.38, 0.48],
    [-0.52, -0.67, 0.32],
    [0.52, -0.67, 0.32],
  ] as const;
  for (const [x, z, radius] of wheelSpecs) {
    const wheel = group("tractor-wheel", x, radius, z, tractor);
    const sidewall = add(
      new THREE.TorusGeometry(radius * 0.72, radius * 0.28, 12, 28),
      tyre,
      wheel,
    );
    sidewall.rotation.y = Math.PI / 2;
    for (let treadIndex = 0; treadIndex < 12; treadIndex++) {
      const angle = (treadIndex / 12) * Math.PI * 2;
      const tread = add(
        new THREE.BoxGeometry(0.24, radius * 0.18, radius * 0.34),
        tyre,
        wheel,
        [0, Math.cos(angle) * radius * 0.9, Math.sin(angle) * radius * 0.9],
      );
      tread.rotation.x = angle;
    }
    const hub = add(
      new THREE.CylinderGeometry(radius * 0.38, radius * 0.38, 0.25, 20),
      paintedMetal,
      wheel,
    );
    hub.rotation.z = Math.PI / 2;
    const axleCap = add(
      new THREE.CylinderGeometry(radius * 0.13, radius * 0.13, 0.27, 16),
      mat(0x38413d, 0.4, 0.72),
      wheel,
    );
    axleCap.rotation.z = Math.PI / 2;
    tractorWheels.push(wheel);
  }
  for (const side of [-1, 1]) {
    const fender = add(
      new THREE.TorusGeometry(0.5, 0.055, 8, 32, Math.PI),
      tractorGreen,
      tractor,
      [side * 0.62, 0.48, 0.38],
    );
    fender.rotation.y = Math.PI / 2;
    fender.rotation.z = Math.PI;
  }
  const exhaust = add(
    new THREE.CylinderGeometry(0.04, 0.055, 0.82, 12),
    mat(0x333a38, 0.38, 0.68),
    tractor,
    [0.28, 1.35, -0.66],
  );
  add(
    new THREE.CylinderGeometry(0.065, 0.05, 0.1, 12),
    mat(0x282e2c, 0.38, 0.7),
    exhaust,
    [0, 0.44, 0],
  );
  target("tractor", tractor);
  const cultivator = group("cultivator", 0, 0, 1.45, modern);
  const cultivatorRed = mat(0xaa3728, 0.42, 0.48);
  add(
    new THREE.BoxGeometry(2.25, 0.11, 0.13),
    cultivatorRed,
    cultivator,
    [0, 0.48, 0],
  );
  add(
    new THREE.BoxGeometry(1.75, 0.085, 0.11),
    cultivatorRed,
    cultivator,
    [0, 0.39, 0.42],
  );
  for (const side of [-1, 1]) {
    cylinderBetween(
      new THREE.Vector3(side * 0.95, 0.48, 0),
      new THREE.Vector3(side * 0.73, 0.39, 0.42),
      0.035,
      cultivatorRed,
      cultivator,
      9,
    );
  }
  const tineMaterial = mat(0x414a48, 0.33, 0.76);
  for (let i = 0; i < 9; i++) {
    const x = -0.96 + i * 0.24;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.47, i % 2 ? 0.4 : 0),
      new THREE.Vector3(x, 0.31, 0.2 + (i % 2) * 0.25),
      new THREE.Vector3(x, 0.12, 0.35 + (i % 2) * 0.23),
      new THREE.Vector3(x, 0.065, 0.48 + (i % 2) * 0.2),
    ]);
    add(
      new THREE.TubeGeometry(curve, 20, 0.028, 8, false),
      tineMaterial,
      cultivator,
    );
  }
  cylinderBetween(
    new THREE.Vector3(0, 0.48, -0.02),
    new THREE.Vector3(0, 0.73, -0.62),
    0.045,
    cultivatorRed,
    cultivator,
    10,
  );
  target("cultivator", cultivator);

  const underground = group("underground-cutaway");
  const block = add(
    new THREE.BoxGeometry(4.6, 1.55, 0.86),
    mat(0x5b341e, 1),
    underground,
    [0, 0.76, 0],
  );
  block.castShadow = false;
  const topsoilFace = add(
    new THREE.BoxGeometry(4.58, 0.5, 0.025),
    looseSoil,
    underground,
    [0, 1.28, 0.445],
  );
  topsoilFace.castShadow = false;
  const subsoilMaterial = mat(0x8b5632, 1);
  const subsoilFace = add(
    new THREE.BoxGeometry(4.58, 0.58, 0.025),
    subsoilMaterial,
    underground,
    [0, 0.74, 0.445],
  );
  subsoilFace.castShadow = false;
  const clayFace = add(
    new THREE.BoxGeometry(4.58, 0.43, 0.025),
    mat(0xa56b3e, 1),
    underground,
    [0, 0.235, 0.445],
  );
  clayFace.castShadow = false;
  const embeddedStones = addInstanced(
    new THREE.IcosahedronGeometry(0.055, 1),
    mat(0x806e5c, 1),
    42,
    underground,
  );
  const stoneTransform = new THREE.Object3D();
  for (let i = 0; i < embeddedStones.count; i++) {
    stoneTransform.position.set(
      -2.1 + ((i * 31) % 42) / 10,
      0.12 + ((i * 19) % 132) / 100,
      0.47,
    );
    const scale = 0.55 + (i % 6) * 0.1;
    stoneTransform.scale.set(scale, scale * 0.7, 0.45);
    stoneTransform.rotation.set(i * 0.2, i * 0.43, i * 0.17);
    stoneTransform.updateMatrix();
    embeddedStones.setMatrixAt(i, stoneTransform.matrix);
  }
  embeddedStones.instanceMatrix.needsUpdate = true;

  const roots = group("root-network", -0.72, 1.52, 0.47, underground);
  const stemMaterial = mat(0x3d7a3c, 0.84);
  cylinderBetween(
    new THREE.Vector3(0, -0.03, 0),
    new THREE.Vector3(0.02, 0.68, 0),
    0.04,
    stemMaterial,
    roots,
    12,
  );
  for (const side of [-1, 1]) {
    const leaf = ellipsoid(
      0.2,
      stemMaterial,
      roots,
      [side * 0.16, 0.43 + (side > 0 ? 0.12 : 0), 0],
      [1.25, 0.34, 0.65],
      20,
    );
    leaf.rotation.z = side * 0.42;
  }
  for (let i = 0; i < 13; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3((i - 6) * 0.035, -0.3, 0),
      new THREE.Vector3((i - 6) * 0.09, -0.78, 0),
      new THREE.Vector3((i - 6) * 0.13 + Math.sin(i) * 0.08, -1.34, 0),
    ]);
    add(
      new THREE.TubeGeometry(curve, 28, i === 6 ? 0.026 : 0.012, 7, false),
      mat(0xd0b16a, 0.86),
      roots,
    );
  }
  target("roots", roots);
  const air = group("air-spaces", 0.42, 0, 0.47, underground);
  const airMaterial = mat(0xa8dbea, 0.16);
  airMaterial.transparent = true;
  airMaterial.opacity = 0.54;
  airMaterial.depthWrite = false;
  for (let i = 0; i < 14; i++) {
    const bubble = add(
      new THREE.SphereGeometry(0.052 + (i % 4) * 0.014, 16, 10),
      airMaterial,
      air,
      [Math.sin(i * 2.1) * 0.78, 0.18 + ((i * 17) % 112) / 100, 0],
    );
    bubble.scale.set(1, 0.72 + (i % 3) * 0.12, 0.5);
  }
  target("air-spaces", air);
  const worm = group("earthworm", 1.2, 0.5, 0.49, underground);
  const wormCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.43, 0, 0),
    new THREE.Vector3(-0.25, 0.11, 0.01),
    new THREE.Vector3(-0.05, -0.07, 0),
    new THREE.Vector3(0.18, 0.09, 0.01),
    new THREE.Vector3(0.43, -0.015, 0),
  ]);
  const wormMesh = add(
    new THREE.TubeGeometry(wormCurve, 48, 0.055, 12, false),
    mat(0x9f5555, 0.72),
    worm,
  );
  wormMesh.scale.y = 0.9;
  for (let i = 0; i < 10; i++) {
    const ring = add(
      new THREE.TorusGeometry(0.056, 0.006, 5, 12),
      mat(0x6f3438, 0.8),
      worm,
      [-0.36 + i * 0.08, Math.sin(i * 1.5) * 0.055, 0],
    );
    ring.rotation.y = Math.PI / 2;
  }
  target("earthworm", worm);
  const nutrients = group("nutrients", 0.25, 0.2, 0.5, underground);
  const nutrientColors = [0xe0ac38, 0x74a649, 0xc26037];
  for (let i = 0; i < 24; i++) {
    const nutrient = add(
      new THREE.SphereGeometry(0.03 + (i % 3) * 0.006, 10, 7),
      mat(nutrientColors[i % nutrientColors.length], 0.62),
      nutrients,
      [-1.55 + ((i * 11) % 31) / 10, ((i * 17) % 105) / 100, 0.01],
    );
    nutrient.scale.z = 0.55;
  }
  target("nutrients", nutrients);

  const finish = group("finishing-tools");
  const finishClods: THREE.Mesh[] = [];
  const brokenFragments: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const x = -0.78 + i * 0.78;
    const value = add(new THREE.DodecahedronGeometry(0.28, 2), soil, finish, [
      x,
      0.15,
      -0.15,
    ]);
    value.scale.set(1.12, 0.72, 0.95);
    value.rotation.set(0.17 * i, -0.35 * i, 0.08);
    value.userData.targetId = "finish-clod";
    value.userData.kind = "whole-clod";
    finishClods.push(value);
    const fragments = group(`broken-clod-${i + 1}`, x, 0, -0.15, finish);
    fragments.userData.kind = "broken-fragments";
    for (let piece = 0; piece < 5; piece++) {
      const fragment = add(
        new THREE.DodecahedronGeometry(0.09 + (piece % 3) * 0.02, 1),
        looseSoil,
        fragments,
        [
          Math.sin(piece * 2.1) * 0.2,
          0.04 + (piece % 2) * 0.02,
          Math.cos(piece * 1.7) * 0.15,
        ],
      );
      fragment.scale.y = 0.55;
      fragment.rotation.set(piece * 0.4, piece * 0.7, piece * 0.2);
    }
    fragments.visible = false;
    brokenFragments.push(fragments);
  }
  target("finish-clod", finish);
  const leveller = group("wooden-leveller", 0, 0, 0.85, finish);
  add(new THREE.BoxGeometry(2.3, 0.16, 0.28), wood, leveller, [0, 0.1, 0]);
  for (const x of [-0.92, 0.92])
    add(
      new THREE.BoxGeometry(0.18, 0.08, 0.38),
      mat(0x51301c, 0.86),
      leveller,
      [x, 0.16, 0],
    );
  cylinderBetween(
    new THREE.Vector3(0, 0.16, 0.08),
    new THREE.Vector3(0.08, 1.42, 0.92),
    0.048,
    wood,
    leveller,
    12,
  );
  cylinderBetween(
    new THREE.Vector3(-0.23, 1.42, 0.92),
    new THREE.Vector3(0.35, 1.42, 0.92),
    0.04,
    wood,
    leveller,
    11,
  );
  target("leveller", leveller);

  const ready = group("ready-field");
  const readySoil = add(new THREE.PlaneGeometry(8.2, 5.4), fineSoil, ready);
  readySoil.rotation.x = -Math.PI / 2;
  readySoil.position.y = 0.025;
  target("ready-soil", readySoil);
  for (let i = 0; i < 13; i++) {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: 9 }, (_, point) => {
        const z = -2.45 + point * 0.61;
        return new THREE.Vector3(
          -3.55 + i * 0.59 + Math.sin(point * 1.2 + i) * 0.018,
          0.055,
          z,
        );
      }),
    );
    add(new THREE.TubeGeometry(curve, 36, 0.052, 7, false), looseSoil, ready);
  }
  const seedBag = group("seed-bag", 2.7, 0.08, -0.9, ready);
  const sackMaterial = mat(0xb99761, 1);
  const sack = ellipsoid(
    0.42,
    sackMaterial,
    seedBag,
    [0, 0.25, 0],
    [0.7, 1.05, 0.66],
    28,
  );
  sack.rotation.z = -0.05;
  const rim = add(
    new THREE.TorusGeometry(0.2, 0.025, 8, 28),
    mat(0x765632, 0.95),
    seedBag,
    [0, 0.58, 0],
  );
  rim.rotation.x = Math.PI / 2;
  const seedMaterial = mat(0xd7ad55, 0.82);
  for (let i = 0; i < 24; i++) {
    const seed = ellipsoid(
      0.032,
      seedMaterial,
      seedBag,
      [
        Math.sin(i * 2.39) * (0.05 + (i % 5) * 0.022),
        0.59 + (i % 3) * 0.01,
        Math.cos(i * 1.91) * (0.04 + (i % 4) * 0.02),
      ],
      [0.55, 0.38, 1.15],
      10,
    );
    seed.rotation.y = i * 0.7;
  }
  target("seed-bag", seedBag);

  const dustMaterial = mat(0xc49a69, 1);
  dustMaterial.transparent = true;
  dustMaterial.opacity = 0.24;
  dustMaterial.depthWrite = false;
  const dustCloud = addInstanced(
    new THREE.SphereGeometry(0.045, 7, 5),
    dustMaterial,
    32,
    root,
  );
  dustCloud.castShadow = false;
  dustCloud.receiveShadow = false;
  dustCloud.frustumCulled = false;
  const dustTransform = new THREE.Object3D();

  const key = new THREE.DirectionalLight(0xffd6a0, 3.05);
  key.position.set(-4.5, 7.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.025;
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  root.add(key);
  root.add(new THREE.HemisphereLight(0xbddcff, 0x5b3821, 1.55));
  const fill = new THREE.DirectionalLight(0x9fc8df, 0.78);
  fill.position.set(4, 4, -5);
  root.add(fill);

  let lastStage: PloughingStageId | null = null;
  function update(state: PloughingState, _delta: number, elapsed: number) {
    const stage =
      (
        [
          "farm",
          "hard-soil",
          "plough",
          "traditional",
          "modern",
          "underground",
          "levelling",
          "ready",
        ] as const
      )[state.stageIndex] ?? "ready";
    field.visible =
      stage === "farm" || stage === "hard-soil" || stage === "plough";
    hardClods.visible = stage === "farm" || stage === "hard-soil";
    farmer.visible = stage === "farm";
    featuredClod.visible = stage === "hard-soil";
    traditional.visible = stage === "plough" || stage === "traditional";
    turned.visible = stage === "plough";
    furrows.visible = stage === "traditional";
    furrowPasses.forEach((pass, index) => {
      pass.visible = index < state.furrows;
    });
    modern.visible = stage === "modern";
    underground.visible = stage === "underground";
    finish.visible = stage === "levelling";
    finishClods.forEach((clod, index) => {
      clod.visible = index >= state.brokenClods;
    });
    brokenFragments.forEach((fragments, index) => {
      fragments.visible = index < state.brokenClods;
    });
    const levellerTarget = state.levelled ? -1.2 : 0.85;
    leveller.position.z = THREE.MathUtils.damp(
      leveller.position.z,
      levellerTarget,
      6,
      _delta,
    );
    ready.visible = stage === "ready";
    dustCloud.visible = stage === "traditional" || stage === "modern";
    if (dustCloud.visible) {
      for (let i = 0; i < dustCloud.count; i++) {
        const cycle = (elapsed * (0.18 + (i % 5) * 0.025) + i * 0.173) % 1;
        const sourceZ = stage === "modern" ? 1.35 : 0.68;
        dustTransform.position.set(
          -1.5 + ((i * 17) % 31) / 10,
          0.05 + cycle * 0.48,
          sourceZ + Math.sin(i * 2.2 + elapsed) * 0.5,
        );
        const size = 0.35 + (1 - cycle) * (0.7 + (i % 4) * 0.12);
        dustTransform.scale.setScalar(size);
        dustTransform.rotation.set(i, elapsed * 0.2, 0);
        dustTransform.updateMatrix();
        dustCloud.setMatrixAt(i, dustTransform.matrix);
      }
      dustCloud.instanceMatrix.needsUpdate = true;
    }
    if (stage === "traditional") {
      traditional.position.z = Math.sin(elapsed * 0.9) * 0.08;
      bullockLegs.forEach((leg) => {
        leg.rotation.x =
          Math.sin(elapsed * 3.2 + Number(leg.userData.phase)) * 0.09;
      });
      bullockTails.forEach((tail, index) => {
        tail.rotation.z = Math.sin(elapsed * 2 + index) * 0.12;
      });
    }
    if (stage === "modern") {
      modern.position.x = Math.sin(elapsed * 0.45) * 0.12;
      tractorWheels.forEach((wheel) => {
        wheel.rotation.x += _delta * 0.85;
      });
    }
    worm.rotation.z = Math.sin(elapsed * 1.8) * 0.07;
    if (lastStage !== stage) {
      root.updateMatrixWorld(true);
      lastStage = stage;
    }
  }

  function getFrame(stage: PloughingStageId) {
    if (stage === "hard-soil")
      return {
        position: new THREE.Vector3(0.1, 1.45, 2.25),
        target: new THREE.Vector3(-0.2, 0.18, 0.2),
      };
    if (stage === "plough" || stage === "traditional")
      return {
        position: new THREE.Vector3(0.2, 2.15, 4.4),
        target: new THREE.Vector3(0, 0.52, -0.1),
      };
    if (stage === "modern")
      return {
        position: new THREE.Vector3(0.15, 2.15, 4.0),
        target: new THREE.Vector3(0, 0.58, 0.1),
      };
    if (stage === "underground")
      return {
        position: new THREE.Vector3(0, 1.65, 4.0),
        target: new THREE.Vector3(0, 0.62, 0),
      };
    if (stage === "levelling")
      return {
        position: new THREE.Vector3(0.15, 1.7, 3.15),
        target: new THREE.Vector3(0, 0.2, 0.2),
      };
    if (stage === "ready")
      return {
        position: new THREE.Vector3(0, 2.65, 4.8),
        target: new THREE.Vector3(0, 0.1, 0),
      };
    return {
      position: new THREE.Vector3(0.1, 2.15, 4.2),
      target: new THREE.Vector3(0, 0.45, 0),
    };
  }

  function dispose() {
    scene.remove(root);
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  }

  return { root, targets, update, getFrame, dispose };
}
