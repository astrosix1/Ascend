import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, BorderRadius } from '../utils/theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  isLoading?: boolean;
}

export default function LoadingSkeleton({
  width = '100%',
  height,
  borderRadius: radius = BorderRadius.sm,
  style,
  isLoading = true,
}: LoadingSkeletonProps) {
  const { colors } = useApp();
  const [shimmerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!isLoading) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.reset();
  }, [isLoading, shimmerAnim]);

  if (!isLoading) {
    return null;
  }

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceLight,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton for stat cards
export function StatCardSkeleton() {
  const { colors } = useApp();

  return (
    <View style={styles.statCard}>
      <LoadingSkeleton height={32} width="60%" style={{ marginBottom: Spacing.sm }} />
      <LoadingSkeleton height={16} width="40%" />
    </View>
  );
}

// Skeleton for post list items
export function PostListItemSkeleton() {
  const { colors } = useApp();

  return (
    <View style={styles.postItem}>
      <LoadingSkeleton height={20} width="80%" style={{ marginBottom: Spacing.sm }} />
      <LoadingSkeleton height={14} width="100%" style={{ marginBottom: Spacing.xs }} />
      <LoadingSkeleton height={14} width="70%" style={{ marginBottom: Spacing.md }} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <LoadingSkeleton height={12} width="30%" />
        <LoadingSkeleton height={12} width="20%" />
      </View>
    </View>
  );
}

// Skeleton for habit row
export function HabitRowSkeleton() {
  const { colors } = useApp();

  return (
    <View style={styles.habitRow}>
      <LoadingSkeleton height={24} width={24} borderRadius={6} style={{ marginRight: Spacing.sm }} />
      <View style={{ flex: 1 }}>
        <LoadingSkeleton height={16} width="70%" style={{ marginBottom: Spacing.xs }} />
        <LoadingSkeleton height={12} width="40%" />
      </View>
      <LoadingSkeleton height={20} width={60} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  statCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postItem: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
