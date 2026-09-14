import * as THREE from "three";
import {
  AMOEBA_SEQUENCE,
  type AmoebaStageId,
  type AmoebaState,
} from "./amoebaNutritionLesson";

type Material = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;

export function createAmoebaNutritionScene(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = "amoeba-nutrition-world";
  scene.add(root);

  const targets = new Map<string, THREE.Object3D>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  const animatedBlobs: THREE.Object3D[] = [];
  const stageRoots = new Map<AmoebaStageId, THREE.Group>();

  const material = (
    colour: THREE.ColorRepresentation,
    roughness = 0.58,
    metalness = 0,
    emissive: THREE.ColorRepresentation = 0x000000,
  ) => {
    const value = new THREE.MeshStandardMaterial({
      color: colour,
      roughness,
      metalness,
      emissive,
      emissiveIntensity: emissive === 0x000000 ? 0 : 0.55,
    });
    materials.add(value);
    return value;
  };

  const translucent = (
    colour: THREE.ColorRepresentation,
    opacity: number,
    transmission = 0.18,
  ) => {
    const value = new THREE.MeshPhysicalMaterial({
      color: colour,
      roughness: 0.2,
      metalness: 0,
      transparent: true,
      opacity,
      transmission,
      thickness: 0.45,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      side: THREE.DoubleSide,
      depthWrite: opacity > 0.5,
    });
    materials.add(value);
    return value;
  };

  const add = <Geometry extends THREE.BufferGeometry>(
    geometry: Geometry,
    surface: Material,
    parent: THREE.Object3D,
    position: [number, number, number] = [0, 0, 0],
  ) => {
    geometries.add(geometry);
    materials.add(surface);
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
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

  const stageGroup = (id: AmoebaStageId) => {
    const value = group(`amoeba-stage-${id}`);
    stageRoots.set(id, value);
    return value;
  };

  const target = (id: string, object: THREE.Object3D) => {
    targets.set(id, object);
    object.traverse((child) => {
      child.userData.targetId = id;
    });
    return object;
  };

  const sphere = (
    radius: number,
    surface: Material,
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
    segments = 24,
  ) => {
    const mesh = add(
      new THREE.SphereGeometry(radius, segments, Math.max(12, segments / 2)),
      surface,
      parent,
      position,
    );
    mesh.scale.set(...scale);
    return mesh;
  };

  const tubeBetween = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    surface: Material,
    parent: THREE.Object3D,
  ) => {
    const direction = end.clone().sub(start);
    const mesh = add(
      new THREE.CylinderGeometry(radius, radius * 0.82, direction.length(), 16),
      surface,
      parent,
      start.clone().add(end).multiplyScalar(0.5).toArray() as [number, number, number],
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  };

  const irregularBlob = (
    radius: number,
    surface: Material,
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
    seed = 1,
  ) => {
    const geometry = new THREE.IcosahedronGeometry(radius, 3);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index);
      const wave =
        1 +
        Math.sin(vertex.x * 5.7 + seed) * 0.055 +
        Math.sin(vertex.y * 7.1 - seed * 0.8) * 0.04 +
        Math.cos(vertex.z * 6.4 + seed * 1.3) * 0.045;
      vertex.multiplyScalar(wave);
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    const mesh = add(geometry, surface, parent, position);
    mesh.scale.set(...scale);
    mesh.userData.baseScale = mesh.scale.clone();
    animatedBlobs.push(mesh);
    return mesh;
  };

  const label = (
    text: string,
    parent: THREE.Object3D,
    position: [number, number, number],
    colour = "#e7fff8",
  ) => {
    if (typeof document === "undefined") {
      return add(
        new THREE.PlaneGeometry(1.25, 0.31),
        material(0xdaf7ef, 1),
        parent,
        position,
      );
    }
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 188;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "rgba(5,32,40,.9)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = colour;
    context.lineWidth = 10;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    context.fillStyle = "#f4fffd";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "600 44px sans-serif";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    const surface = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    materials.add(surface);
    return add(new THREE.PlaneGeometry(1.45, 0.355), surface, parent, position);
  };

  const glow = material(0x9bfff0, 0.3, 0, 0x1de3be);
  const nutrient = material(0xffd768, 0.25, 0, 0xffb62f);
  const nucleusMaterial = material(0x8757bc, 0.42, 0, 0x422267);
  const vacuoleMaterial = translucent(0x7eddf0, 0.48, 0.35);
  const cytoplasmMaterial = translucent(0x76c9a8, 0.35, 0.22);
  const membraneMaterial = translucent(0x9ae9c8, 0.58, 0.28);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x3e9c9d,
    roughness: 0.18,
    metalness: 0,
    transparent: true,
    opacity: 0.78,
    transmission: 0.18,
    clearcoat: 0.5,
  });
  materials.add(waterMaterial);

  const makeMicrobe = (
    parent: THREE.Object3D,
    position: [number, number, number],
    colour: THREE.ColorRepresentation,
    scale = 1,
  ) => {
    const microbe = group("background-microbe", parent, position);
    sphere(0.1 * scale, material(colour, 0.7), microbe, [0, 0, 0], [1.7, 0.65, 0.72], 14);
    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2;
      tubeBetween(
        new THREE.Vector3(Math.cos(angle) * 0.1, Math.sin(angle) * 0.05, 0),
        new THREE.Vector3(Math.cos(angle) * 0.18, Math.sin(angle) * 0.11, 0),
        0.009,
        material(colour, 0.8),
        microbe,
      );
    }
    return microbe;
  };

  const makeAmoeba = (
    parent: THREE.Object3D,
    options: { scale?: number; position?: [number, number, number]; targetPrefix?: string } = {},
  ) => {
    const scale = options.scale ?? 1;
    const amoeba = group("ami-the-amoeba", parent, options.position ?? [0, 1, 0]);
    amoeba.scale.setScalar(scale);
    const membrane = irregularBlob(1.02, membraneMaterial, amoeba, [0, 0, 0], [1.16, 0.92, 0.52], 2.3);
    const cytoplasm = irregularBlob(0.86, cytoplasmMaterial, amoeba, [0, 0, 0.035], [1.14, 0.9, 0.5], 4.1);
    const nucleus = sphere(0.25, nucleusMaterial, amoeba, [-0.2, 0.08, 0.35], [1, 0.92, 0.55], 28);
    const vacuole = sphere(0.19, vacuoleMaterial, amoeba, [0.37, -0.18, 0.35], [1.05, 0.9, 0.55], 24);
    const pseudopodia = group("pseudopodia", amoeba);
    const tips: THREE.Mesh[] = [];
    const pseudoSurface = translucent(0x8de0bd, 0.62, 0.15);
    const vectors = [
      [0.82, 0.24, 0, 1.38, 0.52, 0] as const,
      [-0.78, 0.15, 0, -1.32, 0.42, 0] as const,
      [0.3, -0.7, 0, 0.55, -1.18, 0] as const,
    ];
    for (const [sx, sy, sz, ex, ey, ez] of vectors) {
      tubeBetween(
        new THREE.Vector3(sx, sy, sz),
        new THREE.Vector3(ex, ey, ez),
        0.14,
        pseudoSurface,
        pseudopodia,
      );
      tips.push(sphere(0.22, pseudoSurface, pseudopodia, [ex, ey, ez], [1.15, 0.72, 0.45], 20));
    }
    const prefix = options.targetPrefix;
    if (prefix === "anatomy") {
      target("cell-membrane", membrane);
      target("cytoplasm", cytoplasm);
      target("nucleus", nucleus);
      target("food-vacuole", vacuole);
      target("pseudopodia", pseudopodia);
    }
    return { amoeba, membrane, cytoplasm, nucleus, vacuole, pseudopodia, tips };
  };

  const pond = stageGroup("pond");
  const pondBank = add(new THREE.CylinderGeometry(3.2, 3.5, 0.38, 64), material(0x5c6f32, 0.96), pond, [0, 0, 0]);
  pondBank.receiveShadow = true;
  const water = add(new THREE.CircleGeometry(2.75, 64), waterMaterial, pond, [0, 0.205, 0]);
  water.rotation.x = -Math.PI / 2;
  target("pond-water", water);
  for (let index = 0; index < 28; index += 1) {
    const angle = (index / 28) * Math.PI * 2;
    const radius = 2.95 + (index % 3) * 0.08;
    const reed = group("reed", pond, [Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius]);
    for (let blade = 0; blade < 3; blade += 1) {
      const stem = add(new THREE.CylinderGeometry(0.018, 0.026, 0.75 + blade * 0.12, 7), material(0x527e39, 0.9), reed, [blade * 0.05, 0.36 + blade * 0.06, 0]);
      stem.rotation.z = (blade - 1) * 0.12;
    }
  }
  const labTable = group("pond-lab-table", pond, [0, 0.22, 3.25]);
  add(new THREE.BoxGeometry(4.1, 0.18, 1.65), material(0x8a5c38, 0.88), labTable, [0, 0.72, 0]);
  for (const x of [-1.7, 1.7])
    for (const z of [-0.57, 0.57])
      add(new THREE.BoxGeometry(0.14, 0.75, 0.14), material(0x674126, 0.92), labTable, [x, 0.34, z]);

  const dropper = group("dropper", labTable, [-1.15, 1.06, 0]);
  const dropperTube = add(new THREE.CylinderGeometry(0.055, 0.035, 0.72, 16), translucent(0xddeff0, 0.7, 0.5), dropper);
  dropperTube.rotation.z = Math.PI / 2;
  sphere(0.11, material(0xb85058, 0.65), dropper, [-0.38, 0, 0], [1.2, 0.8, 0.8], 20);
  target("dropper", dropper);

  const slide = group("glass-slide", labTable, [0.05, 0.87, 0]);
  add(new THREE.BoxGeometry(1.18, 0.025, 0.48), translucent(0xe6ffff, 0.56, 0.62), slide);
  sphere(0.12, waterMaterial, slide, [0, 0.035, 0], [1.25, 0.16, 1], 22);
  target("glass-slide", slide);

  const microscope = group("microscope", labTable, [1.25, 0.83, 0]);
  const metal = material(0xc8d4d1, 0.25, 0.55);
  add(new THREE.BoxGeometry(0.9, 0.12, 0.65), material(0x26343d, 0.35, 0.55), microscope, [0, 0.05, 0]);
  const pillar = add(new THREE.CylinderGeometry(0.11, 0.14, 0.96, 18), metal, microscope, [0.25, 0.55, 0]);
  pillar.rotation.z = -0.33;
  const lens = add(new THREE.CylinderGeometry(0.12, 0.17, 0.56, 20), material(0x27323d, 0.28, 0.7), microscope, [-0.06, 0.95, 0]);
  lens.rotation.z = -0.33;
  add(new THREE.BoxGeometry(0.78, 0.07, 0.55), metal, microscope, [-0.08, 0.45, 0]);
  target("microscope", microscope);
  label("POND SAMPLE LAB", pond, [0, 2.15, 0]);

  const find = stageGroup("find");
  for (let index = 0; index < 18; index += 1) {
    makeMicrobe(
      find,
      [Math.sin(index * 2.1) * 2.5, 0.35 + (index % 6) * 0.36, Math.cos(index * 1.3) * 0.55],
      index % 2 ? 0xffc47b : 0x71cde3,
      0.55 + (index % 3) * 0.18,
    );
  }
  const foundAmoeba = makeAmoeba(find, { scale: 0.72, position: [0.35, 1.15, 0.1] });
  target("amoeba", foundAmoeba.amoeba);
  label("FIND THE ORGANISM WITH NO FIXED SHAPE", find, [0, 2.55, -0.15]);

  const anatomy = stageGroup("anatomy");
  makeAmoeba(anatomy, { scale: 1.48, position: [0, 1.05, 0], targetPrefix: "anatomy" });
  label("EXPLORE AMI'S ONE-CELL BODY", anatomy, [0, 2.75, 0]);

  const hungry = stageGroup("hungry");
  const hungryAmoeba = makeAmoeba(hungry, { scale: 1.12, position: [-0.55, 1.05, 0] });
  const food = makeMicrobe(hungry, [1.75, 1.2, 0.12], 0xffa657, 1.25);
  target("food-particle", food);
  const feedingPseudo = group("feeding-pseudopodium", hungry, [0.25, 1.22, 0]);
  tubeBetween(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.05, 0, 0), 0.16, translucent(0x8de0bd, 0.65, 0.16), feedingPseudo);
  sphere(0.21, translucent(0x8de0bd, 0.65, 0.16), feedingPseudo, [1.05, 0, 0], [1.2, 0.7, 0.48], 20);
  feedingPseudo.scale.x = 0.15;
  target("feeding-pseudopodium", feedingPseudo);
  hungryAmoeba.amoeba.rotation.z = -0.08;
  label("CHOOSE FOOD FOR AMI", hungry, [0, 2.55, 0]);

  const ingestion = stageGroup("ingestion");
  makeAmoeba(ingestion, { scale: 1.16, position: [-0.42, 1.05, 0] });
  const ingestionFood = makeMicrobe(ingestion, [0.85, 1.18, 0.08], 0xffa657, 1.15);
  const leftPseudo = group("left-pseudopodium", ingestion, [0.2, 1.23, 0]);
  const rightPseudo = group("right-pseudopodium", ingestion, [0.2, 0.95, 0]);
  tubeBetween(new THREE.Vector3(), new THREE.Vector3(0.82, 0.2, 0), 0.14, translucent(0x8de0bd, 0.68, 0.16), leftPseudo);
  tubeBetween(new THREE.Vector3(), new THREE.Vector3(0.82, -0.2, 0), 0.14, translucent(0x8de0bd, 0.68, 0.16), rightPseudo);
  target("left-pseudopodium", leftPseudo);
  target("right-pseudopodium", rightPseudo);
  const ingestionVacuole = sphere(0.34, vacuoleMaterial, ingestion, [0.6, 1.08, 0.28], [1, 0.92, 0.48], 28);
  ingestionVacuole.visible = false;
  target("ingestion-vacuole", ingestionVacuole);
  label("INGESTION · FOOD ENTERS THE CELL", ingestion, [0, 2.6, 0]);

  const digestion = stageGroup("digestion");
  const digestionVacuole = sphere(1.08, vacuoleMaterial, digestion, [0, 1.15, 0], [1.12, 0.92, 0.42], 36);
  const complexFood = irregularBlob(0.43, material(0xd87143, 0.62), digestion, [0, 1.15, 0.25], [1.1, 0.92, 0.48], 7);
  const enzymes: THREE.Mesh[] = [];
  const enzymePositions: [number, number, number][] = [[-0.62, 1.42, 0.35], [0.58, 1.52, 0.34], [0.2, 0.68, 0.36]];
  enzymePositions.forEach((position, index) => {
    const enzyme = sphere(0.16, glow, digestion, position, [1, 1, 0.55], 20);
    enzymes.push(enzyme);
    target(`enzyme-${["one", "two", "three"][index]}`, enzyme);
  });
  const digestedParticles: THREE.Mesh[] = [];
  for (let index = 0; index < 16; index += 1) {
    digestedParticles.push(
      sphere(
        0.055,
        nutrient,
        digestion,
        [Math.sin(index * 2.2) * 0.55, 1.15 + Math.cos(index * 1.7) * 0.45, 0.42],
        [1, 1, 0.65],
        12,
      ),
    );
  }
  label("DIGESTION · COMPLEX FOOD BECOMES SIMPLE", digestion, [0, 2.65, 0]);

  const assimilation = stageGroup("assimilation");
  const assimilationAmoeba = makeAmoeba(assimilation, { scale: 1.26, position: [0, 1.18, 0] });
  const zoneData = [
    ["energy-nutrient", "ENERGY", -1.55, 0x56d6ff],
    ["growth-nutrient", "GROWTH", 0, 0x86e05f],
    ["repair-nutrient", "REPAIR", 1.55, 0xffb35c],
  ] as const;
  const nutrientZones: THREE.Mesh[] = [];
  zoneData.forEach(([id, text, x, colour]) => {
    const zone = sphere(0.25, material(colour, 0.25, 0, colour), assimilation, [x, 0.35, 0.15], [1, 1, 0.55], 24);
    nutrientZones.push(zone);
    target(id, zone);
    label(text, assimilation, [x, -0.08, 0.1], `#${new THREE.Color(colour).getHexString()}`);
  });
  assimilationAmoeba.amoeba.position.y = 1.36;
  label("ABSORB · THEN USE NUTRIENTS", assimilation, [0, 2.75, 0]);

  const egestion = stageGroup("egestion");
  makeAmoeba(egestion, { scale: 1.28, position: [0, 1.15, 0] });
  const wasteVacuole = group("waste-vacuole", egestion, [0.05, 1.22, 0.38]);
  sphere(0.27, vacuoleMaterial, wasteVacuole, [0, 0, 0], [1, 0.9, 0.5], 24);
  irregularBlob(0.12, material(0x705541, 0.92), wasteVacuole, [0, 0, 0.12], [1.2, 0.7, 0.45], 9);
  target("waste-vacuole", wasteVacuole);
  const releaseGate = group("waste-release", egestion, [1.35, 1.2, 0.18]);
  const releaseRing = add(new THREE.TorusGeometry(0.3, 0.055, 10, 32), glow, releaseGate);
  releaseRing.rotation.y = Math.PI / 2;
  target("waste-release", releaseGate);
  label("EGESTION · UNDIGESTED FOOD LEAVES", egestion, [0, 2.72, 0]);

  const sequence = stageGroup("sequence");
  const sequenceCards = new Map<string, THREE.Group>();
  AMOEBA_SEQUENCE.forEach((name, index) => {
    const x = (index - 2) * 1.12;
    const card = group(`sequence-${name}`, sequence, [x, 1.12 + Math.abs(index - 2) * 0.08, 0]);
    const cardMesh = add(new THREE.BoxGeometry(0.94, 0.68, 0.12), material(index % 2 ? 0x186a70 : 0x215c62, 0.45), card);
    target(`sequence-${name}`, card);
    label(name.toUpperCase(), card, [0, 0, 0.075]);
    sequenceCards.set(name, card);
    cardMesh.userData.order = index;
  });
  label("BUILD THE HOLOZOIC NUTRITION CYCLE", sequence, [0, 2.55, 0]);

  const recap = stageGroup("recap");
  const recapAmoeba = makeAmoeba(recap, { scale: 1.38, position: [0, 1.18, 0] });
  target("recap-pseudopodia", recapAmoeba.pseudopodia);
  target("recap-food-vacuole", recapAmoeba.vacuole);
  target("recap-nucleus", recapAmoeba.nucleus);
  const recapWaste = irregularBlob(0.12, material(0x705541, 0.92), recap, [1.72, 1.2, 0.18], [1.2, 0.75, 0.55], 10);
  target("recap-egestion", recapWaste);
  label("FINAL EVIDENCE CHECK", recap, [0, 2.75, 0]);

  const ambient = group("microscopic-ambient");
  const ambientParticles: THREE.Mesh[] = [];
  for (let index = 0; index < 55; index += 1) {
    const particle = sphere(
      0.015 + (index % 4) * 0.006,
      material(index % 3 === 0 ? 0x89ffe6 : 0xa1c9ff, 0.6, 0, 0x183d4a),
      ambient,
      [
        Math.sin(index * 12.7) * (2.4 + (index % 5) * 0.18),
        0.12 + (index % 12) * 0.23,
        -0.6 + Math.cos(index * 7.3) * 0.72,
      ],
      [1, 1, 1],
      8,
    );
    ambientParticles.push(particle);
  }

  const hemisphere = new THREE.HemisphereLight(0xb9f4ff, 0x123641, 2.35);
  const key = new THREE.DirectionalLight(0xe8fff7, 3.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const fill = new THREE.PointLight(0x51d8c5, 8, 10, 2);
  fill.position.set(-3, 2.5, 2.5);
  root.add(hemisphere, key, fill);

  function update(state: AmoebaState, delta: number, elapsed: number) {
    const activeId = [...stageRoots.keys()][Math.min(state.stageIndex, stageRoots.size - 1)];
    stageRoots.forEach((value, id) => {
      value.visible = id === activeId;
    });
    ambient.visible = activeId !== "pond";
    animatedBlobs.forEach((blob, index) => {
      const pulse = 1 + Math.sin(elapsed * (1.05 + (index % 3) * 0.17) + index) * 0.022;
      const baseScale = blob.userData.baseScale as THREE.Vector3;
      blob.scale.copy(baseScale).multiplyScalar(pulse);
      blob.rotation.z += Math.sin(elapsed * 0.4 + index) * delta * 0.008;
    });
    ambientParticles.forEach((particle, index) => {
      particle.position.y += delta * (0.025 + (index % 5) * 0.009);
      if (particle.position.y > 3.1) particle.position.y = 0.05;
      particle.position.x += Math.sin(elapsed * 0.35 + index) * delta * 0.012;
    });
    water.material.opacity = 0.72 + Math.sin(elapsed * 1.2) * 0.035;
    dropper.rotation.z = state.sampleIndex >= 1 ? -0.18 : 0;
    slide.position.y = state.sampleIndex >= 3 ? 0.9 : 0.87;
    microscope.scale.setScalar(state.sampleIndex >= 4 ? 1.05 + Math.sin(elapsed * 4) * 0.015 : 1);

    foundAmoeba.amoeba.position.x = 0.35 + Math.sin(elapsed * 0.6) * 0.12;
    foundAmoeba.amoeba.rotation.z = Math.sin(elapsed * 0.42) * 0.08;
    const foodChosen = state.inspected.includes("food-particle");
    const pseudoExtended = state.inspected.includes("feeding-pseudopodium");
    feedingPseudo.scale.x += ((pseudoExtended ? 1 : 0.15) - feedingPseudo.scale.x) * Math.min(1, delta * 4);
    food.position.x += ((foodChosen ? 1.1 : 1.75) - food.position.x) * Math.min(1, delta * 3);

    const leftActive = state.inspected.includes("left-pseudopodium");
    const rightActive = state.inspected.includes("right-pseudopodium");
    leftPseudo.rotation.z += ((leftActive ? -0.22 : 0.08) - leftPseudo.rotation.z) * Math.min(1, delta * 5);
    rightPseudo.rotation.z += ((rightActive ? 0.22 : -0.08) - rightPseudo.rotation.z) * Math.min(1, delta * 5);
    ingestionVacuole.visible = leftActive && rightActive;
    ingestionFood.visible = !ingestionVacuole.visible;

    const enzymeCount = ["enzyme-one", "enzyme-two", "enzyme-three"].filter((id) => state.inspected.includes(id)).length;
    enzymes.forEach((enzyme, index) => {
      const active = index < enzymeCount;
      const scale = active ? 1.18 + Math.sin(elapsed * 4 + index) * 0.08 : 1;
      enzyme.scale.setScalar(scale);
    });
    complexFood.scale.setScalar(Math.max(0.12, 1 - enzymeCount * 0.27));
    digestedParticles.forEach((particle, index) => {
      particle.visible = enzymeCount >= 2;
      particle.position.x += Math.sin(elapsed * 0.8 + index) * delta * 0.03;
      particle.position.y += Math.cos(elapsed * 0.7 + index) * delta * 0.02;
    });

    nutrientZones.forEach((zone, index) => {
      const id = zoneData[index][0];
      const powered = state.inspected.includes(id);
      const scale = powered ? 1.16 + Math.sin(elapsed * 3.8 + index) * 0.06 : 1;
      zone.scale.setScalar(scale);
    });
    const poweredZones = zoneData.filter(([id]) => state.inspected.includes(id)).length;
    assimilationAmoeba.amoeba.rotation.z = Math.sin(elapsed * (0.5 + poweredZones * 0.18)) * (0.025 + poweredZones * 0.018);

    const wasteGuided = state.inspected.includes("waste-vacuole");
    const wasteReleased = state.inspected.includes("waste-release");
    const wasteDestination = wasteReleased
      ? new THREE.Vector3(2.05, 1.2, 0.38)
      : wasteGuided
        ? new THREE.Vector3(1.15, 1.2, 0.38)
        : new THREE.Vector3(0.05, 1.22, 0.38);
    wasteVacuole.position.lerp(wasteDestination, 1 - Math.exp(-delta * 4));
    releaseGate.scale.setScalar(wasteReleased ? 1.2 + Math.sin(elapsed * 4) * 0.07 : 1);

    sequenceCards.forEach((card, name) => {
      const index = AMOEBA_SEQUENCE.indexOf(name as (typeof AMOEBA_SEQUENCE)[number]);
      const chosen = index < state.sequenceIndex;
      const targetY = chosen ? 0.35 : 1.12 + Math.abs(index - 2) * 0.08;
      card.position.y += (targetY - card.position.y) * Math.min(1, delta * 5);
      card.scale.setScalar(chosen ? 0.72 : 1);
    });

    recapWaste.position.x = 1.72 + Math.sin(elapsed * 1.3) * 0.08;
  }

  function getFrame(stage: AmoebaStageId) {
    if (stage === "pond")
      return { position: new THREE.Vector3(0, 2.9, 6.4), target: new THREE.Vector3(0, 0.7, 1.6) };
    if (stage === "sequence")
      return { position: new THREE.Vector3(0, 2.25, 5.7), target: new THREE.Vector3(0, 1.05, 0) };
    if (stage === "digestion")
      return { position: new THREE.Vector3(0, 1.85, 4.15), target: new THREE.Vector3(0, 1.15, 0) };
    if (stage === "assimilation")
      return { position: new THREE.Vector3(0, 2.05, 5.0), target: new THREE.Vector3(0, 1.0, 0) };
    return { position: new THREE.Vector3(0, 2.0, 4.35), target: new THREE.Vector3(0, 1.1, 0) };
  }

  function dispose() {
    scene.remove(root);
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((value) => value.dispose());
    textures.forEach((texture) => texture.dispose());
  }

  return { root, targets, update, getFrame, dispose };
}
