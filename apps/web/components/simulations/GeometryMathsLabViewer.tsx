'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { isQuestBackPressed, updateButtonLatch } from '@/lib/xrNavigation';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';

type ShapeDefinition = {
  id: string;
  title: string;
  family: '2D' | '3D';
  color: string;
  facts: string;
  identity: string;
  examples: string;
  compareHint: string;
};

const SHAPES: readonly ShapeDefinition[] = [
  {
    id: 'circle',
    title: 'Circle',
    family: '2D',
    color: '#38bdf8',
    facts: '2D shape. 0 corners. 1 curved boundary. No straight sides.',
    identity: 'A circle is round and flat. Every point on the boundary is equally far from the center.',
    examples: 'clock, coin, wheel',
    compareHint: 'A circle is flat, but a sphere is solid.',
  },
  {
    id: 'triangle',
    title: 'Triangle',
    family: '2D',
    color: '#f97316',
    facts: '2D shape. 3 sides. 3 corners.',
    identity: 'A triangle is the simplest polygon. It always has exactly three straight sides.',
    examples: 'yield sign, roof truss, pizza slice',
    compareHint: 'Triangles have fewer sides than squares and rectangles.',
  },
  {
    id: 'square',
    title: 'Square',
    family: '2D',
    color: '#8b5cf6',
    facts: '2D shape. 4 equal sides. 4 corners.',
    identity: 'A square is a special rectangle because all four sides are equal.',
    examples: 'tile, chessboard cell, sticky note',
    compareHint: 'A square and rectangle both have 4 corners, but only the square has all sides equal.',
  },
  {
    id: 'rectangle',
    title: 'Rectangle',
    family: '2D',
    color: '#22c55e',
    facts: '2D shape. 4 sides. 4 corners. Opposite sides are equal.',
    identity: 'A rectangle is flat and has right angles. Its opposite sides match.',
    examples: 'book, door, whiteboard',
    compareHint: 'A rectangle is wider or taller, while a square keeps every side equal.',
  },
  {
    id: 'cube',
    title: 'Cube',
    family: '3D',
    color: '#f43f5e',
    facts: '3D shape. 6 square faces. 12 edges. 8 vertices.',
    identity: 'A cube is a solid shape where every face is a square of the same size.',
    examples: 'dice, Rubik cube, sugar cube',
    compareHint: 'A cube is a cuboid with all edges equal.',
  },
  {
    id: 'cuboid',
    title: 'Cuboid',
    family: '3D',
    color: '#14b8a6',
    facts: '3D shape. 6 rectangular faces. 12 edges. 8 vertices.',
    identity: 'A cuboid is a box-shaped solid. Opposite faces are equal rectangles.',
    examples: 'shoebox, brick, cupboard box',
    compareHint: 'A cuboid is like a stretched cube.',
  },
  {
    id: 'cylinder',
    title: 'Cylinder',
    family: '3D',
    color: '#eab308',
    facts: '3D shape. 2 flat circular faces. 1 curved surface. No vertices.',
    identity: 'A cylinder can roll because of its curved surface, but it can also stand on its flat faces.',
    examples: 'water bottle, can, chalk stick',
    compareHint: 'A cylinder has flat circles at the ends, unlike a sphere.',
  },
  {
    id: 'sphere',
    title: 'Sphere',
    family: '3D',
    color: '#fb7185',
    facts: '3D shape. 1 curved surface. 0 edges. 0 vertices.',
    identity: 'A sphere is fully round and solid. It has no flat faces and no corners.',
    examples: 'ball, orange, globe',
    compareHint: 'A sphere is the solid form related to a circle.',
  },
] as const;

const STAGES = [
  {
    title: 'Welcome',
    label: 'Start Lab',
    narration:
      'Welcome to Geometry Maths Lab. Geometry helps us notice the shapes around us and describe them using sides, corners, faces, edges, and surfaces.',
    focus:
      'Look around the lab. You will explore flat 2D shapes, solid 3D shapes, comparisons, real-world matches, and a final challenge.',
  },
  {
    title: '2D Shape Zone',
    label: '2D Shapes',
    narration:
      'In this zone, study flat shapes. A 2D shape has length and width, but not thickness like a solid object.',
    focus:
      'Explore circle, triangle, square, and rectangle. Notice sides, corners, and whether the boundary is straight or curved.',
  },
  {
    title: '3D Shape Zone',
    label: '3D Shapes',
    narration:
      'Now explore solid shapes. A 3D shape has length, width, and height. You can inspect its faces, edges, vertices, and curved surfaces.',
    focus:
      'Rotate cube, cuboid, cylinder, and sphere. Compare which ones roll and which ones stand steadily.',
  },
  {
    title: 'Compare Shapes',
    label: 'Compare',
    narration:
      'Comparison helps us understand why shapes are similar or different. Look carefully at the pair on the comparison tables.',
    focus:
      'Study square versus rectangle, circle versus sphere, cube versus cuboid, and triangle versus square.',
  },
  {
    title: 'Real World Matching',
    label: 'Match',
    narration:
      'Geometry is part of daily life. Match each real-world object to the shape that describes it best.',
    focus:
      'Choose the correct shape for objects like a coin, book, dice, box, can, and ball.',
  },
  {
    title: 'Challenge Zone',
    label: 'Challenge',
    narration:
      'Now test your understanding. Read the clue, then select the shape that matches the property.',
    focus:
      'Use what you learned about sides, corners, faces, edges, curved surfaces, and rolling behavior.',
  },
  {
    title: 'Final Recap',
    label: 'Recap',
    narration:
      'Great work. You explored important 2D and 3D shapes and learned how their properties help us identify them.',
    focus:
      'Remember: geometry helps us classify shapes, compare them, and connect them to everyday objects.',
  },
] as const;

