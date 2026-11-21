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

type SignKey = "stop" | "no-entry" | "speed" | "school";
type LightColor = "red" | "yellow" | "green";

const SIGNS: Array<{
  key: SignKey;
  label: string;
  symbol: string;
  meaning: string;
  color: string;
}> = [
  {
    key: "stop",
    label: "STOP",
    symbol: "🛑",
    meaning: "Stop the vehicle completely before moving ahead.",
    color: "#ef4444",
  },
  {
    key: "no-entry",
    label: "NO ENTRY",
    symbol: "⛔",
    meaning: "Vehicles are not allowed to enter this road.",
    color: "#f43f5e",
  },
  {
    key: "speed",
    label: "SPEED LIMIT 40",
    symbol: "40",
    meaning: "Do not drive faster than 40 kilometres per hour.",
    color: "#38bdf8",
  },
  {
    key: "school",
    label: "SCHOOL AHEAD",
    symbol: "⚠️",
    meaning: "Slow down and watch carefully for children.",
    color: "#facc15",
  },
];

const LIGHTS: Array<{
  key: LightColor;
  label: string;
  meaning: string;
  color: string;
}> = [
  {
    key: "red",
    label: "RED",
    meaning: "STOP behind the line.",
    color: "#ef4444",
  },
  {
    key: "yellow",
    label: "YELLOW",
    meaning: "WAIT and prepare to stop.",
    color: "#facc15",
  },
  {
    key: "green",
    label: "GREEN",
    meaning: "GO only when the road is clear.",
    color: "#22c55e",
  },
];

const CROSSING_STEPS = [
  { id: "stop", label: "Stop at the footpath edge" },
  { id: "right", label: "Look right" },
  { id: "left", label: "Look left" },
  { id: "right-again", label: "Look right again" },
  { id: "listen", label: "Listen for vehicles" },
  { id: "check", label: "Check that vehicles have stopped" },
  { id: "walk", label: "Walk straight across—do not run" },
] as const;

const QUIZ = [
  {
    question: "What should you do at a STOP sign?",
    options: ["Slow down only", "Stop completely", "Sound the horn"],
    answer: 1,
    explanation: "A STOP sign requires a complete stop before moving safely.",
  },
  {
    question: "What does NO ENTRY mean?",
    options: [
      "Vehicles may enter",
      "Pedestrians must run",
      "Vehicles cannot enter",
    ],
    answer: 2,
    explanation: "NO ENTRY means vehicles are not allowed on that road.",
  },
  {
    question: "What does a red traffic light mean?",
    options: ["Stop", "Go quickly", "Turn anywhere"],
    answer: 0,
    explanation: "Red means stop behind the stop line.",
  },
  {
    question: "Where should pedestrians cross?",
    options: [
      "Between parked cars",
      "At a zebra crossing",
      "Around a blind corner",
    ],
    answer: 1,
    explanation:
      "A zebra crossing is the marked, visible place for pedestrians.",
  },
  {
    question: "What should drivers do near a SCHOOL AHEAD sign?",
    options: ["Speed up", "Ignore children", "Slow down and watch"],
    answer: 2,
    explanation: "Drivers must slow down and watch carefully for children.",
  },
];

const STAGES = [
  {
    title: "Welcome to Smart City",
    cue: "The signs have disappeared. Help Robo make every road safe again.",
  },
  {
    title: "Restore the traffic signs",
    cue: "Place each sign back beside the road and study what it tells road users.",
  },
  {
    title: "Solve the traffic-light mystery",
    cue: "Activate red, yellow, and green in the safe order and watch the traffic respond.",
  },
  {
    title: "Complete the zebra-crossing challenge",
    cue: "Choose the safe crossing, then perform every road-crossing action in order.",
  },
  {
    title: "Pass Robo's traffic-safety test",
    cue: "Use evidence from the city to answer all five questions.",
  },
  {
    title: "Smart City is safe again",
    cue: "Review the golden road-safety rules and accept your Traffic Safety Hero badge.",
  },
];

const NARRATIONS = [
  "Welcome to Smart City. The traffic signs have disappeared and the roads are unsafe. Robo needs your help to restore the rules.",
  "Restore the STOP, NO ENTRY, speed limit forty, and SCHOOL AHEAD signs. Each sign gives road users an important instruction or warning.",
  "Traffic lights control the junction. Red means stop, yellow means wait and prepare to stop, and green means go only when the road ahead is clear.",
  "Use the zebra crossing. Stop at the edge, look right, left, and right again, listen, check that vehicles have stopped, then walk straight across.",
  "Complete Robo's five-question traffic-safety test. If an answer is unsafe, use the feedback and try again.",
  "Mission completed. Follow signs and signals, use zebra crossings, never play on roads, wear a helmet on two-wheelers, and wear a seat belt in cars.",
];

