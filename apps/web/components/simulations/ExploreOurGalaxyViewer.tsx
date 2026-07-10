'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';
import {
  playSimulationNarration,
  stopSimulationNarration,
} from '@/lib/simulationAudio';

const GALAXY_VIDEO_SRC = '/simulations/explore-our-galaxy.mp4';

const GALAXY_STAGES = [
  {
    title: 'Enter Deep Space',
    button: 'Begin Tour',
    narration:
      'Welcome, explorers. We are leaving the familiar Solar System view and entering a wider galaxy tour. Look around slowly and observe the stars, glowing gas clouds, and distant space objects.',
    focus: 'Deep space is not empty. It contains stars, dust, gas, planets, and many objects spread across huge distances.',
  },
  {
    title: 'Stars and the Sun',
    button: 'Study Stars',
    narration:
      'The bright star you see is like our Sun. Stars are huge balls of hot gas. They produce light and heat through nuclear fusion in their cores.',
    focus: 'A star is not a planet. It shines with its own light, while planets reflect light from stars.',
  },
  {
    title: 'Planets in Space',
    button: 'Observe Planets',
    narration:
      'Planets move around stars because of gravity. Earth is one planet in one solar system, and many other stars may also have planets around them.',
    focus: 'Gravity keeps planets in orbit and helps organize systems in space.',
  },
  {
    title: 'Outer Worlds',
    button: 'Explore Farther',
    narration:
      'As we travel outward, we see giant planets, rings, moons, and distant icy worlds. These objects help us understand how large and varied space can be.',
    focus: 'The farther we go, the more we notice scale. Distances in space are much larger than everyday distances on Earth.',
  },
  {
    title: 'Our Galaxy',
    button: 'Complete Tour',
    narration:
      'Our Solar System is only a tiny part of the Milky Way galaxy. A galaxy contains billions of stars, along with dust, gas, planets, and dark regions of space.',
    focus: 'The Milky Way is our home galaxy. Keep looking up, because every bright point may have its own story.',
  },
] as const;

function makeTextTexture(title: string, body: string, accent = '#93c5fd') {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(2,6,23,.94)');
  gradient.addColorStop(1, 'rgba(15,23,42,.84)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = accent;
  ctx.font = '900 28px sans-serif';
  ctx.fillText('EXPLORE OUR GALAXY', 34, 58);
  ctx.fillStyle = '#f8fafc';
  ctx.font = title.length > 18 ? '900 48px sans-serif' : '900 62px sans-serif';
  ctx.fillText(title, 34, 138);

  ctx.fillStyle = '#dbeafe';
  ctx.font = '28px sans-serif';
  const words = body.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = `${line} ${word}`.trim();
    if (ctx.measureText(next).width > 810 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);
  lines.slice(0, 4).forEach((item, index) => ctx.fillText(item, 34, 206 + index * 38));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePanel(title: string, body: string, accent = '#93c5fd') {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.04),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(title, body, accent),
      transparent: true,
      depthTest: false,
    }),
  );
}

function addVideoSky(root: THREE.Object3D) {
  const video = document.createElement('video');
  video.src = GALAXY_VIDEO_SRC;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.repeat.set(1, 0.5);
  texture.offset.set(0, 0.5);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(45, 96, 48),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  sky.name = 'explore-our-galaxy-immersive-video-space-sky';
  sky.rotation.y = Math.PI;
  root.add(sky);

  return { video, texture };
}

function addStarField(root: THREE.Object3D) {
  const count = 2200;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 16 + Math.random() * 28;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
    new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.04, transparent: true, opacity: 0.85 }),
  );
  stars.name = 'galaxy-tour-procedural-star-field';
  root.add(stars);
  return stars;
}

function addStageButton(root: THREE.Object3D, targets: THREE.Object3D[], stageIndex: number, label: string) {
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.08, 40),
    new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x2563eb,
      emissiveIntensity: 0.75,
      roughness: 0.22,
    }),
  );
  button.name = `galaxy-stage-button-${stageIndex}`;
  button.position.set(-1.55 + stageIndex * 0.78, 0.82, -1.35);
  button.rotation.x = Math.PI / 2;
  button.userData.stageIndex = stageIndex;

  const labelMesh = makePanel(label, '', '#bfdbfe');
  labelMesh.position.set(0, 0.18, 0);
  labelMesh.scale.setScalar(0.22);
  button.add(labelMesh);

  root.add(button);
  targets.push(button);
}