const COMPARISONS = [
  { id: 'square-rectangle', left: 'square', right: 'rectangle', note: 'Both have 4 corners. Only the square keeps all 4 sides equal.' },
  { id: 'circle-sphere', left: 'circle', right: 'sphere', note: 'Both are round. The circle is flat, but the sphere is a solid 3D shape.' },
  { id: 'cube-cuboid', left: 'cube', right: 'cuboid', note: 'Both have 6 faces, 12 edges, and 8 vertices. The cube keeps every edge equal.' },
  { id: 'triangle-square', left: 'triangle', right: 'square', note: 'Triangles have 3 sides, while squares have 4 equal sides.' },
] as const;

const MATCH_ITEMS = [
  { id: 'coin', label: 'Coin', answer: 'circle', shape: 'disk' },
  { id: 'book', label: 'Book', answer: 'rectangle', shape: 'book' },
  { id: 'dice', label: 'Dice', answer: 'cube', shape: 'cube' },
  { id: 'box', label: 'Box', answer: 'cuboid', shape: 'cuboid' },
  { id: 'can', label: 'Can', answer: 'cylinder', shape: 'cylinder' },
  { id: 'ball', label: 'Ball', answer: 'sphere', shape: 'sphere' },
] as const;

const CHALLENGES = [
  { prompt: 'Find the shape with 3 sides.', answer: 'triangle' },
  { prompt: 'Which shape has no corners?', answer: 'circle' },
  { prompt: 'Which solid shape rolls like a ball?', answer: 'sphere' },
  { prompt: 'Which shape has 6 equal square faces?', answer: 'cube' },
  { prompt: 'Which shape is flat, not solid, and has 4 equal sides?', answer: 'square' },
  { prompt: 'Choose the shape used in a can.', answer: 'cylinder' },
] as const;

const STAGE_HINTS = [
  'Start by looking at the lab zones. Each station teaches one idea at a time, so move step by step.',
  'For 2D shapes, count sides and corners first, then check whether the boundary is straight or curved.',
  'For 3D shapes, inspect faces, edges, vertices, and whether the surface is flat or curved.',
  'When comparing shapes, name one similarity first and one difference next.',
  'Use the real object as your clue. Ask yourself which shape describes the object best.',
  'Read the property words carefully. The correct shape must match every clue, not just one part.',
  'Review the big ideas: 2D shapes are flat, 3D shapes are solid, and properties help us identify them.',
] as const;

const FINAL_RECAP =
  'Recap. A circle is flat and round, while a sphere is a solid round shape. Triangles have 3 sides. Squares and rectangles both have 4 corners, but a square keeps all sides equal. Cubes and cuboids are solid box shapes, and cylinders have circular ends with one curved surface. Geometry helps us describe the world clearly.';

type AudioState = {
  context: AudioContext;
  masterGain: GainNode;
  ambientGain: GainNode;
  musicGain: GainNode;
  oscillators: OscillatorNode[];
};

function createAudioState() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.13;
  masterGain.connect(context.destination);
  const ambientGain = context.createGain();
  ambientGain.gain.value = 0.09;
  ambientGain.connect(masterGain);
  const musicGain = context.createGain();
  musicGain.gain.value = 0.03;
  musicGain.connect(masterGain);
  const hum = context.createOscillator();
  hum.type = 'sine';
  hum.frequency.value = 76;
  hum.connect(ambientGain);
  hum.start();
  const sparkle = context.createOscillator();
  sparkle.type = 'triangle';
  sparkle.frequency.value = 180;
  sparkle.connect(ambientGain);
  sparkle.start();
  const bed = context.createOscillator();
  bed.type = 'sine';
  bed.frequency.value = 220;
  bed.connect(musicGain);
  bed.start();
  return { context, masterGain, ambientGain, musicGain, oscillators: [hum, sparkle, bed] };
}

function playTone(audio: AudioState | null, frequency: number, duration = 0.12, type: OscillatorType = 'sine') {
  if (!audio) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  const start = audio.context.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function makeTextTexture(title: string, body: string, accent = '#38bdf8', width = 900, height = 360) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(7,18,36,.96)');
  gradient.addColorStop(1, 'rgba(15,23,42,.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.fillStyle = accent;
  ctx.font = '900 28px sans-serif';
  ctx.fillText('GEOMETRY MATHS LAB', 34, 56);
  ctx.fillStyle = '#f8fafc';
  ctx.font = title.length > 18 ? '900 46px sans-serif' : '900 60px sans-serif';
  ctx.fillText(title, 34, 132);
  ctx.fillStyle = '#dbeafe';
  ctx.font = '27px sans-serif';
  const words = body.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = `${line} ${word}`.trim();
    if (ctx.measureText(next).width > width - 80 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);
  lines.slice(0, 5).forEach((entry, index) => ctx.fillText(entry, 34, 196 + index * 34));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePanel(title: string, body: string, accent = '#38bdf8', width = 2.75, height = 1.16) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(title, body, accent),
      transparent: true,
      depthTest: false,
    }),
  );
}

