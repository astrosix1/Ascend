// Simple profanity filter for forum posts
const PROFANITY_LIST = [
  'damn', 'dammit', 'hell', 'crap', 'piss', 'ass', 'asshole',
  'bitch', 'bitches', 'bastard', 'shit', 'fuck', 'fucker',
  'goddamn', 'sonofabitch', 'motherfucker', 'shit',
  'bullshit', 'horseshit', 'apeshit', 'batshit',
  'whore', 'slut', 'dick', 'cock', 'pussy', 'cunt'
];

// Create a regex that matches whole words (case-insensitive)
const profanityRegex = new RegExp(`\\b(${PROFANITY_LIST.join('|')})\\b`, 'gi');

export function containsProfanity(text: string): boolean {
  return profanityRegex.test(text);
}

export function censorProfanity(text: string): string {
  return text.replace(profanityRegex, '***');
}

export function getProfanityWarning(): string {
  return 'Please avoid using profanity in your posts. Be respectful to the community.';
}
