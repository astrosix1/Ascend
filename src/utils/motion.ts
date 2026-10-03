import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, AccessibilityInfo, Platform } from 'react-native';
import { Motion } from './theme';

/** Duration to actually use: 0 when the user prefers reduced motion. */
export function resolveDuration(ms: number, reduced: boolean): number {
  return reduced ? 0 : ms;
}

/** Scale applied while pressed: none under reduced motion. */
export function resolvePressScale(reduced: boolean): number {
  return reduced ? 1 : Motion.pressScale;
}

/** True when the OS / browser asks for reduced motion. Updates live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduced(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }

    AccessibilityInfo.isReduceMotionEnabled().then(v => alive && setReduced(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => alive && setReduced(v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}

/**
 * Tactile press feedback: springs an element down to Motion.pressScale on
 * press-in and back on release. Spread `handlers` onto a Pressable and apply
 * `animatedStyle` to an Animated.View.
 */
export function usePressScale() {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const to = useCallback((value: number) => {
    if (reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: value,
      damping: Motion.spring.press.damping,
      stiffness: Motion.spring.press.stiffness,
      mass: Motion.spring.press.mass,
      useNativeDriver: true,
    }).start();
  }, [reduced, scale]);

  return {
    animatedStyle: { transform: [{ scale }] },
    handlers: {
      onPressIn: () => to(resolvePressScale(reduced)),
      onPressOut: () => to(1),
    },
  };
}
