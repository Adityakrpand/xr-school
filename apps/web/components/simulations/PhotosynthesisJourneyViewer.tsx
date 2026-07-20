'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { evaluatePhotosynthesis, evaluatePhotosynthesisQuiz, PHOTOSYNTHESIS_QUIZ, PHOTOSYNTHESIS_STAGES, type PhotosynthesisInput } from '../../../../packages/simulation-runtime/src/models/photosynthesisJourneyModel';

const xrStore = createXRStore({ hand: true, controller: true });

function Tree({ giant = false }: { giant?: boolean }) {
  const scale = giant ? 2.8 : 1;
  return <group position={[0, 0, -5]} scale={scale}>
    <mesh castShadow position-y={1.5}><cylinderGeometry args={[0.38, 0.62, 3, 14]} /><meshStandardMaterial color="#68452c" roughness={0.95} /></mesh>
    {[[-1, 3.1, 0], [0.9, 3.3, 0], [0, 4, 0], [-0.5, 3.5, 0.7]].map((p, i) => <mesh key={i} castShadow position={p as [number, number, number]}><sphereGeometry args={[1.35, 14, 11]} /><meshStandardMaterial color={i % 2 ? '#3f8b45' : '#2f7c3b'} roughness={0.82} emissive="#12391d" emissiveIntensity={0.08} /></mesh>)}</group>;
}

function ButterflyGuide() {
  const root = useRef<THREE.Group>(null); const left = useRef<THREE.Mesh>(null); const right = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { const t = clock.elapsedTime; if (root.current) root.current.position.set(1.2 + Math.sin(t * 0.8) * 0.7, 1.65 + Math.sin(t * 2) * 0.15, -2.1 + Math.cos(t * 0.8) * 0.3); if (left.current) left.current.rotation.y = Math.sin(t * 12) * 0.7; if (right.current) right.current.rotation.y = -Math.sin(t * 12) * 0.7; });
  return <group ref={root}><mesh><capsuleGeometry args={[0.045, 0.24, 6, 8]} /><meshStandardMaterial color="#422006" /></mesh><mesh ref={left} position={[-0.13, 0.05, 0]} rotation-z={0.3}><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color="#f59e0b" emissive="#facc15" emissiveIntensity={0.3} /></mesh><mesh ref={right} position={[0.13, 0.05, 0]} rotation-z={-0.3}><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color="#fb7185" emissive="#facc15" emissiveIntensity={0.3} /></mesh></group>;
}

function Meadow({ ending, giant }: { ending: boolean; giant: boolean }) {
  return <>
    <Sky sunPosition={ending ? [-6, 2, -8] : [6, 6, 2]} turbidity={7} rayleigh={2.4} />
    <fog attach="fog" args={[ending ? '#d98a66' : '#cce8d5', 16, 55]} />
    <hemisphereLight intensity={1.5} color="#fff5d6" groundColor="#355c37" /><directionalLight castShadow intensity={2.2} color={ending ? '#ffab76' : '#ffe6a7'} position={[7, 10, 5]} shadow-mapSize={[1024, 1024]} />
    <mesh receiveShadow rotation-x={-Math.PI / 2}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#65a944" roughness={1} /></mesh>
    <mesh position={[9, -0.12, -10]} rotation-x={-Math.PI / 2}><planeGeometry args={[6, 50]} /><meshPhysicalMaterial color="#48aaca" roughness={0.2} transparent opacity={0.8} /></mesh>
    <Tree giant={giant} />
    {Array.from({ length: 26 }, (_, i) => <group key={i} position={[((i * 7) % 21) - 10, 0, -2 - ((i * 5) % 24)]}><mesh position-y={0.2}><cylinderGeometry args={[0.025, 0.035, 0.4, 6]} /><meshStandardMaterial color="#28743b" /></mesh><mesh position-y={0.48}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color={i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#facc15' : '#a78bfa'} /></mesh></group>)}
    <ButterflyGuide />
  </>;
}

function Underground() {
  return <group>
    <color attach="background" args={['#2c1d17']} /><ambientLight intensity={1.1} /><pointLight color="#60a5fa" intensity={3} position={[0, 2, -3]} />
    <mesh position={[0, 1.2, -5]}><boxGeometry args={[12, 5, 8]} /><meshStandardMaterial color="#513628" side={THREE.BackSide} roughness={1} /></mesh>
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i) * 2.2, 1.1 - i * 0.12, -3.5 - Math.cos(i) * 0.7]} rotation-z={Math.sin(i) * 0.7}><cylinderGeometry args={[0.03, 0.12, 2.7, 8]} /><meshStandardMaterial color="#c2a36f" /></mesh>)}
  </group>;
}

