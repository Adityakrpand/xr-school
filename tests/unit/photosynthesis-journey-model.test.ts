import { describe, expect, it } from 'vitest';
import { evaluatePhotosynthesis, evaluatePhotosynthesisQuiz, PHOTOSYNTHESIS_STAGES } from '../../packages/simulation-runtime/src/models/photosynthesisJourneyModel';

describe('photosynthesis journey model', () => {
  it('requires all three inputs to make food', () => {
    expect(evaluatePhotosynthesis(['water', 'sunlight']).complete).toBe(false);
    expect(evaluatePhotosynthesis(['water', 'sunlight']).missing).toEqual(['carbon-dioxide']);
    expect(evaluatePhotosynthesis(['water', 'carbon-dioxide', 'sunlight']).complete).toBe(true);
  });

  it('contains the complete root-to-atmosphere story and deterministic quiz', () => {
    expect(PHOTOSYNTHESIS_STAGES).toHaveLength(14);
    expect(evaluatePhotosynthesisQuiz(0, 0)).toBe(true);
    expect(evaluatePhotosynthesisQuiz(0, 1)).toBe(false);
  });
});
