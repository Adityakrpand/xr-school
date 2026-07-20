'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { isQuestBackPressed, updateButtonLatch } from '@/lib/xrNavigation';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';

const HUMAN_BODY_VIDEO_SRC = '/simulations/human-body-anatomy.mp4';

const HUMAN_BODY_STAGES = [
  {
    title: 'Body Overview',
    button: 'Start Tour',
    narration:
      'Welcome to human body anatomy. Look around the full body view and notice that the human body is a system made of many parts working together.',
    focus:
      'Anatomy means studying the structure of the body, including organs, bones, muscles, and the positions of major body parts.',
  },
  {
    title: 'Skeleton Support',
    button: 'View Skeleton',
    narration:
      'The skeleton gives the body shape and support. Bones protect soft organs and create a strong frame that helps us stand, move, and grow.',
    focus:
      'Bones are not only hard supports. They protect the brain, heart, and lungs, and they work with joints to allow movement.',
  },
  {
    title: 'Muscles and Motion',
    button: 'Study Muscles',
    narration:
      'Muscles pull on bones to create movement. When muscles contract and relax, they help us walk, lift, bend, and keep our posture steady.',
    focus:
      'Muscles and bones work as partners. Muscles provide force, and bones provide the framework for controlled motion.',
  },
  {
    title: 'Internal Organs',
    button: 'Inspect Organs',
    narration:
      'Inside the body, organs carry out important life processes. The heart pumps blood, the lungs help us breathe, and digestive organs help process food.',
    focus:
      'Organs are specialized body parts. Each organ has a structure that matches its job inside a larger system.',
  },
  {
    title: 'Systems Together',
    button: 'Complete Tour',
    narration:
      'The human body works best when systems act together. Support, movement, breathing, circulation, and digestion all connect to keep us alive and active.',
    focus:
      'The body is not a collection of separate parts. It is an organized system in which each part supports the others.',
  },
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

function createAudioState() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.12;
  masterGain.connect(context.destination);

  const ambientGain = context.createGain();
  ambientGain.gain.value = 0.08;
  ambientGain.connect(masterGain);

  const musicGain = context.createGain();
  musicGain.gain.value = 0.03;
  musicGain.connect(masterGain);

  const roomHum = context.createOscillator();
  roomHum.type = 'sine';
  roomHum.frequency.value = 72;
  roomHum.connect(ambientGain);
  roomHum.start();

  const airyLayer = context.createOscillator();
  airyLayer.type = 'triangle';
  airyLayer.frequency.value = 164;
  airyLayer.connect(ambientGain);
  airyLayer.start();

  const musicBed = context.createOscillator();
  musicBed.type = 'sine';
  musicBed.frequency.value = 196;
  musicBed.connect(musicGain);
  musicBed.start();

  return {
    context,
    ambientGain,
    musicGain,
    masterGain,
    oscillators: [roomHum, airyLayer, musicBed],
  };
}

function playTone(audio: AudioState | null, frequency: number, duration = 0.12, type: OscillatorType = 'sine') {
  if (!audio) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  const startAt = audio.context.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.11, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(audio.masterGain);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function makeTextTexture(title: string, body: string, accent = '#fca5a5') {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(24, 24, 27, 0.95)');
  gradient.addColorStop(1, 'rgba(69, 10, 10, 0.88)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = accent;
  ctx.font = '900 28px sans-serif';
  ctx.fillText('HUMAN BODY ANATOMY', 34, 58);
  ctx.fillStyle = '#fef2f2';
  ctx.font = title.length > 18 ? '900 48px sans-serif' : '900 60px sans-serif';
  ctx.fillText(title, 34, 138);

  ctx.fillStyle = '#fee2e2';
  ctx.font = '28px sans-serif';
  const words = body.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = `${line} ${word}`.trim();
    if (ctx.measureText(next).width > 810 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);
  lines.slice(0, 4).forEach((item, index) => ctx.fillText(item, 34, 206 + index * 38));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePanel(title: string, body: string, accent = '#fca5a5') {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.04),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(title, body, accent),
      transparent: true,
      depthTest: false,
    }),
  );
}