function StemTunnel() {
  return <group rotation-z={Math.PI / 2} position={[0, 1.5, -4]}>{[-0.65, 0, 0.65].map(y => <mesh key={y} position-y={y}><cylinderGeometry args={[0.35, 0.35, 8, 18, 1, true]} /><meshPhysicalMaterial color="#86efac" transparent opacity={0.35} transmission={0.4} side={THREE.DoubleSide} /></mesh>)}</group>;
}

function LeafWorld({ cell }: { cell: boolean }) {
  return <group position={[0, 1.3, -4]} scale={cell ? 1.65 : 1}>
    <mesh rotation-x={-0.25}><sphereGeometry args={[2.5, 32, 6]} /><meshPhysicalMaterial color="#22c55e" transparent opacity={0.62} transmission={0.25} roughness={0.35} /></mesh>
    {Array.from({ length: cell ? 12 : 5 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2) * 1.5, Math.cos(i * 1.5) * 0.7, 0.3]}><sphereGeometry args={[cell ? 0.38 : 0.18, 14, 10]} /><meshStandardMaterial color="#16a34a" emissive="#4ade80" emissiveIntensity={0.45} /></mesh>)}
    <mesh scale={[0.3, 0.08, 0.3]} position={[0, -1, 0.6]}><torusGeometry args={[0.8, 0.22, 10, 24]} /><meshStandardMaterial color="#14532d" /></mesh>
  </group>;
}

function Particles({ stageIndex, selected }: { stageIndex: number; selected: PhotosynthesisInput[] }) {
  const root = useRef<THREE.Group>(null); const count = 42;
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({ seed: i * 0.73, color: i % 3 === 0 ? '#60a5fa' : i % 3 === 1 ? '#94a3b8' : '#facc15' })), []);
  useFrame(({ clock }) => { if (!root.current) return; const t = clock.elapsedTime; root.current.children.forEach((object, i) => { const seed = data[i].seed; const upward = stageIndex === 2 || stageIndex === 3 || stageIndex === 9; object.position.set(Math.sin(seed * 2 + t * 0.55) * 2.1, 0.35 + ((seed + t * (upward ? 0.55 : 0.18)) % 3), -3.8 + Math.cos(seed + t * 0.4) * 1.2); }); });
  const active = stageIndex >= 2 && stageIndex <= 10 || selected.length > 0;
  return <group ref={root} visible={active}>{data.map((item, i) => <mesh key={i}><sphereGeometry args={[0.055 + (i % 3) * 0.015, 8, 6]} /><meshBasicMaterial color={item.color} transparent opacity={0.85} /></mesh>)}</group>;
}

function VrButton({ label, position, color, onSelect }: { label: string; position: [number, number, number]; color: string; onSelect: () => void }) {
  const map = useMemo(() => { const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 150; const ctx = canvas.getContext('2d'); if (ctx) { ctx.fillStyle = '#062b20'; ctx.fillRect(0, 0, 512, 150); ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.strokeRect(5, 5, 502, 140); ctx.fillStyle = '#fff'; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 256, 75); } const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture; }, [label, color]);
  return <mesh position={position} onClick={event => { event.stopPropagation(); onSelect(); }}><boxGeometry args={[1.2, 0.34, 0.07]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} /><mesh position-z={0.041}><planeGeometry args={[1.12, 0.28]} /><meshBasicMaterial map={map} /></mesh></mesh>;
}

