"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type SubstanceKey = "sugar" | "salt" | "sand" | "oil" | "flour" | "stones";
type Category = "soluble" | "insoluble";
type ExperimentPhase = "idle" | "adding" | "stirring" | "observed";

interface SubstanceDefinition {
  label: string;
  emoji: string;
  color: number;
  category: Category;
  result: string;
}

const SUBSTANCES: Record<SubstanceKey, SubstanceDefinition> = {
  sugar: {
    label: "Sugar",
    emoji: "🍬",
    color: 0xfff7ed,
    category: "soluble",
    result:
      "Sugar crystals spread through the water and can no longer be seen.",
  },
  salt: {
    label: "Salt",
    emoji: "🧂",
    color: 0xf8fafc,
    category: "soluble",
    result: "Salt dissolves and forms a clear solution.",
  },
  sand: {
    label: "Sand",
    emoji: "🏖️",
    color: 0xd6a85f,
    category: "insoluble",
    result: "Sand remains visible and settles at the bottom.",
  },
  oil: {
    label: "Cooking oil",
    emoji: "🫗",
    color: 0xfacc15,
    category: "insoluble",
    result: "Oil forms droplets and a separate layer above the water.",
  },
  flour: {
    label: "Flour",
    emoji: "🌾",
    color: 0xf5e7ce,
    category: "insoluble",
    result: "Flour makes the water cloudy, but it does not truly dissolve.",
  },
  stones: {
    label: "Small stones",
    emoji: "🪨",
    color: 0x64748b,
    category: "insoluble",
    result: "The stones remain visible and settle at the bottom.",
  },
};

const SUBSTANCE_KEYS = Object.keys(SUBSTANCES) as SubstanceKey[];

const STAGES = [
  {
    title: "Meet the mystery substances",
    cue: "Inspect all six materials and predict whether each will dissolve or remain separate in water.",
  },
  {
    title: "The disappearing experiment",
    cue: "Choose a substance, add it to the glass, stir, and watch what happens. Test all six materials.",
  },
  {
    title: "Discover the secret",
    cue: "Compare dissolved particles with materials that remain visible, settle, cloud, or float.",
  },
  {
    title: "Water Detective challenge",
    cue: "Sort every substance into the soluble or insoluble group using your experimental evidence.",
  },
  {
    title: "Mystery solved",
    cue: "Review the evidence and receive your Junior Water Detective badge.",
  },
];

const NARRATIONS = [
  "Welcome to Professor Aqua's Magical Water Laboratory. Predict which of the six substances will dissolve in water and which will remain separate.",
  "Test your predictions. Add one substance to the water, stir it, and observe whether it dissolves, settles, clouds the water, or floats.",
  "Soluble substances spread throughout water to form a solution. Insoluble substances remain separate, even when they are very small or make the water cloudy.",
  "Final mission. Sort sugar, salt, sand, cooking oil, flour, and stones into the correct groups.",
  "Congratulations. You solved the disappearing mystery and earned the Junior Water Detective badge.",
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.04;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => voice.lang.startsWith("en-IN")) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;
  window.speechSynthesis.speak(utterance);
}

function setAction(object: THREE.Object3D, action: string) {
  object.userData.action = action;
  object.traverse((child) => {
    child.userData.action = action;
  });
}

