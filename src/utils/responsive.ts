import { Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { FontSize, FontSizeDesktop, LineHeight as LineHeightValues } from './theme';

// Breakpoint constants
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

// ─── Reactive hook — re-renders the component on resize ──────────────────────
export function useScreenWidth(): number {
  const [width, setWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWidth(window.width));
    return () => sub.remove();
  }, []);
  return width;
}

export const useIsDesktop = (): boolean => useScreenWidth() > BREAKPOINTS.tablet;

// ─── Static helpers (use only outside components / for SSR fallback) ─────────
export const isDesktop = (): boolean => Dimensions.get('window').width > BREAKPOINTS.tablet;
export const isMobile = (): boolean => Dimensions.get('window').width <= BREAKPOINTS.tablet;
export const isTablet = (): boolean => {
  const width = Dimensions.get('window').width;
  return width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet;
};

// Layout constants for desktop
export const SIDEBAR_WIDTH = 240;
export const DESKTOP_MAX_WIDTH = 1400;
export const DESKTOP_PADDING = 24;
export const DESKTOP_GAP = 16;

// Get content width accounting for sidebar
export const getContentWidth = (): number => {
  return Math.max(0, Dimensions.get('window').width - SIDEBAR_WIDTH);
};

// Responsive font size helper
export const getResponsiveFontSize = (mobileSize: keyof typeof FontSize, desktopSize?: keyof typeof FontSizeDesktop): number => {
  return isDesktop() ? FontSizeDesktop[desktopSize || mobileSize] : FontSize[mobileSize];
};

// Line height helper
export const getLineHeight = (type: keyof typeof LineHeightValues): number => {
  return LineHeightValues[type];
};

// Scroll behavior configuration
export const SCROLL_CONFIG = {
  decelerationRate: 0.98,
  snapToInterval: 0,
  scrollEnabled: true,
};

// Animation duration constants (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 400,
  slow: 600,
};
