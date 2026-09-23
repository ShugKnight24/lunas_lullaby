/**
 * Tutorial progress `{ step, done }` over a step list: an event only counts
 * when it matches the current step, so the tasks go in order.
 */

/** `{ tut, finished }` where finished is true on the event that completes the list. */
export function tutorialEvent(tut, steps, event) {
  if (tut.done || steps[tut.step]?.event !== event) return { tut, finished: false };
  const step = tut.step + 1;
  const done = step >= steps.length;
  return { tut: { step, done }, finished: done };
}

export const skipTutorial = (tut, steps) => ({ step: steps.length, done: true });
