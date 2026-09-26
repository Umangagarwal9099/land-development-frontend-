export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Resolves when the promise settles or after `ms`, whichever comes first (camera moves can be interrupted). */
export const settle = (p: Promise<unknown>, ms: number) => Promise.race([p.catch(() => undefined), wait(ms)])
