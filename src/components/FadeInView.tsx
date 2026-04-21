import React, { useEffect, useState } from 'react';
import { View, Animated, ViewProps } from 'react-native';

interface FadeInViewProps extends ViewProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

export default function FadeInView({
  delay = 0,
  duration = 400,
  children,
  style,
  ...props
}: FadeInViewProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      {...props}
      style={[style, { opacity: fadeAnim }]}
    >
      {children}
    </Animated.View>
  );
}

// Staggered fade-in for multiple children
interface StaggeredFadeInProps extends ViewProps {
  itemDelay?: number;
  staggerDelay?: number;
  duration?: number;
  children: React.ReactNode[];
}

export function StaggeredFadeIn({
  itemDelay = 0,
  staggerDelay = 100,
  duration = 400,
  children,
  style,
  ...props
}: StaggeredFadeInProps) {
  return (
    <View {...props} style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeInView
          key={index}
          delay={itemDelay + index * staggerDelay}
          duration={duration}
        >
          {child}
        </FadeInView>
      ))}
    </View>
  );
}
