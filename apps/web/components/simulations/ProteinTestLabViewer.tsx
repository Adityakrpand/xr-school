'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROTEIN_CONTROL_TRIALS, PROTEIN_SAMPLES, addCopperSulphate, addSodiumHydroxide, createProteinTest, interpretProteinTest, mixProteinTest, prepareProteinSample, type ProteinSampleId } from '../../../../packages/simulation-runtime/src/models/proteinTestModel';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import ControlledLabVrMode from './ControlledLabVrMode';

const STEPS = [
  ['Choose & predict', 'Choose one food sample and predict whether it contains protein.'],
  ['Prepare extract', 'Prepare an equal amount of food extract in a clean test tube.'],
  ['Add copper sulphate', 'Add exactly two drops of copper sulphate solution.'],
  ['Add sodium hydroxide', 'Add ten drops of sodium hydroxide solution. It is corrosive, so keep goggles on and avoid contact.'],
  ['Mix & observe', 'Mix gently. A violet colour is positive evidence for protein. Blue is negative evidence.'],
  ['Conclude', 'Record the observed colour before writing the conclusion. Clean and reset before another sample.'],
] as const;
const panel = { background: 'rgba(7,18,35,.9)', border: '1px solid rgba(167,139,250,.28)', borderRadius: 18, boxShadow: '0 18px 50px rgba(0,0,0,.32)' } as const;
const button = { border: '1px solid rgba(255,255,255,.18)', borderRadius: 11, padding: '10px 12px', color: '#f8fafc', cursor: 'pointer', fontWeight: 750 } as const;

