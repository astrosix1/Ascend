/**
 * WCAG Contrast Ratio Checker
 * Verifies that color combinations meet accessibility standards
 */

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;  // 4.5:1 for normal text, 3:1 for large text
  wcagAAA: boolean; // 7:1 for normal text, 4.5:1 for large text
  status: 'pass' | 'fail';
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(x => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio as 1:X format (e.g., 1:21 for white on black)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function checkContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  // WCAG AA: 4.5:1 normal, 3:1 large
  // WCAG AAA: 7:1 normal, 4.5:1 large
  const wcagAA = isLargeText ? ratio >= 3 : ratio >= 4.5;
  const wcagAAA = isLargeText ? ratio >= 4.5 : ratio >= 7;

  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA,
    wcagAAA,
    status: wcagAA ? 'pass' : 'fail',
  };
}

/**
 * Audit all theme colors for dark mode
 */
export function auditDarkModeContrast(): Record<string, ContrastResult> {
  const darkTheme = {
    background: '#0F0F0F',
    surface: '#1A1A1A',
    text: '#F5F5F5',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    accent: '#1ABD7F',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FFB500',
  };

  const results: Record<string, ContrastResult> = {};

  // Primary text on background
  results['text-on-background'] = checkContrast(darkTheme.text, darkTheme.background);
  results['textSecondary-on-background'] = checkContrast(darkTheme.textSecondary, darkTheme.background);
  results['textTertiary-on-background'] = checkContrast(darkTheme.textTertiary, darkTheme.background);

  // Text on surface
  results['text-on-surface'] = checkContrast(darkTheme.text, darkTheme.surface);
  results['textSecondary-on-surface'] = checkContrast(darkTheme.textSecondary, darkTheme.surface);
  results['textTertiary-on-surface'] = checkContrast(darkTheme.textTertiary, darkTheme.surface);

  // Accent colors
  results['accent-on-background'] = checkContrast(darkTheme.accent, darkTheme.background);
  results['accent-on-surface'] = checkContrast(darkTheme.accent, darkTheme.surface);
  results['success-on-surface'] = checkContrast(darkTheme.success, darkTheme.surface);
  results['danger-on-surface'] = checkContrast(darkTheme.danger, darkTheme.surface);
  results['warning-on-surface'] = checkContrast(darkTheme.warning, darkTheme.surface);

  return results;
}

/**
 * Generate a contrast audit report
 */
export function generateContrastReport(): string {
  const results = auditDarkModeContrast();
  const failures = Object.entries(results).filter(([_, r]) => !r.wcagAA);

  let report = '=== DARK MODE CONTRAST AUDIT ===\n\n';

  if (failures.length === 0) {
    report += '✅ All colors meet WCAG AA standards\n';
  } else {
    report += `⚠️  ${failures.length} color combinations fail WCAG AA:\n\n`;
    failures.forEach(([name, result]) => {
      report += `  ❌ ${name}: ${result.ratio}:1 (needs ${result.isLargeText ? 3 : 4.5}:1)\n`;
    });
  }

  report += '\n=== FULL RESULTS ===\n';
  Object.entries(results).forEach(([name, result]) => {
    const status = result.wcagAAA ? '✅✅' : result.wcagAA ? '✅' : '❌';
    report += `${status} ${name}: ${result.ratio}:1\n`;
  });

  return report;
}
