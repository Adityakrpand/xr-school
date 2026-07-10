'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { isQuestBackPressed, updateButtonLatch } from '@/lib/xrNavigation';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';

const VIDEO_SRC = '/simulations/microscopic-life-observation.mp4';

const STAGES = [
  {
    title: 'Observe',
    cue: 'Watch the live microscope field and notice the different shapes moving through the water sample.',
    action: 'Point to one moving organism and describe its shape before naming it.',
    teacher: 'In this activity we are studying microscopic life. A water sample can look clear to our eyes, but under a microscope it can contain many living organisms. Look carefully for shape, colour, and movement. These are observations. A good scientist first observes, then explains.',
  },
  {
    title: 'Compare',
    cue: 'Some organisms are oval, some are long and flexible, and some look green because of chlorophyll.',
    action: 'Compare two organisms by shape, colour, and motion.',
    teacher: 'Now compare what you see. Some organisms are rounded, some are stretched, and some are green because they contain chlorophyll-like pigments. Do not guess the name first. Compare their features: how they move, how they are shaped, and whether they seem to have internal colour.',
  },
  {
    title: 'Explain',
    cue: 'A drop of pond water can contain many living microorganisms that are invisible without magnification.',
    action: 'Explain why a microscope changes what we can observe about living things.',
    teacher: 'The microscope changes the scale of the lesson. It lets us see living forms that are normally invisible. When an organism changes position, turns, or pulses, that movement is evidence that the sample contains life. This is why microscopes are important tools in biology.',
  },
  {
    title: 'Review',
    cue: 'Use evidence from the video to separate observation from guesswork.',
    action: 'Say one observation that proves the sample contains living organisms.',
    teacher: 'Let us review like a biology teacher would ask in class. What did you actually see? Did something move by itself? Did one organism have a different shape from another? Use those observations as evidence, then make a careful conclusion about microscopic life in the sample.',
  },
] as const;

const SPECIMENS = [
  { id: 'pond-water', label: 'Pond water', color: '#6ee7b7', offset: 0 },
  { id: 'algae-bloom', label: 'Algae bloom', color: '#a3e635', offset: 52 },
  { id: 'ciliate-rich', label: 'Ciliate sample', color: '#f0abfc', offset: 116 },
] as const;

const MARKERS = [
  { id: 'oval-protist', label: 'Oval protist', color: '#6ee7b7', position: [-1.45, 1.62, -3.28] },
  { id: 'green-algae', label: 'Green algae', color: '#a3e635', position: [0, 2.05, -3.28] },
  { id: 'ciliated-cell', label: 'Ciliated cell', color: '#f0abfc', position: [1.45, 1.62, -3.28] },
] as const;

type AudioState = {
  context: AudioContext;
  ambientGain: GainNode;
  musicGain: GainNode;
  masterGain: GainNode;
  oscillators: OscillatorNode[];
};

