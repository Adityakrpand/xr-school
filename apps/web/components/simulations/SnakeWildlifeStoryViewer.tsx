'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import { evaluateSnakeQuiz, SNAKE_PROFILES, SNAKE_QUIZ, type SnakeProfile } from '../../../../packages/simulation-runtime/src/models/snakeWildlifeModel';

const xrStore = createXRStore({ hand: true, controller: true });
type SceneStage = 'welcome' | 'guide' | 'journey' | 'observe' | 'conservation' | 'quiz' | 'ending';

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh castShadow position-y={1.15}><cylinderGeometry args={[0.16, 0.24, 2.3, 9]} /><meshStandardMaterial color="#69452c" roughness={0.95} /></mesh>
    <mesh castShadow position-y={2.45}><sphereGeometry args={[1.05, 12, 10]} /><meshStandardMaterial color="#34753b" roughness={0.9} /></mesh>
  </group>;
}

function Hut({ position, color = '#c7824d' }: { position: [number, number, number]; color?: string }) {
  return <group position={position}>
    <mesh castShadow receiveShadow position-y={0.75}><boxGeometry args={[2.1, 1.5, 1.7]} /><meshStandardMaterial color={color} roughness={1} /></mesh>
    <mesh castShadow position-y={1.75} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.75, 1.05, 4]} /><meshStandardMaterial color="#713c27" roughness={1} /></mesh>
    <mesh position={[0, 0.55, 0.86]}><boxGeometry args={[0.55, 1.05, 0.05]} /><meshStandardMaterial color="#412b22" /></mesh>
  </group>;
}

function Animal({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh castShadow><sphereGeometry args={[0.32, 10, 8]} /><meshStandardMaterial color={color} /></mesh>
    <mesh castShadow position={[0.38, 0.12, 0]}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color={color} /></mesh>
    {[-0.18, 0.18].map((z, i) => <mesh key={i} position={[-0.15, -0.35, z]}><cylinderGeometry args={[0.04, 0.05, 0.45, 8]} /><meshStandardMaterial color={color} /></mesh>)}
  </group>;
}

function Character({ position, shirt, elder = false }: { position: [number, number, number]; shirt: string; elder?: boolean }) {
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (arm.current) arm.current.rotation.z = -0.35 + Math.sin(clock.elapsedTime * 1.8) * 0.18; });
  return <group position={position}>
    <mesh castShadow position-y={1.65}><sphereGeometry args={[0.22, 16, 12]} /><meshStandardMaterial color="#9a6947" /></mesh>
    {elder && <mesh position={[0, 1.57, 0.19]}><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color="#f1f5f9" /></mesh>}
    <mesh castShadow position-y={1.0}><capsuleGeometry args={[0.28, 0.65, 8, 12]} /><meshStandardMaterial color={shirt} /></mesh>
    <group ref={arm} position={[0.35, 1.3, 0]}><mesh position-y={-0.33}><capsuleGeometry args={[0.07, 0.55, 6, 8]} /><meshStandardMaterial color="#9a6947" /></mesh></group>
    {[-0.13, 0.13].map(x => <mesh key={x} position={[x, 0.35, 0]}><capsuleGeometry args={[0.08, 0.6, 6, 8]} /><meshStandardMaterial color="#334155" /></mesh>)}
  </group>;
}

function Butterfly({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (!ref.current) return; const t = clock.elapsedTime * 0.55 + seed; ref.current.position.set(Math.sin(t) * 4, 1.2 + Math.sin(t * 2.7) * 0.6, -2 + Math.cos(t) * 3); ref.current.rotation.y = -t; });
  return <group ref={ref}><mesh rotation={[0, 0.4, 0]}><planeGeometry args={[0.18, 0.12]} /><meshBasicMaterial color={seed % 2 ? '#fbbf24' : '#a78bfa'} side={THREE.DoubleSide} /></mesh><mesh rotation={[0, -0.4, 0]}><planeGeometry args={[0.18, 0.12]} /><meshBasicMaterial color="#fb7185" side={THREE.DoubleSide} /></mesh></group>;
}

