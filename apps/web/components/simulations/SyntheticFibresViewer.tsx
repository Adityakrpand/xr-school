"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type ScanKey = "cotton" | "wool" | "silk" | "nylon" | "polyester" | "acrylic";
type FibreKey = "rayon" | "nylon" | "polyester" | "acrylic";
type PolyesterTask = "wrinkle" | "dry" | "polycot" | "polywool";
type AcrylicTask = "weight" | "warmth" | "product";

interface FibreDefinition {
  label: string;
  emoji: string;
  color: number;
  accent: string;
  property: string;
  use: string;
}

const FIBRES: Record<FibreKey, FibreDefinition> = {
  rayon: {
    label: "Rayon",
    emoji: "✨",
    color: 0x7dd3fc,
    accent: "#7dd3fc",
    property: "Silk-like and absorbent",
    use: "Dresses and curtains",
  },
  nylon: {
    label: "Nylon",
    emoji: "🪢",
    color: 0xfb7185,
    accent: "#fb7185",
    property: "Strong, light, and elastic",
    use: "Ropes and parachutes",
  },
  polyester: {
    label: "Polyester",
    emoji: "👕",
    color: 0x34d399,
    accent: "#34d399",
    property: "Durable and wrinkle-resistant",
    use: "Clothes and PET products",
  },
  acrylic: {
    label: "Acrylic",
    emoji: "🧶",
    color: 0xc084fc,
    accent: "#c084fc",
    property: "Warm, light, and wool-like",
    use: "Sweaters and blankets",
  },
};

const FIBRE_KEYS = Object.keys(FIBRES) as FibreKey[];

const SCAN_ITEMS: Record<
  ScanKey,
  {
    label: string;
    emoji: string;
    category: "Natural" | "Human-Made";
    result: string;
  }
> = {
  cotton: {
    label: "Cotton cloth",
    emoji: "☁️",
    category: "Natural",
    result: "Natural fibre obtained from a plant.",
  },
  wool: {
    label: "Woollen cloth",
    emoji: "🐑",
    category: "Natural",
    result: "Natural fibre obtained from an animal.",
  },
  silk: {
    label: "Silk fabric",
    emoji: "🦋",
    category: "Natural",
    result: "Natural fibre obtained from silkworm cocoons.",
  },
  nylon: {
    label: "Nylon rope",
    emoji: "🪢",
    category: "Human-Made",
    result: "Nylon is a fully synthetic fibre.",
  },
  polyester: {
    label: "Polyester shirt",
    emoji: "👕",
    category: "Human-Made",
    result: "Polyester is a fully synthetic fibre.",
  },
  acrylic: {
    label: "Acrylic sweater",
    emoji: "🧥",
    category: "Human-Made",
    result: "Acrylic is a fully synthetic, wool-like fibre.",
  },
};

const SCAN_KEYS = Object.keys(SCAN_ITEMS) as ScanKey[];

const STAGES = [
  {
    title: "Scan the fibre laboratory",
    cue: "Scan any three materials to reveal their fibres and identify them as natural or human-made.",
  },
  {
    title: "Make a synthetic fibre",
    cue: "Soften polymer, use the spinneret, stretch the strands, and wind the finished fibre onto a spool.",
  },
  {
    title: "Explore rayon — artificial silk",
    cue: "Transform wood-pulp cellulose into rayon, compare its shine with silk, and test its absorbency.",
  },
  {
    title: "Test nylon — the strong fibre",
    cue: "Stretch nylon, add weights, and inspect products that need strength, lightness, and elasticity.",
  },
  {
    title: "Test polyester — easy care",
    cue: "Run wrinkle and drying tests, then create polycot and polywool blends.",
  },
  {
    title: "Feel the warmth of acrylic",
    cue: "Compare acrylic with wool using weight, warmth, and product tests.",
  },
  {
    title: "Compare fibres and lock out heat",
    cue: "Match each fibre to its key property and protect synthetic fabric from fire and hot objects.",
  },
  {
    title: "Unlock the Synthetic Fibre Vault",
    cue: "Identify products, classify properties, and complete the safety lock to open the vault.",
  },
];

const NARRATIONS = [
  "Welcome to the fibre laboratory. Scan natural and human-made materials to reveal the fibres inside them.",
  "Synthetic fibres are manufactured mainly from chemical substances. Soften polymer, push it through a spinneret, stretch the strands, and wind them into fibre.",
  "Rayon is made by chemically processing cellulose from wood pulp. It is regenerated or semi-synthetic, resembles silk, and absorbs water.",
  "Nylon was the first fully synthetic fibre. It is strong, lightweight, elastic, and resistant to wear.",
  "Polyester is durable, wrinkle-resistant, and quick-drying. It can blend with cotton to make polycot and wool to make polywool.",
  "Acrylic resembles wool. It is warm, lightweight, affordable, and used in sweaters, blankets, carpets, and artificial fur.",
  "Match rayon, nylon, polyester, and acrylic to their special properties. Keep synthetic fabrics away from flames because heat can soften or melt them.",
  "Complete the final fibre vault challenges using the evidence you collected in the laboratory.",
];

