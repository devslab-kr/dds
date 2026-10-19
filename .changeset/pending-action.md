---
"@devslab/dds-solid": minor
"@devslab/dds-react": minor
---

Add `createPendingAction` (Solid) and `usePendingAction` (React) to track which of a screen's actions is running. Give each button its own key: `is(key)` drives only that button's loading state and `busy` locks the others. `run(key, task)` clears the state when the task settles and ignores a second start while one runs; `{ replace: true }` lets the latest request win instead. The task receives an `AbortSignal` that aborts on `reset()`, on a replacing run and when the component goes away, so screens no longer need their own request counters or mounted flags. Screens that passed one shared flag to every button spun all of them on a single click.
