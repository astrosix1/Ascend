// Simple profanity filter for forum posts
const PROFANITY_LIST = [
  'damn', 'dammit', 'hell', 'crap', 'piss', 'ass', 'asshole',
  'bitch', 'bitches', 'bastard', 'shit', 'fuck', 'fucker',
  'goddamn', 'sonofabitch', 'motherfucker', 'shit',
  'bullshit', 'horseshit', 'apeshit', 'batshit',
  'whore', 'slut', 'dick', 'cock', 'pussy', 'cunt'
];

// Matches whole words, case-insensitive. Two separate regex objects on
// purpose: a global-flagged RegExp's .test() mutates its own lastIndex across
// calls, so reusing one `g`-flagged instance for repeated .test() calls can
// silently return false depending on what text was checked right before it
// (e.g. a short string checked right after a match in a longer one). .replace()
// resets lastIndex itself each call, so it's safe to share the global one.
const wordPattern = `\\b(${PROFANITY_LIST.join('|')})\\b`;
const testRegex = new RegExp(wordPattern, 'i');
const replaceRegex = new RegExp(wordPattern, 'gi');

export function containsProfanity(text: string): boolean {
  return testRegex.test(text);
}

export function censorProfanity(text: string): string {
  return text.replace(replaceRegex, '***');
}

export function getProfanityWarning(): string {
  return 'Please avoid using profanity in your posts. Be respectful to the community.';
}
