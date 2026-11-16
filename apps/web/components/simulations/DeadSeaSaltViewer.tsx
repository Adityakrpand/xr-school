"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type TankKey = "ordinary" | "salt";
type EggOutcome = "sink" | "float";
type EggMode =
  | "home"
  | "falling"
  | "sinking"
  | "rising"
  | "floating"
  | "settled";

interface EggState {
  group: THREE.Group;
  mode: EggMode;
  tank: TankKey;
  outcome: EggOutcome;
  velocity: number;
  reported: boolean;
}

const STAGES = [
  {
    title: "Explore the floating sea",
    cue: "Inspect ordinary water, salty water, and salt crystals. Predict which water helps an egg float.",
  },
  {
    title: "Compare two water tanks",
    cue: "Test the same egg in ordinary water and in salty water. Follow it from the surface to its final position.",
  },
  {
    title: "Make ordinary water salty",
    cue: "Add spoonfuls of salt, stir until it dissolves, then test the egg again. Keep experimenting until it floats.",
  },
  {
    title: "Reveal the density secret",
    cue: "Watch dissolved salt pack into the water and compare the upward support in ordinary and salty water.",
  },
  {
    title: "Young Scientist challenge",
    cue: "Answer three questions and sort the egg observations to earn the Junior Marine Scientist badge.",
  },
];

const NARRATIONS = [
  "Welcome, Young Scientist, to the mysterious Dead Sea. Inspect the samples and predict which water helps an egg float more easily.",
  "Now test the same egg in both tanks. It sinks in ordinary water but floats in sufficiently salty water.",
  "Make your own salty water. Add salt, stir it until it dissolves, and test the egg again as the water becomes denser.",
  "Salt increases water density. Denser salt water provides greater upward buoyant force, helping eggs and people float more easily.",
  "Final challenge. Use the evidence from your experiment to solve each question and sort the observations.",
];

const TANK_X: Record<TankKey, number> = { ordinary: -0.92, salt: 0.92 };
const TANK_Z = -1.32;
const WATER_Y = 1.34;
const TANK_BOTTOM_Y = 0.43;
const FLOAT_THRESHOLD = 3;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => voice.lang.startsWith("en-IN")) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;
  window.speechSynthesis.speak(utterance);
}

function labelSprite(text: string, accent: string, width = 0.92) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite();
  ctx.fillStyle = "rgba(3, 15, 28, 0.9)";
  ctx.roundRect(6, 6, 628, 138, 28);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 320, 76);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  sprite.scale.set(width, width * 0.235, 1);
  return sprite;
}

function setAction(object: THREE.Object3D, action: string) {
  object.userData.action = action;
  object.traverse((child) => {
    child.userData.action = action;
  });
}

function createEgg() {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0xfff7d6,
      roughness: 0.52,
      metalness: 0.02,
    }),
  );
  shell.scale.set(0.82, 1.08, 0.82);
  shell.castShadow = true;
  group.add(shell);
  const label = labelSprite("FRESH EGG", "#fcd34d", 0.68);
  label.position.y = 0.36;
  group.add(label);
  setAction(group, "drop-egg");
  return group;
}

function createTank(
  key: TankKey,
  waterMaterial: THREE.MeshPhysicalMaterial,
  interactive: THREE.Object3D[],
) {
  const group = new THREE.Group();
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc9f2ff,
    transparent: true,
    opacity: 0.18,
    roughness: 0.04,
    transmission: 0.62,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 1.2, 1.15),
    glassMaterial,
  );
  glass.position.y = 0.98;
  group.add(glass);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.84, 1.04),
    waterMaterial,
  );
  water.position.y = 0.91;
  water.userData.waterKey = key;
  group.add(water);

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x164e63,
    metalness: 0.65,
    roughness: 0.25,
  });
  [-0.73, 0.73].forEach((x) => {
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.23, 1.18),
      rimMaterial,
    );
    rim.position.set(x, 0.98, 0);
    group.add(rim);
  });
  const topRim = new THREE.Mesh(
    new THREE.BoxGeometry(1.49, 0.045, 1.18),
    rimMaterial,
  );
  topRim.position.y = 1.59;
  group.add(topRim);

  const label = labelSprite(
    key === "ordinary" ? "TANK A  •  ORDINARY" : "TANK B  •  SALTY",
    key === "ordinary" ? "#60a5fa" : "#2dd4bf",
    1.12,
  );
  label.position.set(0, 1.87, 0);
  group.add(label);
  const action = key === "ordinary" ? "test-ordinary" : "test-salt";
  setAction(glass, action);
  setAction(water, action);
  interactive.push(glass, water);
  group.userData.water = water;
  return group;
}

