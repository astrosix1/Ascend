import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Motion, Touch } from '../utils/theme';
import { resolveDuration, useReducedMotion, usePressScale } from '../utils/motion';

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Spoken label, e.g. the habit name. */
  label: string;
  size?: number;
  disabled?: boolean;
}

/**
 * The hero control: a tap toggles it and the check fills in immediately
 * (optimistic — never waits on storage or the network). The hit area is at
 * least Touch.minTarget even when the box itself is smaller.
 */
export default function Checkbox({ checked, onChange, label, size = 26, disabled }: CheckboxProps) {
  const { colors } = useApp();
  const reduced = useReducedMotion();
  const fill = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const { animatedStyle, handlers } = usePressScale();

  useEffect(() => {
    Animated.timing(fill, {
      toValue: checked ? 1 : 0,
      duration: resolveDuration(Motion.duration.quick, reduced),
      useNativeDriver: false,
    }).start();
  }, [checked, reduced, fill]);

  const background = fill.interpolate({ inputRange: [0, 1], outputRange: ['transparent', colors.accent] });
  const border = fill.interpolate({ inputRange: [0, 1], outputRange: [colors.accentSecondary, colors.accent] });

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}
      aria-checked={checked}
      hitSlop={Math.max(0, (Touch.minTarget - size) / 2)}
      {...handlers}
    >
      <Animated.View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size / 3, backgroundColor: background, borderColor: border, opacity: disabled ? 0.5 : 1 },
          animatedStyle,
        ]}
      >
        <Animated.Text style={[styles.tick, { color: colors.textOnAccent, fontSize: size * 0.62, opacity: fill }]}>✓</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  box: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { fontWeight: '800' },
});