function World({ stageIndex, selected, onContinue, onInput, onAnswer }: { stageIndex: number; selected: PhotosynthesisInput[]; onContinue: () => void; onInput: (input: PhotosynthesisInput) => void; onAnswer: (index: number) => void }) {
  const stage = PHOTOSYNTHESIS_STAGES[stageIndex]; const underground = stage.id === 'roots'; const stem = stage.id === 'stem'; const leaf = ['leaf', 'carbon-dioxide', 'sunlight', 'cell', 'glucose', 'oxygen', 'activity', 'quiz'].includes(stage.id); const giant = stage.id === 'shrink';
  return <>{underground ? <Underground /> : <Meadow ending={stage.id === 'ending'} giant={giant} />}{stem && <StemTunnel />}{leaf && <LeafWorld cell={['cell', 'glucose'].includes(stage.id)} />}<Particles stageIndex={stageIndex} selected={selected} />
    <group position={[0, 0.8, -2.15]}>{stage.id === 'activity' && <>{(['sunlight', 'water', 'carbon-dioxide'] as const).map((input, i) => <VrButton key={input} label={input === 'carbon-dioxide' ? 'CO2' : input.toUpperCase()} position={[(i - 1) * 1.3, 0, 0]} color={selected.includes(input) ? '#22c55e' : '#2563eb'} onSelect={() => onInput(input)} />)}</>}{stage.id === 'quiz' && [0, 1, 2, 3].map((answer, i) => <VrButton key={answer} label={`${String.fromCharCode(65 + i)}`} position={[(i - 1.5) * 1.1, 0, 0]} color="#7c3aed" onSelect={() => onAnswer(answer)} />)}{!['activity', 'quiz', 'ending'].includes(stage.id) && <VrButton label="CONTINUE" position={[0, 0, 0]} color="#d97706" onSelect={onContinue} />}</group>
    <OrbitControls enablePan={false} minDistance={2.2} maxDistance={8} maxPolarAngle={Math.PI / 2.05} target={[0, 1.3, -4]} /></>;
}

