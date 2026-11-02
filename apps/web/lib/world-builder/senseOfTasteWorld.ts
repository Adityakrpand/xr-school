import * as THREE from 'three';

import { SENSE_OF_TASTE_SCENE_METADATA } from '@xr-school/simulation-content';
import type { SimulationSceneContext } from '@xr-school/simulation-web';

import type { GuidedSceneWorld } from '../simulations/guided/sceneWorld';

const CUE_IDS = [
  'scene:saliva-release-lab',
  'scene:taste-bud-observatory',
  'scene:nose-flavour-connection',
  'scene:mystery-flavour-challenge',
] as const;

const ACTION_IDS = [
  'dissolve-virtual-food-sample',
  'scan-taste-bud-receptors',
  'open-retronasal-aroma-route',
  'inspect-mystery-flavour-sample',
] as const;

const ACTION_LABELS = [
  'Release the saliva drop',
  'Scan the giant taste bud',
  'Open the aroma route',
  'Inspect the mystery sample',
] as const;

const TASTE_COLORS = [0xf7c948, 0xf97373, 0x4aa9ff, 0x8e6bd8, 0x62c887] as const;

function clamp01(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
    object.geometry.dispose();
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => material.dispose());
  });
}

function setMaterialOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line)) return;
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    childMaterials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
    });
  });
}

/**
 * Procedural taste laboratory used by the shared guided viewer. The oversized
 * particles, coloured receptor signals and transparent anatomy are explicitly
 * explanatory models rather than literal views of taste or flavour.
 */
