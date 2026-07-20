'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { CHEMICAL_REACTIONS, evaluateReactionAnswer } from '../../../../packages/simulation-runtime/src/models/chemicalReactionsModel';

type Phase = 'safety' | 'experiment' | 'question' | 'summary';

function labelTexture(title: string, body: string, accent = '#22d3ee') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = '#07111f'; ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.strokeRect(10, 10, 1004, 492);
  ctx.fillStyle = accent; ctx.font = 'bold 48px sans-serif'; ctx.fillText(title, 42, 72);
  ctx.fillStyle = '#f8fafc'; ctx.font = '32px sans-serif';
  const words = body.split(' '); let line = ''; let y = 132;
  for (const word of words) {
    const next = `${line}${word} `;
    if (ctx.measureText(next).width > 930 && line) { ctx.fillText(line, 42, y); line = `${word} `; y += 44; }
    else line = next;
  }
  ctx.fillText(line, 42, y);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function addBox(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], color: number, roughness = 0.55) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness, metalness: roughness < 0.4 ? 0.35 : 0 }));
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

function addBeaker(parent: THREE.Object3D, x: number, liquidColor: number) {
  const group = new THREE.Group(); group.position.set(x, 1.08, -1.7);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.58, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.28, roughness: 0.08, transmission: 0.5, side: THREE.DoubleSide }));
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.22, 0.32, 24), new THREE.MeshStandardMaterial({ color: liquidColor, transparent: true, opacity: 0.72, roughness: 0.2 }));
  liquid.position.y = -0.1; group.add(glass, liquid); parent.add(group); return { group, liquid };
}

function buildLab(scene: THREE.Scene) {
  const lab = new THREE.Group(); scene.add(lab);
  addBox(lab, [12, 0.16, 12], [0, -0.08, -1], 0x9aa7b8, 0.28);
  addBox(lab, [12, 4, 0.18], [0, 2, -6.8], 0xdce7ef);
  addBox(lab, [0.18, 4, 12], [-6, 2, -1], 0xdce7ef);
  addBox(lab, [0.18, 4, 12], [6, 2, -1], 0xdce7ef);
  // Main bench, fume hood, sink, storage, emergency equipment and ceiling panels.
  addBox(lab, [6.8, 0.18, 1.45], [0, 0.82, -1.75], 0x334155, 0.3);
  for (const x of [-2.8, -0.95, 0.95, 2.8]) addBox(lab, [0.12, 0.82, 1.2], [x, 0.4, -1.75], 0x64748b);
  addBox(lab, [3.2, 2.5, 0.55], [-3.8, 1.7, -6.35], 0x94a3b8, 0.35);
  addBox(lab, [2.1, 0.9, 0.65], [3.9, 0.45, -6.25], 0x475569);
  addBox(lab, [1.8, 2.4, 0.55], [4.5, 1.2, -6.35], 0xf8fafc);
  const shower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.4 })); shower.position.set(5.25, 2.9, -5.7); lab.add(shower);
  const extinguisher = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.72, 20), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 })); extinguisher.position.set(5.45, 0.5, -5.7); lab.add(extinguisher);
  for (let i = 0; i < 5; i++) addBox(lab, [1.35, 0.05, 0.42], [-4.2 + i * 2.1, 3.7, -1.2], 0xffffff, 0.15).material = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.65 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.6), new THREE.MeshBasicMaterial({ map: labelTexture('TODAY: CHEMICAL REACTIONS', 'Observe evidence • identify reactants and products • balance every equation', '#4ade80') })); board.position.set(0, 2.45, -6.68); lab.add(board);
  const safety = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.15), new THREE.MeshBasicMaterial({ map: labelTexture('SAFETY', 'Goggles • coat • gloves • report spills', '#facc15') })); safety.position.set(-5.88, 2.25, -3.6); safety.rotation.y = Math.PI / 2; lab.add(safety);
  return lab;
}

