'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CONTROL_TRIALS,
  FOOD_SAMPLES,
  addIodineDrop,
  createCarbohydrateTest,
  interpretCarbohydrateTest,
  prepareSample,
  type FoodSampleId,
} from '../../../../packages/simulation-runtime/src/models/carbohydrateTestModel';
import { playSimulationNarration, stopSimulationNarration } from '@/lib/simulationAudio';
import ControlledLabVrMode from './ControlledLabVrMode';

const PROCEDURE = [
  { title: 'Choose sample', narration: 'Choose one food sample. We will test it for starch, a carbohydrate.' },
  { title: 'Prepare', narration: 'Prepare a small amount in a clean test dish. Keep the sample size the same for a fair comparison.' },
  { title: 'Add iodine', narration: 'Use the dropper to add exactly two iodine drops. Iodine is yellow-brown before it reacts with starch.' },
  { title: 'Observe', narration: 'Observe the colour carefully. Blue-black is a positive starch test. Yellow-brown is a negative starch test.' },
  { title: 'Conclude', narration: 'Record the evidence first, then state whether starch is present. Reset the apparatus before the next sample.' },
] as const;

const panel = { background: 'rgba(5,18,28,.88)', border: '1px solid rgba(125,211,252,.25)', borderRadius: 18, boxShadow: '0 18px 50px rgba(0,0,0,.32)' } as const;
const button = { border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, padding: '10px 14px', color: '#f8fafc', cursor: 'pointer', fontWeight: 700 } as const;

