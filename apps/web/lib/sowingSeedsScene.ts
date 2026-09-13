import * as THREE from "three";
import type { SowingStageId, SowingState } from "./sowingSeedsLesson";

export function createSowingSeedsScene(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = "sowing-seeds-field";
  scene.add(root);

  const targets = new Map<string, THREE.Object3D>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
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
  const group = (
    name: string,
    position: [number, number, number] = [0, 0, 0],
    parent: THREE.Object3D = root,
  ) => {
    const value = new THREE.Group();
    value.name = name;
    value.position.set(...position);
    parent.add(value);
    return value;
  };
  const target = (id: string, object: THREE.Object3D) => {
    targets.set(id, object);
    object.traverse((child) => {
      child.userData.targetId = id;
    });
    return object;
  };
  const ellipsoid = (
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number],
    segments = 20,
  ) => {
    const mesh = add(
      new THREE.SphereGeometry(radius, segments, Math.max(10, segments / 2)),
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
  ) => {
    const direction = end.clone().sub(start);
    const mesh = add(
      new THREE.CylinderGeometry(radius, radius, direction.length(), 12),
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
  const label = (
    text: string,
    parent: THREE.Object3D,
    position: [number, number, number],
    width = 1.25,
  ) => {
    if (typeof document === "undefined") {
      const material = new THREE.MeshBasicMaterial({
        color: 0xf8f1dd,
        side: THREE.DoubleSide,
      });
      materials.add(material);
      return add(
        new THREE.PlaneGeometry(width, width / 4),
        material,
        parent,
        position,
      );
    }
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "rgba(248,241,221,.94)";
    context.fillRect(0, 0, 512, 128);
    context.strokeStyle = "#8b5527";
    context.lineWidth = 8;
    context.strokeRect(4, 4, 504, 120);
    context.fillStyle = "#26382c";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "600 38px sans-serif";
    context.fillText(text, 256, 66);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    materials.add(material);
    return add(
      new THREE.PlaneGeometry(width, width / 4),
      material,
      parent,
      position,
    );
  };

  const soil = mat(0x7b5134, 1);
  const deepSoil = mat(0x57301d, 1);
  const moistSoil = mat(0x654027, 1);
  const wood = mat(0x774225, 0.88);
  const iron = mat(0x39413f, 0.32, 0.74);
  const healthySeedMaterial = mat(0xd8a64b, 0.78);
  const damagedSeedMaterial = mat(0x73533f, 0.96);
  const green = mat(0x3f7d3d, 0.86);
  const youngGreen = mat(0x67a34d, 0.8);

  if (typeof document !== "undefined" && typeof Image !== "undefined") {
    const colourTexture = new THREE.TextureLoader().load(
      "/images/ploughing-soil-preparation/soil-albedo-v2.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 3);
        const heightTexture = texture.clone();
        heightTexture.colorSpace = THREE.NoColorSpace;
        heightTexture.needsUpdate = true;
        textures.add(heightTexture);
        for (const material of [soil, moistSoil]) {
          material.map = texture;
          material.bumpMap = heightTexture;
          material.bumpScale = 0.04;
          material.color.set(0xffffff);
          material.needsUpdate = true;
        }
      },
    );
    textures.add(colourTexture);
  }

  const field = group("prepared-seedbed");
  const fieldSurface = add(new THREE.PlaneGeometry(10, 7), soil, field);
  fieldSurface.rotation.x = -Math.PI / 2;
  target("prepared-soil", fieldSurface);
  for (let row = 0; row < 12; row += 1) {
    const furrow = add(
      new THREE.TorusGeometry(5.05, 0.028, 5, 80, Math.PI),
      moistSoil,
      field,
      [-4.95 + row * 0.9, 0.035, 0],
    );
    furrow.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    furrow.scale.z = 0.68;
  }

  const opening = group("field-ready");
  const farmer = group("farmer", [-2.1, 0, -0.15], opening);
  const skin = mat(0x8f5436, 0.72);
  const shirt = mat(0xe6dac0, 0.94);
  const trousers = mat(0x29445a, 0.92);
  ellipsoid(0.38, shirt, farmer, [0, 1.05, 0], [0.7, 1.05, 0.48], 26);
  ellipsoid(0.18, skin, farmer, [0, 1.61, 0], [0.88, 1.05, 0.9], 26);
  for (const x of [-0.12, 0.12]) {
    cylinderBetween(
      new THREE.Vector3(x, 0.72, 0),
      new THREE.Vector3(x, 0.18, 0.02),
      0.065,
      trousers,
      farmer,
    );
    cylinderBetween(
      new THREE.Vector3(x * 1.6, 1.28, 0),
      new THREE.Vector3(x * 2.1, 0.9, 0.08),
      0.05,
      skin,
      farmer,
    );
  }
  const turban = ellipsoid(
    0.21,
    mat(0xc5542f, 0.9),
    farmer,
    [0, 1.79, 0],
    [1.05, 0.55, 1.02],
    26,
  );
  turban.rotation.z = 0.05;
  target("farmer", farmer);

  const seedBag = group("seed-bag", [2.55, 0.05, -0.65], opening);
  ellipsoid(
    0.47,
    mat(0xb99662, 1),
    seedBag,
    [0, 0.32, 0],
    [0.72, 1.08, 0.68],
    28,
  );
  const bagRim = add(
    new THREE.TorusGeometry(0.23, 0.027, 8, 28),
    wood,
    seedBag,
    [0, 0.68, 0],
  );
  bagRim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 28; i += 1) {
    const seed = ellipsoid(
      0.035,
      healthySeedMaterial,
      seedBag,
      [
        Math.sin(i * 2.1) * (0.04 + (i % 5) * 0.026),
        0.69 + (i % 3) * 0.008,
        Math.cos(i * 1.7) * (0.04 + (i % 4) * 0.027),
      ],
      [0.55, 0.42, 1.22],
      12,
    );
    seed.rotation.y = i * 0.71;
  }
  target("seed-bag", seedBag);

  const meaning = group("what-is-sowing");
  const seed = group("enlarged-seed", [-0.25, 0.22, 0.3], meaning);
  const seedMesh = ellipsoid(
    0.34,
    healthySeedMaterial,
    seed,
    [0, 0, 0],
    [0.58, 0.42, 1.25],
    30,
  );
  seedMesh.rotation.y = -0.38;
  const seedCrease = add(
    new THREE.TorusGeometry(0.18, 0.018, 7, 28, Math.PI * 0.9),
    mat(0x7c5424, 0.82),
    seed,
    [0, 0.025, 0.18],
  );
  seedCrease.rotation.y = 0.25;
  target("seed", seed);
  const placementArrow = add(
    new THREE.ConeGeometry(0.09, 0.32, 14),
    mat(0xe8b447, 0.44),
    meaning,
    [-0.25, 0.83, 0.3],
  );
  placementArrow.rotation.z = Math.PI;

  const selection = group("seed-selection-station");
  add(new THREE.BoxGeometry(4.8, 0.15, 2.3), wood, selection, [0, 0.74, 0]);
  for (const x of [-2.1, 2.1])
    for (const z of [-0.82, 0.82])
      add(new THREE.BoxGeometry(0.14, 0.75, 0.14), wood, selection, [x, 0.35, z]);
  const healthyGroup = group("healthy-seeds", [-0.9, 0, 0], selection);
  const healthySeeds: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i += 1) {
    const value = ellipsoid(
      0.16,
      healthySeedMaterial,
      healthyGroup,
      [-0.65 + i * 0.32, 0.93, -0.15 + Math.sin(i * 2) * 0.13],
      [0.56, 0.4, 1.2],
      20,
    );
    value.rotation.set(0.2, i * 0.9, -0.1);
    value.userData.home = value.position.clone();
    healthySeeds.push(value);
  }
  target("healthy-seed", healthyGroup);
  const brokenSeed = group("broken-seed", [0.95, 0.94, -0.18], selection);
  for (const side of [-1, 1]) {
    const fragment = ellipsoid(
      0.17,
      damagedSeedMaterial,
      brokenSeed,
      [side * 0.105, 0, 0],
      [0.4, 0.42, 0.95],
      18,
    );
    fragment.rotation.z = side * 0.35;
  }
  target("broken-seed", brokenSeed);
  const damagedSeed = group("damaged-seed", [1.55, 0.94, 0.22], selection);
  ellipsoid(
    0.17,
    damagedSeedMaterial,
    damagedSeed,
    [0, 0, 0],
    [0.57, 0.38, 1.15],
    18,
  );
  for (let i = 0; i < 4; i += 1)
    ellipsoid(
      0.022,
      mat(0x2a1b16, 0.95),
      damagedSeed,
      [Math.sin(i * 2) * 0.07, Math.cos(i * 1.7) * 0.035, 0.13],
      [1, 0.7, 0.45],
      10,
    );
  target("damaged-seed", damagedSeed);
  const goodBasket = group("good-basket", [-1.35, 0.82, 0.72], selection);
  const basketMaterial = mat(0x9d6a37, 0.9);
  const goodRim = add(
    new THREE.TorusGeometry(0.48, 0.055, 8, 32),
    basketMaterial,
    goodBasket,
  );
  goodRim.rotation.x = Math.PI / 2;
  label("GOOD SEEDS", selection, [-1.35, 1.38, 0.72], 1.1);
  const rejectBasket = group("reject-basket", [1.3, 0.82, 0.72], selection);
  const rejectRim = add(
    new THREE.TorusGeometry(0.48, 0.055, 8, 32),
    basketMaterial,
    rejectBasket,
  );
  rejectRim.rotation.x = Math.PI / 2;
  label("REJECT", selection, [1.3, 1.38, 0.72], 0.9);

  const waterTest = group("seed-water-test");
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xbdebf2,
    roughness: 0.08,
    transmission: 0.7,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  materials.add(glassMaterial);
  add(
    new THREE.CylinderGeometry(0.78, 0.68, 1.55, 40, 1, true),
    glassMaterial,
    waterTest,
    [0, 0.79, 0],
  );
  add(
    new THREE.CylinderGeometry(0.67, 0.67, 0.08, 40),
    glassMaterial,
    waterTest,
    [0, 0.06, 0],
  );
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x49b9d1,
    roughness: 0.15,
    transmission: 0.3,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  materials.add(waterMaterial);
  add(
    new THREE.CylinderGeometry(0.66, 0.62, 1.15, 40),
    waterMaterial,
    waterTest,
    [0, 0.62, 0],
  );
  const floatGroup = group("floating-seeds", [0, 0, 0], waterTest);
  const sinkGroup = group("sunken-seeds", [0, 0, 0], waterTest);
  const testSeeds: { mesh: THREE.Mesh; sink: boolean; index: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    const sink = i >= 3;
    const parent = sink ? sinkGroup : floatGroup;
    const value = ellipsoid(
      0.105,
      sink ? healthySeedMaterial : damagedSeedMaterial,
      parent,
      [-0.42 + (i % 4) * 0.28, 1.78 + (i % 2) * 0.11, Math.sin(i) * 0.23],
      [0.55, 0.38, 1.15],
      16,
    );
    value.userData.start = value.position.clone();
    testSeeds.push({ mesh: value, sink, index: i });
  }
  target("floating-seeds", floatGroup);
  target("sunken-seeds", sinkGroup);

  const depth = group("depth-cutaway");
  add(new THREE.BoxGeometry(5.2, 1.85, 0.95), deepSoil, depth, [0, 0.83, 0]);
  add(new THREE.BoxGeometry(5.15, 0.48, 0.98), soil, depth, [0, 1.52, 0]);
  const depthTargets: Record<"shallow" | "correct" | "deep", THREE.Group> = {
    shallow: group("shallow-seed", [-1.55, 1.55, 0.53], depth),
    correct: group("correct-depth", [0, 1.05, 0.53], depth),
    deep: group("deep-seed", [1.55, 0.36, 0.53], depth),
  };
  for (const [kind, value] of Object.entries(depthTargets) as [
    "shallow" | "correct" | "deep",
    THREE.Group,
  ][]) {
    ellipsoid(
      0.22,
      healthySeedMaterial,
      value,
      [0, 0, 0],
      [0.58, 0.4, 1.18],
      24,
    );
    target(
      kind === "shallow"
        ? "shallow-seed"
        : kind === "correct"
          ? "correct-depth"
          : "deep-seed",
      value,
    );
  }
  label("TOO SHALLOW", depth, [-1.55, 2.08, 0.54], 1.25);
  label("SUITABLE", depth, [0, 2.08, 0.54], 1.05);
  label("TOO DEEP", depth, [1.55, 2.08, 0.54], 1.05);

  const spacing = group("spacing-comparison");
  const makeBed = (x: number, title: string) => {
    const bed = group(title, [x, 0, 0], spacing);
    const surface = add(new THREE.BoxGeometry(2.35, 0.22, 4.2), moistSoil, bed, [0, 0.08, 0]);
    surface.castShadow = false;
    label(title, bed, [0, 1.15, -1.75], 1.45);
    return bed;
  };
  const crowded = makeBed(-1.55, "CROWDED ROW");
  const proper = makeBed(1.55, "EVEN SPACING");
  const crowdedSeeds: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i += 1) {
    const value = ellipsoid(
      0.12,
      healthySeedMaterial,
      crowded,
      [Math.sin(i * 1.8) * 0.18, 0.27, -0.55 + i * 0.18],
      [0.55, 0.36, 1.16],
      16,
    );
    value.userData.home = value.position.clone();
    crowdedSeeds.push(value);
  }
  for (let i = 0; i < 6; i += 1)
    ellipsoid(
      0.12,
      healthySeedMaterial,
      proper,
      [0, 0.27, -1.45 + i * 0.58],
      [0.55, 0.36, 1.16],
      16,
    );
  target("crowded-row", crowded);
  target("proper-row", proper);

  const methods = group("sowing-methods");
  const traditionalTool = group("traditional-funnel-tool", [-1.55, 0, 0], methods);
  add(new THREE.BoxGeometry(2.45, 0.1, 0.12), wood, traditionalTool, [0, 0.45, 0.3]);
  const funnel = add(
    new THREE.ConeGeometry(0.38, 0.7, 28, 1, true),
    mat(0xa45a2f, 0.76),
    traditionalTool,
    [0, 1.18, 0],
  );
  funnel.rotation.z = Math.PI;
  cylinderBetween(
    new THREE.Vector3(0, 0.84, 0),
    new THREE.Vector3(-0.25, 0.15, 0.42),
    0.065,
    wood,
    traditionalTool,
  );
  for (let i = 0; i < 10; i += 1)
    ellipsoid(
      0.035,
      healthySeedMaterial,
      traditionalTool,
      [-0.25, 0.72 - i * 0.055, 0.42],
      [0.55, 0.4, 1.1],
      10,
    );
  label("FUNNEL + PLOUGH", traditionalTool, [0, 1.9, 0], 1.55);
  target("traditional-tool", traditionalTool);

  const seedDrill = group("tractor-seed-drill", [1.35, 0, 0.2], methods);
  const tractorGreen = mat(0x285e3d, 0.38, 0.18);
  const tyre = mat(0x171a18, 0.98);
  add(new THREE.BoxGeometry(1.25, 0.58, 1.45), tractorGreen, seedDrill, [0, 0.78, -0.5]);
  add(new THREE.BoxGeometry(0.75, 0.72, 0.72), mat(0x1f4633, 0.42, 0.2), seedDrill, [0, 1.22, 0.2]);
  const drillWheels: THREE.Mesh[] = [];
  for (const x of [-0.68, 0.68]) {
    for (const [z, radius] of [[-0.75, 0.39], [0.35, 0.5]] as const) {
      const wheel = add(
        new THREE.TorusGeometry(radius * 0.72, radius * 0.28, 12, 28),
        tyre,
        seedDrill,
        [x, radius, z],
      );
      wheel.rotation.y = Math.PI / 2;
      drillWheels.push(wheel);
    }
  }
  const hopper = add(
    new THREE.BoxGeometry(2.35, 0.7, 0.75),
    mat(0xb23d2b, 0.46, 0.3),
    seedDrill,
    [0, 0.82, 1.15],
  );
  hopper.rotation.x = -0.08;
  for (let i = 0; i < 6; i += 1) {
    const x = -0.9 + i * 0.36;
    cylinderBetween(
      new THREE.Vector3(x, 0.55, 1.15),
      new THREE.Vector3(x, 0.08, 1.55),
      0.035,
      iron,
      seedDrill,
    );
    add(new THREE.ConeGeometry(0.09, 0.26, 8), iron, seedDrill, [x, 0.12, 1.58]);
  }
  label("TRACTOR + SEED DRILL", seedDrill, [0, 2.05, 0], 1.8);
  target("seed-drill", seedDrill);

  const germination = group("germination-cutaway");
  add(new THREE.BoxGeometry(5.1, 1.8, 1), deepSoil, germination, [0, 0.75, 0]);
  add(new THREE.BoxGeometry(5.05, 0.42, 1.02), soil, germination, [0, 1.48, 0]);
  const coveredSeed = group("covered-seed", [0, 1.05, 0.55], germination);
  ellipsoid(
    0.26,
    healthySeedMaterial,
    coveredSeed,
    [0, 0, 0],
    [0.6, 0.42, 1.18],
    28,
  );
  target("covered-seed", coveredSeed);
  const rootNetwork = group("root", [0, 1.01, 0.56], germination);
  const mainRoot = cylinderBetween(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, -0.82, 0),
    0.035,
    mat(0xe1c889, 0.88),
    rootNetwork,
  );
  for (const side of [-1, 1])
    cylinderBetween(
      new THREE.Vector3(0.03, -0.43, 0),
      new THREE.Vector3(side * 0.36, -0.68, 0),
      0.018,
      mat(0xd7bc7a, 0.9),
      rootNetwork,
    );
  target("root", rootNetwork);
  const shoot = group("shoot", [0, 1.04, 0.56], germination);
  cylinderBetween(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.06, 1.02, 0),
    0.045,
    green,
    shoot,
  );
  for (const side of [-1, 1]) {
    const leaf = ellipsoid(
      0.23,
      youngGreen,
      shoot,
      [side * 0.2, 0.78 + (side > 0 ? 0.12 : 0), 0],
      [1.25, 0.3, 0.68],
      22,
    );
    leaf.rotation.z = side * 0.42;
  }
  target("shoot", shoot);
  const droplets: THREE.Mesh[] = [];
  const dropletMaterial = mat(0x55bce3, 0.18);
  dropletMaterial.transparent = true;
  dropletMaterial.opacity = 0.72;
  for (let i = 0; i < 8; i += 1) {
    const droplet = ellipsoid(
      0.06,
      dropletMaterial,
      germination,
      [-0.65 + i * 0.19, 1.98 + (i % 3) * 0.15, 0.48],
      [0.62, 1, 0.62],
      14,
    );
    droplets.push(droplet);
  }

  const key = new THREE.DirectionalLight(0xffd5a2, 3.1);
  key.position.set(-4.5, 7.5, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.025;
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  root.add(key);
  root.add(new THREE.HemisphereLight(0xc5e2f4, 0x5b3821, 1.5));
  const fill = new THREE.DirectionalLight(0x9fc8df, 0.72);
  fill.position.set(4, 4, -5);
  root.add(fill);

  function update(state: SowingState, delta: number, elapsed: number) {
    const stage =
      (
        [
          "prepared",
          "meaning",
          "selection",
          "water-test",
          "depth",
          "spacing",
          "methods",
          "germination",
        ] as const
      )[state.stageIndex] ?? "germination";
    opening.visible = stage === "prepared";
    meaning.visible = stage === "meaning";
    selection.visible = stage === "selection";
    waterTest.visible = stage === "water-test";
    depth.visible = stage === "depth";
    spacing.visible = stage === "spacing";
    methods.visible = stage === "methods";
    germination.visible = stage === "germination";

    placementArrow.position.y = 0.83 + Math.sin(elapsed * 2.2) * 0.09;
    seed.rotation.y = Math.sin(elapsed * 0.55) * 0.2;
    healthySeeds.forEach((item, index) => {
      const selected = index < state.healthySeeds;
      const destination = selected
        ? new THREE.Vector3(-0.72 + index * 0.18, 0.9, 0.72)
        : (item.userData.home as THREE.Vector3);
      item.position.lerp(destination, 1 - Math.exp(-delta * 7));
    });
    testSeeds.forEach(({ mesh, sink, index }) => {
      const start = mesh.userData.start as THREE.Vector3;
      const destination = state.seedsTested
        ? new THREE.Vector3(
            -0.38 + (index % 4) * 0.26,
            sink ? 0.18 + (index % 2) * 0.06 : 1.16 + Math.sin(elapsed * 1.5 + index) * 0.025,
            Math.sin(index * 1.8) * 0.2,
          )
        : start;
      mesh.position.lerp(destination, 1 - Math.exp(-delta * 5));
      mesh.rotation.y += delta * (sink ? 0.35 : 0.7);
    });
    for (const [kind, value] of Object.entries(depthTargets) as [
      "shallow" | "correct" | "deep",
      THREE.Group,
    ][]) {
      const selected = state.depthChoice === kind;
      const pulse = selected ? 1.08 + Math.sin(elapsed * 4) * 0.035 : 1;
      value.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 1 - Math.exp(-delta * 8));
    }
    crowdedSeeds.slice(0, 3).forEach((item, index) => {
      const moved = index < state.spacingFixes;
      const destination = moved
        ? new THREE.Vector3(0, 0.27, -1.2 + index * 0.86)
        : (item.userData.home as THREE.Vector3);
      item.position.lerp(destination, 1 - Math.exp(-delta * 7));
    });
    drillWheels.forEach((wheel) => {
      wheel.rotation.x += delta * 0.55;
    });
    traditionalTool.position.y = Math.sin(elapsed * 1.2) * 0.025;
    const growth = Math.min(1, (elapsed % 18) / 5 + 0.15);
    rootNetwork.scale.setScalar(0.45 + growth * 0.55);
    shoot.scale.setScalar(0.35 + growth * 0.65);
    droplets.forEach((droplet, index) => {
      const cycle = (elapsed * 0.25 + index * 0.13) % 1;
      droplet.position.y = 2.05 - cycle * 0.85;
      if (!Array.isArray(droplet.material)) {
        droplet.material.opacity = 0.72 * (1 - cycle * 0.7);
      }
    });
  }

  function getFrame(stage: SowingStageId) {
    if (stage === "selection")
      return {
        position: new THREE.Vector3(0, 2.35, 4.1),
        target: new THREE.Vector3(0, 0.82, 0.15),
      };
    if (stage === "water-test")
      return {
        position: new THREE.Vector3(0, 1.75, 3.25),
        target: new THREE.Vector3(0, 0.82, 0),
      };
    if (stage === "depth" || stage === "germination")
      return {
        position: new THREE.Vector3(0, 1.75, 4.15),
        target: new THREE.Vector3(0, 0.9, 0),
      };
    if (stage === "spacing")
      return {
        position: new THREE.Vector3(0, 3.2, 4.65),
        target: new THREE.Vector3(0, 0.1, 0),
      };
    if (stage === "methods")
      return {
        position: new THREE.Vector3(0, 2.35, 5.25),
        target: new THREE.Vector3(0, 0.72, 0.1),
      };
    if (stage === "meaning")
      return {
        position: new THREE.Vector3(0.1, 1.65, 3.05),
        target: new THREE.Vector3(-0.2, 0.25, 0.2),
      };
    return {
      position: new THREE.Vector3(0.1, 2.15, 4.25),
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
