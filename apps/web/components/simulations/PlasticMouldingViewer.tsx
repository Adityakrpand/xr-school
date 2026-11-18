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

type ScanKey = "pet" | "disc-a" | "disc-b";
type ExampleKey = "polythene" | "pvc" | "bakelite" | "melamine";
type SortKey = "pvc" | "bakelite";
type PlasticKind = "thermoplastic" | "thermoset";

const STAGES = [
  {
    title: "Scan the moulding workshop",
    cue: "Scan PET and both identical-looking discs. Appearance alone cannot reveal which disc can be remoulded.",
  },
  {
    title: "Make a round plastic disc",
    cue: "Load polythene pellets, mould them, cool the plastic, and trace the matching round edge.",
  },
  {
    title: "Reshape Disc A",
    cue: "Try the press cold, then add simulated heat and watch the same plastic become a star.",
  },
  {
    title: "Find out why Disc B stays round",
    cue: "Reveal the cross-links formed during setting, then repeat the same heating and pressing test.",
  },
  {
    title: "Compare everyday plastics",
    cue: "Replay both results and inspect examples. Rigidity alone does not identify the plastic type.",
  },
  {
    title: "Workshop Challenge: sort the objects",
    cue: "Classify a rigid PVC pipe and a rigid Bakelite casing using what happens on reheating.",
  },
  {
    title: "Make the missing star badge",
    cue: "Heat two unlabelled discs, choose the one that softened, and complete the badge.",
  },
];

const NARRATIONS = [
  "Welcome to the moulding workshop. Plastics are made mainly from polymers. Scan PET and the two round discs, then investigate which disc can become a star.",
  "A mould gives material its shape. Polythene pellets soften with suitable heat, fill the round mould, and firm up as they cool.",
  "Disc A stays firm when pressed cold. With suitable heat its chains move past one another more easily, so it can be remoulded. This is a thermoplastic.",
  "Disc B formed permanent links called cross-links as it set. Reheating does not let its chains flow into a new mould. This is a thermosetting plastic.",
  "Polythene and PVC are thermoplastics. Bakelite and melamine resin are thermosetting plastics. Test reheating behavior instead of judging by flexibility or rigidity.",
  "The Workshop Challenge begins now. Sort the PVC pipe and Bakelite casing using the reheating evidence.",
  "Test both unlabelled discs, choose the sample that softened, and mould the missing star badge.",
];

const EXAMPLES: Record<
  ExampleKey,
  { label: string; emoji: string; kind: PlasticKind; note: string }
> = {
  polythene: {
    label: "Polythene bag",
    emoji: "🛍️",
    kind: "thermoplastic",
    note: "Flexible, but its important clue is that suitable heat can soften it.",
  },
  pvc: {
    label: "PVC pipe",
    emoji: "🧯",
    kind: "thermoplastic",
    note: "Rigid yet still a thermoplastic: rigidity is not the deciding test.",
  },
  bakelite: {
    label: "Bakelite casing",
    emoji: "🔌",
    kind: "thermoset",
    note: "Permanent cross-links help it keep its set shape around electrical parts.",
  },
  melamine: {
    label: "Melamine plate",
    emoji: "🍽️",
    kind: "thermoset",
    note: "Once set, it does not soften and flow into a new mould.",
  },
};

const EXAMPLE_KEYS = Object.keys(EXAMPLES) as ExampleKey[];
const SIMULATION_DURATION_SECONDS = 5 * 60;

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

function hierarchyVisible(object: THREE.Object3D | null) {
  let current = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}

function labelSprite(text: string, accent: string, width = 1.2) {
  const canvas = document.createElement("canvas");
  canvas.width = 680;
  canvas.height = 150;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Sprite();
  context.fillStyle = "rgba(24, 16, 31, .94)";
  context.roundRect(6, 6, 668, 138, 28);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = "#fff7ed";
  context.font = "700 39px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 340, 76);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  sprite.scale.set(width, width * 0.22, 1);
  return sprite;
}

function drawMissionBoard(
  canvas: HTMLCanvasElement,
  stage: number,
  points: number,
  secondsRemaining: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#211329";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = stage >= 5 ? "#fbbf24" : "#fb923c";
  context.lineWidth = 8;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.fillStyle = "#fdba74";
  context.font = "700 27px sans-serif";
  context.fillText(`MOULDING LAB  •  ${stage + 1}/7`, 34, 46);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, "0");
  context.textAlign = "right";
  context.fillText(`TIME ${minutes}:${seconds}`, canvas.width - 34, 46);
  context.textAlign = "left";
  context.fillStyle = "#fff7ed";
  context.font = "800 38px sans-serif";
  context.fillText(STAGES[stage].title, 34, 98);
  context.fillStyle = "#fed7aa";
  context.font = "24px sans-serif";
  const words = STAGES[stage].cue.split(" ");
  let line = "";
  let y = 143;
  for (const word of words) {
    const next = `${line}${word} `;
    if (context.measureText(next).width > canvas.width - 70 && line) {
      context.fillText(line.trim(), 34, y);
      line = `${word} `;
      y += 32;
    } else {
      line = next;
    }
  }
  context.fillText(line.trim(), 34, y);
  if (stage >= 5) {
    context.fillStyle = "#fde68a";
    context.font = "700 24px sans-serif";
    context.fillText(`Challenge points: ${points}/3`, 34, 302);
  }
}

function starGeometry(outer = 0.72, inner = 0.34, depth = 0.2) {
  const shape = new THREE.Shape();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 2,
  });
  geometry.center();
  return geometry;
}

function choiceStyle(selected: boolean, accent = "#fb923c"): CSSProperties {
  return {
    padding: "9px 10px",
    minHeight: 44,
    borderRadius: 9,
    border: `1px solid ${selected ? accent : "rgba(255,255,255,.14)"}`,
    background: selected ? `${accent}2b` : "rgba(255,255,255,.045)",
    color: "#fff7ed",
    cursor: "pointer",
    fontWeight: 700,
  };
}

function nextStyle(enabled: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 11,
    minHeight: 44,
    borderRadius: 9,
    border: 0,
    background: enabled ? "#ea580c" : "#475569",
    color: "white",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 800,
  };
}

