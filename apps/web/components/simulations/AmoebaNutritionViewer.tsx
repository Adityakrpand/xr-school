"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createAmoebaNutritionScene } from "@/lib/amoebaNutritionScene";
import {
  AMOEBA_QUIZ,
  AMOEBA_SEQUENCE,
  AMOEBA_STAGES,
  amoebaCanContinue,
  createAmoebaState,
  currentAmoebaStage,
  reduceAmoeba,
  type AmoebaAction,
  type AmoebaStageId,
} from "@/lib/amoebaNutritionLesson";
import {
  createPloughingAudio,
  type PloughingAudioStatus,
} from "@/lib/ploughingAudio";
import { createGuidedCamera } from "@/lib/world-builder/guidedCamera";
import { createQuestVrControls } from "./questVrControls";
import styles from "./PloughingPreparationViewer.module.css";

const TARGET_LABELS: Readonly<Record<string, string>> = {
  dropper: "Collecting dropper",
  "pond-water": "Freshwater pond sample",
  "glass-slide": "Glass microscope slide",
  microscope: "Compound microscope",
  amoeba: "Ami — the shape-changing amoeba",
  "cell-membrane": "Cell membrane",
  cytoplasm: "Jelly-like cytoplasm",
  nucleus: "Nucleus",
  pseudopodia: "Pseudopodia — false feet",
  "food-vacuole": "Food vacuole",
  "food-particle": "Bacterial food particle",
  "feeding-pseudopodium": "Extending pseudopodium",
  "left-pseudopodium": "Left pseudopodium",
  "right-pseudopodium": "Right pseudopodium",
  "ingestion-vacuole": "New food vacuole",
  "enzyme-one": "Digestive enzyme point one",
  "enzyme-two": "Digestive enzyme point two",
  "enzyme-three": "Digestive enzyme point three",
  "energy-nutrient": "Nutrients used for energy",
  "growth-nutrient": "Nutrients used for growth",
  "repair-nutrient": "Nutrients used for repair",
  "waste-vacuole": "Waste vacuole",
  "waste-release": "Cell-membrane release point",
  "sequence-ingestion": "Ingestion",
  "sequence-digestion": "Digestion",
  "sequence-absorption": "Absorption",
  "sequence-assimilation": "Assimilation",
  "sequence-egestion": "Egestion",
  "recap-pseudopodia": "Pseudopodia",
  "recap-food-vacuole": "Food vacuole",
  "recap-nucleus": "Nucleus",
  "recap-egestion": "Undigested waste outside the cell",
};

const STAGE_ALLOWED: Readonly<Record<AmoebaStageId, readonly string[]>> = {
  pond: ["dropper", "pond-water", "glass-slide", "microscope"],
  find: ["amoeba"],
  anatomy: ["cell-membrane", "cytoplasm", "nucleus", "pseudopodia", "food-vacuole"],
  hungry: ["food-particle", "feeding-pseudopodium"],
  ingestion: ["left-pseudopodium", "right-pseudopodium", "ingestion-vacuole"],
  digestion: ["enzyme-one", "enzyme-two", "enzyme-three"],
  assimilation: ["energy-nutrient", "growth-nutrient", "repair-nutrient"],
  egestion: ["waste-vacuole", "waste-release"],
  sequence: AMOEBA_SEQUENCE.map((name) => `sequence-${name}`),
  recap: ["recap-pseudopodia", "recap-food-vacuole", "recap-nucleus", "recap-egestion"],
};

const RECAP_TARGET_ANSWERS: Readonly<Record<string, string>> = {
  "recap-pseudopodia": "pseudopodia",
  "recap-food-vacuole": "food-vacuole",
  "recap-nucleus": "nucleus",
  "recap-egestion": "egestion",
};

const cueFor = (stage: AmoebaStageId) => ({
  id: `amoeba-${stage}`,
  text: AMOEBA_STAGES.find((item) => item.id === stage)?.narration ?? "",
  audioUrl: `/narration/amoeba-nutrition/${stage}.mp3`,
});

function createVrCard(text: string, width = 1.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#e7fff8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#19756f";
  context.lineWidth = 14;
  context.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
  context.fillStyle = "#10383d";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 42px sans-serif";
  const words = text.split(" ");
  let line = "";
  let y = 92;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > 920) {
      context.fillText(line, 512, y);
      line = word;
      y += 57;
    } else {
      line = candidate;
    }
  }
  context.fillText(line, 512, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width * 320) / 1024),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
}