function labelSprite(text: string, accent: string, width = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 150;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();
  context.fillStyle = "rgba(3, 20, 36, .92)";
  context.roundRect(6, 6, 628, 138, 28);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = "#f8fafc";
  context.font = "700 42px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 320, 76);
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

function drawMissionBoard(
  canvas: HTMLCanvasElement,
  stage: number,
  stars: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#082f49";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#22d3ee";
  context.lineWidth = 8;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.fillStyle = "#67e8f9";
  context.font = "700 27px sans-serif";
  context.fillText(`PROFESSOR AQUA  •  ${stage + 1}/5`, 34, 46);
  context.fillStyle = "#f8fafc";
  context.font = "800 40px sans-serif";
  context.fillText(STAGES[stage].title, 34, 99);
  context.fillStyle = "#cffafe";
  context.font = "26px sans-serif";
  const words = STAGES[stage].cue.split(" ");
  let line = "";
  let y = 145;
  for (const word of words) {
    const next = `${line}${word} `;
    if (context.measureText(next).width > canvas.width - 70 && line) {
      context.fillText(line.trim(), 34, y);
      line = `${word} `;
      y += 34;
    } else {
      line = next;
    }
  }
  context.fillText(line.trim(), 34, y);
  context.fillStyle = "#fde68a";
  context.font = "700 24px sans-serif";
  context.fillText(`Stars: ${stars}  ★`, canvas.width - 184, 46);
}

function hierarchyVisible(object: THREE.Object3D | null) {
  let current = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}

export default function SolubleInsolubleViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageRef = useRef(0);
  const scoreRef = useRef(0);
  const activeRef = useRef<SubstanceKey>("sugar");
  const phaseRef = useRef<ExperimentPhase>("idle");
  const testedRef = useRef<Partial<Record<SubstanceKey, boolean>>>({});
  const sortedRef = useRef<Partial<Record<SubstanceKey, Category>>>({});
  const explanationRef = useRef(false);
  const experimentStartedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const stageVisualRef = useRef<(stage: number) => void>(() => undefined);
  const boardUpdateRef = useRef<() => void>(() => undefined);
  const experimentVisualRef = useRef<
    (key: SubstanceKey, phase: ExperimentPhase) => void
  >(() => undefined);
  const actionRef = useRef<(action: string) => void>(() => undefined);

  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState(0);
  const [predictions, setPredictions] = useState<
    Partial<Record<SubstanceKey, Category>>
  >({});
  const [active, setActive] = useState<SubstanceKey>("sugar");
  const [phase, setPhase] = useState<ExperimentPhase>("idle");
  const [tested, setTested] = useState<Partial<Record<SubstanceKey, boolean>>>(
    {},
  );
  const [explanationCorrect, setExplanationCorrect] = useState(false);
  const [sorted, setSorted] = useState<Partial<Record<SubstanceKey, Category>>>(
    {},
  );
  const [feedback, setFeedback] = useState(
    "What will dissolve, and what will remain separate?",
  );

  const awardStar = useCallback(() => {
    scoreRef.current += 1;
    setStars(scoreRef.current);
    boardUpdateRef.current();
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

  const selectSubstance = useCallback((key: SubstanceKey) => {
    activeRef.current = key;
    phaseRef.current = "idle";
    setActive(key);
    setPhase("idle");
    setFeedback(`${SUBSTANCES[key].label} is ready. Add it to the water.`);
    experimentVisualRef.current(key, "idle");
  }, []);

  const addSubstance = useCallback(() => {
    const key = activeRef.current;
    phaseRef.current = "adding";
    experimentStartedAtRef.current = performance.now();
    setPhase("adding");
    setFeedback(`You added ${SUBSTANCES[key].label}. Now stir the water.`);
    experimentVisualRef.current(key, "adding");
  }, []);

  const stirSubstance = useCallback(() => {
    if (phaseRef.current === "idle") return;
    const key = activeRef.current;
    phaseRef.current = "stirring";
    experimentStartedAtRef.current = performance.now();
    setPhase("stirring");
    setFeedback(`Stirring ${SUBSTANCES[key].label} into the water…`);
    experimentVisualRef.current(key, "stirring");
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      phaseRef.current = "observed";
      setPhase("observed");
      experimentVisualRef.current(key, "observed");
      setFeedback(
        `${SUBSTANCES[key].result} It is ${SUBSTANCES[key].category}.`,
      );
      if (!testedRef.current[key]) {
        const nextTests = { ...testedRef.current, [key]: true };
        testedRef.current = nextTests;
        setTested(nextTests);
        awardStar();
      }
    }, 1350);
  }, [awardStar]);

  const replayExperiment = useCallback(() => {
    phaseRef.current = "idle";
    setPhase("idle");
    setFeedback(
      `${SUBSTANCES[activeRef.current].label} is ready to test again.`,
    );
    experimentVisualRef.current(activeRef.current, "idle");
  }, []);

  const answerExplanation = useCallback(
    (answer: "vanished" | "spread") => {
      if (answer === "spread") {
        setFeedback(
          "Correct! Dissolved sugar still exists. Its tiny particles spread throughout the water.",
        );
        if (!explanationRef.current) {
          explanationRef.current = true;
          setExplanationCorrect(true);
          awardStar();
        }
      } else {
        setFeedback(
          "Look closer: the sugar is difficult to see, but its particles are still mixed through the water.",
        );
      }
    },
    [awardStar],
  );

  const sortSubstance = useCallback(
    (key: SubstanceKey, category: Category) => {
      const correct = SUBSTANCES[key].category;
      if (category !== correct) {
        const hint =
          key === "oil"
            ? "Watch for the separate layer above the water."
            : key === "flour"
              ? "Cloudy water is not always a true solution."
              : "Use the final position of the material as your clue.";
        setFeedback(`Try again. ${hint}`);
        return;
      }
      if (!sortedRef.current[key]) {
        const nextSorted = { ...sortedRef.current, [key]: category };
        sortedRef.current = nextSorted;
        setSorted(nextSorted);
        awardStar();
      }
      setFeedback(
        `${SUBSTANCES[key].label} is ${category}. Excellent evidence!`,
      );
    },
    [awardStar],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06354a);
    scene.fog = new THREE.Fog(0x06354a, 8, 22);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.05,
      60,
    );
    camera.position.set(0, 2.25, 5.9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.35, -0.7);
    controls.enableDamping = true;
    controls.minDistance = 3.8;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.54;

    scene.add(new THREE.HemisphereLight(0x9defff, 0x052239, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const aquaLight = new THREE.PointLight(0x22d3ee, 15, 10);
    aquaLight.position.set(-3.4, 2.5, -1);
    scene.add(aquaLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.MeshStandardMaterial({ color: 0x082f49, roughness: 0.72 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(13, 40, 24),
      new THREE.MeshBasicMaterial({
        color: 0x0e7490,
        transparent: true,
        opacity: 0.11,
        side: THREE.BackSide,
      }),
    );
    scene.add(dome);

    const windowFrame = new THREE.Mesh(
      new THREE.TorusGeometry(3.25, 0.16, 16, 64),
      new THREE.MeshStandardMaterial({
        color: 0x155e75,
        metalness: 0.75,
        roughness: 0.24,
      }),
    );
    windowFrame.position.set(0, 2.85, -4.2);
    scene.add(windowFrame);
    const windowWater = new THREE.Mesh(
      new THREE.CircleGeometry(3.1, 64),
      new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.32,
      }),
    );
    windowWater.position.set(0, 2.85, -4.24);
    scene.add(windowWater);

    const bubbles: THREE.Mesh[] = [];
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb6f3ff,
      transparent: true,
      opacity: 0.28,
      transmission: 0.65,
      roughness: 0.05,
    });
    for (let index = 0; index < 42; index += 1) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.025 + (index % 4) * 0.008, 10, 8),
        bubbleMaterial,
      );
      bubble.position.set(
        -5 + ((index * 1.73) % 10),
        0.2 + ((index * 0.47) % 5.3),
        -3.8 + ((index * 0.83) % 5),
      );
      bubble.userData.speed = 0.0028 + (index % 5) * 0.00055;
      bubbles.push(bubble);
      scene.add(bubble);
    }

    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.22, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.54 }),
    );
    bench.position.set(0, 0.84, -0.92);
    bench.castShadow = true;
    bench.receiveShadow = true;
    scene.add(bench);
    [-3.2, 3.2].forEach((x) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 1.45, 1.65),
        new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.62 }),
      );
      leg.position.set(x, 0.12, -0.92);
      scene.add(leg);
    });

    const interactive: THREE.Object3D[] = [];
    const jarsGroup = new THREE.Group();
    const jarX = [-2.75, -1.68, -0.61, 0.61, 1.68, 2.75];
    SUBSTANCE_KEYS.forEach((key, index) => {
      const definition = SUBSTANCES[key];
      const group = new THREE.Group();
      group.position.set(jarX[index], 1.32, -1.25);
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.32, 0.68, 24, 1, true),
        new THREE.MeshPhysicalMaterial({
          color: 0xdff7ff,
          transparent: true,
          opacity: 0.3,
          transmission: 0.54,
          roughness: 0.08,
          side: THREE.DoubleSide,
        }),
      );
      glass.castShadow = true;
      const contents = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.29,
          0.27,
          key === "stones" ? 0.28 : 0.36,
          22,
        ),
        new THREE.MeshStandardMaterial({
          color: definition.color,
          roughness: key === "oil" ? 0.2 : 0.72,
          transparent: key === "oil",
          opacity: key === "oil" ? 0.82 : 1,
        }),
      );
      contents.position.y = -0.12;
      group.add(glass, contents);
      const label = labelSprite(
        definition.label.toUpperCase(),
        "#22d3ee",
        0.68,
      );
      label.position.y = -0.55;
      group.add(label);
      setAction(group, `select:${key}`);
      interactive.push(glass, contents);
      jarsGroup.add(group);
    });
    scene.add(jarsGroup);

    const experimentGroup = new THREE.Group();
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcffafe,
      transparent: true,
      opacity: 0.2,
      transmission: 0.64,
      roughness: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const experimentGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.68, 1.58, 36, 1, true),
      glassMaterial,
    );
    experimentGlass.position.set(0, 1.78, -0.75);
    experimentGlass.castShadow = true;
    experimentGroup.add(experimentGlass);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.48,
      transmission: 0.44,
      roughness: 0.08,
      depthWrite: false,
    });
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.73, 0.64, 1.18, 36),
      waterMaterial,
    );
    water.position.set(0, 1.62, -0.75);
    experimentGroup.add(water);
    const glassLabel = labelSprite("EXPERIMENT GLASS", "#67e8f9", 1.05);
    glassLabel.position.set(0, 0.68, -0.72);
    experimentGroup.add(glassLabel);

    const particleGroup = new THREE.Group();
    const particles: THREE.Mesh[] = [];
    for (let index = 0; index < 58; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.022 + (index % 3) * 0.009, 9, 7),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62 }),
      );
      particle.visible = false;
      particle.userData.index = index;
      particles.push(particle);
      particleGroup.add(particle);
    }
    experimentGroup.add(particleGroup);

    const oilLayer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.73, 0.71, 0.13, 36),
      new THREE.MeshPhysicalMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.76,
        roughness: 0.16,
      }),
    );
    oilLayer.position.set(0, 2.22, -0.75);
    oilLayer.visible = false;
    experimentGroup.add(oilLayer);

    const spoon = new THREE.Group();
    const spoonMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.78,
      roughness: 0.22,
    });
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.15, 12),
      spoonMaterial,
    );
    handle.rotation.z = -0.33;
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 10),
      spoonMaterial,
    );
    bowl.scale.set(0.72, 1, 0.36);
    bowl.position.set(0.19, -0.54, 0);
    spoon.add(handle, bowl);
    spoon.position.set(1.05, 1.82, -0.62);
    setAction(spoon, "stir");
    interactive.push(handle, bowl);
    experimentGroup.add(spoon);
    scene.add(experimentGroup);

    const doorsGroup = new THREE.Group();
    const makeDoor = (x: number, color: number, text: string) => {
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.15, 2.75, 0.2),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.16,
          roughness: 0.38,
        }),
      );
      door.position.set(x, 2.06, -2.35);
      door.castShadow = true;
      const label = labelSprite(text, x < 0 ? "#34d399" : "#fb923c", 1.5);
      label.position.set(x, 2.15, -2.2);
      doorsGroup.add(door, label);
    };
    makeDoor(-1.35, 0x047857, "SOLUBLE  •  DISSOLVES");
    makeDoor(1.35, 0xc2410c, "INSOLUBLE  •  STAYS SEPARATE");
    doorsGroup.visible = false;
    scene.add(doorsGroup);

    const professor = new THREE.Group();
    const coat = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 0.72, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.64 }),
    );
    coat.position.y = 1.02;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0x8dd7de, roughness: 0.5 }),
    );
    head.position.y = 1.78;
    const glasses = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.018, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6 }),
    );
    glasses.position.set(0, 1.8, 0.25);
    professor.add(coat, head, glasses);
    professor.position.set(-3.4, 0.18, 0.5);
    professor.rotation.y = 0.2;
    scene.add(professor);

    const badgeGroup = new THREE.Group();
    const badge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.14, 36),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.28,
        metalness: 0.55,
        roughness: 0.22,
      }),
    );
    badge.rotation.x = Math.PI / 2;
    const badgeLabel = labelSprite("JUNIOR WATER DETECTIVE", "#fde68a", 1.85);
    badgeLabel.position.y = -1.05;
    badgeGroup.add(badge, badgeLabel);
    badgeGroup.position.set(0, 2.1, -0.5);
    badgeGroup.visible = false;
    scene.add(badgeGroup);

    const boardCanvas = document.createElement("canvas");
    boardCanvas.width = 900;
    boardCanvas.height = 330;
    drawMissionBoard(boardCanvas, 0, 0);
    const boardTexture = new THREE.CanvasTexture(boardCanvas);
    boardTexture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(4.35, 1.59),
      new THREE.MeshBasicMaterial({ map: boardTexture }),
    );
    board.position.set(0, 4.25, -2.95);
    scene.add(board);
    boardUpdateRef.current = () => {
      drawMissionBoard(boardCanvas, stageRef.current, scoreRef.current);
      boardTexture.needsUpdate = true;
    };

    experimentVisualRef.current = (key, nextPhase) => {
      const definition = SUBSTANCES[key];
      waterMaterial.color.set(
        key === "flour" && nextPhase !== "idle" ? 0xa8cbd2 : 0x38bdf8,
      );
      waterMaterial.opacity =
        key === "flour" && nextPhase === "observed" ? 0.72 : 0.48;
      oilLayer.visible = key === "oil" && nextPhase === "observed";
      spoon.visible = stageRef.current === 1;
      particles.forEach((particle, index) => {
        const angle = (index / particles.length) * Math.PI * 2 * 3.2;
        const ring = 0.14 + (index % 8) * 0.067;
        particle.visible = nextPhase !== "idle";
        const material = particle.material as THREE.MeshStandardMaterial;
        material.color.set(definition.color);
        material.transparent =
          definition.category === "soluble" || key === "flour";
        material.opacity = 1;
        particle.scale.setScalar(
          key === "stones" ? 2.2 : key === "oil" ? 1.7 : 1,
        );
        particle.position.set(
          Math.cos(angle) * ring,
          nextPhase === "adding" ? 2.45 + (index % 10) * 0.035 : 1.85,
          -0.75 + Math.sin(angle) * ring,
        );
      });
      experimentStartedAtRef.current = performance.now();
    };

    stageVisualRef.current = (nextStage) => {
      jarsGroup.visible = nextStage <= 1 || nextStage === 3;
      experimentGroup.visible = nextStage === 1 || nextStage === 2;
      doorsGroup.visible = nextStage === 2 || nextStage === 3;
      badgeGroup.visible = nextStage === 4;
      if (nextStage === 4) {
        professor.position.x = -2.1;
      } else {
        professor.position.x = -3.4;
      }
      boardUpdateRef.current();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handleAction = (action: string) => {
      if (action.startsWith("select:")) {
        const key = action.slice(7) as SubstanceKey;
        if (stageRef.current === 0) {
          setFeedback(
            `${SUBSTANCES[key].label}: predict whether it dissolves or remains separate.`,
          );
        } else if (stageRef.current === 1) {
          selectSubstance(key);
        }
      } else if (action === "stir" && stageRef.current === 1) {
        stirSubstance();
      }
    };
    actionRef.current = handleAction;

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(interactive, true)
        .find((entry) => hierarchyVisible(entry.object));
      let object: THREE.Object3D | null = hit?.object ?? null;
      while (object && !object.userData.action) object = object.parent;
      if (object?.userData.action)
        handleAction(object.userData.action as string);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const controllerModels: THREE.Group[] = [];
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -3.2),
        ]),
        new THREE.LineBasicMaterial({ color: 0x67e8f9 }),
      );
      controller.add(ray);
      controller.addEventListener("selectstart", () => {
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3(0, 0, -1);
        controller.getWorldPosition(origin);
        direction.applyQuaternion(
          controller.getWorldQuaternion(new THREE.Quaternion()),
        );
        raycaster.set(origin, direction);
        const hit = raycaster
          .intersectObjects(interactive, true)
          .find((entry) => hierarchyVisible(entry.object));
        let object: THREE.Object3D | null = hit?.object ?? null;
        while (object && !object.userData.action) object = object.parent;
        if (object?.userData.action)
          handleAction(object.userData.action as string);
      });
      scene.add(controller);
      controllerModels.push(controller);
    }

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      const now = performance.now();
      controls.update();

      bubbles.forEach((bubble) => {
        bubble.position.y += bubble.userData.speed as number;
        if (bubble.position.y > 5.8) bubble.position.y = 0.1;
      });

      professor.rotation.y = 0.15 + Math.sin(elapsed * 0.55) * 0.04;
      badgeGroup.rotation.y = elapsed * 0.55;
      if (badgeGroup.visible)
        badgeGroup.position.y = 2.1 + Math.sin(elapsed * 1.8) * 0.09;

      const currentKey = activeRef.current;
      const currentPhase = phaseRef.current;
      const duration = Math.min(
        (now - experimentStartedAtRef.current) / 1300,
        1,
      );
      particles.forEach((particle, index) => {
        if (!particle.visible) return;
        const material = particle.material as THREE.MeshStandardMaterial;
        const angle =
          (index / particles.length) * Math.PI * 6.4 + elapsed * 1.8;
        const ring = 0.12 + (index % 9) * 0.06;
        if (currentPhase === "adding") {
          particle.position.y = THREE.MathUtils.lerp(
            2.55 + (index % 8) * 0.04,
            1.55 + (index % 7) * 0.08,
            duration,
          );
        } else if (currentPhase === "stirring") {
          particle.position.x = Math.cos(angle) * ring;
          particle.position.z = -0.75 + Math.sin(angle) * ring;
          particle.position.y =
            1.35 + (index % 10) * 0.085 + Math.sin(angle * 0.7) * 0.08;
          spoon.rotation.y = elapsed * 5.5;
        } else if (currentPhase === "observed") {
          if (SUBSTANCES[currentKey].category === "soluble") {
            particle.position.x = Math.cos(angle * 0.42) * ring;
            particle.position.z = -0.75 + Math.sin(angle * 0.42) * ring;
            particle.position.y = 1.18 + (index % 12) * 0.09;
            material.opacity = 0.1;
          } else if (currentKey === "oil") {
            particle.position.x = Math.cos(angle * 0.32) * ring;
            particle.position.z = -0.75 + Math.sin(angle * 0.32) * ring;
            particle.position.y = 2.14 + (index % 4) * 0.035;
          } else if (currentKey === "flour") {
            particle.position.x = Math.cos(angle * 0.22) * ring;
            particle.position.z = -0.75 + Math.sin(angle * 0.22) * ring;
            particle.position.y = 1.2 + (index % 10) * 0.085;
            material.opacity = 0.42;
          } else {
            particle.position.x = Math.cos(angle * 0.08) * ring;
            particle.position.z = -0.75 + Math.sin(angle * 0.08) * ring;
            particle.position.y = 1.08 + (index % 4) * 0.025;
          }
        }
      });

      renderer.render(scene, camera);
    });

    const onResize = () => {
      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);
    stageVisualRef.current(0);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.setAnimationLoop(null);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if ("map" in material && material.map instanceof THREE.Texture) {
              material.map.dispose();
            }
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      boardUpdateRef.current = () => undefined;
      controllerModels.length = 0;
      window.speechSynthesis?.cancel();
    };
  }, [selectSubstance, stirSubstance]);

  const enterVR = useCallback(async () => {
    const renderer = rendererRef.current;
    const xr = (
      navigator as Navigator & {
        xr?: {
          requestSession(
            mode: string,
            options?: {
              requiredFeatures?: string[];
              optionalFeatures?: string[];
            },
          ): Promise<XRSession>;
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

  const predictionsComplete = SUBSTANCE_KEYS.every((key) => predictions[key]);
  const experimentsComplete = SUBSTANCE_KEYS.every((key) => tested[key]);
  const sortingComplete = SUBSTANCE_KEYS.every((key) => sorted[key]);

  const controlButton = (
    activeButton: boolean,
    accent = "#22d3ee",
  ): React.CSSProperties => ({
    padding: "9px 10px",
    borderRadius: 8,
    border: `1px solid ${activeButton ? accent : "rgba(255,255,255,.13)"}`,
    background: activeButton ? `${accent}22` : "rgba(255,255,255,.04)",
    color: "#f8fafc",
    cursor: "pointer",
    fontWeight: 700,
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#06354a",
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
              "radial-gradient(circle at 50% 26%, rgba(34,211,238,.22), rgba(2,18,32,.95) 60%)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "min(650px, 100%)",
              padding: "clamp(24px, 5vw, 42px)",
              borderRadius: 22,
              background: "rgba(3, 26, 39, .95)",
              border: "1px solid rgba(103,232,249,.28)",
              boxShadow: "0 28px 80px rgba(0,0,0,.38)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 60, marginBottom: 8 }}>🧪💧✨</div>
            <div
              style={{
                color: "#67e8f9",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              Class 5 · Chapter 7 · Activity 3
            </div>
            <h1
              style={{
                margin: "10px 0 12px",
                fontSize: "clamp(27px, 6vw, 43px)",
              }}
            >
              The Disappearing Mystery
            </h1>
            <p
              style={{
                margin: "0 auto 22px",
                maxWidth: 540,
                color: "#bae6fd",
                lineHeight: 1.65,
              }}
            >
              Help Professor Aqua test sugar, salt, sand, oil, flour, and
              stones. Discover why some materials seem to disappear while others
              remain separate.
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
                background: "linear-gradient(135deg, #0891b2, #0d9488)",
                color: "white",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Enter Professor Aqua&apos;s laboratory
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
                background: "rgba(2,18,32,.84)",
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
                  background: "rgba(8,145,178,.44)",
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
              top: 112,
              right: 16,
              width: "min(370px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 138px)",
              overflowY: "auto",
              padding: 16,
              borderRadius: 16,
              background: "rgba(2,18,32,.94)",
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
                lineHeight: 1.5,
              }}
            >
              {STAGES[stage].cue}
            </p>
            <div
              aria-live="polite"
              style={{
                padding: "9px 11px",
                borderRadius: 9,
                background: "rgba(34,211,238,.1)",
                color: "#ecfeff",
                fontSize: 13,
                marginBottom: 12,
                lineHeight: 1.45,
              }}
            >
              {feedback}
            </div>

            {stage === 0 ? (
              <div style={{ display: "grid", gap: 9 }}>
                {SUBSTANCE_KEYS.map((key) => (
                  <div
                    key={key}
                    style={{
                      padding: 9,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {SUBSTANCES[key].emoji} {SUBSTANCES[key].label}
                    </strong>
                    <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                      {(["soluble", "insoluble"] as Category[]).map(
                        (category) => (
                          <button
                            key={category}
                            onClick={() =>
                              setPredictions((current) => ({
                                ...current,
                                [key]: category,
                              }))
                            }
                            aria-pressed={predictions[key] === category}
                            style={{
                              ...controlButton(
                                predictions[key] === category,
                                category === "soluble" ? "#34d399" : "#fb923c",
                              ),
                              flex: 1,
                              padding: 7,
                              fontSize: 12,
                            }}
                          >
                            {category === "soluble"
                              ? "Will dissolve"
                              : "Stay separate"}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => goToStage(1)}
                  disabled={!predictionsComplete}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: predictionsComplete ? "#0891b2" : "#334155",
                    color: "white",
                    cursor: predictionsComplete ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Test my predictions →
                </button>
              </div>
            ) : null}

            {stage === 1 ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6,
                  }}
                >
                  {SUBSTANCE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => selectSubstance(key)}
                      aria-pressed={active === key}
                      style={{
                        ...controlButton(active === key),
                        padding: "8px 4px",
                        fontSize: 11,
                        color: tested[key] ? "#86efac" : "#f8fafc",
                      }}
                    >
                      {tested[key] ? "✓ " : ""}
                      {SUBSTANCES[key].emoji} {SUBSTANCES[key].label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    background: "rgba(255,255,255,.04)",
                  }}
                >
                  <strong>
                    {SUBSTANCES[active].emoji} {SUBSTANCES[active].label}
                  </strong>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#94a3b8",
                      fontSize: 12,
                    }}
                  >
                    Prediction: {predictions[active] ?? "not recorded"}
                  </p>
                </div>
                <button
                  onClick={addSubstance}
                  disabled={phase === "adding" || phase === "stirring"}
                  style={{
                    ...controlButton(phase !== "idle", "#fbbf24"),
                    cursor:
                      phase === "adding" || phase === "stirring"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  🥄 Add {SUBSTANCES[active].label} to water
                </button>
                <button
                  onClick={stirSubstance}
                  disabled={phase === "idle" || phase === "stirring"}
                  style={{
                    ...controlButton(phase === "stirring", "#22d3ee"),
                    cursor:
                      phase === "idle" || phase === "stirring"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  🥄 Stir and observe
                </button>
                {phase === "observed" ? (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 9,
                      background:
                        SUBSTANCES[active].category === "soluble"
                          ? "rgba(52,211,153,.12)"
                          : "rgba(251,146,60,.12)",
                      color: "#f8fafc",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ textTransform: "uppercase" }}>
                      {SUBSTANCES[active].category}
                    </strong>
                    <br />
                    {SUBSTANCES[active].result}
                  </div>
                ) : null}
                <button onClick={replayExperiment} style={controlButton(false)}>
                  ↻ Replay this experiment
                </button>
                <button
                  onClick={() => goToStage(2)}
                  disabled={!experimentsComplete}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: experimentsComplete ? "#7c3aed" : "#334155",
                    color: "white",
                    cursor: experimentsComplete ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Reveal the disappearing secret →
                </button>
              </div>
            ) : null}

            {stage === 2 ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    background: "rgba(52,211,153,.1)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "#86efac" }}>SOLUBLE:</strong> Sugar
                  and salt break into tiny particles and spread throughout the
                  water, forming a solution.
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    background: "rgba(251,146,60,.1)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "#fdba74" }}>INSOLUBLE:</strong> Sand,
                  oil, flour, and stones stay separate. They may settle, float,
                  or make the water cloudy.
                </div>
                <strong style={{ fontSize: 13 }}>
                  Where did the sugar go after stirring?
                </strong>
                <button
                  onClick={() => answerExplanation("vanished")}
                  style={controlButton(false)}
                >
                  It vanished and no longer exists
                </button>
                <button
                  onClick={() => answerExplanation("spread")}
                  style={controlButton(explanationCorrect, "#34d399")}
                >
                  {explanationCorrect ? "✓ " : ""}Its particles spread through
                  the water
                </button>
                <button
                  onClick={() => goToStage(3)}
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
                  Start the Water Detective challenge →
                </button>
              </div>
            ) : null}

            {stage === 3 ? (
              <div style={{ display: "grid", gap: 9 }}>
                {SUBSTANCE_KEYS.map((key) => (
                  <div
                    key={key}
                    style={{
                      padding: 9,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {sorted[key] ? "✓ " : ""}
                      {SUBSTANCES[key].emoji} {SUBSTANCES[key].label}
                    </strong>
                    {!sorted[key] ? (
                      <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                        {(["soluble", "insoluble"] as Category[]).map(
                          (category) => (
                            <button
                              key={category}
                              onClick={() => sortSubstance(key, category)}
                              style={{
                                ...controlButton(
                                  false,
                                  category === "soluble"
                                    ? "#34d399"
                                    : "#fb923c",
                                ),
                                flex: 1,
                                padding: 7,
                              }}
                            >
                              {category === "soluble" ? "Soluble" : "Insoluble"}
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 4,
                          color:
                            sorted[key] === "soluble" ? "#86efac" : "#fdba74",
                          fontSize: 12,
                          textTransform: "uppercase",
                        }}
                      >
                        {sorted[key]}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => goToStage(4)}
                  disabled={!sortingComplete}
                  style={{
                    padding: 11,
                    borderRadius: 9,
                    border: 0,
                    background: sortingComplete ? "#0d9488" : "#334155",
                    color: "white",
                    cursor: sortingComplete ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  Complete the mission →
                </button>
              </div>
            ) : null}

            {stage === 4 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 68 }}>🏅🕵️</div>
                <h3 style={{ color: "#fde68a", margin: "4px 0" }}>
                  Junior Water Detective
                </h3>
                <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.55 }}>
                  You earned {stars} stars. Sugar and salt are soluble. Sand,
                  cooking oil, flour, and stones are insoluble.
                </p>
                <p style={{ color: "#67e8f9", fontSize: 13, lineHeight: 1.55 }}>
                  Something can become invisible in water without disappearing
                  from existence.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 9,
                    border: "1px solid rgba(103,232,249,.4)",
                    background: "rgba(8,145,178,.28)",
                    color: "#ecfeff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Solve the mystery again
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
              background: "rgba(2,18,32,.76)",
              color: "#94a3b8",
              fontSize: 11,
              zIndex: 4,
            }}
          >
            Select jars and tools · Drag to look around · Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}
