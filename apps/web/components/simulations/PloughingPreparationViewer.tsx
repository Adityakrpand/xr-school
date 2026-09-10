"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createGuidedCamera } from "@/lib/world-builder/guidedCamera";
import { createPloughingScene } from "@/lib/ploughingScene";
import {
  createPloughingState,
  currentPloughingStage,
  PLOUGHING_QUIZ,
  PLOUGHING_STAGES,
  ploughingCanContinue,
  reducePloughing,
  type PloughingAction,
  type PloughingStageId,
  type PloughingState,
} from "@/lib/ploughingLesson";
import {
  createPloughingAudio,
  type PloughingAudioStatus,
} from "@/lib/ploughingAudio";
import { createQuestVrControls } from "./questVrControls";
import styles from "./PloughingPreparationViewer.module.css";

const TARGET_LABELS: Readonly<Record<string, string>> = {
  "hard-soil": "Compact soil",
  farmer: "Farmer",
  "soil-clod": "Soil clod",
  plough: "Traditional plough",
  bullocks: "Pair of bullocks",
  "turned-soil": "Turned soil",
  furrow: "Inspect a furrow",
  tractor: "Tractor",
  cultivator: "Cultivator tines",
  roots: "Deep roots",
  "air-spaces": "Air spaces",
  earthworm: "Earthworm",
  nutrients: "Mixed nutrients",
  "finish-clod": "Break a clod",
  leveller: "Use the leveller",
  "ready-soil": "Prepared soil",
  "seed-bag": "Seed bag",
};

const STAGE_ALLOWED: Readonly<Record<PloughingStageId, readonly string[]>> = {
  farm: ["hard-soil", "farmer"],
  "hard-soil": ["soil-clod"],
  plough: ["plough", "bullocks", "turned-soil"],
  traditional: ["plough", "furrow"],
  modern: ["tractor", "cultivator"],
  underground: ["roots", "air-spaces", "earthworm", "nutrients"],
  levelling: ["finish-clod", "leveller"],
  ready: ["ready-soil", "seed-bag"],
};

const cueFor = (stage: PloughingStageId) => ({
  id: `ploughing-${stage}`,
  text: PLOUGHING_STAGES.find((item) => item.id === stage)?.narration ?? "",
  audioUrl: `/narration/ploughing-soil-preparation/${stage}.mp3`,
});

