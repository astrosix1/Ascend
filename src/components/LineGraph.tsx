import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useApp } from '../contexts/AppContext';
import { FontSize, Spacing } from '../utils/theme';

interface LineGraphProps {
  data: number[];       // values 0-100
  labels: string[];
  height?: number;
  showDots?: boolean;
  paddingHorizontal?: number;
}

export default function LineGraph({ data, labels, height = 140, showDots = true, paddingHorizontal = Spacing.md }: LineGraphProps) {
  const { colors } = useApp();

  const padH = paddingHorizontal;
  const padV = 16;
  const graphWidth = 800;
  const graphHeight = height;
  const innerW = graphWidth - padH * 2;
  const innerH = graphHeight - padV * 2;

  const n = data.length;
  if (n < 2) return null;

  const maxVal = 100;

  // Map data points to SVG coordinates
  const points = data.map((v, i) => ({
    x: padH + (i / (n - 1)) * innerW,
    y: padV + innerH - (v / maxVal) * innerH,
  }));

  // Build a smooth cubic bezier path through the points
  const buildPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // Close path for gradient fill
  const buildFillPath = (pts: { x: number; y: number }[]) => {
    const linePath = buildPath(pts);
    const bottom = padV + innerH;
    return `${linePath} L ${pts[pts.length - 1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
  };

  const linePath = buildPath(points);
  const fillPath = buildFillPath(points);

  return (
    <View style={{ width: '100%' }}>
      <Svg
        width="100%"
        height={graphHeight + 20}
        viewBox={`0 0 ${graphWidth} ${graphHeight + 20}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Gradient fill */}
        <Path d={fillPath} fill="url(#areaGrad)" />

        {/* The line itself */}
        <Path
          d={linePath}
          stroke={colors.accent}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + values */}
        {showDots && points.map((pt, i) => (
          <React.Fragment key={i}>
            <Circle cx={pt.x} cy={pt.y} r={4} fill={colors.accent} />
            <Circle cx={pt.x} cy={pt.y} r={2} fill={colors.background} />
            {/* value label above dot */}
            {data[i] > 0 && (
              // Using a simple rect + foreignObject isn't needed — render labels outside SVG
              null
            )}
          </React.Fragment>
        ))}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          const x = padH + (i / (n - 1)) * innerW;
          return (
            <React.Fragment key={`lbl-${i}`}>
              {/* tick mark */}
              <Path
                d={`M ${x} ${padV + innerH} L ${x} ${padV + innerH + 4}`}
                stroke={colors.border}
                strokeWidth="1"
              />
            </React.Fragment>
          );
        })}

        {/* baseline */}
        <Path
          d={`M ${padH} ${padV + innerH} L ${graphWidth - padH} ${padV + innerH}`}
          stroke={colors.border}
          strokeWidth="1"
        />
      </Svg>

      {/* X labels below (React Native Text is cleaner than SVG text for custom fonts) */}
      <View style={[styles.labelRow, { paddingHorizontal: padH }]}>
        {labels.map((label, i) => (
          <Text key={i} style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  label: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