export default function ExploreOurGalaxyViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const goToStageRef = useRef<(index: number) => void>(() => undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageIndexRef = useRef(0);
  const mutedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [muted, setMuted] = useState(false);

  const stage = GALAXY_STAGES[stageIndex];
  const progress = useMemo(() => `${stageIndex + 1}/${GALAXY_STAGES.length}`, [stageIndex]);

  const speak = useCallback((text: string, cueIndex = stageIndexRef.current) => {
    if (mutedRef.current) return;
    void playSimulationNarration(`Teacher guidance. ${text}`, cueIndex);
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) setVrSupported(true);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    const worldRoot = new THREE.Group();
    worldRoot.name = 'free-movable-explore-our-galaxy-world';
    scene.add(worldRoot);

    const videoSky = addVideoSky(worldRoot);
    videoRef.current = videoSky.video;
    const stars = addStarField(worldRoot);

    const panel = makePanel(GALAXY_STAGES[0].title, GALAXY_STAGES[0].focus, '#93c5fd');
    panel.name = 'explore-our-galaxy-teacher-explanation-panel';
    panel.position.set(0, 2.05, -2.7);
    worldRoot.add(panel);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 0.08, 96),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x172554, emissiveIntensity: 0.3, roughness: 0.34 }),
    );
    table.name = 'low-space-observation-platform-kept-below-camera-view';
    table.position.set(0, 0.56, -1.45);
    worldRoot.add(table);

    const targets: THREE.Object3D[] = [];
    GALAXY_STAGES.forEach((item, index) => addStageButton(worldRoot, targets, index, item.button));

    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x020617, 1.4));
    const glow = new THREE.PointLight(0x60a5fa, 3.2, 12);
    glow.position.set(-2, 2.4, -1.2);
    scene.add(glow);

    const camera = new THREE.PerspectiveCamera(66, mount.clientWidth / mount.clientHeight, 0.05, 90);
    const guidedCamera = createGuidedCamera(camera, renderer.domElement);
    guidedCamera.focusOn({
      position: new THREE.Vector3(0, 1.55, 4.7),
      target: new THREE.Vector3(0, 1.55, -2.3),
    }, { animate: false });

    const controller0 = renderer.xr.getController(0);
    const controller1 = renderer.xr.getController(1);
    const makeRay = () => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -4)]),
      new THREE.LineBasicMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.86 }),
    );
    controller0.add(makeRay());
    controller1.add(makeRay());
    scene.add(controller0, controller1);

    const goToStage = (requestedIndex: number) => {
      const nextIndex = Math.min(Math.max(requestedIndex, 0), GALAXY_STAGES.length - 1);
      const nextStage = GALAXY_STAGES[nextIndex];
      stageIndexRef.current = nextIndex;
      setStageIndex(nextIndex);
      panel.material.map?.dispose();
      panel.material.map = makeTextTexture(nextStage.title, nextStage.focus, '#93c5fd');
      panel.material.needsUpdate = true;
      speak(nextStage.narration, nextIndex);
    };
    goToStageRef.current = goToStage;

    const interactionSystem = createInteractionSystem({
      camera,
      domElement: renderer.domElement,
      xrControllers: [controller0, controller1],
      onSelect: (id, object) => {
        const nextIndex = object.userData.stageIndex as number | undefined;
        if (typeof nextIndex === 'number') goToStageRef.current(nextIndex);
        interactionSystem.setSelected(id);
      },
    });
    targets.forEach(target => interactionSystem.register(target.name, target, { highlightColor: '#f8fafc' }));

    const clock = new THREE.Clock();
    const moveDirection = new THREE.Vector3();
    const strafeDirection = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    let elapsed = 0;
    let lastNavAt = 0;
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      elapsed += delta;
      if (!renderer.xr.isPresenting) guidedCamera.update(delta);
      else {
        for (const source of renderer.xr.getSession()?.inputSources ?? []) {
          const gamepad = source.gamepad;
          if (!gamepad) continue;
          const horizontal = gamepad.axes[2] ?? gamepad.axes[0] ?? 0;
          const vertical = gamepad.axes[3] ?? gamepad.axes[1] ?? 0;
          if (source.handedness === 'right' && Math.abs(horizontal) > 0.16) {
            worldRoot.rotation.y -= horizontal * delta * 1.35;
          }
          if (source.handedness === 'left') {
            camera.getWorldDirection(moveDirection);
            moveDirection.y = 0;
            moveDirection.normalize();
            strafeDirection.crossVectors(moveDirection, worldUp).normalize();
            if (Math.abs(vertical) > 0.16) worldRoot.position.addScaledVector(moveDirection, vertical * delta * 1.15);
            if (Math.abs(horizontal) > 0.16) worldRoot.position.addScaledVector(strafeDirection, horizontal * delta * 1.15);
          }
          const buttons = gamepad.buttons;
          const previousPressed =
            (source.handedness === 'right' && buttons[1]?.pressed) ||
            (source.handedness === 'left' && buttons[3]?.pressed);
          if (previousPressed && elapsed - lastNavAt > 0.45) {
            lastNavAt = elapsed;
            goToStageRef.current(stageIndexRef.current - 1);
          }
        }
      }
      stars.rotation.y = elapsed * 0.012;
      worldRoot.rotation.x = Math.sin(elapsed * 0.07) * 0.01;
      renderer.render(scene, camera);
    });

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      videoSky.video.pause();
      videoRef.current = null;
      interactionSystem.dispose();
      guidedCamera.dispose();
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.filter(Boolean).forEach(item => {
          const material = item as THREE.Material & { map?: THREE.Texture };
          material.map?.dispose();
          material.dispose();
        });
      });
      videoSky.texture.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      stopSimulationNarration();
    };
  }, [speak]);

  const begin = useCallback(() => {
    setStarted(true);
    void videoRef.current?.play().catch(() => undefined);
    speak(GALAXY_STAGES[0].narration, 0);
  }, [speak]);

  const enterVR = useCallback(async () => {
    if (!rendererRef.current) return;
    setStarted(true);
    void videoRef.current?.play().catch(() => undefined);
    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['bounded-floor', 'hand-tracking'],
      });
      await rendererRef.current.xr.setSession(session);
    } catch {
      speak('VR could not start, so the browser galaxy tour is ready.', 0);
    }
    speak(GALAXY_STAGES[stageIndex].narration, stageIndex);
  }, [speak, stageIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020617', color: '#f8fafc', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!started && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 50% 35%, rgba(59,130,246,.2), rgba(2,6,23,.96) 72%)', textAlign: 'center' }}>
          <section style={{ width: 'min(820px, 100%)' }}>
            <div style={{ color: '#93c5fd', fontWeight: 900, letterSpacing: '.14em', fontSize: 13 }}>SPACE SCIENCE - IMMERSIVE VIDEO TOUR</div>
            <h1 style={{ margin: '14px 0 12px', fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 0.96 }}>Explore Our Galaxy</h1>
            <p style={{ margin: '0 auto 22px', maxWidth: 700, color: '#dbeafe', fontSize: 18, lineHeight: 1.6 }}>
              A separate galaxy-focused VR experience using the new space video, teacher narration, and free Quest movement.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={begin} style={primaryButtonStyle}>Begin Tour</button>
              {vrSupported && <button type="button" onClick={enterVR} style={secondaryButtonStyle}>Enter VR</button>}
            </div>
          </section>
        </div>
      )}
      {started && (
        <header style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 8, display: 'flex', justifyContent: 'space-between', gap: 12, pointerEvents: 'none' }}>
          <div style={panelStyle}><strong>Galaxy Tour {progress}</strong><span style={{ color: '#93c5fd', marginLeft: 10 }}>{stage.title}</span></div>
          <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
            <button type="button" onClick={() => setMuted(value => { if (!value) stopSimulationNarration(); return !value; })} style={utilityButtonStyle}>{muted ? 'Voice off' : 'Voice on'}</button>
            <button type="button" onClick={() => goToStageRef.current(stageIndex - 1)} style={utilityButtonStyle}>Back</button>
            <button type="button" onClick={() => goToStageRef.current(stageIndex + 1)} style={utilityButtonStyle}>Next</button>
          </div>
        </header>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid #93c5fd',
  background: 'linear-gradient(135deg,#2563eb,#7c3aed,#db2777)',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid rgba(191,219,254,.5)',
  background: 'rgba(255,255,255,.1)',
  color: '#dbeafe',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const panelStyle = {
  padding: '10px 14px',
  borderRadius: 13,
  background: 'rgba(2,6,23,.82)',
  border: '1px solid rgba(191,219,254,.28)',
  color: '#f8fafc',
  backdropFilter: 'blur(12px)',
} as const;

const utilityButtonStyle = {
  padding: '9px 11px',
  borderRadius: 10,
  border: '1px solid rgba(191,219,254,.28)',
  background: 'rgba(2,6,23,.82)',
  color: '#dbeafe',
  fontWeight: 800,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
} as const;
