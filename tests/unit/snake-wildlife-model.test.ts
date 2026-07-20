import { describe, expect, it } from 'vitest';
import { evaluateSnakeQuiz, SNAKE_PROFILES, SNAKE_QUIZ } from '../../packages/simulation-runtime/src/models/snakeWildlifeModel';

describe('snake wildlife lesson model', () => {
  it('covers five Indian snakes with safe observation and conservation guidance', () => {
    expect(SNAKE_PROFILES).toHaveLength(5);
    expect(SNAKE_PROFILES.filter(snake => snake.venomous)).toHaveLength(3);
    expect(SNAKE_PROFILES.filter(snake => !snake.venomous)).toHaveLength(2);
    for (const snake of SNAKE_PROFILES) {
      expect(snake.averageLengthM).toBeGreaterThan(0);
      expect(snake.conservation.length).toBeGreaterThan(30);
    }
  });

  it('scores all quiz questions deterministically', () => {
    expect(SNAKE_QUIZ).toHaveLength(4);
    for (let index = 0; index < SNAKE_QUIZ.length; index += 1) {
      expect(evaluateSnakeQuiz(index, 0)).toBe(true);
      expect(evaluateSnakeQuiz(index, 1)).toBe(false);
    }
  });
});