function VillageForest({ stage }: { stage: SceneStage }) {
  const evening = stage === 'ending';
  const forest = ['journey', 'observe', 'conservation', 'quiz', 'ending'].includes(stage);
  return <>
    <Sky sunPosition={evening ? [-5, 1, -8] : [5, 5, 2]} turbidity={6} rayleigh={2.2} />
    <fog attach="fog" args={[evening ? '#c88167' : '#b9d9b5', 14, 48]} />
    <hemisphereLight intensity={1.25} color="#fff4d6" groundColor="#34543b" />
    <directionalLight castShadow intensity={2} color={evening ? '#ffb176' : '#ffe5b4'} position={[7, 10, 5]} shadow-mapSize={[1024, 1024]} />
    <mesh receiveShadow rotation-x={-Math.PI / 2}><planeGeometry args={[70, 70]} /><meshStandardMaterial color={forest ? '#527b3d' : '#78a84d'} roughness={1} /></mesh>
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.025, -4]}><planeGeometry args={[4.2, 35]} /><meshStandardMaterial color={forest ? '#8a704d' : '#ad8358'} roughness={1} /></mesh>
    {!forest && <><Hut position={[-4.2, 0, -5]} /><Hut position={[4.5, 0, -8]} color="#d6a05f" /><Hut position={[-4.8, 0, -12]} color="#b86f46" /><Animal position={[3.5, 0.55, -4]} color="#e7e5e4" scale={1.25} /><Animal position={[-2.8, 0.4, -7]} color="#c9a46b" /><Animal position={[2.4, 0.3, -9]} color="#f8fafc" scale={0.65} /></>}
    {Array.from({ length: forest ? 26 : 12 }, (_, i) => <Tree key={i} position={[((i * 7) % 17) - 8, 0, -2 - ((i * 5) % 25)]} scale={0.75 + (i % 4) * 0.15} />)}
    <mesh position={[7, -0.1, -10]} rotation-x={-Math.PI / 2}><planeGeometry args={[5, 38]} /><meshPhysicalMaterial color="#3b9ec4" roughness={0.22} metalness={0.05} transparent opacity={0.82} /></mesh>
    {Array.from({ length: 8 }, (_, i) => <Butterfly key={i} seed={i * 1.7} />)}
    <Character position={[-1.1, 0, -2.4]} shirt={stage === 'welcome' ? '#f59e0b' : '#15803d'} elder={stage === 'welcome'} />
    {stage !== 'welcome' && <Character position={[1.1, 0, -2.7]} shirt="#0f766e" />}
  </>;
}

function SnakeModel({ profile, slow }: { profile: SnakeProfile; slow: boolean }) {
  const root = useRef<THREE.Group>(null);
  const count = profile.id === 'python' ? 28 : 22;
  const segments = useMemo(() => Array.from({ length: count }), [count]);
  useFrame(({ clock }) => {
    if (!root.current) return; const t = clock.elapsedTime * (slow ? 0.35 : 0.75);
    root.current.children.forEach((child, i) => { const x = (i - count / 2) * (profile.averageLengthM / count); child.position.set(x, 0.19 + Math.sin(t * 2 + i * 0.35) * 0.025, Math.sin(t + i * 0.45) * 0.24); child.rotation.y = Math.cos(t + i * 0.45) * 0.35; });
  });
  return <group ref={root} position={[0, 0, -3.7]}>
    {segments.map((_, i) => <mesh key={i} castShadow scale={1 - (i / count) * 0.5}>
      <sphereGeometry args={[profile.id === 'python' ? 0.17 : 0.115, 12, 9]} />
      <meshStandardMaterial color={i % 4 === 0 ? profile.pattern : profile.color} roughness={0.72} />
    </mesh>)}
  </group>;
}

