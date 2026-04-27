import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useApp } from '../contexts/AppContext';
import { FontSize, FontSizeDesktop, Spacing, FontWeight, LineHeight } from '../utils/theme';
import { useIsDesktop } from '../utils/responsive';

interface DailyProgressRingProps {
  completed: number;
  total: number;
  size?: 'small' | 'medium' | 'large';
}

export default function DailyProgressRing({ completed, total, size = 'medium' }: DailyProgressRingProps) {
  const { colors } = useApp();
  const desktop = useIsDesktop();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setAnimatedProgress(total > 0 ? (completed / total) * 100 : 0);
  }, [completed, total]);

  const sizeConfigs = {
    small: { diameter: 100, ringWidth: 6 },
    medium: { diameter: 140, ringWidth: 8 },
    large: { diameter: 200, ringWidth: 10 },
  };

  const config = sizeConfigs[size];
  const radius = config.diameter / 2 - config.ringWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedProgress / 100);

  const textSize = size === 'small' ? FontSize.lg : size === 'medium' ? FontSize.xxl : FontSize.hero;
  const labelSize = size === 'small' ? FontSize.sm : FontSize.md;

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Svg
          width={config.diameter}
          height={config.diameter}
          viewBox={`0 0 ${config.diameter} ${config.diameter}`}
          style={styles.svg}
        >
          <G rotation="-90" origin={`${config.diameter / 2}, ${config.diameter / 2}`}>
            {/* Background ring */}
            <Circle
              cx={config.diameter / 2}
              cy={config.diameter / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={config.ringWidth}
              fill="none"
            />
            {/* Progress ring */}
            <Circle
              cx={config.diameter / 2}
              cy={config.diameter / 2}
              r={radius}
              stroke={colors.accent}
              strokeWidth={config.ringWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>

        {/* Center text */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.percentage,
            {
              fontSize: textSize,
              color: completed === total && total > 0 ? colors.accent : colors.text,
              fontWeight: FontWeight.semibold,
              lineHeight: textSize * LineHeight.tight,
            }
          ]}>
            {total > 0 ? `${completed}/${total}` : '—'}
          </Text>
          <Text style={[
            styles.label,
            {
              fontSize: labelSize,
              color: colors.textSecondary,
              fontWeight: FontWeight.regular,
            }
          ]}>
            {total > 0 ? 'completed' : 'no habits yet'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    textAlign: 'center',
  },
  label: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