function createVrCard(text: string, width = 1.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#f8f1dd";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#8b5527";
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

export default function PloughingPreparationViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef(createPloughingState());
  const dispatchRef = useRef<(action: PloughingAction) => void>(() => {});
  const focusRef = useRef<() => void>(() => {});
  const audioRef = useRef<ReturnType<typeof createPloughingAudio> | null>(null);
  const vrRequestRef = useRef(false);
  const [state, setState] = useState(createPloughingState);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const [hover, setHover] = useState<string>();
  const [muted, setMuted] = useState(false);
  const [audioStatus, setAudioStatus] = useState<PloughingAudioStatus>("idle");
  const [caption, setCaption] = useState("");
  const [vrSupported, setVrSupported] = useState(false);
  const [immersive, setImmersive] = useState(false);

  const stage = currentPloughingStage(state);
  const canContinue = ploughingCanContinue(state);

  const narrate = useCallback(() => {
    const current = currentPloughingStage(stateRef.current);
    void audioRef.current?.unlock();
    audioRef.current?.enqueue([cueFor(current.id)], true);
  }, []);

  const dispatch = useCallback((action: PloughingAction) => {
    const before = stateRef.current;
    const next = reducePloughing(before, action);
    if (next === before) return;
    stateRef.current = next;
    setState(next);
    if (next.stageIndex !== before.stageIndex) {
      setHover(undefined);
      focusRef.current();
      const nextStage = currentPloughingStage(next);
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
    const currentStage = currentPloughingStage(current);
    if (!STAGE_ALLOWED[currentStage.id].includes(id)) return;
    if (currentStage.id === "traditional" && id === "plough") {
      dispatchRef.current({ type: "plough-pass" });
      return;
    }
    if (currentStage.id === "levelling" && id === "finish-clod") {
      dispatchRef.current({ type: "break-clod" });
      return;
    }
    if (currentStage.id === "levelling" && id === "leveller") {
      dispatchRef.current({ type: "level" });
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
        "This browser could not open the 3D farm. Please enable WebGL or try another browser.",
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
      "Interactive ploughing field",
    );
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc6d9e6);
    const world = createPloughingScene(scene);
    type FarmEnvironment = "field" | "traditional" | "modern";
    const panoramas = new Map<FarmEnvironment, THREE.Texture>();
    const environmentForStage = (
      stageId: PloughingStageId,
    ): FarmEnvironment => {
      if (stageId === "plough" || stageId === "traditional")
        return "traditional";
      if (stageId === "modern") return "modern";
      return "field";
    };
    let activeEnvironment: FarmEnvironment | undefined;
    const applyEnvironment = (stageId: PloughingStageId) => {
      const environment = environmentForStage(stageId);
      const texture = panoramas.get(environment);
      if (!texture || activeEnvironment === environment) return;
      scene.background = texture;
      scene.environment = texture;
      scene.environmentIntensity = environment === "field" ? 0.3 : 0.42;
      activeEnvironment = environment;
    };
    const textureLoader = new THREE.TextureLoader();
    const environmentSources: Readonly<Record<FarmEnvironment, string>> = {
      field: "/images/ploughing-soil-preparation/farm-panorama.png",
      traditional:
        "/images/ploughing-soil-preparation/traditional-ploughing-v2.jpg",
      modern: "/images/ploughing-soil-preparation/modern-cultivator-v2.jpg",
    };
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
        applyEnvironment(currentPloughingStage(stateRef.current).id);
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
      const currentStage = currentPloughingStage(stateRef.current);
      const frame = world.getFrame(currentStage.id);
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
        if (ploughingCanContinue(stateRef.current))
          dispatchRef.current({ type: "next" });
        else narrate();
      },
      onBack: () => {
        void renderer.xr.getSession()?.end();
      },
      onNarrate: narrate,
      startPosition: new THREE.Vector3(0, 0, 3.1),
      movementBounds: new THREE.Box2(
        new THREE.Vector2(-3.5, -0.5),
        new THREE.Vector2(3.5, 5.5),
      ),
    });

    const hud = new THREE.Group();
    scene.add(hud);
    let promptCard = createVrCard(PLOUGHING_STAGES[0].instruction);
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
      const currentStage = currentPloughingStage(stateRef.current);
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
          if (ploughingCanContinue(stateRef.current))
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
      applyEnvironment(currentPloughingStage(current).id);
      world.update(current, delta, elapsed);
      hud.visible = renderer.xr.isPresenting;
      (nextCard.material as THREE.MeshBasicMaterial).opacity =
        ploughingCanContinue(current) ? 1 : 0.45;
      (nextCard.material as THREE.MeshBasicMaterial).transparent = true;
      if (lastStage !== current.stageIndex) {
        const nextPrompt = createVrCard(
          currentPloughingStage(current).instruction,
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
        "VR could not start. The full field investigation remains available on this screen.",
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
    stage.id === "ready" && state.quizIndex < PLOUGHING_QUIZ.length
      ? PLOUGHING_QUIZ[state.quizIndex]
      : undefined;
  const progress = state.completed
    ? 100
    : Math.round(
        ((state.stageIndex + (canContinue ? 1 : 0)) / PLOUGHING_STAGES.length) *
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
          <span aria-hidden="true">〰</span>
          <span>
            PLOUGHING LAB<small>CLASS 8 · CROP PRODUCTION</small>
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

      <section className={styles.world} aria-label="Ploughing simulation scene">
        <div
          ref={mountRef}
          className={styles.canvas}
          role="img"
          aria-label="Interactive ploughing field"
          data-ready={ready}
          data-inspected={state.inspected.join(",")}
          data-furrows={state.furrows}
          data-broken-clods={state.brokenClods}
          data-levelled={state.levelled}
          data-quiz-index={state.quizIndex}
        />
        <div className={styles.sceneTag}>
          <span>●</span> SUNDAR FIELD{" "}
          <small>Drag to orbit · scroll to zoom</small>
        </div>
        {hover && TARGET_LABELS[hover] && (
          <div className={styles.objectHint}>{TARGET_LABELS[hover]}</div>
        )}
        {!ready && !runtimeError && (
          <div className={styles.loading}>Preparing the field…</div>
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
            <span>FIELD READY</span>
            <h2>
              Soil Preparation
              <br />
              Investigator
            </h2>
            <p>Loosen · Turn · Break · Level</p>
          </div>
        )}
      </section>

      <section className={styles.panel} aria-label="Current field mission">
        {!started ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>CHAPTER 1 · ACTIVITY 1</div>
              <h1>Prepare a field before the first seed.</h1>
              <p>
                Investigate hard soil, work with two ploughing systems and
                reveal what changes underground.
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
                <p>{PLOUGHING_STAGES[0].narration}</p>
              </div>
            </div>
            <button
              className={styles.primary}
              type="button"
              disabled={!ready}
              onClick={start}
            >
              Enter the field <span>→</span>
            </button>
          </>
        ) : state.completed ? (
          <>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>INVESTIGATION COMPLETE</div>
              <h1>The field is ready for sowing.</h1>
              <p>
                Ploughing loosens and turns soil. Breaking clods and levelling
                complete its preparation.
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
                FIELD FILE {String(state.stageIndex + 1).padStart(2, "0")} ·{" "}
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
                {stage.id === "traditional" && (
                  <span data-done={state.furrows >= 3}>
                    ◫ {state.furrows}/3 furrows
                  </span>
                )}
                {stage.id === "levelling" && (
                  <>
                    <span data-done={state.brokenClods >= 3}>
                      ◆ {state.brokenClods}/3 clods
                    </span>
                    <span data-done={state.levelled}>━ levelled</span>
                  </>
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
                      : "Field evidence"}
                  </strong>
                  <p aria-live="polite">{state.feedback}</p>
                  {audioStatus === "playing" && <small>{caption}</small>}
                </div>
              </div>
              <div
                className={styles.hotspots}
                aria-label="Field interaction controls"
              >
                {STAGE_ALLOWED[stage.id].map((id) => (
                  <button
                    type="button"
                    key={id}
                    data-done={state.inspected.includes(id)}
                    disabled={
                      (id === "leveller" && state.brokenClods < 3) ||
                      (id === "finish-clod" && state.brokenClods >= 3) ||
                      (id === "plough" &&
                        stage.id === "traditional" &&
                        state.furrows >= 3)
                    }
                    onClick={() => activateTarget(id)}
                  >
                    {stage.id === "traditional" && id === "plough"
                      ? `Make furrow ${Math.min(3, state.furrows + 1)}`
                      : TARGET_LABELS[id]}
                  </button>
                ))}
              </div>
              {stage.id === "hard-soil" && (
                <Choice
                  question="Can seeds be sown directly in this hard soil?"
                  options={[
                    ["yes", "Yes"],
                    ["no", "No"],
                  ]}
                  onChoose={(value) => dispatch({ type: "answer", value })}
                />
              )}
              {stage.id === "modern" && (
                <Choice
                  question="Which method is faster for a large field?"
                  options={[
                    ["bullocks", "Bullocks + plough"],
                    ["tractor", "Tractor + cultivator"],
                  ]}
                  onChoose={(value) => dispatch({ type: "answer", value })}
                />
              )}
              {quiz && (
                <Choice
                  question={`Field check ${state.quizIndex + 1}/4 · ${quiz.question}`}
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
              {state.stageIndex === PLOUGHING_STAGES.length - 1
                ? "Finish mission"
                : "Next field file"}{" "}
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
