"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  SCOURING_CONTAINERS,
  SCOURING_STATION_SEQUENCE,
  SHEARING_PATH,
  SHEARING_PREPARATION_SEQUENCE,
  WOOL_PROCESS_SEQUENCE,
  WOOL_PROCESSING_QUIZ,
  WOOL_PROCESSING_STAGES,
  createWoolProcessingState,
  currentWoolProcessingStage,
  reduceWoolProcessing,
  woolProcessingCanContinue,
  type ScouringContainer,
  type ScouringStationChoice,
  type SeasonChoice,
  type ShearingAngle,
  type ShearingPath,
  type ShearingSpeed,
  type PreparationChoice,
  type WoolProcessStep,
  type WoolProcessingAction,
  type WoolStageId,
} from "@/lib/woolProcessingLesson";
import { createWoolProcessingScene } from "@/lib/woolProcessingScene";
import {
  createPloughingAudio,
  type PloughingAudioStatus,
} from "@/lib/ploughingAudio";
import { createGuidedCamera } from "@/lib/world-builder/guidedCamera";
import { createQuestVrControls } from "./questVrControls";
import styles from "./PloughingPreparationViewer.module.css";

const TARGET_LABELS: Readonly<Record<string, string>> = {
  fleece: "Woolly's thick fleece",
  heartbeat: "Woolly's calm heartbeat",
  "temperature-scanner": "Body-temperature scanner",
  "wool-fibre": "Magnified crimped fibre",
  winter: "Cold winter",
  rainy: "Rainy season",
  summer: "Warm, dry summer",
  "check-dry": "Check that the fleece is dry",
  "non-slip-platform": "Clean non-slip platform",
  "electric-shears": "Suitable electric shears",
  "inspect-shears": "Inspect cable, guard and blades",
  "blade-oil": "Oil the shearing blades",
  "calm-woolly": "Calm Woolly gently",
  "kitchen-knife": "Kitchen knife — unsafe",
  "water-spray": "Wet the fleece — unsafe",
  "dirty-tool": "Dirty damaged tool — unsafe",
  "shear-path-1": "First guided shearing path",
  "shear-path-2": "Second guided shearing path",
  "shear-path-3": "Third guided shearing path",
  "shear-path-4": "Fourth guided shearing path",
  "dust-soil": "Dust and soil",
  sweat: "Dried sweat",
  "plant-material": "Grass and seeds",
  lanolin: "Protective lanolin grease",
  "cold-water": "Cold-water test",
  "very-hot-water": "Very-hot rough wash",
  "warm-solution": "Controlled warm solution",
  "temperature-dial": "Warm-temperature dial",
  "solution-dispenser": "Measured cleaning solution",
  "wash-paddle": "Gentle wash paddle",
  "rinse-one": "First rinse tank",
  "rinse-two": "Second rinse tank",
  "squeeze-rollers": "Gentle squeeze rollers",
  "drying-rack": "Ventilated drying rack",
  "twist-wool": "Twist the wool — unsafe",
  "raw-sample": "Raw greasy fleece",
  "clean-sample": "Clean scoured wool",
  "sequence-sheep": "Sheep with fleece",
  "sequence-shearing": "Shearing",
  "sequence-raw-fleece": "Raw fleece collection",
  "sequence-scouring": "Scouring",
  "sequence-rinsing": "Rinsing",
  "sequence-drying": "Drying",
};

const PREPARATION_TARGETS = [
  ...SHEARING_PREPARATION_SEQUENCE,
  "kitchen-knife",
  "water-spray",
  "dirty-tool",
] as const;

const STATION_TARGETS = [...SCOURING_STATION_SEQUENCE, "twist-wool"] as const;

const DETECTIVE_DECISIONS = [
  "decision-spin-now",
  "decision-clean-first",
] as const;

const QUIZ_TARGETS = WOOL_PROCESSING_QUIZ.flatMap((question) =>
  question.options.map(([value]) => `quiz-${value}`),
);