export default function CarbohydrateTestLabViewer() {
  const [sampleId, setSampleId] = useState<FoodSampleId>('potato');
  const [trial, setTrial] = useState(() => createCarbohydrateTest('potato'));
  const [prediction, setPrediction] = useState<'present' | 'absent' | null>(null);
  const [result, setResult] = useState<ReturnType<typeof interpretCarbohydrateTest> | null>(null);
  const [stage, setStage] = useState(0);
  const [narrationOn, setNarrationOn] = useState(true);
  const [completedSamples, setCompletedSamples] = useState<FoodSampleId[]>([]);

  const sample = useMemo(() => FOOD_SAMPLES.find(item => item.id === sampleId) ?? FOOD_SAMPLES[0], [sampleId]);
  const colour = result ? (result.containsStarch ? '#111827' : '#b7791f') : trial.iodineDrops ? '#a16207' : '#e8dcc4';

  function narrate(text: string, cue = stage) {
    if (narrationOn) void playSimulationNarration(text, cue);
  }

  function chooseSample(id: FoodSampleId) {
    const next = FOOD_SAMPLES.find(item => item.id === id) ?? FOOD_SAMPLES[0];
    setSampleId(id);
    setTrial(createCarbohydrateTest(id));
    setPrediction(null);
    setResult(null);
    setStage(0);
    narrate(`${next.label} selected. ${next.preparation}`, 0);
  }

  function prepare() {
    const next = prepareSample(createCarbohydrateTest(sampleId));
    setTrial(next);
    setResult(null);
    setStage(2);
    narrate(`${sample.preparation} Now predict whether starch is present, then add two iodine drops.`, 1);
  }

  function addDrop() {
    if (!trial.samplePrepared) {
      narrate('Prepare the sample first. A controlled investigation follows the procedure in order.', 2);
      return;
    }
    const next = addIodineDrop(trial);
    setTrial(next);
    setStage(next.observed ? 3 : 2);
    narrate(next.observed ? 'Two drops added. Wait and observe the final colour.' : 'One iodine drop added. Add one more drop to keep the test consistent.', 2);
  }

  function observe() {
    if (!trial.observed) {
      narrate('The observation is not ready. Add exactly two iodine drops.', 3);
      return;
    }
    const interpreted = interpretCarbohydrateTest(trial);
    setResult(interpreted);
    setStage(4);
    setCompletedSamples(current => current.includes(sampleId) ? current : [...current, sampleId]);
    const predictionFeedback = prediction === null ? 'No prediction was recorded.' : prediction === (interpreted.containsStarch ? 'present' : 'absent') ? 'Your prediction matches the evidence.' : 'Your prediction did not match, and that is useful scientific evidence.';
    narrate(`${interpreted.conclusion} ${predictionFeedback}`, 4);
  }

  function reset() {
    setTrial(createCarbohydrateTest(sampleId));
    setPrediction(null);
    setResult(null);
    setStage(0);
    stopSimulationNarration();
    if (narrationOn) void playSimulationNarration('Apparatus reset. The dish and dropper are clean. Choose a sample for a new fair test.', 0);
  }

  useEffect(() => () => stopSimulationNarration(), []);

  return (
    <main style={{ minHeight: '100vh', color: '#e8f5ff', background: 'radial-gradient(circle at 50% 10%, #164e63 0, #08202d 38%, #031018 100%)', fontFamily: 'system-ui, sans-serif', padding: '66px 20px 24px', boxSizing: 'border-box' }}>
      <header style={{ maxWidth: 1320, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: 13, fontWeight: 800, letterSpacing: 1.5 }}>CLASS 6 · CHAPTER 2 · ACTIVITY 1</div>
          <h1 style={{ margin: '4px 0', fontSize: 'clamp(25px,4vw,42px)' }}>Test the Presence of Carbohydrates</h1>
          <p style={{ margin: 0, color: '#b9d7e4' }}>A controlled iodine test for starch · Predict → Test → Observe → Explain</p>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <ControlledLabVrMode title="Carbohydrate Test Lab" sampleLabel={sample.label} observationColour={colour} instruction={PROCEDURE[stage].narration} accent="#22d3ee" actions={[
            { id: 'prepare', label: 'Prepare', onSelect: prepare },
            { id: 'iodine', label: 'Add iodine', onSelect: addDrop },
            { id: 'observe', label: 'Observe', onSelect: observe },
            { id: 'reset', label: 'Reset', onSelect: reset },
          ]} onBack={() => { const previous = Math.max(0, stage - 1); setStage(previous); narrate(`Back. ${PROCEDURE[previous].narration}`, previous); }} onNarrate={() => narrate(PROCEDURE[stage].narration, stage)} />
          <button onClick={() => { setNarrationOn(value => !value); if (narrationOn) stopSimulationNarration(); }} style={{ ...button, background: narrationOn ? '#0e7490' : '#334155' }} aria-pressed={narrationOn}>Narration {narrationOn ? 'On' : 'Off'}</button>
        </div>
      </header>

      <section style={{ maxWidth: 1320, margin: 'auto', display: 'grid', gridTemplateColumns: 'minmax(230px, .75fr) minmax(430px, 1.7fr) minmax(260px, .85fr)', gap: 16 }}>
        <aside style={{ ...panel, padding: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>1. Food samples</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {FOOD_SAMPLES.map(item => <button key={item.id} onClick={() => chooseSample(item.id)} style={{ ...button, textAlign: 'left', background: sampleId === item.id ? '#155e75' : '#112b38' }}>
              {item.label} {completedSamples.includes(item.id) ? '✓' : ''}
            </button>)}
          </div>
          <h3 style={{ marginBottom: 8, color: '#a5f3fc' }}>Prediction</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setPrediction('present'); narrate('Prediction recorded: starch is present.', 1); }} style={{ ...button, flex: 1, background: prediction === 'present' ? '#166534' : '#15303c' }}>Present</button>
            <button onClick={() => { setPrediction('absent'); narrate('Prediction recorded: starch is absent.', 1); }} style={{ ...button, flex: 1, background: prediction === 'absent' ? '#9a3412' : '#15303c' }}>Absent</button>
          </div>
          <p style={{ color: '#9fb9c5', fontSize: 13, lineHeight: 1.5 }}>A prediction is not a guess to hide. We compare it openly with the observed evidence.</p>
        </aside>

        <section style={{ ...panel, minHeight: 520, padding: 20, position: 'relative', overflow: 'hidden' }} aria-label="Virtual carbohydrate test laboratory">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Laboratory bench</h2>
            <div style={{ borderRadius: 999, background: '#103445', padding: '6px 11px', fontSize: 13 }}>Iodine drops: {trial.iodineDrops}/2</div>
          </div>
          <div style={{ minHeight: 330, marginTop: 18, borderRadius: 18, background: 'linear-gradient(#d8edf0 0 56%, #8b5e3c 56% 61%, #4b2f23 61%)', position: 'relative', boxShadow: 'inset 0 0 40px rgba(0,0,0,.18)' }}>
            <div style={{ position: 'absolute', left: '13%', top: '11%', color: '#173b46', fontWeight: 900, fontSize: 18 }}>FOOD SCIENCE LAB</div>
            <div style={{ position: 'absolute', left: '20%', bottom: '23%', width: 118, height: 52, borderRadius: '50%', background: '#e2e8f0', border: '9px solid #f8fafc', boxShadow: '0 8px 14px rgba(0,0,0,.3)' }}>
              <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: colour, transition: 'background 1.1s', boxShadow: result?.containsStarch ? '0 0 26px #312e81' : 'none' }} />
            </div>
            <div style={{ position: 'absolute', left: '18%', bottom: '13%', width: 150, textAlign: 'center', color: '#fff', fontWeight: 800 }}>{sample.label}</div>
            <div style={{ position: 'absolute', right: '26%', top: '17%', width: 34, height: 155, borderRadius: '12px 12px 18px 18px', background: 'linear-gradient(90deg,#713f12,#fbbf24,#713f12)', transform: trial.iodineDrops ? 'rotate(13deg)' : 'rotate(0)', transformOrigin: 'bottom', transition: '.35s' }}>
              <div style={{ position: 'absolute', left: 11, bottom: -24, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '28px solid #a16207' }} />
            </div>
            <div style={{ position: 'absolute', right: '11%', bottom: '19%', color: '#fff7ed', width: 190, fontSize: 13, lineHeight: 1.4 }}><strong>Iodine reagent</strong><br />Yellow-brown · use dropper · do not taste · avoid skin and eye contact</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginTop: 16 }}>
            <button onClick={prepare} style={{ ...button, background: trial.samplePrepared ? '#166534' : '#0369a1' }}>Prepare sample</button>
            <button onClick={addDrop} disabled={trial.iodineDrops >= 2} style={{ ...button, background: trial.iodineDrops >= 2 ? '#334155' : '#a16207' }}>Add iodine drop</button>
            <button onClick={observe} style={{ ...button, background: result ? '#166534' : '#6d28d9' }}>Observe colour</button>
            <button onClick={reset} style={{ ...button, background: '#475569' }}>Clean & reset</button>
          </div>
          {result && <div role="status" style={{ marginTop: 14, padding: 14, borderRadius: 12, background: result.containsStarch ? '#172554' : '#422006', border: `1px solid ${result.containsStarch ? '#818cf8' : '#f59e0b'}` }}>
            <strong>Observation: {result.colour}</strong><br />{result.conclusion}
          </div>}
        </section>

        <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <section style={{ ...panel, padding: 16 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 18 }}>Procedure control</h2>
            {PROCEDURE.map((item, index) => <button key={item.title} onClick={() => { setStage(index); narrate(item.narration, index); }} style={{ width: '100%', border: 0, borderLeft: `4px solid ${index === stage ? '#22d3ee' : '#334155'}`, padding: '8px 10px', color: index === stage ? '#ecfeff' : '#9fb9c5', background: index === stage ? '#0e3a49' : 'transparent', textAlign: 'left', cursor: 'pointer' }}>
              {index + 1}. {item.title}
            </button>)}
            <button onClick={() => narrate(PROCEDURE[stage].narration, stage)} style={{ ...button, background: '#0e7490', width: '100%', marginTop: 10 }}>Repeat instruction</button>
          </section>
          <section style={{ ...panel, padding: 16 }}>
            <h2 style={{ margin: '0 0 9px', fontSize: 18 }}>Control activity</h2>
            <div style={{ padding: 10, borderRadius: 10, background: '#172554', marginBottom: 8 }}><strong>Positive control</strong><br />{CONTROL_TRIALS.positive.sample} → {CONTROL_TRIALS.positive.expected}<br /><small>{CONTROL_TRIALS.positive.purpose}</small></div>
            <div style={{ padding: 10, borderRadius: 10, background: '#422006' }}><strong>Negative control</strong><br />{CONTROL_TRIALS.negative.sample} → {CONTROL_TRIALS.negative.expected}<br /><small>{CONTROL_TRIALS.negative.purpose}</small></div>
          </section>
          <section style={{ ...panel, padding: 16, fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: '#fef08a' }}>Safety & fair test</strong><br />Wear goggles. Never taste laboratory food. Use clean dishes, equal sample amounts and exactly two iodine drops. Wash spills with water and tell the instructor.
          </section>
        </aside>
      </section>
      <style>{`@media(max-width:950px){main>section{grid-template-columns:1fr!important} main{overflow:auto!important} button{min-height:44px}}`}</style>
    </main>
  );
}