export default function ProteinTestLabViewer() {
  const [sampleId, setSampleId] = useState<ProteinSampleId>('egg-white');
  const [trial, setTrial] = useState(() => createProteinTest());
  const [prediction, setPrediction] = useState<'present' | 'absent' | null>(null);
  const [result, setResult] = useState<ReturnType<typeof interpretProteinTest> | null>(null);
  const [step, setStep] = useState(0);
  const [narration, setNarration] = useState(true);
  const [completed, setCompleted] = useState<ProteinSampleId[]>([]);
  const sample = useMemo(() => PROTEIN_SAMPLES.find(item => item.id === sampleId) ?? PROTEIN_SAMPLES[0], [sampleId]);

  function speak(text: string, cue = step) { if (narration) void playSimulationNarration(text, cue); }
  function choose(id: ProteinSampleId) {
    const next = PROTEIN_SAMPLES.find(item => item.id === id) ?? PROTEIN_SAMPLES[0];
    setSampleId(id); setTrial(createProteinTest(id)); setPrediction(null); setResult(null); setStep(0);
    speak(`${next.label} selected. ${next.preparation}`, 0);
  }
  function prepare() {
    setTrial(prepareProteinSample(createProteinTest(sampleId))); setResult(null); setStep(2);
    speak(`${sample.preparation} Record your prediction, then add two copper sulphate drops.`, 1);
  }
  function copper() {
    try { const next = addCopperSulphate(trial); setTrial(next); setStep(2); speak(next.copperSulphateDrops === 2 ? 'Two copper sulphate drops added. Now add ten sodium hydroxide drops.' : 'One copper sulphate drop added. Add one more.', 2); }
    catch (error) { speak((error as Error).message, 2); }
  }
  function sodium() {
    try { const next = addSodiumHydroxide(trial); setTrial(next); setStep(3); speak(next.sodiumHydroxideDrops === 10 ? 'Ten drops added. Mix the test tube gently and observe.' : `Sodium hydroxide drop ${next.sodiumHydroxideDrops} of ten.`, 3); }
    catch (error) { speak((error as Error).message, 3); }
  }
  function observe() {
    try {
      const mixed = mixProteinTest(trial); const interpreted = interpretProteinTest(mixed);
      setTrial(mixed); setResult(interpreted); setStep(5); setCompleted(current => current.includes(sampleId) ? current : [...current, sampleId]);
      const feedback = prediction === null ? 'No prediction was recorded.' : prediction === (interpreted.containsProtein ? 'present' : 'absent') ? 'Your prediction matches the evidence.' : 'Your prediction changed after observing evidence. That is good science.';
      speak(`${interpreted.conclusion} ${feedback}`, 5);
    } catch (error) { speak((error as Error).message, 4); }
  }
  function reset() {
    setTrial(createProteinTest(sampleId)); setPrediction(null); setResult(null); setStep(0); stopSimulationNarration();
    if (narration) void playSimulationNarration('The test tube and droppers are clean. Begin a new fair test.', 0);
  }
  useEffect(() => () => stopSimulationNarration(), []);

  const liquid = result ? (result.containsProtein ? 'linear-gradient(90deg,#4c1d95,#a78bfa,#4c1d95)' : 'linear-gradient(90deg,#1d4ed8,#60a5fa,#1d4ed8)') : trial.sodiumHydroxideDrops ? 'linear-gradient(90deg,#1e40af,#38bdf8,#1e40af)' : trial.copperSulphateDrops ? '#2563eb' : '#e5e7eb';
  return <main style={{ minHeight: '100vh', padding: '66px 20px 24px', boxSizing: 'border-box', background: 'radial-gradient(circle at 50% 5%,#312e81 0,#111b35 38%,#050b17 100%)', color: '#eef2ff', fontFamily: 'system-ui,sans-serif' }}>
    <header style={{ maxWidth: 1320, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 15, flexWrap: 'wrap' }}>
      <div><div style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 850, letterSpacing: 1.5 }}>CLASS 6 · CHAPTER 2 · ACTIVITY 2</div><h1 style={{ margin: '4px 0', fontSize: 'clamp(25px,4vw,42px)' }}>Test the Presence of Proteins</h1><p style={{ margin: 0, color: '#bdc8e6' }}>Controlled food test · Predict → Add reagents in order → Observe → Explain</p></div>
      <div style={{ display: 'flex', gap: 9 }}>
        <ControlledLabVrMode title="Protein Test Lab" sampleLabel={sample.label} observationColour={result ? (result.containsProtein ? '#7c3aed' : '#2563eb') : trial.copperSulphateDrops ? '#2563eb' : '#e5e7eb'} instruction={STEPS[step][1]} accent="#a78bfa" actions={[
          { id: 'prepare', label: 'Prepare', onSelect: prepare },
          { id: 'copper', label: 'Add CuSO4', onSelect: copper },
          { id: 'sodium', label: 'Add NaOH', onSelect: sodium },
          { id: 'observe', label: 'Observe', onSelect: observe },
        ]} onBack={() => { const previous = Math.max(0, step - 1); setStep(previous); speak(`Back. ${STEPS[previous][1]}`, previous); }} onNarrate={() => speak(STEPS[step][1], step)} />
        <button onClick={() => { setNarration(value => !value); if (narration) stopSimulationNarration(); }} aria-pressed={narration} style={{ ...button, background: narration ? '#6d28d9' : '#334155' }}>Narration {narration ? 'On' : 'Off'}</button>
      </div>
    </header>
    <section style={{ maxWidth: 1320, margin: 'auto', display: 'grid', gridTemplateColumns: 'minmax(230px,.75fr) minmax(430px,1.7fr) minmax(270px,.9fr)', gap: 16 }}>
      <aside style={{ ...panel, padding: 16 }}><h2 style={{ marginTop: 0, fontSize: 18 }}>1. Food samples</h2><div style={{ display: 'grid', gap: 8 }}>{PROTEIN_SAMPLES.map(item => <button key={item.id} onClick={() => choose(item.id)} style={{ ...button, textAlign: 'left', background: sampleId === item.id ? '#5b21b6' : '#18233d' }}>{item.label} {completed.includes(item.id) ? '✓' : ''}</button>)}</div>
        <h3 style={{ color: '#ddd6fe', marginBottom: 8 }}>Prediction</h3><div style={{ display: 'flex', gap: 8 }}><button onClick={() => { setPrediction('present'); speak('Prediction recorded: protein is present.', 0); }} style={{ ...button, flex: 1, background: prediction === 'present' ? '#166534' : '#202b46' }}>Present</button><button onClick={() => { setPrediction('absent'); speak('Prediction recorded: protein is absent.', 0); }} style={{ ...button, flex: 1, background: prediction === 'absent' ? '#9a3412' : '#202b46' }}>Absent</button></div>
        <p style={{ color: '#aebbd5', fontSize: 13, lineHeight: 1.5 }}>Use the same sample volume and reagent quantities so only the food sample changes.</p>
      </aside>
      <section aria-label="Virtual protein test laboratory" style={{ ...panel, padding: 20, minHeight: 530 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0, fontSize: 20 }}>Laboratory bench</h2><span style={{ background: '#242d50', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>CuSO₄ {trial.copperSulphateDrops}/2 · NaOH {trial.sodiumHydroxideDrops}/10</span></div>
        <div style={{ height: 335, marginTop: 18, borderRadius: 18, background: 'linear-gradient(#dbeafe 0 56%,#a06c43 56% 61%,#513224 61%)', position: 'relative', overflow: 'hidden' }}>
          <strong style={{ position: 'absolute', top: 24, left: 35, color: '#24304b', fontSize: 18 }}>FOOD ANALYSIS LAB</strong>
          <div style={{ position: 'absolute', left: '38%', top: 60, width: 92, height: 230, border: '7px solid rgba(255,255,255,.75)', borderTop: 0, borderRadius: '0 0 45px 45px', background: 'rgba(255,255,255,.2)', transform: trial.mixed ? 'rotate(3deg)' : 'none', transition: '.3s' }}><div style={{ position: 'absolute', left: 7, right: 7, bottom: 8, height: result ? 145 : 90 + trial.sodiumHydroxideDrops * 3, borderRadius: '0 0 34px 34px', background: liquid, transition: 'all 1s' }} /></div>
          <div style={{ position: 'absolute', left: '33%', bottom: 10, width: 180, textAlign: 'center', color: '#fff', fontWeight: 800 }}>{sample.label}</div>
          <div style={{ position: 'absolute', left: '8%', bottom: 35, width: 120, padding: 11, color: '#fff', background: '#1d4ed8', borderRadius: 12, textAlign: 'center' }}><strong>Copper sulphate</strong><br /><small>2 drops</small></div>
          <div style={{ position: 'absolute', right: '7%', bottom: 35, width: 130, padding: 11, color: '#18202c', background: '#f8fafc', border: '3px solid #ef4444', borderRadius: 12, textAlign: 'center' }}><strong>Sodium hydroxide</strong><br /><small>10 drops · corrosive</small></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 15 }}><button onClick={prepare} style={{ ...button, background: trial.prepared ? '#166534' : '#0369a1' }}>Prepare</button><button onClick={copper} disabled={trial.copperSulphateDrops >= 2} style={{ ...button, background: trial.copperSulphateDrops >= 2 ? '#334155' : '#1d4ed8' }}>Add CuSO₄</button><button onClick={sodium} disabled={trial.sodiumHydroxideDrops >= 10} style={{ ...button, background: trial.sodiumHydroxideDrops >= 10 ? '#334155' : '#64748b' }}>Add NaOH</button><button onClick={observe} style={{ ...button, background: '#6d28d9' }}>Mix & observe</button><button onClick={reset} style={{ ...button, background: '#475569' }}>Clean & reset</button></div>
        {result && <div role="status" style={{ marginTop: 14, padding: 14, borderRadius: 12, background: result.containsProtein ? '#3b0764' : '#172554', border: '1px solid #a78bfa' }}><strong>Observation: {result.colour}</strong><br />{result.conclusion}</div>}
      </section>
      <aside style={{ display: 'grid', gap: 14, alignContent: 'start' }}><section style={{ ...panel, padding: 16 }}><h2 style={{ marginTop: 0, fontSize: 18 }}>Procedure control</h2>{STEPS.map(([title, text], index) => <button key={title} onClick={() => { setStep(index); speak(text, index); }} style={{ width: '100%', border: 0, borderLeft: `4px solid ${step === index ? '#a78bfa' : '#334155'}`, color: step === index ? '#fff' : '#aebbd5', background: step === index ? '#312e81' : 'transparent', padding: '8px 9px', textAlign: 'left', cursor: 'pointer' }}>{index + 1}. {title}</button>)}<button onClick={() => speak(STEPS[step][1], step)} style={{ ...button, width: '100%', background: '#6d28d9', marginTop: 10 }}>Repeat instruction</button></section>
        <section style={{ ...panel, padding: 16 }}><h2 style={{ marginTop: 0, fontSize: 18 }}>Control activity</h2><div style={{ background: '#3b0764', padding: 10, borderRadius: 10, marginBottom: 8 }}><strong>Positive control</strong><br />{PROTEIN_CONTROL_TRIALS.positive.sample} → {PROTEIN_CONTROL_TRIALS.positive.expected}<br /><small>{PROTEIN_CONTROL_TRIALS.positive.purpose}</small></div><div style={{ background: '#172554', padding: 10, borderRadius: 10 }}><strong>Negative control</strong><br />{PROTEIN_CONTROL_TRIALS.negative.sample} → {PROTEIN_CONTROL_TRIALS.negative.expected}<br /><small>{PROTEIN_CONTROL_TRIALS.negative.purpose}</small></div></section>
        <section style={{ ...panel, padding: 16, fontSize: 13, lineHeight: 1.5 }}><strong style={{ color: '#fca5a5' }}>Safety</strong><br />Wear goggles and gloves. Sodium hydroxide is corrosive; never touch or taste reagents. Rinse splashes with plenty of water and alert the instructor immediately.</section></aside>
    </section><style>{`@media(max-width:950px){main>section{grid-template-columns:1fr!important}button{min-height:44px}}`}</style>
  </main>;
}
