export const Colors = {
  dark: {
    background: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceLight: '#252525',
    text: '#F5F5F5',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    accent: '#1ABD7F',        // Brighter emerald for dark mode
    accentDark: '#084D36',
    accentLight: '#1ABD7F25',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FFB500',       // Brighter gold for dark mode
    border: '#2A2A2A',
    card: '#1A1A1A',
  },
  light: {
    background: '#F8F8F8',
    surface: '#FFFFFF',
    surfaceLight: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    accent: '#0A7A5A',        // Deep emerald
    accentDark: '#084D36',
    accentLight: '#F0FAF7',
    success: '#34C759',       // Soft green
    danger: '#FF3B30',        // Soft red
    warning: '#FF9500',       // Gold/amber
    border: '#E8E8E8',        // Light gray
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

// Mobile-first font sizes (refined scale)
export const FontSize = {
  caption: 11,      // Timestamps, hints
  label: 12,        // Button text, badges
  sm: 14,           // Secondary text, captions
  md: 16,           // Standard body text
  lg: 18,           // Primary body text, important content
  xl: 20,           // Heading 3, habit card titles
  xxl: 24,          // Heading 2, section headers
  hero: 32,         // Heading 1, screen titles
};

// Desktop-optimized font sizes (larger for better readability on large screens)
export const FontSizeDesktop = {
  caption: 11,
  label: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 28,          // 15-20% larger than mobile
  hero: 36,         // Heading 1 desktop
};

// Line heights for better readability
export const LineHeight = {
  tight: 1.2,      // For display/hero
  heading: 1.3,    // For headings (600wt)
  normal: 1.5,     // For small text
  body: 1.6,       // For body text (400wt)
  relaxed: 1.7,    // For longer content
  loose: 1.9,      // For emphasized content
};

// Font weights for hierarchy
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,  // For labels
  semibold: '600' as const, // For headings (not 700)
  bold: '800' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,    // Standard card radius
  xl: 24,
  full: 999,
};

// Animation timings (in milliseconds)
export const Animations = {
  fast: 150,        // Quick feedback (tap feedback)
  base: 300,        // Standard transitions (state changes)
  slow: 500,        // Progress animations
  slower: 800,      // Celebration moments
};

// Letter spacing
export const LetterSpacing = {
  default: -0.3,   // Slightly tighter, premium feel
  heading: -0.5,   // Headings, tighter
  caps: 1,         // All caps text
};
