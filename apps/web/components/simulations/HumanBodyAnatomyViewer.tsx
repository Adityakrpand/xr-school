'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { createGuidedCamera } from '@/lib/world-builder/guidedCamera';
import { createInteractionSystem } from '@/lib/world-builder/interactionSystem';

const HUMAN_BODY_VIDEO_SRC = '/simulations/human-body-anatomy.mp4';

const HUMAN_BODY_STAGES = [
  {
    title: 'Body Overview',
    button: 'Start Tour',
    narration:
      'Welcome to human body anatomy. Look around the full body view and notice that the human body is a system made of many parts working together.',
    focus:
      'Anatomy means studying the structure of the body, including organs, bones, muscles, and the positions of major body parts.',
  },
  {
    title: 'Skeleton Support',
    button: 'View Skeleton',
    narration:
      'The skeleton gives the body shape and support. Bones protect soft organs and create a strong frame that helps us stand, move, and grow.',
    focus:
      'Bones are not only hard supports. They protect the brain, heart, and lungs, and they work with joints to allow movement.',
  },
  {
    title: 'Muscles and Motion',
    button: 'Study Muscles',
    narration:
      'Muscles pull on bones to create movement. When muscles contract and relax, they help us walk, lift, bend, and keep our posture steady.',
    focus:
      'Muscles and bones work as partners. Muscles provide force, and bones provide the framework for controlled motion.',
  },
  {
    title: 'Internal Organs',
    button: 'Inspect Organs',
    narration:
      'Inside the body, organs carry out important life processes. The heart pumps blood, the lungs help us breathe, and digestive organs help process food.',
    focus:
      'Organs are specialized body parts. Each organ has a structure that matches its job inside a larger system.',
  },
  {
    title: 'Systems Together',
    button: 'Complete Tour',
    narration:
      'The human body works best when systems act together. Support, movement, breathing, circulation, and digestion all connect to keep us alive and active.',
    focus:
      'The body is not a collection of separate parts. It is an organized system in which each part supports the others.',
  },
] as const;

type AudioState = {
  context: AudioContext;
  ambientGain: GainNode;
  musicGain: GainNode;
  masterGain: GainNode;
  oscillators: OscillatorNode[];
};

function createAudioState() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.15;
  masterGain.connect(context.destination);

  const ambientGain = context.createGain();
  ambientGain.gain.value = 0.13;
  ambientGain.connect(masterGain);

  const musicGain = context.createGain();
  musicGain.gain.value = 0.05;
  musicGain.connect(masterGain);

  const roomHum = context.createOscillator();
  roomHum.type = 'sine';
  roomHum.frequency.value = 72;
  roomHum.connect(ambientGain);
  roomHum.start();

  const airyLayer = context.createOscillator();
  airyLayer.type = 'triangle';
  airyLayer.frequency.value = 164;
  airyLayer.connect(ambientGain);
  airyLayer.start();

  const musicBed = context.createOscillator();
  musicBed.type = 'sine';
  musicBed.frequency.value = 196;
  musicBed.connect(musicGain);
  musicBed.start();

  return {
    context,
    ambientGain,
    musicGain,
    masterGain,
    oscillators: [roomHum, airyLayer, musicBed],
  };
}

