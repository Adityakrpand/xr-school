import * as THREE from 'three';
import {
  createAirway,
  createAlveoliCluster,
  createBreathingControl,
  createComparisonBoard,
  createDiaphragm,
  createLungs,
  createRibCage,
  type BreathingAnatomyMaterials,
} from './breathingAnatomy';

export interface BreathingSceneConfig {
  scene: THREE.Scene;
  materials: BreathingAnatomyMaterials;
}

/** 0 = fully exhaled (relaxed diaphragm, smaller lungs), 1 = fully inhaled
 * (contracted, flattened diaphragm, expanded rib cage and lungs). */
const EASE_RATE = 3.2;

export function createBreathingScene(config: BreathingSceneConfig) {
  const root = new THREE.Group();
  root.name = 'breathing-production-world';
  config.scene.add(root);

  const ribCage = createRibCage(config.materials.bone);
  const lungs = createLungs(config.materials.lung);
  const diaphragm = createDiaphragm(config.materials.muscle);
  const airway = createAirway(config.materials.airway);
  const alveoli = createAlveoliCluster(config.materials.lung, config.materials.capillary);
  alveoli.root.position.set(0.1, 0.46, 0.18);
  alveoli.root.scale.setScalar(1.6);

  const inhaleControl = createBreathingControl('inhale-control', config.materials.control);
  inhaleControl.position.set(-0.48, 0.22, 0.3);
  const exhaleControl = createBreathingControl('exhale-control', config.materials.controlAccent);
  exhaleControl.position.set(0.48, 0.22, 0.3);

  const comparisonBoard = createComparisonBoard(
    config.materials.board,
    config.materials.control,
    config.materials.controlAccent,
  );
  comparisonBoard.position.set(0.78, 0.85, -0.08);
  comparisonBoard.rotation.y = -0.4;

  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 40, 28),
    config.materials.body,
  );
  torso.name = 'transparent-torso-context';
  torso.position.set(0, 0.55, -0.04);
  torso.scale.set(1, 1.28, 0.62);
  torso.castShadow = true;

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.17, 0.34, 24),
    config.materials.body,
  );
  neck.position.set(0, 1.32, -0.02);

  const shoulderBar = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.12, 1.02, 8, 20),
    config.materials.body,
  );
  shoulderBar.position.set(0, 1.17, -0.02);
  shoulderBar.rotation.z = Math.PI / 2;

  const airflow = new THREE.Group();
  airflow.name = 'animated-airflow';
  const airParticles: THREE.Mesh[] = [];
  for (let index = 0; index < 18; index += 1) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(index % 3 === 0 ? 0.016 : 0.011, 10, 8),
      config.materials.airflow,
    );
    particle.userData.offset = index / 18;
    particle.userData.side = index % 2 === 0 ? -1 : 1;
    airParticles.push(particle);
    airflow.add(particle);
  }

  const lab = new THREE.Group();
  lab.name = 'respiratory-learning-lab';
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 1.46, 0.12, 64),
    config.materials.board,
  );
  platform.position.y = -0.5;
  platform.receiveShadow = true;
  lab.add(platform);
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.8, 0.08),
    config.materials.body,
  );
  backPanel.position.set(0, 0.5, -2.35);
  lab.add(backPanel);
  for (const x of [-1.72, -0.86, 0, 0.86, 1.72]) {
    const lightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 2.25, 0.025),
      config.materials.airflow,
    );
    lightStrip.position.set(x, 0.5, -2.29);
    lab.add(lightStrip);
  }
  for (const x of [-1.72, 1.72]) {
    const console = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.62, 0.48),
      config.materials.board,
    );
    console.position.set(x, -0.18, -1.65);
    console.castShadow = true;
    lab.add(console);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.3),
      x < 0 ? config.materials.control : config.materials.controlAccent,
    );
    screen.position.set(x, 0.02, -1.4);
    lab.add(screen);
  }

  root.add(
    lab,
    torso,
    neck,
    shoulderBar,
    ribCage.root,
    lungs.root,
    diaphragm,
    airway.root,
    alveoli.root,
    inhaleControl,
    exhaleControl,
    comparisonBoard,
    airflow,
  );

  const diaphragmBaseY = diaphragm.position.y;
  let phase = 0;
  let targetPhase = 0;
  let autoCycle = false;

  function applyPhase() {
    diaphragm.position.y = diaphragmBaseY - phase * 0.1;
    diaphragm.scale.y = 1 - phase * 0.55;
    lungs.left.scale.set(0.62 * (1 + phase * 0.16), 1.05 * (1 + phase * 0.1), 0.58 * (1 + phase * 0.16));
    lungs.right.scale.set(0.62 * (1 + phase * 0.16), 1.05 * (1 + phase * 0.1), 0.58 * (1 + phase * 0.16));
    ribCage.root.scale.set(1 + phase * 0.06, 1 + phase * 0.02, 1 + phase * 0.06);
  }
  applyPhase();

  /** Sets the phase the animation eases toward. Ignored while the
   * stage-5 comparison auto-cycle is running. */
  function setBreathingPhase(next: number) {
    targetPhase = THREE.MathUtils.clamp(next, 0, 1);
  }

  function update(deltaSeconds: number, elapsedSeconds: number) {
    if (autoCycle) {
      targetPhase = (Math.sin(elapsedSeconds * 1.4) + 1) / 2;
    }
    const t = Math.min(1, deltaSeconds * EASE_RATE);
    phase += (targetPhase - phase) * t;
    applyPhase();

    const inhaleDirection = targetPhase >= 0.5 || autoCycle;
    for (const particle of airParticles) {
      let progress = (elapsedSeconds * 0.32 + particle.userData.offset) % 1;
      if (!inhaleDirection) progress = 1 - progress;
      if (progress < 0.62) {
        const airwayProgress = progress / 0.62;
        particle.position.set(0, 1.42 - airwayProgress * 0.76, 0.035);
      } else {
        const lungProgress = (progress - 0.62) / 0.38;
        const side = particle.userData.side as number;
        particle.position.set(
          side * (0.08 + lungProgress * 0.18),
          0.66 - lungProgress * 0.25,
          0.035 - lungProgress * 0.045,
        );
      }
      const pulse = 0.8 + Math.sin(elapsedSeconds * 5 + particle.userData.offset * 12) * 0.2;
      particle.scale.setScalar(pulse);
    }
  }

  let stage = 0;
  function setStage(nextStage: number) {
    stage = Math.max(0, Math.min(5, nextStage));
    autoCycle = stage === 5;
    if (stage === 3 && targetPhase === 0) {
      // Entering "breathe out" — start from a fully inhaled chest so there
      // is something to visibly release.
      phase = 1;
      targetPhase = 1;
      applyPhase();
    }
  }
  setStage(0);

  function dispose() {
    config.scene.remove(root);
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
      }
    });
  }

  return {
    root,
    ribCage: ribCage.root,
    lungs: lungs.root,
    diaphragm,
    airway: airway.root,
    alveoli: alveoli.root,
    inhaleControl,
    exhaleControl,
    comparisonBoard,
    setStage,
    update,
    setBreathingPhase,
    dispose,
  };
}

export type BreathingScene = ReturnType<typeof createBreathingScene>;
