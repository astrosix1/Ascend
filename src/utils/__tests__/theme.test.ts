import { Colors, Typography, Motion } from '../theme';
import { getContrastRatio } from '../contrastChecker';

const AA = 4.5;

describe('theme tokens', () => {
  it('light and dark define exactly the same keys', () => {
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });

  it('uses the brand palette', () => {
    expect(Colors.dark.background).toBe('#293033');
    expect(Colors.dark.accent).toBe('#007DB8');
    expect(Colors.dark.accentSecondary).toBe('#7E9AA6');
    expect(Colors.dark.text).toBe('#FFFFFF');
  });
});

describe('dark theme contrast (WCAG AA)', () => {
  const c = Colors.dark;
  const textOnSurfaces: Array<[string, string, string]> = [
    ['text on background', c.text, c.background],
    ['text on surface', c.text, c.surface],
    ['text on raised', c.text, c.surfaceLight],
    ['textSecondary on background', c.textSecondary, c.background],
    ['textSecondary on surface', c.textSecondary, c.surface],
    ['textSecondary on raised', c.textSecondary, c.surfaceLight],
    ['accentText on background', c.accentText, c.background],
    ['accentText on surface', c.accentText, c.surface],
    ['textOnAccent on accent fill', c.textOnAccent, c.accent],
    ['textOnDanger on danger fill', c.textOnDanger, c.danger],
    ['success on surface', c.success, c.surface],
    ['danger on surface', c.danger, c.surface],
    ['warning on surface', c.warning, c.surface],
    // brand slate is only guaranteed on the base background
    ['textTertiary (brand slate) on background', c.textTertiary, c.background],
  ];

  it.each(textOnSurfaces)('%s >= 4.5', (_name, fg, bg) => {
    expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it('documents that raw brand blue is NOT for text on dark', () => {
    expect(getContrastRatio(c.accent, c.background)).toBeLessThan(AA);
  });
});

describe('light theme contrast (WCAG AA)', () => {
  const c = Colors.light;
  it.each([
    ['text on background', c.text, c.background],
    ['text on surface', c.text, c.surface],
    ['textSecondary on surface', c.textSecondary, c.surface],
    ['accentText on surface', c.accentText, c.surface],
    ['textOnAccent on accent fill', c.textOnAccent, c.accent],
    ['success on surface', c.success, c.surface],
    ['danger on surface', c.danger, c.surface],
    ['warning on surface', c.warning, c.surface],
    ['textOnDanger on danger fill', c.textOnDanger, c.danger],
  ])('%s >= 4.5', (_name, fg, bg) => {
    expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});

describe('typography and motion', () => {
  it('typography lines are taller than their font size', () => {
    Object.values(Typography).forEach(t => expect(t.lineHeight).toBeGreaterThan(t.fontSize));
  });

  it('motion durations increase and taps respond fast', () => {
    const d = Motion.duration;
    expect(d.instant).toBeLessThan(d.quick);
    expect(d.quick).toBeLessThan(d.standard);
    expect(d.standard).toBeLessThan(d.slow);
    expect(d.instant).toBeLessThanOrEqual(100);
  });
});
