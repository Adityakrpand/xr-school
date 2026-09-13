"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createGuidedCamera } from "@/lib/world-builder/guidedCamera";
import { createSowingSeedsScene } from "@/lib/sowingSeedsScene";
import {
  createSowingState,
  currentSowingStage,
  reduceSowing,
  SOWING_QUIZ,
  SOWING_STAGES,
  sowingCanContinue,
  type SowingAction,
  type SowingStageId,
} from "@/lib/sowingSeedsLesson";
import {
  createPloughingAudio,
  type PloughingAudioStatus,
} from "@/lib/ploughingAudio";
import { createQuestVrControls } from "./questVrControls";
import styles from "./PloughingPreparationViewer.module.css";

const TARGET_LABELS: Readonly<Record<string, string>> = {
  "prepared-soil": "Prepared seedbed",
  "seed-bag": "Seed bag",
  farmer: "Farmer",
  seed: "Enlarged seed",
  "healthy-seed": "Select a healthy seed",
  "broken-seed": "Broken seed",
  "damaged-seed": "Damaged seed",
  "floating-seeds": "Floating seeds",
  "sunken-seeds": "Sunken seeds",
  "shallow-seed": "Too shallow",
  "correct-depth": "Suitable depth",
  "deep-seed": "Too deep",
  "crowded-row": "Crowded row",
  "proper-row": "Evenly spaced row",
  "traditional-tool": "Traditional funnel tool",
  "seed-drill": "Tractor seed drill",
  "covered-seed": "Covered seed",
  root: "Young root",
  shoot: "Young shoot",
};

const STAGE_ALLOWED: Readonly<Record<SowingStageId, readonly string[]>> = {
  prepared: ["prepared-soil", "seed-bag", "farmer"],
  meaning: ["seed", "prepared-soil"],
  selection: ["healthy-seed", "broken-seed", "damaged-seed"],
  "water-test": ["floating-seeds", "sunken-seeds"],
  depth: ["shallow-seed", "correct-depth", "deep-seed"],
  spacing: ["crowded-row", "proper-row"],
  methods: ["traditional-tool", "seed-drill"],
  germination: ["covered-seed", "root", "shoot"],
};

const cueFor = (stage: SowingStageId) => ({
  id: `sowing-${stage}`,
  text: SOWING_STAGES.find((item) => item.id === stage)?.narration ?? "",
  audioUrl: `/narration/sowing-of-seeds/${stage}.mp3`,
});

function createVrCard(text: string, width = 1.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#f8f1dd";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#507237";
  context.lineWidth = 14;
  context.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
  context.fillStyle = "#26382c";
  context.textAlign = "center";
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
    } else line = candidate;
  }
  context.fillText(line, 512, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width * 320) / 1024),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
}