export default function AmoebaNutritionViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef(createAmoebaState());
  const dispatchRef = useRef<(action: AmoebaAction) => void>(() => {});
  const focusRef = useRef<() => void>(() => {});
  const audioRef = useRef<ReturnType<typeof createPloughingAudio> | null>(null);
  const vrRequestRef = useRef(false);
  const [state, setState] = useState(createAmoebaState);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const [hover, setHover] = useState<string>();
  const [muted, setMuted] = useState(false);
  const [audioStatus, setAudioStatus] = useState<PloughingAudioStatus>("idle");
  const [caption, setCaption] = useState("");
  const [vrSupported, setVrSupported] = useState(false);
  const [immersive, setImmersive] = useState(false);

  const stage = currentAmoebaStage(state);
  const canContinue = amoebaCanContinue(state);

  const narrate = useCallback(() => {
    const current = currentAmoebaStage(stateRef.current);
    void audioRef.current?.unlock();
    audioRef.current?.enqueue([cueFor(current.id)], true);
  }, []);

  const dispatch = useCallback((action: AmoebaAction) => {
    const before = stateRef.current;
    const next = reduceAmoeba(before, action);
    if (next === before) return;
    stateRef.current = next;
    setState(next);
    if (next.stageIndex !== before.stageIndex) {
      setHover(undefined);
      focusRef.current();
      const nextStage = currentAmoebaStage(next);
      void audioRef.current?.unlock();
      audioRef.current?.enqueue([cueFor(nextStage.id)], true);
    }
    if (action.type === "restart") {
      setStarted(false);
      setHover(undefined);
      audioRef.current?.stop();
      focusRef.current();
    }
  }, []);
  dispatchRef.current = dispatch;

  const activateTarget = useCallback((id: string) => {
    const current = stateRef.current;
    const currentStage = currentAmoebaStage(current);
    if (!STAGE_ALLOWED[currentStage.id].includes(id)) return;
    if (currentStage.id === "pond") {
      dispatchRef.current({ type: "sample", target: id });
      return;
    }
    if (currentStage.id === "sequence") {
      dispatchRef.current({ type: "sequence", value: id.replace("sequence-", "") });
      return;
    }
    if (currentStage.id === "recap") {
      dispatchRef.current({ type: "quiz", value: RECAP_TARGET_ANSWERS[id] ?? "" });
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
        "This browser could not open the microscopic world. Please enable WebGL or try another browser.",
      );
      return () => audio.dispose();
    }
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    renderer.domElement.setAttribute("aria-label", "Interactive amoeba nutrition world");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pondBackground = new THREE.Color(0x8fc8d3);
    const microscopicBackground = new THREE.Color(0x082e38);
    scene.background = microscopicBackground;
    scene.fog = new THREE.FogExp2(0x082e38, 0.035);
    const world = createAmoebaNutritionScene(scene);
    const camera = new THREE.PerspectiveCamera(47, 1, 0.05, 90);
    const guided = createGuidedCamera(camera, renderer.domElement, {
      minDistance: 1.15,
      maxDistance: 9,
    });
    guided.controls.maxPolarAngle = Math.PI / 2 - 0.025;
    const focus = () => {
      if (renderer.xr.isPresenting) return;
      const frame = world.getFrame(currentAmoebaStage(stateRef.current).id);
      const offset = frame.position.clone().sub(frame.target);
      frame.position
        .copy(frame.target)
        .addScaledVector(offset, Math.max(1, Math.min(1.32, 1.08 / camera.aspect)));
      guided.focusOn(frame, { animate: false });
    };
    focusRef.current = focus;

    const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)];
    const controllerRay = new THREE.Raycaster();
    const rays: THREE.Line[] = [];
    for (const controller of controllers) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0, -3.2),
        ]),
        new THREE.LineBasicMaterial({ color: 0x73ffe0 }),
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
        if (amoebaCanContinue(stateRef.current)) dispatchRef.current({ type: "next" });
        else narrate();
      },
      onBack: () => {
        void renderer.xr.getSession()?.end();
      },
      onNarrate: narrate,
      startPosition: new THREE.Vector3(0, 0, 3.25),
      movementBounds: new THREE.Box2(
        new THREE.Vector2(-3.7, -0.9),
        new THREE.Vector2(3.7, 5.9),
      ),
    });

    const hud = new THREE.Group();
    scene.add(hud);
    const promptCard = createVrCard(AMOEBA_STAGES[0].instruction);
    promptCard.position.set(0, 2.12, -1.22);
    const nextCard = createVrCard("Next scene", 0.65);
    nextCard.position.set(0.86, 1.52, 0.2);
    nextCard.userData.targetId = "continue";
    const exitCard = createVrCard("B: Exit VR", 0.65);
    exitCard.position.set(-0.86, 1.52, 0.2);
    exitCard.userData.targetId = "exit";
    hud.add(promptCard, nextCard, exitCard);

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
        if (typeof node.userData.targetId === "string") return node.userData.targetId as string;
        node = node.parent;
      }
      return undefined;
    };
    const activeRoots = () => {
      const current = currentAmoebaStage(stateRef.current);
      return STAGE_ALLOWED[current.id]
        .map((id) => world.targets.get(id))
        .filter((object): object is THREE.Object3D => Boolean(object && visible(object)));
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
      const roots = includeHud ? [...activeRoots(), nextCard, exitCard] : activeRoots();
      for (const intersection of ray.intersectObjects(roots, true)) {
        if (!visible(intersection.object)) continue;
        const id = resolveTarget(intersection.object);
        if (id) return id;
      }
      return undefined;
    };
    let down: { x: number; y: number; id?: string } | undefined;
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
      const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
      const id = hit(raycaster);
      if (distance <= 8 && id && id === down.id) activateTarget(id);
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
    renderer.domElement.addEventListener("lostpointercapture", cancelPointer, true);

    const controllerListeners = controllers.map((controller) => {
      const select = () => {
        controller.updateMatrixWorld(true);
        controllerRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        controllerRay.ray.direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
        const id = hit(controllerRay, true);
        if (id === "continue") {
          if (amoebaCanContinue(stateRef.current)) dispatchRef.current({ type: "next" });
          else narrate();
        } else if (id === "exit") {
          void renderer.xr.getSession()?.end();
        } else if (id) {
          activateTarget(id);
        }
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
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      if (renderer.xr.isPresenting) quest.update();
      else guided.update(delta);
      const current = stateRef.current;
      const activeStage = currentAmoebaStage(current);
      const pondStage = activeStage.id === "pond";
      scene.background = pondStage ? pondBackground : microscopicBackground;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set(pondStage ? 0x8fc8d3 : 0x082e38);
        scene.fog.density = pondStage ? 0.012 : 0.035;
      }
      world.update(current, delta, elapsed);
      hud.visible = renderer.xr.isPresenting;
      const nextMaterial = nextCard.material as THREE.MeshBasicMaterial;
      nextMaterial.opacity = amoebaCanContinue(current) ? 1 : 0.45;
      nextMaterial.transparent = true;
      if (lastStage !== current.stageIndex) {
        const nextPrompt = createVrCard(activeStage.instruction);
        const promptMaterial = promptCard.material as THREE.MeshBasicMaterial;
        promptMaterial.map?.dispose();
        promptMaterial.map = (nextPrompt.material as THREE.MeshBasicMaterial).map;
        promptMaterial.needsUpdate = true;
        nextPrompt.geometry.dispose();
        (nextPrompt.material as THREE.Material).dispose();
        lastStage = current.stageIndex;
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
      void renderer.xr.getSession()?.end().catch(() => undefined);
      renderer.domElement.removeEventListener("pointerdown", pointerDown, true);
      renderer.domElement.removeEventListener("pointermove", pointerMove, true);
      renderer.domElement.removeEventListener("pointerup", pointerUp, true);
      renderer.domElement.removeEventListener("pointercancel", cancelPointer, true);
      renderer.domElement.removeEventListener("lostpointercapture", cancelPointer, true);
      controllerListeners.forEach(({ controller, select }) =>
        controller.removeEventListener("selectstart", select),
      );
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
      rendererRef.current = null;
      audioRef.current = null;
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
      await renderer.xr.setSession(session);
      if (!started) {
        setStarted(true);
        narrate();
      }
    } catch {
      void session?.end().catch(() => undefined);
      setRuntimeError(
        "VR could not start. The complete amoeba investigation remains available on this screen.",
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
  const quiz = stage.id === "recap" && state.quizIndex < AMOEBA_QUIZ.length
    ? AMOEBA_QUIZ[state.quizIndex]
    : undefined;
  const progress = state.completed
    ? 100
    : Math.round(((state.stageIndex + (canContinue ? 1 : 0)) / AMOEBA_STAGES.length) * 100);

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-stage={stage.id}
      data-complete={state.completed}
    >
      <header className={styles.header}>
        <Link href="/simulations" className={styles.brand}>
          <span aria-hidden="true">◉</span>
          <span>
            AMOEBA LAB<small>CLASS 7 · NUTRITION IN ANIMALS</small>
          </span>
        </Link>
        <div className={styles.progress} aria-label={`Microscope progress ${progress}%`}>
          <span>
            <b>{state.completed ? "✓" : String(state.stageIndex + 1).padStart(2, "0")}</b>{" "}
            of 10
          </span>
          <i><em style={{ width: `${progress}%` }} /></i>
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

      <section className={styles.world} aria-label="Amoeba nutrition simulation scene">
        <div
          ref={mountRef}
          className={styles.canvas}
          role="img"
          aria-label="Interactive microscope and amoeba world"
          data-ready={ready}
          data-inspected={state.inspected.join(",")}
          data-sample-index={state.sampleIndex}
          data-sequence-index={state.sequenceIndex}
          data-quiz-index={state.quizIndex}
        />
        <div className={styles.sceneTag}>
          <span>●</span> MICROSCOPIC POND WORLD{" "}
          <small>Drag to orbit · scroll to zoom</small>
        </div>
        {hover && TARGET_LABELS[hover] && (
          <div className={styles.objectHint}>{TARGET_LABELS[hover]}</div>
        )}
        {!ready && !runtimeError && (
          <div className={styles.loading}>Focusing the microscope…</div>
        )}
        {runtimeError && <div className={styles.error} role="alert">{runtimeError}</div>}
        <div className={styles.cameraTools}>
          <button type="button" onClick={() => focusRef.current()}>Reset view</button>
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
            <h2>Amoeba<br />Nutrition Explorer</h2>
            <p>Ingest · Digest · Absorb · Use · Egest</p>
          </div>
        )}
      </section>

      <section className={styles.panel} aria-label="Current amoeba mission">
        {!started ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>CHAPTER 2 · ACTIVITY 2</div>
              <h1>Shrink into a drop of pond water.</h1>
              <p>
                Meet Dr Anaya and Ami, explore one living cell, then trace every stage of holozoic nutrition.
              </p>
            </div>
            <div className={styles.guide}>
              <button type="button" onClick={narrate} aria-label="Listen to narration">♪</button>
              <div>
                <strong>Dr Anaya, your field guide</strong>
                <p>{AMOEBA_STAGES[0].narration}</p>
              </div>
            </div>
            <button className={styles.primary} type="button" disabled={!ready} onClick={start}>
              Begin the microscope mission <span>→</span>
            </button>
          </>
        ) : state.completed ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>MICROSCOPIC MISSION COMPLETE</div>
              <h1>You traced nutrition inside one cell.</h1>
              <p>
                Ami used pseudopodia to ingest food, a food vacuole to digest it, cytoplasm to absorb and use nutrients, and the membrane to egest waste.
              </p>
            </div>
            <div className={styles.guide}>
              <span className={styles.guideIcon}>✓</span>
              <div><strong>Evidence secured</strong><p>{state.feedback}</p></div>
            </div>
            <button className={styles.primary} type="button" onClick={() => dispatch({ type: "restart" })}>
              Explore again <span>↻</span>
            </button>
          </>
        ) : (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>{stage.shortTitle.toUpperCase()}</div>
              <h1>{stage.title}</h1>
              <p>{stage.instruction}</p>
            </div>

            <div className={styles.guide} data-status={audioStatus}>
              <button type="button" onClick={narrate} aria-label="Replay narration">♪</button>
              <div>
                <strong>{audioStatus === "playing" ? "Dr Anaya is explaining" : "Scientific evidence"}</strong>
                <p>{audioStatus === "playing" && caption ? caption : state.feedback}</p>
              </div>
            </div>

            {stage.id === "pond" && (
              <div className={styles.evidenceRow} aria-label="Pond sample method">
                {AMOEBA_STAGES[0].requiredTargets.map((id, index) => (
                  <span key={id} data-done={index < state.sampleIndex}>
                    {index < state.sampleIndex ? "✓" : index + 1} {TARGET_LABELS[id]}
                  </span>
                ))}
              </div>
            )}

            {stage.id === "anatomy" && (
              <fieldset className={styles.choice} aria-label="Anatomy question">
                <legend>Which part captures food?</legend>
                <div>
                  {["pseudopodia", "nucleus", "cytoplasm"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => dispatch({ type: "answer-anatomy", value })}
                    >
                      {TARGET_LABELS[value]}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {stage.id === "sequence" && (
              <fieldset className={styles.choice} aria-label="Nutrition sequence">
                <legend>Next stage: {state.sequenceIndex + 1} of 5</legend>
                <div>
                  {AMOEBA_SEQUENCE.map((value) => (
                    <button key={value} type="button" onClick={() => dispatch({ type: "sequence", value })}>
                      {value[0].toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {quiz && (
              <fieldset className={styles.choice} aria-label="Final amoeba quiz">
                <legend>{quiz.question}</legend>
                <div>
                  {quiz.options.map(([value, label]) => (
                    <button key={value} type="button" onClick={() => dispatch({ type: "quiz", value })}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <button
              className={styles.primary}
              type="button"
              disabled={!canContinue}
              onClick={() => dispatch({ type: "next" })}
            >
              {canContinue ? (stage.id === "recap" ? "Unlock explorer badge" : "Continue the journey") : "Collect the required evidence"}
              <span>→</span>
            </button>
          </>
        )}
      </section>
    </main>
  );
}
