"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type Outcome = "float" | "sink";
type Shape =
  | "block"
  | "bottle"
  | "coin"
  | "stone"
  | "ball"
  | "apple"
  | "spoon"
  | "nail";

interface ObjectSpec {
  key: string;
  label: string;
  outcome: Outcome;
  shape: Shape;
  color: number;
  challenge?: boolean;
}

interface SimBody {
  group: THREE.Group;
  spec: ObjectSpec;
  home: THREE.Vector3;
  velocity: number;
  mode: "ready" | "falling" | "floating" | "sinking" | "settled" | "grabbed";
  reported: boolean;
  bobSeed: number;
}

const OBJECTS: ObjectSpec[] = [
  {
    key: "wood-block",
    label: "Wooden block",
    outcome: "float",
    shape: "block",
    color: 0xb7793f,
  },
  {
    key: "plastic-bottle",
    label: "Empty sealed bottle",
    outcome: "float",
    shape: "bottle",
    color: 0x7dd3fc,
  },
  {
    key: "metal-coin",
    label: "Metal coin",
    outcome: "sink",
    shape: "coin",
    color: 0xfacc15,
  },
  {
    key: "stone",
    label: "Stone",
    outcome: "sink",
    shape: "stone",
    color: 0x78716c,
  },
  {
    key: "rubber-ball",
    label: "Rubber ball",
    outcome: "float",
    shape: "ball",
    color: 0xf97316,
  },
  {
    key: "apple",
    label: "Apple",
    outcome: "float",
    shape: "apple",
    color: 0xef4444,
  },
];

const CHALLENGE_OBJECTS: ObjectSpec[] = [
  {
    key: "wooden-spoon",
    label: "Wooden spoon",
    outcome: "float",
    shape: "spoon",
    color: 0xc08457,
    challenge: true,
  },
  {
    key: "iron-nail",
    label: "Iron nail",
    outcome: "sink",
    shape: "nail",
    color: 0x94a3b8,
    challenge: true,
  },
  {
    key: "challenge-bottle",
    label: "Empty sealed bottle",
    outcome: "float",
    shape: "bottle",
    color: 0x67e8f9,
    challenge: true,
  },
];

const STAGES = [
  {
    title: "Meet the mystery objects",
    cue: "Inspect all six objects. Predict whether each will float or sink.",
    detail:
      "Size alone does not decide the answer. Make a prediction before testing.",
  },
  {
    title: "The big water experiment",
    cue: "Select an object, then drop it into the transparent tank.",
    detail: "Watch the water surface and follow the object until it settles.",
  },
  {
    title: "Discover the density secret",
    cue: "Compare the wooden block and metal coin. Which has greater average density?",
    detail:
      "Objects less dense than water generally float. Objects more dense than water sink.",
  },
  {
    title: "Scientist challenge",
    cue: "Sort the spoon, nail, and sealed bottle into FLOATS or SINKS.",
    detail:
      "In VR, point with the left controller for FLOATS and the right controller for SINKS.",
  },
  {
    title: "Mission completed",
    cue: "You tested evidence, corrected predictions, and explained the result with density.",
    detail: "You earned the Junior Water Scientist badge!",
  },
];

const NARRATIONS = [
  "Welcome, Young Scientist. Professor Aqua needs your help. Inspect each mystery object and predict whether it will float or sink.",
  "Now test your ideas. Select an object and gently drop it into the transparent tank. Watch closely until it settles.",
  "Here is the secret. Objects with lower average density than water generally float. Objects with greater density than water sink. A large wooden block can float while a tiny metal coin sinks.",
  "Final challenge. Sort the wooden spoon, iron nail, and empty sealed bottle. Decide using density, not size.",
  "Congratulations. You solved the mystery of the magical lake and earned the Junior Water Scientist badge.",
];

const TANK_CENTER = new THREE.Vector3(0, 0.98, -1.25);
const WATER_Y = 1.38;
const TANK_BOTTOM_Y = 0.43;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.08;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => voice.lang.startsWith("en-IN")) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;
  window.speechSynthesis.speak(utterance);
}

function roundedLabel(text: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite();
  ctx.fillStyle = "rgba(3, 15, 28, 0.88)";
  ctx.roundRect(4, 4, 504, 120, 24);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 40px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  sprite.scale.set(0.72, 0.18, 1);
  return sprite;
}