export default function PhotosynthesisJourneyViewer() {
  const [started, setStarted] = useState(false); const [stageIndex, setStageIndex] = useState(0); const [selected, setSelected] = useState<PhotosynthesisInput[]>([]); const [feedback, setFeedback] = useState(''); const [quizIndex, setQuizIndex] = useState(0); const [score, setScore] = useState(0); const [muted, setMuted] = useState(false);
  const stage = PHOTOSYNTHESIS_STAGES[stageIndex];
  const speak = useCallback((text: string, cue: number) => { if (!muted) void playSimulationNarration(`Butterfly nature guide. ${text}`, cue); }, [muted]);
  const begin = () => { setStarted(true); speak(stage.narration, 0); };
  const continueJourney = () => { const next = Math.min(stageIndex + 1, PHOTOSYNTHESIS_STAGES.length - 1); setStageIndex(next); setFeedback(''); speak(PHOTOSYNTHESIS_STAGES[next].narration, next); };
  const addInput = (input: PhotosynthesisInput) => { const next = selected.includes(input) ? selected : [...selected, input]; setSelected(next); const result = evaluatePhotosynthesis(next); if (result.complete) { setFeedback('Success! Glucose plant food and oxygen are being made.'); speak('Excellent! Sunlight, water and carbon dioxide are together. The leaf makes glucose and releases oxygen.', 40); setTimeout(continueJourney, 900); } else setFeedback(`Good. Still needed: ${result.missing.join(' and ')}.`); };
  const answer = (index: number) => { const correct = evaluatePhotosynthesisQuiz(quizIndex, index); setFeedback(correct ? 'Correct—your plant science is growing!' : 'Try again. Remember the journey through the plant.'); if (!correct) return; setScore(value => value + 1); if (quizIndex < PHOTOSYNTHESIS_QUIZ.length - 1) setTimeout(() => { setQuizIndex(value => value + 1); setFeedback(''); }, 450); else setTimeout(continueJourney, 700); };
  const progress = Math.round(((stageIndex + 1) / PHOTOSYNTHESIS_STAGES.length) * 100);
  return <main style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: '#15361f', color: '#f8fafc', fontFamily: 'system-ui' }}>
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.65, 5], fov: 68 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; }}><XR store={xrStore}><World stageIndex={stageIndex} selected={selected} onContinue={continueJourney} onInput={addInput} onAnswer={answer} /></XR></Canvas>
    {!started ? <section style={introStyle}><p style={{ color: '#facc15', fontWeight: 800 }}>CLASS 5 · META QUEST 3/3S · 10–12 MIN</p><h1>Photosynthesis: How Plants Make Food</h1><p>Shrink to insect size, travel from roots to leaves, and discover how sunlight, water and carbon dioxide help plants make glucose and oxygen.</p><button style={primaryStyle} onClick={begin}>Follow the Butterfly</button></section> : <><aside style={panelStyle}><small>PLANT JOURNEY · {progress}%</small><div style={{ height: 5, background: '#365847', margin: '8px 0 12px' }}><div style={{ width: `${progress}%`, height: '100%', background: '#facc15' }} /></div><h2>{stage.title}</h2><p>{stage.narration}</p><p style={{ color: '#bbf7d0' }}><strong>Discovery:</strong> {stage.concept}</p>
      {stage.id === 'activity' && <><h3>Send all three inputs to the leaf</h3>{(['sunlight', 'water', 'carbon-dioxide'] as const).map(input => <button key={input} style={selected.includes(input) ? successStyle : choiceStyle} onClick={() => addInput(input)}>{input === 'carbon-dioxide' ? '☁ Carbon Dioxide' : input === 'sunlight' ? '☀ Sunlight' : '💧 Water'}</button>)}<p>{feedback}</p></>}
      {stage.id === 'quiz' && <><small>QUESTION {quizIndex + 1}/{PHOTOSYNTHESIS_QUIZ.length}</small><h3>{PHOTOSYNTHESIS_QUIZ[quizIndex].question}</h3>{PHOTOSYNTHESIS_QUIZ[quizIndex].answers.map((item, i) => <button key={item} style={choiceStyle} onClick={() => answer(i)}>{item}</button>)}<p>{feedback}</p></>}
      {stage.id === 'ending' && <><h3>Today We Learned</h3><p>✅ Roots absorb water<br />✅ Leaves take in carbon dioxide<br />✅ Chlorophyll captures sunlight<br />✅ Plants make glucose<br />✅ Oxygen is released<br />✅ Photosynthesis keeps Earth alive</p><p>🏆 Plant Explorer · Quiz {score}/{PHOTOSYNTHESIS_QUIZ.length}</p></>}
    </aside><nav style={controlsStyle}>{!['activity', 'quiz', 'ending'].includes(stage.id) && <button style={primaryStyle} onClick={continueJourney}>Continue Journey</button>}<button style={secondaryStyle} onClick={() => xrStore.enterVR()}>Enter VR</button><button style={secondaryStyle} onClick={() => { setMuted(value => !value); if (!muted) stopSimulationNarration(); }}>{muted ? 'Audio Off' : 'Audio On'}</button></nav></>}
  </main>;
}

const introStyle: React.CSSProperties = { position: 'absolute', zIndex: 3, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(650px,calc(100% - 32px))', padding: 28, borderRadius: 20, background: 'rgba(6,43,32,.94)', border: '1px solid #facc15', boxShadow: '0 20px 70px #000b' };
const panelStyle: React.CSSProperties = { position: 'absolute', zIndex: 3, left: 18, top: 18, width: 'min(420px,calc(100% - 36px))', maxHeight: 'calc(100vh - 135px)', overflow: 'auto', padding: 17, borderRadius: 16, background: 'rgba(6,36,25,.9)', border: '1px solid #65a30d', backdropFilter: 'blur(10px)' };
const controlsStyle: React.CSSProperties = { position: 'absolute', zIndex: 3, right: 18, bottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap' };
const primaryStyle: React.CSSProperties = { border: 0, borderRadius: 10, padding: '11px 15px', background: '#facc15', color: '#3f2c00', fontWeight: 800, cursor: 'pointer' };
const secondaryStyle: React.CSSProperties = { ...primaryStyle, color: '#f8fafc', background: '#31523f' };
const choiceStyle: React.CSSProperties = { ...secondaryStyle, display: 'block', width: '100%', textAlign: 'left', margin: '7px 0' };
const successStyle: React.CSSProperties = { ...choiceStyle, color: '#052e16', background: '#86efac' };