const buttonStyle = (active = false, color = "#38bdf8"): CSSProperties => ({
  minHeight: 44,
  borderRadius: 10,
  border: `1px solid ${active ? color : "rgba(148,163,184,.32)"}`,
  background: active ? `${color}2c` : "rgba(15,23,42,.78)",
  color: active ? "#ffffff" : "#e2e8f0",
  padding: "9px 11px",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
});

function makeLabel(text: string, color = "#e0f2fe", width = 640, height = 160) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const draw = (nextText: string) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(5,15,28,.9)";
    ctx.strokeStyle = "rgba(125,211,252,.65)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "700 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const words = nextText.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width - 60 && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, 3);
    visible.forEach((item, index) => {
      const y = height / 2 + (index - (visible.length - 1) / 2) * 39;
      ctx.fillText(item, width / 2, y);
    });
    texture.needsUpdate = true;
  };

  draw(text);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.8, 0.95, 1);
  sprite.userData.setLabel = draw;
  return sprite;
}

function createActionButton(label: string, action: string, color = "#38bdf8") {
  const group = new THREE.Group();
  group.userData.action = action;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.5, 0.08),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.16,
      roughness: 0.5,
    }),
  );
  plate.userData.action = action;
  group.add(plate);
  const text = makeLabel(label, "#ffffff", 700, 130);
  text.scale.set(2.55, 0.47, 1);
  text.position.z = 0.07;
  text.userData.action = action;
  group.add(text);
  group.userData.setLabel = (next: string) => text.userData.setLabel(next);
  return group;
}