export default function PlasticMouldingViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageRef = useRef(0);
  const pointsRef = useRef(0);
  const scannedRef = useRef<Partial<Record<ScanKey, boolean>>>({});
  const mouldRef = useRef(0);
  const reshapeRef = useRef(0);
  const crosslinkRef = useRef(0);
  const comparisonRef = useRef<Partial<Record<ExampleKey, boolean>>>({});
  const replayRef = useRef(false);
  const sortedRef = useRef<Partial<Record<SortKey, PlasticKind>>>({});
  const finalHeatedRef = useRef(false);
  const badgeCompleteRef = useRef(false);
  const retryCountRef = useRef(0);
  const mutedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);
  const secondsRemainingRef = useRef(SIMULATION_DURATION_SECONDS);
  const stageVisualRef = useRef<(stage: number) => void>(() => undefined);
  const boardUpdateRef = useRef<() => void>(() => undefined);

  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stage, setStage] = useState(0);
  const [points, setPoints] = useState(0);
  const [scanned, setScanned] = useState<Partial<Record<ScanKey, boolean>>>({});
  const [mouldStep, setMouldStep] = useState(0);
  const [reshapeStep, setReshapeStep] = useState(0);
  const [afterSetting, setAfterSetting] = useState(false);
  const [crosslinkStep, setCrosslinkStep] = useState(0);
  const [replayed, setReplayed] = useState(false);
  const [examples, setExamples] = useState<
    Partial<Record<ExampleKey, boolean>>
  >({});
  const [sorted, setSorted] = useState<Partial<Record<SortKey, PlasticKind>>>(
    {},
  );
  const [finalHeated, setFinalHeated] = useState(false);
  const [badgeComplete, setBadgeComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    SIMULATION_DURATION_SECONDS,
  );
  const [guidedCompletion, setGuidedCompletion] = useState(false);
  const [feedback, setFeedback] = useState(
    "Start with the PET bottle, then inspect both round discs.",
  );

  const awardPoint = useCallback(() => {
    pointsRef.current += 1;
    setPoints(pointsRef.current);
    boardUpdateRef.current();
  }, []);

  const narrate = useCallback((text: string) => {
    if (!mutedRef.current) speak(text);
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion((current) => {
      const next = !current;
      reducedMotionRef.current = next;
      return next;
    });
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

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => {
      reducedMotionRef.current = media.matches;
      setReducedMotion(media.matches);
    };
    applyPreference();
    media.addEventListener("change", applyPreference);
    return () => media.removeEventListener("change", applyPreference);
  }, []);

  const goToStage = useCallback(
    (next: number) => {
      stageRef.current = next;
      setStage(next);
      setFeedback(STAGES[next].cue);
      stageVisualRef.current(next);
      narrate(NARRATIONS[next]);
    },
    [narrate],
  );

  const scanItem = useCallback((key: ScanKey) => {
    const messages: Record<ScanKey, string> = {
      pet: "PET is a polyester. Magnified polymer chains are now visible inside the bottle.",
      "disc-a":
        "Disc A looks round, smooth, and firm. Its appearance does not reveal whether it can be remoulded.",
      "disc-b":
        "Disc B looks identical to Disc A. A reheating test is needed to tell them apart.",
    };
    setFeedback(messages[key]);
    if (scannedRef.current[key]) return;
    scannedRef.current = { ...scannedRef.current, [key]: true };
    setScanned(scannedRef.current);
  }, []);

  const advanceMould = useCallback((next: number) => {
    if (next !== mouldRef.current + 1) return;
    mouldRef.current = next;
    setMouldStep(next);
    const messages = [
      "",
      "Polythene pellets loaded into the hopper.",
      "The pellets softened and filled the round mould.",
      "Cooling made the plastic firm. Disc A released with a round shape.",
      "The disc edge matches the mould: a mould gives material its shape.",
    ];
    setFeedback(messages[next]);
  }, []);

  const advanceReshape = useCallback((next: number) => {
    if (next !== reshapeRef.current + 1) return;
    reshapeRef.current = next;
    setReshapeStep(next);
    const messages = [
      "",
      "With heat off, Disc A stays round and firm at room temperature.",
      "Simulated heat lets the polymer chains slide past one another more easily.",
      "The softened disc flowed into the star mould.",
      "Heat off: the plastic firmed up and kept its new star shape. Disc A is a thermoplastic.",
    ];
    setFeedback(messages[next]);
  }, []);

  const revealCrosslinks = useCallback(() => {
    if (crosslinkRef.current >= 1) return;
    crosslinkRef.current = 1;
    setAfterSetting(true);
    setCrosslinkStep(1);
    setFeedback(
      "After setting, permanent cross-links bridge the polymer chains inside Disc B.",
    );
  }, []);

  const advanceCrosslink = useCallback((next: number) => {
    if (next !== crosslinkRef.current + 1) return;
    crosslinkRef.current = next;
    setCrosslinkStep(next);
    const messages = [
      "",
      "",
      "Simulated heat applied. The cross-linked structure remains locked together.",
      "The press cannot make Disc B flow into the star mould. It stays round.",
      "Magnifier evidence: permanent cross-links prevent remoulding. Disc B is thermosetting.",
    ];
    setFeedback(messages[next]);
  }, []);

  const replayComparison = useCallback(() => {
    if (!replayRef.current) {
      replayRef.current = true;
      setReplayed(true);
    }
    setFeedback(
      "Replay: Disc A softened and became a star; Disc B stayed round because its cross-links remained fixed.",
    );
  }, []);

  const inspectExample = useCallback((key: ExampleKey) => {
    if (!comparisonRef.current[key]) {
      comparisonRef.current = { ...comparisonRef.current, [key]: true };
      setExamples(comparisonRef.current);
    }
    const item = EXAMPLES[key];
    setFeedback(
      `${item.label}: ${item.kind === "thermoplastic" ? "Thermoplastic" : "Thermosetting plastic"}. ${item.note}`,
    );
  }, []);

  const sortObject = useCallback(
    (key: SortKey, kind: PlasticKind) => {
      const correct: Record<SortKey, PlasticKind> = {
        pvc: "thermoplastic",
        bakelite: "thermoset",
      };
      if (kind !== correct[key]) {
        setFeedback(
          "Both objects feel rigid. Think about which material can soften and be reshaped when reheated.",
        );
        return;
      }
      if (!sortedRef.current[key]) {
        sortedRef.current = { ...sortedRef.current, [key]: kind };
        setSorted(sortedRef.current);
        awardPoint();
      }
      setFeedback(
        key === "pvc"
          ? "Correct: rigid PVC is still a thermoplastic."
          : "Correct: Bakelite is a cross-linked thermosetting plastic.",
      );
    },
    [awardPoint],
  );

  const heatFinalDiscs = useCallback(() => {
    if (!finalHeatedRef.current) {
      finalHeatedRef.current = true;
      setFinalHeated(true);
    }
    setFeedback(
      "Test result: Sample A softened; Sample B stayed set. Choose the sample that can flow into the star mould.",
    );
  }, []);

  const chooseBadgeDisc = useCallback(
    (sample: "a" | "b") => {
      if (!finalHeatedRef.current) {
        setFeedback("Heat both samples before choosing.");
        return;
      }
      if (sample === "b") {
        if (retryCountRef.current >= 1) {
          setFeedback(
            "The retry has already been used. Choose the sample that softened during the test.",
          );
          return;
        }
        retryCountRef.current = 1;
        setRetryCount(1);
        setFeedback(
          "The mould remains empty. Which sample softened during the test? Try once more.",
        );
        return;
      }
      if (!badgeCompleteRef.current) {
        badgeCompleteRef.current = true;
        setBadgeComplete(true);
        awardPoint();
      }
      setFeedback(
        "Sample A filled the mould, cooled, and snapped into the badge slot. Mission complete!",
      );
    },
    [awardPoint],
  );

  const showGuidedResult = useCallback(() => {
    if (badgeCompleteRef.current) return;
    stageRef.current = 6;
    finalHeatedRef.current = true;
    badgeCompleteRef.current = true;
    setStage(6);
    setFinalHeated(true);
    setBadgeComplete(true);
    setGuidedCompletion(true);
    setFeedback(
      "Five-minute guided result: Sample A softened, filled the star mould, and cooled into the missing badge.",
    );
    stageVisualRef.current(6);
    narrate(
      "Time is complete, so here is the guided result. Both samples started round. Only the thermoplastic softened and could be reshaped into the star badge.",
    );
  }, [narrate]);

  useEffect(() => {
    if (!started || badgeComplete) return;
    deadlineRef.current ??= Date.now() + SIMULATION_DURATION_SECONDS * 1000;
    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
      secondsRemainingRef.current = remaining;
      boardUpdateRef.current();
      if (remaining === 0) showGuidedResult();
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [badgeComplete, showGuidedResult, started]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x15101f);
    scene.fog = new THREE.Fog(0x15101f, 9, 25);

    const camera = new THREE.PerspectiveCamera(
      54,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.05,
      60,
    );
    camera.position.set(0, 2.45, 6.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.tabIndex = -1;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.55, -0.8);
    controls.enableDamping = true;
    controls.minDistance = 4.3;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI * 0.56;

    scene.add(new THREE.HemisphereLight(0xffedd5, 0x150c22, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const orangeLight = new THREE.PointLight(0xfb923c, 19, 11);
    orangeLight.position.set(-4, 3, 0);
    scene.add(orangeLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 14, 10);
    cyanLight.position.set(4, 2.5, -2);
    scene.add(cyanLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x21152d,
        roughness: 0.64,
        metalness: 0.2,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    for (let ringIndex = 1; ringIndex <= 4; ringIndex += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.7 + ringIndex * 1.75, 0.018, 8, 96),
        new THREE.MeshBasicMaterial({
          color: ringIndex % 2 ? 0x9a3412 : 0x155e75,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.012;
      scene.add(ring);
    }

    const interactive: THREE.Object3D[] = [];
    const makeActionButton = (
      group: THREE.Group | THREE.Scene,
      label: string,
      action: string,
      x: number,
      y: number,
      width = 1.75,
      accent = "#22d3ee",
    ) => {
      const button = labelSprite(label, accent, width);
      button.position.set(x, y, -2.7);
      setAction(button, action);
      interactive.push(button);
      group.add(button);
      return button;
    };
    const makeBench = (group: THREE.Group, width = 6.4) => {
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.22, 2.25),
        new THREE.MeshStandardMaterial({
          color: 0x4a2a31,
          metalness: 0.34,
          roughness: 0.42,
        }),
      );
      top.position.set(0, 0.94, -1.15);
      top.castShadow = true;
      group.add(top);
      [-width / 2 + 0.35, width / 2 - 0.35].forEach((x) => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.95, 0.24),
          new THREE.MeshStandardMaterial({ color: 0x29202f }),
        );
        leg.position.set(x, 0.46, -1.15);
        group.add(leg);
      });
    };

    const scanGroup = new THREE.Group();
    makeBench(scanGroup);
    const petBottle = new THREE.Group();
    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 1.25, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.54,
        transmission: 0.3,
        roughness: 0.15,
      }),
    );
    bottleBody.position.y = 0.65;
    const bottleNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 0.38, 20),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee }),
    );
    bottleNeck.position.y = 1.46;
    petBottle.add(bottleBody, bottleNeck);
    petBottle.position.set(-2.15, 1.05, -1.05);
    setAction(petBottle, "scan:pet");
    interactive.push(petBottle);
    scanGroup.add(petBottle);

    const pvcPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 1.35, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.1,
        roughness: 0.38,
        side: THREE.DoubleSide,
      }),
    );
    pvcPipe.rotation.z = Math.PI / 2;
    pvcPipe.position.set(-0.75, 1.25, -1.05);
    scanGroup.add(pvcPipe);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.09, 32),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.28 }),
    );
    plate.position.set(0.65, 1.16, -1.05);
    scanGroup.add(plate);

    const discMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.08,
      roughness: 0.3,
    });
    const discA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.16, 32),
      discMaterial,
    );
    discA.rotation.x = Math.PI / 2;
    discA.position.set(1.65, 1.28, -0.85);
    setAction(discA, "scan:disc-a");
    interactive.push(discA);
    const discB = discA.clone();
    discB.position.set(2.45, 1.28, -0.85);
    setAction(discB, "scan:disc-b");
    interactive.push(discB);
    scanGroup.add(discA, discB);
    const discALabel = labelSprite("DISC A", "#fb923c", 0.75);
    discALabel.position.set(1.65, 1.85, -0.86);
    const discBLabel = labelSprite("DISC B", "#fb923c", 0.75);
    discBLabel.position.set(2.45, 1.85, -0.86);
    scanGroup.add(discALabel, discBLabel);

    const petChains = new THREE.Group();
    for (let row = 0; row < 3; row += 1) {
      const points: THREE.Vector3[] = [];
      for (let point = 0; point < 9; point += 1) {
        points.push(
          new THREE.Vector3(
            -0.6 + point * 0.15,
            Math.sin(point * 1.2 + row) * 0.1 + row * 0.24,
            0,
          ),
        );
      }
      const chain = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0x22d3ee }),
      );
      petChains.add(chain);
      points.forEach((position) => {
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 8),
          new THREE.MeshStandardMaterial({
            color: 0x67e8f9,
            emissive: 0x0891b2,
            emissiveIntensity: 0.7,
          }),
        );
        bead.position.copy(position);
        petChains.add(bead);
      });
    }
    petChains.position.set(-2.15, 3.05, -1.15);
    petChains.visible = false;
    scanGroup.add(petChains);
    const scanLabel = labelSprite(
      "SCAN: PET → POLYMER CHAINS",
      "#22d3ee",
      2.25,
    );
    scanLabel.position.set(-1.65, 4.0, -1.5);
    scanGroup.add(scanLabel);
    const scanContinueButton = makeActionButton(
      scanGroup,
      "CONTINUE TO MOULDING",
      "stage:1",
      0,
      0.55,
      2.1,
      "#fb923c",
    );
    scanContinueButton.visible = false;
    scene.add(scanGroup);

    const mouldGroup = new THREE.Group();
    makeBench(mouldGroup, 5.8);
    const machineBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.7, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0x374151,
        metalness: 0.62,
        roughness: 0.28,
      }),
    );
    machineBase.position.set(0, 1.75, -1.15);
    mouldGroup.add(machineBase);
    const hopper = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 1.2, 4, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.7,
        roughness: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    hopper.rotation.y = Math.PI / 4;
    hopper.position.set(-0.8, 3.05, -1.1);
    mouldGroup.add(hopper);
    const pellets: THREE.Mesh[] = [];
    for (let index = 0; index < 22; index += 1) {
      const pellet = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x9a3412,
          emissiveIntensity: 0.18,
        }),
      );
      pellet.position.set(
        -1.35 + (index % 6) * 0.18,
        1.23 + Math.floor(index / 6) * 0.15,
        -0.5 + (index % 3) * 0.15,
      );
      pellet.userData.baseY = pellet.position.y;
      pellets.push(pellet);
      mouldGroup.add(pellet);
    }
    const roundMould = new THREE.Mesh(
      new THREE.TorusGeometry(0.63, 0.12, 16, 42),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.78,
        roughness: 0.2,
      }),
    );
    roundMould.position.set(0.7, 2.05, -0.3);
    mouldGroup.add(roundMould);
    const mouldedDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.15, 32),
      discMaterial.clone(),
    );
    mouldedDisc.rotation.x = Math.PI / 2;
    mouldedDisc.position.set(0.7, 2.05, -0.28);
    mouldedDisc.scale.setScalar(0.05);
    mouldGroup.add(mouldedDisc);
    const mouldLabel = labelSprite(
      "POLYTHENE → ROUND MOULD → DISC A",
      "#fbbf24",
      2.55,
    );
    mouldLabel.position.set(0, 4.05, -1.55);
    mouldGroup.add(mouldLabel);
    const mouldActionButtons = [
      ["LOAD POLYTHENE PELLETS", "mould:1"],
      ["PULL THE MOULD LEVER", "mould:2"],
      ["COOL AND OPEN", "mould:3"],
      ["TRACE THE ROUND EDGE", "mould:4"],
    ].map(([label, action]) =>
      makeActionButton(mouldGroup, label, action, 0, 0.55, 2.15, "#fbbf24"),
    );
    const mouldContinueButton = makeActionButton(
      mouldGroup,
      "RESHAPE DISC A",
      "stage:2",
      0,
      0.55,
      1.75,
      "#fb923c",
    );
    mouldGroup.visible = false;
    scene.add(mouldGroup);

    const reshapeGroup = new THREE.Group();
    makeBench(reshapeGroup, 5.8);
    const pressFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 2.7, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.68,
        roughness: 0.22,
      }),
    );
    pressFrame.position.set(0, 2.35, -2.0);
    reshapeGroup.add(pressFrame);
    const pressHead = new THREE.Mesh(
      starGeometry(0.77, 0.36, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.8,
        roughness: 0.16,
      }),
    );
    pressHead.position.set(0, 2.65, -1.65);
    reshapeGroup.add(pressHead);
    const reshapeRound = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.18, 32),
      discMaterial.clone(),
    );
    reshapeRound.rotation.x = Math.PI / 2;
    reshapeRound.position.set(0, 1.4, -1.48);
    reshapeGroup.add(reshapeRound);
    const reshapeStar = new THREE.Mesh(
      starGeometry(),
      new THREE.MeshStandardMaterial({
        color: 0xfb923c,
        emissive: 0x9a3412,
        emissiveIntensity: 0.24,
        roughness: 0.3,
      }),
    );
    reshapeStar.position.set(0, 1.4, -1.48);
    reshapeStar.scale.setScalar(0.01);
    reshapeStar.visible = false;
    reshapeGroup.add(reshapeStar);
    const heatHalo = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.06, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    );
    heatHalo.position.set(0, 1.4, -1.52);
    heatHalo.visible = false;
    reshapeGroup.add(heatHalo);
    const mobileChains = new THREE.Group();
    const chainBeads: THREE.Mesh[] = [];
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 9, 7),
          new THREE.MeshStandardMaterial({
            color: 0xfde68a,
            emissive: 0xea580c,
            emissiveIntensity: 0.48,
          }),
        );
        bead.position.set(-0.55 + column * 0.16, row * 0.18, 0);
        bead.userData.row = row;
        bead.userData.column = column;
        chainBeads.push(bead);
        mobileChains.add(bead);
      }
    }
    mobileChains.position.set(-2.35, 2.2, -0.9);
    reshapeGroup.add(mobileChains);
    const reshapeLabel = labelSprite(
      "THERMOPLASTIC: SOFTEN → REMOULD → COOL",
      "#fb923c",
      2.7,
    );
    reshapeLabel.position.set(0, 4.25, -1.65);
    reshapeGroup.add(reshapeLabel);
    const reshapeActionButtons = [
      ["PRESS WITH HEAT OFF", "reshape:1"],
      ["TURN ON SIMULATED HEAT", "reshape:2"],
      ["PRESS INTO STAR MOULD", "reshape:3"],
      ["SWITCH HEAT OFF AND COOL", "reshape:4"],
    ].map(([label, action]) =>
      makeActionButton(reshapeGroup, label, action, 0, 0.55, 2.25, "#fb923c"),
    );
    const reshapeContinueButton = makeActionButton(
      reshapeGroup,
      "TEST DISC B",
      "stage:3",
      0,
      0.55,
      1.65,
      "#c084fc",
    );
    reshapeGroup.visible = false;
    scene.add(reshapeGroup);

    const crossGroup = new THREE.Group();
    makeBench(crossGroup, 5.8);
    const crossDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.63, 0.63, 0.2, 32),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.32,
        metalness: 0.08,
      }),
    );
    crossDisc.rotation.x = Math.PI / 2;
    crossDisc.position.set(1.55, 1.55, -1.1);
    crossGroup.add(crossDisc);
    const starOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(starGeometry(0.78, 0.36, 0.18)),
      new THREE.LineBasicMaterial({ color: 0x94a3b8 }),
    );
    starOutline.position.set(1.55, 1.55, -1.38);
    crossGroup.add(starOutline);
    const fixedChains = new THREE.Group();
    const fixedPositions: THREE.Vector3[][] = [];
    for (let row = 0; row < 4; row += 1) {
      const rowPositions: THREE.Vector3[] = [];
      for (let column = 0; column < 8; column += 1) {
        const position = new THREE.Vector3(
          -0.65 + column * 0.19,
          -0.25 + row * 0.24 + Math.sin(column + row) * 0.03,
          0,
        );
        rowPositions.push(position);
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 9, 7),
          new THREE.MeshStandardMaterial({
            color: 0xc4b5fd,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.46,
          }),
        );
        bead.position.copy(position);
        fixedChains.add(bead);
      }
      fixedPositions.push(rowPositions);
    }
    const crossLinks: THREE.Line[] = [];
    for (let row = 0; row < 3; row += 1) {
      [1, 3, 5, 7].forEach((column) => {
        const link = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            fixedPositions[row][column],
            fixedPositions[row + 1][column],
          ]),
          new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
        );
        link.visible = false;
        crossLinks.push(link);
        fixedChains.add(link);
      });
    }
    fixedChains.position.set(-1.6, 2.35, -0.8);
    crossGroup.add(fixedChains);
    const crossLabel = labelSprite(
      "THERMOSETTING: PERMANENT CROSS-LINKS",
      "#c084fc",
      2.65,
    );
    crossLabel.position.set(0, 4.15, -1.6);
    crossGroup.add(crossLabel);
    const crossActionButtons = [
      ["MOVE SLIDER: AFTER SETTING", "cross:1"],
      ["TURN ON SIMULATED HEAT", "cross:2"],
      ["PRESS INTO STAR MOULD", "cross:3"],
      ["MAGNIFY THE CROSS-LINKS", "cross:4"],
    ].map(([label, action]) =>
      makeActionButton(crossGroup, label, action, 0, 0.55, 2.35, "#c084fc"),
    );
    const crossContinueButton = makeActionButton(
      crossGroup,
      "COMPARE PLASTICS",
      "stage:4",
      0,
      0.55,
      1.8,
      "#22d3ee",
    );
    crossGroup.visible = false;
    scene.add(crossGroup);

    const compareGroup = new THREE.Group();
    makeBench(compareGroup, 6.6);
    const thermoStar = new THREE.Mesh(
      starGeometry(),
      new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.28 }),
    );
    thermoStar.position.set(-1.6, 1.7, -1.0);
    const thermoRound = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3 }),
    );
    thermoRound.rotation.x = Math.PI / 2;
    thermoRound.position.set(1.6, 1.7, -1.0);
    const thermoLabel = labelSprite("THERMOPLASTIC → STAR", "#fb923c", 1.75);
    thermoLabel.position.set(-1.6, 2.55, -1.15);
    const setLabel = labelSprite("THERMOSETTING → ROUND", "#c084fc", 1.85);
    setLabel.position.set(1.6, 2.55, -1.15);
    compareGroup.add(thermoStar, thermoRound, thermoLabel, setLabel);
    const exampleColors = [0x38bdf8, 0xe2e8f0, 0x78350f, 0xfef3c7];
    EXAMPLE_KEYS.forEach((key, index) => {
      const sample = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.42, 0.4),
        new THREE.MeshStandardMaterial({
          color: exampleColors[index],
          roughness: 0.35,
        }),
      );
      sample.position.set(-2.4 + index * 1.6, 1.22, -0.25);
      const label = labelSprite(
        EXAMPLES[key].label.toUpperCase(),
        "#fdba74",
        1.12,
      );
      label.position.set(sample.position.x, 0.62, -0.15);
      compareGroup.add(sample, label);
    });
    const replayButton = makeActionButton(
      compareGroup,
      "REPLAY BOTH TESTS",
      "compare:replay",
      0,
      0.35,
      1.85,
      "#fbbf24",
    );
    const exampleButtons = EXAMPLE_KEYS.map((key, index) =>
      makeActionButton(
        compareGroup,
        `SCAN ${EXAMPLES[key].label.toUpperCase()}`,
        `compare:${key}`,
        index % 2 === 0 ? -1.25 : 1.25,
        index < 2 ? 0.9 : 0.45,
        1.55,
        EXAMPLES[key].kind === "thermoplastic" ? "#fb923c" : "#c084fc",
      ),
    );
    const compareContinueButton = makeActionButton(
      compareGroup,
      "BEGIN WORKSHOP CHALLENGE",
      "stage:5",
      0,
      0.35,
      2.25,
      "#fbbf24",
    );
    compareGroup.visible = false;
    scene.add(compareGroup);

    const sortGroup = new THREE.Group();
    makeBench(sortGroup, 6.4);
    const thermoTray = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.22, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.42 }),
    );
    thermoTray.position.set(-1.55, 1.15, -1.1);
    const setTray = thermoTray.clone();
    (setTray.material as THREE.MeshStandardMaterial) =
      new THREE.MeshStandardMaterial({
        color: 0x5b21b6,
        roughness: 0.42,
      });
    setTray.position.x = 1.55;
    const trayLabelA = labelSprite("THERMOPLASTIC", "#fb923c", 1.55);
    trayLabelA.position.set(-1.55, 0.65, -0.8);
    const trayLabelB = labelSprite("THERMOSETTING", "#c084fc", 1.55);
    trayLabelB.position.set(1.55, 0.65, -0.8);
    const challengePipe = pvcPipe.clone();
    challengePipe.position.set(-0.65, 2.0, -0.6);
    const bakelite = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.95, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.32 }),
    );
    bakelite.position.set(0.65, 2.0, -0.6);
    sortGroup.add(
      thermoTray,
      setTray,
      trayLabelA,
      trayLabelB,
      challengePipe,
      bakelite,
    );
    const sortButtons = {
      pvcThermoplastic: makeActionButton(
        sortGroup,
        "PVC → THERMOPLASTIC",
        "sort:pvc:thermoplastic",
        -1.25,
        0.65,
        1.55,
        "#fb923c",
      ),
      pvcThermoset: makeActionButton(
        sortGroup,
        "PVC → THERMOSETTING",
        "sort:pvc:thermoset",
        -1.25,
        0.3,
        1.55,
        "#c084fc",
      ),
      bakeliteThermoplastic: makeActionButton(
        sortGroup,
        "BAKELITE → THERMOPLASTIC",
        "sort:bakelite:thermoplastic",
        1.25,
        0.65,
        1.8,
        "#fb923c",
      ),
      bakeliteThermoset: makeActionButton(
        sortGroup,
        "BAKELITE → THERMOSETTING",
        "sort:bakelite:thermoset",
        1.25,
        0.3,
        1.75,
        "#c084fc",
      ),
    };
    const sortContinueButton = makeActionButton(
      sortGroup,
      "MAKE THE MISSING BADGE",
      "stage:6",
      0,
      0.35,
      2.15,
      "#fbbf24",
    );
    sortGroup.visible = false;
    scene.add(sortGroup);

    const finalGroup = new THREE.Group();
    makeBench(finalGroup, 6.2);
    const finalDiscA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.18, 32),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }),
    );
    finalDiscA.rotation.x = Math.PI / 2;
    finalDiscA.position.set(-1.2, 1.55, -0.75);
    const finalDiscB = finalDiscA.clone();
    (finalDiscB.material as THREE.MeshStandardMaterial) =
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.3,
      });
    finalDiscB.position.x = 0;
    const finalStar = new THREE.Mesh(
      starGeometry(0.78, 0.36, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xea580c,
        emissiveIntensity: 0.4,
        metalness: 0.28,
        roughness: 0.24,
      }),
    );
    finalStar.position.set(1.65, 1.65, -0.65);
    finalStar.scale.setScalar(0.01);
    finalStar.visible = false;
    const badgeSlot = new THREE.LineSegments(
      new THREE.EdgesGeometry(starGeometry(0.9, 0.42, 0.18)),
      new THREE.LineBasicMaterial({ color: 0xfde68a }),
    );
    badgeSlot.position.set(1.65, 1.65, -0.94);
    const finalLabel = labelSprite(
      "TEST → CHOOSE → MOULD THE BADGE",
      "#fbbf24",
      2.6,
    );
    finalLabel.position.set(0, 4.05, -1.45);
    finalGroup.add(finalDiscA, finalDiscB, finalStar, badgeSlot, finalLabel);
    const heatBothButton = makeActionButton(
      finalGroup,
      "HEAT BOTH SAMPLES",
      "final:heat",
      0,
      0.65,
      1.85,
      "#ef4444",
    );
    const chooseSampleAButton = makeActionButton(
      finalGroup,
      "CHOOSE A — SOFTENED",
      "final:a",
      -1.15,
      0.4,
      1.6,
      "#fbbf24",
    );
    const chooseSampleBButton = makeActionButton(
      finalGroup,
      "CHOOSE B — STAYED SET",
      "final:b",
      1.15,
      0.4,
      1.65,
      "#c084fc",
    );
    const restartButton = makeActionButton(
      finalGroup,
      "RUN THE MISSION AGAIN",
      "restart",
      0,
      0.45,
      2,
      "#fbbf24",
    );
    finalGroup.visible = false;
    scene.add(finalGroup);

    makeActionButton(
      scene,
      "REPLAY NARRATION",
      "narration:replay",
      -2.45,
      3.55,
      1.55,
      "#22d3ee",
    );

    const boardCanvas = document.createElement("canvas");
    boardCanvas.width = 940;
    boardCanvas.height = 330;
    drawMissionBoard(boardCanvas, 0, 0, SIMULATION_DURATION_SECONDS);
    const boardTexture = new THREE.CanvasTexture(boardCanvas);
    boardTexture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(4.55, 1.6),
      new THREE.MeshBasicMaterial({ map: boardTexture }),
    );
    board.position.set(0, 4.65, -3.55);
    scene.add(board);
    boardUpdateRef.current = () => {
      drawMissionBoard(
        boardCanvas,
        stageRef.current,
        pointsRef.current,
        secondsRemainingRef.current,
      );
      boardTexture.needsUpdate = true;
    };

    stageVisualRef.current = (next) => {
      scanGroup.visible = next === 0;
      mouldGroup.visible = next === 1;
      reshapeGroup.visible = next === 2;
      crossGroup.visible = next === 3;
      compareGroup.visible = next === 4;
      sortGroup.visible = next === 5;
      finalGroup.visible = next === 6;
      boardUpdateRef.current();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handleAction = (action: string) => {
      if (stageRef.current === 0 && action.startsWith("scan:")) {
        scanItem(action.slice(5) as ScanKey);
        return;
      }
      if (action === "narration:replay") {
        narrate(NARRATIONS[stageRef.current]);
        return;
      }
      if (
        action === "stage:1" &&
        Boolean(scannedRef.current.pet) &&
        Boolean(scannedRef.current["disc-a"]) &&
        Boolean(scannedRef.current["disc-b"])
      ) {
        goToStage(1);
        return;
      }
      if (stageRef.current === 1 && action.startsWith("mould:")) {
        advanceMould(Number(action.slice(6)));
        return;
      }
      if (action === "stage:2" && mouldRef.current >= 4) {
        goToStage(2);
        return;
      }
      if (stageRef.current === 2 && action.startsWith("reshape:")) {
        advanceReshape(Number(action.slice(8)));
        return;
      }
      if (action === "stage:3" && reshapeRef.current >= 4) {
        goToStage(3);
        return;
      }
      if (stageRef.current === 3 && action === "cross:1") {
        revealCrosslinks();
        return;
      }
      if (stageRef.current === 3 && action.startsWith("cross:")) {
        advanceCrosslink(Number(action.slice(6)));
        return;
      }
      if (action === "stage:4" && crosslinkRef.current >= 4) {
        goToStage(4);
        return;
      }
      if (stageRef.current === 4 && action === "compare:replay") {
        replayComparison();
        return;
      }
      if (stageRef.current === 4 && action.startsWith("compare:")) {
        inspectExample(action.slice(8) as ExampleKey);
        return;
      }
      if (
        action === "stage:5" &&
        replayRef.current &&
        EXAMPLE_KEYS.every((key) => comparisonRef.current[key])
      ) {
        goToStage(5);
        return;
      }
      if (stageRef.current === 5 && action.startsWith("sort:")) {
        const [, key, kind] = action.split(":") as [
          string,
          SortKey,
          PlasticKind,
        ];
        sortObject(key, kind);
        return;
      }
      if (
        action === "stage:6" &&
        Boolean(sortedRef.current.pvc) &&
        Boolean(sortedRef.current.bakelite)
      ) {
        goToStage(6);
        return;
      }
      if (stageRef.current === 6 && action === "final:heat") {
        heatFinalDiscs();
        return;
      }
      if (stageRef.current === 6 && action.startsWith("final:")) {
        chooseBadgeDisc(action.slice(6) as "a" | "b");
        return;
      }
      if (action === "restart") {
        window.location.reload();
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
        new THREE.LineBasicMaterial({ color: 0xfdba74 }),
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
    const targetScale = new THREE.Vector3();
    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      const reduceMotion = reducedMotionRef.current;
      controls.update();
      petChains.visible = Boolean(scannedRef.current.pet);
      pellets.forEach((pellet, index) => {
        pellet.visible = mouldRef.current < 2;
        pellet.position.y =
          Number(pellet.userData.baseY) +
          (reduceMotion ? 0 : Math.sin(elapsed * 2.4 + index) * 0.015);
      });
      const mouldTarget = mouldRef.current >= 2 ? 1 : 0.05;
      if (reduceMotion) mouldedDisc.scale.setScalar(mouldTarget);
      else mouldedDisc.scale.lerp(targetScale.setScalar(mouldTarget), 0.08);
      heatHalo.visible = reshapeRef.current >= 2 && reshapeRef.current < 4;
      heatHalo.rotation.z = reduceMotion ? 0 : elapsed * 0.7;
      reshapeRound.visible = reshapeRef.current < 3;
      reshapeStar.visible = reshapeRef.current >= 3;
      if (reshapeStar.visible) {
        if (reduceMotion) reshapeStar.scale.setScalar(1);
        else reshapeStar.scale.lerp(targetScale.setScalar(1), 0.07);
      }
      chainBeads.forEach((bead) => {
        const mobile = reshapeRef.current >= 2 && reshapeRef.current < 4;
        bead.position.x =
          -0.55 +
          Number(bead.userData.column) * 0.16 +
          (mobile && !reduceMotion
            ? Math.sin(elapsed * 3 + Number(bead.userData.row)) * 0.07
            : 0);
      });
      crossLinks.forEach((link) => {
        link.visible = crosslinkRef.current >= 1;
      });
      crossDisc.rotation.z =
        crosslinkRef.current >= 2 && !reduceMotion
          ? Math.sin(elapsed * 5) * 0.025
          : 0;
      finalDiscA.scale.setScalar(
        finalHeatedRef.current && !reduceMotion
          ? 1 + Math.sin(elapsed * 3) * 0.045
          : 1,
      );
      finalDiscB.scale.setScalar(1);
      finalStar.visible = badgeCompleteRef.current;
      if (finalStar.visible) {
        if (reduceMotion) finalStar.scale.setScalar(1);
        else finalStar.scale.lerp(targetScale.setScalar(1), 0.06);
        finalStar.rotation.z = reduceMotion
          ? 0
          : Math.sin(elapsed * 1.4) * 0.08;
      }

      scanContinueButton.visible =
        Boolean(scannedRef.current.pet) &&
        Boolean(scannedRef.current["disc-a"]) &&
        Boolean(scannedRef.current["disc-b"]);
      mouldActionButtons.forEach((button, index) => {
        button.visible = mouldRef.current === index;
      });
      mouldContinueButton.visible = mouldRef.current >= 4;
      reshapeActionButtons.forEach((button, index) => {
        button.visible = reshapeRef.current === index;
      });
      reshapeContinueButton.visible = reshapeRef.current >= 4;
      crossActionButtons.forEach((button, index) => {
        button.visible = crosslinkRef.current === index;
      });
      crossContinueButton.visible = crosslinkRef.current >= 4;
      replayButton.visible = !replayRef.current;
      exampleButtons.forEach((button, index) => {
        button.visible =
          replayRef.current && !comparisonRef.current[EXAMPLE_KEYS[index]];
      });
      compareContinueButton.visible =
        replayRef.current &&
        EXAMPLE_KEYS.every((key) => comparisonRef.current[key]);
      const pvcSorted = Boolean(sortedRef.current.pvc);
      const bakeliteSorted = Boolean(sortedRef.current.bakelite);
      sortButtons.pvcThermoplastic.visible = !pvcSorted;
      sortButtons.pvcThermoset.visible = !pvcSorted;
      sortButtons.bakeliteThermoplastic.visible = !bakeliteSorted;
      sortButtons.bakeliteThermoset.visible = !bakeliteSorted;
      sortContinueButton.visible = pvcSorted && bakeliteSorted;
      heatBothButton.visible =
        !finalHeatedRef.current && !badgeCompleteRef.current;
      chooseSampleAButton.visible =
        finalHeatedRef.current && !badgeCompleteRef.current;
      chooseSampleBButton.visible =
        finalHeatedRef.current &&
        !badgeCompleteRef.current &&
        retryCountRef.current === 0;
      restartButton.visible = badgeCompleteRef.current;
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
          object instanceof THREE.LineSegments ||
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
  }, [
    advanceCrosslink,
    advanceMould,
    advanceReshape,
    chooseBadgeDisc,
    goToStage,
    heatFinalDiscs,
    inspectExample,
    narrate,
    replayComparison,
    revealCrosslinks,
    scanItem,
    sortObject,
  ]);

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

  const scannedComplete =
    Boolean(scanned.pet) &&
    Boolean(scanned["disc-a"]) &&
    Boolean(scanned["disc-b"]);
  const comparisonComplete =
    replayed && EXAMPLE_KEYS.every((key) => examples[key]);
  const sortingComplete = Boolean(sorted.pvc) && Boolean(sorted.bakelite);
  const timerMinutes = Math.floor(secondsRemaining / 60);
  const timerSeconds = String(secondsRemaining % 60).padStart(2, "0");

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#15101f",
        color: "#fff7ed",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        ref={mountRef}
        role="img"
        aria-label={`Interactive 3D moulding workshop. ${STAGES[stage].title}. ${feedback}`}
        style={{ position: "absolute", inset: 0 }}
      />

      {!started ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "grid",
            placeItems: "center",
            padding: 24,
            background:
              "radial-gradient(circle at 50% 30%, rgba(234,88,12,.24), rgba(21,16,31,.96) 58%)",
          }}
        >
          <div style={{ maxWidth: 650, textAlign: "center" }}>
            <div style={{ fontSize: 58, marginBottom: 12 }}>⭐🏭🔬</div>
            <div
              style={{
                color: "#fdba74",
                fontWeight: 800,
                letterSpacing: ".1em",
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              CLASS 8 · CHAPTER 3 · ACTIVITY 3
            </div>
            <h1
              style={{ fontSize: "clamp(2rem,5vw,3.3rem)", margin: "0 0 14px" }}
            >
              Thermoplastics & Thermosetting Plastics
            </h1>
            <p
              style={{
                color: "#fed7aa",
                lineHeight: 1.65,
                fontSize: 17,
                margin: "0 auto 24px",
              }}
            >
              Operate a virtual moulding machine, reveal polymer chains and
              cross-links, and discover which round disc can become the missing
              star badge.
            </p>
            <button
              onClick={() => {
                setStarted(true);
                narrate(NARRATIONS[0]);
              }}
              style={{
                padding: "13px 26px",
                minHeight: 48,
                border: 0,
                borderRadius: 10,
                background: "#ea580c",
                color: "white",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Enter the virtual moulding workshop
            </button>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 16 }}>
              Stationary experience · All heat is simulated · Browser, touch,
              and Meta Quest controls
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 4,
              padding: "8px 13px",
              borderRadius: 10,
              background: "rgba(24,16,31,.82)",
              border: "1px solid rgba(251,146,60,.25)",
              backdropFilter: "blur(9px)",
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            STAGE {stage + 1}/7
            {stage >= 5
              ? ` · ${points}/3 challenge points`
              : " · Guided learning"}
            <span role="timer" aria-label={`${secondsRemaining} seconds left`}>
              {` · ${timerMinutes}:${timerSeconds}`}
            </span>
          </div>

          {vrSupported ? (
            <button
              onClick={enterVR}
              style={{
                position: "absolute",
                left: 16,
                top: 65,
                zIndex: 5,
                padding: "9px 13px",
                borderRadius: 9,
                border: "1px solid rgba(34,211,238,.35)",
                background: "rgba(8,47,73,.82)",
                color: "#cffafe",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Enter VR
            </button>
          ) : null}

          <aside
            style={{
              position: "absolute",
              top: 68,
              right: 16,
              width: "min(405px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 88px)",
              overflowY: "auto",
              zIndex: 4,
              padding: 16,
              borderRadius: 14,
              background: "rgba(24,16,31,.9)",
              border: "1px solid rgba(251,146,60,.24)",
              boxShadow: "0 18px 55px rgba(0,0,0,.32)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h2 style={{ margin: "0 0 7px", fontSize: 20 }}>
              {STAGES[stage].title}
            </h2>
            <p
              style={{
                color: "#fed7aa",
                lineHeight: 1.5,
                fontSize: 13,
                margin: "0 0 10px",
              }}
            >
              {STAGES[stage].cue}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <button
                onClick={() => narrate(NARRATIONS[stage])}
                style={choiceStyle(false, "#22d3ee")}
              >
                🔊 Replay
              </button>
              <button
                aria-pressed={muted}
                onClick={toggleMuted}
                style={choiceStyle(muted, "#22d3ee")}
              >
                {muted ? "🔇 Muted" : "🔉 Sound"}
              </button>
              <button
                aria-pressed={reducedMotion}
                onClick={toggleReducedMotion}
                style={choiceStyle(reducedMotion, "#22d3ee")}
              >
                {reducedMotion ? "Motion: low" : "Motion: full"}
              </button>
            </div>
            <div
              aria-live="polite"
              style={{
                padding: 10,
                borderRadius: 9,
                background: "rgba(249,115,22,.1)",
                color: "#ffedd5",
                lineHeight: 1.45,
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {feedback}
            </div>

            {stage === 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(
                  [
                    ["pet", "🧴 Scan PET bottle"],
                    ["disc-a", "🟠 Scan Disc A"],
                    ["disc-b", "🟣 Scan Disc B"],
                  ] as Array<[ScanKey, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => scanItem(key)}
                    style={choiceStyle(Boolean(scanned[key]))}
                  >
                    {scanned[key] ? "✓ " : "🔍 "}
                    {label}
                  </button>
                ))}
                <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: 12 }}>
                  Scanned {Object.keys(scanned).length}/3 required objects
                </p>
                <button
                  disabled={!scannedComplete}
                  onClick={() => goToStage(1)}
                  style={nextStyle(scannedComplete)}
                >
                  Operate the moulding machine →
                </button>
              </div>
            ) : null}

            {stage === 1 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  "Load polythene pellets",
                  "Pull the Mould lever",
                  "Cool and open the mould",
                  "Trace the round edge",
                ].map((label, index) => {
                  const step = index + 1;
                  return (
                    <button
                      key={label}
                      onClick={() => advanceMould(step)}
                      disabled={mouldStep < step - 1}
                      style={choiceStyle(mouldStep >= step, "#fbbf24")}
                    >
                      {mouldStep >= step ? "✓ " : `${step}. `}
                      {label}
                    </button>
                  );
                })}
                <button
                  disabled={mouldStep < 4}
                  onClick={() => goToStage(2)}
                  style={nextStyle(mouldStep >= 4)}
                >
                  Try reshaping Disc A →
                </button>
              </div>
            ) : null}

            {stage === 2 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  "Press with heat off",
                  "Turn on simulated heat",
                  "Press into star mould",
                  "Switch heat off and cool",
                ].map((label, index) => {
                  const step = index + 1;
                  return (
                    <button
                      key={label}
                      onClick={() => advanceReshape(step)}
                      disabled={reshapeStep < step - 1}
                      style={choiceStyle(reshapeStep >= step)}
                    >
                      {reshapeStep >= step ? "✓ " : `${step}. `}
                      {label}
                    </button>
                  );
                })}
                {reshapeStep >= 4 ? (
                  <div
                    style={{
                      padding: 9,
                      borderRadius: 8,
                      background: "rgba(249,115,22,.12)",
                      fontSize: 12,
                    }}
                  >
                    <strong>Thermoplastic:</strong> softens on suitable
                    reheating and can be remoulded.
                  </div>
                ) : null}
                <button
                  disabled={reshapeStep < 4}
                  onClick={() => goToStage(3)}
                  style={nextStyle(reshapeStep >= 4)}
                >
                  Test Disc B with the same steps →
                </button>
              </div>
            ) : null}

            {stage === 3 ? (
              <div style={{ display: "grid", gap: 9 }}>
                <label
                  style={{
                    display: "grid",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Polymer structure:{" "}
                  {afterSetting ? "After Setting" : "Before Setting"}
                  <input
                    aria-label="Before setting to after setting"
                    type="range"
                    min={0}
                    max={1}
                    step={1}
                    value={afterSetting ? 1 : 0}
                    onChange={(event) => {
                      if (event.currentTarget.value === "1") revealCrosslinks();
                    }}
                  />
                </label>
                {[
                  [2, "Turn on simulated heat"],
                  [3, "Press into star mould"],
                  [4, "Magnify the permanent links"],
                ].map(([stepValue, label]) => {
                  const step = Number(stepValue);
                  return (
                    <button
                      key={String(label)}
                      onClick={() => advanceCrosslink(step)}
                      disabled={crosslinkStep < step - 1}
                      style={choiceStyle(crosslinkStep >= step, "#c084fc")}
                    >
                      {crosslinkStep >= step ? "✓ " : ""}
                      {String(label)}
                    </button>
                  );
                })}
                {crosslinkStep >= 4 ? (
                  <div
                    style={{
                      padding: 9,
                      borderRadius: 8,
                      background: "rgba(139,92,246,.14)",
                      fontSize: 12,
                    }}
                  >
                    <strong>Thermosetting plastic:</strong> permanent
                    cross-links stop it flowing into a new mould.
                  </div>
                ) : null}
                <button
                  disabled={crosslinkStep < 4}
                  onClick={() => goToStage(4)}
                  style={nextStyle(crosslinkStep >= 4)}
                >
                  Compare everyday plastics →
                </button>
              </div>
            ) : null}

            {stage === 4 ? (
              <div style={{ display: "grid", gap: 8 }}>
                <button
                  onClick={replayComparison}
                  style={choiceStyle(replayed, "#fbbf24")}
                >
                  {replayed ? "✓ " : "▶ "}Replay both reheating tests
                </button>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 7,
                  }}
                >
                  {EXAMPLE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => inspectExample(key)}
                      style={choiceStyle(Boolean(examples[key]))}
                    >
                      {examples[key] ? "✓ " : "🔍 "}
                      {EXAMPLES[key].emoji} {EXAMPLES[key].label}
                    </button>
                  ))}
                </div>
                {comparisonComplete ? (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 9,
                      background: "rgba(34,211,238,.1)",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Plastics are mainly polymers. Thermoplastics can soften and
                    be reshaped; thermosetting plastics keep permanent
                    cross-links after setting.
                  </div>
                ) : null}
                <button
                  disabled={!comparisonComplete}
                  onClick={() => goToStage(5)}
                  style={nextStyle(comparisonComplete)}
                >
                  Begin the Workshop Challenge →
                </button>
              </div>
            ) : null}

            {stage === 5 ? (
              <div style={{ display: "grid", gap: 11 }}>
                {(
                  [
                    ["pvc", "🧯 Rigid PVC pipe"],
                    ["bakelite", "🔌 Bakelite switch casing"],
                  ] as Array<[SortKey, string]>
                ).map(([key, label]) => (
                  <div key={key} style={{ display: "grid", gap: 6 }}>
                    <strong style={{ fontSize: 13 }}>
                      {sorted[key] ? "✓ " : ""}
                      {label}
                    </strong>
                    {sorted[key] ? (
                      <div style={{ color: "#86efac", fontSize: 12 }}>
                        Correct:{" "}
                        {sorted[key] === "thermoplastic"
                          ? "Thermoplastic"
                          : "Thermosetting"}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() => sortObject(key, "thermoplastic")}
                          style={choiceStyle(false)}
                        >
                          Thermoplastic
                        </button>
                        <button
                          onClick={() => sortObject(key, "thermoset")}
                          style={choiceStyle(false, "#c084fc")}
                        >
                          Thermosetting
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  disabled={!sortingComplete}
                  onClick={() => goToStage(6)}
                  style={nextStyle(sortingComplete)}
                >
                  Make the missing badge →
                </button>
              </div>
            ) : null}

            {stage === 6 && !badgeComplete ? (
              <div style={{ display: "grid", gap: 9 }}>
                <button
                  onClick={heatFinalDiscs}
                  style={choiceStyle(finalHeated, "#ef4444")}
                >
                  {finalHeated ? "✓ " : "🔥 "}Heat both unlabelled discs
                </button>
                {finalHeated ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: retryCount === 0 ? "1fr 1fr" : "1fr",
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() => chooseBadgeDisc("a")}
                      style={choiceStyle(false, "#fbbf24")}
                    >
                      Choose Sample A — softened
                    </button>
                    {retryCount === 0 ? (
                      <button
                        onClick={() => chooseBadgeDisc("b")}
                        style={choiceStyle(false, "#c084fc")}
                      >
                        Choose Sample B — stayed set
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {retryCount > 0 ? (
                  <div role="alert" style={{ color: "#fecaca", fontSize: 12 }}>
                    One retry available: choose the sample that softened during
                    the test. The incorrect sample is now unavailable.
                  </div>
                ) : null}
              </div>
            ) : null}

            {stage === 6 && badgeComplete ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 11,
                  background:
                    "linear-gradient(135deg, rgba(234,88,12,.2), rgba(250,204,21,.15))",
                  border: "1px solid rgba(253,186,116,.34)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 42 }}>⭐🏅</div>
                <h3 style={{ margin: "4px 0 8px" }}>
                  {guidedCompletion
                    ? "Guided Result Completed"
                    : "Star Badge Completed!"}
                </h3>
                <p
                  style={{
                    margin: "0 0 12px",
                    color: "#ffedd5",
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {guidedCompletion
                    ? "The five-minute learning slot is complete. Sample A softened and filled the star mould; permanent cross-links kept Sample B round. Guided completion does not add challenge points."
                    : "Both samples started round. Only the thermoplastic softened and could be remoulded. Permanent cross-links kept the thermosetting sample round."}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={nextStyle(true)}
                >
                  Run the workshop mission again
                </button>
              </div>
            ) : null}
          </aside>

          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              zIndex: 4,
              padding: "7px 10px",
              borderRadius: 8,
              background: "rgba(24,16,31,.8)",
              color: "#94a3b8",
              fontSize: 11,
            }}
          >
            Point and scan · Use guided controls · Drag to look · Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
}