const VAULT_ITEMS = [
  { label: "Shiny curtain", emoji: "🪟", answer: "rayon" as FibreKey },
  { label: "Strong rope", emoji: "🪢", answer: "nylon" as FibreKey },
  {
    label: "Wrinkle-resistant shirt",
    emoji: "👕",
    answer: "polyester" as FibreKey,
  },
  { label: "Wool-like sweater", emoji: "🧥", answer: "acrylic" as FibreKey },
  { label: "Artificial silk", emoji: "✨", answer: "rayon" as FibreKey },
  { label: "Strong and elastic", emoji: "💪", answer: "nylon" as FibreKey },
  { label: "Quick-drying", emoji: "💨", answer: "polyester" as FibreKey },
  { label: "Artificial wool", emoji: "🧶", answer: "acrylic" as FibreKey },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.02;
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
  context.fillStyle = "rgba(14, 10, 35, .92)";
  context.roundRect(6, 6, 628, 138, 28);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = "#f8fafc";
  context.font = "700 40px sans-serif";
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
  context.fillStyle = "#17103a";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#a78bfa";
  context.lineWidth = 8;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.fillStyle = "#c4b5fd";
  context.font = "700 27px sans-serif";
  context.fillText(`FIBRE LAB  •  ${stage + 1}/8`, 34, 46);
  context.fillStyle = "#f8fafc";
  context.font = "800 39px sans-serif";
  context.fillText(STAGES[stage].title, 34, 99);
  context.fillStyle = "#ddd6fe";
  context.font = "25px sans-serif";
  const words = STAGES[stage].cue.split(" ");
  let line = "";
  let y = 145;
  for (const word of words) {
    const next = `${line}${word} `;
    if (context.measureText(next).width > canvas.width - 70 && line) {
      context.fillText(line.trim(), 34, y);
      line = `${word} `;
      y += 33;
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

function choiceStyle(selected: boolean, accent = "#a78bfa"): CSSProperties {
  return {
    padding: "8px 9px",
    borderRadius: 8,
    border: `1px solid ${selected ? accent : "rgba(255,255,255,.13)"}`,
    background: selected ? `${accent}24` : "rgba(255,255,255,.04)",
    color: "#f8fafc",
    cursor: "pointer",
    fontWeight: 700,
  };
}

export default function SyntheticFibresViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageRef = useRef(0);
  const scoreRef = useRef(0);
  const scannedRef = useRef<Partial<Record<ScanKey, boolean>>>({});
  const manufacturingRef = useRef(0);
  const rayonRef = useRef(0);
  const nylonWeightsRef = useRef(0);
  const nylonStretchedRef = useRef(false);
  const nylonUsesRef = useRef<Record<string, boolean>>({});
  const polyesterRef = useRef<Partial<Record<PolyesterTask, boolean>>>({});
  const acrylicRef = useRef<Partial<Record<AcrylicTask, boolean>>>({});
  const comparisonRef = useRef<Partial<Record<FibreKey, boolean>>>({});
  const safetyRef = useRef(false);
  const vaultRef = useRef<Record<number, FibreKey>>({});
  const safetyStepsRef = useRef(0);
  const stageVisualRef = useRef<(stage: number) => void>(() => undefined);
  const boardUpdateRef = useRef<() => void>(() => undefined);

  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState(0);
  const [scanned, setScanned] = useState<Partial<Record<ScanKey, boolean>>>({});
  const [manufacturing, setManufacturing] = useState(0);
  const [rayonStep, setRayonStep] = useState(0);
  const [nylonStretched, setNylonStretched] = useState(false);
  const [nylonWeights, setNylonWeights] = useState(0);
  const [nylonUses, setNylonUses] = useState<Record<string, boolean>>({});
  const [polyesterTasks, setPolyesterTasks] = useState<
    Partial<Record<PolyesterTask, boolean>>
  >({});
  const [acrylicTasks, setAcrylicTasks] = useState<
    Partial<Record<AcrylicTask, boolean>>
  >({});
  const [comparison, setComparison] = useState<
    Partial<Record<FibreKey, boolean>>
  >({});
  const [safetyComplete, setSafetyComplete] = useState(false);
  const [vaultAnswers, setVaultAnswers] = useState<Record<number, FibreKey>>(
    {},
  );
  const [safetySteps, setSafetySteps] = useState(0);
  const [feedback, setFeedback] = useState(
    "Choose a material and activate the fibre scanner.",
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

  const scanItem = useCallback(
    (key: ScanKey) => {
      const item = SCAN_ITEMS[key];
      setFeedback(`${item.label}: ${item.category} Fibre — ${item.result}`);
      if (scannedRef.current[key]) return;
      scannedRef.current = { ...scannedRef.current, [key]: true };
      setScanned(scannedRef.current);
      awardStar();
    },
    [awardStar],
  );

  const advanceManufacturing = useCallback(
    (next: number) => {
      if (next !== manufacturingRef.current + 1) return;
      manufacturingRef.current = next;
      setManufacturing(next);
      awardStar();
      const messages = [
        "",
        "Polymer material softened. Long repeating chains can now move.",
        "The spinneret formed many thin strands through its tiny holes.",
        "Stretching made the strands longer, thinner, and more organised.",
        "The completed fibre is wound onto the spool and ready to become yarn.",
      ];
      setFeedback(messages[next]);
    },
    [awardStar],
  );

  const advanceRayon = useCallback(
    (next: number) => {
      if (next !== rayonRef.current + 1) return;
      rayonRef.current = next;
      setRayonStep(next);
      awardStar();
      const messages = [
        "",
        "Wood pulp supplies cellulose, a plant-based raw material.",
        "Chemical processing regenerated the cellulose into smooth rayon strands.",
        "Rayon and silk both look smooth and shiny. Rayon is called artificial silk.",
        "The water drop was absorbed. Rayon is more absorbent than many fully synthetic fibres.",
      ];
      setFeedback(messages[next]);
    },
    [awardStar],
  );

  const stretchNylon = useCallback(() => {
    if (!nylonStretchedRef.current) {
      nylonStretchedRef.current = true;
      setNylonStretched(true);
      awardStar();
    }
    setFeedback(
      "The nylon stretched slightly and returned to shape: it is elastic.",
    );
  }, [awardStar]);

  const addNylonWeight = useCallback(() => {
    if (nylonWeightsRef.current >= 3) return;
    nylonWeightsRef.current += 1;
    setNylonWeights(nylonWeightsRef.current);
    awardStar();
    setFeedback(
      nylonWeightsRef.current === 3
        ? "Three weights added and the thin nylon thread is still unbroken."
        : `Weight ${nylonWeightsRef.current} added. Nylon remains strong.`,
    );
  }, [awardStar]);

  const selectNylonUse = useCallback(
    (use: string) => {
      if (!nylonUsesRef.current[use]) {
        const next = { ...nylonUsesRef.current, [use]: true };
        nylonUsesRef.current = next;
        setNylonUses(next);
        awardStar();
      }
      setFeedback(
        `${use}: nylon provides strong, lightweight, durable fibres.`,
      );
    },
    [awardStar],
  );

  const runPolyesterTask = useCallback(
    (task: PolyesterTask) => {
      if (!polyesterRef.current[task]) {
        const next = { ...polyesterRef.current, [task]: true };
        polyesterRef.current = next;
        setPolyesterTasks(next);
        awardStar();
      }
      const messages: Record<PolyesterTask, string> = {
        wrinkle:
          "The crumpled polyester quickly returned to shape: it resists wrinkles.",
        dry: "Polyester absorbed less water and dried faster than cotton.",
        polycot: "Polyester plus cotton produced polycot fabric.",
        polywool: "Polyester plus wool produced polywool fabric.",
      };
      setFeedback(messages[task]);
    },
    [awardStar],
  );

  const runAcrylicTask = useCallback(
    (task: AcrylicTask) => {
      if (!acrylicRef.current[task]) {
        const next = { ...acrylicRef.current, [task]: true };
        acrylicRef.current = next;
        setAcrylicTasks(next);
        awardStar();
      }
      const messages: Record<AcrylicTask, string> = {
        weight: "The acrylic sample is lighter than the natural wool sample.",
        warmth: "The thermal scan shows that acrylic retains warmth like wool.",
        product:
          "Sweaters, blankets, carpets, and artificial fur can use acrylic fibres.",
      };
      setFeedback(messages[task]);
    },
    [awardStar],
  );

  const matchComparison = useCallback(
    (fibre: FibreKey, property: FibreKey) => {
      if (fibre !== property) {
        setFeedback(
          `That property belongs to ${FIBRES[property].label}. Try another station.`,
        );
        return;
      }
      if (!comparisonRef.current[fibre]) {
        const next = { ...comparisonRef.current, [fibre]: true };
        comparisonRef.current = next;
        setComparison(next);
        awardStar();
      }
      setFeedback(`${FIBRES[fibre].label}: ${FIBRES[fibre].property}.`);
    },
    [awardStar],
  );

  const completeSafety = useCallback(() => {
    if (!safetyRef.current) {
      safetyRef.current = true;
      setSafetyComplete(true);
      awardStar();
    }
    setFeedback(
      "Safety barrier raised. Synthetic fabrics can soften or melt, so keep them away from fire and hot objects.",
    );
  }, [awardStar]);

  const answerVault = useCallback(
    (index: number, fibre: FibreKey) => {
      const correct = VAULT_ITEMS[index].answer;
      if (fibre !== correct) {
        setFeedback(`Review the object's main property and try again.`);
        return;
      }
      if (!vaultRef.current[index]) {
        const next = { ...vaultRef.current, [index]: fibre };
        vaultRef.current = next;
        setVaultAnswers(next);
        awardStar();
      }
      setFeedback(
        `${VAULT_ITEMS[index].label} matches ${FIBRES[fibre].label}.`,
      );
    },
    [awardStar],
  );

  const advanceSafetyLock = useCallback(() => {
    if (safetyStepsRef.current >= 3) return;
    safetyStepsRef.current += 1;
    setSafetySteps(safetyStepsRef.current);
    awardStar();
    const messages = [
      "",
      "The synthetic fabric was moved away from the heater.",
      "The red safety switch shut down the heater.",
      "Keep Away from Fire label placed. Safety lock completed!",
    ];
    setFeedback(messages[safetyStepsRef.current]);
  }, [awardStar]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x100b2e);
    scene.fog = new THREE.Fog(0x100b2e, 9, 25);

    const camera = new THREE.PerspectiveCamera(
      54,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.05,
      65,
    );
    camera.position.set(0, 2.3, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.55, -0.8);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI * 0.55;

    scene.add(new THREE.HemisphereLight(0xd8d7ff, 0x100b2e, 2.2));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(4, 7, 4);
    mainLight.castShadow = true;
    scene.add(mainLight);
    const violetLight = new THREE.PointLight(0x8b5cf6, 18, 11);
    violetLight.position.set(-4, 3, 0);
    scene.add(violetLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 15, 10);
    cyanLight.position.set(4, 2.4, -2);
    scene.add(cyanLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x181443,
        roughness: 0.6,
        metalness: 0.18,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    for (let ring = 1; ring <= 4; ring += 1) {
      const track = new THREE.Mesh(
        new THREE.TorusGeometry(1.8 + ring * 1.8, 0.018, 8, 96),
        new THREE.MeshBasicMaterial({ color: ring % 2 ? 0x4338ca : 0x0e7490 }),
      );
      track.rotation.x = Math.PI / 2;
      track.position.y = 0.012;
      scene.add(track);
    }

    const interactive: THREE.Object3D[] = [];

    const scanGroup = new THREE.Group();
    const podPositions: Array<[number, number]> = [
      [-2.7, -1.7],
      [-1.62, -1.95],
      [-0.54, -2.12],
      [0.54, -2.12],
      [1.62, -1.95],
      [2.7, -1.7],
    ];
    SCAN_KEYS.forEach((key, index) => {
      const [x, z] = podPositions[index];
      const pod = new THREE.Group();
      pod.position.set(x, 1.55, z);
      const chamber = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.5, 1.8, 24),
        new THREE.MeshPhysicalMaterial({
          color:
            key === "cotton" || key === "wool" || key === "silk"
              ? 0x7dd3fc
              : 0xc084fc,
          transparent: true,
          opacity: 0.2,
          transmission: 0.55,
          roughness: 0.08,
        }),
      );
      const fibre = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.2, 0.055, 70, 10),
        new THREE.MeshStandardMaterial({
          color:
            key === "cotton"
              ? 0xf8fafc
              : key === "wool"
                ? 0xe7e5e4
                : key === "silk"
                  ? 0xf9a8d4
                  : key === "nylon"
                    ? 0xfb7185
                    : key === "polyester"
                      ? 0x34d399
                      : 0xc084fc,
          roughness: key === "silk" ? 0.18 : 0.58,
          metalness: key === "silk" ? 0.25 : 0,
        }),
      );
      const label = labelSprite(
        SCAN_ITEMS[key].label.toUpperCase(),
        "#a78bfa",
        0.8,
      );
      label.position.y = -1.15;
      pod.add(chamber, fibre, label);
      setAction(pod, `scan:${key}`);
      interactive.push(chamber, fibre);
      scanGroup.add(pod);
    });
    scene.add(scanGroup);

    const machineGroup = new THREE.Group();
    const machineBase = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.35, 2),
      new THREE.MeshStandardMaterial({
        color: 0x312e81,
        metalness: 0.65,
        roughness: 0.28,
      }),
    );
    machineBase.position.set(0, 0.95, -1.1);
    machineGroup.add(machineBase);
    const chamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 1.7, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.36,
        transmission: 0.38,
        roughness: 0.1,
      }),
    );
    chamber.position.set(-1.75, 1.9, -1.1);
    machineGroup.add(chamber);
    const polymerBeads: THREE.Mesh[] = [];
    for (let index = 0; index < 20; index += 1) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 12, 10),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x78350f,
          emissiveIntensity: 0.22,
        }),
      );
      bead.position.set(-2.12 + index * 0.04, 1.55 + (index % 5) * 0.18, -1.1);
      polymerBeads.push(bead);
      machineGroup.add(bead);
    }
    const spinneret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.18, 32),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.82,
        roughness: 0.2,
      }),
    );
    spinneret.rotation.z = Math.PI / 2;
    spinneret.position.set(-0.65, 1.75, -1.1);
    machineGroup.add(spinneret);
    const strands: THREE.Mesh[] = [];
    for (let index = 0; index < 9; index += 1) {
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xf0abfc, roughness: 0.3 }),
      );
      strand.rotation.z = Math.PI / 2;
      strand.scale.y = 0.03;
      strand.position.set(0.55, 1.55 + index * 0.06, -1.32 + (index % 3) * 0.1);
      strands.push(strand);
      machineGroup.add(strand);
    }
    const spool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.7, 24),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        metalness: 0.45,
        roughness: 0.32,
      }),
    );
    spool.rotation.z = Math.PI / 2;
    spool.position.set(2.15, 1.65, -1.1);
    machineGroup.add(spool);
    machineGroup.visible = false;
    scene.add(machineGroup);

    const rayonGroup = new THREE.Group();
    const wood = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.75, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.78 }),
    );
    wood.position.set(-1.8, 1.35, -1.25);
    const rayonChamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 1.8, 30),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        transmission: 0.48,
      }),
    );
    rayonChamber.position.set(0, 1.75, -1.25);
    const rayonFibre = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.45, 0.075, 100, 14),
      new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        metalness: 0.35,
        roughness: 0.16,
      }),
    );
    rayonFibre.position.set(1.8, 1.65, -1.25);
    const rayonLabel = labelSprite(
      "WOOD PULP  →  RAYON  →  ARTIFICIAL SILK",
      "#7dd3fc",
      2.6,
    );
    rayonLabel.position.set(0, 0.45, -1.2);
    rayonGroup.add(wood, rayonChamber, rayonFibre, rayonLabel);
    rayonGroup.visible = false;
    scene.add(rayonGroup);

    const testsGroup = new THREE.Group();
    const testPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.55, 0.3, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        metalness: 0.46,
        roughness: 0.3,
      }),
    );
    testPlatform.position.set(0, 0.95, -1.2);
    testsGroup.add(testPlatform);
    const nylonThread = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 3.2, 10),
      new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.28 }),
    );
    nylonThread.rotation.z = Math.PI / 2;
    nylonThread.position.set(0, 2.25, -1.2);
    testsGroup.add(nylonThread);
    const weightMeshes: THREE.Mesh[] = [];
    for (let index = 0; index < 3; index += 1) {
      const weight = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.38, 0.5),
        new THREE.MeshStandardMaterial({
          color: 0x64748b,
          metalness: 0.7,
          roughness: 0.24,
        }),
      );
      weight.position.set(0, 1.88 - index * 0.4, -1.2);
      weight.visible = false;
      weightMeshes.push(weight);
      testsGroup.add(weight);
    }
    const shirt = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.52 }),
    );
    shirt.position.set(0, 1.85, -1.2);
    shirt.visible = false;
    testsGroup.add(shirt);
    const sweater = new THREE.Mesh(
      new THREE.SphereGeometry(0.78, 28, 20),
      new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.9 }),
    );
    sweater.scale.set(1.1, 0.82, 0.35);
    sweater.position.set(0, 1.85, -1.2);
    sweater.visible = false;
    testsGroup.add(sweater);
    testsGroup.visible = false;
    scene.add(testsGroup);

    const comparisonGroup = new THREE.Group();
    FIBRE_KEYS.forEach((key, index) => {
      const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
      const fibre = FIBRES[key];
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.63, 0.78, 0.65, 24),
        new THREE.MeshStandardMaterial({
          color: fibre.color,
          emissive: fibre.color,
          emissiveIntensity: 0.12,
          roughness: 0.36,
        }),
      );
      pedestal.position.set(
        Math.cos(angle) * 2.2,
        1.15,
        -1.3 + Math.sin(angle) * 1.25,
      );
      const sample = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.3, 0.065, 80, 12),
        new THREE.MeshStandardMaterial({
          color: fibre.color,
          metalness: 0.18,
          roughness: 0.32,
        }),
      );
      sample.position.set(pedestal.position.x, 1.78, pedestal.position.z);
      const label = labelSprite(fibre.label.toUpperCase(), fibre.accent, 0.78);
      label.position.set(pedestal.position.x, 0.55, pedestal.position.z + 0.05);
      comparisonGroup.add(pedestal, sample, label);
    });
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.83, 0.12, 16, 48),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.55,
        roughness: 0.22,
      }),
    );
    wheel.position.set(0, 1.85, -1.3);
    comparisonGroup.add(wheel);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.9, 20),
      new THREE.MeshStandardMaterial({
        color: 0xfb923c,
        emissive: 0xef4444,
        emissiveIntensity: 0.72,
      }),
    );
    flame.position.set(3.2, 1.3, -1.25);
    comparisonGroup.add(flame);
    const barrier = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.8, 1.6),
      new THREE.MeshPhysicalMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.52,
        transmission: 0.36,
      }),
    );
    barrier.position.set(2.55, 1.55, -1.25);
    barrier.visible = false;
    comparisonGroup.add(barrier);
    comparisonGroup.visible = false;
    scene.add(comparisonGroup);

    const vaultGroup = new THREE.Group();
    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 3.6, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x312e81,
        metalness: 0.72,
        roughness: 0.24,
      }),
    );
    leftDoor.position.set(-1.25, 2.25, -2.7);
    const rightDoor = leftDoor.clone();
    rightDoor.position.x = 1.25;
    vaultGroup.add(leftDoor, rightDoor);
    const vaultLights: THREE.Mesh[] = [];
    FIBRE_KEYS.forEach((key, index) => {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 14, 12),
        new THREE.MeshStandardMaterial({
          color: FIBRES[key].color,
          emissive: FIBRES[key].color,
          emissiveIntensity: 0.28,
        }),
      );
      light.position.set(-0.75 + index * 0.5, 2.25, -2.48);
      vaultLights.push(light);
      vaultGroup.add(light);
    });
    const vaultLabel = labelSprite("SYNTHETIC FIBRE VAULT", "#fbbf24", 2.3);
    vaultLabel.position.set(0, 4.35, -2.5);
    vaultGroup.add(vaultLabel);
    vaultGroup.visible = false;
    scene.add(vaultGroup);

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
    board.position.set(0, 4.55, -3.45);
    scene.add(board);
    boardUpdateRef.current = () => {
      drawMissionBoard(boardCanvas, stageRef.current, scoreRef.current);
      boardTexture.needsUpdate = true;
    };

    stageVisualRef.current = (nextStage) => {
      scanGroup.visible = nextStage === 0;
      machineGroup.visible = nextStage === 1;
      rayonGroup.visible = nextStage === 2;
      testsGroup.visible = nextStage >= 3 && nextStage <= 5;
      nylonThread.visible = nextStage === 3;
      weightMeshes.forEach((weight, index) => {
        weight.visible = nextStage === 3 && index < nylonWeightsRef.current;
      });
      shirt.visible = nextStage === 4;
      sweater.visible = nextStage === 5;
      comparisonGroup.visible = nextStage === 6;
      barrier.visible = nextStage === 6 && safetyRef.current;
      vaultGroup.visible = nextStage === 7;
      boardUpdateRef.current();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handleAction = (action: string) => {
      if (action.startsWith("scan:") && stageRef.current === 0) {
        scanItem(action.slice(5) as ScanKey);
      }
    };
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

    const xrControllers: Array<{
      controller: ReturnType<typeof renderer.xr.getController>;
      onSelectStart: () => void;
    }> = [];
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -3.5),
        ]),
        new THREE.LineBasicMaterial({ color: 0xc4b5fd }),
      );
      controller.add(ray);
      const onSelectStart = () => {
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
      };
      controller.addEventListener("selectstart", onSelectStart);
      xrControllers.push({ controller, onSelectStart });
      scene.add(controller);
    }

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      controls.update();
      polymerBeads.forEach((bead, index) => {
        bead.position.y += Math.sin(elapsed * 2 + index * 0.5) * 0.0008;
        const material = bead.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity =
          manufacturingRef.current >= 1 ? 0.65 : 0.22;
      });
      strands.forEach((strand) => {
        strand.scale.y = THREE.MathUtils.lerp(
          strand.scale.y,
          manufacturingRef.current >= 2
            ? manufacturingRef.current >= 3
              ? 1
              : 0.55
            : 0.03,
          0.08,
        );
      });
      if (manufacturingRef.current >= 4) spool.rotation.x = elapsed * 2.5;
      rayonFibre.rotation.y = elapsed * 0.65;
      nylonThread.scale.y = nylonStretchedRef.current
        ? 1.16 + Math.sin(elapsed * 2) * 0.02
        : 1;
      weightMeshes.forEach((weight, index) => {
        weight.visible =
          stageRef.current === 3 && index < nylonWeightsRef.current;
      });
      shirt.rotation.y = stageRef.current === 4 ? elapsed * 0.35 : 0;
      sweater.rotation.y = stageRef.current === 5 ? elapsed * 0.38 : 0;
      wheel.rotation.z = elapsed * 0.55;
      barrier.visible = stageRef.current === 6 && safetyRef.current;
      flame.scale.y = 0.88 + Math.sin(elapsed * 6) * 0.12;
      const vaultComplete =
        Object.keys(vaultRef.current).length === VAULT_ITEMS.length &&
        safetyStepsRef.current === 3;
      if (vaultComplete) {
        leftDoor.position.x = THREE.MathUtils.lerp(
          leftDoor.position.x,
          -2.65,
          0.035,
        );
        rightDoor.position.x = THREE.MathUtils.lerp(
          rightDoor.position.x,
          2.65,
          0.035,
        );
        vaultLights.forEach((light) => {
          const material = light.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = 1.6;
        });
      }
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
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      xrControllers.forEach(({ controller, onSelectStart }) => {
        controller.removeEventListener("selectstart", onSelectStart);
      });
      renderer.setAnimationLoop(null);
      controls.dispose();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.Sprite
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if ("map" in material && material.map instanceof THREE.Texture)
              material.map.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      boardUpdateRef.current = () => undefined;
      window.speechSynthesis?.cancel();
    };
  }, [scanItem]);

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

  const scannedCount = Object.keys(scanned).length;
  const nylonComplete =
    nylonStretched && nylonWeights >= 3 && Object.keys(nylonUses).length >= 2;
  const polyesterComplete =
    (Object.keys(polyesterTasks) as PolyesterTask[]).length === 4;
  const acrylicComplete =
    (Object.keys(acrylicTasks) as AcrylicTask[]).length === 3;
  const comparisonComplete =
    FIBRE_KEYS.every((key) => comparison[key]) && safetyComplete;
  const vaultComplete =
    Object.keys(vaultAnswers).length === VAULT_ITEMS.length &&
    safetySteps === 3;

  const nextButton = (enabled: boolean): CSSProperties => ({
    padding: 11,
    borderRadius: 9,
    border: 0,
    background: enabled ? "#7c3aed" : "#334155",
    color: "white",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 800,
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#100b2e",
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
              "radial-gradient(circle at 50% 25%, rgba(124,58,237,.28), rgba(10,7,30,.96) 62%)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "min(660px, 100%)",
              padding: "clamp(24px, 5vw, 42px)",
              borderRadius: 22,
              background: "rgba(20, 14, 52, .95)",
              border: "1px solid rgba(196,181,253,.3)",
              boxShadow: "0 28px 80px rgba(0,0,0,.42)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 60, marginBottom: 8 }}>🧵🧪🔬</div>
            <div
              style={{
                color: "#c4b5fd",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              Class 8 · Chapter 3 · Activity 2
            </div>
            <h1
              style={{
                margin: "10px 0 12px",
                fontSize: "clamp(27px, 6vw, 43px)",
              }}
            >
              Synthetic Fibres: Introduction &amp; Types
            </h1>
            <p
              style={{
                margin: "0 auto 22px",
                maxWidth: 555,
                color: "#ddd6fe",
                lineHeight: 1.65,
              }}
            >
              Scan materials, manufacture a fibre from polymer, test rayon,
              nylon, polyester, and acrylic, then unlock the Synthetic Fibre
              Vault.
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
                background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                color: "white",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Enter the futuristic fibre laboratory
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
                background: "rgba(14,10,35,.86)",
                border: "1px solid rgba(196,181,253,.25)",
                backdropFilter: "blur(9px)",
              }}
            >
              <div style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 800 }}>
                STAGE {stage + 1}/8 · {stars} ★
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
                  border: "1px solid rgba(196,181,253,.45)",
                  background: "rgba(124,58,237,.42)",
                  color: "#f5f3ff",
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
              width: "min(390px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 138px)",
              overflowY: "auto",
              padding: 16,
              borderRadius: 16,
              background: "rgba(14,10,35,.95)",
              border: "1px solid rgba(196,181,253,.25)",
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
                color: "#ddd6fe",
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
                background: "rgba(124,58,237,.13)",
                color: "#f5f3ff",
                fontSize: 13,
                lineHeight: 1.45,
                marginBottom: 12,
              }}
            >
              {feedback}
            </div>

            {stage === 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  Scanned {scannedCount}/3 required materials
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 7,
                  }}
                >
                  {SCAN_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => scanItem(key)}
                      style={{
                        ...choiceStyle(Boolean(scanned[key]), "#22d3ee"),
                        textAlign: "left",
                        color: scanned[key] ? "#86efac" : "#f8fafc",
                      }}
                    >
                      {scanned[key] ? "✓ " : "🔍 "}
                      {SCAN_ITEMS[key].emoji} {SCAN_ITEMS[key].label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goToStage(1)}
                  disabled={scannedCount < 3}
                  style={nextButton(scannedCount >= 3)}
                >
                  Enter the manufacturing chamber →
                </button>
              </div>
            ) : null}

            {stage === 1 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  [1, "🔥 Start: soften polymer"],
                  [2, "⬇ Pull spinneret lever"],
                  [3, "↔ Stretch the strands"],
                  [4, "🧵 Wind fibre onto spool"],
                ].map(([step, label]) => (
                  <button
                    key={step}
                    onClick={() => advanceManufacturing(Number(step))}
                    disabled={manufacturing < Number(step) - 1}
                    style={{
                      ...choiceStyle(manufacturing >= Number(step), "#f0abfc"),
                      cursor:
                        manufacturing < Number(step) - 1
                          ? "not-allowed"
                          : "pointer",
                      textAlign: "left",
                      color:
                        manufacturing >= Number(step) ? "#86efac" : "#f8fafc",
                    }}
                  >
                    {manufacturing >= Number(step) ? "✓ " : ""}
                    {label}
                  </button>
                ))}
                <div
                  style={{
                    padding: 9,
                    borderRadius: 8,
                    background: "rgba(34,211,238,.09)",
                    color: "#cffafe",
                    fontSize: 12,
                  }}
                >
                  Polymer Material → Spinneret → Fibre → Yarn → Fabric
                </div>
                <button
                  onClick={() => goToStage(2)}
                  disabled={manufacturing < 4}
                  style={nextButton(manufacturing >= 4)}
                >
                  Explore rayon →
                </button>
              </div>
            ) : null}

            {stage === 2 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  [1, "🪵 Place wood pulp in chamber"],
                  [2, "⚗ Activate chemical processing"],
                  [3, "✨ Compare rayon with silk"],
                  [4, "💧 Test rayon absorbency"],
                ].map(([step, label]) => (
                  <button
                    key={step}
                    onClick={() => advanceRayon(Number(step))}
                    disabled={rayonStep < Number(step) - 1}
                    style={{
                      ...choiceStyle(
                        rayonStep >= Number(step),
                        FIBRES.rayon.accent,
                      ),
                      cursor:
                        rayonStep < Number(step) - 1
                          ? "not-allowed"
                          : "pointer",
                      textAlign: "left",
                      color: rayonStep >= Number(step) ? "#86efac" : "#f8fafc",
                    }}
                  >
                    {rayonStep >= Number(step) ? "✓ " : ""}
                    {label}
                  </button>
                ))}
                <div
                  style={{
                    padding: 9,
                    borderRadius: 8,
                    background: "rgba(125,211,252,.1)",
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  Rayon uses plant cellulose, so it is regenerated or
                  semi-synthetic—not fully synthetic.
                </div>
                <button
                  onClick={() => goToStage(3)}
                  disabled={rayonStep < 4}
                  style={nextButton(rayonStep >= 4)}
                >
                  Test nylon →
                </button>
              </div>
            ) : null}

            {stage === 3 ? (
              <div style={{ display: "grid", gap: 8 }}>
                <button
                  onClick={stretchNylon}
                  style={choiceStyle(nylonStretched, FIBRES.nylon.accent)}
                >
                  {nylonStretched ? "✓ " : "↔ "}Stretch and release nylon
                </button>
                <button
                  onClick={addNylonWeight}
                  disabled={nylonWeights >= 3}
                  style={choiceStyle(nylonWeights >= 3, FIBRES.nylon.accent)}
                >
                  🏋 Add weight ({nylonWeights}/3)
                </button>
                <strong style={{ fontSize: 13 }}>
                  Inspect any two nylon uses:
                </strong>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                  }}
                >
                  {[
                    "Rope",
                    "Parachute",
                    "Fishing net",
                    "Toothbrush",
                    "Seat belt",
                  ].map((use) => (
                    <button
                      key={use}
                      onClick={() => selectNylonUse(use)}
                      style={{
                        ...choiceStyle(
                          Boolean(nylonUses[use]),
                          FIBRES.nylon.accent,
                        ),
                        padding: 7,
                        color: nylonUses[use] ? "#86efac" : "#f8fafc",
                      }}
                    >
                      {nylonUses[use] ? "✓ " : ""}
                      {use}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goToStage(4)}
                  disabled={!nylonComplete}
                  style={nextButton(nylonComplete)}
                >
                  Test polyester →
                </button>
              </div>
            ) : null}

            {stage === 4 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(
                  [
                    ["wrinkle", "✊ Crumple and release polyester"],
                    ["dry", "💦 Spray polyester and cotton"],
                    ["polycot", "🧵 Blend polyester + cotton"],
                    ["polywool", "🧶 Blend polyester + wool"],
                  ] as Array<[PolyesterTask, string]>
                ).map(([task, label]) => (
                  <button
                    key={task}
                    onClick={() => runPolyesterTask(task)}
                    style={{
                      ...choiceStyle(
                        Boolean(polyesterTasks[task]),
                        FIBRES.polyester.accent,
                      ),
                      textAlign: "left",
                      color: polyesterTasks[task] ? "#86efac" : "#f8fafc",
                    }}
                  >
                    {polyesterTasks[task] ? "✓ " : ""}
                    {label}
                  </button>
                ))}
                <div
                  style={{
                    padding: 9,
                    borderRadius: 8,
                    background: "rgba(52,211,153,.1)",
                    fontSize: 12,
                  }}
                >
                  PET is a polyester used in fibres, bottles, and containers.
                </div>
                <button
                  onClick={() => goToStage(5)}
                  disabled={!polyesterComplete}
                  style={nextButton(polyesterComplete)}
                >
                  Test acrylic →
                </button>
              </div>
            ) : null}

            {stage === 5 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(
                  [
                    ["weight", "⚖ Compare acrylic and wool weight"],
                    ["warmth", "🌡 Scan heat retention"],
                    ["product", "🧥 Inspect acrylic products"],
                  ] as Array<[AcrylicTask, string]>
                ).map(([task, label]) => (
                  <button
                    key={task}
                    onClick={() => runAcrylicTask(task)}
                    style={{
                      ...choiceStyle(
                        Boolean(acrylicTasks[task]),
                        FIBRES.acrylic.accent,
                      ),
                      textAlign: "left",
                      color: acrylicTasks[task] ? "#86efac" : "#f8fafc",
                    }}
                  >
                    {acrylicTasks[task] ? "✓ " : ""}
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => goToStage(6)}
                  disabled={!acrylicComplete}
                  style={nextButton(acrylicComplete)}
                >
                  Compare all four fibres →
                </button>
              </div>
            ) : null}

            {stage === 6 ? (
              <div style={{ display: "grid", gap: 9 }}>
                {(
                  [
                    ["Silk-like", "rayon"],
                    ["Strong", "nylon"],
                    ["Wrinkle-resistant", "polyester"],
                    ["Wool-like", "acrylic"],
                  ] as Array<[string, FibreKey]>
                ).map(([property, answer]) => (
                  <div
                    key={property}
                    style={{
                      padding: 9,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      {comparison[answer] ? "✓ " : ""}
                      {property}
                    </strong>
                    {!comparison[answer] ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: 4,
                          marginTop: 7,
                        }}
                      >
                        {FIBRE_KEYS.map((fibre) => (
                          <button
                            key={fibre}
                            onClick={() => matchComparison(fibre, answer)}
                            style={{
                              ...choiceStyle(false, FIBRES[fibre].accent),
                              padding: "6px 2px",
                              fontSize: 10,
                            }}
                          >
                            {FIBRES[fibre].label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                <button
                  onClick={completeSafety}
                  style={{
                    ...choiceStyle(safetyComplete, "#ef4444"),
                    background: safetyComplete
                      ? "rgba(34,197,94,.15)"
                      : "rgba(239,68,68,.17)",
                    color: safetyComplete ? "#86efac" : "#fecaca",
                  }}
                >
                  {safetyComplete
                    ? "✓ Safety barrier raised"
                    : "🔥 Keep synthetic fabric away from fire"}
                </button>
                <button
                  onClick={() => goToStage(7)}
                  disabled={!comparisonComplete}
                  style={nextButton(comparisonComplete)}
                >
                  Open the final vault challenge →
                </button>
              </div>
            ) : null}

            {stage === 7 && !vaultComplete ? (
              <div style={{ display: "grid", gap: 9 }}>
                {VAULT_ITEMS.map((item, index) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 8,
                      borderRadius: 9,
                      background: "rgba(255,255,255,.04)",
                    }}
                  >
                    <strong style={{ fontSize: 12 }}>
                      {vaultAnswers[index] ? "✓ " : ""}
                      {item.emoji} {item.label}
                    </strong>
                    {!vaultAnswers[index] ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: 4,
                          marginTop: 6,
                        }}
                      >
                        {FIBRE_KEYS.map((fibre) => (
                          <button
                            key={fibre}
                            onClick={() => answerVault(index, fibre)}
                            style={{
                              ...choiceStyle(false, FIBRES[fibre].accent),
                              padding: "6px 2px",
                              fontSize: 10,
                            }}
                          >
                            {FIBRES[fibre].label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                <button
                  onClick={advanceSafetyLock}
                  style={choiceStyle(safetySteps === 3, "#ef4444")}
                >
                  {safetySteps === 0
                    ? "1. Move fabric away from heater"
                    : safetySteps === 1
                      ? "2. Press red safety switch"
                      : safetySteps === 2
                        ? "3. Place Keep Away from Fire label"
                        : "✓ Safety lock completed"}
                </button>
              </div>
            ) : null}

            {stage === 7 && vaultComplete ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 68 }}>🔓🏅🧵</div>
                <h3 style={{ color: "#fde68a", margin: "4px 0" }}>
                  Synthetic Fibre Vault Unlocked!
                </h3>
                <p style={{ color: "#ddd6fe", fontSize: 13, lineHeight: 1.55 }}>
                  Rayon—silk-like · Nylon—strong · Polyester—durable ·
                  Acrylic—wool-like
                </p>
                <p style={{ color: "#fca5a5", fontSize: 12, lineHeight: 1.5 }}>
                  Always keep synthetic fabrics away from flames and hot
                  objects.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 9,
                    border: "1px solid rgba(196,181,253,.4)",
                    background: "rgba(124,58,237,.28)",
                    color: "#f5f3ff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Run the fibre mission again
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
              background: "rgba(14,10,35,.78)",
              color: "#94a3b8",
              fontSize: 11,
              zIndex: 4,
            }}
          >
            Scan objects · Use guided controls · Drag to look · Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}
