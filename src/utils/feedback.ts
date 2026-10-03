import { Platform } from 'react-native';
import { getData, setData, KEYS } from './storage';

/**
 * One place for non-visual feedback. Call feedback.tap()/success()/milestone()
 * from interaction handlers; it fans out to haptics (native) and an optional,
 * quiet sound (off by default). Visual feedback stays in the components.
 */

let soundEnabled = false;
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  const saved = await getData<boolean>(KEYS.SOUND_ENABLED);
  soundEnabled = saved === true;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export async function loadFeedbackPrefs(): Promise<boolean> {
  await ensureLoaded();
  return soundEnabled;
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  loaded = true;
  soundEnabled = enabled;
  await setData(KEYS.SOUND_ENABLED, enabled);
}

type HapticKind = 'light' | 'success' | 'warning';

async function haptic(kind: HapticKind) {
  if (Platform.OS === 'web') return; // web gets visual feedback only
  try {
    const H = await import('expo-haptics');
    if (kind === 'light') await H.impactAsync(H.ImpactFeedbackStyle.Light);
    else await H.notificationAsync(
      kind === 'success' ? H.NotificationFeedbackType.Success : H.NotificationFeedbackType.Warning
    );
  } catch {
    /* haptics are best-effort */
  }
}

let audioCtx: any = null;
/** Soft sine notes, ~0.12 volume. Only ever runs after the user opts in. */
function chime(freqs: number[]) {
  if (!soundEnabled || Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const t0 = audioCtx.currentTime;
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = t0 + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    /* sound is best-effort */
  }
}

export const feedback = {
  /** A light acknowledgement (toggle off, small action). */
  tap() {
    ensureLoaded();
    haptic('light');
  },
  /** A completed action (habit done). */
  success() {
    ensureLoaded().then(() => chime([660, 880]));
    haptic('success');
  },
  /** A milestone (streak milestone, all habits done, level up). */
  milestone() {
    ensureLoaded().then(() => chime([523, 659, 784, 1047]));
    haptic('success');
  },
  warning() {
    haptic('warning');
  },
};