function addBox(
  parent: THREE.Object3D,
  name: string,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
  options: { roughness?: number; metalness?: number; opacity?: number } = {},
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.05,
    transparent: options.opacity !== undefined,
    opacity: options.opacity ?? 1,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  name: string,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  position: [number, number, number],
  color: number,
  options: { opacity?: number; radialSegments?: number } = {},
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.radialSegments ?? 32),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.08,
      transparent: options.opacity !== undefined,
      opacity: options.opacity ?? 1,
    }),
  );
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addLabInterior(scene: THREE.Object3D) {
  const lab = new THREE.Group();
  lab.name = 'modern-biology-laboratory-interior';
  scene.add(lab);

  addBox(lab, 'realistic-speckled-laboratory-floor', [9.2, 0.08, 8.6], [0, -0.04, -0.7], 0xd9e2e7, { roughness: 0.78 });
  addBox(lab, 'rear-laboratory-wall', [9.2, 3.5, 0.12], [0, 1.7, -4.65], 0xe5eef3, { roughness: 0.72 });
  addBox(lab, 'left-laboratory-wall', [0.12, 3.5, 8.6], [-4.6, 1.7, -0.7], 0xdbe7ee, { roughness: 0.72 });
  addBox(lab, 'right-laboratory-wall', [0.12, 3.5, 8.6], [4.6, 1.7, -0.7], 0xdbe7ee, { roughness: 0.72 });
  addBox(lab, 'bright-laboratory-ceiling', [9.2, 0.08, 8.6], [0, 3.42, -0.7], 0xf8fafc, { roughness: 0.65 });

  for (let i = 0; i < 4; i += 1) {
    const light = addBox(lab, `rectangular-led-lab-light-${i + 1}`, [1.2, 0.04, 0.3], [-2.7 + i * 1.8, 3.35, -1.35], 0xffffff);
    (light.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
    (light.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.85;
  }

  for (let i = 0; i < 3; i += 1) {
    addBox(lab, `window-natural-daylight-glass-${i + 1}`, [1.05, 1.1, 0.05], [-3.0 + i * 1.2, 2.05, -4.58], 0x93c5fd, { opacity: 0.46, roughness: 0.18 });
    addBox(lab, `window-white-frame-${i + 1}`, [1.16, 0.06, 0.08], [-3.0 + i * 1.2, 2.62, -4.54], 0xf8fafc);
    addBox(lab, `window-lower-frame-${i + 1}`, [1.16, 0.06, 0.08], [-3.0 + i * 1.2, 1.48, -4.54], 0xf8fafc);
  }

  [-2.6, 0, 2.6].forEach((x, index) => {
    addBox(lab, `laboratory-workbench-${index + 1}`, [1.85, 0.14, 0.9], [x, 0.78, -0.65], 0x334155, { roughness: 0.42 });
    addBox(lab, `steel-workbench-leg-a-${index + 1}`, [0.08, 0.72, 0.08], [x - 0.78, 0.38, -0.98], 0x94a3b8, { metalness: 0.35 });
    addBox(lab, `steel-workbench-leg-b-${index + 1}`, [0.08, 0.72, 0.08], [x + 0.78, 0.38, -0.98], 0x94a3b8, { metalness: 0.35 });
  });

  [-3.72, 3.72].forEach((x, side) => {
    addBox(lab, `storage-cabinet-body-${side + 1}`, [1.25, 1.8, 0.48], [x, 1.05, -3.98], 0x64748b, { roughness: 0.48 });
    addBox(lab, `storage-cabinet-glass-door-${side + 1}`, [1.12, 1.5, 0.04], [x, 1.15, -3.72], 0xbae6fd, { opacity: 0.34, roughness: 0.16 });
    for (let row = 0; row < 3; row += 1) {
      addBox(lab, `cabinet-glass-shelf-${side + 1}-${row + 1}`, [1.08, 0.035, 0.36], [x, 0.58 + row * 0.48, -3.76], 0xdbeafe, { opacity: 0.45 });
    }
  });

  for (let i = 0; i < 10; i += 1) {
    const x = -4.0 + (i % 5) * 0.28;
    const y = 0.64 + Math.floor(i / 5) * 0.52;
    const bottle = addCylinder(lab, `specimen-bottle-with-label-${i + 1}`, 0.055, 0.06, 0.28, [x, y, -3.43], i % 2 ? 0x86efac : 0xfca5a5, { opacity: 0.68 });
    addBox(bottle, `specimen-label-${i + 1}`, [0.1, 0.045, 0.01], [0, -0.02, 0.057], 0xf8fafc);
  }

  for (let i = 0; i < 8; i += 1) {
    const x = 2.85 + (i % 4) * 0.22;
    const y = 0.62 + Math.floor(i / 4) * 0.48;
    const tube = addCylinder(lab, `test-tube-${i + 1}`, 0.03, 0.035, 0.36, [x, y, -3.43], i % 3 === 0 ? 0x93c5fd : 0xfde68a, { opacity: 0.72, radialSegments: 18 });
    tube.rotation.z = (i % 2 ? 0.08 : -0.08);
  }

  ['CELL STRUCTURE', 'MICROSCOPE SAFETY', 'PROTIST MOTION'].forEach((label, index) => {
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.62),
      new THREE.MeshBasicMaterial({ map: makeTextTexture(label, 'Observe - Record - Infer', '#38bdf8', 560, 240), transparent: true }),
    );
    poster.name = `biology-chart-educational-poster-${index + 1}`;
    poster.position.set(-1.25 + index * 1.25, 2.4, -4.57);
    lab.add(poster);
  });

  for (let i = 0; i < 6; i += 1) {
    addCylinder(lab, `petri-dish-${i + 1}`, 0.13, 0.13, 0.035, [-2.95 + i * 0.18, 0.89, -0.56], 0xdbeafe, { opacity: 0.58 });
  }
  for (let i = 0; i < 5; i += 1) {
    const slide = addBox(lab, `prepared-microscope-slide-${i + 1}`, [0.32, 0.014, 0.12], [-0.55 + i * 0.22, 0.865, -0.28], 0xe0f2fe, { opacity: 0.68, roughness: 0.15 });
    addBox(slide, `slide-specimen-stain-${i + 1}`, [0.08, 0.016, 0.05], [0, 0.008, 0], i % 2 ? 0xa3e635 : 0xf0abfc, { opacity: 0.75 });
  }
  for (let i = 0; i < 4; i += 1) {
    addCylinder(lab, `beaker-${i + 1}`, 0.1, 0.11, 0.28, [1.85 + i * 0.22, 0.93, -0.45], 0xbfdbfe, { opacity: 0.48 });
  }
  for (let i = 0; i < 3; i += 1) {
    const pipette = addCylinder(lab, `pipette-dropper-${i + 1}`, 0.012, 0.018, 0.55, [2.7 + i * 0.12, 0.96, -0.6], 0xf8fafc, { opacity: 0.72, radialSegments: 12 });
    pipette.rotation.z = Math.PI / 2.4;
  }
  addBox(lab, 'open-laboratory-notebook', [0.52, 0.035, 0.38], [-1.95, 0.89, -0.36], 0xf8fafc);
  addBox(lab, 'notebook-blue-cover', [0.56, 0.03, 0.42], [-2.0, 0.87, -0.36], 0x2563eb);
  addCylinder(lab, 'hand-sanitizer-bottle', 0.055, 0.07, 0.32, [3.25, 0.95, -0.42], 0xbfdbfe, { opacity: 0.72 });
  addBox(lab, 'first-aid-safety-box', [0.34, 0.22, 0.2], [3.55, 0.95, -0.42], 0xf8fafc);
  addBox(lab, 'red-safety-cross-horizontal', [0.18, 0.035, 0.01], [3.55, 0.98, -0.315], 0xef4444);
  addBox(lab, 'red-safety-cross-vertical', [0.035, 0.16, 0.01], [3.55, 0.98, -0.31], 0xef4444);
  return lab;
}

