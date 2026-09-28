import * as THREE from "three";
import type {
  WoolProcessingState,
  WoolStageId,
} from "@/lib/woolProcessingLesson";

type Surface =
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshBasicMaterial;

type SheepModel = {
  group: THREE.Group;
  fleece: THREE.Group;
  bareBody: THREE.Mesh;
  head: THREE.Group;
};

const STAGE_ORDER = [
  "arrival",
  "season",
  "prepare",
  "shearing",
  "detective",
  "experiment",
  "station",
  "compare",
  "journey",
  "quiz",
] as const satisfies readonly WoolStageId[];

const PREPARATION_TARGETS = [
  "check-dry",
  "non-slip-platform",
  "electric-shears",
  "inspect-shears",
  "blade-oil",
  "calm-woolly",
] as const;

const STATION_TARGETS = [
  "temperature-dial",
  "solution-dispenser",
  "wash-paddle",
  "rinse-one",
  "rinse-two",
  "squeeze-rollers",
  "drying-rack",
] as const;

/** Builds the complete procedural 3D world for Mission Wool. */
export function createWoolProcessingScene(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = "wool-processing-world";
  scene.add(root);

  const targets = new Map<string, THREE.Object3D>();
  const stageRoots = new Map<WoolStageId, THREE.Group>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  const windObjects: THREE.Object3D[] = [];

  const standard = (
    colour: THREE.ColorRepresentation,
    roughness = 0.65,
    metalness = 0,
    emissive: THREE.ColorRepresentation = 0x000000,
  ) => {
    const value = new THREE.MeshStandardMaterial({
      color: colour,
      roughness,
      metalness,
      emissive,
      emissiveIntensity: emissive === 0x000000 ? 0 : 0.42,
    });
    materials.add(value);
    return value;
  };

  const physical = (
    colour: THREE.ColorRepresentation,
    opacity: number,
    transmission = 0.15,
  ) => {
    const value = new THREE.MeshPhysicalMaterial({
      color: colour,
      roughness: 0.2,
      transparent: true,
      opacity,
      transmission,
      thickness: 0.35,
      clearcoat: 0.4,
      side: THREE.DoubleSide,
      depthWrite: opacity > 0.5,
    });
    materials.add(value);
    return value;
  };

  const add = <Geometry extends THREE.BufferGeometry>(
    geometry: Geometry,
    surface: Surface,
    parent: THREE.Object3D,
    position: [number, number, number] = [0, 0, 0],
    name?: string,
  ) => {
    geometries.add(geometry);
    materials.add(surface);
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  const group = (
    name: string,
    parent: THREE.Object3D = root,
    position: [number, number, number] = [0, 0, 0],
  ) => {
    const value = new THREE.Group();
    value.name = name;
    value.position.set(...position);
    parent.add(value);
    return value;
  };

  const stageGroup = (id: WoolStageId) => {
    const value = group(`wool-stage-${id}`);
    value.visible = stageRoots.size === 0;
    stageRoots.set(id, value);
    return value;
  };

  const target = <ObjectType extends THREE.Object3D>(
    id: string,
    object: ObjectType,
  ) => {
    if (!object.name) object.name = id;
    targets.set(id, object);
    object.traverse((child) => {
      child.userData.targetId = id;
    });
    return object;
  };

  const sphere = (
    radius: number,
    surface: Surface,
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
    name?: string,
  ) => {
    const mesh = add(
      new THREE.SphereGeometry(radius, 20, 14),
      surface,
      parent,
      position,
      name,
    );
    mesh.scale.set(...scale);
    return mesh;
  };

  const cylinder = (
    radiusTop: number,
    radiusBottom: number,
    height: number,
    surface: Surface,
    parent: THREE.Object3D,
    position: [number, number, number],
    name?: string,
  ) =>
    add(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 20),
      surface,
      parent,
      position,
      name,
    );

  const roundedBlock = (
    size: [number, number, number],
    surface: Surface,
    parent: THREE.Object3D,
    position: [number, number, number],
    name?: string,
  ) =>
    add(
      new THREE.BoxGeometry(...size, 3, 3, 3),
      surface,
      parent,
      position,
      name,
    );

  const label = (
    text: string,
    parent: THREE.Object3D,
    position: [number, number, number],
    width = 1.65,
  ) => {
    const holder = group(
      `label-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      parent,
      position,
    );
    const board = add(
      new THREE.PlaneGeometry(width, 0.36),
      standard(0x173c39, 0.8, 0, 0x061817),
      holder,
      [0, 0, 0],
    );
    board.castShadow = false;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#eefcf5";
        context.font = "600 38px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2, 600);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.add(texture);
        const textMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        materials.add(textMaterial);
        const textMesh = add(
          new THREE.PlaneGeometry(width * 0.94, 0.31),
          textMaterial,
          holder,
          [0, 0, 0.008],
        );
        textMesh.castShadow = false;
      }
    }
    return holder;
  };

  const addFloor = (
    parent: THREE.Object3D,
    colour: THREE.ColorRepresentation = 0x4e7b3d,
  ) => {
    const floor = add(
      new THREE.CylinderGeometry(4.2, 4.45, 0.16, 48),
      standard(colour, 0.98),
      parent,
      [0, -0.09, 0],
      "mission-floor",
    );
    floor.receiveShadow = true;
    return floor;
  };

  const makeLandscape = (parent: THREE.Object3D) => {
    addFloor(parent, 0x4d843e);
    const mountainMaterial = standard(0x73856d, 0.95);
    const snowMaterial = standard(0xeef5f3, 0.9);
    [-2.7, -1.15, 0.6, 2.35].forEach((x, index) => {
      const z = -2.7 - (index % 2) * 0.25;
      const mountain = add(
        new THREE.ConeGeometry(
          1.2 + (index % 2) * 0.22,
          2.4 + (index % 3) * 0.25,
          7,
        ),
        mountainMaterial,
        parent,
        [x, 1.05, z],
        `mountain-${index + 1}`,
      );
      mountain.rotation.y = index * 0.39;
      add(
        new THREE.ConeGeometry(0.39, 0.66, 7),
        snowMaterial,
        parent,
        [x, 2.15 + (index % 3) * 0.13, z],
        `snow-cap-${index + 1}`,
      ).rotation.y = index * 0.39;
    });
    const grassMaterial = standard(0x76aa49, 0.95);
    for (let index = 0; index < 48; index += 1) {
      const radius = 1.7 + (index % 6) * 0.4;
      const angle = index * 2.399;
      const blade = add(
        new THREE.ConeGeometry(0.025, 0.32 + (index % 4) * 0.035, 5),
        grassMaterial,
        parent,
        [Math.sin(angle) * radius, 0.13, Math.cos(angle) * radius],
        `grass-blade-${index + 1}`,
      );
      blade.userData.baseRotation = blade.rotation.z;
      windObjects.push(blade);
    }
  };

  const makeSheep = (
    parent: THREE.Object3D,
    position: [number, number, number],
    scale = 1,
    thickFleece = true,
    name = "woolly",
  ): SheepModel => {
    const sheep = group(name, parent, position);
    sheep.scale.setScalar(scale);
    const skin = standard(0xc9aa82, 0.9);
    const darkSkin = standard(0x4e4338, 0.88);
    const fleeceMaterial = standard(thickFleece ? 0xf4eee0 : 0xe8e1d0, 0.98);
    const bareBody = sphere(
      0.72,
      skin,
      sheep,
      [0, 1.1, 0],
      [1.35, 0.82, 0.78],
      "bare-body",
    );

    const fleece = group("thick-fleece", sheep, [0, 0, 0]);
    const fleecePositions: [number, number, number][] = [];
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const angle = (column / 7) * Math.PI * 2 + row * 0.22;
        fleecePositions.push([
          Math.cos(angle) * (0.65 + row * 0.08),
          0.78 + row * 0.23,
          Math.sin(angle) * 0.55,
        ]);
      }
    }
    fleecePositions.forEach((point, index) => {
      const puff = sphere(
        thickFleece ? 0.34 : 0.25,
        fleeceMaterial,
        fleece,
        point,
        [1.12, 0.92, 0.95],
        `fleece-curl-${index + 1}`,
      );
      puff.rotation.set(index * 0.13, index * 0.21, index * 0.08);
    });

    const head = group("woolly-head", sheep, [1.05, 1.42, 0]);
    sphere(0.34, darkSkin, head, [0, 0, 0], [0.8, 1.1, 0.75], "head");
    sphere(0.2, darkSkin, head, [0.23, -0.1, 0], [1, 0.7, 0.82], "muzzle");
    const eyeMaterial = standard(0x14120f, 0.35, 0, 0x080706);
    sphere(
      0.045,
      eyeMaterial,
      head,
      [0.13, 0.12, 0.25],
      [1, 1, 0.6],
      "right-eye",
    );
    sphere(
      0.045,
      eyeMaterial,
      head,
      [0.13, 0.12, -0.25],
      [1, 1, 0.6],
      "left-eye",
    );
    const earA = sphere(
      0.13,
      darkSkin,
      head,
      [-0.12, 0.19, 0.34],
      [1.5, 0.35, 0.65],
      "right-ear",
    );
    const earB = sphere(
      0.13,
      darkSkin,
      head,
      [-0.12, 0.19, -0.34],
      [1.5, 0.35, 0.65],
      "left-ear",
    );
    earA.rotation.x = -0.32;
    earB.rotation.x = 0.32;
    for (const [x, z] of [
      [-0.52, -0.38],
      [-0.52, 0.38],
      [0.47, -0.38],
      [0.47, 0.38],
    ] as const) {
      const leg = cylinder(
        0.075,
        0.09,
        0.72,
        darkSkin,
        sheep,
        [x, 0.48, z],
        "leg",
      );
      cylinder(
        0.09,
        0.075,
        0.14,
        standard(0x211e1a, 0.8),
        leg,
        [0, -0.39, 0],
        "hoof",
      );
    }
    return { group: sheep, fleece, bareBody, head };
  };

  const makeShears = (
    parent: THREE.Object3D,
    position: [number, number, number],
    name: string,
  ) => {
    const shears = group(name, parent, position);
    const metal = standard(0xb8c6c9, 0.22, 0.78);
    const body = roundedBlock(
      [0.22, 0.28, 0.54],
      standard(0x2d6970, 0.38, 0.12),
      shears,
      [0, 0, 0],
    );
    body.rotation.x = -0.08;
    const bladeA = roundedBlock(
      [0.055, 0.08, 0.72],
      metal,
      shears,
      [-0.065, 0.03, -0.55],
      "blade-a",
    );
    const bladeB = roundedBlock(
      [0.055, 0.08, 0.72],
      metal,
      shears,
      [0.065, 0.03, -0.55],
      "blade-b",
    );
    bladeA.rotation.x = -0.07;
    bladeB.rotation.x = 0.07;
    for (let index = 0; index < 6; index += 1) {
      roundedBlock(
        [0.045, 0.055, 0.16],
        metal,
        shears,
        [-0.1 + index * 0.04, 0.01, -0.92],
        `tooth-${index + 1}`,
      );
    }
    return shears;
  };

  const makeTank = (
    parent: THREE.Object3D,
    position: [number, number, number],
    liquidColour: THREE.ColorRepresentation,
    name: string,
  ) => {
    const tank = group(name, parent, position);
    const glass = physical(0xb9e5e8, 0.28, 0.35);
    add(
      new THREE.BoxGeometry(1.1, 1.05, 0.08),
      glass,
      tank,
      [0, 0.53, -0.5],
      "glass-back",
    );
    add(
      new THREE.BoxGeometry(0.08, 1.05, 1),
      glass,
      tank,
      [-0.51, 0.53, 0],
      "glass-left",
    );
    add(
      new THREE.BoxGeometry(0.08, 1.05, 1),
      glass,
      tank,
      [0.51, 0.53, 0],
      "glass-right",
    );
    add(
      new THREE.BoxGeometry(1.1, 0.08, 1),
      glass,
      tank,
      [0, 0.03, 0],
      "glass-base",
    );
    const water = add(
      new THREE.BoxGeometry(0.94, 0.64, 0.84),
      physical(liquidColour, 0.62, 0.12),
      tank,
      [0, 0.36, 0],
      "tank-water",
    );
    water.userData.baseY = water.position.y;
    return { tank, water };
  };

  const makeFleeceSample = (
    parent: THREE.Object3D,
    position: [number, number, number],
    clean: boolean,
    name: string,
  ) => {
    const sample = group(name, parent, position);
    const colour = clean ? 0xf5f1e7 : 0xcab47c;
    const sampleMaterial = standard(
      colour,
      0.98,
      0,
      clean ? 0x10120f : 0x000000,
    );
    for (let index = 0; index < 15; index += 1) {
      const angle = index * 2.399;
      sphere(
        clean ? 0.23 : 0.2,
        sampleMaterial,
        sample,
        [
          Math.cos(angle) * (0.18 + (index % 4) * 0.11),
          0.12 + (index % 3) * 0.12,
          Math.sin(angle) * (0.14 + (index % 3) * 0.09),
        ],
        clean ? [1.05, 1, 1] : [1.25, 0.72, 0.9],
        `fibre-clump-${index + 1}`,
      );
    }
    return sample;
  };

  // Scene 1: green Flock Valley and Woolly's thick winter fleece.
  const arrival = stageGroup("arrival");
  makeLandscape(arrival);
  const arrivalSheep = makeSheep(arrival, [0.05, 0, 0.2], 1.12, true, "woolly");
  target("fleece", arrivalSheep.fleece);
  target(
    "heartbeat",
    sphere(
      0.11,
      standard(0xe64b55, 0.36, 0, 0x7f1720),
      arrivalSheep.group,
      [0.38, 1.18, 0.96],
      [1.05, 1.05, 0.48],
      "heartbeat",
    ),
  );
  const scanner = group("temperature-scanner", arrival, [-1.7, 1.1, 0.72]);
  roundedBlock(
    [0.28, 0.65, 0.22],
    standard(0x263b43, 0.35, 0.18),
    scanner,
    [0, 0, 0],
  );
  roundedBlock(
    [0.19, 0.2, 0.02],
    standard(0x62e6c8, 0.2, 0, 0x247c6a),
    scanner,
    [0, 0.12, 0.121],
  );
  target("temperature-scanner", scanner);
  const fibreLens = group("wool-fibre", arrival, [1.82, 1.15, 0.65]);
  add(
    new THREE.TorusGeometry(0.34, 0.055, 12, 28),
    standard(0xc9d6d9, 0.24, 0.72),
    fibreLens,
    [0, 0, 0],
  );
  add(
    new THREE.TorusKnotGeometry(0.17, 0.026, 64, 10, 2, 3),
    standard(0xf2ead8, 0.9),
    fibreLens,
    [0, 0, 0.02],
  );
  target("wool-fibre", fibreLens);
  label("FLOCK VALLEY — MEET WOOLLY", arrival, [0, 2.85, -0.25], 2.65);

  // Scene 2: a readable, physical season wheel.
  const season = stageGroup("season");
  makeLandscape(season);
  const seasonSheep = makeSheep(
    season,
    [-1.55, 0, 0.2],
    0.82,
    true,
    "season-woolly",
  );
  const seasonWheel = group("season-wheel", season, [0.75, 1.25, 0]);
  add(
    new THREE.TorusGeometry(1.05, 0.12, 18, 48),
    standard(0xd8c999, 0.48, 0.22),
    seasonWheel,
    [0, 0, 0],
  );
  add(
    new THREE.CylinderGeometry(0.13, 0.13, 0.24, 18),
    standard(0x314c4a, 0.4, 0.3),
    seasonWheel,
    [0, 0, 0],
  ).rotation.x = Math.PI / 2;
  const seasonOptions = [
    ["winter", -0.75, 0.55, 0x87c9e5],
    ["rainy", 0.75, 0.55, 0x557dc3],
    ["summer", 0, -0.78, 0xf3b33e],
  ] as const;
  seasonOptions.forEach(([id, x, y, colour]) => {
    const option = group(id, seasonWheel, [x, y, 0.1]);
    const disc = cylinder(
      0.3,
      0.3,
      0.12,
      standard(colour, 0.42, 0.05, colour),
      option,
      [0, 0, 0],
    );
    disc.rotation.x = Math.PI / 2;
    target(id, option);
    label(id.toUpperCase(), option, [0, -0.43, 0.08], 0.82);
  });
  label("CHOOSE THE SAFE SHEARING SEASON", season, [0, 2.85, -0.25], 3.0);

  // Scene 3: clean station and explicit safe/unsafe equipment.
  const prepare = stageGroup("prepare");
  addFloor(prepare, 0x52686a);
  const platform = roundedBlock(
    [2.35, 0.17, 1.65],
    standard(0x2c4548, 0.98),
    prepare,
    [-0.65, 0.08, 0.15],
    "non-slip-platform",
  );
  target("non-slip-platform", platform);
  const prepareSheep = makeSheep(
    prepare,
    [-0.65, 0.15, 0.12],
    0.86,
    true,
    "station-woolly",
  );
  target("check-dry", prepareSheep.fleece);
  const brush = group("calm-woolly", prepare, [-0.55, 1.95, 0.85]);
  roundedBlock([0.55, 0.13, 0.24], standard(0x8f6238, 0.78), brush, [0, 0, 0]);
  for (let index = 0; index < 7; index += 1)
    cylinder(0.012, 0.018, 0.12, standard(0xe2d5b3, 0.8), brush, [
      -0.22 + index * 0.074,
      -0.11,
      0,
    ]);
  target("calm-woolly", brush);
  const toolTable = roundedBlock(
    [2.6, 0.16, 0.88],
    standard(0x8a6542, 0.78),
    prepare,
    [2.0, 0.76, 0],
    "tool-table",
  );
  toolTable.rotation.y = -0.08;
  const electricShears = makeShears(
    prepare,
    [1.08, 1.04, 0],
    "electric-shears",
  );
  electricShears.scale.setScalar(0.72);
  target("electric-shears", electricShears);
  const inspectBadge = group("inspect-shears", electricShears, [0.28, 0.32, 0]);
  add(
    new THREE.TorusGeometry(0.15, 0.026, 10, 24),
    standard(0x6ee3bd, 0.3, 0, 0x2b8f70),
    inspectBadge,
    [0, 0, 0],
  );
  target("inspect-shears", inspectBadge);
  const oil = group("blade-oil", prepare, [1.73, 1.09, 0]);
  cylinder(0.11, 0.13, 0.42, standard(0xe0b44a, 0.34), oil, [0, 0, 0]);
  cylinder(0.045, 0.07, 0.14, standard(0x292f31, 0.5), oil, [0, 0.28, 0]);
  target("blade-oil", oil);
  const knife = group("kitchen-knife", prepare, [2.3, 1.07, 0]);
  roundedBlock(
    [0.18, 0.1, 0.48],
    standard(0x59412e, 0.75),
    knife,
    [0, 0, 0.17],
  );
  roundedBlock(
    [0.08, 0.05, 0.58],
    standard(0xc9d1d0, 0.2, 0.8),
    knife,
    [0, 0, -0.35],
  );
  target("kitchen-knife", knife);
  const spray = group("water-spray", prepare, [2.82, 1.04, 0]);
  cylinder(0.12, 0.14, 0.48, physical(0x6cbcd8, 0.72), spray, [0, 0, 0]);
  roundedBlock(
    [0.32, 0.09, 0.1],
    standard(0x283d47, 0.55),
    spray,
    [0.11, 0.28, 0],
  );
  target("water-spray", spray);
  const dirtyTool = makeShears(prepare, [3.3, 1.03, 0], "dirty-tool");
  dirtyTool.scale.setScalar(0.62);
  sphere(
    0.13,
    standard(0x74552e, 0.98),
    dirtyTool,
    [0.08, 0.02, -0.62],
    [1.4, 0.4, 1],
    "dirt",
  );
  target("dirty-tool", dirtyTool);
  label("SAFE SHEARING STATION", prepare, [0.8, 2.75, -0.55], 2.4);

  // Scene 4: four calm, nearly parallel shearing passes.
  const shearing = stageGroup("shearing");
  addFloor(shearing, 0x536c63);
  roundedBlock(
    [3.2, 0.18, 2.15],
    standard(0x2f4b4c, 0.98),
    shearing,
    [0, 0.09, 0],
    "shearing-platform",
  );
  const shearingSheep = makeSheep(
    shearing,
    [-0.25, 0.16, 0],
    1.02,
    true,
    "shearing-woolly",
  );
  const pathGroups: THREE.Group[] = [];
  const fleecePatches: THREE.Object3D[] = [];
  const pathData = [
    [-0.63, 1.48, 0.66, -0.08],
    [-0.1, 1.55, 0.68, 0.02],
    [0.4, 1.43, 0.64, 0.09],
    [0.67, 1.15, 0.58, 0.15],
  ] as const;
  pathData.forEach(([x, y, z, rotation], index) => {
    const path = group(`shear-path-${index + 1}`, shearingSheep.group, [
      x,
      y,
      z,
    ]);
    const guide = roundedBlock(
      [0.1, 0.64, 0.035],
      standard(0x3bc9f2, 0.24, 0, 0x167999),
      path,
      [0, 0, 0],
    );
    guide.rotation.z = rotation;
    target(`shear-path-${index + 1}`, path);
    pathGroups.push(path);
    const patch = sphere(
      0.36,
      standard(0xf0eadc, 0.98),
      shearingSheep.group,
      [x, y, 0.49],
      [0.78, 1.18, 0.34],
      `removable-fleece-${index + 1}`,
    );
    fleecePatches.push(patch);
  });
  const activeShears = makeShears(
    shearing,
    [-1.72, 1.15, 0.7],
    "guided-electric-shears",
  );
  activeShears.scale.setScalar(0.72);
  label(
    "FOLLOW THE BLUE LINES — STEADY AND PARALLEL",
    shearing,
    [0, 2.78, -0.35],
    3.5,
  );

  // Scene 5: illuminated raw-fleece detective table.
  const detective = stageGroup("detective");
  addFloor(detective, 0x3e5658);
  roundedBlock(
    [3.5, 0.2, 2.1],
    standard(0x78583d, 0.8),
    detective,
    [0, 0.72, 0],
    "inspection-table",
  );
  const rawFleece = makeFleeceSample(
    detective,
    [0, 0.83, 0],
    false,
    "raw-fleece",
  );
  rawFleece.scale.setScalar(1.65);
  const impurityObjects = new Map<string, THREE.Object3D>();
  const impurityData = [
    ["dust-soil", -0.62, 1.13, 0.2, 0x76583b],
    ["sweat", -0.15, 1.35, 0.32, 0xe5c666],
    ["plant-material", 0.35, 1.08, 0.28, 0x6e8b3d],
    ["lanolin", 0.7, 1.34, 0.18, 0xc99032],
  ] as const;
  impurityData.forEach(([id, x, y, z, colour], index) => {
    const evidence = group(id, detective, [x, y, z]);
    if (id === "plant-material") {
      const straw = cylinder(
        0.025,
        0.025,
        0.4,
        standard(colour, 0.94),
        evidence,
        [0, 0, 0],
      );
      straw.rotation.z = 0.75;
    } else if (id === "sweat" || id === "lanolin") {
      sphere(
        0.12 + index * 0.005,
        physical(colour, 0.72),
        evidence,
        [0, 0, 0],
        [1.3, 0.55, 1],
      );
    } else {
      for (let dot = 0; dot < 5; dot += 1)
        sphere(0.045, standard(colour, 0.95), evidence, [
          Math.sin(dot * 2.2) * 0.12,
          Math.cos(dot * 1.8) * 0.08,
          dot * 0.018,
        ]);
    }
    target(id, evidence);
    impurityObjects.set(id, evidence);
  });
  const magnifier = group("fibre-magnifier", detective, [-1.35, 1.72, 0.64]);
  add(
    new THREE.TorusGeometry(0.32, 0.05, 12, 32),
    standard(0xcad5d5, 0.25, 0.75),
    magnifier,
    [0, 0, 0],
  );
  const handle = cylinder(
    0.05,
    0.06,
    0.55,
    standard(0x35474c, 0.55),
    magnifier,
    [-0.34, -0.3, 0],
  );
  handle.rotation.z = -0.75;
  label(
    "FIBRE DETECTIVE — FIND FOUR IMPURITIES",
    detective,
    [0, 2.75, -0.45],
    3.2,
  );

  // Scene 6: three controlled scouring experiments.
  const experiment = stageGroup("experiment");
  addFloor(experiment, 0x506468);
  const experimentData = [
    ["cold-water", -1.55, 0x6cb8db, "COLD WATER"],
    ["warm-solution", 0, 0x8ad6c1, "WARM + CLEANER"],
    ["very-hot-water", 1.55, 0xe28762, "VERY HOT + ROUGH"],
  ] as const;
  const experimentTanks = new Map<
    NonNullable<WoolProcessingState["selectedContainer"]>,
    ReturnType<typeof makeTank>
  >();
  experimentData.forEach(([id, x, colour, title]) => {
    const tankValue = makeTank(experiment, [x, 0.52, 0], colour, id);
    target(id, tankValue.tank);
    experimentTanks.set(id, tankValue);
    const wool = makeFleeceSample(
      tankValue.tank,
      [0, 0.3, 0.18],
      false,
      `${id}-wool-sample`,
    );
    wool.scale.setScalar(0.55);
    label(title, experiment, [x, 1.95, -0.25], 1.3);
  });
  label(
    "WHICH METHOD CLEANS WITHOUT DAMAGING FIBRES?",
    experiment,
    [0, 2.75, -0.5],
    3.7,
  );

  // Scene 7: full transparent scouring, rinsing and drying station.
  const station = stageGroup("station");
  addFloor(station, 0x455b60);
  const washTank = makeTank(
    station,
    [-1.85, 0.52, 0],
    0x987852,
    "washing-tank",
  );
  const rinseTankOne = makeTank(
    station,
    [-0.52, 0.52, 0],
    0x87bacb,
    "rinse-tank-one",
  );
  const rinseTankTwo = makeTank(
    station,
    [0.82, 0.52, 0],
    0xa4d9e2,
    "rinse-tank-two",
  );
  target("rinse-one", rinseTankOne.tank);
  target("rinse-two", rinseTankTwo.tank);
  const dial = group("temperature-dial", station, [-2.25, 1.75, 0.1]);
  add(
    new THREE.TorusGeometry(0.25, 0.055, 12, 28),
    standard(0xd7dcda, 0.28, 0.7),
    dial,
    [0, 0, 0],
  );
  const dialNeedle = roundedBlock(
    [0.035, 0.22, 0.03],
    standard(0xe75645, 0.4),
    dial,
    [0, 0.08, 0.03],
    "temperature-needle",
  );
  target("temperature-dial", dial);
  const dispenser = group("solution-dispenser", station, [-1.47, 1.75, 0.02]);
  cylinder(0.12, 0.14, 0.5, physical(0x70d3bd, 0.75), dispenser, [0, 0, 0]);
  roundedBlock(
    [0.33, 0.09, 0.1],
    standard(0x294a48, 0.5),
    dispenser,
    [0.12, 0.29, 0],
  );
  target("solution-dispenser", dispenser);
  const paddle = group("wash-paddle", station, [-1.82, 1.34, 0.15]);
  roundedBlock([0.1, 1.0, 0.08], standard(0x8f643e, 0.78), paddle, [0, 0, 0]);
  roundedBlock(
    [0.32, 0.42, 0.07],
    standard(0x8f643e, 0.78),
    paddle,
    [0, -0.46, 0],
  );
  paddle.rotation.z = -0.28;
  target("wash-paddle", paddle);
  const rollers = group("squeeze-rollers", station, [1.75, 0.8, -0.1]);
  const rollerA = cylinder(
    0.19,
    0.19,
    1.0,
    standard(0xb8c6c4, 0.3, 0.6),
    rollers,
    [0, 0.16, 0],
  );
  const rollerB = cylinder(
    0.19,
    0.19,
    1.0,
    standard(0xb8c6c4, 0.3, 0.6),
    rollers,
    [0, -0.22, 0],
  );
  rollerA.rotation.z = Math.PI / 2;
  rollerB.rotation.z = Math.PI / 2;
  target("squeeze-rollers", rollers);
  const twist = group("twist-wool", station, [1.75, 1.58, 0.05]);
  add(
    new THREE.TorusKnotGeometry(0.22, 0.06, 72, 10, 2, 3),
    standard(0xeee8da, 0.96),
    twist,
    [0, 0, 0],
  );
  target("twist-wool", twist);
  const rack = group("drying-rack", station, [3.0, 0.15, -0.1]);
  for (const x of [-0.55, 0.55])
    cylinder(0.055, 0.07, 1.5, standard(0x7c6042, 0.75), rack, [x, 0.75, 0]);
  roundedBlock([1.3, 0.08, 0.08], standard(0x7c6042, 0.75), rack, [0, 1.47, 0]);
  const dryingWool = makeFleeceSample(
    rack,
    [0, 1.05, 0.04],
    true,
    "drying-wool",
  );
  dryingWool.scale.set(1.25, 0.65, 0.55);
  target("drying-rack", rack);
  label("OPERATE THE SCOURING STATION", station, [0.35, 2.82, -0.55], 3.1);

  // Scene 8: direct before/after evidence comparison.
  const compare = stageGroup("compare");
  addFloor(compare, 0x536a63);
  const rawPlinth = cylinder(
    0.83,
    0.95,
    0.45,
    standard(0x6f5743, 0.7),
    compare,
    [-1.25, 0.22, 0],
  );
  const cleanPlinth = cylinder(
    0.83,
    0.95,
    0.45,
    standard(0x456c63, 0.7),
    compare,
    [1.25, 0.22, 0],
  );
  rawPlinth.name = "raw-sample-plinth";
  cleanPlinth.name = "clean-sample-plinth";
  const rawSample = makeFleeceSample(
    compare,
    [-1.25, 0.55, 0],
    false,
    "raw-sample",
  );
  const cleanSample = makeFleeceSample(
    compare,
    [1.25, 0.55, 0],
    true,
    "clean-sample",
  );
  rawSample.scale.set(1.28, 0.86, 1.1);
  cleanSample.scale.set(1.42, 1.2, 1.3);
  target("raw-sample", rawSample);
  target("clean-sample", cleanSample);
  label("RAW: GREASY • HEAVY • DIRTY", compare, [-1.25, 1.95, 0], 2.15);
  label("SCOURED: CLEAN • LIGHT • SOFT", compare, [1.25, 1.95, 0], 2.3);
  label("COMPARE BEFORE AND AFTER SCOURING", compare, [0, 2.75, -0.45], 3.2);

  // Scene 9: six physical timeline objects.
  const journey = stageGroup("journey");
  addFloor(journey, 0x4d6560);
  roundedBlock(
    [6.1, 0.08, 0.28],
    standard(0xd5bb62, 0.42, 0.2, 0x5a4417),
    journey,
    [0, 0.42, 0],
    "journey-line",
  );
  const journeyItems = new Map<string, THREE.Group>();
  const journeyIds = [
    "sheep",
    "shearing",
    "raw-fleece",
    "scouring",
    "rinsing",
    "drying",
  ] as const;
  journeyIds.forEach((id, index) => {
    const x = -2.65 + index * 1.06;
    const item = group(`sequence-${id}`, journey, [
      x,
      1.28 + (index % 2) * 0.15,
      0,
    ]);
    if (id === "sheep")
      makeSheep(item, [0, -0.45, 0], 0.38, true, "journey-sheep");
    else if (id === "shearing") {
      const miniShears = makeShears(item, [0, 0, 0], "journey-shears");
      miniShears.scale.setScalar(0.42);
    } else if (id === "raw-fleece") {
      const miniFleece = makeFleeceSample(
        item,
        [0, -0.2, 0],
        false,
        "journey-raw-fleece",
      );
      miniFleece.scale.setScalar(0.48);
    } else if (id === "scouring" || id === "rinsing") {
      const miniTank = makeTank(
        item,
        [0, -0.48, 0],
        id === "scouring" ? 0x9d8054 : 0x82cddd,
        `journey-${id}`,
      );
      miniTank.tank.scale.setScalar(0.55);
    } else {
      roundedBlock(
        [0.72, 0.07, 0.07],
        standard(0x7d6044, 0.8),
        item,
        [0, 0.1, 0],
      );
      for (const dx of [-0.3, 0.3])
        cylinder(0.03, 0.04, 0.82, standard(0x7d6044, 0.8), item, [
          dx,
          -0.28,
          0,
        ]);
      const drySample = makeFleeceSample(
        item,
        [0, -0.08, 0.04],
        true,
        "journey-dry-wool",
      );
      drySample.scale.setScalar(0.42);
    }
    target(`sequence-${id}`, item);
    journeyItems.set(id, item);
    label(String(index + 1), journey, [x, 0.22, 0.25], 0.38);
  });
  label("BUILD THE WOOL JOURNEY", journey, [0, 2.75, -0.45], 2.6);

  // Scene 10: calm celebration area; quiz questions live in the accessible UI.
  const quiz = stageGroup("quiz");
  makeLandscape(quiz);
  const quizSheep = makeSheep(quiz, [-1.2, 0, 0], 0.9, false, "happy-woolly");
  const badge = group("master-of-wool-processing-badge", quiz, [1.0, 1.35, 0]);
  const badgeDisc = cylinder(
    0.72,
    0.72,
    0.12,
    standard(0xe6b84d, 0.28, 0.65, 0x79500c),
    badge,
    [0, 0, 0],
  );
  badgeDisc.rotation.x = Math.PI / 2;
  add(
    new THREE.TorusGeometry(0.55, 0.07, 14, 36),
    standard(0xffe28a, 0.22, 0.55, 0x8d6411),
    badge,
    [0, 0, 0.08],
  );
  const badgeFleece = makeFleeceSample(
    badge,
    [0, -0.18, 0.11],
    true,
    "badge-fleece",
  );
  badgeFleece.scale.setScalar(0.54);
  label("MASTER OF WOOL PROCESSING", quiz, [0.5, 2.72, -0.35], 3.05);

  const hemisphere = new THREE.HemisphereLight(0xd8f2ff, 0x31452f, 2.25);
  const key = new THREE.DirectionalLight(0xfff4d7, 3.25);
  key.name = "warm-sunlight";
  key.position.set(3.5, 7, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  const fill = new THREE.PointLight(0x78d8c7, 7, 11, 2);
  fill.position.set(-3, 3, 3);
  root.add(hemisphere, key, fill);

  function update(state: WoolProcessingState, delta: number, elapsed: number) {
    const activeId =
      STAGE_ORDER[
        Math.min(Math.max(state.stageIndex, 0), STAGE_ORDER.length - 1)
      ];
    stageRoots.forEach((value, id) => {
      value.visible = id === activeId;
    });

    windObjects.forEach((blade, index) => {
      blade.rotation.z = Math.sin(elapsed * 1.3 + index * 0.32) * 0.09;
    });
    [arrivalSheep, seasonSheep, prepareSheep, shearingSheep, quizSheep].forEach(
      (sheep, index) => {
        sheep.head.rotation.z = Math.sin(elapsed * 0.85 + index) * 0.045;
      },
    );
    arrivalSheep.fleece.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.012);
    const heartbeat = targets.get("heartbeat");
    if (heartbeat)
      heartbeat.scale.setScalar(1 + Math.sin(elapsed * 5.6) * 0.12);

    const selectedSeason = state.selectedSeason;
    seasonOptions.forEach(([id]) => {
      const object = targets.get(id);
      if (!object) return;
      const selected = selectedSeason === id;
      object.scale.lerp(
        new THREE.Vector3().setScalar(selected ? 1.18 : 1),
        1 - Math.exp(-delta * 7),
      );
      object.rotation.z = selected ? Math.sin(elapsed * 3.2) * 0.04 : 0;
    });
    seasonSheep.group.rotation.z =
      selectedSeason === "winter" ? Math.sin(elapsed * 14) * 0.025 : 0;

    PREPARATION_TARGETS.forEach((id, index) => {
      const object = targets.get(id);
      if (!object) return;
      const complete = index < state.preparationIndex;
      object.scale.setScalar(
        complete ? 1.08 + Math.sin(elapsed * 3 + index) * 0.02 : 1,
      );
    });

    pathGroups.forEach((path, index) => {
      const complete = index < state.shearingIndex;
      path.visible = !complete;
      path.scale.setScalar(
        index === state.shearingIndex ? 1 + Math.sin(elapsed * 4.5) * 0.1 : 1,
      );
      fleecePatches[index].visible = !complete;
    });
    activeShears.position.x = -1.72 + Math.min(state.shearingIndex, 3) * 0.55;
    activeShears.position.y = 1.15 + Math.sin(elapsed * 7) * 0.025;
    shearingSheep.bareBody.visible = state.shearingIndex > 0;
    shearingSheep.fleece.visible = state.shearingIndex < 4;

    impurityObjects.forEach((object, id) => {
      const found = state.inspected.includes(id);
      object.scale.setScalar(found ? 1.35 + Math.sin(elapsed * 3.4) * 0.07 : 1);
    });

    experimentTanks.forEach(({ tank, water }, id) => {
      const tested = state.testedContainers.includes(id);
      const selected = state.selectedContainer === id;
      tank.scale.setScalar(selected ? 1.08 : 1);
      water.position.y =
        (water.userData.baseY as number) +
        Math.sin(elapsed * (tested ? 2.2 : 0.7)) * (tested ? 0.035 : 0.012);
      water.rotation.z =
        id === "very-hot-water" && tested ? Math.sin(elapsed * 7) * 0.04 : 0;
    });

    dialNeedle.rotation.z +=
      ((state.scouringIndex > 0 ? -0.18 : -0.9) - dialNeedle.rotation.z) *
      Math.min(1, delta * 5);
    paddle.rotation.z =
      -0.28 + (state.scouringIndex >= 3 ? Math.sin(elapsed * 2.8) * 0.17 : 0);
    washTank.water.material.opacity = state.scouringIndex >= 3 ? 0.78 : 0.62;
    rinseTankOne.water.material.opacity =
      state.scouringIndex >= 4 ? 0.72 : 0.62;
    rinseTankTwo.water.material.opacity =
      state.scouringIndex >= 5 ? 0.48 : 0.62;
    rollerA.rotation.y = state.scouringIndex >= 6 ? elapsed * 2.1 : 0;
    rollerB.rotation.y = state.scouringIndex >= 6 ? -elapsed * 2.1 : 0;
    dryingWool.scale.y =
      state.scouringIndex >= 7 ? 0.9 + Math.sin(elapsed * 1.2) * 0.035 : 0.52;
    STATION_TARGETS.forEach((id, index) => {
      const object = targets.get(id);
      if (object && index === state.scouringIndex)
        object.scale.setScalar(1 + Math.sin(elapsed * 4.2) * 0.07);
    });

    rawSample.rotation.y = Math.sin(elapsed * 0.55) * 0.09;
    cleanSample.rotation.y = -Math.sin(elapsed * 0.55) * 0.09;
    cleanSample.position.y = 0.55 + Math.sin(elapsed * 1.4) * 0.025;

    journeyItems.forEach((item, id) => {
      const index = journeyIds.indexOf(id as (typeof journeyIds)[number]);
      const complete = index < state.sequenceIndex;
      const targetY = complete ? 0.88 : 1.28 + (index % 2) * 0.15;
      item.position.y += (targetY - item.position.y) * Math.min(1, delta * 5);
      item.scale.setScalar(complete ? 0.82 : 1);
    });

    badge.rotation.y = Math.sin(elapsed * 0.7) * 0.18;
    badge.scale.setScalar(
      state.completed ? 1.08 + Math.sin(elapsed * 2.8) * 0.035 : 0.88,
    );
  }

  function getFrame(stage: WoolStageId) {
    if (stage === "arrival")
      return {
        position: new THREE.Vector3(0, 2.25, 5.35),
        target: new THREE.Vector3(0, 1.15, 0),
      };
    if (stage === "season")
      return {
        position: new THREE.Vector3(0, 2.15, 5.25),
        target: new THREE.Vector3(0, 1.15, 0),
      };
    if (stage === "prepare")
      return {
        position: new THREE.Vector3(0.65, 2.35, 5.55),
        target: new THREE.Vector3(0.65, 1.1, 0),
      };
    if (stage === "shearing")
      return {
        position: new THREE.Vector3(0, 2.0, 4.65),
        target: new THREE.Vector3(0, 1.15, 0),
      };
    if (stage === "detective")
      return {
        position: new THREE.Vector3(0, 2.35, 4.15),
        target: new THREE.Vector3(0, 1.15, 0),
      };
    if (stage === "experiment")
      return {
        position: new THREE.Vector3(0, 2.25, 5.15),
        target: new THREE.Vector3(0, 0.9, 0),
      };
    if (stage === "station")
      return {
        position: new THREE.Vector3(0.45, 2.35, 6.15),
        target: new THREE.Vector3(0.45, 1.0, 0),
      };
    if (stage === "compare")
      return {
        position: new THREE.Vector3(0, 2.2, 4.9),
        target: new THREE.Vector3(0, 1.05, 0),
      };
    if (stage === "journey")
      return {
        position: new THREE.Vector3(0, 2.35, 6.2),
        target: new THREE.Vector3(0, 1.0, 0),
      };
    return {
      position: new THREE.Vector3(0, 2.35, 5.25),
      target: new THREE.Vector3(0, 1.15, 0),
    };
  }

  function dispose() {
    scene.remove(root);
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  }

  return { root, targets, getFrame, update, dispose };
}