function hexToNumber(hex: string) {
  return Number.parseInt(hex.slice(1), 16);
}

function createTriangleShape(size = 0.9) {
  const shape = new THREE.Shape();
  shape.moveTo(0, size);
  shape.lineTo(-size * 0.9, -size * 0.7);
  shape.lineTo(size * 0.9, -size * 0.7);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
}

function createDisplayGeometry(shapeId: string) {
  switch (shapeId) {
    case 'circle':
      return new THREE.CylinderGeometry(0.72, 0.72, 0.08, 64);
    case 'triangle':
      return createTriangleShape(0.78);
    case 'square':
      return new THREE.BoxGeometry(1.25, 1.25, 0.08);
    case 'rectangle':
      return new THREE.BoxGeometry(1.56, 1.04, 0.08);
    case 'cube':
      return new THREE.BoxGeometry(1.18, 1.18, 1.18);
    case 'cuboid':
      return new THREE.BoxGeometry(1.62, 1.02, 1.18);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.58, 0.58, 1.38, 48);
    case 'sphere':
      return new THREE.SphereGeometry(0.78, 42, 28);
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function orientShape(mesh: THREE.Mesh, shapeId: string) {
  if (shapeId === 'circle') mesh.rotation.x = Math.PI / 2;
  if (shapeId === 'triangle') mesh.position.z = -0.02;
}

function createShapeModel(shape: ShapeDefinition, scale = 1) {
  const group = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: hexToNumber(shape.color),
    emissive: hexToNumber(shape.color),
    emissiveIntensity: 0.24,
    roughness: 0.26,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(createDisplayGeometry(shape.id), baseMaterial);
  orientShape(mesh, shape.id);
  mesh.scale.setScalar(scale);
  group.add(mesh);
  if (shape.family === '3D') {
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34 }),
    );
    outline.scale.copy(mesh.scale);
    group.add(outline);
  }
  group.userData.mesh = mesh;
  return group;
}

function createMiniShape(shape: ShapeDefinition) {
  const model = createShapeModel(shape, shape.family === '2D' ? 0.38 : 0.32);
  return model;
}

function createObjectModel(kind: (typeof MATCH_ITEMS)[number]['shape']) {
  const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.08 });
  const group = new THREE.Group();
  switch (kind) {
    case 'disk': {
      const node = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 42), material(0xfbbf24));
      node.rotation.x = Math.PI / 2;
      group.add(node);
      break;
    }
    case 'book':
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.12), material(0x38bdf8)));
      break;
    case 'cube':
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), material(0xffffff)));
      break;
    case 'cuboid':
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.26), material(0xf59e0b)));
      break;
    case 'cylinder':
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 28), material(0x22c55e)));
      break;
    case 'sphere':
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 20), material(0xfb7185)));
      break;
  }
  return group;
}

function buttonMaterial(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.12,
  });
}

function addLabel(parent: THREE.Object3D, text: string, accent: string, scale = 0.24) {
  const label = makePanel(text, '', accent, 1.8, 0.42);
  label.scale.setScalar(scale);
  parent.add(label);
  return label;
}

function buildCardLesson(stageIndex: number, shapeIndex: number, compareIndex: number, challengeIndex: number) {
  const stage = STAGES[stageIndex];
  if (stageIndex === 1 || stageIndex === 2) {
    const shape = SHAPES[shapeIndex];
    return {
      title: `${stage.title}: ${shape.title}`,
      body: `${stage.focus} ${shape.identity} ${shape.facts} Examples: ${shape.examples}.`,
      accent: shape.color,
    };
  }
  if (stageIndex === 3) {
    const comparison = COMPARISONS[compareIndex];
    const left = SHAPES.find(shape => shape.id === comparison.left)!;
    const right = SHAPES.find(shape => shape.id === comparison.right)!;
    return {
      title: `${left.title} and ${right.title}`,
      body: `${comparison.note} Say one similarity, then one difference, to strengthen your comparison.`,
      accent: '#f97316',
    };
  }
  if (stageIndex === 4) {
    return {
      title: 'Real World Match',
      body: 'Study the object, think about its shape, then match it using the properties you learned earlier.',
      accent: '#34d399',
    };
  }
  if (stageIndex === 5) {
    return {
      title: 'Challenge Prompt',
      body: `${CHALLENGES[challengeIndex].prompt} Use sides, corners, faces, edges, and curved surfaces to decide.`,
      accent: '#fbbf24',
    };
  }
  if (stageIndex === 6) {
    return {
      title: 'Key Recap',
      body: FINAL_RECAP,
      accent: '#a78bfa',
    };
  }
  return {
    title: stage.title,
    body: `${stage.focus} ${stage.narration}`,
    accent: '#38bdf8',
  };
}

