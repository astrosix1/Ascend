import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BorderRadius } from '../utils/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
}

export default function ProgressBar({ progress, height = 8, color }: ProgressBarProps) {
  const { colors } = useApp();
  const fillColor = color || colors.accent;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height, backgroundColor: colors.surfaceLight }]}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
