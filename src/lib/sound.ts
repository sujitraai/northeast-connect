/**
 * Sound for the siren, kept separate from location and notifications.
 *
 * Browsers only allow sound after a tap. We unlock it on ANY tap in the app
 * (not only "Turn on alerts"), and again whenever the phone suspends audio,
 * e.g. iPhone after the app was in the background.
 *
 * iPhone Safari only counts `touchend` / `click` as a tap that may start
 * sound (not `pointerdown` / `touchstart`), so those are the events used.
 */
let ctx: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  return ctx;
}

/** True when sound can play right now. */
export const soundReady = (): boolean => ctx?.state === 'running';

/** Can this phone vibrate? (iPhone: no.) */
export const canVibrate = (): boolean => typeof navigator.vibrate === 'function';

export function unlockAudio(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    // Safari 17+: play like a media app, so the siren is not muted by the ring/silent switch.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';

    ctx ??= new AC();
    if (ctx.state !== 'running') void ctx.resume();
    // A silent, one-sample sound completes the unlock on iPhone Safari.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    /* no sound on this device; alerts still show on screen */
  }
}

let installed = false;

/** Call once at start-up: every tap keeps sound unlocked. */
export function installSoundUnlock(): void {
  if (installed) return;
  installed = true;
  const onTap = () => {
    if (!soundReady()) unlockAudio();
  };
  for (const ev of ['touchend', 'click', 'keydown'] as const) {
    window.addEventListener(ev, onTap, { capture: true, passive: true });
  }
  // Coming back to the app: try to resume (works where the browser allows it without a tap).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
  });
}