function playTone(audio: AudioState | null, frequency: number, duration = 0.12, type: OscillatorType = 'sine') {
  if (!audio) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  const startAt = audio.context.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.11, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(audio.masterGain);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function makeTextTexture(title: string, body: string, accent = '#fca5a5') {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(24, 24, 27, 0.95)');
  gradient.addColorStop(1, 'rgba(69, 10, 10, 0.88)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = accent;
  ctx.font = '900 28px sans-serif';
  ctx.fillText('HUMAN BODY ANATOMY', 34, 58);
  ctx.fillStyle = '#fef2f2';
  ctx.font = title.length > 18 ? '900 48px sans-serif' : '900 60px sans-serif';
  ctx.fillText(title, 34, 138);

  ctx.fillStyle = '#fee2e2';
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

function makePanel(title: string, body: string, accent = '#fca5a5') {
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
  video.src = HUMAN_BODY_VIDEO_SRC;
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
  sky.name = 'human-body-anatomy-immersive-video-sky';
  sky.rotation.y = Math.PI;
  root.add(sky);

  return { video, texture };
}

function addStageButton(root: THREE.Object3D, targets: THREE.Object3D[], stageIndex: number, label: string) {
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.08, 40),
    new THREE.MeshStandardMaterial({
      color: 0xf87171,
      emissive: 0xdc2626,
      emissiveIntensity: 0.72,
      roughness: 0.24,
    }),
  );
  button.name = `human-body-stage-button-${stageIndex}`;
  button.position.set(-1.55 + stageIndex * 0.78, 0.82, -1.35);
  button.rotation.x = Math.PI / 2;
  button.userData.stageIndex = stageIndex;

  const labelMesh = makePanel(label, '', '#fecaca');
  labelMesh.position.set(0, 0.18, 0);
  labelMesh.scale.setScalar(0.22);
  button.add(labelMesh);

  root.add(button);
  targets.push(button);
}

export default function HumanBodyAnatomyViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const goToStageRef = useRef<(index: number) => void>(() => undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<AudioState | null>(null);
  const stageIndexRef = useRef(0);
  const mutedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [muted, setMuted] = useState(false);

  const stage = HUMAN_BODY_STAGES[stageIndex];
  const progress = useMemo(() => `${stageIndex + 1}/${HUMAN_BODY_STAGES.length}`, [stageIndex]);

  const speak = useCallback((text: string, cueIndex = stageIndexRef.current) => {
    if (mutedRef.current) return;
    void playSimulationNarration(`Teacher guidance. ${text}`, cueIndex);
  }, []);

  const ensureAudioReady = useCallback(async () => {
    if (!audioRef.current) audioRef.current = createAudioState();
    await audioRef.current?.context.resume().catch(() => undefined);
    return audioRef.current;
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
    renderer.toneMappingExposure = 1.06;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f0a0a);
    const worldRoot = new THREE.Group();
    worldRoot.name = 'free-movable-human-body-anatomy-world';
    scene.add(worldRoot);

    const videoSky = addVideoSky(worldRoot);
    videoRef.current = videoSky.video;

    const panel = makePanel(HUMAN_BODY_STAGES[0].title, HUMAN_BODY_STAGES[0].focus, '#fca5a5');
    panel.name = 'human-body-anatomy-teacher-explanation-panel';
    panel.position.set(0, 2.05, -2.7);
    worldRoot.add(panel);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 0.08, 96),
      new THREE.MeshStandardMaterial({ color: 0x3f1d1d, emissive: 0x7f1d1d, emissiveIntensity: 0.28, roughness: 0.34 }),
    );
    platform.name = 'low-anatomy-observation-platform';
    platform.position.set(0, 0.56, -1.45);
    worldRoot.add(platform);

    const ringGeometry = new THREE.TorusGeometry(1.6, 0.03, 18, 84);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xfca5a5,
      emissive: 0xdc2626,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.18,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.78, -1.45);
    worldRoot.add(ring);

    const targets: THREE.Object3D[] = [];
    HUMAN_BODY_STAGES.forEach((item, index) => addStageButton(worldRoot, targets, index, item.button));

    scene.add(new THREE.HemisphereLight(0xffede8, 0x200909, 1.35));
    const glow = new THREE.PointLight(0xf87171, 3.2, 12);
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
      new THREE.LineBasicMaterial({ color: 0xfecaca, transparent: true, opacity: 0.86 }),
    );
    controller0.add(makeRay());
    controller1.add(makeRay());
    scene.add(controller0, controller1);

    const goToStage = (requestedIndex: number) => {
      const nextIndex = Math.min(Math.max(requestedIndex, 0), HUMAN_BODY_STAGES.length - 1);
      const nextStage = HUMAN_BODY_STAGES[nextIndex];
      stageIndexRef.current = nextIndex;
      setStageIndex(nextIndex);
      panel.material.map?.dispose();
      panel.material.map = makeTextTexture(nextStage.title, nextStage.focus, '#fca5a5');
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
    targets.forEach(target => interactionSystem.register(target.name, target, { highlightColor: '#fff1f2' }));

    const clock = new THREE.Clock();
    const moveDirection = new THREE.Vector3();
    const strafeDirection = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    let elapsed = 0;
    let lastNavAt = 0;
    renderer.xr.addEventListener('sessionstart', () => {
      void ensureAudioReady().then(audio => {
        playTone(audio, 430, 0.12, 'triangle');
        speak(HUMAN_BODY_STAGES[stageIndexRef.current].narration, stageIndexRef.current);
      });
    });

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
      ring.rotation.z = elapsed * 0.16;
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
      audioRef.current?.oscillators.forEach(oscillator => oscillator.stop());
      audioRef.current?.context.close().catch(() => undefined);
      audioRef.current = null;
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      stopSimulationNarration();
    };
  }, [ensureAudioReady, speak]);

  const begin = useCallback(() => {
    setStarted(true);
    void videoRef.current?.play().catch(() => undefined);
    void ensureAudioReady().then(audio => {
      playTone(audio, 390, 0.1, 'triangle');
    });
    speak(HUMAN_BODY_STAGES[0].narration, 0);
  }, [ensureAudioReady, speak]);

  const enterVR = useCallback(async () => {
    if (!rendererRef.current) return;
    setStarted(true);
    void videoRef.current?.play().catch(() => undefined);
    const audio = await ensureAudioReady();
    playTone(audio, 460, 0.12, 'triangle');
    try {
      const session = await (navigator as Navigator & { xr?: XRSystem }).xr?.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['bounded-floor', 'hand-tracking'],
      });
      if (session) await rendererRef.current.xr.setSession(session);
    } catch {
      speak('VR could not start, so the browser anatomy tour is ready.', 0);
    }
    speak(HUMAN_BODY_STAGES[stageIndex].narration, stageIndex);
  }, [ensureAudioReady, speak, stageIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#1f0a0a', color: '#fff7f7', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!started && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 50% 35%, rgba(248,113,113,.22), rgba(31,10,10,.96) 72%)', textAlign: 'center' }}>
          <section style={{ width: 'min(820px, 100%)' }}>
            <div style={{ color: '#fca5a5', fontWeight: 900, letterSpacing: '.14em', fontSize: 13 }}>BIOLOGY - IMMERSIVE VIDEO TOUR</div>
            <h1 style={{ margin: '14px 0 12px', fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 0.96 }}>Human Body Anatomy</h1>
            <p style={{ margin: '0 auto 22px', maxWidth: 700, color: '#fee2e2', fontSize: 18, lineHeight: 1.6 }}>
              A separate anatomy-focused VR experience using your new body video, teacher narration, and free Quest movement.
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
          <div style={panelStyle}><strong>Anatomy Tour {progress}</strong><span style={{ color: '#fca5a5', marginLeft: 10 }}>{stage.title}</span></div>
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
  border: '1px solid #fecaca',
  background: 'linear-gradient(135deg,#dc2626,#f97316,#fb7185)',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  padding: '14px 22px',
  borderRadius: 14,
  border: '1px solid rgba(254,202,202,.5)',
  background: 'rgba(255,255,255,.1)',
  color: '#fee2e2',
  fontWeight: 900,
  cursor: 'pointer',
} as const;

const panelStyle = {
  padding: '10px 14px',
  borderRadius: 13,
  background: 'rgba(24, 24, 27, .82)',
  border: '1px solid rgba(254,202,202,.28)',
  color: '#fff7f7',
  backdropFilter: 'blur(12px)',
} as const;

const utilityButtonStyle = {
  padding: '9px 11px',
  borderRadius: 10,
  border: '1px solid rgba(254,202,202,.28)',
  background: 'rgba(24, 24, 27, .82)',
  color: '#fee2e2',
  fontWeight: 800,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
} as const;
