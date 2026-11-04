/*
 * Heavy one-off work (building a model in code takes from tens to hundreds of milliseconds) runs
 * one job per idle period, never several in the same frame, so animations and input keep their
 * frames while the work catches up.
 */

const queue: (() => void)[] = []
let pending = false

// Safari has no requestIdleCallback; a short timeout still yields to rendering and input.
const schedule = (run: () => void) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 50)

function next() {
  pending = false
  const job = queue.shift()
  if (!job) return
  job()
  if (queue.length) {
    pending = true
    schedule(next)
  }
}

/** Queues `job` for an idle moment of its own; the returned function withdraws it if not yet run. */
export function whenIdle(job: () => void): () => void {
  queue.push(job)
  if (!pending) {
    pending = true
    schedule(next)
  }
  return () => {
    const i = queue.indexOf(job)
    if (i >= 0) queue.splice(i, 1)
  }
}
