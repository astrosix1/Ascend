/**
 * Temptation Advice Database
 * Provides habit-specific advice when users feel tempted to engage in bad habits
 * Organized by common bad habit categories
 */

export const TEMPTATION_ADVICE: Record<string, string[]> = {
  // Smoking/Nicotine
  'smoking': [
    '💨 Take a 5-minute walk outside',
    '🚶 Do some light exercise or stretching',
    '🧊 Chew sugar-free gum or mints',
    '💧 Drink a glass of cold water slowly',
    '🎵 Listen to an energizing song',
    '📱 Call or text a friend for support',
    '✏️ Write down 3 reasons why you want to quit',
    '🧘 Practice a 2-minute breathing exercise',
    '🍎 Eat a healthy snack like an apple',
    '🎮 Play a quick mobile game to distract yourself',
  ],

  // Social Media Addiction
  'social-media': [
    '📚 Read a chapter of a book',
    '🎨 Draw, doodle, or create something',
    '🏃 Do 10 minutes of exercise',
    '🌳 Go outside and breathe fresh air',
    '☕ Make a cup of tea and sit quietly',
    '🎵 Listen to a podcast or audiobook',
    '✍️ Journal about your thoughts and feelings',
    '🧩 Solve a puzzle or play a strategic game',
    '📞 Call a friend instead of scrolling',
    '🧘 Meditate for 5 minutes',
  ],

  // Caffeine/Coffee Addiction
  'caffeine': [
    '💧 Drink plenty of water',
    '😴 Take a 15-minute power nap',
    '🧘 Practice deep breathing exercises',
    '🍌 Eat a banana for natural energy',
    '🚶 Take a short walk for fresh air and energy',
    '🎵 Listen to upbeat music',
    '💪 Do some light stretching or yoga',
    '🌬️ Get some fresh air and sunlight',
    '☀️ Spend time in natural light',
    '🥤 Switch to herbal tea instead',
  ],

  // Alcohol/Drinks
  'alcohol': [
    '💧 Drink a glass of water first',
    '🍎 Eat a nutritious meal or snack',
    '🏃 Exercise or go for a run',
    '📱 Text a friend in recovery or a support buddy',
    '🎵 Listen to calming or energizing music',
    '🧘 Practice meditation or yoga',
    '📖 Read an inspiring book or recovery story',
    '🏘️ Go to a public place (library, cafe)',
    '🎮 Play a video game or puzzle',
    '✍️ Write a journal entry about your goals',
  ],

  // Junk Food/Overeating
  'junk-food': [
    '💧 Drink a glass of water (sometimes thirst feels like hunger)',
    '🥕 Eat a healthy snack (veggies, fruit, nuts)',
    '🚶 Take a walk to let the urge pass',
    '🧘 Practice mindful eating if you do eat',
    '✍️ Journal about your feelings (emotional eating?)',
    '🎵 Listen to a favorite song',
    '💪 Do some exercise or stretching',
    '🧊 Brush your teeth (makes food less appealing)',
    '📱 Call someone to chat and stay accountable',
    '🌳 Go outside to clear your head',
  ],

  // Video Games/Gaming Addiction
  'video-games': [
    '📚 Read a book or graphic novel',
    '🚶 Go for a walk or outdoor activity',
    '🎨 Do a creative activity (art, music, writing)',
    '🏃 Play a physical sport or exercise',
    '👥 Hang out with friends in person',
    '🧩 Solve puzzles or do brain teasers',
    '🎬 Watch a movie or show (with a timer)',
    '📱 Call a friend and have a real conversation',
    '💼 Work on a hobby or personal project',
    '🧘 Meditate or practice mindfulness',
  ],

  // Shopping/Spending
  'shopping': [
    '🛑 Leave your wallet at home or delete saved card info',
    '⏰ Wait 24 hours before any purchase (cooling-off period)',
    '📝 Make a list of only what you need',
    '💰 Calculate: is this worth the hours of work?',
    '📱 Message a friend and ask: "Do I really need this?"',
    '🎯 Review your financial goals',
    '🚶 Go for a walk to let the urge pass',
    '✍️ Write down why you want to buy this',
    '🏦 Check your savings goal progress instead',
    '💡 Unsubscribe from marketing emails and sales notifications',
  ],

  // Procrastination
  'procrastination': [
    '⏱️ Set a timer for just 5 minutes and start',
    '✂️ Break the task into smaller, easier steps',
    '📝 Write down exactly what you need to do',
    '🎯 Focus on the first small step only',
    '📱 Tell someone you\'re about to do it (accountability)',
    '🎵 Play energizing music while working',
    '☕ Prepare your workspace and get comfortable',
    '💪 Remind yourself how good it feels to finish',
    '🏃 Take a quick walk to build momentum',
    '📊 Track your progress visually',
  ],

  // Negative Self-Talk/Anxiety
  'anxiety': [
    '🧘 Practice a grounding exercise (5-4-3-2-1 senses)',
    '💨 Do deep breathing (4-7-8 breathing technique)',
    '🗣️ Challenge the thought: Is this really true?',
    '✍️ Write down your worries and release them',
    '🤗 Practice self-compassion like you\'d treat a friend',
    '🎵 Listen to calming or uplifting music',
    '🌳 Go outside and connect with nature',
    '💪 Remind yourself: "I have overcome hard things before"',
    '📱 Reach out to someone who supports you',
    '🏃 Exercise to release stress hormones',
  ],

  // Sleep Avoidance/Late Night Scrolling
  'sleep': [
    '📱 Put your phone in another room right now',
    '💤 Set a consistent bedtime and stick to it',
    '🛏️ Create a relaxing bedtime routine',
    '📖 Read a physical book or magazine',
    '🧘 Try a guided meditation or sleep story',
    '💨 Practice progressive muscle relaxation',
    '🌙 Dim the lights and keep the room cool',
    '☕ Avoid caffeine after 2 PM',
    '🎵 Listen to calming music or white noise',
    '🚫 Use app blockers to prevent late-night scrolling',
  ],

  // Smoking Weed/Cannabis
  'weed': [
    '💧 Drink lots of water and stay hydrated',
    '🏃 Go for a run or exercise intensely',
    '👥 Spend time with supportive friends (not in smoking environments)',
    '🎨 Do a creative activity you love',
    '📚 Read or listen to audiobooks',
    '🧘 Practice meditation and grounding exercises',
    '📱 Call a sponsor or accountability partner',
    '🎮 Play games that require focus and skill',
    '✍️ Journal about your recovery goals',
    '🏘️ Go to a public place where you can\'t use',
  ],

  // Porn/Sexual Addiction
  'porn': [
    '🚪 Leave the room where you\'d typically act out',
    '💧 Take a cold shower',
    '🏃 Do intense exercise (run, gym, sports)',
    '👥 Go to a public place or be around others',
    '📱 Reach out to a therapist, sponsor, or support group',
    '📚 Read recovery literature or success stories',
    '🧘 Practice meditation and mindfulness',
    '✍️ Journal about your triggers and feelings',
    '🎵 Listen to music that uplifts you',
    '🎯 Remember your bigger "why" - your goals and dreams',
  ],

  // General Habit Cravings
  'default': [
    '⏱️ Wait it out - the urge will pass in 10-15 minutes',
    '🚶 Go for a walk or change your environment',
    '📱 Call or text someone supportive',
    '💪 Remember how good it feels to stay strong',
    '✍️ Write down why this habit no longer serves you',
    '🎯 Focus on your bigger goals and dreams',
    '🧘 Practice mindfulness or meditation',
    '🏃 Do some physical activity',
    '💧 Hydrate and take care of your body',
    '📊 Track your progress - you\'re doing great!',
  ],
};

/**
 * Get advice for a specific bad habit
 * @param habitName - The name or category of the bad habit
 * @returns Array of advice strings
 */
export function getAdviceForHabit(habitName: string): string[] {
  // Normalize the habit name to match a key
  const normalized = habitName.toLowerCase().replace(/\s+/g, '-');

  // Try exact match first
  if (TEMPTATION_ADVICE[normalized]) {
    return TEMPTATION_ADVICE[normalized];
  }

  // Try to find a match in the keys
  const matchedKey = Object.keys(TEMPTATION_ADVICE).find(
    key => key.includes(normalized) || normalized.includes(key)
  );

  return matchedKey ? TEMPTATION_ADVICE[matchedKey] : TEMPTATION_ADVICE['default'];
}

/**
 * Get a random piece of advice for a specific habit
 * @param habitName - The name or category of the bad habit
 * @returns A random advice string
 */
export function getRandomAdviceForHabit(habitName: string): string {
  const advice = getAdviceForHabit(habitName);
  return advice[Math.floor(Math.random() * advice.length)];
}