export default function ChemicalReactionsLabViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reactionGroupRef = useRef<THREE.Group | null>(null);
  const molecularRef = useRef<THREE.Group | null>(null);
  const reactionIndexRef = useRef(0);
  const stepRef = useRef(0);
  const [started, setStarted] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>('safety');
  const [reactionIndex, setReactionIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [molecular, setMolecular] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [completed, setCompleted] = useState<boolean[]>(() => CHEMICAL_REACTIONS.map(() => false));
  const [muted, setMuted] = useState(false);
  const reaction = CHEMICAL_REACTIONS[reactionIndex];

  useEffect(() => { reactionIndexRef.current = reactionIndex; stepRef.current = step; }, [reactionIndex, step]);
  useEffect(() => { if (molecularRef.current) molecularRef.current.visible = molecular; }, [molecular]);
  useEffect(() => { if (typeof navigator !== 'undefined' && 'xr' in navigator) setVrSupported(true); }, []);

  const narrate = useCallback((text: string, index = 0) => {
    if (!muted) void playSimulationNarration(`Chemistry teacher. ${text}`, index);
  }, [muted]);

  const start = () => {
    setStarted(true); setPhase('safety');
    narrate('Welcome to the Chemical Reactions Laboratory. Put on your goggles, gloves and lab coat. Today you will safely perform five reactions and explain their evidence.');
  };

  const nextStep = () => {
    if (phase === 'safety') { setPhase('experiment'); setStep(0); narrate(`${reaction.title}. ${reaction.safety} ${reaction.steps[0]}`, reactionIndex); return; }
    if (step < reaction.steps.length - 1) { const next = step + 1; setStep(next); narrate(reaction.steps[next], reactionIndex * 10 + next); }
    else { setPhase('question'); narrate(`${reaction.observation} ${reaction.question}`, reactionIndex * 10 + 8); }
  };

  const answer = (index: number) => {
    const result = evaluateReactionAnswer(reaction.id, index);
    setFeedback(result.correct ? `Correct. ${result.explanation}` : `Try again. Hint: inspect the observed evidence.`);
    if (!result.correct) return;
    const nextCompleted = [...completed]; nextCompleted[reactionIndex] = true; setCompleted(nextCompleted);
    if (reactionIndex === CHEMICAL_REACTIONS.length - 1) setTimeout(() => setPhase('summary'), 500);
  };

  const nextReaction = () => {
    if (!completed[reactionIndex]) return;
    const next = Math.min(reactionIndex + 1, CHEMICAL_REACTIONS.length - 1);
    setReactionIndex(next); setStep(0); setPhase('safety'); setFeedback(''); setMolecular(false);
    narrate(`${CHEMICAL_REACTIONS[next].title}. Review the safety warning before beginning.`, next * 10);
  };

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor');
    mount.appendChild(renderer.domElement); rendererRef.current = renderer;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x10202b); scene.fog = new THREE.Fog(0xb8d6e5, 11, 26);
    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.05, 60); camera.position.set(0, 1.65, 4.6); camera.lookAt(0, 1.2, -1.6);
    scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x263444, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(3, 6, 3); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
    buildLab(scene);
    const apparatus = new THREE.Group(); scene.add(apparatus); reactionGroupRef.current = apparatus;
    const molecularGroup = new THREE.Group(); molecularGroup.visible = false; scene.add(molecularGroup); molecularRef.current = molecularGroup;
    // Reusable glassware and apparatus represent the active experiment.
    addBeaker(apparatus, -0.55, 0x3b82f6); addBeaker(apparatus, 0.55, 0xe2e8f0);
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.42, 20), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.25 })); burner.position.set(-1.55, 1.06, -1.7); apparatus.add(burner);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 18), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.86 })); flame.position.set(-1.55, 1.5, -1.7); apparatus.add(flame);
    const electrodeA = addBox(apparatus, [0.05, 0.7, 0.05], [-0.18, 1.35, -1.65], 0x111827, 0.2); const electrodeB = electrodeA.clone(); electrodeB.position.x = 0.18; apparatus.add(electrodeB);
    for (let i = 0; i < 44; i++) {
      const atom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0xef4444 : i % 3 === 1 ? 0x60a5fa : 0xf8fafc, emissive: 0x172554, emissiveIntensity: 0.25 }));
      atom.position.set((Math.random() - 0.5) * 4, 0.7 + Math.random() * 2.3, -2.1 + (Math.random() - 0.5) * 1.5); atom.userData.seed = Math.random() * 10; molecularGroup.add(atom);
    }
    const ray = () => new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)]), new THREE.LineBasicMaterial({ color: 0x22d3ee }));
    for (let i = 0; i < 2; i++) { const controller = renderer.xr.getController(i); controller.add(ray()); controller.addEventListener('selectstart', nextStep); scene.add(controller); }
    let time = 0;
    renderer.setAnimationLoop(() => {
      time += 0.016;
      flame.scale.y = 0.85 + Math.sin(time * 11) * 0.15;
      const active = reactionIndexRef.current;
      apparatus.children.forEach((object, index) => { if (object instanceof THREE.Mesh && index > 4) object.rotation.y += active === 2 ? 0.003 : 0; });
      molecularGroup.children.forEach((atom, index) => { atom.position.y += Math.sin(time * 2 + atom.userData.seed) * 0.0009; atom.rotation.y += 0.01 + index * 0.0001; });
      renderer.render(scene, camera);
    });
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); stopSimulationNarration(); renderer.setAnimationLoop(null); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);

  const enterVr = async () => {
    const session = await navigator.xr?.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    if (session) await rendererRef.current?.xr.setSession(session);
  };

  const progress = Math.round(((completed.filter(Boolean).length + (phase === 'experiment' ? step / reaction.steps.length : 0)) / 5) * 100);
  return <main style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui', position: 'relative', overflow: 'hidden' }}>
    <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} aria-label="Immersive chemical reactions laboratory" />
    {!started && <section style={cardStyle}>
      <p style={{ color: '#22d3ee', fontWeight: 800 }}>CLASS 10 · QUEST 3/3S · 20–25 MIN</p>
      <h1>Chemical Reactions Laboratory</h1><p>Perform five safe experiments, inspect molecular changes, identify evidence, and master balanced equations.</p>
      <button style={buttonStyle} onClick={start}>Wear PPE & Begin</button>
    </section>}
    {started && <>
      <aside style={{ ...panelStyle, left: 18, top: 18, maxWidth: 410 }}>
        <small>EXPERIMENT {Math.min(reactionIndex + 1, 5)} OF 5 · {progress}% COMPLETE</small>
        <div style={{ height: 6, background: '#334155', margin: '8px 0 12px' }}><div style={{ width: `${progress}%`, height: '100%', background: '#22d3ee' }} /></div>
        <h2 style={{ margin: '0 0 6px' }}>{phase === 'summary' ? 'Lesson Summary' : reaction.title}</h2>
        {phase !== 'summary' && <><p><strong>{reaction.type}</strong><br />{reaction.equation}</p><p style={{ color: '#fde68a' }}>⚠ {reaction.safety}</p></>}
        {phase === 'safety' && <p>Confirm PPE: goggles, gloves, lab coat. Then begin at the marked bench.</p>}
        {phase === 'experiment' && <><p><strong>Current step:</strong> {reaction.steps[step]}</p><p>{step === reaction.steps.length - 1 ? reaction.observation : 'Use trigger/grip in VR or Continue on screen.'}</p></>}
        {phase === 'question' && <><p><strong>{reaction.question}</strong></p>{reaction.answers.map((item, index) => <button key={item} style={choiceStyle} onClick={() => answer(index)}>{item}</button>)}<p>{feedback}</p></>}
        {phase === 'summary' && <>{CHEMICAL_REACTIONS.map(item => <p key={item.id}><strong>{item.type}</strong><br />{item.equation}</p>)}<h3>🏆 Chemistry Explorer</h3><p>Five experiments completed with balanced equations and safety evidence.</p></>}
      </aside>
      <div style={{ ...panelStyle, right: 18, bottom: 18, display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 500 }}>
        {phase !== 'summary' && <button style={buttonStyle} onClick={nextStep}>{phase === 'safety' ? 'Confirm PPE & Start' : phase === 'experiment' ? 'Perform / Continue' : 'Review evidence'}</button>}
        <button style={molecular ? activeButtonStyle : secondaryButtonStyle} onClick={() => { setMolecular(value => !value); narrate(molecular ? 'Returning to laboratory scale.' : reaction.molecular); }}>Molecular Level</button>
        {phase === 'question' && completed[reactionIndex] && reactionIndex < 4 && <button style={buttonStyle} onClick={nextReaction}>Next Experiment</button>}
        {vrSupported && <button style={secondaryButtonStyle} onClick={enterVr}>Enter VR</button>}
        <button style={secondaryButtonStyle} onClick={() => setMuted(value => !value)}>{muted ? 'Audio Off' : 'Audio On'}</button>
      </div>
    </>}
  </main>;
}

const cardStyle: React.CSSProperties = { position: 'absolute', zIndex: 2, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(620px, calc(100% - 36px))', padding: 28, borderRadius: 20, background: 'rgba(2,6,23,.94)', border: '1px solid #22d3ee', boxShadow: '0 20px 60px #000a' };
const panelStyle: React.CSSProperties = { position: 'absolute', zIndex: 2, padding: 16, borderRadius: 16, background: 'rgba(2,6,23,.9)', border: '1px solid #334155', backdropFilter: 'blur(10px)' };
const buttonStyle: React.CSSProperties = { padding: '11px 15px', border: 0, borderRadius: 10, background: '#06b6d4', color: '#042f2e', fontWeight: 800, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, background: '#334155', color: '#f8fafc' };
const activeButtonStyle: React.CSSProperties = { ...buttonStyle, background: '#a78bfa', color: '#1e1b4b' };
const choiceStyle: React.CSSProperties = { ...secondaryButtonStyle, display: 'block', width: '100%', textAlign: 'left', margin: '7px 0' };