export default function SowingSeedsViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef(createSowingState());
  const dispatchRef = useRef<(action: SowingAction) => void>(() => {});
  const focusRef = useRef<() => void>(() => {});
  const audioRef = useRef<ReturnType<typeof createPloughingAudio> | null>(null);
  const vrRequestRef = useRef(false);
  const [state, setState] = useState(createSowingState);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const [hover, setHover] = useState<string>();
  const [muted, setMuted] = useState(false);
  const [audioStatus, setAudioStatus] =
    useState<PloughingAudioStatus>("idle");
  const [caption, setCaption] = useState("");
  const [vrSupported, setVrSupported] = useState(false);
  const [immersive, setImmersive] = useState(false);

  const stage = currentSowingStage(state);
  const canContinue = sowingCanContinue(state);

  const narrate = useCallback(() => {
    const current = currentSowingStage(stateRef.current);
    void audioRef.current?.unlock();
    audioRef.current?.enqueue([cueFor(current.id)], true);
  }, []);

  const dispatch = useCallback((action: SowingAction) => {
    const before = stateRef.current;
    const next = reduceSowing(before, action);
    if (next === before) return;
    stateRef.current = next;
    setState(next);
    if (next.stageIndex !== before.stageIndex) {
      setHover(undefined);
      focusRef.current();
      const nextStage = currentSowingStage(next);
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
    const currentStage = currentSowingStage(current);
    if (!STAGE_ALLOWED[currentStage.id].includes(id)) return;
    if (currentStage.id === "selection" && id === "healthy-seed") {
      dispatchRef.current({ type: "select-healthy" });
      return;
    }
    if (currentStage.id === "depth") {
      const value =
        id === "shallow-seed"
          ? "shallow"
          : id === "correct-depth"
            ? "correct"
            : "deep";
      dispatchRef.current({ type: "inspect", target: id });
      dispatchRef.current({ type: "place-depth", value });
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
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setRuntimeError(
        "This browser could not open the 3D seedbed. Please enable WebGL or try another browser.",
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
    renderer.domElement.setAttribute("aria-label", "Interactive sowing field");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc8dce8);
    const world = createSowingSeedsScene(scene);
    type FarmEnvironment = "field" | "machinery";
    const panoramas = new Map<FarmEnvironment, THREE.Texture>();
    let activeEnvironment: FarmEnvironment | undefined;
    const environmentForStage = (stageId: SowingStageId): FarmEnvironment =>
      stageId === "methods" ? "machinery" : "field";
    const applyEnvironment = (stageId: SowingStageId) => {
      const environment = environmentForStage(stageId);
      const texture = panoramas.get(environment);
      if (!texture || activeEnvironment === environment) return;
      scene.background = texture;
      scene.environment = texture;
      scene.environmentIntensity = environment === "field" ? 0.32 : 0.42;
      activeEnvironment = environment;
    };
    const environmentSources: Readonly<Record<FarmEnvironment, string>> = {
      field: "/images/ploughing-soil-preparation/farm-panorama.png",
      machinery: "/images/ploughing-soil-preparation/modern-cultivator-v2.jpg",
    };
    const textureLoader = new THREE.TextureLoader();
    for (const [environment, source] of Object.entries(environmentSources) as [
      FarmEnvironment,
      string,
    ][]) {
      textureLoader.load(source, (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          4,
          renderer.capabilities.getMaxAnisotropy(),
        );
        panoramas.set(environment, texture);
        applyEnvironment(currentSowingStage(stateRef.current).id);
      });
    }

    const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 90);
    const guided = createGuidedCamera(camera, renderer.domElement, {
      minDistance: 1,
      maxDistance: 10,
    });
    guided.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    const focus = () => {
      if (renderer.xr.isPresenting) return;
      const frame = world.getFrame(currentSowingStage(stateRef.current).id);
      const offset = frame.position.clone().sub(frame.target);
      frame.position
        .copy(frame.target)
        .addScaledVector(
          offset,
          Math.max(1, Math.min(1.35, 1.08 / camera.aspect)),
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
          new THREE.Vector3(0, 0, -3),
        ]),
        new THREE.LineBasicMaterial({ color: 0xffcf67 }),
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
        if (sowingCanContinue(stateRef.current))
          dispatchRef.current({ type: "next" });
        else narrate();
      },
      onBack: () => {
        void renderer.xr.getSession()?.end();
      },
      onNarrate: narrate,
      startPosition: new THREE.Vector3(0, 0, 3.1),
      movementBounds: new THREE.Box2(
        new THREE.Vector2(-3.6, -0.8),
        new THREE.Vector2(3.6, 5.7),
      ),
    });

    const hud = new THREE.Group();
    scene.add(hud);
    const promptCard = createVrCard(SOWING_STAGES[0].instruction);
    promptCard.position.set(0, 2.1, -1.2);
    const nextCard = createVrCard("Next scene", 0.65);
    nextCard.position.set(0.85, 1.5, 0.2);
    nextCard.userData.targetId = "continue";
    const exitCard = createVrCard("B: Exit VR", 0.65);
    exitCard.position.set(-0.85, 1.5, 0.2);
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
        if (typeof node.userData.targetId === "string")
          return node.userData.targetId as string;
        node = node.parent;
      }
      return undefined;
    };
    const activeRoots = () => {
      const currentStage = currentSowingStage(stateRef.current);
      return STAGE_ALLOWED[currentStage.id]
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
        ? [...activeRoots(), nextCard, exitCard]
        : activeRoots();
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
      const distance = Math.hypot(
        event.clientX - down.x,
        event.clientY - down.y,
      );
      const id = hit(raycaster);
      if (distance <= 8 && id && id === down.id) activateTarget(id);
      if (renderer.domElement.hasPointerCapture(event.pointerId))
        renderer.domElement.releasePointerCapture(event.pointerId);
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
          if (sowingCanContinue(stateRef.current))
            dispatchRef.current({ type: "next" });
          else narrate();
        } else if (id === "exit") void renderer.xr.getSession()?.end();
        else if (id) activateTarget(id);
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
      applyEnvironment(currentSowingStage(current).id);
      world.update(current, delta, elapsed);
      hud.visible = renderer.xr.isPresenting;
      const nextMaterial = nextCard.material as THREE.MeshBasicMaterial;
      nextMaterial.opacity = sowingCanContinue(current) ? 1 : 0.45;
      nextMaterial.transparent = true;
      if (lastStage !== current.stageIndex) {
        const nextPrompt = createVrCard(
          currentSowingStage(current).instruction,
        );
        const material = promptCard.material as THREE.MeshBasicMaterial;
        material.map?.dispose();
        material.map = (nextPrompt.material as THREE.MeshBasicMaterial).map;
        material.needsUpdate = true;
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
      for (const card of [promptCard, nextCard, exitCard]) {
        card.geometry.dispose();
        (card.material as THREE.MeshBasicMaterial).map?.dispose();
        (card.material as THREE.Material).dispose();
      }
      rays.forEach((line) => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      world.dispose();
      panoramas.forEach((texture) => texture.dispose());
      panoramas.clear();
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
        "VR could not start. The full seed investigation remains available on this screen.",
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
    stage.id === "germination" && state.quizIndex < SOWING_QUIZ.length
      ? SOWING_QUIZ[state.quizIndex]
      : undefined;
  const progress = state.completed
    ? 100
    : Math.round(
        ((state.stageIndex + (canContinue ? 1 : 0)) / SOWING_STAGES.length) *
          100,
      );

  return (
    <main
      ref={rootRef}
      className={styles.root}
      data-stage={stage.id}
      data-complete={state.completed}
    >
      <header className={styles.header}>
        <Link href="/simulations" className={styles.brand}>
          <span aria-hidden="true">⌁</span>
          <span>
            SOWING LAB<small>CLASS 8 · CROP PRODUCTION</small>
          </span>
        </Link>
        <div
          className={styles.progress}
          aria-label={`Field progress ${progress}%`}
        >
          <span>
            <b>
              {state.completed
                ? "✓"
                : String(state.stageIndex + 1).padStart(2, "0")}
            </b>{" "}
            of 08
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

      <section className={styles.world} aria-label="Sowing simulation scene">
        <div
          ref={mountRef}
          className={styles.canvas}
          role="img"
          aria-label="Interactive sowing field"
          data-ready={ready}
          data-inspected={state.inspected.join(",")}
          data-healthy-seeds={state.healthySeeds}
          data-seeds-tested={state.seedsTested}
          data-depth={state.depthChoice ?? ""}
          data-spacing-fixes={state.spacingFixes}
          data-quiz-index={state.quizIndex}
        />
        <div className={styles.sceneTag}>
          <span>●</span> SUNDAR SEEDBED{" "}
          <small>Drag to orbit · scroll to zoom</small>
        </div>
        {hover && TARGET_LABELS[hover] && (
          <div className={styles.objectHint}>{TARGET_LABELS[hover]}</div>
        )}
        {!ready && !runtimeError && (
          <div className={styles.loading}>Preparing the seedbed…</div>
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
            <span>SEEDBED COMPLETE</span>
            <h2>
              Sowing
              <br />
              Specialist
            </h2>
            <p>Select · Place · Space · Cover</p>
          </div>
        )}
      </section>

      <section className={styles.panel} aria-label="Current sowing mission">
        {!started ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>CHAPTER 1 · ACTIVITY 2</div>
              <h1>Give every seed a strong beginning.</h1>
              <p>
                Choose a healthy seed batch, test depth and spacing, then
                compare traditional sowing with a modern seed drill.
              </p>
            </div>
            <div className={styles.guide}>
              <button
                type="button"
                onClick={narrate}
                aria-label="Listen to narration"
              >
                ♪
              </button>
              <div>
                <strong>Your field guide</strong>
                <p>{SOWING_STAGES[0].narration}</p>
              </div>
            </div>
            <button
              className={styles.primary}
              type="button"
              disabled={!ready}
              onClick={start}
            >
              Enter the seedbed <span>→</span>
            </button>
          </>
        ) : state.completed ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>SOWING MISSION COMPLETE</div>
              <h1>The seedbed is ready to grow.</h1>
              <p>
                Healthy seeds now have suitable depth, even spacing, soil
                cover and the conditions needed to germinate.
              </p>
            </div>
            <div className={styles.guide}>
              <span className={styles.guideIcon}>✓</span>
              <div>
                <strong>Evidence secured</strong>
                <p>{state.feedback}</p>
              </div>
            </div>
            <button
              className={styles.primary}
              type="button"
              onClick={() => dispatch({ type: "restart" })}
            >
              Run it again <span>↻</span>
            </button>
          </>
        ) : (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>
                SEED FILE {String(state.stageIndex + 1).padStart(2, "0")} ·{" "}
                {stage.shortTitle.toUpperCase()}
              </div>
              <h1>{stage.title}</h1>
              <p>{stage.instruction}</p>
              <div className={styles.evidenceRow}>
                {stage.requiredTargets.map((id) => (
                  <span key={id} data-done={state.inspected.includes(id)}>
                    {state.inspected.includes(id) ? "✓" : "○"}{" "}
                    {TARGET_LABELS[id]}
                  </span>
                ))}
                {stage.id === "selection" && (
                  <span data-done={state.healthySeeds >= 5}>
                    ◉ {state.healthySeeds}/5 healthy seeds
                  </span>
                )}
                {stage.id === "water-test" && (
                  <span data-done={state.seedsTested}>◌ water test run</span>
                )}
                {stage.id === "depth" && (
                  <span data-done={state.depthChoice === "correct"}>
                    ↕ suitable depth
                  </span>
                )}
                {stage.id === "spacing" && (
                  <span data-done={state.spacingFixes >= 3}>
                    ↔ {state.spacingFixes}/3 seeds spaced
                  </span>
                )}
              </div>
            </div>
            <div className={styles.activity}>
              <div className={styles.guide}>
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
                      ? "Your guide is speaking…"
                      : "Seed evidence"}
                  </strong>
                  <p aria-live="polite">{state.feedback}</p>
                  {audioStatus === "playing" && <small>{caption}</small>}
                </div>
              </div>
              <div
                className={styles.hotspots}
                aria-label="Seed interaction controls"
              >
                {STAGE_ALLOWED[stage.id].map((id) => (
                  <button
                    type="button"
                    key={id}
                    data-done={state.inspected.includes(id)}
                    disabled={
                      id === "healthy-seed" && state.healthySeeds >= 5
                    }
                    onClick={() => activateTarget(id)}
                  >
                    {id === "healthy-seed"
                      ? `Select seed ${Math.min(5, state.healthySeeds + 1)}`
                      : TARGET_LABELS[id]}
                  </button>
                ))}
                {stage.id === "water-test" && (
                  <button
                    type="button"
                    data-done={state.seedsTested}
                    disabled={state.seedsTested}
                    onClick={() => dispatch({ type: "test-seeds" })}
                  >
                    Drop seeds into water
                  </button>
                )}
                {stage.id === "spacing" && (
                  <button
                    type="button"
                    data-done={state.spacingFixes >= 3}
                    disabled={state.spacingFixes >= 3}
                    onClick={() => dispatch({ type: "space-seed" })}
                  >
                    Move seed {Math.min(3, state.spacingFixes + 1)}
                  </button>
                )}
              </div>
              {stage.id === "meaning" && (
                <Choice
                  question="What is sowing?"
                  options={[
                    ["harvest", "Cutting a crop"],
                    ["sowing", "Placing seeds in prepared soil"],
                    ["weeding", "Removing weeds"],
                  ]}
                  onChoose={(value) => dispatch({ type: "answer", value })}
                />
              )}
              {stage.id === "methods" && (
                <Choice
                  question="Which tool places seeds more uniformly in rows?"
                  options={[
                    ["funnel", "Funnel tool + plough"],
                    ["seed-drill", "Tractor + seed drill"],
                  ]}
                  onChoose={(value) => dispatch({ type: "answer", value })}
                />
              )}
              {quiz && (
                <Choice
                  question={`Crop check ${state.quizIndex + 1}/5 · ${quiz.question}`}
                  options={quiz.options}
                  onChoose={(value) => dispatch({ type: "answer", value })}
                />
              )}
            </div>
            <button
              className={styles.primary}
              type="button"
              disabled={!canContinue}
              onClick={() => dispatch({ type: "next" })}
            >
              {state.stageIndex === SOWING_STAGES.length - 1
                ? "Finish mission"
                : "Next seed file"}{" "}
              <span>→</span>
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function Choice({
  question,
  options,
  onChoose,
}: {
  question: string;
  options: readonly (readonly [string, string])[];
  onChoose(value: string): void;
}) {
  return (
    <fieldset className={styles.choice}>
      <legend>{question}</legend>
      <div>
        {options.map(([value, label]) => (
          <button type="button" key={value} onClick={() => onChoose(value)}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