export default function GeometryMathsLabViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const audioRef = useRef<AudioState | null>(null);
  const stageChangeRef = useRef<(index: number) => void>(() => undefined);
  const toggleCardRef = useRef<(visible?: boolean) => void>(() => undefined);
  const cardHintRef = useRef<() => void>(() => undefined);
  const stageRef = useRef(0);
  const selectedShapeRef = useRef(0);
  const compareIndexRef = useRef(0);
  const challengeIndexRef = useRef(0);
  const cardVisibleRef = useRef(true);
  const mutedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [feedback, setFeedback] = useState('Choose a station to begin your geometry tour.');
  const [muted, setMuted] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);

  const selectedShape = SHAPES[selectedShapeIndex];
  const stage = STAGES[stageIndex];
  const currentComparison = COMPARISONS[compareIndex];
  const currentChallenge = CHALLENGES[challengeIndex];

  const ensureAudioReady = useCallback(async () => {
    if (!audioRef.current) audioRef.current = createAudioState();
    await audioRef.current?.context.resume().catch(() => undefined);
    return audioRef.current;
  }, []);

  const speak = useCallback((text: string, cueIndex = stageRef.current) => {
    if (mutedRef.current) return;
    void playSimulationNarration(`Teacher guidance. ${text}`, cueIndex);
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
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08111f);
    scene.fog = new THREE.Fog(0xdbeafe, 10, 24);
    const worldRoot = new THREE.Group();
    worldRoot.name = 'free-movable-geometry-maths-lab-world';
    scene.add(worldRoot);

    const camera = new THREE.PerspectiveCamera(72, mount.clientWidth / mount.clientHeight, 0.05, 70);
    const guidedCamera = createGuidedCamera(camera, renderer.domElement);
    guidedCamera.focusOn(
      { position: new THREE.Vector3(0, 1.64, 6.2), target: new THREE.Vector3(0, 1.56, -1.45) },
      { animate: false },
    );
    scene.add(camera);

    scene.add(new THREE.HemisphereLight(0xf8fafc, 0x0f172a, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fill.position.set(-4, 3, -2);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7.6, 96),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.86 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    worldRoot.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, roughness: 0.74 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.4, 0.12), wallMaterial);
    backWall.position.set(0, 1.7, -4.8);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 9.8), wallMaterial);
    leftWall.position.set(-5.05, 1.7, -0.1);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 9.8), wallMaterial);
    rightWall.position.set(5.05, 1.7, -0.1);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.08, 9.8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.62 }));
    ceiling.position.set(0, 3.38, -0.1);
    worldRoot.add(backWall, leftWall, rightWall, ceiling);

    for (let i = 0; i < 4; i += 1) {
      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.04, 0.34),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85 }),
      );
      lightPanel.position.set(-3.2 + i * 2.1, 3.28, -0.6);
      worldRoot.add(lightPanel);
    }

    const centerPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.26, 1.36, 0.34, 48),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x60a5fa, emissiveIntensity: 0.22, roughness: 0.26 }),
    );
    centerPlatform.position.set(0, 0.2, -1.4);
    centerPlatform.castShadow = true;
    worldRoot.add(centerPlatform);

    const displayRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.62, 0.035, 18, 96),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.34 }),
    );
    displayRing.rotation.x = Math.PI / 2;
    displayRing.position.set(0, 0.8, -1.4);
    worldRoot.add(displayRing);

    const stagePanel = makePanel(stage.title, stage.focus, '#38bdf8', 3.1, 1.26);
    stagePanel.position.set(0, 2.95, -1.85);
    worldRoot.add(stagePanel);

    const infoPanel = makePanel(selectedShape.title, `${selectedShape.facts} ${selectedShape.identity} Examples: ${selectedShape.examples}.`, selectedShape.color, 3.2, 1.46);
    infoPanel.position.set(-2.95, 2.1, -1.95);
    worldRoot.add(infoPanel);

    const centralDisplay = new THREE.Group();
    centralDisplay.position.set(0, 1.18, -1.4);
    worldRoot.add(centralDisplay);

    const comparePanel = makePanel('Compare Shapes', currentComparison.note, '#f97316', 2.8, 1.04);
    comparePanel.position.set(3.12, 2.55, -2.25);
    worldRoot.add(comparePanel);

    const targets: THREE.Object3D[] = [];

    const initialCard = buildCardLesson(stageRef.current, selectedShapeRef.current, compareIndexRef.current, challengeIndexRef.current);
    const lessonCardGroup = new THREE.Group();
    lessonCardGroup.name = 'geometry-vr-lesson-card-group';
    lessonCardGroup.position.set(-0.92, 0.18, -1.55);
    camera.add(lessonCardGroup);

    const lessonCardPanel = makePanel(initialCard.title, initialCard.body, initialCard.accent, 2.45, 1.18);
    lessonCardGroup.add(lessonCardPanel);

    const makeHudButton = (name: string, label: string, accent: string, position: [number, number, number], action: Record<string, unknown>) => {
      const button = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.11, 0.04), buttonMaterial(hexToNumber(accent)));
      button.name = name;
      button.position.set(...position);
      button.userData = { ...action };
      const labelMesh = makePanel(label, '', accent, 1.25, 0.28);
      labelMesh.scale.setScalar(0.16);
      labelMesh.position.set(0, 0, 0.024);
      button.add(labelMesh);
      lessonCardGroup.add(button);
      targets.push(button);
      return button;
    };

    makeHudButton('geometry-card-prev', 'Prev', '#7dd3fc', [-0.72, -0.8, 0], { type: 'card-prev' });
    makeHudButton('geometry-card-next', 'Next', '#7dd3fc', [-0.22, -0.8, 0], { type: 'card-next' });
    makeHudButton('geometry-card-hint', 'Hint', '#fbbf24', [0.28, -0.8, 0], { type: 'card-hint' });
    makeHudButton('geometry-card-close', 'Close', '#f97316', [0.78, -0.8, 0], { type: 'card-close' });

    const lessonCardOpen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.05, 28),
      buttonMaterial(0x38bdf8),
    );
    lessonCardOpen.name = 'geometry-card-open';
    lessonCardOpen.position.set(-1.18, -0.62, -1.25);
    lessonCardOpen.userData = { type: 'card-open' };
    camera.add(lessonCardOpen);
    const lessonCardOpenLabel = makePanel('Open Card', '', '#7dd3fc', 1.4, 0.28);
    lessonCardOpenLabel.scale.setScalar(0.15);
    lessonCardOpenLabel.position.set(0, 0.22, 0.03);
    lessonCardOpen.add(lessonCardOpenLabel);
    targets.push(lessonCardOpen);

    const compareLeftGroup = new THREE.Group();
    compareLeftGroup.position.set(2.2, 1.15, -2.35);
    worldRoot.add(compareLeftGroup);
    const compareRightGroup = new THREE.Group();
    compareRightGroup.position.set(4.0, 1.15, -2.35);
    worldRoot.add(compareRightGroup);

    const stationAnchors = {
      stageButtons: new THREE.Group(),
      shapeButtons: new THREE.Group(),
      compareButtons: new THREE.Group(),
      matchButtons: new THREE.Group(),
      challengeButtons: new THREE.Group(),
      geometryCorner: new THREE.Group(),
    };
    Object.values(stationAnchors).forEach(group => worldRoot.add(group));

    stationAnchors.stageButtons.position.set(-4.1, 1.25, -2.05);
    stationAnchors.shapeButtons.position.set(0, 0, 0);
    stationAnchors.compareButtons.position.set(2.95, 0.95, -0.45);
    stationAnchors.matchButtons.position.set(3.15, 0.96, 1.25);
    stationAnchors.challengeButtons.position.set(-3.45, 0.96, 1.25);
    stationAnchors.geometryCorner.position.set(-3.7, 0.92, -0.45);

    const makeButton = (name: string, label: string, color: string, position: [number, number, number], parent: THREE.Object3D, action: Record<string, unknown>) => {
      const button = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.16, 0.06), buttonMaterial(hexToNumber(color)));
      button.name = name;
      button.position.set(...position);
      button.userData = { ...action };
      const labelMesh = makePanel(label, '', color, 1.6, 0.32);
      labelMesh.scale.setScalar(0.24);
      labelMesh.position.set(0, 0, 0.034);
      button.add(labelMesh);
      parent.add(button);
      targets.push(button);
      return button;
    };

    STAGES.forEach((item, index) => {
      makeButton(`geometry-stage-${index}`, item.label, '#38bdf8', [0, 1.3 - index * 0.25, 0], stationAnchors.stageButtons, { stageIndex: index, type: 'stage' });
    });

    SHAPES.forEach((shape, index) => {
      const row = index < 4 ? 0 : 1;
      const col = index % 4;
      makeButton(`geometry-shape-${shape.id}`, shape.title, shape.color, [-2.1 + col * 1.42, 0.98 - row * 0.32, 0.55], stationAnchors.shapeButtons, { shapeIndex: index, type: 'shape' });
      const mini = createMiniShape(shape);
      mini.position.set(-2.1 + col * 1.42, 1.42 - row * 0.32, 0.56);
      stationAnchors.shapeButtons.add(mini);
    });

    COMPARISONS.forEach((comparison, index) => {
      makeButton(`geometry-compare-${comparison.id}`, `Pair ${index + 1}`, '#f97316', [-0.66 + index * 0.46, 0, 0], stationAnchors.compareButtons, { compareIndex: index, type: 'compare' });
    });

    MATCH_ITEMS.forEach((item, index) => {
      const objectNode = createObjectModel(item.shape);
      objectNode.position.set(-1.15 + (index % 3) * 1.15, 0.3, Math.floor(index / 3) * 1.05);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 32), buttonMaterial(0x0f766e));
      base.position.copy(objectNode.position).add(new THREE.Vector3(0, -0.28, 0));
      base.name = `geometry-match-${item.id}`;
      base.userData = { matchId: item.id, type: 'match' };
      const label = makePanel(item.label, '', '#6ee7b7', 1.5, 0.32);
      label.scale.setScalar(0.22);
      label.position.set(objectNode.position.x, 0.82, objectNode.position.z);
      stationAnchors.matchButtons.add(objectNode, base, label);
      targets.push(base);
    });

    const challengeAnswerIndices = [0, 1, 4, 7];
    challengeAnswerIndices.forEach((shapeIndex, index) => {
      const answerShape = SHAPES[shapeIndex];
      const button = makeButton(`geometry-answer-${answerShape.id}`, answerShape.title, answerShape.color, [-0.7 + (index % 2) * 1.5, 0, Math.floor(index / 2) * 0.6], stationAnchors.challengeButtons, { answerShapeId: answerShape.id, type: 'answer' });
      const model = createMiniShape(answerShape);
      model.position.copy(button.position).add(new THREE.Vector3(0, 0.54, 0));
      stationAnchors.challengeButtons.add(model);
    });

    const cornerTitle = makePanel('Geometry Around Us', 'Real objects show why shape names matter in daily life.', '#a78bfa', 2.5, 0.9);
    cornerTitle.position.set(0, 1.58, 0);
    stationAnchors.geometryCorner.add(cornerTitle);
    const cornerObjects = [
      { title: 'Clock', color: 0xfbbf24, geometry: new THREE.CylinderGeometry(0.22, 0.22, 0.05, 28), pos: [-0.95, 0.18, 0.08] },
      { title: 'Book', color: 0x38bdf8, geometry: new THREE.BoxGeometry(0.38, 0.24, 0.08), pos: [-0.25, 0.18, 0] },
      { title: 'Ball', color: 0xfb7185, geometry: new THREE.SphereGeometry(0.18, 22, 18), pos: [0.45, 0.18, 0] },
      { title: 'Can', color: 0x22c55e, geometry: new THREE.CylinderGeometry(0.14, 0.14, 0.38, 20), pos: [1.05, 0.24, 0.04] },
    ];
    cornerObjects.forEach(item => {
      const mesh = new THREE.Mesh(item.geometry, new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.3, metalness: 0.08 }));
      mesh.position.set(item.pos[0], item.pos[1], item.pos[2]);
      stationAnchors.geometryCorner.add(mesh);
    });

    const refreshLessonCard = (showHint = false) => {
      const lesson = showHint
        ? {
            title: `${STAGES[stageRef.current].title} Hint`,
            body: STAGE_HINTS[stageRef.current],
            accent: '#fbbf24',
          }
        : buildCardLesson(stageRef.current, selectedShapeRef.current, compareIndexRef.current, challengeIndexRef.current);
      lessonCardPanel.material.map?.dispose();
      lessonCardPanel.material.map = makeTextTexture(lesson.title, lesson.body, lesson.accent, 900, 360);
      (lessonCardPanel.material as THREE.MeshBasicMaterial).needsUpdate = true;
    };

    const toggleCard = (visible = !cardVisibleRef.current) => {
      cardVisibleRef.current = visible;
      lessonCardGroup.visible = visible;
      lessonCardOpen.visible = !visible;
      setCardVisible(visible);
      if (visible) refreshLessonCard(false);
    };
    toggleCardRef.current = toggleCard;
    cardHintRef.current = () => {
      toggleCard(true);
      refreshLessonCard(true);
      setFeedback(STAGE_HINTS[stageRef.current]);
      speak(STAGE_HINTS[stageRef.current], 140 + stageRef.current);
    };

    const setStageState = (nextStageIndex: number) => {
      const nextStage = STAGES[nextStageIndex];
      stageRef.current = nextStageIndex;
      setStageIndex(nextStageIndex);
      toggleCard(true);
      stagePanel.material.map?.dispose();
      stagePanel.material.map = makeTextTexture(nextStage.title, nextStage.focus, '#38bdf8');
      (stagePanel.material as THREE.MeshBasicMaterial).needsUpdate = true;
      stationAnchors.compareButtons.visible = nextStageIndex >= 3;
      compareLeftGroup.visible = nextStageIndex >= 3;
      compareRightGroup.visible = nextStageIndex >= 3;
      comparePanel.visible = nextStageIndex >= 3;
      stationAnchors.matchButtons.visible = nextStageIndex >= 4;
      stationAnchors.challengeButtons.visible = nextStageIndex >= 5;
      stationAnchors.geometryCorner.visible = nextStageIndex >= 4;
      refreshLessonCard(false);
      setFeedback(nextStage.focus);
      const narration = nextStageIndex === STAGES.length - 1
        ? `${nextStage.narration} ${FINAL_RECAP}`
        : `${nextStage.narration} ${nextStage.focus}`;
      speak(narration, nextStageIndex);
    };
    stageChangeRef.current = setStageState;

    const setShapeSelection = (shapeIndex: number) => {
      const shape = SHAPES[shapeIndex];
      selectedShapeRef.current = shapeIndex;
      setSelectedShapeIndex(shapeIndex);
      centralDisplay.clear();
      const model = createShapeModel(shape, shape.family === '2D' ? 1.15 : 0.95);
      centralDisplay.add(model);
      infoPanel.material.map?.dispose();
      infoPanel.material.map = makeTextTexture(
        `${shape.title} (${shape.family})`,
        `${shape.facts} ${shape.identity} Real examples: ${shape.examples}. ${shape.compareHint}`,
        shape.color,
      );
      (infoPanel.material as THREE.MeshBasicMaterial).needsUpdate = true;
      refreshLessonCard(false);
      setFeedback(`${shape.title}: ${shape.facts}`);
      playTone(audioRef.current, 420 + shapeIndex * 35, 0.12, shape.family === '2D' ? 'triangle' : 'sine');
      speak(`${shape.title}. ${shape.identity} ${shape.facts} Real examples include ${shape.examples}.`, 20 + shapeIndex);
    };

    const setComparison = (nextIndex: number) => {
      const comparison = COMPARISONS[nextIndex];
      compareIndexRef.current = nextIndex;
      setCompareIndex(nextIndex);
      compareLeftGroup.clear();
      compareRightGroup.clear();
      const leftShape = SHAPES.find(item => item.id === comparison.left)!;
      const rightShape = SHAPES.find(item => item.id === comparison.right)!;
      compareLeftGroup.add(createShapeModel(leftShape, leftShape.family === '2D' ? 0.66 : 0.54));
      compareRightGroup.add(createShapeModel(rightShape, rightShape.family === '2D' ? 0.66 : 0.54));
      comparePanel.material.map?.dispose();
      comparePanel.material.map = makeTextTexture('Compare Shapes', comparison.note, '#f97316');
      (comparePanel.material as THREE.MeshBasicMaterial).needsUpdate = true;
      refreshLessonCard(false);
      setFeedback(comparison.note);
      speak(`Compare ${leftShape.title} and ${rightShape.title}. ${comparison.note}`, 50 + nextIndex);
    };

    const handleMatch = (matchId: string) => {
      const item = MATCH_ITEMS.find(entry => entry.id === matchId);
      if (!item) return;
      const answerShape = SHAPES.find(shape => shape.id === item.answer)!;
      setFeedback(`${item.label} matches ${answerShape.title}. ${answerShape.compareHint}`);
      refreshLessonCard(false);
      playTone(audioRef.current, 620, 0.12, 'square');
      speak(`${item.label} matches ${answerShape.title}. ${answerShape.identity}`, 70 + MATCH_ITEMS.findIndex(entry => entry.id === matchId));
    };

    const handleChallengeAnswer = (shapeId: string) => {
      const activeChallenge = CHALLENGES[challengeIndexRef.current];
      const correct = activeChallenge.answer === shapeId;
      const chosen = SHAPES.find(shape => shape.id === shapeId)!;
      if (correct) {
        setFeedback(`Correct. ${chosen.title} is the right answer.`);
        playTone(audioRef.current, 760, 0.16, 'triangle');
        speak(`Correct. ${activeChallenge.prompt} The answer is ${chosen.title}.`, 90 + challengeIndexRef.current);
        const next = (challengeIndexRef.current + 1) % CHALLENGES.length;
        challengeIndexRef.current = next;
        setChallengeIndex(next);
        refreshLessonCard(false);
      } else {
        setFeedback(`Try again. ${chosen.title} does not match this clue.`);
        playTone(audioRef.current, 240, 0.16, 'sawtooth');
        speak(`Try again. ${activeChallenge.prompt}`, 96 + challengeIndexRef.current);
      }
    };

    setShapeSelection(0);
    setComparison(0);
    setStageState(0);

    const controller0 = renderer.xr.getController(0);
    const controller1 = renderer.xr.getController(1);
    const ray = () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -4)]),
        new THREE.LineBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.84 }),
      );
    controller0.add(ray());
    controller1.add(ray());
    scene.add(controller0, controller1);

    const interactionSystem = createInteractionSystem({
      camera,
      domElement: renderer.domElement,
      xrControllers: [controller0, controller1],
      onSelect: (id, object) => {
        const data = object.userData as Record<string, unknown>;
        switch (data.type) {
          case 'stage':
            setStageState(data.stageIndex as number);
            break;
          case 'shape':
            setShapeSelection(data.shapeIndex as number);
            break;
          case 'compare':
            setComparison(data.compareIndex as number);
            break;
          case 'match':
            handleMatch(data.matchId as string);
            break;
          case 'answer':
            handleChallengeAnswer(data.answerShapeId as string);
            break;
          case 'card-prev':
            setStageState(Math.max(0, stageRef.current - 1));
            break;
          case 'card-next':
            setStageState(Math.min(STAGES.length - 1, stageRef.current + 1));
            break;
          case 'card-hint':
            cardHintRef.current();
            break;
          case 'card-close':
            toggleCardRef.current(false);
            break;
          case 'card-open':
            toggleCardRef.current(true);
            break;
        }
        interactionSystem.setSelected(id);
      },
    });

    targets.forEach(target => interactionSystem.register(target.name, target, { highlightColor: '#f8fafc' }));

    const moveDirection = new THREE.Vector3();
    const strafeDirection = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const backLatches = [false, false];
    let narrationRetryId: number | null = null;
    const clock = new THREE.Clock();
    renderer.xr.addEventListener('sessionstart', () => {
      void ensureAudioReady().then(audio => {
        playTone(audio, 430, 0.12, 'triangle');
        stopSimulationNarration();
        if (narrationRetryId !== null) window.clearTimeout(narrationRetryId);
        narrationRetryId = window.setTimeout(() => {
          speak(`${STAGES[stageRef.current].narration} ${STAGES[stageRef.current].focus}`, stageRef.current);
        }, 280);
      });
    });

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.033);
      const elapsed = clock.elapsedTime;
      if (!renderer.xr.isPresenting) {
        guidedCamera.update(dt);
      } else {
        const session = renderer.xr.getSession();
        session?.inputSources.forEach((source, index) => {
          const gamepad = source.gamepad;
          if (!gamepad) return;
          const axisX = gamepad.axes[2] ?? gamepad.axes[0] ?? 0;
          const axisY = gamepad.axes[3] ?? gamepad.axes[1] ?? 0;
          if (source.handedness === 'right' && Math.abs(axisX) > 0.16) {
            worldRoot.rotation.y -= axisX * dt * 1.35;
          }
          if (source.handedness === 'left') {
            camera.getWorldDirection(moveDirection);
            moveDirection.y = 0;
            moveDirection.normalize();
            strafeDirection.crossVectors(moveDirection, worldUp).normalize();
            if (Math.abs(axisY) > 0.16) worldRoot.position.addScaledVector(moveDirection, axisY * dt * 1.18);
            if (Math.abs(axisX) > 0.16) worldRoot.position.addScaledVector(strafeDirection, axisX * dt * 1.18);
          }
          const back = updateButtonLatch(isQuestBackPressed(gamepad.buttons, source.handedness), backLatches[index]);
          backLatches[index] = back.latched;
          if (back.pressed) {
            if (stageRef.current > 0) setStageState(stageRef.current - 1);
            else void session?.end();
          }
        });
      }
      displayRing.rotation.z = elapsed * 0.22;
      const centralMesh = centralDisplay.children[0] as THREE.Group | undefined;
      centralMesh?.rotation && (centralMesh.rotation.y += dt * 0.55);
      compareLeftGroup.rotation.y += dt * 0.25;
      compareRightGroup.rotation.y -= dt * 0.22;
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
      if (narrationRetryId !== null) window.clearTimeout(narrationRetryId);
      interactionSystem.dispose();
      guidedCamera.dispose();
      audioRef.current?.oscillators.forEach(oscillator => oscillator.stop());
      audioRef.current?.context.close().catch(() => undefined);
      audioRef.current = null;
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
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      stopSimulationNarration();
    };
  }, [ensureAudioReady, speak]);

  const beginLab = useCallback(async () => {
    setStarted(true);
    const audio = await ensureAudioReady();
    playTone(audio, 390, 0.1, 'triangle');
    speak(STAGES[0].narration, 0);
  }, [ensureAudioReady, speak]);

  const enterVR = useCallback(async () => {
    if (!rendererRef.current) return;
    setStarted(true);
    const audio = await ensureAudioReady();
    playTone(audio, 460, 0.12, 'triangle');
    try {
      const session = await navigator.xr?.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['bounded-floor', 'hand-tracking'],
      });
      if (session) await rendererRef.current.xr.setSession(session);
    } catch {
      speak('VR could not start, so the browser geometry lab is ready.', 0);
    }
    speak(STAGES[stageIndex].narration, stageIndex);
  }, [ensureAudioReady, speak, stageIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#08111f', color: '#f8fafc', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!started && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 50% 30%, rgba(56,189,248,.22), rgba(8,17,31,.96) 72%)', textAlign: 'center' }}>
          <section style={{ width: 'min(860px, 100%)' }}>
            <div style={{ color: '#7dd3fc', fontWeight: 900, letterSpacing: '.14em', fontSize: 13 }}>CLASS 6 MATHEMATICS - IMMERSIVE GEOMETRY LAB</div>
            <h1 style={{ margin: '14px 0 12px', fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 0.96 }}>Geometry Maths Lab</h1>
            <p style={{ margin: '0 auto 22px', maxWidth: 720, color: '#dbeafe', fontSize: 18, lineHeight: 1.6 }}>
              Explore 8 important shapes in a polished virtual maths lab. Learn their identities, compare them, match them to real objects, and solve geometry challenges.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={beginLab} style={primaryButtonStyle}>Start Lab</button>
              {vrSupported && <button type="button" onClick={enterVR} style={secondaryButtonStyle}>Enter VR</button>}
            </div>
          </section>
        </div>
      )}
      {started && (
        <>
          <header style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 8, display: 'flex', justifyContent: 'space-between', gap: 12, pointerEvents: 'none' }}>
            <div style={panelStyle}><strong>{stage.title}</strong><span style={{ color: '#7dd3fc', marginLeft: 10 }}>{selectedShape.title}</span></div>
            <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
              <button type="button" onClick={() => setMuted(value => { if (!value) stopSimulationNarration(); return !value; })} style={utilityButtonStyle}>{muted ? 'Voice off' : 'Voice on'}</button>
              <button type="button" onClick={() => toggleCardRef.current(!cardVisible)} style={utilityButtonStyle}>{cardVisible ? 'Hide card' : 'Show card'}</button>
              <button type="button" onClick={() => cardHintRef.current()} style={utilityButtonStyle}>Hint</button>
              <button type="button" onClick={() => stageChangeRef.current(Math.max(0, stageIndex - 1))} style={utilityButtonStyle}>Back</button>
              <button type="button" onClick={() => stageChangeRef.current(Math.min(STAGES.length - 1, stageIndex + 1))} style={utilityButtonStyle}>Next</button>
            </div>
          </header>
          <footer style={{ position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 8, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', pointerEvents: 'none' }}>
            <div style={{ ...panelStyle, maxWidth: 700 }}>
              <strong style={{ display: 'block', marginBottom: 6 }}>Teacher Note</strong>
              <div style={{ color: '#dbeafe', lineHeight: 1.5, fontSize: 14 }}>{feedback}</div>
            </div>
            <div style={{ ...panelStyle, minWidth: 210 }}>
              <strong style={{ display: 'block', marginBottom: 6 }}>Challenge</strong>
              <div style={{ color: '#dbeafe', lineHeight: 1.5, fontSize: 14 }}>{currentChallenge.prompt}</div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid #7dd3fc',
  background: 'linear-gradient(135deg,#0284c7,#6366f1,#14b8a6)',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid rgba(191,219,254,.5)',
  background: 'rgba(255,255,255,.1)',
  color: '#dbeafe',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const panelStyle = {
  padding: '10px 14px',
  borderRadius: 13,
  background: 'rgba(2,6,23,.84)',
  border: '1px solid rgba(125,211,252,.26)',
  color: '#f8fafc',
  backdropFilter: 'blur(12px)',
} as const;

const utilityButtonStyle = {
  padding: '9px 11px',
  borderRadius: 10,
  border: '1px solid rgba(191,219,254,.28)',
  background: 'rgba(2,6,23,.82)',
  color: '#dbeafe',
  fontWeight: 800,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
} as const;