export function createSenseOfTasteWorld(context: SimulationSceneContext): GuidedSceneWorld {
  const root = new THREE.Group();
  root.name = 'sense-of-taste-detective-laboratory';
  root.userData.environmentUrl = SENSE_OF_TASTE_SCENE_METADATA.environmentUrl;

  const stageGroups = new Map<string, THREE.Group>();
  const focusTargets = new Map<string, THREE.Object3D>();
  const interactionTargets: GuidedSceneWorld['interactionTargets'][number][] = [];
  const cueActors = new Map<string, THREE.Object3D[]>();

  const standard = (parameters: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(parameters);
  const physical = (parameters: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(parameters);
  const basic = (parameters: THREE.MeshBasicMaterialParameters) => new THREE.MeshBasicMaterial(parameters);
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
  };
  const group = (name: string) => {
    const object = new THREE.Group();
    object.name = name;
    return object;
  };

  const floor = mesh(
    new THREE.CircleGeometry(6.4, 64),
    standard({ color: 0x254945, roughness: 0.86, metalness: 0.03 }),
    'circular sensory laboratory floor',
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  root.add(floor);

  const floorRing = mesh(
    new THREE.TorusGeometry(4.9, 0.045, 10, 72),
    basic({ color: 0x9ee8d3, transparent: true, opacity: 0.36 }),
    'safe stationary boundary ring',
  );
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.y = 0.015;
  root.add(floorRing);

  const ambient = new THREE.HemisphereLight(0xfff7df, 0x35605b, 1.9);
  ambient.name = 'warm laboratory ambient light';
  const key = new THREE.DirectionalLight(0xfff5df, 2.5);
  key.name = 'morning laboratory key light';
  key.position.set(4.5, 7, 3.5);
  key.castShadow = true;
  const fill = new THREE.PointLight(0x83d7ff, 1.2, 12);
  fill.position.set(-3, 3.2, 1.5);
  root.add(ambient, key, fill);

  const makePedestal = (color: number) => {
    const pedestal = mesh(
      new THREE.CylinderGeometry(1.55, 1.75, 0.34, 40),
      standard({ color, roughness: 0.42, metalness: 0.12 }),
      'sensory evidence pedestal',
    );
    pedestal.position.y = 0.17;
    const rim = mesh(
      new THREE.TorusGeometry(1.48, 0.055, 12, 48),
      basic({ color: 0xbef8eb, transparent: true, opacity: 0.72 }),
      'pedestal guidance ring',
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.36;
    const result = group('laboratory demonstration bench');
    result.add(pedestal, rim);
    return result;
  };

  const createHotspot = (
    stage: THREE.Group,
    cueId: string,
    stageIndex: number,
    position: THREE.Vector3,
    radius: number,
  ) => {
    const hotspot = mesh(
      new THREE.SphereGeometry(radius, 20, 14),
      basic({
        color: 0xa9f7e6,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
      `${ACTION_LABELS[stageIndex]} interactive hotspot`,
    );
    hotspot.position.copy(position);
    hotspot.userData.actionId = ACTION_IDS[stageIndex];
    hotspot.userData.accessibilityLabel = ACTION_LABELS[stageIndex];
    stage.add(hotspot);
    interactionTargets.push({
      id: `sense-of-taste:target:${stageIndex + 1}`,
      object: hotspot,
      actionId: ACTION_IDS[stageIndex],
      accessibilityLabel: ACTION_LABELS[stageIndex],
    });
    focusTargets.set(cueId, hotspot);
    return hotspot;
  };

  // Stage 1: saliva dissolves an enlarged virtual food crystal.
  {
    const cueId = CUE_IDS[0];
    const stage = group('mission-1-saliva-release-lab');
    stage.add(makePedestal(0x6d4a36));

    const bowl = mesh(
      new THREE.CylinderGeometry(0.82, 0.66, 0.18, 32, 1, true),
      physical({
        color: 0xeaf7f3,
        roughness: 0.16,
        metalness: 0.02,
        transmission: 0.2,
        transparent: true,
        opacity: 0.84,
        side: THREE.DoubleSide,
      }),
      'clean virtual sample dish',
    );
    bowl.position.set(0, 0.5, -0.15);
    const bowlBase = mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.06, 32),
      physical({
        color: 0xffffff,
        roughness: 0.18,
        transmission: 0.22,
        transparent: true,
        opacity: 0.86,
      }),
      'sample dish base',
    );
    bowlBase.position.set(0, 0.42, -0.15);

    const crystal = mesh(
      new THREE.IcosahedronGeometry(0.34, 1),
      physical({
        color: 0xf5b84b,
        emissive: 0x8a4d10,
        emissiveIntensity: 0.15,
        roughness: 0.38,
        clearcoat: 0.55,
      }),
      'enlarged virtual food crystal',
    );
    crystal.position.set(0, 0.7, -0.15);

    const salivaDrop = group('enlarged saliva droplet model');
    const dropBody = mesh(
      new THREE.SphereGeometry(0.27, 24, 18),
      physical({
        color: 0x9de7ff,
        emissive: 0x237e9b,
        emissiveIntensity: 0.24,
        roughness: 0.04,
        transmission: 0.54,
        thickness: 0.4,
        transparent: true,
        opacity: 0.82,
      }),
      'saliva drop body',
    );
    dropBody.scale.set(0.85, 1.22, 0.85);
    const dropTip = mesh(
      new THREE.ConeGeometry(0.16, 0.35, 20),
      physical({
        color: 0x9de7ff,
        roughness: 0.04,
        transmission: 0.5,
        transparent: true,
        opacity: 0.8,
      }),
      'saliva drop tip',
    );
    dropTip.position.y = 0.27;
    salivaDrop.add(dropBody, dropTip);
    salivaDrop.position.set(0, 2.05, -0.15);

    const particles = Array.from({ length: 18 }, (_, index) => {
      const particle = mesh(
        new THREE.SphereGeometry(0.055 + (index % 3) * 0.012, 12, 8),
        basic({ color: TASTE_COLORS[index % TASTE_COLORS.length] }),
        `dissolved taste molecule model ${index + 1}`,
      );
      const angle = (index / 18) * Math.PI * 2;
      particle.userData.target = new THREE.Vector3(
        Math.cos(angle) * (0.5 + (index % 4) * 0.08),
        0.6 + ((index * 7) % 5) * 0.07,
        -0.15 + Math.sin(angle) * (0.5 + (index % 3) * 0.1),
      );
      particle.position.copy(crystal.position);
      particle.visible = false;
      stage.add(particle);
      return particle;
    });

    stage.add(bowl, bowlBase, crystal, salivaDrop);
    createHotspot(stage, cueId, 0, new THREE.Vector3(0, 1.45, -0.15), 0.42);
    stageGroups.set(cueId, stage);
    cueActors.set(cueId, [salivaDrop, crystal, ...particles]);
    root.add(stage);
  }

  // Stage 2: a realistic enlarged tongue surface and taste-bud cutaway.
  {
    const cueId = CUE_IDS[1];
    const stage = group('mission-2-taste-bud-observatory');
    stage.add(makePedestal(0x593c58));

    const tongue = mesh(
      new THREE.SphereGeometry(1.15, 40, 24),
      physical({
        color: 0xcc6677,
        roughness: 0.62,
        clearcoat: 0.12,
        sheen: 0.35,
        sheenColor: new THREE.Color(0xffb4bf),
      }),
      'enlarged tongue surface model',
    );
    tongue.scale.set(1.35, 0.22, 0.82);
    tongue.position.set(-0.2, 0.72, 0.25);

    const papillae = Array.from({ length: 24 }, (_, index) => {
      const papilla = mesh(
        new THREE.ConeGeometry(0.055 + (index % 4) * 0.008, 0.14, 10),
        standard({
          color: index % 5 === 0 ? 0xeb8a97 : 0xdd7585,
          roughness: 0.7,
        }),
        `papilla model ${index + 1}`,
      );
      const column = index % 8;
      const row = Math.floor(index / 8);
      papilla.position.set(-0.92 + column * 0.25, 0.98, -0.16 + row * 0.28);
      papilla.rotation.x = Math.PI;
      stage.add(papilla);
      return papilla;
    });

    const budShell = mesh(
      new THREE.SphereGeometry(0.58, 30, 20),
      physical({
        color: 0xffc5cf,
        roughness: 0.18,
        transmission: 0.38,
        thickness: 0.3,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
      'transparent taste bud cutaway',
    );
    budShell.scale.set(0.74, 1.3, 0.68);
    budShell.position.set(0.72, 1.47, -0.18);

    const receptorCells = TASTE_COLORS.map((color, index) => {
      const receptor = mesh(
        new THREE.SphereGeometry(0.14, 16, 12),
        standard({
          color,
          emissive: color,
          emissiveIntensity: 0.28,
          roughness: 0.34,
        }),
        `taste receptor quality model ${index + 1}`,
      );
      receptor.scale.set(0.7, 2.15, 0.7);
      const angle = (index / TASTE_COLORS.length) * Math.PI * 2;
      receptor.position.set(0.72 + Math.cos(angle) * 0.28, 1.46 + (index % 2) * 0.12, -0.18 + Math.sin(angle) * 0.24);
      receptor.visible = false;
      stage.add(receptor);
      return receptor;
    });

    const nerve = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.72, 1.05, -0.18),
          new THREE.Vector3(0.86, 0.74, -0.15),
          new THREE.Vector3(1.18, 0.48, -0.1),
        ]),
        24,
        0.045,
        10,
        false,
      ),
      standard({
        color: 0xf2c94c,
        emissive: 0xf2c94c,
        emissiveIntensity: 0.35,
      }),
      'taste nerve signal pathway model',
    );
    nerve.visible = false;

    stage.add(tongue, budShell, nerve);
    createHotspot(stage, cueId, 1, new THREE.Vector3(0.72, 1.5, -0.18), 0.52);
    stageGroups.set(cueId, stage);
    cueActors.set(cueId, [budShell, nerve, ...receptorCells, ...papillae]);
    root.add(stage);
  }

  // Stage 3: a transparent profile showing retronasal aroma movement.
  {
    const cueId = CUE_IDS[2];
    const stage = group('mission-3-nose-flavour-connection');
    stage.add(makePedestal(0x3e5361));

    const head = mesh(
      new THREE.SphereGeometry(0.9, 36, 24),
      physical({
        color: 0xffc6a8,
        roughness: 0.3,
        transmission: 0.48,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
      }),
      'transparent head teaching model',
    );
    head.scale.set(0.76, 1.05, 0.9);
    head.position.set(0.16, 1.32, -0.18);

    const mouth = mesh(
      new THREE.TorusGeometry(0.25, 0.065, 10, 28, Math.PI),
      standard({ color: 0xc94f66, roughness: 0.48 }),
      'mouth opening model',
    );
    mouth.rotation.z = Math.PI;
    mouth.rotation.y = Math.PI / 2;
    mouth.position.set(0.78, 1.04, -0.18);

    const nose = mesh(
      new THREE.ConeGeometry(0.22, 0.55, 20),
      physical({ color: 0xf2aa88, roughness: 0.48, clearcoat: 0.08 }),
      'nose model',
    );
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(0.82, 1.56, -0.18);

    const aromaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.84, 1.03, -0.18),
      new THREE.Vector3(0.42, 1.02, -0.18),
      new THREE.Vector3(0.15, 1.3, -0.18),
      new THREE.Vector3(0.38, 1.63, -0.18),
      new THREE.Vector3(0.78, 1.64, -0.18),
    ]);
    const aromaPath = mesh(
      new THREE.TubeGeometry(aromaCurve, 48, 0.05, 10, false),
      basic({ color: 0x84e9d6, transparent: true, opacity: 0.22 }),
      'retronasal aroma route model',
    );

    const aromaParticles = Array.from({ length: 12 }, (_, index) => {
      const particle = mesh(
        new THREE.SphereGeometry(0.075 + (index % 2) * 0.018, 14, 10),
        basic({
          color: index % 3 === 0 ? 0xffca58 : 0x8ef1de,
          transparent: true,
          opacity: 0.88,
        }),
        `aroma particle model ${index + 1}`,
      );
      particle.userData.pathOffset = index / 12;
      particle.position.copy(aromaCurve.getPoint(index / 12));
      particle.visible = false;
      stage.add(particle);
      return particle;
    });

    const blockedGate = mesh(
      new THREE.BoxGeometry(0.1, 0.42, 0.42),
      standard({
        color: 0xe05d5d,
        emissive: 0x7d1515,
        emissiveIntensity: 0.22,
      }),
      'blocked aroma route gate',
    );
    blockedGate.position.set(0.58, 1.62, -0.18);

    stage.add(head, mouth, nose, aromaPath, blockedGate);
    createHotspot(stage, cueId, 2, new THREE.Vector3(0.58, 1.62, -0.18), 0.48);
    stageGroups.set(cueId, stage);
    cueActors.set(cueId, [aromaPath, blockedGate, ...aromaParticles]);
    root.add(stage);
  }

  // Stage 4: one familiar food described by several sensory systems.
  {
    const cueId = CUE_IDS[3];
    const stage = group('mission-4-mystery-flavour-challenge');
    stage.add(makePedestal(0x62513a));

    const plate = mesh(
      new THREE.CylinderGeometry(0.82, 0.72, 0.1, 36),
      physical({ color: 0xf6f0df, roughness: 0.24, clearcoat: 0.38 }),
      'clean mystery sample plate',
    );
    plate.position.y = 0.47;

    const tomato = mesh(
      new THREE.SphereGeometry(0.56, 36, 24),
      physical({
        color: 0xd83a35,
        emissive: 0x5f0908,
        emissiveIntensity: 0.08,
        roughness: 0.34,
        clearcoat: 0.38,
      }),
      'virtual ripe tomato sample',
    );
    tomato.scale.set(1.04, 0.88, 1.02);
    tomato.position.y = 0.94;

    const calyx = group('tomato green calyx');
    for (let index = 0; index < 6; index += 1) {
      const leaf = mesh(
        new THREE.ConeGeometry(0.1, 0.45, 8),
        standard({ color: 0x3f7f3c, roughness: 0.7 }),
        `tomato calyx leaf ${index + 1}`,
      );
      leaf.rotation.z = Math.PI / 2;
      leaf.rotation.y = (index / 6) * Math.PI * 2;
      leaf.position.set(Math.cos((index / 6) * Math.PI * 2) * 0.17, 0, Math.sin((index / 6) * Math.PI * 2) * 0.17);
      calyx.add(leaf);
    }
    calyx.position.set(0, 1.43, 0);

    const clueColors = [0xf7c948, 0xf97373, 0x62c887, 0x7ed6df, 0xb593dc];
    const clues = clueColors.map((color, index) => {
      const clue = group(`combined sensory clue ${index + 1}`);
      const orb = mesh(
        new THREE.SphereGeometry(0.16, 18, 12),
        standard({
          color,
          emissive: color,
          emissiveIntensity: 0.42,
          roughness: 0.26,
        }),
        `sensory clue orb ${index + 1}`,
      );
      const halo = mesh(
        new THREE.TorusGeometry(0.24, 0.025, 8, 28),
        basic({ color, transparent: true, opacity: 0.62 }),
        `sensory clue halo ${index + 1}`,
      );
      halo.rotation.x = Math.PI / 2;
      clue.add(orb, halo);
      const angle = -Math.PI * 0.75 + (index * (Math.PI * 1.5)) / 4;
      clue.userData.target = new THREE.Vector3(
        Math.cos(angle) * 1.45,
        1.32 + (index % 2) * 0.35,
        Math.sin(angle) * 1.1,
      );
      clue.position.copy(tomato.position);
      clue.visible = false;
      stage.add(clue);
      return clue;
    });

    stage.add(plate, tomato, calyx);
    createHotspot(stage, cueId, 3, new THREE.Vector3(0, 1.02, 0), 0.62);
    stageGroups.set(cueId, stage);
    cueActors.set(cueId, [tomato, ...clues]);
    root.add(stage);
  }

  CUE_IDS.forEach((cueId, index) => {
    const stage = stageGroups.get(cueId);
    if (stage) stage.visible = index === 0;
  });

  const previousBackground = context.scene.background;
  const previousEnvironment = context.scene.environment;
  const previousFog = context.scene.fog;
  let environmentTexture: THREE.Texture | undefined;
  if (typeof Image !== 'undefined') {
    environmentTexture = new THREE.TextureLoader().load(
      SENSE_OF_TASTE_SCENE_METADATA.environmentUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        context.scene.background = texture;
        context.scene.environment = texture;
      },
      undefined,
      () => {
        if (context.scene.background === environmentTexture) {
          context.scene.background = previousBackground;
        }
        if (context.scene.environment === environmentTexture) {
          context.scene.environment = previousEnvironment;
        }
      },
    );
  }
  context.scene.fog = new THREE.FogExp2(0x1b3334, 0.018);

  let disposed = false;
  return {
    root,
    cueIds: CUE_IDS,
    interactionTargets,
    cueDurationSeconds(cueId) {
      if (!CUE_IDS.includes(cueId as (typeof CUE_IDS)[number])) {
        throw new Error(`guided-sense-of-taste: unknown cue ${cueId}`);
      }
      return 1.35;
    },
    applyCue(cueId, rawProgress, preferences) {
      if (disposed) throw new Error('guided-sense-of-taste: scene world is disposed');
      if (!CUE_IDS.includes(cueId as (typeof CUE_IDS)[number])) {
        throw new Error(`guided-sense-of-taste: unknown cue ${cueId}`);
      }
      if (!Number.isFinite(rawProgress) || rawProgress < 0 || rawProgress > 1) {
        throw new Error('guided-sense-of-taste: cue progress must be between 0 and 1');
      }

      const progress = preferences.reducedMotion
        ? rawProgress > 0
          ? 1
          : 0
        : THREE.MathUtils.smoothstep(clamp01(rawProgress), 0, 1);
      for (const [candidateCueId, stage] of stageGroups) {
        stage.visible = candidateCueId === cueId;
      }
      const actors = cueActors.get(cueId) ?? [];

      if (cueId === CUE_IDS[0]) {
        const [drop, crystal, ...particles] = actors;
        drop.position.y = 2.05 - progress * 1.05;
        crystal.scale.setScalar(Math.max(0.08, 1 - progress * 0.92));
        particles.forEach((particle, index) => {
          const target = particle.userData.target as THREE.Vector3;
          const localProgress = clamp01(progress * 1.45 - index * 0.018);
          particle.visible = localProgress > 0.04;
          particle.position.lerpVectors(crystal.position, target, localProgress);
        });
      } else if (cueId === CUE_IDS[1]) {
        const [shell, nerve, ...remaining] = actors;
        const receptorCells = remaining.slice(0, 5);
        const papillae = remaining.slice(5);
        shell.rotation.y = progress * Math.PI * 0.45;
        nerve.visible = progress > 0.64;
        setMaterialOpacity(nerve, clamp01((progress - 0.64) * 2.8));
        receptorCells.forEach((receptor, index) => {
          const threshold = 0.18 + index * 0.1;
          receptor.visible = progress >= threshold;
          receptor.scale.set(0.7, 2.15 * clamp01((progress - threshold) * 5), 0.7);
        });
        papillae.forEach((papilla, index) => {
          papilla.rotation.y = progress * 0.35 + index * 0.04;
        });
      } else if (cueId === CUE_IDS[2]) {
        const [path, gate, ...particles] = actors;
        setMaterialOpacity(path, 0.22 + progress * 0.72);
        gate.rotation.z = (progress * Math.PI) / 2;
        gate.scale.y = 1 - progress * 0.78;
        const route = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.84, 1.03, -0.18),
          new THREE.Vector3(0.42, 1.02, -0.18),
          new THREE.Vector3(0.15, 1.3, -0.18),
          new THREE.Vector3(0.38, 1.63, -0.18),
          new THREE.Vector3(0.78, 1.64, -0.18),
        ]);
        particles.forEach((particle, index) => {
          const particleProgress = clamp01(progress * 1.35 - index * 0.028);
          particle.visible = particleProgress > 0.04;
          particle.position.copy(route.getPoint(particleProgress));
        });
      } else {
        const [tomato, ...clues] = actors;
        tomato.rotation.y = progress * Math.PI * 0.5;
        clues.forEach((clue, index) => {
          const localProgress = clamp01(progress * 1.45 - index * 0.08);
          const target = clue.userData.target as THREE.Vector3;
          clue.visible = localProgress > 0.03;
          clue.position.lerpVectors(tomato.position, target, localProgress);
          clue.rotation.y = progress * Math.PI + index * 0.4;
        });
      }

      root.userData.currentCueId = cueId;
      root.userData.progress = rawProgress;
      root.userData.outcome = SENSE_OF_TASTE_SCENE_METADATA.stageOutcomes[cueId];
    },
    focusTarget(cueId) {
      return focusTargets.get(cueId);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (context.scene.background === environmentTexture) {
        context.scene.background = previousBackground;
      }
      if (context.scene.environment === environmentTexture) {
        context.scene.environment = previousEnvironment;
      }
      context.scene.fog = previousFog;
      environmentTexture?.dispose();
      disposeObject(root);
      root.removeFromParent();
      root.clear();
      stageGroups.clear();
      focusTargets.clear();
      cueActors.clear();
      interactionTargets.splice(0, interactionTargets.length);
    },
  };
}