function Habitat({ profile, slow }: { profile: SnakeProfile; slow: boolean }) {
  const night = profile.id === 'common-krait';
  return <group>
    <mesh receiveShadow position={[0, 0.08, -3.7]}><cylinderGeometry args={[2.6, 2.8, 0.16, 32]} /><meshStandardMaterial color={night ? '#27334d' : profile.id === 'python' ? '#496c3b' : '#9a7b4f'} /></mesh>
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-1.8 + i * 0.55, 0.25, -4.4 + (i % 2) * 1.2]} rotation-z={i * 0.4}><dodecahedronGeometry args={[0.25 + (i % 3) * 0.08]} /><meshStandardMaterial color="#5e6257" roughness={1} /></mesh>)}
    <SnakeModel profile={profile} slow={slow} />
    <mesh position={[0, 1.5, -5.5]}><planeGeometry args={[6.8, 2.2]} /><meshBasicMaterial color={night ? '#111827' : '#17392b'} transparent opacity={0.85} /></mesh>
  </group>;
}

function VrButton({ label, position, color, onSelect }: { label: string; position: [number, number, number]; color: string; onSelect: () => void }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160; const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = '#09261a'; ctx.fillRect(0, 0, 512, 160); ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.strokeRect(6, 6, 500, 148); ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 256, 80); }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [label, color]);
  return <mesh position={position} onClick={event => { event.stopPropagation(); onSelect(); }} onPointerEnter={event => { document.body.style.cursor = 'pointer'; (event.object as THREE.Mesh).scale.setScalar(1.06); }} onPointerLeave={event => { document.body.style.cursor = 'default'; (event.object as THREE.Mesh).scale.setScalar(1); }}>
    <boxGeometry args={[1.25, 0.34, 0.07]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} /><mesh position-z={0.041}><planeGeometry args={[1.17, 0.29]} /><meshBasicMaterial map={texture} /></mesh>
  </mesh>;
}

function World({ stage, snakeIndex, slow, onAdvance, onNextSnake, onToggleSlow, onAnswer }: { stage: SceneStage; snakeIndex: number; slow: boolean; onAdvance: () => void; onNextSnake: () => void; onToggleSlow: () => void; onAnswer: (index: number) => void }) {
  return <><VillageForest stage={stage} />{stage === 'observe' && <Habitat profile={SNAKE_PROFILES[snakeIndex]} slow={slow} />}
    <group position={[0, 1.0, -2.25]}>{stage === 'observe' && <><VrButton label="NEXT SNAKE" position={[-1.35, 0, 0]} color="#65a30d" onSelect={onNextSnake} /><VrButton label={slow ? 'NORMAL SPEED' : 'SLOW MOTION'} position={[0, 0, 0]} color="#0f766e" onSelect={onToggleSlow} /></>} {stage === 'quiz' && [0, 1, 2].map(index => <VrButton key={index} label={`ANSWER ${String.fromCharCode(65 + index)}`} position={[(index - 1) * 1.35, 0, 0]} color="#2563eb" onSelect={() => onAnswer(index)} />)} {stage !== 'quiz' && stage !== 'ending' && <VrButton label="CONTINUE" position={[stage === 'observe' ? 1.35 : 0, -0.45, 0]} color="#d97706" onSelect={onAdvance} />}</group>
    <OrbitControls enablePan={false} minDistance={2} maxDistance={8} maxPolarAngle={Math.PI / 2.05} target={[0, 1.1, -3.5]} /></>;
}

const INTRO: Record<Exclude<SceneStage, 'observe' | 'quiz'>, string> = {
  welcome: "Welcome, my little explorer! Today we will discover one of nature's most fascinating animals—the snake. Understanding replaces fear.",
  guide: 'Long ago, people believed snake charmers controlled snakes with music. Snakes do not hear music as humans do. Wildlife rescuers protect and safely return them to nature.',
  journey: 'Follow the forest path. Listen to birds and water, but observe every animal without disturbing it.',
  conservation: 'Never harm or capture a snake. Keep your distance, inform an adult, and call a trained wildlife rescuer.',
  ending: 'Every creature has an important role. When we understand animals instead of fearing them, we become protectors of our environment.',
};

