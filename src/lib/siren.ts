import { audioContext, unlockAudio } from './sound';

/**
 * Emergency siren made with Web Audio: a tone that sweeps up and down
 * (about 650–1250 Hz, once every 2 seconds) and loops until stop().
 */
let nodes: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
let buzz: ReturnType<typeof setInterval> | null = null;

/** Android vibration: long-short-long, repeated while the siren plays. */
const VIBRATE = [700, 300, 700, 300, 700];

export function startSiren(): boolean {
  stopSiren();
  unlockAudio(); // works if this runs during a tap; otherwise uses the earlier unlock
  const ctx = audioContext();
  if (ctx) {
    try {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 950;

      // Slow triangle wave pushes the pitch up and down (the "wail").
      const lfo = ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.value = 0.5;
      const depth = ctx.createGain();
      depth.gain.value = 300;
      lfo.connect(depth).connect(osc.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);

      osc.start();
      lfo.start();
      nodes = { osc, lfo, gain };
    } catch {
      nodes = null;
    }
  }

  if ('vibrate' in navigator) {
    navigator.vibrate(VIBRATE);
    buzz = setInterval(() => navigator.vibrate(VIBRATE), 4000);
  }
  return nodes !== null && ctx?.state === 'running';
}

export function stopSiren(): void {
  if (buzz) clearInterval(buzz);
  buzz = null;
  if ('vibrate' in navigator) navigator.vibrate(0);
  if (!nodes) return;
  const { osc, lfo, gain } = nodes;
  nodes = null;
  try {
    const ctx = audioContext();
    const t = ctx?.currentTime ?? 0;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    osc.stop(t + 0.2);
    lfo.stop(t + 0.2);
  } catch {
    /* already stopped */
  }
}

/** System notification (shows even when the app is in the background). */
export async function notify(title: string, body: string, tag = 'nec-alert'): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // A new tag per level, so Danger still alerts after an Early warning.
  const options: NotificationOptions = { body, tag, icon: '/icon.svg', requireInteraction: true };
  try {
    // Android Chrome only allows notifications through the service worker.
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, options));
    new Notification(title, options);
  } catch {
    /* notifications not possible here; the on-screen alert still shows */
  }
}
