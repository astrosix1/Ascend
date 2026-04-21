export const Colors = {
  dark: {
    background: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceLight: '#252525',
    text: '#F0F0F0',
    textSecondary: '#8A8A8A',
    accent: '#F5A623',
    accentLight: '#F5A62325',
    success: '#4CAF50',
    danger: '#E57373',
    warning: '#FFB74D',
    border: '#2A2A2A',
    card: '#1A1A1A',
  },
  light: {
    background: '#F8F8F8',
    surface: '#FFFFFF',
    surfaceLight: '#F0F0F0',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    accent: '#F5A623',
    accentLight: '#F5A62320',
    success: '#4CAF50',
    danger: '#E57373',
    warning: '#FFB74D',
    border: '#E5E5E5',
    card: '#FFFFFF',
  },
};

export type ThemeColors = typeof Colors.dark;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Mobile-first font sizes
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

// Desktop-optimized font sizes (larger for better readability on large screens)
export const FontSizeDesktop = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 40,
};

// Line heights for better readability
export const LineHeight = {
  tight: 1.3,      // For headings
  normal: 1.5,     // For body text
  relaxed: 1.7,    // For longer content
  loose: 1.9,      // For emphasized content
};

// Font weights for hierarchy
export const FontWeight = {
  regular: '400' as const,
  medium: '600' as const,
  semibold: '700' as const,
  bold: '800' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