export default function SnakeWildlifeStoryViewer() {
  const [started, setStarted] = useState(false); const [stage, setStage] = useState<SceneStage>('welcome'); const [snakeIndex, setSnakeIndex] = useState(0);
  const [slow, setSlow] = useState(false); const [quizIndex, setQuizIndex] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(''); const [muted, setMuted] = useState(false);
  const snake = SNAKE_PROFILES[snakeIndex];
  const speak = useCallback((text: string, cue = 0) => { if (!muted) void playSimulationNarration(`Wildlife guide. ${text}`, cue); }, [muted]);
  const begin = () => { setStarted(true); speak(INTRO.welcome); };
  const advance = () => {
    const order: SceneStage[] = ['welcome', 'guide', 'journey', 'observe', 'conservation', 'quiz', 'ending']; const next = order[Math.min(order.indexOf(stage) + 1, order.length - 1)]; setStage(next); setFeedback('');
    if (next === 'observe') speak(`${snake.name}. ${snake.venomous ? 'Venomous' : 'Non-venomous'}. ${snake.behavior} ${snake.fact}`, 3);
    else if (next !== 'quiz') speak(INTRO[next as keyof typeof INTRO], order.indexOf(next));
  };
  const nextSnake = (direction: number) => { const next = (snakeIndex + direction + SNAKE_PROFILES.length) % SNAKE_PROFILES.length; setSnakeIndex(next); const item = SNAKE_PROFILES[next]; speak(`${item.name}. ${item.venomous ? 'Venomous' : 'Non-venomous'}. ${item.behavior} ${item.fact}`, 10 + next); };
  const answer = (index: number) => { const correct = evaluateSnakeQuiz(quizIndex, index); setFeedback(correct ? 'Correct—excellent wildlife observation!' : 'Try again. Think about safe, respectful observation.'); if (!correct) return; setScore(value => value + 1); if (quizIndex < SNAKE_QUIZ.length - 1) setTimeout(() => { setQuizIndex(value => value + 1); setFeedback(''); }, 500); else setTimeout(() => { setStage('ending'); speak(INTRO.ending, 30); }, 700); };
  const progress = Math.round(((['welcome', 'guide', 'journey', 'observe', 'conservation', 'quiz', 'ending'].indexOf(stage) + 1) / 7) * 100);
  return <main style={{ height: '100vh', position: 'relative', background: '#122a1e', color: '#f8fafc', fontFamily: 'system-ui', overflow: 'hidden' }}>
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.65, 5], fov: 68 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
      <XR store={xrStore}><World stage={stage} snakeIndex={snakeIndex} slow={slow} onAdvance={advance} onNextSnake={() => nextSnake(1)} onToggleSlow={() => setSlow(value => !value)} onAnswer={answer} /></XR>
    </Canvas>
    {!started ? <section style={introStyle}><p style={{ color: '#facc15', fontWeight: 800 }}>CLASS 5 · A SNAKE CHARMER&apos;S STORY · 8–10 MIN</p><h1>Snakes and Their Types</h1><p>Journey from an Indian village into a wildlife observation forest. Learn with curiosity, keep a safe distance, and protect every creature.</p><button style={primaryStyle} onClick={begin}>Begin the Story</button></section> : <>
      <aside style={panelStyle}><small>STORY {progress}% COMPLETE</small><div style={{ height: 5, background: '#365847', margin: '8px 0 12px' }}><div style={{ width: `${progress}%`, background: '#facc15', height: '100%' }} /></div>
        {stage !== 'observe' && stage !== 'quiz' && <><h2>{stage === 'welcome' ? 'A Peaceful Village Morning' : stage === 'guide' ? 'Meet the Wildlife Rescuer' : stage === 'journey' ? 'Journey Into Nature' : stage === 'conservation' ? 'Protect Wildlife' : 'True Protector of Nature'}</h2><p>{INTRO[stage as keyof typeof INTRO]}</p>{stage === 'ending' && <><h3>Today We Learned</h3><p>Snake types · habitats · venom awareness · safe distance · ecological balance</p><p>🏆 Wildlife Protector · Quiz score {score}/{SNAKE_QUIZ.length}</p></>}</>}
        {stage === 'observe' && <><p style={{ color: snake.venomous ? '#fca5a5' : '#86efac', fontWeight: 800 }}>{snake.venomous ? 'VENOMOUS — OBSERVE AT A DISTANCE' : 'NON-VENOMOUS — OBSERVE AT A DISTANCE'}</p><h2>{snake.name}</h2><em>{snake.scientificName}</em><p><strong>Habitat:</strong> {snake.habitat}<br /><strong>Food:</strong> {snake.food}<br /><strong>Average length:</strong> {snake.averageLengthM} m</p><p>{snake.fact}</p><p style={{ color: '#fde68a' }}>{snake.conservation}</p></>}
        {stage === 'quiz' && <><small>QUESTION {quizIndex + 1}/{SNAKE_QUIZ.length}</small><h2>{SNAKE_QUIZ[quizIndex].question}</h2>{SNAKE_QUIZ[quizIndex].answers.map((item, i) => <button key={item} style={choiceStyle} onClick={() => answer(i)}>{item}</button>)}<p>{feedback}</p></>}
      </aside>
      <nav style={controlsStyle}>{stage === 'observe' && <><button style={secondaryStyle} onClick={() => nextSnake(-1)}>Previous Snake</button><button style={secondaryStyle} onClick={() => nextSnake(1)}>Next Snake</button><button style={slow ? activeStyle : secondaryStyle} onClick={() => setSlow(value => !value)}>Slow Motion</button></>} {stage !== 'quiz' && stage !== 'ending' && <button style={primaryStyle} onClick={advance}>{stage === 'observe' ? 'Conservation Story' : 'Continue Journey'}</button>}<button style={secondaryStyle} onClick={() => xrStore.enterVR()}>Enter VR</button><button style={secondaryStyle} onClick={() => { setMuted(value => !value); if (!muted) stopSimulationNarration(); }}>{muted ? 'Audio Off' : 'Audio On'}</button></nav>
    </>}
  </main>;
}