function addInteractivePart(
  group: THREE.Group,
  mesh: THREE.Object3D,
  key: string,
) {
  mesh.userData.objectKey = key;
  group.add(mesh);
}

function createObject(spec: ObjectSpec): THREE.Group {
  const group = new THREE.Group();
  group.userData.objectKey = spec.key;
  const material = new THREE.MeshStandardMaterial({
    color: spec.color,
    roughness: 0.55,
    metalness: spec.shape === "coin" || spec.shape === "nail" ? 0.72 : 0.04,
  });

  if (spec.shape === "block") {
    addInteractivePart(
      group,
      new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.26), material),
      spec.key,
    );
  } else if (spec.shape === "bottle") {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.38, 14),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.62,
        roughness: 0.18,
      }),
    );
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.07, 0.1, 12),
      material,
    );
    neck.position.y = 0.24;
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.045, 12),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 }),
    );
    cap.position.y = 0.31;
    addInteractivePart(group, body, spec.key);
    addInteractivePart(group, neck, spec.key);
    addInteractivePart(group, cap, spec.key);
  } else if (spec.shape === "coin") {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.035, 24),
      material,
    );
    coin.rotation.x = Math.PI / 2;
    addInteractivePart(group, coin, spec.key);
  } else if (spec.shape === "stone") {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.16, 0),
      material,
    );
    stone.scale.set(1.2, 0.8, 1);
    addInteractivePart(group, stone, spec.key);
  } else if (spec.shape === "ball") {
    addInteractivePart(
      group,
      new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), material),
      spec.key,
    );
  } else if (spec.shape === "apple") {
    const apple = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 14),
      material,
    );
    apple.scale.y = 0.9;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x713f12 }),
    );
    stem.position.y = 0.18;
    stem.rotation.z = -0.18;
    addInteractivePart(group, apple, spec.key);
    addInteractivePart(group, stem, spec.key);
  } else if (spec.shape === "spoon") {
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.42, 0.035),
      material,
    );
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      material,
    );
    bowl.scale.set(0.75, 1.05, 0.32);
    bowl.position.y = 0.25;
    addInteractivePart(group, handle, spec.key);
    addInteractivePart(group, bowl, spec.key);
  } else {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.018, 0.42, 10),
      material,
    );
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.035, 12),
      material,
    );
    head.position.y = 0.22;
    addInteractivePart(group, shaft, spec.key);
    addInteractivePart(group, head, spec.key);
  }

  const label = roundedLabel(
    spec.label,
    spec.challenge ? "#c084fc" : "#38bdf8",
  );
  label.position.y = 0.42;
  group.add(label);
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

function drawStageCard(
  canvas: HTMLCanvasElement,
  stage: number,
  score: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const info = STAGES[stage];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#052536";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "700 28px sans-serif";
  ctx.fillText(`PROFESSOR AQUA  •  ${stage + 1}/5`, 34, 48);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 42px sans-serif";
  ctx.fillText(info.title, 34, 104);
  ctx.fillStyle = "#dbeafe";
  ctx.font = "28px sans-serif";
  const words = info.cue.split(" ");
  let line = "";
  let y = 150;
  for (const word of words) {
    const next = `${line}${word} `;
    if (ctx.measureText(next).width > canvas.width - 70 && line) {
      ctx.fillText(line.trim(), 34, y);
      line = `${word} `;
      y += 36;
    } else line = next;
  }
  ctx.fillText(line.trim(), 34, y);
  ctx.fillStyle = "#fde68a";
  ctx.font = "700 25px sans-serif";
  ctx.fillText(`Stars: ${score}  ★`, canvas.width - 190, 48);
}