export default function TrafficSafetyViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stageRef = useRef(0);
  const precheckAnsweredRef = useRef(false);
  const signsRef = useRef<SignKey[]>([]);
  const lightStepRef = useRef(0);
  const crossingChosenRef = useRef(false);
  const crossingStepRef = useRef(0);
  const quizIndexRef = useRef(0);
  const completionTimerRef = useRef<number | null>(null);
  const handleActionRef = useRef<(action: string) => void>(() => undefined);
  const updatePanelRef = useRef<(title: string, cue: string) => void>(
    () => undefined,
  );
  const updateQuizButtonsRef = useRef<(labels: string[]) => void>(
    () => undefined,
  );

  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(0);
  const [precheckAnswered, setPrecheckAnswered] = useState(false);
  const [placedSigns, setPlacedSigns] = useState<SignKey[]>([]);
  const [lightStep, setLightStep] = useState(0);
  const [crossingChosen, setCrossingChosen] = useState(false);
  const [crossingStep, setCrossingStep] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(
    "Robo is waiting for you to begin the safety mission.",
  );
  const [vrSupported, setVrSupported] = useState(false);
  const [inVr, setInVr] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    window.speechSynthesis.speak(utterance);
  }, []);

  const goToStage = useCallback(
    (next: number) => {
      stageRef.current = next;
      setStage(next);
      setFeedback(STAGES[next].cue);
      speak(NARRATIONS[next]);
    },
    [speak],
  );

  const answerPrecheck = useCallback((safe: boolean) => {
    precheckAnsweredRef.current = true;
    setPrecheckAnswered(true);
    setFeedback(
      safe
        ? "Good prediction. The zebra crossing is designed to make pedestrians visible. Now prove why through the mission."
        : "Prediction recorded. Crossing between cars can hide you from drivers—look for evidence during the mission.",
    );
  }, []);

  const restoreSign = useCallback((key: SignKey) => {
    if (signsRef.current.includes(key)) {
      setFeedback(
        `${SIGNS.find((sign) => sign.key === key)?.label} is already restored.`,
      );
      return;
    }
    signsRef.current = [...signsRef.current, key];
    setPlacedSigns(signsRef.current);
    const sign = SIGNS.find((item) => item.key === key)!;
    setFeedback(`${sign.label}: ${sign.meaning}`);
  }, []);

  const activateLight = useCallback((color: LightColor) => {
    const expected = LIGHTS[lightStepRef.current];
    if (!expected) return;
    if (expected.key !== color) {
      setFeedback(
        color === "green"
          ? "Unsafe choice: do not rush through the junction. Begin with RED to stop traffic."
          : `Not yet. The safe sequence currently needs ${expected.label}.`,
      );
      return;
    }
    lightStepRef.current += 1;
    setLightStep(lightStepRef.current);
    setFeedback(`${expected.label}: ${expected.meaning}`);
  }, []);

  const chooseCrossing = useCallback((safe: boolean) => {
    if (!safe) {
      setFeedback(
        "Unsafe: drivers may not see you between cars. Find the white zebra stripes.",
      );
      return;
    }
    crossingChosenRef.current = true;
    setCrossingChosen(true);
    setFeedback(
      "Correct—the zebra crossing is visible to drivers. Now stop at the edge.",
    );
  }, []);

  const doCrossingStep = useCallback((id: string) => {
    if (!crossingChosenRef.current) {
      setFeedback("First choose the safest place to cross.");
      return;
    }
    const expected = CROSSING_STEPS[crossingStepRef.current];
    if (!expected || expected.id !== id) {
      setFeedback(
        `Keep the sequence safe. Next: ${expected?.label ?? "cross carefully"}.`,
      );
      return;
    }
    crossingStepRef.current += 1;
    setCrossingStep(crossingStepRef.current);
    setFeedback(
      crossingStepRef.current === CROSSING_STEPS.length
        ? "Safe crossing complete! You walked—never ran—straight across."
        : `Good. Next: ${CROSSING_STEPS[crossingStepRef.current].label}.`,
    );
  }, []);

  const answerQuiz = useCallback(
    (answerIndex: number) => {
      const current = QUIZ[quizIndexRef.current];
      if (!current) return;
      if (answerIndex !== current.answer) {
        setFeedback(`Try again. ${current.explanation}`);
        return;
      }
      const next = quizIndexRef.current + 1;
      quizIndexRef.current = next;
      setQuizIndex(next);
      setScore((value) => value + 1);
      if (next === QUIZ.length) {
        setFeedback(
          "Perfect safety test—five correct answers. Smart City is safe again!",
        );
        if (completionTimerRef.current !== null) {
          window.clearTimeout(completionTimerRef.current);
        }
        completionTimerRef.current = window.setTimeout(() => goToStage(5), 900);
      } else {
        setFeedback(`Correct! ${current.explanation}`);
      }
    },
    [goToStage],
  );

  const restart = useCallback(() => {
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    signsRef.current = [];
    precheckAnsweredRef.current = false;
    lightStepRef.current = 0;
    crossingChosenRef.current = false;
    crossingStepRef.current = 0;
    quizIndexRef.current = 0;
    setPlacedSigns([]);
    setPrecheckAnswered(false);
    setLightStep(0);
    setCrossingChosen(false);
    setCrossingStep(0);
    setQuizIndex(0);
    setScore(0);
    goToStage(0);
  }, [goToStage]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === "narration:replay")
        return speak(NARRATIONS[stageRef.current]);
      if (action === "restart") return restart();
      if (action === "precheck:zebra" && stageRef.current === 0)
        return answerPrecheck(true);
      if (action === "precheck:cars" && stageRef.current === 0)
        return answerPrecheck(false);
      if (action === "mission:start" && stageRef.current === 0)
        return precheckAnsweredRef.current
          ? goToStage(1)
          : setFeedback("Answer Robo's prediction question before beginning.");
      if (action.startsWith("sign:") && stageRef.current === 1)
        return restoreSign(action.slice(5) as SignKey);
      if (
        action === "stage:signs-next" &&
        stageRef.current === 1 &&
        signsRef.current.length === SIGNS.length
      )
        return goToStage(2);
      if (action.startsWith("light:") && stageRef.current === 2)
        return activateLight(action.slice(6) as LightColor);
      if (
        action === "stage:lights-next" &&
        stageRef.current === 2 &&
        lightStepRef.current === LIGHTS.length
      )
        return goToStage(3);
      if (action === "crossing:zebra" && stageRef.current === 3)
        return chooseCrossing(true);
      if (action === "crossing:cars" && stageRef.current === 3)
        return chooseCrossing(false);
      if (action.startsWith("crossing:step:") && stageRef.current === 3)
        return doCrossingStep(action.slice("crossing:step:".length));
      if (
        action === "stage:crossing-next" &&
        stageRef.current === 3 &&
        crossingStepRef.current === CROSSING_STEPS.length
      )
        return goToStage(4);
      if (action.startsWith("quiz:") && stageRef.current === 4)
        return answerQuiz(Number(action.slice(5)));
    },
    [
      activateLight,
      answerPrecheck,
      answerQuiz,
      chooseCrossing,
      doCrossingStep,
      goToStage,
      restart,
      restoreSign,
      speak,
    ],
  );

  handleActionRef.current = handleAction;

  useEffect(() => {
    updatePanelRef.current(STAGES[stage].title, feedback);
    if (stage === 4 && quizIndex < QUIZ.length) {
      updateQuizButtonsRef.current(QUIZ[quizIndex].options);
    }
  }, [feedback, quizIndex, stage]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.xr) {
      navigator.xr
        .isSessionSupported("immersive-vr")
        .then(setVrSupported)
        .catch(() => false);
    }
  }, []);

  useEffect(() => {
    if (!started || !hostRef.current) return;
    const host = hostRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 55);

    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / host.clientHeight,
      0.1,
      100,
    );
    camera.position.set(8, 7.2, 11);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x39546f, 2.2));
    const sun = new THREE.DirectionalLight(0xfff7d6, 2.8);
    sun.position.set(8, 16, 6);
    sun.castShadow = true;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x67a85d, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x27313a,
      roughness: 0.9,
    });
    const roadA = new THREE.Mesh(new THREE.PlaneGeometry(9, 55), roadMaterial);
    roadA.rotation.x = -Math.PI / 2;
    roadA.position.y = 0.012;
    scene.add(roadA);
    const roadB = new THREE.Mesh(new THREE.PlaneGeometry(55, 9), roadMaterial);
    roadB.rotation.x = -Math.PI / 2;
    roadB.position.y = 0.014;
    scene.add(roadB);

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (let i = -5; i <= 5; i++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 4.8),
        lineMaterial,
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i * 0.72, 0.035, 5.7);
      scene.add(stripe);
    }

    const stopLine = new THREE.Mesh(
      new THREE.PlaneGeometry(7.8, 0.28),
      lineMaterial,
    );
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.set(0, 0.04, 1.1);
    scene.add(stopLine);

    const buildingColors = [0xfca5a5, 0x93c5fd, 0xfde68a, 0xc4b5fd, 0x86efac];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 18 + (i % 3) * 2.5;
      const height = 3.5 + (i % 5) * 0.8;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(3.3, height, 3.3),
        new THREE.MeshStandardMaterial({
          color: buildingColors[i % buildingColors.length],
        }),
      );
      building.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius,
      );
      building.castShadow = true;
      scene.add(building);
    }

    const signGroups: Record<SignKey, THREE.Group> = {} as Record<
      SignKey,
      THREE.Group
    >;
    const signPositions: Array<[number, number, number]> = [
      [-5.6, 0, 1.4],
      [5.6, 0, -1.4],
      [-5.5, 0, -7],
      [5.5, 0, 7],
    ];
    SIGNS.forEach((sign, index) => {
      const group = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 2.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 }),
      );
      pole.position.y = 1.4;
      group.add(pole);
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.72,
          0.72,
          0.12,
          sign.key === "stop" ? 8 : 32,
        ),
        new THREE.MeshStandardMaterial({
          color: sign.color,
          emissive: sign.color,
          emissiveIntensity: 0.08,
        }),
      );
      face.rotation.x = Math.PI / 2;
      face.position.y = 3;
      group.add(face);
      const label = makeLabel(sign.label, "#ffffff", 520, 120);
      label.scale.set(1.6, 0.38, 1);
      label.position.set(0, 3, 0.1);
      group.add(label);
      group.position.set(...signPositions[index]);
      group.visible = false;
      scene.add(group);
      signGroups[sign.key] = group;
    });

    const signal = new THREE.Group();
    const signalPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 4.7, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b }),
    );
    signalPole.position.y = 2.35;
    signal.add(signalPole);
    const signalBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2.45, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x111827 }),
    );
    signalBox.position.y = 4.35;
    signal.add(signalBox);
    const signalLights: Record<LightColor, THREE.Mesh> = {} as Record<
      LightColor,
      THREE.Mesh
    >;
    LIGHTS.forEach((light, index) => {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.29, 24, 16),
        new THREE.MeshStandardMaterial({
          color: light.color,
          emissive: light.color,
          emissiveIntensity: 0.05,
        }),
      );
      bulb.position.set(0, 5.05 - index * 0.7, 0.39);
      signal.add(bulb);
      signalLights[light.key] = bulb;
    });
    signal.position.set(5.2, 0, 4.8);
    scene.add(signal);

    const cars: Array<{ mesh: THREE.Group; speed: number; axis: "x" | "z" }> =
      [];
    const carColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x8b5cf6];
    for (let i = 0; i < 8; i++) {
      const car = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.55, 0.8),
        new THREE.MeshStandardMaterial({
          color: carColors[i % carColors.length],
        }),
      );
      body.position.y = 0.48;
      body.castShadow = true;
      car.add(body);
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.42, 0.68),
        new THREE.MeshStandardMaterial({ color: 0xdbeafe }),
      );
      roof.position.y = 0.92;
      car.add(roof);
      const axis = i % 2 === 0 ? "z" : "x";
      if (axis === "z")
        car.position.set(i % 4 < 2 ? -2.2 : 2.2, 0, -18 + i * 4.5);
      else {
        car.rotation.y = Math.PI / 2;
        car.position.set(-18 + i * 4.5, 0, i % 4 < 2 ? -2.2 : 2.2);
      }
      scene.add(car);
      cars.push({ mesh: car, speed: 1.5 + (i % 3) * 0.25, axis });
    }

    const robot = new THREE.Group();
    const robotBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.25, 0.75),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.35,
        roughness: 0.35,
      }),
    );
    robotBody.position.y = 1.1;
    robot.add(robotBody);
    const robotHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.72, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.2 }),
    );
    robotHead.position.y = 2.14;
    robot.add(robotHead);
    [-0.22, 0.22].forEach((x) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }),
      );
      eye.position.set(x, 2.2, 0.37);
      robot.add(eye);
    });
    robot.position.set(-6.8, 0, 7.2);
    robot.rotation.y = 0.55;
    scene.add(robot);

    const xrPanel = new THREE.Group();
    const titleSprite = makeLabel(STAGES[0].title, "#fde68a", 900, 150);
    titleSprite.position.y = 1.25;
    titleSprite.scale.set(4.6, 0.78, 1);
    xrPanel.add(titleSprite);
    const cueSprite = makeLabel(STAGES[0].cue, "#e0f2fe", 900, 210);
    cueSprite.position.y = 0.3;
    cueSprite.scale.set(4.6, 1.08, 1);
    xrPanel.add(cueSprite);
    xrPanel.position.set(0, 4.4, -5.5);
    scene.add(xrPanel);
    updatePanelRef.current = (title, cue) => {
      titleSprite.userData.setLabel(title);
      cueSprite.userData.setLabel(cue);
    };

    const actionDefinitions: Array<[string, string, string?]> = [
      ["PREDICT: ZEBRA CROSSING", "precheck:zebra", "#22c55e"],
      ["PREDICT: BETWEEN CARS", "precheck:cars", "#ef4444"],
      ["BEGIN THE SAFETY MISSION", "mission:start", "#22c55e"],
      ...SIGNS.map(
        (sign) =>
          [`RESTORE ${sign.label}`, `sign:${sign.key}`, sign.color] as [
            string,
            string,
            string,
          ],
      ),
      ["CONTINUE TO TRAFFIC LIGHTS", "stage:signs-next", "#22c55e"],
      ...LIGHTS.map(
        (light) =>
          [`ACTIVATE ${light.label}`, `light:${light.key}`, light.color] as [
            string,
            string,
            string,
          ],
      ),
      ["CONTINUE TO THE CROSSING", "stage:lights-next", "#22c55e"],
      ["USE THE ZEBRA CROSSING", "crossing:zebra", "#22c55e"],
      ["CROSS BETWEEN PARKED CARS", "crossing:cars", "#ef4444"],
      ...CROSSING_STEPS.map(
        (step) =>
          [step.label.toUpperCase(), `crossing:step:${step.id}`, "#38bdf8"] as [
            string,
            string,
            string,
          ],
      ),
      ["CONTINUE TO THE SAFETY TEST", "stage:crossing-next", "#22c55e"],
      ["ANSWER A", "quiz:0", "#8b5cf6"],
      ["ANSWER B", "quiz:1", "#8b5cf6"],
      ["ANSWER C", "quiz:2", "#8b5cf6"],
      ["REPLAY NARRATION", "narration:replay", "#0ea5e9"],
      ["RESTART MISSION", "restart", "#f97316"],
    ];
    const actionButtons = actionDefinitions.map(([label, action, color]) => {
      const button = createActionButton(label, action, color);
      scene.add(button);
      return button;
    });
    const quizButtons = actionButtons.filter((button) =>
      button.userData.action.startsWith("quiz:"),
    );
    updateQuizButtonsRef.current = (labels) => {
      quizButtons.forEach((button, index) =>
        button.userData.setLabel(
          `${String.fromCharCode(65 + index)}. ${labels[index]}`,
        ),
      );
    };

    const visibleActions = () => {
      const currentStage = stageRef.current;
      const result: string[] = [];
      if (currentStage === 0) {
        if (precheckAnsweredRef.current) result.push("mission:start");
        else result.push("precheck:zebra", "precheck:cars");
      }
      if (currentStage === 1) {
        for (const sign of SIGNS)
          if (!signsRef.current.includes(sign.key))
            result.push(`sign:${sign.key}`);
        if (signsRef.current.length === SIGNS.length)
          result.push("stage:signs-next");
      }
      if (currentStage === 2) {
        if (lightStepRef.current < LIGHTS.length)
          result.push("light:red", "light:yellow", "light:green");
        else result.push("stage:lights-next");
      }
      if (currentStage === 3) {
        if (!crossingChosenRef.current)
          result.push("crossing:zebra", "crossing:cars");
        else if (crossingStepRef.current < CROSSING_STEPS.length)
          result.push(
            `crossing:step:${CROSSING_STEPS[crossingStepRef.current].id}`,
          );
        else result.push("stage:crossing-next");
      }
      if (currentStage === 4) result.push("quiz:0", "quiz:1", "quiz:2");
      if (currentStage === 5) result.push("restart");
      result.push("narration:replay");
      return result;
    };

    const interactables: THREE.Object3D[] = [];
    for (const button of actionButtons)
      button.traverse((child) => interactables.push(child));
    const raycaster = new THREE.Raycaster();
    const controllers = [
      renderer.xr.getController(0),
      renderer.xr.getController(1),
    ];
    controllers.forEach((controller) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, -8),
        ]),
        new THREE.LineBasicMaterial({ color: 0x7dd3fc }),
      );
      controller.add(line);
      scene.add(controller);
    });
    const onSelect = (event: { target: THREE.XRTargetRaySpace }) => {
      const controller = event.target;
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction
        .set(0, 0, -1)
        .applyQuaternion(controller.quaternion);
      const hit = raycaster
        .intersectObjects(interactables, true)
        .find((item) => item.object.visible);
      if (!hit) return;
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData.action) object = object.parent;
      if (object?.userData.action)
        handleActionRef.current(object.userData.action);
    };
    controllers.forEach((controller) =>
      controller.addEventListener("selectstart", onSelect),
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, 0);
    controls.enableDamping = true;
    controls.maxDistance = 24;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.48;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.04);
      const elapsed = clock.elapsedTime;
      controls.update();

      SIGNS.forEach((sign) => {
        signGroups[sign.key].visible = signsRef.current.includes(sign.key);
      });
      LIGHTS.forEach((light, index) => {
        const material = signalLights[light.key]
          .material as THREE.MeshStandardMaterial;
        const active =
          lightStepRef.current > index && lightStepRef.current - 1 === index;
        material.emissiveIntensity = active ? 2.5 : 0.05;
      });

      const trafficMayMove =
        stageRef.current !== 2 || lightStepRef.current === 3;
      if (!reduceMotion && trafficMayMove) {
        for (const car of cars) {
          if (car.axis === "z") {
            car.mesh.position.z += car.speed * delta;
            if (car.mesh.position.z > 20) car.mesh.position.z = -20;
          } else {
            car.mesh.position.x += car.speed * delta;
            if (car.mesh.position.x > 20) car.mesh.position.x = -20;
          }
        }
      }
      robot.position.y = reduceMotion ? 0 : Math.sin(elapsed * 2) * 0.04;

      const activeActions = visibleActions();
      let slot = 0;
      for (const button of actionButtons) {
        const visible = activeActions.includes(button.userData.action);
        button.visible = visible;
        if (visible) {
          const column = slot % 2;
          const row = Math.floor(slot / 2);
          button.position.set(
            column === 0 ? -1.55 : 1.55,
            3.1 - row * 0.64,
            -4.9,
          );
          slot += 1;
        }
      }
      renderer.render(scene, camera);
    });

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      const disposedMaterials = new Set<THREE.Material>();
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
          disposedGeometries.add(mesh.geometry);
          mesh.geometry.dispose();
        }
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : mesh.material
            ? [mesh.material]
            : [];
        for (const material of materials) {
          if (disposedMaterials.has(material)) continue;
          disposedMaterials.add(material);
          const mapped = material as THREE.Material & {
            map?: THREE.Texture | null;
          };
          mapped.map?.dispose();
          material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      updatePanelRef.current = () => undefined;
      updateQuizButtonsRef.current = () => undefined;
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, [started]);

  const enterVr = useCallback(async () => {
    if (!rendererRef.current || !navigator.xr) {
      setFeedback(
        "Immersive VR is unavailable here. The complete mission remains playable in the browser.",
      );
      return;
    }
    try {
      const session = await navigator.xr.requestSession("immersive-vr", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["bounded-floor", "hand-tracking"],
      });
      await rendererRef.current.xr.setSession(session);
      setInVr(true);
      session.addEventListener("end", () => setInVr(false), { once: true });
    } catch {
      setFeedback(
        "VR entry was cancelled. You can continue the complete mission in the browser.",
      );
    }
  }, []);

  const begin = () => {
    setStarted(true);
    setFeedback(STAGES[0].cue);
    window.setTimeout(() => speak(NARRATIONS[0]), 250);
  };

  const signsComplete = placedSigns.length === SIGNS.length;
  const crossingComplete = crossingStep === CROSSING_STEPS.length;
  const canvasLabel = `${STAGES[stage].title}. ${feedback}`;

  if (!started) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "radial-gradient(circle at top, #164e63 0%, #082f49 45%, #020617 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <div style={{ fontSize: 72 }}>🤖🚦🛑</div>
          <p
            style={{ color: "#67e8f9", fontWeight: 800, letterSpacing: ".1em" }}
          >
            CLASS 5 · SMART ROAD ADVENTURE
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", margin: "8px 0" }}>
            Make Smart City safe again
          </h1>
          <p style={{ color: "#bae6fd", lineHeight: 1.65 }}>
            Restore signs, control a busy junction, cross correctly, and prove
            that you can make safe road decisions.
          </p>
          <button
            onClick={begin}
            style={{
              minHeight: 52,
              padding: "12px 22px",
              borderRadius: 12,
              border: "1px solid #67e8f9",
              background: "#0891b2",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Enter Smart City
          </button>
          <p style={{ color: "#94a3b8", fontSize: 12 }}>
            Stationary experience · Browser + Meta Quest · About 5 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={canvasLabel}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#082f49",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          zIndex: 5,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        <button
          onClick={() => speak(NARRATIONS[stage])}
          style={buttonStyle(false, "#0ea5e9")}
        >
          🔊 Replay narration
        </button>
        {vrSupported ? (
          <button
            onClick={enterVr}
            disabled={inVr}
            style={buttonStyle(inVr, "#8b5cf6")}
          >
            {inVr ? "✓ In immersive VR" : "🥽 Enter VR"}
          </button>
        ) : null}
      </div>

      <aside
        style={{
          position: "absolute",
          zIndex: 6,
          top: 68,
          right: 16,
          width: "min(390px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 152px)",
          overflowY: "auto",
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(125,211,252,.32)",
          background: "rgba(2,6,23,.88)",
          backdropFilter: "blur(12px)",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            color: "#67e8f9",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".08em",
          }}
        >
          STAGE {stage + 1} / {STAGES.length} · SCORE {score} / {QUIZ.length}
        </div>
        <h2 style={{ margin: "6px 0 4px", fontSize: 21 }}>
          {STAGES[stage].title}
        </h2>
        <p
          style={{
            color: "#bae6fd",
            fontSize: 13,
            lineHeight: 1.5,
            marginTop: 0,
          }}
        >
          {STAGES[stage].cue}
        </p>
        <div
          aria-live="polite"
          style={{
            padding: "9px 11px",
            borderRadius: 9,
            background: "rgba(14,165,233,.13)",
            color: "#e0f2fe",
            fontSize: 13,
            lineHeight: 1.45,
            marginBottom: 12,
          }}
        >
          🤖 {feedback}
        </div>

        {stage === 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{ color: "#fde68a", fontWeight: 800, lineHeight: 1.45 }}
            >
              Before we begin: where is the safest place to cross?
            </div>
            {!precheckAnswered ? (
              <>
                <button
                  onClick={() => answerPrecheck(true)}
                  style={buttonStyle(false, "#22c55e")}
                >
                  ▰▰ At a zebra crossing
                </button>
                <button
                  onClick={() => answerPrecheck(false)}
                  style={buttonStyle(false, "#ef4444")}
                >
                  🚗 Between parked cars
                </button>
              </>
            ) : (
              <button
                onClick={() => goToStage(1)}
                style={{
                  ...buttonStyle(true, "#22c55e"),
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Begin the safety mission →
              </button>
            )}
          </div>
        ) : null}

        {stage === 1 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {SIGNS.map((sign) => {
              const placed = placedSigns.includes(sign.key);
              return (
                <button
                  key={sign.key}
                  onClick={() => restoreSign(sign.key)}
                  aria-pressed={placed}
                  style={buttonStyle(placed, sign.color)}
                >
                  <span style={{ fontSize: 21, marginRight: 8 }}>
                    {sign.symbol}
                  </span>
                  {placed ? "✓ " : "Restore "}
                  {sign.label}
                </button>
              );
            })}
            <button
              onClick={() => goToStage(2)}
              disabled={!signsComplete}
              style={{
                ...buttonStyle(signsComplete, "#22c55e"),
                opacity: signsComplete ? 1 : 0.5,
                textAlign: "center",
              }}
            >
              Continue to the traffic lights →
            </button>
          </div>
        ) : null}

        {stage === 2 ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 7,
              }}
            >
              {LIGHTS.map((light, index) => (
                <button
                  key={light.key}
                  onClick={() => activateLight(light.key)}
                  aria-pressed={lightStep > index}
                  style={{
                    ...buttonStyle(lightStep > index, light.color),
                    textAlign: "center",
                    padding: 8,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: 25,
                      color: light.color,
                    }}
                  >
                    ●
                  </span>
                  {light.label}
                </button>
              ))}
            </div>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
              Safe sequence completed: {lightStep} / {LIGHTS.length}
            </p>
            <button
              onClick={() => goToStage(3)}
              disabled={lightStep !== LIGHTS.length}
              style={{
                ...buttonStyle(lightStep === LIGHTS.length, "#22c55e"),
                opacity: lightStep === LIGHTS.length ? 1 : 0.5,
                textAlign: "center",
              }}
            >
              Continue to the zebra crossing →
            </button>
          </div>
        ) : null}

        {stage === 3 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {!crossingChosen ? (
              <>
                <button
                  onClick={() => chooseCrossing(true)}
                  style={buttonStyle(false, "#22c55e")}
                >
                  ▰▰ Use the zebra crossing
                </button>
                <button
                  onClick={() => chooseCrossing(false)}
                  style={buttonStyle(false, "#ef4444")}
                >
                  🚗 Cross between parked cars
                </button>
              </>
            ) : (
              CROSSING_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => doCrossingStep(step.id)}
                  disabled={index !== crossingStep}
                  aria-pressed={index < crossingStep}
                  style={{
                    ...buttonStyle(index < crossingStep, "#22c55e"),
                    opacity: index > crossingStep ? 0.5 : 1,
                  }}
                >
                  {index < crossingStep
                    ? "✓"
                    : index === crossingStep
                      ? "→"
                      : "○"}{" "}
                  {step.label}
                </button>
              ))
            )}
            <button
              onClick={() => goToStage(4)}
              disabled={!crossingComplete}
              style={{
                ...buttonStyle(crossingComplete, "#22c55e"),
                opacity: crossingComplete ? 1 : 0.5,
                textAlign: "center",
              }}
            >
              Take Robo&apos;s final safety test →
            </button>
          </div>
        ) : null}

        {stage === 4 && quizIndex < QUIZ.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{ color: "#fde68a", fontWeight: 800, lineHeight: 1.45 }}
            >
              Question {quizIndex + 1}: {QUIZ[quizIndex].question}
            </div>
            {QUIZ[quizIndex].options.map((option, index) => (
              <button
                key={option}
                onClick={() => answerQuiz(index)}
                style={buttonStyle(false, "#8b5cf6")}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
        ) : null}

        {stage === 5 ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 65 }}>🏅🚦🤖</div>
            <h3 style={{ color: "#fde68a", margin: "4px 0" }}>
              Traffic Safety Hero!
            </h3>
            <p style={{ color: "#bae6fd", fontSize: 13, lineHeight: 1.6 }}>
              Follow signs · Obey signals · Use zebra crossings · Never play on
              roads · Wear helmets and seat belts
            </p>
            <button
              onClick={restart}
              style={{
                ...buttonStyle(true, "#f97316"),
                width: "100%",
                textAlign: "center",
              }}
            >
              Run the Smart Road mission again
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
