import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface TransitionConfig {
  duration?: number;
  delay?: number;
  useNativeDriver?: boolean;
}

/**
 * Hook for creating smooth fade-in/out transitions
 */
export const useFadeTransition = (isVisible: boolean, config: TransitionConfig = {}) => {
  const {
    duration = 300,
    delay = 0,
    useNativeDriver = true,
  } = config;

  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration,
      delay,
      useNativeDriver,
    }).start();
  }, [isVisible, fadeAnim, duration, delay, useNativeDriver]);

  return fadeAnim;
};

/**
 * Hook for scale animations
 */
export const useScaleTransition = (isActive: boolean, config: TransitionConfig = {}) => {
  const {
    duration = 300,
    delay = 0,
    useNativeDriver = true,
  } = config;

  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.95)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isActive ? 1 : 0.95,
      duration,
      delay,
      useNativeDriver,
    }).start();
  }, [isActive, scaleAnim, duration, delay, useNativeDriver]);

  return scaleAnim;
};

/**
 * Hook for slide animations
 */
export const useSlideTransition = (
  isVisible: boolean,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  config: TransitionConfig = {}
) => {
  const {
    duration = 300,
    delay = 0,
    useNativeDriver = true,
  } = config;

  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : 50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : 50,
      duration,
      delay,
      useNativeDriver,
    }).start();
  }, [isVisible, slideAnim, duration, delay, useNativeDriver]);

  const getTransform = () => {
    const translateValue = slideAnim;
    switch (direction) {
      case 'up':
        return [{ translateY: Animated.multiply(translateValue, -1) }];
      case 'down':
        return [{ translateY: translateValue }];
      case 'left':
        return [{ translateX: Animated.multiply(translateValue, -1) }];
      case 'right':
        return [{ translateX: translateValue }];
      default:
        return [{ translateY: Animated.multiply(translateValue, -1) }];
    }
  };

  return { transform: getTransform() };
};