export default function WaterFloatSinkViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodiesRef = useRef(new Map<string, SimBody>());
  const stageRef = useRef(0);
  const predictionsRef = useRef<Record<string, Outcome>>({});
  const testedRef = useRef<Record<string, boolean>>({});
  const challengeAnswersRef = useRef<Record<string, Outcome>>({});
  const scoreRef = useRef(0);
  const stageVisualRef = useRef<(stage: number) => void>(() => undefined);
  const dropRef = useRef<(key: string) => void>(() => undefined);
  const classifyRef = useRef<(key: string, outcome: Outcome) => void>(
    () => undefined,
  );
  const settleRef = useRef<(key: string) => void>(() => undefined);
  const selectRef = useRef<(key: string) => void>(() => undefined);

  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState(OBJECTS[0].key);
  const [predictions, setPredictions] = useState<Record<string, Outcome>>({});
  const [tested, setTested] = useState<Record<string, boolean>>({});
  const [challengeAnswers, setChallengeAnswers] = useState<
    Record<string, Outcome>
  >({});
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState(
    "Make a prediction for every object.",
  );

  useEffect(() => {
    const xr = (
      navigator as Navigator & {
        xr?: { isSessionSupported(mode: string): Promise<boolean> };
      }
    ).xr;
    xr?.isSessionSupported("immersive-vr")
      .then(setVrSupported)
      .catch(() => setVrSupported(false));
  }, []);

  useEffect(() => {
    predictionsRef.current = predictions;
  }, [predictions]);
  useEffect(() => {
    scoreRef.current = stars;
  }, [stars]);

  const goToStage = useCallback((next: number) => {
    stageRef.current = next;
    setStage(next);
    setFeedback(STAGES[next].cue);
    stageVisualRef.current(next);
    speak(NARRATIONS[next]);
  }, []);

  selectRef.current = (key) => setSelected(key);
  settleRef.current = (key) => {
    const spec = OBJECTS.find((item) => item.key === key);
    if (!spec || testedRef.current[key]) return;
    const next = { ...testedRef.current, [key]: true };
    testedRef.current = next;
    setTested(next);
    const correct = predictionsRef.current[key] === spec.outcome;
    if (correct) {
      setStars((value) => value + 1);
      setFeedback(
        `Correct prediction! The ${spec.label.toLowerCase()} ${spec.outcome}s.`,
      );
    } else {
      setFeedback(
        `Evidence changed our idea: the ${spec.label.toLowerCase()} ${spec.outcome}s.`,
      );
    }
    if (Object.keys(next).length === OBJECTS.length) {
      window.setTimeout(() => goToStage(2), 1400);
    }
  };

  classifyRef.current = (key, outcome) => {
    const spec = CHALLENGE_OBJECTS.find((item) => item.key === key);
    if (!spec || challengeAnswersRef.current[key]) return;
    const next = { ...challengeAnswersRef.current, [key]: outcome };
    challengeAnswersRef.current = next;
    setChallengeAnswers(next);
    if (outcome === spec.outcome) {
      setStars((value) => value + 1);
      setFeedback(
        `Excellent! ${spec.label} belongs in ${outcome.toUpperCase()}.`,
      );
    } else {
      setFeedback(`Try the evidence: ${spec.label} will ${spec.outcome}.`);
    }
    if (Object.keys(next).length === CHALLENGE_OBJECTS.length) {
      window.setTimeout(() => goToStage(4), 1200);
    }
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const bodies = bodiesRef.current;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.tabIndex = -1;
    renderer.xr.setReferenceSpaceType("local-floor");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87cfee);
    scene.fog = new THREE.Fog(0xb8e4ef, 10, 28);

    const camera = new THREE.PerspectiveCamera(
      62,
      mount.clientWidth / mount.clientHeight,
      0.05,
      40,
    );
    camera.position.set(0, 1.65, 2.7);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.05, -1.25);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.48;

    scene.add(new THREE.HemisphereLight(0xe0f7ff, 0x395b35, 2.2));
    const sun = new THREE.DirectionalLight(0xfff5d6, 2.5);
    sun.position.set(-4, 7, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(16, 48),
      new THREE.MeshStandardMaterial({ color: 0x4f8b4c, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Magical lake and mountain backdrop establish the chapter story without moving the learner.
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(5.3, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x1597c4,
        transparent: true,
        opacity: 0.74,
        roughness: 0.12,
        transmission: 0.12,
      }),
    );
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0, 0.018, -7.5);
    scene.add(lake);
    [-6, -3, 0, 3, 6].forEach((x, index) => {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(2.6, 4 + (index % 2), 5),
        new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x3f6b58 : 0x52785a,
          roughness: 1,
        }),
      );
      mountain.position.set(x, 1.8, -14 - Math.abs(x) * 0.15);
      scene.add(mountain);
    });

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.35, 0.16, 40),
      new THREE.MeshStandardMaterial({ color: 0xd8c39a, roughness: 0.9 }),
    );
    platform.position.y = 0.08;
    platform.receiveShadow = true;
    scene.add(platform);

    // Transparent tank: water and all objects remain visible from a stationary viewpoint.
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xb9edff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
      transmission: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const tank = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.25, 1.25), glass);
    tank.position.copy(TANK_CENTER);
    scene.add(tank);
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(2.03, 0.9, 1.13),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.34,
        roughness: 0.15,
        transmission: 0.25,
        depthWrite: false,
      }),
    );
    water.position.set(TANK_CENTER.x, 0.93, TANK_CENTER.z);
    scene.add(water);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f4c5c,
      metalness: 0.65,
      roughness: 0.25,
    });
    [
      [-1.08, 0],
      [1.08, 0],
    ].forEach(([x]) => {
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.28, 1.29),
        rimMaterial,
      );
      rim.position.set(x, TANK_CENTER.y, TANK_CENTER.z);
      scene.add(rim);
    });
    const topRim = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.045, 1.3),
      rimMaterial,
    );
    topRim.position.set(0, 1.61, TANK_CENTER.z);
    scene.add(topRim);

    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.09, 28),
      new THREE.MeshBasicMaterial({
        color: 0xe0f7ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(0, WATER_Y + 0.012, TANK_CENTER.z);
    scene.add(ripple);
    let rippleAge = 2;

    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.82,
    });
    const leftTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 0.12, 1.05),
      tableMaterial,
    );
    leftTable.position.set(-2.15, 0.76, -1.18);
    leftTable.castShadow = true;
    leftTable.receiveShadow = true;
    scene.add(leftTable);
    const rightTable = leftTable.clone();
    rightTable.position.x = 2.15;
    scene.add(rightTable);

    const homePositions = [
      new THREE.Vector3(-2.72, 1.02, -0.95),
      new THREE.Vector3(-2.12, 1.08, -0.95),
      new THREE.Vector3(-1.53, 0.96, -0.95),
      new THREE.Vector3(1.53, 0.98, -0.95),
      new THREE.Vector3(2.12, 1.02, -0.95),
      new THREE.Vector3(2.72, 1.02, -0.95),
    ];
    const challengeHomes = [
      new THREE.Vector3(-0.72, 0.9, -0.25),
      new THREE.Vector3(0, 0.9, -0.2),
      new THREE.Vector3(0.72, 0.98, -0.25),
    ];

    [...OBJECTS, ...CHALLENGE_OBJECTS].forEach((spec, index) => {
      const group = createObject(spec);
      const home = (
        spec.challenge
          ? challengeHomes[index - OBJECTS.length]
          : homePositions[index]
      ).clone();
      group.position.copy(home);
      group.visible = !spec.challenge;
      scene.add(group);
      bodies.set(spec.key, {
        group,
        spec,
        home,
        velocity: 0,
        mode: "ready",
        reported: false,
        bobSeed: index * 1.7,
      });
    });

    const floatBasket = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.42, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        transparent: true,
        opacity: 0.62,
      }),
    );
    floatBasket.position.set(-1.2, 0.38, -0.2);
    floatBasket.visible = false;
    scene.add(floatBasket);
    const sinkBasket = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.42, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0.62,
      }),
    );
    sinkBasket.position.set(1.2, 0.38, -0.2);
    sinkBasket.visible = false;
    scene.add(sinkBasket);
    const floatLabel = roundedLabel("FLOATS", "#4ade80");
    floatLabel.position.set(-1.2, 0.82, -0.2);
    floatLabel.visible = false;
    scene.add(floatLabel);
    const sinkLabel = roundedLabel("SINKS", "#f87171");
    sinkLabel.position.set(1.2, 0.82, -0.2);
    sinkLabel.visible = false;
    scene.add(sinkLabel);

    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = 1024;
    cardCanvas.height = 300;
    drawStageCard(cardCanvas, 0, 0);
    const cardTexture = new THREE.CanvasTexture(cardCanvas);
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 0.97),
      new THREE.MeshBasicMaterial({ map: cardTexture, side: THREE.DoubleSide }),
    );
    card.position.set(0, 2.38, -2.38);
    scene.add(card);

    stageVisualRef.current = (next) => {
      const challenge = next === 3;
      bodies.forEach((body) => {
        body.group.visible = challenge
          ? Boolean(body.spec.challenge)
          : !body.spec.challenge;
        if (next === 2 && !body.spec.challenge)
          body.group.visible =
            body.spec.key === "wood-block" || body.spec.key === "metal-coin";
        if (next === 4) body.group.visible = false;
        if (next === 0 || next === 1 || next === 3) {
          body.group.position.copy(body.home);
          body.group.rotation.set(0, 0, 0);
          body.mode = "ready";
          body.reported = false;
        }
      });
      if (next === 2) {
        const wood = bodies.get("wood-block");
        const coin = bodies.get("metal-coin");
        if (wood) {
          wood.group.position.set(-0.42, WATER_Y - 0.04, TANK_CENTER.z);
          wood.mode = "floating";
        }
        if (coin) {
          coin.group.position.set(0.42, TANK_BOTTOM_Y, TANK_CENTER.z);
          coin.mode = "settled";
        }
      }
      floatBasket.visible = challenge;
      sinkBasket.visible = challenge;
      floatLabel.visible = challenge;
      sinkLabel.visible = challenge;
      drawStageCard(cardCanvas, next, scoreRef.current);
      cardTexture.needsUpdate = true;
    };

    dropRef.current = (key) => {
      const body = bodies.get(key);
      if (!body || body.spec.challenge || body.mode !== "ready") return;
      body.group.visible = true;
      body.group.position.set((Math.random() - 0.5) * 0.7, 2.05, TANK_CENTER.z);
      body.velocity = -0.15;
      body.mode = "falling";
      body.reported = false;
    };

    const interactiveMeshes: THREE.Object3D[] = [];
    scene.traverse((item) => {
      if (item.userData.objectKey) interactiveMeshes.push(item);
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const findKey = (object: THREE.Object3D | undefined) => {
      let current = object;
      while (current) {
        if (typeof current.userData.objectKey === "string")
          return current.userData.objectKey as string;
        current = current.parent ?? undefined;
      }
      return undefined;
    };
    const chooseFromRay = (origin: THREE.Vector3, direction: THREE.Vector3) => {
      raycaster.set(origin, direction);
      const hit = raycaster
        .intersectObjects(interactiveMeshes, true)
        .find((item) => item.object.visible);
      return findKey(hit?.object);
    };
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(interactiveMeshes, true)
        .find((item) => item.object.visible);
      const key = findKey(hit?.object);
      if (key) selectRef.current(key);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const controllerRay = new THREE.Matrix4();
    const controllers: THREE.XRTargetRaySpace[] = [];
    [0, 1].forEach((index) => {
      const controller = renderer.xr.getController(index);
      controller.userData.controllerIndex = index;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0, -4),
        ]),
        new THREE.LineBasicMaterial({
          color: index === 0 ? 0x4ade80 : 0xf87171,
        }),
      );
      controller.add(line);
      scene.add(controller);
      controllers.push(controller);

      controller.addEventListener("selectstart", () => {
        controllerRay.identity().extractRotation(controller.matrixWorld);
        const origin = new THREE.Vector3().setFromMatrixPosition(
          controller.matrixWorld,
        );
        const direction = new THREE.Vector3(0, 0, -1)
          .applyMatrix4(controllerRay)
          .normalize();
        const key = chooseFromRay(origin, direction);
        if (!key) {
          if (stageRef.current === 2) goToStage(3);
          return;
        }
        selectRef.current(key);
        if (stageRef.current === 3) {
          classifyRef.current(key, index === 0 ? "float" : "sink");
          return;
        }
        const body = bodies.get(key);
        if (
          stageRef.current === 1 &&
          body &&
          predictionsRef.current[key] &&
          body.mode === "ready"
        ) {
          controller.attach(body.group);
          body.mode = "grabbed";
          controller.userData.grabbedKey = key;
        }
      });

      controller.addEventListener("selectend", () => {
        const key = controller.userData.grabbedKey as string | undefined;
        if (!key) return;
        const body = bodies.get(key);
        if (body) {
          scene.attach(body.group);
          body.group.position.set(
            (Math.random() - 0.5) * 0.6,
            Math.max(body.group.position.y, 1.75),
            TANK_CENTER.z,
          );
          body.velocity = -0.1;
          body.mode = "falling";
        }
        controller.userData.grabbedKey = undefined;
      });
    });

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.04);
      const time = clock.elapsedTime;
      controls.update();

      bodies.forEach((body) => {
        if (
          !body.group.visible ||
          body.mode === "grabbed" ||
          body.mode === "ready"
        )
          return;
        if (body.mode === "falling") {
          body.velocity -= 4.2 * dt;
          body.group.position.y += body.velocity * dt;
          body.group.rotation.y += dt * 1.5;
          if (body.group.position.y <= WATER_Y) {
            ripple.position.x = body.group.position.x;
            ripple.scale.setScalar(1);
            rippleAge = 0;
            body.velocity = body.spec.outcome === "float" ? -0.16 : -0.42;
            body.mode = body.spec.outcome === "float" ? "floating" : "sinking";
          }
        } else if (body.mode === "floating") {
          const target =
            WATER_Y - 0.05 + Math.sin(time * 2.2 + body.bobSeed) * 0.025;
          body.group.position.y +=
            (target - body.group.position.y) * Math.min(1, dt * 4.5);
          body.group.rotation.z = Math.sin(time * 1.4 + body.bobSeed) * 0.06;
          if (
            !body.reported &&
            Math.abs(body.group.position.y - target) < 0.035
          ) {
            body.reported = true;
            body.mode = "settled";
            settleRef.current(body.spec.key);
          }
        } else if (body.mode === "sinking") {
          body.velocity = Math.max(body.velocity - 0.25 * dt, -0.55);
          body.group.position.y = Math.max(
            TANK_BOTTOM_Y,
            body.group.position.y + body.velocity * dt,
          );
          body.group.rotation.x += dt * 0.7;
          if (body.group.position.y <= TANK_BOTTOM_Y + 0.01) {
            body.mode = "settled";
            if (!body.reported) {
              body.reported = true;
              settleRef.current(body.spec.key);
            }
          }
        } else if (body.mode === "settled" && body.spec.outcome === "float") {
          body.group.position.y =
            WATER_Y - 0.05 + Math.sin(time * 2.2 + body.bobSeed) * 0.025;
        }
      });

      if (rippleAge < 1.1) {
        rippleAge += dt;
        ripple.scale.setScalar(1 + rippleAge * 5);
        (ripple.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          0.72 - rippleAge * 0.68,
        );
      }
      water.position.y = 0.93 + Math.sin(time * 1.1) * 0.004;
      renderer.render(scene, camera);
    });

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.setAnimationLoop(null);
      controls.dispose();
      scene.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          item.geometry.dispose();
          const materials = Array.isArray(item.material)
            ? item.material
            : [item.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      bodies.clear();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
      window.speechSynthesis?.cancel();
    };
  }, [goToStage]);

  const setPrediction = (key: string, outcome: Outcome) => {
    setPredictions((previous) => ({ ...previous, [key]: outcome }));
    setSelected(key);
  };

  const dropSelected = () => {
    if (!predictions[selected]) {
      setFeedback("Predict FLOAT or SINK before testing this object.");
      return;
    }
    dropRef.current(selected);
    setFeedback(
      `Observe the ${OBJECTS.find((item) => item.key === selected)?.label.toLowerCase()} carefully…`,
    );
  };

  const enterVR = useCallback(async () => {
    const renderer = rendererRef.current;
    const xr = (
      navigator as Navigator & {
        xr?: {
          requestSession(mode: string, options: object): Promise<XRSession>;
        };
      }
    ).xr;
    if (!renderer || !xr) return;
    try {
      const session = await xr.requestSession("immersive-vr", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["bounded-floor", "hand-tracking"],
      });
      await renderer.xr.setSession(session);
    } catch {
      setFeedback(
        "VR could not start. Continue in browser mode or check the HTTPS connection.",
      );
    }
  }, []);

  const allPredicted = OBJECTS.every((item) => predictions[item.key]);
  const selectedSpec = [...OBJECTS, ...CHALLENGE_OBJECTS].find(
    (item) => item.key === selected,
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#082f49",
        color: "#f8fafc",
      }}
    >
      <div
        ref={mountRef}
        role="img"
        style={{ width: "100%", height: "100%" }}
        aria-label={`Interactive 3D water experiment. ${STAGES[stage].title}. ${feedback}`}
      />

      {!started ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "grid",
            placeItems: "center",
            padding: 24,
            background:
              "radial-gradient(circle at 50% 25%, rgba(14,116,144,0.94), rgba(2,18,32,0.98) 70%)",
          }}
        >
          <section
            style={{ maxWidth: 650, textAlign: "center" }}
            aria-labelledby="water-sim-title"
          >
            <div
              style={{
                fontSize: 84,
                filter: "drop-shadow(0 0 24px rgba(56,189,248,.6))",
              }}
            >
              💧
            </div>
            <p
              style={{
                color: "#7dd3fc",
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              Class 5 · Experiments with Water
            </p>
            <h1
              id="water-sim-title"
              style={{
                margin: "8px 0 12px",
                fontSize: "clamp(2rem, 6vw, 3.6rem)",
                lineHeight: 1,
              }}
            >
              What Floats, What Sinks?
            </h1>
            <p
              style={{
                color: "#bae6fd",
                lineHeight: 1.7,
                maxWidth: 540,
                margin: "0 auto 28px",
              }}
            >
              Help Professor Aqua solve the Magical Lake mystery. Predict,
              perform the experiment, observe buoyancy, and explain the evidence
              using density.
            </p>
            <button
              onClick={() => {
                setStarted(true);
                speak(NARRATIONS[0]);
              }}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                border: 0,
                background: "linear-gradient(135deg, #38bdf8, #2563eb)",
                color: "white",
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 14px 40px rgba(14,165,233,.28)",
              }}
            >
              🧪 Begin the experiment
            </button>
            <p style={{ color: "#64748b", fontSize: 12, marginTop: 18 }}>
              Stationary experience · 5 minutes · Low comfort risk
            </p>
          </section>
        </div>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              top: 64,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(92vw, 690px)",
              padding: "10px 14px",
              borderRadius: 14,
              background: "rgba(2,18,32,.9)",
              border: "1px solid rgba(125,211,252,.28)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: "#7dd3fc",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                Scene {stage + 1}/5 · ★ {stars}
              </div>
              <div
                style={{
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {STAGES[stage].title}
              </div>
            </div>
            {vrSupported ? (
              <button
                onClick={enterVR}
                style={{
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1px solid rgba(125,211,252,.45)",
                  background: "rgba(14,116,144,.35)",
                  color: "#e0f2fe",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🥽 Enter VR
              </button>
            ) : null}
          </div>

          <aside
            style={{
              position: "absolute",
              top: 132,
              right: 16,
              width: "min(330px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
              padding: 16,
              borderRadius: 16,
              background: "rgba(2,18,32,.92)",
              border: "1px solid rgba(125,211,252,.24)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>
              {STAGES[stage].title}
            </h2>
            <p
              style={{
                color: "#bae6fd",
                fontSize: 13,
                lineHeight: 1.55,
                margin: "0 0 10px",
              }}
            >
              {STAGES[stage].cue}
            </p>
            <button
              onClick={() => speak(NARRATIONS[stage])}
              style={{
                width: "100%",
                minHeight: 44,
                padding: "9px 11px",
                borderRadius: 9,
                border: "1px solid rgba(125,211,252,.28)",
                background: "rgba(56,189,248,.1)",
                color: "#e0f2fe",
                cursor: "pointer",
                fontWeight: 700,
                marginBottom: 9,
              }}
            >
              🔊 Replay narration
            </button>
            <div
              aria-live="polite"
              style={{
                padding: "9px 11px",
                borderRadius: 9,
                background: "rgba(56,189,248,.1)",
                color: "#e0f2fe",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {feedback}
            </div>

            {stage === 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {OBJECTS.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: 9,
                      borderRadius: 10,
                      background:
                        selected === item.key
                          ? "rgba(56,189,248,.14)"
                          : "rgba(255,255,255,.035)",
                    }}
                  >
                    <button
                      onClick={() => setSelected(item.key)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: 0,
                        padding: 0,
                        color: "#f8fafc",
                        background: "transparent",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {item.label}
                    </button>
                    <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                      {(["float", "sink"] as Outcome[]).map((choice) => (
                        <button
                          key={choice}
                          onClick={() => setPrediction(item.key, choice)}
                          aria-pressed={predictions[item.key] === choice}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: 7,
                            border: `1px solid ${predictions[item.key] === choice ? (choice === "float" ? "#4ade80" : "#f87171") : "rgba(255,255,255,.12)"}`,
                            background:
                              predictions[item.key] === choice
                                ? choice === "float"
                                  ? "rgba(34,197,94,.18)"
                                  : "rgba(239,68,68,.18)"
                                : "transparent",
                            color: "#e2e8f0",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {choice === "float" ? "↑ FLOAT" : "↓ SINK"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  disabled={!allPredicted}
                  onClick={() => goToStage(1)}
                  style={{
                    marginTop: 4,
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: allPredicted ? "#0284c7" : "#334155",
                    color: "white",
                    fontWeight: 800,
                    cursor: allPredicted ? "pointer" : "not-allowed",
                  }}
                >
                  Test my predictions →
                </button>
              </div>
            ) : null}

            {stage === 1 ? (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 7,
                    marginBottom: 10,
                  }}
                >
                  {OBJECTS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSelected(item.key)}
                      disabled={tested[item.key]}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: `1px solid ${selected === item.key ? "#38bdf8" : "rgba(255,255,255,.12)"}`,
                        background: tested[item.key]
                          ? "rgba(34,197,94,.12)"
                          : "rgba(255,255,255,.04)",
                        color: tested[item.key] ? "#86efac" : "#e2e8f0",
                        cursor: tested[item.key] ? "default" : "pointer",
                        fontSize: 12,
                      }}
                    >
                      {tested[item.key] ? "✓ " : ""}
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={dropSelected}
                  disabled={Boolean(tested[selected])}
                  style={{
                    width: "100%",
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: tested[selected] ? "#334155" : "#0284c7",
                    color: "white",
                    fontWeight: 800,
                    cursor: tested[selected] ? "not-allowed" : "pointer",
                  }}
                >
                  💧 Drop {selectedSpec?.label ?? "object"} in tank
                </button>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: 11,
                    lineHeight: 1.45,
                    marginBottom: 0,
                  }}
                >
                  VR: point and hold the trigger to grab. Release the trigger to
                  drop.
                </p>
              </div>
            ) : null}

            {stage === 2 ? (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 9,
                      background: "rgba(34,197,94,.12)",
                    }}
                  >
                    <strong style={{ color: "#86efac" }}>Wood</strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                      Lower average density than water → floats
                    </span>
                  </div>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 9,
                      background: "rgba(239,68,68,.12)",
                    }}
                  >
                    <strong style={{ color: "#fca5a5" }}>Metal coin</strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                      Greater density than water → sinks
                    </span>
                  </div>
                </div>
                <p style={{ color: "#fde68a", fontSize: 13, lineHeight: 1.5 }}>
                  Misconception check: a bigger object does not always sink.
                  Material and trapped air affect average density.
                </p>
                <button
                  onClick={() => goToStage(3)}
                  style={{
                    width: "100%",
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: "#7c3aed",
                    color: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Start final challenge →
                </button>
              </div>
            ) : null}

            {stage === 3 ? (
              <div style={{ display: "grid", gap: 9 }}>
                {CHALLENGE_OBJECTS.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: 9,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {challengeAnswers[item.key] ? "✓ " : ""}
                      {item.label}
                    </strong>
                    {!challengeAnswers[item.key] ? (
                      <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                        <button
                          onClick={() => classifyRef.current(item.key, "float")}
                          style={{
                            flex: 1,
                            padding: 7,
                            borderRadius: 7,
                            border: "1px solid #4ade80",
                            background: "rgba(34,197,94,.12)",
                            color: "#86efac",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          FLOATS
                        </button>
                        <button
                          onClick={() => classifyRef.current(item.key, "sink")}
                          style={{
                            flex: 1,
                            padding: 7,
                            borderRadius: 7,
                            border: "1px solid #f87171",
                            background: "rgba(239,68,68,.12)",
                            color: "#fca5a5",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          SINKS
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {stage === 4 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64 }}>🏅</div>
                <h3 style={{ color: "#fde68a", margin: "4px 0" }}>
                  Junior Water Scientist
                </h3>
                <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.55 }}>
                  You earned {stars} of 9 stars. Evidence matters more than
                  guessing—and density helps explain the evidence.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 9,
                    border: "1px solid rgba(125,211,252,.4)",
                    background: "rgba(14,116,144,.3)",
                    color: "#e0f2fe",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Run the experiment again
                </button>
              </div>
            ) : null}
          </aside>

          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              padding: "7px 10px",
              borderRadius: 8,
              background: "rgba(2,18,32,.72)",
              color: "#94a3b8",
              fontSize: 11,
            }}
          >
            Click objects · Drag to look around · Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}
