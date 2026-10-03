import { resolveDuration, resolvePressScale } from '../motion';
import { Motion } from '../theme';

jest.mock('react-native', () => ({
  Animated: {}, AccessibilityInfo: {}, Platform: { OS: 'web' },
}));

describe('reduced motion helpers', () => {
  it('zeroes durations when reduced motion is on', () => {
    expect(resolveDuration(Motion.duration.standard, true)).toBe(0);
    expect(resolveDuration(Motion.duration.standard, false)).toBe(Motion.duration.standard);
  });

  it('removes press scaling when reduced motion is on', () => {
    expect(resolvePressScale(true)).toBe(1);
    expect(resolvePressScale(false)).toBe(Motion.pressScale);
    expect(Motion.pressScale).toBeLessThan(1);
  });
});