function addBioLabInterior(scene: THREE.Object3D) {
  const lab = new THREE.Group();
  lab.name = 'human-body-biology-laboratory-interior';
  scene.add(lab);

  addBox(lab, 'bio-lab-floor', [9.4, 0.08, 8.8], [0, -0.04, -0.8], 0xdbe4ea, { roughness: 0.8 });
  addBox(lab, 'bio-lab-rear-wall', [9.4, 3.6, 0.12], [0, 1.78, -4.85], 0xe8f0f5, { roughness: 0.74 });
  addBox(lab, 'bio-lab-left-wall', [0.12, 3.6, 8.8], [-4.7, 1.78, -0.8], 0xdce7ee, { roughness: 0.74 });
  addBox(lab, 'bio-lab-right-wall', [0.12, 3.6, 8.8], [4.7, 1.78, -0.8], 0xdce7ee, { roughness: 0.74 });
  addBox(lab, 'bio-lab-ceiling', [9.4, 0.08, 8.8], [0, 3.56, -0.8], 0xf8fafc, { roughness: 0.68 });

  for (let i = 0; i < 4; i += 1) {
    const light = addBox(lab, `bio-lab-light-${i + 1}`, [1.24, 0.04, 0.32], [-2.75 + i * 1.82, 3.48, -1.25], 0xffffff);
    (light.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
    (light.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.88;
  }

  for (let i = 0; i < 3; i += 1) {
    addBox(lab, `bio-lab-window-glass-${i + 1}`, [1.08, 1.18, 0.05], [-3 + i * 1.24, 2.1, -4.78], 0x93c5fd, { opacity: 0.42, roughness: 0.18 });
    addBox(lab, `bio-lab-window-top-${i + 1}`, [1.2, 0.06, 0.08], [-3 + i * 1.24, 2.7, -4.73], 0xf8fafc);
    addBox(lab, `bio-lab-window-bottom-${i + 1}`, [1.2, 0.06, 0.08], [-3 + i * 1.24, 1.48, -4.73], 0xf8fafc);
  }

  [-2.7, 0, 2.7].forEach((x, index) => {
    addBox(lab, `bio-lab-bench-${index + 1}`, [1.92, 0.14, 0.94], [x, 0.78, -0.62], 0x334155, { roughness: 0.44 });
    addBox(lab, `bio-lab-bench-leg-a-${index + 1}`, [0.08, 0.72, 0.08], [x - 0.81, 0.38, -0.97], 0x94a3b8, { metalness: 0.35 });
    addBox(lab, `bio-lab-bench-leg-b-${index + 1}`, [0.08, 0.72, 0.08], [x + 0.81, 0.38, -0.97], 0x94a3b8, { metalness: 0.35 });
  });

  [-3.82, 3.82].forEach((x, side) => {
    addBox(lab, `bio-lab-cabinet-body-${side + 1}`, [1.28, 1.82, 0.5], [x, 1.08, -4.15], 0x64748b, { roughness: 0.5 });
    addBox(lab, `bio-lab-cabinet-door-${side + 1}`, [1.16, 1.54, 0.04], [x, 1.18, -3.88], 0xbae6fd, { opacity: 0.32, roughness: 0.16 });
    for (let row = 0; row < 3; row += 1) {
      addBox(lab, `bio-lab-cabinet-shelf-${side + 1}-${row + 1}`, [1.12, 0.035, 0.38], [x, 0.62 + row * 0.48, -3.92], 0xdbeafe, { opacity: 0.45 });
    }
  });

  for (let i = 0; i < 8; i += 1) {
    const bottle = addCylinder(lab, `bio-lab-specimen-bottle-${i + 1}`, 0.055, 0.06, 0.28, [-4 + (i % 4) * 0.24, 0.66 + Math.floor(i / 4) * 0.52, -3.58], i % 2 ? 0x86efac : 0xfca5a5, { opacity: 0.68 });
    addBox(bottle, `bio-lab-bottle-label-${i + 1}`, [0.1, 0.045, 0.01], [0, -0.02, 0.057], 0xf8fafc);
  }

  for (let i = 0; i < 6; i += 1) {
    const tube = addCylinder(lab, `bio-lab-test-tube-${i + 1}`, 0.03, 0.035, 0.36, [2.95 + (i % 3) * 0.22, 0.66 + Math.floor(i / 3) * 0.5, -3.56], i % 2 ? 0x93c5fd : 0xfde68a, { opacity: 0.72, radialSegments: 18 });
    tube.rotation.z = i % 2 ? 0.1 : -0.1;
  }

  for (let i = 0; i < 4; i += 1) {
    addCylinder(lab, `bio-lab-beaker-${i + 1}`, 0.1, 0.11, 0.28, [1.82 + i * 0.22, 0.92, -0.44], 0xbfdbfe, { opacity: 0.48 });
  }
  for (let i = 0; i < 3; i += 1) {
    const pipette = addCylinder(lab, `bio-lab-pipette-${i + 1}`, 0.012, 0.018, 0.55, [2.72 + i * 0.12, 0.96, -0.62], 0xf8fafc, { opacity: 0.72, radialSegments: 12 });
    pipette.rotation.z = Math.PI / 2.4;
  }
  for (let i = 0; i < 5; i += 1) {
    const slide = addBox(lab, `bio-lab-slide-${i + 1}`, [0.32, 0.014, 0.12], [-0.55 + i * 0.22, 0.865, -0.28], 0xe0f2fe, { opacity: 0.68, roughness: 0.15 });
    addBox(slide, `bio-lab-slide-stain-${i + 1}`, [0.08, 0.016, 0.05], [0, 0.008, 0], i % 2 ? 0xfca5a5 : 0x93c5fd, { opacity: 0.75 });
  }
  for (let i = 0; i < 4; i += 1) {
    addCylinder(lab, `bio-lab-petri-dish-${i + 1}`, 0.13, 0.13, 0.035, [-3 + i * 0.2, 0.89, -0.56], 0xdbeafe, { opacity: 0.56 });
  }

  addBox(lab, 'bio-lab-notebook', [0.54, 0.035, 0.4], [-2.02, 0.89, -0.38], 0xf8fafc);
  addBox(lab, 'bio-lab-notebook-cover', [0.58, 0.03, 0.44], [-2.06, 0.87, -0.38], 0x2563eb);
  addCylinder(lab, 'bio-lab-sanitizer', 0.055, 0.07, 0.32, [3.28, 0.95, -0.42], 0xbfdbfe, { opacity: 0.72 });
  addBox(lab, 'bio-lab-first-aid', [0.34, 0.22, 0.2], [3.58, 0.95, -0.42], 0xf8fafc);
  addBox(lab, 'bio-lab-first-aid-cross-h', [0.18, 0.035, 0.01], [3.58, 0.98, -0.315], 0xef4444);
  addBox(lab, 'bio-lab-first-aid-cross-v', [0.035, 0.16, 0.01], [3.58, 0.98, -0.31], 0xef4444);

  ['BODY SYSTEMS', 'SKELETAL SUPPORT', 'ORGANS AND FUNCTION'].forEach((label, index) => {
    const poster = makePanel(label, 'Observe - Learn - Connect', '#7dd3fc');
    poster.position.set(-1.3 + index * 1.3, 2.42, -4.76);
    poster.scale.set(0.4, 0.48, 1);
    poster.name = `bio-lab-poster-${index + 1}`;
    lab.add(poster);
  });

  return lab;
}

function addVideoScreen(root: THREE.Object3D) {
  const video = document.createElement('video');
  video.src = HUMAN_BODY_VIDEO_SRC;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  // Keep the 26 MB lesson video out of the initial page download. Playback is
  // already initiated by the learner, so metadata is enough for scene setup.
  video.preload = 'metadata';

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 3.18, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x1f1111,
      roughness: 0.28,
      metalness: 0.12,
      emissive: 0x450a0a,
      emissiveIntensity: 0.2,
    }),
  );
  frame.name = 'human-body-anatomy-video-frame';
  frame.position.set(0, 1.72, -3.42);
  root.add(frame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.08, 2.86),
    new THREE.MeshBasicMaterial({
      map: texture,
    }),
  );
  screen.name = 'human-body-anatomy-full-video-screen';
  screen.position.set(0, 1.72, -3.34);
  root.add(screen);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.18, 2.96),
    new THREE.MeshBasicMaterial({
      color: 0xfca5a5,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    }),
  );
  glow.name = 'human-body-anatomy-screen-glow';
  glow.position.set(0, 1.72, -3.46);
  root.add(glow);

  return { video, texture, frame, screen, glow };
}