const introStyle: React.CSSProperties = { position: 'absolute', zIndex: 3, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(620px,calc(100% - 32px))', padding: 28, borderRadius: 20, background: 'rgba(10,35,24,.94)', border: '1px solid #facc15', boxShadow: '0 20px 70px #000b' };
const panelStyle: React.CSSProperties = { position: 'absolute', zIndex: 3, left: 18, top: 18, width: 'min(410px,calc(100% - 36px))', maxHeight: 'calc(100vh - 140px)', overflow: 'auto', padding: 17, borderRadius: 16, background: 'rgba(7,25,18,.9)', border: '1px solid #6d8b5f', backdropFilter: 'blur(10px)' };
const controlsStyle: React.CSSProperties = { position: 'absolute', zIndex: 3, right: 18, bottom: 18, maxWidth: 650, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' };
const primaryStyle: React.CSSProperties = { border: 0, borderRadius: 10, padding: '11px 15px', background: '#facc15', color: '#3f2c00', fontWeight: 800, cursor: 'pointer' };
const secondaryStyle: React.CSSProperties = { ...primaryStyle, color: '#f8fafc', background: '#31523f' };
const activeStyle: React.CSSProperties = { ...primaryStyle, color: '#052e16', background: '#86efac' };
const choiceStyle: React.CSSProperties = { ...secondaryStyle, display: 'block', width: '100%', textAlign: 'left', margin: '7px 0' };
