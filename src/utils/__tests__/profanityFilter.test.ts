import { containsProfanity, censorProfanity, getProfanityWarning } from '../profanityFilter';

describe('containsProfanity', () => {
  it('should detect a profane word on its own', () => {
    expect(containsProfanity('that is bullshit')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(containsProfanity('this is SHIT')).toBe(true);
  });

  it('should return false for clean text', () => {
    expect(containsProfanity('I completed my habit streak today!')).toBe(false);
  });

  it('should only match whole words, not substrings', () => {
    // "class" contains "ass" but is not profanity; "assessment" too.
    expect(containsProfanity('I have a class today')).toBe(false);
    expect(containsProfanity('grading my assessment')).toBe(false);
  });

  it('should return false for empty text', () => {
    expect(containsProfanity('')).toBe(false);
  });

  it('should give consistent results across repeated calls (regression: stateful global regex)', () => {
    // A previous implementation shared one `g`-flagged RegExp across calls and
    // used it with .test(), which mutates lastIndex — a match in one call
    // could make an unrelated, shorter later call incorrectly return false.
    expect(containsProfanity('shit happens today')).toBe(true);
    expect(containsProfanity('shit')).toBe(true);
    expect(containsProfanity('shit')).toBe(true);
    expect(containsProfanity('this is clean text')).toBe(false);
    expect(containsProfanity('damn')).toBe(true);
  });
});

describe('censorProfanity', () => {
  it('should replace a profane word with asterisks', () => {
    expect(censorProfanity('this is damn hard')).toBe('this is *** hard');
  });

  it('should leave clean text unchanged', () => {
    const clean = 'Day 12 of my streak, feeling great.';
    expect(censorProfanity(clean)).toBe(clean);
  });

  it('should censor multiple occurrences', () => {
    expect(censorProfanity('damn this damn thing')).toBe('*** this *** thing');
  });
});

describe('getProfanityWarning', () => {
  it('should return a non-empty warning string', () => {
    expect(getProfanityWarning().length).toBeGreaterThan(0);
  });
});