const STAGE_ALLOWED: Readonly<Record<WoolStageId, readonly string[]>> = {
  arrival: ["fleece", "heartbeat", "temperature-scanner", "wool-fibre"],
  season: ["winter", "rainy", "summer"],
  prepare: PREPARATION_TARGETS,
  shearing: SHEARING_PATH,
  detective: [
    "dust-soil",
    "sweat",
    "plant-material",
    "lanolin",
    ...DETECTIVE_DECISIONS,
  ],
  experiment: SCOURING_CONTAINERS,
  station: STATION_TARGETS,
  compare: ["raw-sample", "clean-sample"],
  journey: WOOL_PROCESS_SEQUENCE.map((step) => `sequence-${step}`),
  quiz: QUIZ_TARGETS,
};

const cueFor = (stage: WoolStageId) => ({
  id: `wool-processing-${stage}`,
  text:
    WOOL_PROCESSING_STAGES.find((item) => item.id === stage)?.narration ?? "",
  audioUrl: `/narration/wool-processing/${stage}.mp3`,
});

function createVrCard(text: string, width = 1.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 360;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff8e9";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#8e572e";
  context.lineWidth = 14;
  context.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
  context.fillStyle = "#2d3b2d";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 40px sans-serif";
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > 900 && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  const visibleLines = lines.slice(0, 4);
  const firstY = 180 - ((visibleLines.length - 1) * 52) / 2;
  visibleLines.forEach((value, index) =>
    context.fillText(value, 512, firstY + index * 52),
  );
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width * 360) / 1024),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
}

