import React, { ReactNode, useState } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BorderRadius, Spacing } from '../utils/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  interactive?: boolean;
  onPress?: () => void;
}

export default function Card({ children, style, interactive = false, onPress }: CardProps) {
  const { colors } = useApp();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [elevationAnim] = useState(new Animated.Value(1));

  const handleHoverIn = () => {
    if (!interactive) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.01,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 3,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleHoverOut = () => {
    if (!interactive) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatedStyle = interactive
    ? {
        transform: [{ scale: scaleAnim }],
        elevation: elevationAnim,
      }
    : {};

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        animatedStyle,
        style,
      ]}
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,  // 16px for minimal design
    padding: Spacing.md,             // 16px padding — tighter, more organized
    marginBottom: Spacing.sm,        // 8px bottom margin — tighter card stack
    borderWidth: 1,                  // Visible border for clear definition
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});
