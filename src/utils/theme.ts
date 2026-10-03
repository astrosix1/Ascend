/**
 * Ascend design tokens. Every colour, size, motion and elevation value used by
 * the UI should come from here (see UI_UX_REDESIGN_PLAN.md).
 *
 * Brand: #007DB8 (blue) and #7E9AA6 (slate) are ACCENTS on a #293033 dark
 * background with white text. Contrast is enforced by src/utils/__tests__/theme.test.ts:
 *  - #007DB8 is a FILL (buttons, rings, active states) — it is only ~2.6:1 on
 *    cards, so never use it for text or thin lines on dark; use accentText.
 *  - #7E9AA6 is 4.5:1 on the base background but only 3.9:1 on cards, so it is
 *    textTertiary / decoration; secondary text uses the lighter textSecondary.
 */
export const Colors = {
  dark: {
    background: '#293033',
    surface: '#323A3E',          // cards
    surfaceLight: '#3A444A',     // raised / hover / inputs
    surfaceRaised: '#3A444A',
    text: '#FFFFFF',
    textSecondary: '#A9BCC4',    // AA on surface and raised
    textTertiary: '#7E9AA6',     // brand slate — AA on the base background only
    accent: '#007DB8',           // brand blue — fills (white text on it is 4.5:1)
    accentDark: '#005C88',       // pressed / hover fill
    accentLight: '#007DB833',    // selected / tinted backgrounds
    accentText: '#63BCE8',       // blue for text, links, thin strokes (AA on dark)
    accentSecondary: '#7E9AA6',  // brand slate — icons, dividers, chart series
    accentSecondaryLight: '#7E9AA626',
    textOnAccent: '#FFFFFF',
    textOnDanger: '#1B1010',   // dark text on the soft red fill
    success: '#5FCB9A',
    danger: '#FF7A70',
    warning: '#F2B44A',
    border: '#46525A',
    card: '#323A3E',
  },
  light: {
    background: '#F4F7F8',
    surface: '#FFFFFF',
    surfaceLight: '#EAF0F2',
    surfaceRaised: '#FFFFFF',
    text: '#1B2326',
    textSecondary: '#52707C',
    textTertiary: '#587480',
    accent: '#007DB8',
    accentDark: '#005C88',
    accentLight: '#007DB81F',
    accentText: '#006A9C',
    accentSecondary: '#7E9AA6',
    accentSecondaryLight: '#7E9AA626',
    textOnAccent: '#FFFFFF',
    textOnDanger: '#FFFFFF',
    success: '#177A4C',
    danger: '#C9342B',
    warning: '#A8660A',
    border: '#D5DFE3',
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
  xs: 10,           // Extra small text, tiny labels
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

// ─── New in the redesign ─────────────────────────────────────────────────────

// System stack for now; a loaded display/body pair slots in here later without
// touching call sites.
const SYSTEM_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const FontFamily = {
  body: SYSTEM_STACK,
  display: SYSTEM_STACK,
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/** Semantic text styles — use these instead of ad-hoc fontSize/weight combos. */
export const Typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.4 },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '400' as const },
};

/** Motion: durations (ms), cubic-bezier easing points, and spring presets. */
export const Motion = {
  duration: { instant: 100, quick: 200, standard: 350, slow: 600 },
  easing: {
    standard: [0.2, 0, 0, 1] as [number, number, number, number],     // most transitions
    decelerate: [0, 0, 0, 1] as [number, number, number, number],     // things entering
    accelerate: [0.3, 0, 1, 1] as [number, number, number, number],   // things leaving
  },
  spring: {
    press: { damping: 18, stiffness: 320, mass: 0.6 },   // taps, toggles
    settle: { damping: 20, stiffness: 180, mass: 1 },    // sheets, cards
    celebrate: { damping: 10, stiffness: 140, mass: 0.9 }, // milestone moments
  },
  /** Scale applied while an element is pressed. */
  pressScale: 0.97,
};

/** Elevation levels (RN shadow props + Android elevation). */
export const Elevation = {
  none: {},
  low: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 2 },
  medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.24, shadowRadius: 10, elevation: 5 },
  high: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 24, elevation: 12 },
};

export const ZIndex = {
  base: 0,
  sticky: 10,
  dropdown: 100,
  sheet: 500,
  modal: 1000,
  toast: 9000,
};

/** Minimum interactive target (px) and icon sizes. */
export const Touch = { minTarget: 44 };
export const IconSize = { sm: 16, md: 20, lg: 24, xl: 32 };