export default function WoolProcessingViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef(createWoolProcessingState());
  const dispatchRef = useRef<(action: WoolProcessingAction) => void>(() => {});
  const focusRef = useRef<() => void>(() => {});
  const audioRef = useRef<ReturnType<typeof createPloughingAudio> | null>(null);
  const vrRequestRef = useRef(false);
  const shearAngleRef = useRef<ShearingAngle>("parallel");
  const shearSpeedRef = useRef<ShearingSpeed>("steady");
  const [state, setState] = useState(createWoolProcessingState);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const [hover, setHover] = useState<string>();
  const [muted, setMuted] = useState(false);
  const [audioStatus, setAudioStatus] = useState<PloughingAudioStatus>("idle");
  const [caption, setCaption] = useState("");
  const [vrSupported, setVrSupported] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [shearAngle, setShearAngle] = useState<ShearingAngle>("parallel");
  const [shearSpeed, setShearSpeed] = useState<ShearingSpeed>("steady");

  const stage = currentWoolProcessingStage(state);
  const canContinue = woolProcessingCanContinue(state);

  const narrate = useCallback(() => {
    const current = currentWoolProcessingStage(stateRef.current);
    void audioRef.current?.unlock();
    audioRef.current?.enqueue([cueFor(current.id)], true);
  }, []);

  const dispatch = useCallback((action: WoolProcessingAction) => {
    const before = stateRef.current;
    const next = reduceWoolProcessing(before, action);
    if (next === before) return;
    stateRef.current = next;
    setState(next);
    if (next.stageIndex !== before.stageIndex) {
      setHover(undefined);
      focusRef.current();
      const nextStage = currentWoolProcessingStage(next);
      void audioRef.current?.unlock();
      audioRef.current?.enqueue([cueFor(nextStage.id)], true);
    }
    if (action.type === "restart") {
      setStarted(false);
      setHover(undefined);
      shearAngleRef.current = "parallel";
      shearSpeedRef.current = "steady";
      setShearAngle("parallel");
      setShearSpeed("steady");
      audioRef.current?.stop();
      focusRef.current();
    }
  }, []);
  dispatchRef.current = dispatch;

  const activateTarget = useCallback((id: string) => {
    const current = stateRef.current;
    const currentStage = currentWoolProcessingStage(current);
    if (!STAGE_ALLOWED[currentStage.id].includes(id)) return;
    if (currentStage.id === "season") {
      dispatchRef.current({
        type: "choose-season",
        value: id as SeasonChoice,
      });
      return;
    }
    if (currentStage.id === "prepare") {
      dispatchRef.current({
        type: "prepare",
        target: id as PreparationChoice,
      });
      return;
    }
    if (currentStage.id === "shearing") {
      dispatchRef.current({
        type: "shear-pass",
        target: id as ShearingPath,
        angle: shearAngleRef.current,
        speed: shearSpeedRef.current,
      });
      return;
    }
    if (currentStage.id === "detective" && id.startsWith("decision-")) {
      dispatchRef.current({
        type: "answer-fleece",
        value: id === "decision-clean-first" ? "clean-first" : "spin-now",
      });
      return;
    }
    if (currentStage.id === "experiment") {
      const value = id as ScouringContainer;
      if (
        current.testedContainers.length === SCOURING_CONTAINERS.length &&
        current.testedContainers.includes(value)
      ) {
        dispatchRef.current({ type: "choose-container", value });
      } else dispatchRef.current({ type: "test-container", value });
      return;
    }
    if (currentStage.id === "station") {
      dispatchRef.current({
        type: "scour",
        target: id as ScouringStationChoice,
      });
      return;
    }
    if (currentStage.id === "journey") {
      dispatchRef.current({
        type: "sequence",
        value: id.replace("sequence-", "") as WoolProcessStep,
      });
      return;
    }
    if (currentStage.id === "quiz" && id.startsWith("quiz-")) {
      dispatchRef.current({ type: "quiz", value: id.replace("quiz-", "") });
      return;
    }
    dispatchRef.current({ type: "inspect", target: id });
  }, []);

  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    let active = true;
    void xr
      ?.isSessionSupported("immersive-vr")
      .then((supported) => {
        if (active) setVrSupported(supported);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    const audio = createPloughingAudio((status, text) => {
      if (disposed) return;
      setAudioStatus(status);
      if (text) setCaption(text);
    });
    audioRef.current = audio;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setRuntimeError(
        "This browser could not open Flock Valley. Please enable WebGL or try another browser.",
      );
      return () => audio.dispose();
    }
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive wool processing world",
    );
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9dc8d6);
    scene.fog = new THREE.FogExp2(0xb4d3d1, 0.014);
    const world = createWoolProcessingScene(scene);
    const camera = new THREE.PerspectiveCamera(47, 1, 0.05, 100);
    const guided = createGuidedCamera(camera, renderer.domElement, {
      minDistance: 1.2,
      maxDistance: 10,
    });
    guided.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    guided.controls.enablePan = true;
    const focus = () => {
      if (renderer.xr.isPresenting) return;
      const frame = world.getFrame(
        currentWoolProcessingStage(stateRef.current).id,
      );
      const offset = frame.position.clone().sub(frame.target);
      frame.position
        .copy(frame.target)
        .addScaledVector(
          offset,
          Math.max(1, Math.min(1.3, 1.07 / camera.aspect)),
        );
      guided.focusOn(frame, { animate: false });
    };
    focusRef.current = focus;

    const controllers = [
      renderer.xr.getController(0),
      renderer.xr.getController(1),
    ];
    const controllerRay = new THREE.Raycaster();
    const rays: THREE.Line[] = [];
    for (const controller of controllers) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0, -3.5),
        ]),
        new THREE.LineBasicMaterial({ color: 0xffdc7c }),
      );
      controller.add(line);
      rays.push(line);
    }

    const quest = createQuestVrControls({
      renderer,
      scene,
      camera,
      controllers,
      onPrimary: () => {
        if (woolProcessingCanContinue(stateRef.current)) {
          dispatchRef.current({ type: "next" });
        } else narrate();
      },
      onBack: () => {
        void renderer.xr.getSession()?.end();
      },
      onNarrate: narrate,
      startPosition: new THREE.Vector3(0, 0, 2.55),
      movementBounds: new THREE.Box2(
        new THREE.Vector2(-4.6, -1.2),
        new THREE.Vector2(4.6, 6.4),
      ),
    });

    const hud = new THREE.Group();
    scene.add(hud);
    const promptCard = createVrCard(WOOL_PROCESSING_STAGES[0].instruction);
    promptCard.position.set(0, 2.1, -1.28);
    const nextCard = createVrCard("A: Next scene", 0.72);
    nextCard.position.set(0.92, 1.04, 0.2);
    nextCard.userData.targetId = "continue";
    const exitCard = createVrCard("B: Exit VR", 0.72);
    exitCard.position.set(-0.92, 1.04, 0.2);
    exitCard.userData.targetId = "exit";
    const choiceCards = new THREE.Group();
    choiceCards.name = "immersive-evidence-choices";
    hud.add(promptCard, choiceCards, nextCard, exitCard);

    const clearChoiceCards = () => {
      for (const child of [...choiceCards.children]) {
        choiceCards.remove(child);
        if (!(child instanceof THREE.Mesh)) continue;
        child.geometry.dispose();
        const material = child.material as THREE.MeshBasicMaterial;
        material.map?.dispose();
        material.dispose();
      }
    };
    const updateChoiceCards = (current: typeof stateRef.current) => {
      clearChoiceCards();
      const currentStage = currentWoolProcessingStage(current);
      const options: Array<{ id: string; label: string }> = [];
      if (currentStage.id === "detective") {
        options.push(
          { id: "decision-spin-now", label: "Spin it now" },
          { id: "decision-clean-first", label: "Scour it first" },
        );
      } else if (
        currentStage.id === "quiz" &&
        current.quizIndex < WOOL_PROCESSING_QUIZ.length
      ) {
        options.push(
          ...WOOL_PROCESSING_QUIZ[current.quizIndex].options.map(
            ([value, label]) => ({ id: `quiz-${value}`, label }),
          ),
        );
      }
      options.forEach(({ id, label }, index) => {
        const card = createVrCard(label, options.length === 3 ? 0.7 : 0.84);
        card.position.set(
          (index - (options.length - 1) / 2) * 0.82,
          1.5,
          -0.05,
        );
        card.userData.targetId = id;
        choiceCards.add(card);
      });
    };

    const visible = (object: THREE.Object3D) => {
      let node: THREE.Object3D | null = object;
      while (node) {
        if (!node.visible) return false;
        node = node.parent;
      }
      return true;
    };
    const resolveTarget = (object: THREE.Object3D) => {
      let node: THREE.Object3D | null = object;
      while (node) {
        if (typeof node.userData.targetId === "string") {
          return node.userData.targetId as string;
        }
        node = node.parent;
      }
      return undefined;
    };
    const activeRoots = () => {
      const current = currentWoolProcessingStage(stateRef.current);
      return STAGE_ALLOWED[current.id]
        .map((id) => world.targets.get(id))
        .filter((object): object is THREE.Object3D =>
          Boolean(object && visible(object)),
        );
    };
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const setPointerRay = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      camera.updateMatrixWorld(true);
      world.root.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
    };
    const hit = (ray: THREE.Raycaster, includeHud = false) => {
      const roots = includeHud
        ? [...activeRoots(), ...choiceCards.children, nextCard, exitCard]
        : activeRoots();
      for (const intersection of ray.intersectObjects(roots, true)) {
        if (!visible(intersection.object)) continue;
        const id = resolveTarget(intersection.object);
        if (id) return id;
      }
      return undefined;
    };
    let down: { x: number; y: number; id: string } | undefined;
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      setPointerRay(event);
      const id = hit(raycaster);
      if (!id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      renderer.domElement.setPointerCapture(event.pointerId);
      down = { x: event.clientX, y: event.clientY, id };
      guided.controls.enabled = false;
    };
    const pointerMove = (event: PointerEvent) => {
      setPointerRay(event);
      if (!down) {
        const id = hit(raycaster);
        setHover(id);
        renderer.domElement.style.cursor = id ? "pointer" : "grab";
      }
    };
    const pointerUp = (event: PointerEvent) => {
      if (!down) return;
      event.stopImmediatePropagation();
      setPointerRay(event);
      const distance = Math.hypot(
        event.clientX - down.x,
        event.clientY - down.y,
      );
      const id = hit(raycaster);
      if (distance <= 8 && id === down.id) activateTarget(id);
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      down = undefined;
      guided.controls.enabled = !renderer.xr.isPresenting;
    };
    const cancelPointer = () => {
      down = undefined;
      setHover(undefined);
      guided.controls.enabled = !renderer.xr.isPresenting;
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown, true);
    renderer.domElement.addEventListener("pointermove", pointerMove, true);
    renderer.domElement.addEventListener("pointerup", pointerUp, true);
    renderer.domElement.addEventListener("pointercancel", cancelPointer, true);
    renderer.domElement.addEventListener(
      "lostpointercapture",
      cancelPointer,
      true,
    );

    const controllerListeners = controllers.map((controller) => {
      const select = () => {
        controller.updateMatrixWorld(true);
        controllerRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        controllerRay.ray.direction
          .set(0, 0, -1)
          .transformDirection(controller.matrixWorld);
        const id = hit(controllerRay, true);
        if (id === "continue") {
          if (woolProcessingCanContinue(stateRef.current)) {
            dispatchRef.current({ type: "next" });
          } else narrate();
        } else if (id === "exit") {
          void renderer.xr.getSession()?.end();
        } else if (id) activateTarget(id);
      };
      controller.addEventListener("selectstart", select);
      return { controller, select };
    });

    let previousWidth = 0;
    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (width !== previousWidth) focus();
      previousWidth = width;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const onSessionStart = () => setImmersive(true);
    const onSessionEnd = () => {
      setImmersive(false);
      focus();
    };
    renderer.xr.addEventListener("sessionstart", onSessionStart);
    renderer.xr.addEventListener("sessionend", onSessionEnd);
    const clock = new THREE.Clock();
    let elapsed = 0;
    let lastStage = -1;
    let lastChoiceKey = "";
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      if (renderer.xr.isPresenting) quest.update();
      else guided.update(delta);
      const current = stateRef.current;
      const activeStage = currentWoolProcessingStage(current);
      world.update(current, delta, elapsed);
      hud.visible = renderer.xr.isPresenting;
      const nextMaterial = nextCard.material as THREE.MeshBasicMaterial;
      nextMaterial.opacity = woolProcessingCanContinue(current) ? 1 : 0.45;
      nextMaterial.transparent = true;
      if (lastStage !== current.stageIndex) {
        const nextPrompt = createVrCard(activeStage.instruction);
        const promptMaterial = promptCard.material as THREE.MeshBasicMaterial;
        promptMaterial.map?.dispose();
        promptMaterial.map = (
          nextPrompt.material as THREE.MeshBasicMaterial
        ).map;
        promptMaterial.needsUpdate = true;
        nextPrompt.geometry.dispose();
        (nextPrompt.material as THREE.Material).dispose();
        lastStage = current.stageIndex;
      }
      const choiceKey = `${activeStage.id}:${current.quizIndex}`;
      if (lastChoiceKey !== choiceKey) {
        updateChoiceCards(current);
        lastChoiceKey = choiceKey;
      }
      renderer.render(scene, camera);
    });
    setReady(true);

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      audio.dispose();
      guided.dispose();
      quest.dispose();
      renderer.xr.removeEventListener("sessionstart", onSessionStart);
      renderer.xr.removeEventListener("sessionend", onSessionEnd);
      void renderer.xr
        .getSession()
        ?.end()
        .catch(() => undefined);
      renderer.domElement.removeEventListener("pointerdown", pointerDown, true);
      renderer.domElement.removeEventListener("pointermove", pointerMove, true);
      renderer.domElement.removeEventListener("pointerup", pointerUp, true);
      renderer.domElement.removeEventListener(
        "pointercancel",
        cancelPointer,
        true,
      );
      renderer.domElement.removeEventListener(
        "lostpointercapture",
        cancelPointer,
        true,
      );
      controllerListeners.forEach(({ controller, select }) =>
        controller.removeEventListener("selectstart", select),
      );
      clearChoiceCards();
      for (const card of [promptCard, nextCard, exitCard]) {
        card.geometry.dispose();
        (card.material as THREE.MeshBasicMaterial).map?.dispose();
        (card.material as THREE.Material).dispose();
      }
      rays.forEach((line) => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      scene.remove(hud);
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (rendererRef.current === renderer) rendererRef.current = null;
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [activateTarget, narrate]);

  const enterVR = async () => {
    const renderer = rendererRef.current;
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!renderer || !xr || vrRequestRef.current) return;
    vrRequestRef.current = true;
    let session: XRSession | undefined;
    void audioRef.current?.unlock();
    try {
      session = await xr.requestSession("immersive-vr", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["bounded-floor"],
      });
      if (
        rendererRef.current !== renderer ||
        !renderer.domElement.isConnected
      ) {
        await session.end();
        return;
      }
      await renderer.xr.setSession(session);
      if (!started) {
        setStarted(true);
        narrate();
      }
    } catch {
      void session?.end().catch(() => undefined);
      setRuntimeError(
        "VR could not start. The complete wool mission remains available on this screen.",
      );
    } finally {
      vrRequestRef.current = false;
    }
  };

  const start = () => {
    setStarted(true);
    narrate();
  };
  const toggleAudio = () => {
    const value = !muted;
    setMuted(value);
    audioRef.current?.setMuted(value);
    if (!value) narrate();
  };
  const quiz =
    stage.id === "quiz" && state.quizIndex < WOOL_PROCESSING_QUIZ.length
      ? WOOL_PROCESSING_QUIZ[state.quizIndex]
      : undefined;
  const progress = state.completed
    ? 100
    : Math.round(
        ((state.stageIndex + (canContinue ? 1 : 0)) /
          WOOL_PROCESSING_STAGES.length) *
          100,
      );
  const preparationNext = SHEARING_PREPARATION_SEQUENCE[state.preparationIndex];
  const stationNext = SCOURING_STATION_SEQUENCE[state.scouringIndex];
  const journeyNext = WOOL_PROCESS_SEQUENCE[state.sequenceIndex];

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-stage={stage.id}
      data-complete={state.completed}
    >
      <header className={styles.header}>
        <Link href="/simulations" className={styles.brand}>
          <span aria-hidden="true">♈</span>
          <span>
            FLOCK VALLEY<small>CLASS 7 · FIBRE TO FABRIC</small>
          </span>
        </Link>
        <div
          className={styles.progress}
          aria-label={`Wool mission progress ${progress}%`}
        >
          <span>
            <b>
              {state.completed
                ? "✓"
                : String(state.stageIndex + 1).padStart(2, "0")}
            </b>{" "}
            of 10
          </span>
          <i>
            <em style={{ width: `${progress}%` }} />
          </i>
        </div>
        <div className={styles.tools}>
          <button type="button" onClick={toggleAudio} aria-pressed={!muted}>
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button type="button" onClick={() => dispatch({ type: "restart" })}>
            ↻ <span>Restart</span>
          </button>
          {vrSupported && (
            <button
              type="button"
              onClick={() =>
                immersive
                  ? void rendererRef.current?.xr.getSession()?.end()
                  : void enterVR()
              }
            >
              {immersive ? "Exit VR" : "Enter VR"}
            </button>
          )}
        </div>
      </header>

      <section
        className={styles.world}
        aria-label="Wool processing simulation scene"
      >
        <div
          ref={mountRef}
          className={styles.canvas}
          role="img"
          aria-label="Interactive sheep farm, shearing station and wool scouring workshop"
          data-ready={ready}
          data-inspected={state.inspected.join(",")}
          data-preparation-index={state.preparationIndex}
          data-shearing-index={state.shearingIndex}
          data-scouring-index={state.scouringIndex}
          data-sequence-index={state.sequenceIndex}
          data-quiz-index={state.quizIndex}
        />
        <div className={styles.sceneTag}>
          <span>●</span> FLOCK VALLEY WOOL WORKSHOP{" "}
          <small>Drag to orbit · right-drag to pan · scroll to zoom</small>
        </div>
        {hover && TARGET_LABELS[hover] && (
          <div className={styles.objectHint}>{TARGET_LABELS[hover]}</div>
        )}
        {!ready && !runtimeError && (
          <div className={styles.loading}>Opening Flock Valley…</div>
        )}
        {runtimeError && (
          <div className={styles.error} role="alert">
            {runtimeError}
          </div>
        )}
        <div className={styles.cameraTools}>
          <button type="button" onClick={() => focusRef.current()}>
            Reset view
          </button>
          <button
            type="button"
            onClick={() =>
              void (
                document.fullscreenElement
                  ? document.exitFullscreen()
                  : rootRef.current?.requestFullscreen()
              )?.catch(() => undefined)
            }
          >
            Full screen ↗
          </button>
        </div>
        {state.completed && (
          <div className={styles.badge}>
            <span>BADGE UNLOCKED</span>
            <h2>
              Master of
              <br />
              Wool Processing
            </h2>
            <p>Care · Shear · Scour · Rinse · Dry</p>
          </div>
        )}
      </section>

      <section className={styles.panel} aria-label="Current wool mission">
        {!started ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>CHAPTER 3 · ACTIVITY 1</div>
              <h1>Turn Woolly's fleece into clean wool.</h1>
              <p>
                Care for a life-sized sheep, practise humane shearing decisions
                and operate a complete scouring line.
              </p>
            </div>
            <div className={styles.activity}>
              <div className={styles.guide}>
                <button
                  type="button"
                  onClick={narrate}
                  aria-label="Listen to narration"
                >
                  ♪
                </button>
                <div>
                  <strong>Dr Asha, wool scientist</strong>
                  <p>{WOOL_PROCESSING_STAGES[0].narration}</p>
                </div>
              </div>
            </div>
            <button
              className={styles.primary}
              type="button"
              disabled={!ready}
              onClick={start}
            >
              Begin Mission Wool <span>→</span>
            </button>
          </>
        ) : state.completed ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>MISSION WOOL COMPLETE</div>
              <h1>Woolly is comfortable. The fleece is clean.</h1>
              <p>
                You separated animal care, shearing and scouring into one
                evidence-based wool journey.
              </p>
            </div>
            <div className={styles.activity}>
              <div className={styles.guide}>
                <span className={styles.guideIcon}>✓</span>
                <div>
                  <strong>Four science stars earned</strong>
                  <p>{state.feedback}</p>
                </div>
              </div>
            </div>
            <button
              className={styles.primary}
              type="button"
              onClick={() => dispatch({ type: "restart" })}
            >
              Run the mission again <span>↻</span>
            </button>
          </>
        ) : (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>
                {stage.shortTitle.toUpperCase()}
              </div>
              <h1>{stage.title}</h1>
              <p>{stage.instruction}</p>
              {stage.id === "arrival" && (
                <div className={styles.evidenceRow}>
                  {stage.requiredTargets.map((id) => (
                    <span key={id} data-done={state.inspected.includes(id)}>
                      {state.inspected.includes(id) ? "✓" : "○"}{" "}
                      {TARGET_LABELS[id]}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.activity}>
              <div className={styles.guide} data-status={audioStatus}>
                <button
                  type="button"
                  onClick={narrate}
                  aria-label="Replay narration"
                >
                  ♪
                </button>
                <div>
                  <strong>
                    {audioStatus === "playing"
                      ? "Dr Asha is explaining"
                      : "Mission evidence"}
                  </strong>
                  <p>
                    {audioStatus === "playing" && caption
                      ? caption
                      : state.feedback}
                  </p>
                  {audioStatus === "playing" && caption && (
                    <small aria-live="polite">
                      Latest action: {state.feedback}
                    </small>
                  )}
                </div>
              </div>

              {stage.id === "season" && (
                <fieldset className={styles.choice}>
                  <legend>Choose a season for Woolly</legend>
                  <div>
                    {(["winter", "rainy", "summer"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          dispatch({ type: "choose-season", value })
                        }
                      >
                        {TARGET_LABELS[value]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {stage.id === "prepare" && (
                <fieldset className={styles.choice}>
                  <legend>
                    Safety step {state.preparationIndex + 1} of 6
                    {preparationNext
                      ? `: ${TARGET_LABELS[preparationNext]}`
                      : ""}
                  </legend>
                  <div>
                    {PREPARATION_TARGETS.map((target) => (
                      <button
                        key={target}
                        type="button"
                        data-done={
                          SHEARING_PREPARATION_SEQUENCE.indexOf(
                            target as never,
                          ) < state.preparationIndex
                        }
                        onClick={() => dispatch({ type: "prepare", target })}
                      >
                        {TARGET_LABELS[target]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {stage.id === "shearing" && (
                <fieldset className={styles.choice}>
                  <legend>
                    Set the shears, then choose glowing path{" "}
                    {state.shearingIndex + 1} of 4
                  </legend>
                  <div>
                    <button
                      type="button"
                      aria-pressed={shearAngle === "parallel"}
                      onClick={() => {
                        shearAngleRef.current = "parallel";
                        setShearAngle("parallel");
                      }}
                    >
                      Parallel angle
                    </button>
                    <button
                      type="button"
                      aria-pressed={shearAngle === "steep"}
                      onClick={() => {
                        shearAngleRef.current = "steep";
                        setShearAngle("steep");
                      }}
                    >
                      Steep angle
                    </button>
                    <button
                      type="button"
                      aria-pressed={shearSpeed === "steady"}
                      onClick={() => {
                        shearSpeedRef.current = "steady";
                        setShearSpeed("steady");
                      }}
                    >
                      Steady speed
                    </button>
                    <button
                      type="button"
                      aria-pressed={shearSpeed === "too-fast"}
                      onClick={() => {
                        shearSpeedRef.current = "too-fast";
                        setShearSpeed("too-fast");
                      }}
                    >
                      Fast speed
                    </button>
                  </div>
                </fieldset>
              )}

              {stage.id === "detective" && (
                <fieldset className={styles.choice}>
                  <legend>
                    After finding all four clues, what should happen?
                  </legend>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: "answer-fleece", value: "spin-now" })
                      }
                    >
                      Spin it immediately
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "answer-fleece",
                          value: "clean-first",
                        })
                      }
                    >
                      Scour it first
                    </button>
                  </div>
                </fieldset>
              )}

              {stage.id === "experiment" && (
                <fieldset className={styles.choice}>
                  <legend>
                    Test all three, then select the best condition
                  </legend>
                  <div>
                    {SCOURING_CONTAINERS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        data-done={state.testedContainers.includes(value)}
                        onClick={() =>
                          dispatch({ type: "test-container", value })
                        }
                      >
                        {state.testedContainers.includes(value)
                          ? "✓ "
                          : "Test: "}
                        {TARGET_LABELS[value]}
                      </button>
                    ))}
                  </div>
                  <div>
                    {SCOURING_CONTAINERS.map((value) => (
                      <button
                        key={`choose-${value}`}
                        type="button"
                        onClick={() =>
                          dispatch({ type: "choose-container", value })
                        }
                      >
                        Choose {TARGET_LABELS[value]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {stage.id === "station" && (
                <fieldset className={styles.choice}>
                  <legend>
                    Station step {state.scouringIndex + 1} of 7
                    {stationNext ? `: ${TARGET_LABELS[stationNext]}` : ""}
                  </legend>
                  <div>
                    {STATION_TARGETS.map((target) => (
                      <button
                        key={target}
                        type="button"
                        onClick={() => dispatch({ type: "scour", target })}
                      >
                        {TARGET_LABELS[target]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {stage.id === "journey" && (
                <fieldset className={styles.choice}>
                  <legend>
                    Next place {state.sequenceIndex + 1} of 6
                    {journeyNext ? `: ${journeyNext.replaceAll("-", " ")}` : ""}
                  </legend>
                  <div>
                    {WOOL_PROCESS_SEQUENCE.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => dispatch({ type: "sequence", value })}
                      >
                        {TARGET_LABELS[`sequence-${value}`]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {quiz && (
                <fieldset className={styles.choice}>
                  <legend>{quiz.question}</legend>
                  <div>
                    {quiz.options.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => dispatch({ type: "quiz", value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>

            <button
              className={styles.primary}
              type="button"
              disabled={!canContinue}
              onClick={() => dispatch({ type: "next" })}
            >
              {canContinue
                ? stage.id === "quiz"
                  ? "Unlock wool badge"
                  : "Continue the wool journey"
                : "Complete this evidence task"}
              <span>→</span>
            </button>
          </>
        )}
      </section>
    </main>
  );
}