function addStageButton(root: THREE.Object3D, targets: THREE.Object3D[], stageIndex: number, label: string) {
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.08, 40),
    new THREE.MeshStandardMaterial({
      color: 0xf87171,
      emissive: 0xdc2626,
      emissiveIntensity: 0.72,
      roughness: 0.24,
    }),
  );
  button.name = `human-body-stage-button-${stageIndex}`;
  button.position.set(-1.55 + stageIndex * 0.78, 0.82, -1.35);
  button.rotation.x = Math.PI / 2;
  button.userData.stageIndex = stageIndex;

  const labelMesh = makePanel(label, '', '#fecaca');
  labelMesh.position.set(0, 0.18, 0);
  labelMesh.scale.setScalar(0.22);
  button.add(labelMesh);

  root.add(button);
  targets.push(button);
}

export default function HumanBodyAnatomyViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const goToStageRef = useRef<(index: number) => void>(() => undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<AudioState | null>(null);
  const stageIndexRef = useRef(0);
  const mutedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [muted, setMuted] = useState(false);

  const stage = HUMAN_BODY_STAGES[stageIndex];
  const progress = useMemo(() => `${stageIndex + 1}/${HUMAN_BODY_STAGES.length}`, [stageIndex]);

  const speak = useCallback((text: string, cueIndex = stageIndexRef.current) => {
    if (mutedRef.current) return;
    void playSimulationNarration(`Teacher guidance. ${text}`, cueIndex);
  }, []);

  const ensureAudioReady = useCallback(async () => {
    if (!audioRef.current) audioRef.current = createAudioState();
    await audioRef.current?.context.resume().catch(() => undefined);
    return audioRef.current;
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) setVrSupported(true);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f0a0a);
    const worldRoot = new THREE.Group();
    worldRoot.name = 'free-movable-human-body-anatomy-world';
    scene.add(worldRoot);
    addBioLabInterior(worldRoot);

    const videoStage = addVideoScreen(worldRoot);
    videoRef.current = videoStage.video;

    const panel = makePanel(HUMAN_BODY_STAGES[0].title, HUMAN_BODY_STAGES[0].focus, '#fca5a5');
    panel.name = 'human-body-anatomy-teacher-explanation-panel';
    panel.position.set(0, 3.02, -2.48);
    worldRoot.add(panel);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 0.08, 96),
      new THREE.MeshStandardMaterial({ color: 0x3f1d1d, emissive: 0x7f1d1d, emissiveIntensity: 0.28, roughness: 0.34 }),
    );
    platform.name = 'low-anatomy-observation-platform';
    platform.position.set(0, 0.56, -1.45);
    worldRoot.add(platform);

    const ringGeometry = new THREE.TorusGeometry(1.18, 0.024, 18, 84);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xfca5a5,
      emissive: 0xdc2626,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.18,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.78, -1.45);
    worldRoot.add(ring);

    const targets: THREE.Object3D[] = [];
    HUMAN_BODY_STAGES.forEach((item, index) => addStageButton(worldRoot, targets, index, item.button));

    scene.add(new THREE.HemisphereLight(0xffede8, 0x200909, 1.35));
    const glow = new THREE.PointLight(0xf87171, 3.2, 12);
    glow.position.set(-2, 2.4, -1.2);
    scene.add(glow);

    const camera = new THREE.PerspectiveCamera(66, mount.clientWidth / mount.clientHeight, 0.05, 90);
    const guidedCamera = createGuidedCamera(camera, renderer.domElement);
    guidedCamera.focusOn({
      position: new THREE.Vector3(0, 1.55, 4.7),
      target: new THREE.Vector3(0, 1.55, -2.3),
    }, { animate: false });

    const controller0 = renderer.xr.getController(0);
    const controller1 = renderer.xr.getController(1);
    const makeRay = () => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -4)]),
      new THREE.LineBasicMaterial({ color: 0xfecaca, transparent: true, opacity: 0.86 }),
    );
    controller0.add(makeRay());
    controller1.add(makeRay());
    scene.add(controller0, controller1);

    const goToStage = (requestedIndex: number) => {
      const nextIndex = Math.min(Math.max(requestedIndex, 0), HUMAN_BODY_STAGES.length - 1);
      const nextStage = HUMAN_BODY_STAGES[nextIndex];
      stageIndexRef.current = nextIndex;
      setStageIndex(nextIndex);
      panel.material.map?.dispose();
      panel.material.map = makeTextTexture(nextStage.title, nextStage.focus, '#fca5a5');
      panel.material.needsUpdate = true;
      speak(nextStage.narration, nextIndex);
    };
    goToStageRef.current = goToStage;

    const interactionSystem = createInteractionSystem({
      camera,
      domElement: renderer.domElement,
      xrControllers: [controller0, controller1],
      onSelect: (id, object) => {
        const nextIndex = object.userData.stageIndex as number | undefined;
        if (typeof nextIndex === 'number') goToStageRef.current(nextIndex);
        interactionSystem.setSelected(id);
      },
    });
    targets.forEach(target => interactionSystem.register(target.name, target, { highlightColor: '#fff1f2' }));

    const clock = new THREE.Clock();
    const moveDirection = new THREE.Vector3();
    const strafeDirection = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const backLatches = [false, false];
    let narrationRetryId: number | null = null;
    let elapsed = 0;
    renderer.xr.addEventListener('sessionstart', () => {
      void ensureAudioReady().then(audio => {
        playTone(audio, 430, 0.12, 'triangle');
        stopSimulationNarration();
        if (narrationRetryId !== null) window.clearTimeout(narrationRetryId);
        narrationRetryId = window.setTimeout(() => {
          speak(HUMAN_BODY_STAGES[stageIndexRef.current].narration, stageIndexRef.current);
        }, 320);
      });
    });

    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      elapsed += delta;
      if (!renderer.xr.isPresenting) guidedCamera.update(delta);
      else {
        for (const [index, source] of (renderer.xr.getSession()?.inputSources ?? []).entries()) {
          const gamepad = source.gamepad;
          if (!gamepad) continue;
          const horizontal = gamepad.axes[2] ?? gamepad.axes[0] ?? 0;
          const vertical = gamepad.axes[3] ?? gamepad.axes[1] ?? 0;
          if (source.handedness === 'right' && Math.abs(horizontal) > 0.16) {
            worldRoot.rotation.y -= horizontal * delta * 1.35;
          }
          if (source.handedness === 'left') {
            camera.getWorldDirection(moveDirection);
            moveDirection.y = 0;
            moveDirection.normalize();
            strafeDirection.crossVectors(moveDirection, worldUp).normalize();
            if (Math.abs(vertical) > 0.16) worldRoot.position.addScaledVector(moveDirection, vertical * delta * 1.15);
            if (Math.abs(horizontal) > 0.16) worldRoot.position.addScaledVector(strafeDirection, horizontal * delta * 1.15);
          }
          const back = updateButtonLatch(
            isQuestBackPressed(gamepad.buttons, source.handedness),
            backLatches[index],
          );
          backLatches[index] = back.latched;
          if (back.pressed) {
            if (stageIndexRef.current > 0) goToStageRef.current(stageIndexRef.current - 1);
            else void renderer.xr.getSession()?.end();
          }
        }
      }
      ring.rotation.z = elapsed * 0.16;
      worldRoot.rotation.x = Math.sin(elapsed * 0.07) * 0.01;
      renderer.render(scene, camera);
    });

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      videoStage.video.pause();
      videoRef.current = null;
      if (narrationRetryId !== null) window.clearTimeout(narrationRetryId);
      interactionSystem.dispose();
      guidedCamera.dispose();
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.filter(Boolean).forEach(item => {
          const material = item as THREE.Material & { map?: THREE.Texture };
          material.map?.dispose();
          material.dispose();
        });
      });
      videoStage.texture.dispose();
      audioRef.current?.oscillators.forEach(oscillator => oscillator.stop());
      audioRef.current?.context.close().catch(() => undefined);
      audioRef.current = null;
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      stopSimulationNarration();
    };
  }, [ensureAudioReady, speak]);

  const begin = useCallback(() => {
    setStarted(true);
    void videoRef.current?.play().catch(() => undefined);
    void ensureAudioReady().then(audio => {
      playTone(audio, 390, 0.1, 'triangle');
    });
    speak(HUMAN_BODY_STAGES[0].narration, 0);
  }, [ensureAudioReady, speak]);

  const enterVR = useCallback(async () => {
    if (!rendererRef.current) return;
    setStarted(true);
    void videoRef.current?.play().catch(() => undefined);
    const audio = await ensureAudioReady();
    playTone(audio, 460, 0.12, 'triangle');
    try {
      const session = await (navigator as Navigator & { xr?: XRSystem }).xr?.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['bounded-floor', 'hand-tracking'],
      });
      if (session) await rendererRef.current.xr.setSession(session);
    } catch {
      speak('VR could not start, so the browser anatomy tour is ready.', 0);
    }
    speak(HUMAN_BODY_STAGES[stageIndex].narration, stageIndex);
  }, [ensureAudioReady, speak, stageIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#1f0a0a', color: '#fff7f7', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!started && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 50% 35%, rgba(248,113,113,.22), rgba(31,10,10,.96) 72%)', textAlign: 'center' }}>
          <section style={{ width: 'min(820px, 100%)' }}>
            <div style={{ color: '#fca5a5', fontWeight: 900, letterSpacing: '.14em', fontSize: 13 }}>BIOLOGY - IMMERSIVE VIDEO TOUR</div>
            <h1 style={{ margin: '14px 0 12px', fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 0.96 }}>Human Body Anatomy</h1>
            <p style={{ margin: '0 auto 22px', maxWidth: 700, color: '#fee2e2', fontSize: 18, lineHeight: 1.6 }}>
              A separate anatomy-focused VR experience using your new body video, teacher narration, and free Quest movement.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={begin} style={primaryButtonStyle}>Begin Tour</button>
              {vrSupported && <button type="button" onClick={enterVR} style={secondaryButtonStyle}>Enter VR</button>}
            </div>
          </section>
        </div>
      )}
      {started && (
        <header style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 8, display: 'flex', justifyContent: 'space-between', gap: 12, pointerEvents: 'none' }}>
          <div style={panelStyle}><strong>Anatomy Tour {progress}</strong><span style={{ color: '#fca5a5', marginLeft: 10 }}>{stage.title}</span></div>
          <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
            <button type="button" onClick={() => setMuted(value => { if (!value) stopSimulationNarration(); return !value; })} style={utilityButtonStyle}>{muted ? 'Voice off' : 'Voice on'}</button>
            <button type="button" onClick={() => goToStageRef.current(stageIndex - 1)} style={utilityButtonStyle}>Back</button>
            <button type="button" onClick={() => goToStageRef.current(stageIndex + 1)} style={utilityButtonStyle}>Next</button>
          </div>
        </header>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid #fecaca',
  background: 'linear-gradient(135deg,#dc2626,#f97316,#fb7185)',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid rgba(254,202,202,.5)',
  background: 'rgba(255,255,255,.1)',
  color: '#fee2e2',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const panelStyle = {
  padding: '10px 14px',
  borderRadius: 13,
  background: 'rgba(24, 24, 27, .82)',
  border: '1px solid rgba(254,202,202,.28)',
  color: '#fff7f7',
  backdropFilter: 'blur(12px)',
} as const;

const utilityButtonStyle = {
  padding: '9px 11px',
  borderRadius: 10,
  border: '1px solid rgba(254,202,202,.28)',
  background: 'rgba(24, 24, 27, .82)',
  color: '#fee2e2',
  fontWeight: 800,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
} as const;
