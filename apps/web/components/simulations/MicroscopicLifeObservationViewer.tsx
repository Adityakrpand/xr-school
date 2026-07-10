'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';

const VIDEO_SRC = '/simulations/microscopic-life-observation.mp4';

const STAGES = [
  {
    title: 'Observe',
    cue: 'Watch the live microscope field and notice the different shapes moving through the water sample.',
    action: 'Point to one moving organism and describe its shape before naming it.',
  },
  {
    title: 'Compare',
    cue: 'Some organisms are oval, some are long and flexible, and some look green because of chlorophyll.',
    action: 'Compare two organisms by shape, colour, and motion.',
  },
  {
    title: 'Explain',
    cue: 'A drop of pond water can contain many living microorganisms that are invisible without magnification.',
    action: 'Explain why a microscope changes what we can observe about living things.',
  },
  {
    title: 'Review',
    cue: 'Use evidence from the video to separate observation from guesswork.',
    action: 'Say one observation that proves the sample contains living organisms.',
  },
] as const;

const MARKERS = [
  { id: 'oval-protist', label: 'Oval protist', color: '#6ee7b7', position: [-1.35, 1.38, -2.45] },
  { id: 'green-algae', label: 'Green algae', color: '#a3e635', position: [0, 1.78, -2.45] },
  { id: 'ciliated-cell', label: 'Ciliated cell', color: '#f0abfc', position: [1.35, 1.38, -2.45] },
] as const;

function makeTextTexture(title: string, subtitle = '', accent = '#6ee7b7', width = 720, height = 260) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = 'rgba(5, 14, 24, 0.94)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = accent;
  ctx.font = '900 30px sans-serif';
  ctx.fillText('CLASS 10 BIOLOGY', 30, 50);
  ctx.fillStyle = '#f8fafc';
  ctx.font = title.length > 18 ? '900 46px sans-serif' : '900 58px sans-serif';
  ctx.fillText(title, 30, 128);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '28px sans-serif';
  ctx.fillText(subtitle, 30, 186);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLabel(text: string, accent = '#6ee7b7') {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.36),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(text, '', accent, 520, 150),
      transparent: true,
      depthTest: false,
    }),
  );
}

function makeControllerRay() {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -3.2),
  ]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.74 }),
  );
}

function makeStageButton(stage: (typeof STAGES)[number], index: number) {
  const button = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.18, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.25,
      roughness: 0.42,
    }),
  );
  button.name = `microscope-stage-${index}`;
  button.position.set(-1.35 + index * 0.9, 0.62, -1.65);
  const label = makeLabel(stage.title, '#6ee7b7');
  label.position.z = 0.034;
  label.scale.setScalar(0.56);
  button.add(label);
  return button;
}

export default function MicroscopicLifeObservationViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const stage = STAGES[stageIndex];

  const narrateStage = useCallback((index: number) => {
    const item = STAGES[index];
    void playSimulationNarration(`${item.title}. ${item.cue} ${item.action}`, index);
  }, []);

  const markerText = useMemo(
    () => MARKERS.map(marker => `${marker.label}: look for shape, colour, and movement.`),
    [],
  );

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) setVrSupported(true);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06131c);
    scene.fog = new THREE.Fog(0x06131c, 7, 18);
    const camera = new THREE.PerspectiveCamera(64, mount.clientWidth / mount.clientHeight, 0.05, 50);
    const guidedCamera = createGuidedCamera(camera, renderer.domElement);
    guidedCamera.focusOn(
      { position: new THREE.Vector3(0, 1.55, 4.4), target: new THREE.Vector3(0, 1.35, -1.8) },
      { animate: false },
    );

    scene.add(new THREE.HemisphereLight(0xdffcff, 0x10202f, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 5, 4);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6.2, 72),
      new THREE.MeshStandardMaterial({ color: 0x10202f, roughness: 0.86 }),
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const video = document.createElement('video');
    video.src = VIDEO_SRC;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    videoRef.current = video;
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const microscopeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.42, 2.58, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.52 }),
    );
    microscopeFrame.position.set(0, 1.48, -2.55);
    scene.add(microscopeFrame);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 2.25),
      new THREE.MeshBasicMaterial({ map: videoTexture }),
    );
    screen.name = 'large-microscope-video-screen';
    screen.position.set(0, 1.48, -2.49);
    scene.add(screen);

    const title = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 0.9),
      new THREE.MeshBasicMaterial({
        map: makeTextTexture('Microscopic Life', 'Observe protists in a water sample'),
        transparent: true,
      }),
    );
    title.position.set(0, 2.98, -2.55);
    scene.add(title);

    const stageButtons = STAGES.map(makeStageButton);
    stageButtons.forEach(button => scene.add(button));

    const markers = MARKERS.map(marker => {
      const color = Number.parseInt(marker.color.slice(1), 16);
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 28, 18),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          roughness: 0.3,
        }),
      );
      node.name = `microscope-marker-${marker.id}`;
      node.position.set(marker.position[0], marker.position[1], marker.position[2]);
      const label = makeLabel(marker.label, marker.color);
      label.position.y = 0.3;
      label.scale.setScalar(0.52);
      node.add(label);
      scene.add(node);
      return node;
    });

    const ctrl0 = renderer.xr.getController(0);
    const ctrl1 = renderer.xr.getController(1);
    ctrl0.add(makeControllerRay());
    ctrl1.add(makeControllerRay());
    scene.add(ctrl0, ctrl1);

    const interactionSystem = createInteractionSystem({
      camera,
      domElement: renderer.domElement,
      xrControllers: [ctrl0, ctrl1],
      onSelect: (id, object) => {
        if (id.startsWith('microscope-stage-')) {
          const next = Number(id.replace('microscope-stage-', ''));
          if (Number.isInteger(next)) {
            setStageIndex(next);
            narrateStage(next);
          }
        } else {
          const marker = MARKERS.find(item => id === `microscope-marker-${item.id}`);
          if (marker) void playSimulationNarration(`${marker.label}. ${markerText[MARKERS.indexOf(marker)]}`, 10);
        }
        interactionSystem.setSelected(id);
        guidedCamera.focusOn({ position: camera.position.clone(), target: object.position.clone() });
      },
    });

    stageButtons.forEach(button => interactionSystem.register(button.name, button, { highlightColor: '#6ee7b7' }));
    markers.forEach(marker => interactionSystem.register(marker.name, marker, { highlightColor: '#facc15' }));

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.033);
      const elapsed = clock.elapsedTime;
      if (!renderer.xr.isPresenting) guidedCamera.update(dt);
      markers.forEach((marker, index) => {
        marker.position.y += Math.sin(elapsed * 1.8 + index) * 0.0009;
        marker.rotation.y += 0.01;
      });
      title.lookAt(camera.position);
      stageButtons.forEach(button => button.lookAt(camera.position));
      markers.forEach(marker => marker.lookAt(camera.position));
      renderer.render(scene, camera);
    });

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      interactionSystem.dispose();
      guidedCamera.dispose();
      video.pause();
      videoTexture.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      videoRef.current = null;
      rendererRef.current = null;
      stopSimulationNarration();
    };
  }, [markerText, narrateStage]);

  const startExperience = async () => {
    setStarted(true);
    narrateStage(stageIndex);
    await videoRef.current?.play().catch(() => undefined);
  };

  const enterVR = async () => {
    await startExperience();
    const renderer = rendererRef.current;
    if (!renderer || !navigator.xr) return;
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor'],
    });
    await renderer.xr.setSession(session);
  };

  const setStage = (index: number) => {
    setStageIndex(index);
    narrateStage(index);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#06131c' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!started && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(6, 19, 28, 0.94)', zIndex: 10 }}>
          <div style={{ maxWidth: 760, textAlign: 'center', color: '#f8fafc' }}>
            <div style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', marginBottom: 14 }}>Class 10 Biology</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.04 }}>Microscopic Life Observation Lab</h1>
            <p style={{ color: '#cbd5e1', lineHeight: 1.65, margin: '20px auto 28px' }}>Enter a stationary microscope theatre and study live water-sample organisms through the video you provided.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={startExperience} style={buttonStyle('#6ee7b7', '#04111a')}>View in Browser</button>
              <button onClick={enterVR} disabled={!vrSupported} style={buttonStyle(vrSupported ? '#facc15' : '#475569', '#111827')}>{vrSupported ? 'Enter VR' : 'VR unavailable'}</button>
            </div>
          </div>
        </div>
      )}
      {started && (
        <section style={panelStyle}>
          <div style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Microscope lab - 8 min</div>
          <h2 style={{ margin: '6px 0 8px', fontSize: 22 }}>{stage.title}</h2>
          <p style={{ color: '#cbd5e1', lineHeight: 1.45, margin: '0 0 10px' }}>{stage.cue}</p>
          <p style={{ color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px', fontSize: 13 }}>{stage.action}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {STAGES.map((item, index) => (
              <button key={item.title} onClick={() => setStage(index)} style={smallButtonStyle(index === stageIndex ? '#6ee7b7' : '#1f2937', index === stageIndex ? '#04111a' : '#f8fafc')}>{item.title}</button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function buttonStyle(background: string, color: string) {
  return {
    border: 0,
    borderRadius: 8,
    padding: '12px 18px',
    background,
    color,
    fontWeight: 900,
    cursor: 'pointer',
  };
}

function smallButtonStyle(background: string, color: string) {
  return {
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7,
    padding: '9px 10px',
    background,
    color,
    fontWeight: 850,
    cursor: 'pointer',
    minHeight: 38,
  };
}

const panelStyle = {
  position: 'absolute',
  right: 18,
  top: 18,
  width: 'min(420px, calc(100vw - 36px))',
  borderRadius: 8,
  padding: 16,
  background: 'rgba(6, 19, 28, 0.9)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#f8fafc',
  backdropFilter: 'blur(12px)',
} as const;
