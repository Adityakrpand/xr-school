import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const viewerPath = resolve(process.cwd(), 'apps/web/components/simulations/MoneyTownViewer.tsx');
const routePath = resolve(process.cwd(), 'apps/web/app/simulations/c1-math-ch01-introduction-to-money/page.tsx');

describe('Class 1 Money Town viewer', () => {
  it('exposes its canonical route through the shared viewer registry', () => {
    expect(existsSync(routePath)).toBe(true);
    const source = readFileSync(routePath, 'utf8');
    expect(source).toContain('SimulationRoutePage');
    expect(source).toContain('slug="c1-math-ch01-introduction-to-money"');
  });

  it('keeps Quest controls, narration, accessibility, and no-student affordances', () => {
    const source = readFileSync(viewerPath, 'utf8');

    for (const identifier of [
      "renderer.xr.setReferenceSpaceType('local-floor')",
      'renderer.xr.getController(0)',
      'renderer.xr.getController(1)',
      'createQuestVrControls',
      'quest.update()',
      'optionalFeatures',
      'hand-tracking',
      'playSimulationNarration',
      'stopSimulationNarration',
      'aria-live="polite"',
      'Voice on',
      'Comfort',
      'Restart',
      'class-1-magic-money-town-no-students',
      'friendly-animated-teacher-guide-smiles-waves-no-students',
    ]) {
      expect(source).toContain(identifier);
    }
    expect(source).not.toContain('student-desk');
    expect(source).not.toContain('animated-student');
  });

  it('uses readable RBI reference faces instead of generic currency discs', () => {
    const source = readFileSync(viewerPath, 'utf8');
    expect(source).toContain('RBI_CURRENCY_ASSETS');
    expect(source).toContain('rbi-reference-face');
    expect(source).toContain('EDUCATIONAL SPECIMEN');

    for (const asset of [
      'coin-1-obverse.png',
      'coin-1-reverse.png',
      'coin-2-obverse.png',
      'coin-2-reverse.png',
      'coin-5-obverse.png',
      'coin-5-reverse.png',
      'coin-10-obverse.png',
      'coin-10-reverse.png',
      'note-10-front.png',
      'note-20-front.png',
      'note-50-front.png',
      'note-100-front.png',
      'note-200-front.png',
    ]) {
      const path = resolve(process.cwd(), 'apps/web/public/assets/money/rbi', asset);
      expect(existsSync(path), asset).toBe(true);
      expect(statSync(path).size, asset).toBeGreaterThan(8_000);
    }
  });

  it('builds the requested Money Town scenes and interactions', () => {
    const source = readFileSync(viewerPath, 'utf8');

    for (const identifier of [
      'Introduction to Money',
      'large-digital-smartboard-money-values-quizzes-rewards',
      'giant-smiling-piggy-bank',
      'coin-fountain-floating-golden-coins',
      'large-3d-indian-${definition.id}',
      'coin-side-round-metal-small',
      'note-side-paper-rectangular-foldable',
      'identification-correct-stars-wrong-gentle-pop',
      'cash-box-receipt-shopkeeper-smiles-fireworks',
      'mini-bank-counter-memory-check-board',
      'golden-coin-rain-confetti-rainbow-teacher-goodbye',
      'money-town-vr-controller-navigation',
    ]) {
      expect(source).toContain(identifier);
    }
  });
});