function addMicroscopeModel(scene: THREE.Object3D) {
  const microscope = new THREE.Group();
  microscope.name = 'realistic-binocular-laboratory-microscope';
  microscope.position.set(-2.15, 0.84, -1.62);
  scene.add(microscope);

  addBox(microscope, 'heavy-microscope-base', [0.76, 0.12, 0.48], [0, 0.06, 0], 0x111827, { roughness: 0.38 });
  addBox(microscope, 'microscope-stage-with-slide-clips', [0.58, 0.055, 0.38], [0, 0.38, -0.08], 0x1f2937, { roughness: 0.32, metalness: 0.1 });
  addBox(microscope, 'glass-slide-on-stage', [0.42, 0.018, 0.18], [0, 0.425, -0.08], 0xe0f2fe, { opacity: 0.62, roughness: 0.1 });
  addCylinder(microscope, 'curved-microscope-arm', 0.08, 0.11, 0.9, [0, 0.62, 0.1], 0x0f172a);
  microscope.children[microscope.children.length - 1].rotation.x = -0.42;
  addCylinder(microscope, 'objective-turret', 0.18, 0.16, 0.13, [0, 0.82, -0.12], 0x334155);
  const objective = addCylinder(microscope, 'animated-focusing-objective-lens', 0.055, 0.065, 0.28, [0, 0.63, -0.12], 0x0f172a);
  addCylinder(microscope, 'eyepiece-tube-left', 0.06, 0.075, 0.44, [-0.09, 1.05, 0.03], 0x111827);
  addCylinder(microscope, 'eyepiece-tube-right', 0.06, 0.075, 0.44, [0.09, 1.05, 0.03], 0x111827);
  addCylinder(microscope, 'coarse-focus-knob-left', 0.09, 0.09, 0.07, [-0.34, 0.67, 0.02], 0x475569);
  microscope.children[microscope.children.length - 1].rotation.z = Math.PI / 2;
  addCylinder(microscope, 'coarse-focus-knob-right', 0.09, 0.09, 0.07, [0.34, 0.67, 0.02], 0x475569);
  microscope.children[microscope.children.length - 1].rotation.z = Math.PI / 2;
  addCylinder(microscope, 'illuminator-glow', 0.13, 0.13, 0.035, [0, 0.26, -0.1], 0xfef3c7);
  (microscope.children[microscope.children.length - 1] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfacc15,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });
  return { microscope, objective };
}

