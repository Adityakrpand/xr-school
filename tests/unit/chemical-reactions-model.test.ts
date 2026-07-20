import { describe, expect, it } from 'vitest';
import { CHEMICAL_REACTIONS, evaluateReactionAnswer, isBalancedEquation } from '../../packages/simulation-runtime/src/models/chemicalReactionsModel';

describe('chemical reactions lesson model', () => {
  it('defines five distinct experiments with balanced equations and safety guidance', () => {
    expect(CHEMICAL_REACTIONS).toHaveLength(5);
    expect(new Set(CHEMICAL_REACTIONS.map(item => item.type)).size).toBe(5);
    for (const reaction of CHEMICAL_REACTIONS) {
      expect(reaction.steps.length).toBeGreaterThanOrEqual(4);
      expect(reaction.safety.length).toBeGreaterThan(30);
      expect(isBalancedEquation(reaction.equation)).toBe(true);
    }
  });

  it('scores activity questions deterministically', () => {
    expect(evaluateReactionAnswer('magnesium', 0).correct).toBe(true);
    expect(evaluateReactionAnswer('magnesium', 1).correct).toBe(false);
    expect(() => evaluateReactionAnswer('unknown' as never, 0)).toThrow(/Unknown reaction/);
  });
});
