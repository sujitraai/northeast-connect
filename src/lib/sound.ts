/**
 * Browsers only allow sound after the person taps something. The alert
 * siren (feature 6) needs an unlocked AudioContext, so we unlock it on the
 * "Turn on alerts" tap and again on the first tap of every visit.
 */
let ctx: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  return ctx;
}

export function unlockAudio(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    // A silent, one-sample sound completes the unlock on iOS Safari.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    /* no sound on this device; alerts still show on screen */
  }
}

/** Unlocks sound on the first tap of this visit (if alerts are on). */
export function unlockOnFirstTap(): () => void {
  const once = () => unlockAudio();
  window.addEventListener('pointerdown', once, { once: true, capture: true });
  return () => window.removeEventListener('pointerdown', once, { capture: true });
}