function createAudioState() {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.18;
  masterGain.connect(context.destination);

  const ambientGain = context.createGain();
  ambientGain.gain.value = 0.2;
  ambientGain.connect(masterGain);
  const musicGain = context.createGain();
  musicGain.gain.value = 0.08;
  musicGain.connect(masterGain);

  const hum = context.createOscillator();
  hum.type = 'sine';
  hum.frequency.value = 58;
  hum.connect(ambientGain);
  hum.start();
  const air = context.createOscillator();
  air.type = 'triangle';
  air.frequency.value = 142;
  air.connect(ambientGain);
  air.start();
  const music = context.createOscillator();
  music.type = 'sine';
  music.frequency.value = 220;
  music.connect(musicGain);
  music.start();

  return { context, ambientGain, musicGain, masterGain, oscillators: [hum, air, music] };
}

function playTone(audio: AudioState | null, frequency: number, duration = 0.12, type: OscillatorType = 'sine') {
  if (!audio) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audio.context.currentTime);
  gain.gain.setValueAtTime(0.0001, audio.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, audio.context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audio.masterGain);
  oscillator.start();
  oscillator.stop(audio.context.currentTime + duration + 0.02);
}

function makeTextTexture(title: string, subtitle = '', accent = '#6ee7b7', width = 720, height = 260) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = 'rgba(5, 14, 24, 0.94)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = accent;
  ctx.font = '900 30px sans-serif';
  ctx.fillText('CLASS 10 BIOLOGY', 30, 50);
  ctx.fillStyle = '#f8fafc';
  ctx.font = title.length > 18 ? '900 46px sans-serif' : '900 58px sans-serif';
  ctx.fillText(title, 30, 128);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '28px sans-serif';
  ctx.fillText(subtitle, 30, 186);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLabel(text: string, accent = '#6ee7b7') {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.36),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(text, '', accent, 520, 150),
      transparent: true,
      depthTest: false,
    }),
  );
}

function makeControllerRay() {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -3.2),
  ]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.74 }),
  );
}

function makeStageButton(stage: (typeof STAGES)[number], index: number) {
  const button = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.28, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.25,
      roughness: 0.42,
    }),
  );
  button.name = `microscope-stage-${index}`;
  button.position.set(3.02, 2.38 - index * 0.38, -3.04);
  const label = makeLabel(stage.title, '#6ee7b7');
  label.position.z = 0.052;
  label.scale.setScalar(0.68);
  button.add(label);
  return button;
}

export default function MicroscopicLifeObservationViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef(0);
  const specimenRef = useRef(0);
  const audioRef = useRef<AudioState | null>(null);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [specimenIndex, setSpecimenIndex] = useState(0);
  const stage = STAGES[stageIndex];

  const narrateStage = useCallback((index: number) => {
    const item = STAGES[index];
    void playSimulationNarration(`${item.title}. ${item.teacher}`, index);
  }, []);

  const markerText = useMemo(
    () => MARKERS.map(marker => `${marker.label}: look for shape, colour, and movement.`),
    [],
  );

  const ensureAudioReady = useCallback(async () => {
    if (!audioRef.current) audioRef.current = createAudioState();
    await audioRef.current?.context.resume().catch(() => undefined);
    return audioRef.current;
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) setVrSupported(true);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06131c);
    scene.fog = new THREE.Fog(0xdbeafe, 8, 22);
    const camera = new THREE.PerspectiveCamera(64, mount.clientWidth / mount.clientHeight, 0.05, 50);
    const guidedCamera = createGuidedCamera(camera, renderer.domElement);
    guidedCamera.focusOn(
      { position: new THREE.Vector3(0, 1.62, 3.2), target: new THREE.Vector3(0, 1.62, -3.05) },
      { animate: false },
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.add(new THREE.HemisphereLight(0xf8fafc, 0x94a3b8, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const daylight = new THREE.DirectionalLight(0xdbeafe, 1.1);
    daylight.position.set(-4, 3, -5);
    scene.add(daylight);

    const labRoot = new THREE.Group();
    labRoot.name = 'free-movable-microscope-lab-world';
    scene.add(labRoot);
    addLabInterior(labRoot);
    const { microscope, objective } = addMicroscopeModel(labRoot);

    const video = document.createElement('video');
    video.src = VIDEO_SRC;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    videoRef.current = video;
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const microscopeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.42, 2.58, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.42, metalness: 0.08 }),
    );
    microscopeFrame.position.set(0, 1.72, -3.35);
    microscopeFrame.castShadow = true;
    labRoot.add(microscopeFrame);

    const screenGroup = new THREE.Group();
    screenGroup.name = 'microscope-zoom-transition-video-group';
    labRoot.add(screenGroup);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 2.25),
      new THREE.MeshBasicMaterial({ map: videoTexture }),
    );
    screen.name = 'large-microscope-video-screen';
    screen.position.set(0, 1.72, -3.285);
    screenGroup.add(screen);

    const organismLayer = new THREE.Group();
    organismLayer.name = 'highly-detailed-animated-microscopic-organisms-overlay';
    screenGroup.add(organismLayer);
    const organismMeshes = Array.from({ length: 26 }, (_, index) => {
      const color = [0x84cc16, 0x6ee7b7, 0xf0abfc, 0xfacc15][index % 4];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.035 + (index % 5) * 0.006, 18, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.46,
        }),
      );
      mesh.name = `detailed-microorganism-${index + 1}`;
      mesh.scale.set(1.6 + (index % 3) * 0.5, 0.7 + (index % 4) * 0.2, 1);
      mesh.position.set(
        -1.85 + (index % 9) * 0.45,
        0.86 + Math.floor(index / 9) * 0.42,
        -3.265,
      );
      organismLayer.add(mesh);
      return mesh;
    });

    const title = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 0.9),
      new THREE.MeshBasicMaterial({
        map: makeTextTexture('Microscopic Life', 'Observe protists in a water sample'),
        transparent: true,
      }),
    );
    title.position.set(0, 3.18, -3.35);
    labRoot.add(title);

    const stageButtons = STAGES.map(makeStageButton);
    stageButtons.forEach(button => labRoot.add(button));

    const specimenButtons = SPECIMENS.map((specimen, index) => {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.16, 0.05),
        new THREE.MeshStandardMaterial({
          color: Number.parseInt(specimen.color.slice(1), 16),
          emissive: Number.parseInt(specimen.color.slice(1), 16),
          emissiveIntensity: 0.18,
          roughness: 0.38,
        }),
      );
      button.name = `specimen-button-${specimen.id}`;
      button.position.set(-3.05, 1.72 - index * 0.34, -3.04);
      const label = makeLabel(specimen.label, specimen.color);
      label.position.z = 0.052;
      label.scale.setScalar(0.56);
      button.add(label);
      labRoot.add(button);
      return button;
    });

    const markers = MARKERS.map(marker => {
      const color = Number.parseInt(marker.color.slice(1), 16);
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 28, 18),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          roughness: 0.3,
        }),
      );
      node.name = `microscope-marker-${marker.id}`;
      node.position.set(marker.position[0], marker.position[1], marker.position[2]);
      const label = makeLabel(marker.label, marker.color);
      label.position.y = 0.3;
      label.scale.setScalar(0.52);
      node.add(label);
      labRoot.add(node);
      return node;
    });

    const ctrl0 = renderer.xr.getController(0);
    const ctrl1 = renderer.xr.getController(1);
    ctrl0.add(makeControllerRay());
    ctrl1.add(makeControllerRay());
    scene.add(ctrl0, ctrl1);
    const backLatches = [false, false];
    const previousStepLatches = [false, false];
    const specimenCycleLatches = [false, false];
    const moveDirection = new THREE.Vector3();
    const strafeDirection = new THREE.Vector3();
    let focusPulse = 0;

    const goToStage = (index: number) => {
      const next = THREE.MathUtils.clamp(index, 0, STAGES.length - 1);
      stageRef.current = next;
      setStageIndex(next);
      focusPulse = 1;
      playTone(audioRef.current, 520, 0.16, 'triangle');
      narrateStage(next);
    };

    const selectSpecimen = (index: number) => {
      const specimen = SPECIMENS[index];
      specimenRef.current = index;
      setSpecimenIndex(index);
      playTone(audioRef.current, 320 + index * 90, 0.18, 'sawtooth');
      if (video.duration && Number.isFinite(video.duration)) {
        video.currentTime = specimen.offset % Math.max(video.duration - 1, 1);
      }
      void playSimulationNarration(`${specimen.label}. Observe the sample and compare shape, colour, and movement.`, 20 + index);
    };

    const explainCurrentStage = () => {
      const current = STAGES[stageRef.current];
      playTone(audioRef.current, 680, 0.16, 'triangle');
      void playSimulationNarration(
        `${current.title}. ${current.cue} ${current.action}`,
        30 + stageRef.current,
      );
    };

    const interactionSystem = createInteractionSystem({
      camera,
      domElement: renderer.domElement,
      xrControllers: [ctrl0, ctrl1],
      onSelect: (id, object) => {
        if (id.startsWith('microscope-stage-')) {
          const next = Number(id.replace('microscope-stage-', ''));
          if (Number.isInteger(next)) {
            goToStage(next);
          }
        } else if (id.startsWith('specimen-button-')) {
          const next = SPECIMENS.findIndex(item => id === `specimen-button-${item.id}`);
          if (next >= 0) selectSpecimen(next);
        } else {
          const marker = MARKERS.find(item => id === `microscope-marker-${item.id}`);
          if (marker) {
            focusPulse = 1;
            playTone(audioRef.current, 740, 0.1, 'square');
            void playSimulationNarration(`${marker.label}. ${markerText[MARKERS.indexOf(marker)]}`, 10);
          }
        }
        interactionSystem.setSelected(id);
        guidedCamera.focusOn({ position: camera.position.clone(), target: object.position.clone() });
      },
    });

    stageButtons.forEach(button => interactionSystem.register(button.name, button, { highlightColor: '#6ee7b7' }));
    specimenButtons.forEach(button => interactionSystem.register(button.name, button, { highlightColor: '#facc15' }));
    markers.forEach(marker => interactionSystem.register(marker.name, marker, { highlightColor: '#facc15' }));

    const clock = new THREE.Clock();
    renderer.xr.addEventListener('sessionstart', () => {
      void ensureAudioReady().then(audio => {
        playTone(audio, 460, 0.12, 'triangle');
        narrateStage(stageRef.current);
      });
    });
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.033);
      const elapsed = clock.elapsedTime;
      if (!renderer.xr.isPresenting) {
        guidedCamera.update(dt);
      } else {
        const session = renderer.xr.getSession();
        session?.inputSources.forEach((inputSource, index) => {
          const gamepad = inputSource.gamepad;
          if (!gamepad) return;
          const axisX = gamepad.axes[2] ?? gamepad.axes[0] ?? 0;
          const axisY = gamepad.axes[3] ?? gamepad.axes[1] ?? 0;
          if (inputSource.handedness === 'right' && Math.abs(axisX) > 0.16) {
            labRoot.rotation.y -= axisX * dt * 1.45;
          }
          if (inputSource.handedness === 'left') {
            camera.getWorldDirection(moveDirection);
            moveDirection.y = 0;
            moveDirection.normalize();
            strafeDirection.crossVectors(moveDirection, new THREE.Vector3(0, 1, 0)).normalize();
            if (Math.abs(axisY) > 0.16) labRoot.position.addScaledVector(moveDirection, axisY * dt * 1.25);
            if (Math.abs(axisX) > 0.16) labRoot.position.addScaledVector(strafeDirection, axisX * dt * 1.25);
          }

          const back = updateButtonLatch(
            isQuestBackPressed(gamepad.buttons, inputSource.handedness),
            backLatches[index],
          );
          backLatches[index] = back.latched;
          if (back.pressed) {
            playTone(audioRef.current, 260, 0.1, 'square');
            if (stageRef.current > 0) goToStage(stageRef.current - 1);
            else void session.end();
          }

          const xButton = updateButtonLatch(Boolean(gamepad.buttons[4]?.pressed), previousStepLatches[index]);
          previousStepLatches[index] = xButton.latched;
          if (xButton.pressed && stageRef.current > 0) goToStage(stageRef.current - 1);

          const secondaryButton = updateButtonLatch(Boolean(gamepad.buttons[1]?.pressed), specimenCycleLatches[index]);
          specimenCycleLatches[index] = secondaryButton.latched;
          if (secondaryButton.pressed) {
            const nextSpecimen = (specimenRef.current + 1) % SPECIMENS.length;
            selectSpecimen(nextSpecimen);
            explainCurrentStage();
          }
        });
      }
      focusPulse = Math.max(0, focusPulse - dt * 1.6);
      const focusScale = 1 + focusPulse * 0.11 + Math.sin(elapsed * 1.2) * 0.006;
      screen.scale.setScalar(focusScale);
      objective.position.y = 0.63 + Math.sin(elapsed * 1.5) * 0.012 - focusPulse * 0.05;
      microscope.rotation.y = Math.sin(elapsed * 0.35) * 0.015;
      markers.forEach((marker, index) => {
        marker.position.y += Math.sin(elapsed * 1.8 + index) * 0.0009;
        marker.rotation.y += 0.01;
      });
      organismMeshes.forEach((organism, index) => {
        organism.position.x += Math.sin(elapsed * 0.8 + index * 1.7) * 0.0009;
        organism.position.y += Math.cos(elapsed * 1.1 + index) * 0.0007;
        organism.rotation.z += 0.012 + index * 0.0004;
      });
      title.lookAt(camera.position);
      stageButtons.forEach(button => button.lookAt(camera.position));
      specimenButtons.forEach(button => button.lookAt(camera.position));
      markers.forEach(marker => marker.lookAt(camera.position));
      renderer.render(scene, camera);
    });

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      interactionSystem.dispose();
      guidedCamera.dispose();
      video.pause();
      audioRef.current?.oscillators.forEach(oscillator => oscillator.stop());
      audioRef.current?.context.close().catch(() => undefined);
      audioRef.current = null;
      videoTexture.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      videoRef.current = null;
      rendererRef.current = null;
      stopSimulationNarration();
    };
  }, [ensureAudioReady, markerText, narrateStage]);

  const startExperience = async () => {
    setStarted(true);
    const audio = await ensureAudioReady();
    playTone(audio, 440, 0.14, 'triangle');
    narrateStage(stageIndex);
    await videoRef.current?.play().catch(() => undefined);
  };

  const enterVR = async () => {
    await startExperience();
    const renderer = rendererRef.current;
    if (!renderer || !navigator.xr) return;
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor'],
    });
    await renderer.xr.setSession(session);
    const audio = await ensureAudioReady();
    playTone(audio, 520, 0.12, 'triangle');
    narrateStage(stageRef.current);
  };

  const setStage = (index: number) => {
    stageRef.current = index;
    setStageIndex(index);
    playTone(audioRef.current, 520, 0.12, 'triangle');
    narrateStage(index);
  };

  const selectBrowserSpecimen = (index: number) => {
    specimenRef.current = index;
    setSpecimenIndex(index);
    playTone(audioRef.current, 320 + index * 90, 0.14, 'sawtooth');
    const video = videoRef.current;
    const specimen = SPECIMENS[index];
    if (video?.duration && Number.isFinite(video.duration)) {
      video.currentTime = specimen.offset % Math.max(video.duration - 1, 1);
    }
    void playSimulationNarration(`${specimen.label}. Observe the sample and compare shape, colour, and movement.`, 20 + index);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#06131c' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!started && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(6, 19, 28, 0.94)', zIndex: 10 }}>
          <div style={{ maxWidth: 760, textAlign: 'center', color: '#f8fafc' }}>
            <div style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', marginBottom: 14 }}>Class 10 Biology</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.04 }}>Microscopic Life Observation Lab</h1>
            <p style={{ color: '#cbd5e1', lineHeight: 1.65, margin: '20px auto 28px' }}>Enter a stationary microscope theatre and study live water-sample organisms through the video you provided.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={startExperience} style={buttonStyle('#6ee7b7', '#04111a')}>View in Browser</button>
              <button onClick={enterVR} disabled={!vrSupported} style={buttonStyle(vrSupported ? '#facc15' : '#475569', '#111827')}>{vrSupported ? 'Enter VR' : 'VR unavailable'}</button>
            </div>
          </div>
        </div>
      )}
      {started && (
        <section style={panelStyle}>
          <div style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Microscope lab - 8 min</div>
          <h2 style={{ margin: '6px 0 8px', fontSize: 22 }}>{stage.title}</h2>
          <p style={{ color: '#cbd5e1', lineHeight: 1.45, margin: '0 0 10px' }}>{stage.cue}</p>
          <p style={{ color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px', fontSize: 13 }}>{stage.action}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {STAGES.map((item, index) => (
              <button key={item.title} onClick={() => setStage(index)} style={smallButtonStyle(index === stageIndex ? '#6ee7b7' : '#1f2937', index === stageIndex ? '#04111a' : '#f8fafc')}>{item.title}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
            {SPECIMENS.map((item, index) => (
              <button key={item.id} onClick={() => selectBrowserSpecimen(index)} style={smallButtonStyle(index === specimenIndex ? item.color : '#1f2937', index === specimenIndex ? '#04111a' : '#f8fafc')}>{item.label}</button>
            ))}
          </div>
          <p style={{ color: '#64748b', lineHeight: 1.35, margin: '12px 0 0', fontSize: 12 }}>Quest: trigger selects visible lab buttons, left stick moves, right stick rotates, B goes back, X moves to previous step.</p>
        </section>
      )}
    </div>
  );
}

function buttonStyle(background: string, color: string) {
  return {
    border: 0,
    borderRadius: 8,
    padding: '12px 18px',
    background,
    color,
    fontWeight: 900,
    cursor: 'pointer',
  };
}

function smallButtonStyle(background: string, color: string) {
  return {
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7,
    padding: '9px 10px',
    background,
    color,
    fontWeight: 850,
    cursor: 'pointer',
    minHeight: 38,
  };
}

const panelStyle = {
  position: 'absolute',
  right: 18,
  top: 18,
  width: 'min(420px, calc(100vw - 36px))',
  borderRadius: 8,
  padding: 16,
  background: 'rgba(6, 19, 28, 0.9)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#f8fafc',
  backdropFilter: 'blur(12px)',
} as const;
