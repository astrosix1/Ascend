// Emotional Intelligence Exercise Library

export interface EQStep {
  instruction: string;
  duration?: number; // seconds, for breathing exercises
}

export interface EQExercise {
  id: string;
  title: string;
  category: 'breathing' | 'self_awareness' | 'empathy' | 'conflict' | 'regulation' | 'social';
  type: 'guided' | 'prompt' | 'scenario' | 'breathing';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  fullDescription?: string;
  steps: EQStep[];
  skillsBuilt: string[];
  tags: string[];
  icon: string;
}

export const EQ_EXERCISES: EQExercise[] = [
  // ─── BREATHING & GROUNDING ───────────────────────────────
  {
    id: 'breathing_001',
    title: 'Box Breathing',
    category: 'breathing',
    type: 'breathing',
    duration: 5,
    difficulty: 'beginner',
    description: 'Calm your nervous system with a 4-4-4-4 breathing pattern.',
    fullDescription: 'A powerful technique to calm your nervous system. Breathe in a 4-count pattern to activate your parasympathetic nervous system and reduce stress.',
    steps: [
      { instruction: 'Inhale for 4 counts', duration: 4 },
      { instruction: 'Hold for 4 counts', duration: 4 },
      { instruction: 'Exhale for 4 counts', duration: 4 },
      { instruction: 'Hold for 4 counts', duration: 4 },
    ],
    skillsBuilt: ['self-regulation', 'anxiety-management', 'calm'],
    tags: ['quick', 'stress-relief', 'work-break'],
    icon: '🧘',
  },
  {
    id: 'breathing_002',
    title: '4-7-8 Breathing',
    category: 'breathing',
    type: 'breathing',
    duration: 5,
    difficulty: 'beginner',
    description: 'Slow, deep breathing to relax and prepare for sleep.',
    fullDescription: 'A technique popularized by Dr. Andrew Weil. Inhale for 4, hold for 7, exhale for 8. Activates the parasympathetic system.',
    steps: [
      { instruction: 'Inhale for 4 counts', duration: 4 },
      { instruction: 'Hold for 7 counts', duration: 7 },
      { instruction: 'Exhale for 8 counts', duration: 8 },
    ],
    skillsBuilt: ['calm', 'sleep-prep', 'anxiety-management'],
    tags: ['sleep', 'relaxation', 'evening'],
    icon: '🧘',
  },
  {
    id: 'breathing_003',
    title: 'Deep Belly Breathing',
    category: 'breathing',
    type: 'breathing',
    duration: 3,
    difficulty: 'beginner',
    description: 'Ground yourself with slow, deep diaphragmatic breathing.',
    steps: [
      { instruction: 'Relax your shoulders', duration: 2 },
      { instruction: 'Breathe in deeply through your nose for 5 counts', duration: 5 },
      { instruction: 'Hold for 3 counts', duration: 3 },
      { instruction: 'Exhale slowly through your mouth for 5 counts', duration: 5 },
    ],
    skillsBuilt: ['grounding', 'self-awareness', 'calm'],
    tags: ['grounding', 'quick', 'anytime'],
    icon: '🧘',
  },

  // ─── SELF-AWARENESS ───────────────────────────────────────
  {
    id: 'awareness_001',
    title: 'Emotion Naming',
    category: 'self_awareness',
    type: 'prompt',
    duration: 3,
    difficulty: 'beginner',
    description: 'Identify and name the emotions you\'re feeling right now.',
    steps: [
      { instruction: 'Close your eyes for 30 seconds and notice what you feel' },
      { instruction: 'Pick the strongest emotion: anger, sadness, joy, fear, or something else' },
      { instruction: 'Write down where you feel it in your body' },
    ],
    skillsBuilt: ['emotional-awareness', 'self-awareness', 'mindfulness'],
    tags: ['journaling', 'self-reflection', 'anytime'],
    icon: '💭',
  },
  {
    id: 'awareness_002',
    title: 'Trigger Tracker',
    category: 'self_awareness',
    type: 'prompt',
    duration: 5,
    difficulty: 'beginner',
    description: 'Identify what situations trigger specific emotions in you.',
    steps: [
      { instruction: 'Think of a time today you felt frustrated or upset' },
      { instruction: 'What happened right before? What was the trigger?' },
      { instruction: 'Write down the trigger and how you responded' },
      { instruction: 'Consider: Would you handle it differently next time?' },
    ],
    skillsBuilt: ['self-awareness', 'pattern-recognition', 'emotional-regulation'],
    tags: ['journaling', 'reflection', 'growth'],
    icon: '💭',
  },
  {
    id: 'awareness_003',
    title: 'Values Check-In',
    category: 'self_awareness',
    type: 'prompt',
    duration: 5,
    difficulty: 'intermediate',
    description: 'Reflect on whether today\'s actions aligned with your values.',
    steps: [
      { instruction: 'List 3 of your core values (e.g., honesty, family, growth)' },
      { instruction: 'Review today: Did you act in line with these values?' },
      { instruction: 'What\'s one moment you felt proud of your choices?' },
      { instruction: 'Is there anything you\'d do differently?' },
    ],
    skillsBuilt: ['self-awareness', 'alignment', 'integrity'],
    tags: ['journaling', 'reflection', 'values'],
    icon: '💭',
  },

  // ─── EMPATHY & PERSPECTIVE ────────────────────────────────
  {
    id: 'empathy_001',
    title: 'Perspective Swap',
    category: 'empathy',
    type: 'scenario',
    duration: 5,
    difficulty: 'intermediate',
    description: 'Retell a recent conflict from the other person\'s viewpoint.',
    steps: [
      { instruction: 'Think of a recent disagreement with someone' },
      { instruction: 'Now write it from THEIR perspective. What did they feel?' },
      { instruction: 'What might they have heard that you didn\'t intend?' },
      { instruction: 'How might you approach them differently?' },
    ],
    skillsBuilt: ['empathy', 'perspective-taking', 'conflict-resolution'],
    tags: ['relationships', 'reflection', 'growth'],
    icon: '🤝',
  },
  {
    id: 'empathy_002',
    title: 'Active Listening Practice',
    category: 'empathy',
    type: 'prompt',
    duration: 5,
    difficulty: 'beginner',
    description: 'Listen to someone without planning your response.',
    steps: [
      { instruction: 'Reach out to someone and ask them a meaningful question' },
      { instruction: 'Listen fully without interrupting. Don\'t plan your response.' },
      { instruction: 'Ask a follow-up: "Tell me more about that"' },
      { instruction: 'After: Write down what you learned about them' },
    ],
    skillsBuilt: ['listening', 'empathy', 'connection'],
    tags: ['relationships', 'social', 'daily'],
    icon: '🤝',
  },
  {
    id: 'empathy_003',
    title: 'Gratitude for Someone',
    category: 'empathy',
    type: 'prompt',
    duration: 3,
    difficulty: 'beginner',
    description: 'Express genuine appreciation to someone in your life.',
    steps: [
      { instruction: 'Think of someone who helped or supported you' },
      { instruction: 'What specifically did they do?' },
      { instruction: 'Text, call, or tell them in person' },
      { instruction: 'Notice how it feels' },
    ],
    skillsBuilt: ['gratitude', 'connection', 'empathy'],
    tags: ['relationships', 'social', 'anytime'],
    icon: '🤝',
  },

  // ─── CONFLICT RESOLUTION ──────────────────────────────────
  {
    id: 'conflict_001',
    title: 'I-Statements Practice',
    category: 'conflict',
    type: 'prompt',
    duration: 5,
    difficulty: 'intermediate',
    description: 'Learn to express your feelings without blaming.',
    steps: [
      { instruction: 'Think of something someone did that upset you' },
      { instruction: 'First, write what you\'d normally say (likely blaming)' },
      { instruction: 'Now rewrite as an I-statement: "I felt X when Y, because Z"' },
      { instruction: 'Practice saying it aloud' },
    ],
    skillsBuilt: ['communication', 'emotional-expression', 'conflict-resolution'],
    tags: ['communication', 'relationships', 'skills'],
    icon: '⚡',
  },
  {
    id: 'conflict_002',
    title: 'Boundary Setting',
    category: 'conflict',
    type: 'prompt',
    duration: 5,
    difficulty: 'intermediate',
    description: 'Practice saying "no" and setting healthy boundaries.',
    steps: [
      { instruction: 'Identify one boundary you need to set' },
      { instruction: 'Write what you want to say. Be clear and kind.' },
      { instruction: 'Practice saying it with confidence' },
      { instruction: 'Set a time to have this conversation' },
    ],
    skillsBuilt: ['assertiveness', 'boundary-setting', 'self-care'],
    tags: ['communication', 'relationships', 'growth'],
    icon: '⚡',
  },

  // ─── EMOTIONAL REGULATION ─────────────────────────────────
  {
    id: 'regulation_001',
    title: 'Emotion Dial-Down',
    category: 'regulation',
    type: 'guided',
    duration: 5,
    difficulty: 'beginner',
    description: 'Reduce emotional intensity using grounding techniques.',
    steps: [
      { instruction: 'Rate your stress/emotion on a scale 1-10' },
      { instruction: 'Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste' },
      { instruction: 'Take 3 deep breaths' },
      { instruction: 'Rate again. Did it decrease?' },
    ],
    skillsBuilt: ['self-regulation', 'grounding', 'stress-management'],
    tags: ['stress-relief', 'grounding', 'anytime'],
    icon: '🛡️',
  },
  {
    id: 'regulation_002',
    title: 'Progressive Muscle Relaxation',
    category: 'regulation',
    type: 'guided',
    duration: 8,
    difficulty: 'beginner',
    description: 'Release physical tension by tensing and relaxing muscle groups.',
    steps: [
      { instruction: 'Start at your toes: tense for 3 seconds, release' },
      { instruction: 'Move to calves, thighs, glutes — same pattern' },
      { instruction: 'Abs, chest, shoulders, arms, hands' },
      { instruction: 'Neck, face, jaw' },
      { instruction: 'Notice how relaxed you feel' },
    ],
    skillsBuilt: ['body-awareness', 'relaxation', 'self-regulation'],
    tags: ['relaxation', 'body-awareness', 'evening'],
    icon: '🛡️',
  },

  // ─── SOCIAL SKILLS ────────────────────────────────────────
  {
    id: 'social_001',
    title: 'Conversation Starter',
    category: 'social',
    type: 'prompt',
    duration: 3,
    difficulty: 'beginner',
    description: 'Initiate a meaningful conversation with someone.',
    steps: [
      { instruction: 'Pick someone to talk to (friend, coworker, family)' },
      { instruction: 'Ask them an open-ended question about themselves' },
      { instruction: 'Listen more than you talk' },
      { instruction: 'Notice: Did the conversation feel natural?' },
    ],
    skillsBuilt: ['social-confidence', 'communication', 'connection'],
    tags: ['social', 'daily', 'relationships'],
    icon: '💬',
  },
  {
    id: 'social_002',
    title: 'Apology Practice',
    category: 'social',
    type: 'prompt',
    duration: 5,
    difficulty: 'advanced',
    description: 'Apologize genuinely and repair a relationship.',
    steps: [
      { instruction: 'Is there someone you owe an apology to?' },
      { instruction: 'Write a genuine apology: own your mistake, express impact, commit to change' },
      { instruction: 'Practice saying it aloud' },
      { instruction: 'Deliver it in person or over the phone' },
    ],
    skillsBuilt: ['accountability', 'communication', 'relationship-repair'],
    tags: ['relationships', 'growth', 'courage'],
    icon: '💬',
  },
];

// Get exercises by category
export function getExercisesByCategory(category: EQExercise['category']): EQExercise[] {
  return EQ_EXERCISES.filter(ex => ex.category === category);
}

// Get daily featured exercise (rotates daily)
export function getDailyChallenge(): EQExercise {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return EQ_EXERCISES[dayOfYear % EQ_EXERCISES.length];
}

// Category metadata
export const EQ_CATEGORIES = {
  breathing: { name: 'Breathing & Grounding', icon: '🧘' },
  self_awareness: { name: 'Self-Awareness', icon: '💭' },
  empathy: { name: 'Empathy & Perspective', icon: '🤝' },
  conflict: { name: 'Conflict Resolution', icon: '⚡' },
  regulation: { name: 'Emotional Regulation', icon: '🛡️' },
  social: { name: 'Social Skills', icon: '💬' },
};