function drawStageCard(
  canvas: HTMLCanvasElement,
  stage: number,
  stars: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#052e3d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = "#67e8f9";
  ctx.font = "700 28px sans-serif";
  ctx.fillText(`PROFESSOR AQUA  •  ${stage + 1}/5`, 34, 48);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 42px sans-serif";
  ctx.fillText(STAGES[stage].title, 34, 104);
  ctx.fillStyle = "#cffafe";
  ctx.font = "27px sans-serif";
  const words = STAGES[stage].cue.split(" ");
  let line = "";
  let y = 150;
  for (const word of words) {
    const next = `${line}${word} `;
    if (ctx.measureText(next).width > canvas.width - 70 && line) {
      ctx.fillText(line.trim(), 34, y);
      line = `${word} `;
      y += 35;
    } else {
      line = next;
    }
  }
  ctx.fillText(line.trim(), 34, y);
  ctx.fillStyle = "#fde68a";
  ctx.font = "700 25px sans-serif";
  ctx.fillText(`Stars: ${stars}  ★`, canvas.width - 190, 48);
}

export default function DeadSeaSaltViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageRef = useRef(0);
  const scoreRef = useRef(0);
  const salinityRef = useRef(0);
  const stirredRef = useRef(false);
  const testRunningRef = useRef(false);
  const testsRef = useRef<Partial<Record<TankKey, EggOutcome>>>({});
  const mixSuccessRef = useRef(false);
  const explanationCorrectRef = useRef(false);
  const challengeAnswersRef = useRef<Record<number, boolean>>({});
  const sortAnswersRef = useRef<Partial<Record<TankKey, EggOutcome>>>({});
  const stageVisualRef = useRef<(stage: number) => void>(() => undefined);
  const actionRef = useRef<(action: string) => void>(() => undefined);
  const testTankRef = useRef<(tank: TankKey) => void>(() => undefined);
  const addSaltVisualRef = useRef<(amount: number) => void>(() => undefined);
  const stirVisualRef = useRef<() => void>(() => undefined);

  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState(0);
  const [prediction, setPrediction] = useState<TankKey | null>(null);
  const [tests, setTests] = useState<Partial<Record<TankKey, EggOutcome>>>({});
  const [salinity, setSalinity] = useState(0);
  const [stirred, setStirred] = useState(false);
  const [mixSuccess, setMixSuccess] = useState(false);
  const [explanationCorrect, setExplanationCorrect] = useState(false);
  const [challengeAnswers, setChallengeAnswers] = useState<
    Record<number, boolean>
  >({});
  const [sortAnswers, setSortAnswers] = useState<
    Partial<Record<TankKey, EggOutcome>>
  >({});
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState(
    "Which water will help an egg float more easily?",
  );

  const awardStar = useCallback(() => {
    scoreRef.current += 1;
    setStars(scoreRef.current);
  }, []);

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

  const goToStage = useCallback((next: number) => {
    stageRef.current = next;
    setStage(next);
    setFeedback(STAGES[next].cue);
    stageVisualRef.current(next);
    speak(NARRATIONS[next]);
  }, []);

  const finishEggTest = useCallback(
    (tank: TankKey, outcome: EggOutcome) => {
      testRunningRef.current = false;
      if (stageRef.current === 1) {
        if (testsRef.current[tank]) return;
        const next = { ...testsRef.current, [tank]: outcome };
        testsRef.current = next;
        setTests(next);
        if (next.ordinary && next.salt) {
          awardStar();
          setFeedback(
            "Evidence collected: the egg sank in ordinary water and floated in salty water.",
          );
        } else {
          setFeedback(
            outcome === "float"
              ? "The egg rose and floated in the salty water. Now test the other tank."
              : "The egg sank to the bottom in ordinary water. Now test the other tank.",
          );
        }
      } else if (stageRef.current === 2) {
        if (outcome === "float") {
          if (!mixSuccessRef.current) awardStar();
          mixSuccessRef.current = true;
          setMixSuccess(true);
          setFeedback(
            "Success! Enough dissolved salt made the water dense enough to support the egg.",
          );
        } else {
          setFeedback(
            "The egg still sinks. Add more salt, stir it in, and test again.",
          );
        }
      }
    },
    [awardStar],
  );

  const addSalt = useCallback(() => {
    if (stageRef.current !== 2 || testRunningRef.current) return;
    if (salinityRef.current >= 5) {
      setFeedback(
        "The tank already has the maximum salt for this experiment. Stir and test the egg.",
      );
      return;
    }
    const next = salinityRef.current + 1;
    salinityRef.current = next;
    stirredRef.current = false;
    setSalinity(next);
    setStirred(false);
    mixSuccessRef.current = false;
    setMixSuccess(false);
    addSaltVisualRef.current(next);
    setFeedback(
      `Added spoonful ${next}. Stir the water so the salt dissolves.`,
    );
  }, []);

  const stirWater = useCallback(() => {
    if (stageRef.current !== 2 || testRunningRef.current) return;
    if (salinityRef.current === 0) {
      setFeedback("Add at least one spoonful of salt before stirring.");
      return;
    }
    stirredRef.current = true;
    setStirred(true);
    stirVisualRef.current();
    setFeedback(
      "The salt has dissolved. Drop the egg into Tank A and observe.",
    );
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8ad8ed);
    scene.fog = new THREE.Fog(0xbfe8ef, 11, 32);

    const camera = new THREE.PerspectiveCamera(
      62,
      mount.clientWidth / mount.clientHeight,
      0.05,
      45,
    );
    camera.position.set(0, 1.65, 3.05);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.1, -1.3);
    controls.enableDamping = true;
    controls.minDistance = 2.2;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI * 0.49;

    scene.add(new THREE.HemisphereLight(0xe7fbff, 0x8b6b43, 2.4));
    const sun = new THREE.DirectionalLight(0xfff3d2, 2.7);
    sun.position.set(-5, 8, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const sand = new THREE.Mesh(
      new THREE.CircleGeometry(18, 56),
      new THREE.MeshStandardMaterial({ color: 0xc9aa73, roughness: 1 }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.receiveShadow = true;
    scene.add(sand);

    const sea = new THREE.Mesh(
      new THREE.CircleGeometry(7.8, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0x1496bd,
        transparent: true,
        opacity: 0.78,
        roughness: 0.1,
        transmission: 0.16,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0.025, -9.2);
    scene.add(sea);

    [-7, -3.7, 0, 3.7, 7].forEach((x, index) => {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(3.1, 4.2 + (index % 2) * 1.3, 6),
        new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x846a53 : 0x6f6357,
          roughness: 1,
        }),
      );
      mountain.position.set(x, 1.9, -18 - Math.abs(x) * 0.15);
      scene.add(mountain);
    });

    const saltMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.75,
      emissive: 0xdff7ff,
      emissiveIntensity: 0.1,
    });
    for (let i = 0; i < 28; i += 1) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.07 + (i % 3) * 0.018),
        saltMaterial,
      );
      const angle = (i / 28) * Math.PI * 2;
      const radius = 5.8 + (i % 4) * 0.24;
      crystal.position.set(
        Math.cos(angle) * radius,
        0.08,
        -8.7 + Math.sin(angle) * radius * 0.36,
      );
      crystal.rotation.set(i * 0.2, i * 0.31, 0);
      scene.add(crystal);
    }

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3.25, 3.5, 0.16, 44),
      new THREE.MeshStandardMaterial({ color: 0xd6c095, roughness: 0.9 }),
    );
    platform.position.y = 0.08;
    platform.receiveShadow = true;
    scene.add(platform);

    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(4.25, 0.13, 1.48),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.82 }),
    );
    bench.position.set(0, 0.25, TANK_Z);
    bench.castShadow = true;
    bench.receiveShadow = true;
    scene.add(bench);

    const interactive: THREE.Object3D[] = [];
    const ordinaryWaterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.36,
      roughness: 0.14,
      transmission: 0.24,
      depthWrite: false,
    });
    const saltWaterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.46,
      roughness: 0.11,
      transmission: 0.2,
      depthWrite: false,
    });
    const ordinaryTank = createTank(
      "ordinary",
      ordinaryWaterMaterial,
      interactive,
    );
    ordinaryTank.position.set(TANK_X.ordinary, 0, TANK_Z);
    scene.add(ordinaryTank);
    const saltTank = createTank("salt", saltWaterMaterial, interactive);
    saltTank.position.set(TANK_X.salt, 0, TANK_Z);
    scene.add(saltTank);

    const eggGroup = createEgg();
    eggGroup.position.set(0, 0.78, -0.22);
    scene.add(eggGroup);
    interactive.push(...eggGroup.children);
    const egg: EggState = {
      group: eggGroup,
      mode: "home",
      tank: "ordinary",
      outcome: "sink",
      velocity: 0,
      reported: false,
    };

    const spoon = new THREE.Group();
    const spoonMaterial = new THREE.MeshStandardMaterial({
      color: 0xb6c5cf,
      metalness: 0.75,
      roughness: 0.25,
    });
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.5, 0.035),
      spoonMaterial,
    );
    handle.position.y = 0.18;
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      spoonMaterial,
    );
    bowl.scale.set(0.8, 1, 0.36);
    bowl.position.y = 0.48;
    const saltHeap = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.1, 10),
      saltMaterial,
    );
    saltHeap.position.y = 0.54;
    spoon.add(handle, bowl, saltHeap);
    spoon.position.set(-2.12, 0.72, -0.55);
    spoon.rotation.z = -0.72;
    setAction(spoon, "add-salt");
    spoon.visible = false;
    scene.add(spoon);
    interactive.push(handle, bowl, saltHeap);

    const stirStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.76, 10),
      new THREE.MeshStandardMaterial({ color: 0x9a632f, roughness: 0.8 }),
    );
    stirStick.position.set(-1.68, 0.85, -0.52);
    stirStick.rotation.z = -0.55;
    setAction(stirStick, "stir");
    stirStick.visible = false;
    scene.add(stirStick);
    interactive.push(stirStick);

    const saltJar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.48, 20),
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.48,
        roughness: 0.12,
        transmission: 0.3,
      }),
    );
    saltJar.position.set(-2.48, 0.57, -0.72);
    setAction(saltJar, "add-salt");
    saltJar.visible = false;
    scene.add(saltJar);
    interactive.push(saltJar);

    const particlePositions = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i += 1) {
      particlePositions[i * 3] = TANK_X.ordinary + (Math.random() - 0.5) * 1.05;
      particlePositions[i * 3 + 1] = 0.55 + Math.random() * 0.76;
      particlePositions[i * 3 + 2] = TANK_Z + (Math.random() - 0.5) * 0.82;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    particleGeometry.setDrawRange(0, 0);
    const saltParticles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xf8fafc,
        size: 0.035,
        transparent: true,
        opacity: 0.82,
      }),
    );
    scene.add(saltParticles);

    const densityBlocks: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x475569,
          emissive: 0x000000,
          roughness: 0.6,
        }),
      );
      block.position.set(-1.25 + i * 0.17, 2.13, TANK_Z);
      block.visible = false;
      scene.add(block);
      densityBlocks.push(block);
    }
    const densityLabel = labelSprite("DENSITY", "#fde68a", 0.72);
    densityLabel.position.set(-0.92, 2.36, TANK_Z);
    densityLabel.visible = false;
    scene.add(densityLabel);

    const person = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({
      color: 0xd9a070,
      roughness: 0.75,
    });
    const suit = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.65,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), skin);
    head.position.y = 0.68;
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 0.46, 6, 12),
      suit,
    );
    torso.position.y = 0.33;
    torso.rotation.z = Math.PI / 2;
    const armLeft = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.38, 4, 8),
      skin,
    );
    armLeft.position.set(-0.15, 0.34, 0.28);
    armLeft.rotation.z = 1.15;
    const armRight = armLeft.clone();
    armRight.position.z = -0.28;
    armRight.rotation.z = -1.15;
    person.add(head, torso, armLeft, armRight);
    person.position.set(3.15, 0.05, -7.4);
    person.rotation.y = -0.25;
    person.visible = false;
    scene.add(person);

    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.095, 28),
      new THREE.MeshBasicMaterial({
        color: 0xecfeff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(0, WATER_Y + 0.012, TANK_Z);
    scene.add(ripple);
    let rippleAge = 2;
    let stirAge = 2;

    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = 1024;
    cardCanvas.height = 300;
    drawStageCard(cardCanvas, 0, 0);
    const cardTexture = new THREE.CanvasTexture(cardCanvas);
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(3.45, 1.01),
      new THREE.MeshBasicMaterial({ map: cardTexture, side: THREE.DoubleSide }),
    );
    card.position.set(0, 2.67, -2.7);
    scene.add(card);

    const resetEgg = () => {
      egg.group.position.set(0, 0.78, -0.22);
      egg.group.rotation.set(0, 0, 0);
      egg.group.visible = true;
      egg.mode = "home";
      egg.velocity = 0;
      egg.reported = false;
    };

    stageVisualRef.current = (next) => {
      spoon.visible = next === 2;
      stirStick.visible = next === 2;
      saltJar.visible = next === 2;
      densityBlocks.forEach((block) => {
        block.visible = next === 2 || next === 3;
      });
      densityLabel.visible = next === 2 || next === 3;
      person.visible = next === 3;
      saltParticles.visible = next === 2 || next === 3;
      if (next !== 3) resetEgg();
      if (next === 3) {
        egg.group.position.set(TANK_X.salt, WATER_Y - 0.07, TANK_Z);
        egg.mode = "floating";
        particleGeometry.setDrawRange(0, 180);
      }
      drawStageCard(cardCanvas, next, scoreRef.current);
      cardTexture.needsUpdate = true;
    };

    addSaltVisualRef.current = (amount) => {
      particleGeometry.setDrawRange(0, amount * 32);
      densityBlocks.forEach((block, index) => {
        const material = block.material as THREE.MeshStandardMaterial;
        const active = index < amount;
        material.color.setHex(active ? 0x2dd4bf : 0x475569);
        material.emissive.setHex(active ? 0x0f766e : 0x000000);
      });
      ordinaryWaterMaterial.color.lerpColors(
        new THREE.Color(0x38bdf8),
        new THREE.Color(0x2dd4bf),
        amount / 5,
      );
      spoon.position.set(-0.78, 1.92, TANK_Z - 0.05);
      spoon.rotation.set(0, 0, -0.15);
      window.setTimeout(() => {
        spoon.position.set(-2.12, 0.72, -0.55);
        spoon.rotation.set(0, 0, -0.72);
      }, 650);
    };

    stirVisualRef.current = () => {
      stirAge = 0;
      stirStick.position.set(TANK_X.ordinary, 1.22, TANK_Z);
      stirStick.rotation.set(0, 0, 0.15);
      window.setTimeout(() => {
        stirStick.position.set(-1.68, 0.85, -0.52);
        stirStick.rotation.set(0, 0, -0.55);
      }, 900);
    };

    testTankRef.current = (tank) => {
      if (testRunningRef.current) return;
      if (stageRef.current === 2 && tank !== "ordinary") return;
      if (stageRef.current === 2 && !stirredRef.current) {
        setFeedback("Stir the salt until it dissolves before testing the egg.");
        return;
      }
      testRunningRef.current = true;
      egg.tank = tank;
      egg.outcome =
        tank === "salt" ||
        (stageRef.current === 2 && salinityRef.current >= FLOAT_THRESHOLD)
          ? "float"
          : "sink";
      egg.group.visible = true;
      egg.group.position.set(TANK_X[tank], 2.05, TANK_Z);
      egg.group.rotation.set(0, 0, 0);
      egg.velocity = -0.12;
      egg.mode = "falling";
      egg.reported = false;
      setFeedback(
        tank === "ordinary"
          ? "Observe the egg in Tank A carefully…"
          : "Observe the same egg in Tank B carefully…",
      );
    };

    actionRef.current = (action) => {
      if (action === "test-ordinary") {
        if (stageRef.current === 1 || stageRef.current === 2)
          testTankRef.current("ordinary");
      } else if (action === "test-salt") {
        if (stageRef.current === 1) testTankRef.current("salt");
      } else if (action === "drop-egg") {
        if (stageRef.current === 2) testTankRef.current("ordinary");
      } else if (action === "add-salt") {
        addSalt();
      } else if (action === "stir") {
        stirWater();
      }
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const findAction = (object: THREE.Object3D | undefined) => {
      let current = object;
      while (current) {
        if (typeof current.userData.action === "string")
          return current.userData.action as string;
        current = current.parent ?? undefined;
      }
      return undefined;
    };
    const isVisibleInHierarchy = (object: THREE.Object3D) => {
      let current: THREE.Object3D | null = object;
      while (current) {
        if (!current.visible) return false;
        current = current.parent;
      }
      return true;
    };
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(interactive, true)
        .find((item) => isVisibleInHierarchy(item.object));
      const action = findAction(hit?.object);
      if (action) actionRef.current(action);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const controllerMatrix = new THREE.Matrix4();
    [0, 1].forEach((index) => {
      const controller = renderer.xr.getController(index);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0, -4),
        ]),
        new THREE.LineBasicMaterial({
          color: index === 0 ? 0x2dd4bf : 0xfcd34d,
        }),
      );
      controller.add(line);
      scene.add(controller);
      controller.addEventListener("selectstart", () => {
        controllerMatrix.identity().extractRotation(controller.matrixWorld);
        const origin = new THREE.Vector3().setFromMatrixPosition(
          controller.matrixWorld,
        );
        const direction = new THREE.Vector3(0, 0, -1)
          .applyMatrix4(controllerMatrix)
          .normalize();
        raycaster.set(origin, direction);
        const hit = raycaster
          .intersectObjects(interactive, true)
          .find((item) => isVisibleInHierarchy(item.object));
        const action = findAction(hit?.object);
        if (action) actionRef.current(action);
      });
    });

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.04);
      const time = clock.elapsedTime;
      controls.update();

      if (egg.mode === "falling") {
        egg.velocity -= 4.1 * dt;
        egg.group.position.y += egg.velocity * dt;
        egg.group.rotation.z += dt * 0.7;
        if (egg.group.position.y <= WATER_Y) {
          ripple.position.x = TANK_X[egg.tank];
          ripple.scale.setScalar(1);
          rippleAge = 0;
          egg.velocity = -0.28;
          egg.mode = "sinking";
        }
      } else if (egg.mode === "sinking") {
        egg.velocity = Math.max(egg.velocity - 0.18 * dt, -0.52);
        egg.group.position.y += egg.velocity * dt;
        egg.group.rotation.x += dt * 0.55;
        if (egg.outcome === "float" && egg.group.position.y <= 0.78) {
          egg.mode = "rising";
          egg.velocity = 0.2;
        } else if (
          egg.outcome === "sink" &&
          egg.group.position.y <= TANK_BOTTOM_Y
        ) {
          egg.group.position.y = TANK_BOTTOM_Y;
          egg.mode = "settled";
          if (!egg.reported) {
            egg.reported = true;
            finishEggTest(egg.tank, "sink");
          }
        }
      } else if (egg.mode === "rising") {
        egg.velocity = Math.min(egg.velocity + 0.42 * dt, 0.47);
        egg.group.position.y += egg.velocity * dt;
        if (egg.group.position.y >= WATER_Y - 0.08) {
          egg.group.position.y = WATER_Y - 0.08;
          egg.mode = "floating";
          if (!egg.reported) {
            egg.reported = true;
            finishEggTest(egg.tank, "float");
          }
        }
      } else if (egg.mode === "floating") {
        egg.group.position.y = WATER_Y - 0.08 + Math.sin(time * 2.15) * 0.025;
        egg.group.rotation.z = Math.sin(time * 1.5) * 0.06;
      }

      if (rippleAge < 1.1) {
        rippleAge += dt;
        ripple.scale.setScalar(1 + rippleAge * 5.2);
        (ripple.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          0.72 - rippleAge * 0.68,
        );
      }
      if (stirAge < 1) {
        stirAge += dt;
        stirStick.rotation.y += dt * 15;
        saltParticles.rotation.y += dt * 3.5;
      }
      if (person.visible) {
        person.position.y = 0.05 + Math.sin(time * 1.3) * 0.025;
        person.rotation.z = Math.sin(time * 0.7) * 0.025;
      }
      ordinaryWaterMaterial.opacity = 0.36 + salinityRef.current * 0.016;
      const ordinaryWater = ordinaryTank.userData.water as THREE.Mesh;
      const saltyWater = saltTank.userData.water as THREE.Mesh;
      ordinaryWater.position.y = 0.91 + Math.sin(time * 1.05) * 0.004;
      saltyWater.position.y = 0.91 + Math.sin(time * 1.12 + 0.7) * 0.004;
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
        const disposable = item as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        disposable.geometry?.dispose();
        const materials = disposable.material
          ? Array.isArray(disposable.material)
            ? disposable.material
            : [disposable.material]
          : [];
        materials.forEach((material) => {
          const withMap = material as THREE.Material & { map?: THREE.Texture };
          withMap.map?.dispose();
          material.dispose();
        });
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
      window.speechSynthesis?.cancel();
    };
  }, [addSalt, finishEggTest, stirWater]);

  const submitPrediction = () => {
    if (!prediction) {
      setFeedback("Choose ordinary water or salt water before continuing.");
      return;
    }
    if (prediction === "salt") {
      awardStar();
      setFeedback("Good prediction. Now collect evidence in both tanks.");
    } else {
      setFeedback(
        "Let the experiment test that idea. Evidence can change a prediction.",
      );
    }
    goToStage(1);
  };

  const testTank = (tank: TankKey) => testTankRef.current(tank);

  const answerExplanation = (answer: string) => {
    if (answer === "density") {
      if (!explanationCorrectRef.current) awardStar();
      explanationCorrectRef.current = true;
      setExplanationCorrect(true);
      setFeedback(
        "Correct: dissolved salt increases density and upward buoyant support.",
      );
    } else {
      setFeedback(
        "Not magic—look at what changed when salt dissolved in the water.",
      );
    }
  };

  const answerChallenge = (question: number, answer: string) => {
    const correct = ["salt", "denser", "salty"][question];
    if (answer !== correct) {
      setFeedback("Try again using the evidence from the two tanks.");
      return;
    }
    if (challengeAnswersRef.current[question]) return;
    const next = { ...challengeAnswersRef.current, [question]: true };
    challengeAnswersRef.current = next;
    setChallengeAnswers(next);
    awardStar();
    setFeedback("Correct! That matches the experiment.");
  };

  const sortObservation = (tank: TankKey, outcome: EggOutcome) => {
    const correct = tank === "ordinary" ? "sink" : "float";
    if (outcome !== correct) {
      setFeedback(
        "Check the final egg positions in the experiment and try again.",
      );
      return;
    }
    if (sortAnswersRef.current[tank]) return;
    const next = { ...sortAnswersRef.current, [tank]: outcome };
    sortAnswersRef.current = next;
    setSortAnswers(next);
    if (next.ordinary && next.salt) awardStar();
    setFeedback("Observation sorted correctly.");
  };

  useEffect(() => {
    if (
      stage === 4 &&
      Object.keys(challengeAnswers).length === 3 &&
      sortAnswers.ordinary &&
      sortAnswers.salt
    ) {
      setCompleted(true);
      setFeedback(
        "Mission completed! You earned the Junior Marine Scientist badge.",
      );
      speak(
        "Congratulations. You discovered why salt water is denser and why people float more easily in the Dead Sea. You earned the Junior Marine Scientist badge.",
      );
    }
  }, [challengeAnswers, sortAnswers, stage]);

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

  const testsComplete = Boolean(tests.ordinary && tests.salt);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#083344",
        color: "#f8fafc",
      }}
    >
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {!started ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background:
              "radial-gradient(circle at 50% 28%, rgba(45,212,191,.22), rgba(2,18,32,.94) 58%)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "min(620px, 100%)",
              padding: "clamp(24px, 5vw, 42px)",
              borderRadius: 22,
              background: "rgba(3, 26, 39, .94)",
              border: "1px solid rgba(103,232,249,.28)",
              boxShadow: "0 28px 80px rgba(0,0,0,.38)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 62, marginBottom: 8 }}>🧂🌊🥚</div>
            <div
              style={{
                color: "#67e8f9",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              Class 5 · Chapter 7 · Activity 2
            </div>
            <h1
              style={{
                margin: "10px 0 12px",
                fontSize: "clamp(28px, 6vw, 44px)",
              }}
            >
              Dead Sea: Salt Water &amp; Its Effects
            </h1>
            <p
              style={{
                margin: "0 auto 22px",
                maxWidth: 500,
                color: "#bae6fd",
                lineHeight: 1.65,
              }}
            >
              Help Professor Aqua compare two tanks, dissolve salt, and discover
              why eggs and people float more easily in very salty water.
            </p>
            <button
              onClick={() => {
                setStarted(true);
                speak(NARRATIONS[0]);
              }}
              style={{
                width: "100%",
                padding: "13px 18px",
                borderRadius: 10,
                border: 0,
                background: "linear-gradient(135deg, #0d9488, #0284c7)",
                color: "white",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Begin the Dead Sea mission
            </button>
            <p style={{ margin: "14px 0 0", color: "#64748b", fontSize: 12 }}>
              Stationary experience · Browser, touch, and Meta Quest controls
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                minWidth: 0,
                padding: "9px 13px",
                borderRadius: 12,
                background: "rgba(2,18,32,.82)",
                border: "1px solid rgba(103,232,249,.24)",
                backdropFilter: "blur(9px)",
              }}
            >
              <div style={{ color: "#67e8f9", fontSize: 11, fontWeight: 800 }}>
                STAGE {stage + 1}/5 · {stars} ★
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
                  pointerEvents: "auto",
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1px solid rgba(103,232,249,.45)",
                  background: "rgba(13,148,136,.42)",
                  color: "#ecfeff",
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
              top: 116,
              right: 16,
              width: "min(350px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 142px)",
              overflowY: "auto",
              padding: 16,
              borderRadius: 16,
              background: "rgba(2,18,32,.93)",
              border: "1px solid rgba(103,232,249,.24)",
              backdropFilter: "blur(10px)",
              zIndex: 5,
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>
              {STAGES[stage].title}
            </h2>
            <p
              style={{
                margin: "0 0 10px",
                color: "#bae6fd",
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              {STAGES[stage].cue}
            </p>
            <div
              aria-live="polite"
              style={{
                padding: "9px 11px",
                borderRadius: 9,
                background: "rgba(45,212,191,.1)",
                color: "#ecfeff",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {feedback}
            </div>

            {stage === 0 ? (
              <div style={{ display: "grid", gap: 9 }}>
                {(["ordinary", "salt"] as TankKey[]).map((choice) => (
                  <button
                    key={choice}
                    onClick={() => setPrediction(choice)}
                    aria-pressed={prediction === choice}
                    style={{
                      padding: 11,
                      borderRadius: 9,
                      border: `1px solid ${prediction === choice ? "#2dd4bf" : "rgba(255,255,255,.13)"}`,
                      background:
                        prediction === choice
                          ? "rgba(45,212,191,.17)"
                          : "rgba(255,255,255,.04)",
                      color: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 700,
                    }}
                  >
                    {choice === "ordinary"
                      ? "💧 Ordinary water"
                      : "🧂 Salt water"}
                  </button>
                ))}
                <button
                  onClick={submitPrediction}
                  disabled={!prediction}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: prediction ? "#0d9488" : "#334155",
                    color: "white",
                    cursor: prediction ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Test my prediction →
                </button>
              </div>
            ) : null}

            {stage === 1 ? (
              <div style={{ display: "grid", gap: 9 }}>
                <button
                  onClick={() => testTank("ordinary")}
                  disabled={Boolean(tests.ordinary)}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: "1px solid #60a5fa",
                    background: tests.ordinary
                      ? "rgba(34,197,94,.13)"
                      : "rgba(37,99,235,.15)",
                    color: tests.ordinary ? "#86efac" : "#dbeafe",
                    cursor: tests.ordinary ? "default" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  {tests.ordinary
                    ? "✓ Egg sank in ordinary water"
                    : "Drop egg into Tank A"}
                </button>
                <button
                  onClick={() => testTank("salt")}
                  disabled={Boolean(tests.salt)}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: "1px solid #2dd4bf",
                    background: tests.salt
                      ? "rgba(34,197,94,.13)"
                      : "rgba(13,148,136,.16)",
                    color: tests.salt ? "#86efac" : "#ccfbf1",
                    cursor: tests.salt ? "default" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  {tests.salt
                    ? "✓ Egg floated in salty water"
                    : "Drop egg into Tank B"}
                </button>
                <button
                  onClick={() => goToStage(2)}
                  disabled={!testsComplete}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: testsComplete ? "#0284c7" : "#334155",
                    color: "white",
                    cursor: testsComplete ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Make my own salt water →
                </button>
                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: 11,
                    lineHeight: 1.45,
                  }}
                >
                  VR: point at a tank and press the trigger.
                </p>
              </div>
            ) : null}

            {stage === 2 ? (
              <div style={{ display: "grid", gap: 9 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#cbd5e1",
                  }}
                >
                  <span>Salt concentration</span>
                  <strong
                    style={{
                      color:
                        salinity >= FLOAT_THRESHOLD ? "#5eead4" : "#fde68a",
                    }}
                  >
                    {salinity}/5 spoonfuls
                  </strong>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    overflow: "hidden",
                    background: "rgba(255,255,255,.09)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${salinity * 20}%`,
                      background:
                        salinity >= FLOAT_THRESHOLD ? "#14b8a6" : "#f59e0b",
                      transition: "width .25s",
                    }}
                  />
                </div>
                <button
                  onClick={addSalt}
                  disabled={salinity >= 5}
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    border: "1px solid rgba(253,230,138,.5)",
                    background: "rgba(245,158,11,.13)",
                    color: "#fef3c7",
                    cursor: salinity >= 5 ? "default" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  🥄 Add one spoonful of salt
                </button>
                <button
                  onClick={stirWater}
                  disabled={salinity === 0}
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    border: "1px solid rgba(103,232,249,.45)",
                    background: stirred
                      ? "rgba(34,197,94,.13)"
                      : "rgba(14,116,144,.16)",
                    color: stirred ? "#86efac" : "#cffafe",
                    cursor: salinity === 0 ? "not-allowed" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  {stirred ? "✓ Salt dissolved" : "🪄 Stir the water"}
                </button>
                <button
                  onClick={() => testTank("ordinary")}
                  disabled={!stirred}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: stirred ? "#0d9488" : "#334155",
                    color: "white",
                    cursor: stirred ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  🥚 Drop egg into Tank A
                </button>
                <button
                  onClick={() => goToStage(3)}
                  disabled={!mixSuccess}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: mixSuccess ? "#7c3aed" : "#334155",
                    color: "white",
                    cursor: mixSuccess ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Reveal the scientific secret →
                </button>
              </div>
            ) : null}

            {stage === 3 ? (
              <div style={{ display: "grid", gap: 9 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    background: "rgba(45,212,191,.1)",
                    color: "#ccfbf1",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Dissolved salt adds matter to the same volume of water. The
                  denser water provides greater upward buoyant force.
                </div>
                <strong style={{ fontSize: 13 }}>
                  Why do people float more easily in the Dead Sea?
                </strong>
                <button
                  onClick={() => answerExplanation("magic")}
                  style={{
                    padding: 9,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.04)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  The sea is magical
                </button>
                <button
                  onClick={() => answerExplanation("density")}
                  style={{
                    padding: 9,
                    borderRadius: 8,
                    border: "1px solid #2dd4bf",
                    background: explanationCorrect
                      ? "rgba(34,197,94,.13)"
                      : "rgba(13,148,136,.15)",
                    color: explanationCorrect ? "#86efac" : "#ccfbf1",
                    cursor: "pointer",
                  }}
                >
                  {explanationCorrect ? "✓ " : ""}Salt makes the water denser
                </button>
                <button
                  onClick={() => goToStage(4)}
                  disabled={!explanationCorrect}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: explanationCorrect ? "#7c3aed" : "#334155",
                    color: "white",
                    cursor: explanationCorrect ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Start the final challenge →
                </button>
              </div>
            ) : null}

            {stage === 4 && !completed ? (
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  {
                    q: "1. What makes Dead Sea water different?",
                    options: [
                      ["salt", "It contains much more salt"],
                      ["sugar", "It contains more sugar"],
                    ],
                  },
                  {
                    q: "2. What happens when salt dissolves?",
                    options: [
                      ["denser", "Water becomes denser"],
                      ["less", "Water becomes less dense"],
                    ],
                  },
                  {
                    q: "3. Where will an egg float more easily?",
                    options: [
                      ["ordinary", "Ordinary water"],
                      ["salty", "Sufficiently salty water"],
                    ],
                  },
                ].map((item, index) => (
                  <div
                    key={item.q}
                    style={{
                      padding: 10,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {challengeAnswers[index] ? "✓ " : ""}
                      {item.q}
                    </strong>
                    {!challengeAnswers[index] ? (
                      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                        {item.options.map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => answerChallenge(index, value)}
                            style={{
                              padding: 8,
                              borderRadius: 7,
                              border: "1px solid rgba(103,232,249,.25)",
                              background: "rgba(14,116,144,.1)",
                              color: "#cffafe",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                {(["ordinary", "salt"] as TankKey[]).map((tank) => (
                  <div
                    key={tank}
                    style={{
                      padding: 10,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {sortAnswers[tank] ? "✓ " : ""}
                      {tank === "ordinary"
                        ? "Ordinary water:"
                        : "Sufficiently salty water:"}
                    </strong>
                    {!sortAnswers[tank] ? (
                      <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                        {(["sink", "float"] as EggOutcome[]).map((outcome) => (
                          <button
                            key={outcome}
                            onClick={() => sortObservation(tank, outcome)}
                            style={{
                              flex: 1,
                              padding: 8,
                              borderRadius: 7,
                              border: `1px solid ${outcome === "float" ? "#4ade80" : "#f87171"}`,
                              background:
                                outcome === "float"
                                  ? "rgba(34,197,94,.1)"
                                  : "rgba(239,68,68,.1)",
                              color:
                                outcome === "float" ? "#86efac" : "#fca5a5",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Egg {outcome}s
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {stage === 4 && completed ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 66 }}>🏅</div>
                <h3 style={{ color: "#fde68a", margin: "4px 0" }}>
                  Junior Marine Scientist
                </h3>
                <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.55 }}>
                  You earned {stars} stars and explained how dissolved salt
                  increases water density and buoyant support.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 9,
                    border: "1px solid rgba(103,232,249,.4)",
                    background: "rgba(13,148,136,.28)",
                    color: "#ecfeff",
                    cursor: "pointer",
                    fontWeight: 700,
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
              background: "rgba(2,18,32,.74)",
              color: "#94a3b8",
              fontSize: 11,
              zIndex: 4,
            }}
          >
            Click tanks and tools · Drag to look around · Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}
