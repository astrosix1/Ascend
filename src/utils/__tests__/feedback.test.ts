const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (k in mockStore ? mockStore[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => { mockStore[k] = v; }),
    removeItem: jest.fn(async (k: string) => { delete mockStore[k]; }),
  },
}));
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { feedback, isSoundEnabled, setSoundEnabled, loadFeedbackPrefs } from '../feedback';

describe('feedback', () => {
  const createOscillator = jest.fn(() => ({ type: '', frequency: { value: 0 }, connect: jest.fn(), start: jest.fn(), stop: jest.fn() }));
  const createGain = jest.fn(() => ({ gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }, connect: jest.fn() }));

  beforeEach(() => {
    (global as any).window = {
      AudioContext: jest.fn(() => ({ currentTime: 0, destination: {}, createOscillator, createGain })),
    };
    createOscillator.mockClear();
  });
  afterAll(() => { delete (global as any).window; });

  it('is silent by default', async () => {
    await loadFeedbackPrefs();
    expect(isSoundEnabled()).toBe(false);
    feedback.success();
    await new Promise(r => setTimeout(r, 0));
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('plays notes only after the user opts in, and remembers the choice', async () => {
    await setSoundEnabled(true);
    expect(JSON.parse(mockStore['ascend_sound_enabled'])).toBe(true);
    feedback.success();
    await new Promise(r => setTimeout(r, 0));
    expect(createOscillator).toHaveBeenCalledTimes(2);
    feedback.milestone();
    await new Promise(r => setTimeout(r, 0));
    expect(createOscillator).toHaveBeenCalledTimes(6);
    await setSoundEnabled(false);
  });

  it('never throws without audio support', async () => {
    (global as any).window = {};
    await setSoundEnabled(true);
    expect(() => feedback.success()).not.toThrow();
    await setSoundEnabled(false);
  });
});
