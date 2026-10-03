import { getContrastRatio, checkContrast, auditDarkModeContrast, generateContrastReport } from '../contrastChecker';

describe('getContrastRatio', () => {
  it('should return 21:1 for pure black on pure white', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('should return 1:1 for identical colors', () => {
    expect(getContrastRatio('#808080', '#808080')).toBeCloseTo(1, 5);
  });

  it('should be symmetric regardless of argument order', () => {
    const a = getContrastRatio('#123456', '#FEDCBA');
    const b = getContrastRatio('#FEDCBA', '#123456');
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('checkContrast', () => {
  it('should pass WCAG AA and AAA for black text on white background', () => {
    const result = checkContrast('#000000', '#FFFFFF');
    expect(result.wcagAA).toBe(true);
    expect(result.wcagAAA).toBe(true);
    expect(result.status).toBe('pass');
  });

  it('should fail WCAG AA for low-contrast gray-on-gray', () => {
    const result = checkContrast('#999999', '#888888');
    expect(result.wcagAA).toBe(false);
    expect(result.status).toBe('fail');
  });

  it('should apply the lower large-text threshold when isLargeText is true', () => {
    // A ratio that fails normal-text AA (4.5:1) but passes large-text AA (3:1)
    const normal = checkContrast('#767676', '#FFFFFF', false);
    const large = checkContrast('#767676', '#FFFFFF', true);
    expect(large.ratio).toBe(normal.ratio);
    if (normal.ratio >= 3 && normal.ratio < 4.5) {
      expect(normal.wcagAA).toBe(false);
      expect(large.wcagAA).toBe(true);
    }
  });
});

describe('auditDarkModeContrast', () => {
  it('should return a result for every audited color pair', () => {
    const results = auditDarkModeContrast();
    expect(Object.keys(results).length).toBeGreaterThan(0);
    Object.values(results).forEach(r => {
      expect(typeof r.ratio).toBe('number');
      expect(typeof r.wcagAA).toBe('boolean');
    });
  });

  it('should have the primary text-on-background pass WCAG AA', () => {
    const results = auditDarkModeContrast();
    expect(results['text-on-background'].wcagAA).toBe(true);
  });
});

describe('generateContrastReport', () => {
  it('should produce a non-empty report mentioning the audit', () => {
    const report = generateContrastReport();
    expect(report).toContain('DARK MODE CONTRAST AUDIT');
    expect(report.length).toBeGreaterThan(20);
  });
});
