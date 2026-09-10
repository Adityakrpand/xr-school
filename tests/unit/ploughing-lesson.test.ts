import { describe, expect, it } from "vitest";
import {
  createPloughingState,
  currentPloughingStage,
  ploughingCanContinue,
  reducePloughing,
} from "../../apps/web/lib/ploughingLesson";

const inspect = (
  state: ReturnType<typeof createPloughingState>,
  ...targets: string[]
) =>
  targets.reduce(
    (next, target) => reducePloughing(next, { type: "inspect", target }),
    state,
  );

describe("ploughing preparation lesson", () => {
  it("requires visible evidence before every stage can advance", () => {
    let state = createPloughingState();
    expect(ploughingCanContinue(state)).toBe(false);
    state = inspect(state, "hard-soil", "farmer");
    expect(ploughingCanContinue(state)).toBe(true);
    state = reducePloughing(state, { type: "next" });
    expect(currentPloughingStage(state).id).toBe("hard-soil");
    state = inspect(state, "soil-clod");
    expect(ploughingCanContinue(state)).toBe(false);
    state = reducePloughing(state, { type: "answer", value: "yes" });
    expect(ploughingCanContinue(state)).toBe(false);
    state = reducePloughing(state, { type: "answer", value: "no" });
    expect(ploughingCanContinue(state)).toBe(true);
  });

  it("completes the full authored investigation and quiz", () => {
    let state = inspect(createPloughingState(), "hard-soil", "farmer");
    state = reducePloughing(state, { type: "next" });
    state = inspect(state, "soil-clod");
    state = reducePloughing(state, { type: "answer", value: "no" });
    state = reducePloughing(state, { type: "next" });
    state = inspect(state, "plough", "bullocks", "turned-soil");
    state = reducePloughing(state, { type: "next" });
    for (let i = 0; i < 3; i++)
      state = reducePloughing(state, { type: "plough-pass" });
    state = inspect(state, "furrow");
    state = reducePloughing(state, { type: "next" });
    state = inspect(state, "tractor", "cultivator");
    state = reducePloughing(state, { type: "answer", value: "tractor" });
    state = reducePloughing(state, { type: "next" });
    state = inspect(state, "roots", "air-spaces", "earthworm", "nutrients");
    state = reducePloughing(state, { type: "next" });
    for (let i = 0; i < 3; i++)
      state = reducePloughing(state, { type: "break-clod" });
    state = reducePloughing(state, { type: "level" });
    state = reducePloughing(state, { type: "next" });
    state = inspect(state, "ready-soil", "seed-bag");
    for (const value of ["loosen", "deep", "cultivator", "bullocks"])
      state = reducePloughing(state, { type: "answer", value });
    expect(ploughingCanContinue(state)).toBe(true);
    state = reducePloughing(state, { type: "next" });
    expect(state.completed).toBe(true);
  });

  it("does not accept hidden or stale interactions", () => {
    const initial = createPloughingState();
    expect(
      reducePloughing(initial, { type: "inspect", target: "tractor" }),
    ).toBe(initial);
    expect(reducePloughing(initial, { type: "plough-pass" })).toBe(initial);
    expect(reducePloughing(initial, { type: "level" })).toBe(initial);
  });

  it("restarts to a clean independent state", () => {
    const changed = inspect(createPloughingState(), "hard-soil");
    const restarted = reducePloughing(changed, { type: "restart" });
    expect(restarted).toEqual(createPloughingState());
    expect(restarted.inspected).not.toBe(changed.inspected);
  });
});
