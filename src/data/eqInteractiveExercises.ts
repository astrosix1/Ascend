// Interactive EQ Exercises: Scenarios, Games, Insights

export type ExerciseType = 'scenario' | 'game' | 'insights';
export type GameType = 'emotion-match' | 'trigger-mapper' | 'perspective-swap' | 'communication-style' | 'facial-match';

// ─── SCENARIO EXERCISES ───────────────────────────────────────
export interface ScenarioChoice {
  id: string;
  text: string;
  style: 'people-pleaser' | 'assertive' | 'aggressive' | 'passive-aggressive' | 'avoidant';
  outcome: string;
  eqInsight: string;
  skillsGained: string[];
}

export interface ScenarioExercise {
  id: string;
  title: string;
  category: 'empathy' | 'conflict' | 'regulation' | 'social';
  type: 'scenario';
  duration: 5;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  scenario: string;
  context: string;
  choices: ScenarioChoice[];
}

// ─── GAME EXERCISES ──────────────────────────────────────────
export interface GameRound {
  id: string;
  prompt: string;
  options: string[];
  correct: string | string[];
  explanation: string;
  eqLessonIfWrong?: string;
}

export interface GameExercise {
  id: string;
  title: string;
  category: 'self_awareness' | 'empathy' | 'regulation';
  type: 'game';
  gameType: GameType;
  duration: 5;
  difficulty: 'beginner' | 'intermediate';
  icon: string;
  description: string;
  rounds: GameRound[];
  scoringLogic?: 'accuracy' | 'speed-accuracy';
}

// ─── SCENARIO LIBRARY ──────────────────────────────────────
export const SCENARIO_EXERCISES: ScenarioExercise[] = [
  {
    id: 'scenario_boundary_001',
    title: 'Setting a Work Boundary',
    category: 'conflict',
    type: 'scenario',
    duration: 5,
    difficulty: 'intermediate',
    icon: '⚡',
    scenario: 'Your boss asks you to work late on Friday evening. You have plans.',
    context: 'You value work-life balance but don\'t want to seem uncommitted.',
    choices: [
      {
        id: 'choice_1',
        text: 'Sure, I can stay late.',
        style: 'people-pleaser',
        outcome: 'You work late but feel resentful. Your boundary weakens over time.',
        eqInsight: 'Saying "yes" to everything erodes your self-respect and sets unsustainable expectations.',
        skillsGained: ['boundary-awareness', 'self-respect'],
      },
      {
        id: 'choice_2',
        text: 'I have plans tonight, but I can finish this first thing Monday morning.',
        style: 'assertive',
        outcome: 'Your boss respects your honesty. Work gets done. You keep your plans.',
        eqInsight: 'Clear, honest communication builds trust and respect from others.',
        skillsGained: ['assertiveness', 'communication', 'boundary-setting'],
      },
      {
        id: 'choice_3',
        text: 'I\'m not doing it. This is ridiculous.',
        style: 'aggressive',
        outcome: 'You protect your boundary but damage the relationship and come across as difficult.',
        eqInsight: 'Aggression gets your needs met in the moment but damages relationships long-term.',
        skillsGained: ['boundary-awareness'],
      },
      {
        id: 'choice_4',
        text: 'I\'ll see what I can do...',
        style: 'avoidant',
        outcome: 'Your boss is confused. You don\'t go to your plans but also don\'t finish the work.',
        eqInsight: 'Avoiding conflict doesn\'t resolve anything—it delays the problem and increases stress.',
        skillsGained: ['clarity-need'],
      },
    ],
  },
  {
    id: 'scenario_friend_001',
    title: 'Friend Cancels Plans',
    category: 'empathy',
    type: 'scenario',
    duration: 5,
    difficulty: 'beginner',
    icon: '🤝',
    scenario: 'Your friend cancels plans at the last minute for the second time this month.',
    context: 'You\'re hurt and frustrated, but you don\'t want to seem clingy or demanding.',
    choices: [
      {
        id: 'choice_1',
        text: 'It\'s fine, no big deal.',
        style: 'people-pleaser',
        outcome: 'You suppress your feelings. The pattern continues without addressing it.',
        eqInsight: 'Bottling emotions doesn\'t fix the issue—it just builds resentment.',
        skillsGained: ['emotion-awareness'],
      },
      {
        id: 'choice_2',
        text: 'Hey, I\'ve noticed you\'ve cancelled twice. Is everything okay? I miss hanging out.',
        style: 'assertive',
        outcome: 'Your friend opens up about stress. You both feel heard. You reschedule confidently.',
        eqInsight: 'Addressing patterns with curiosity and honesty strengthens relationships.',
        skillsGained: ['empathy', 'communication', 'vulnerability'],
      },
      {
        id: 'choice_3',
        text: 'You\'re the worst friend. You always do this.',
        style: 'aggressive',
        outcome: 'Your friend feels attacked. The conflict escalates. Trust is damaged.',
        eqInsight: 'Attacking damages relationships. Share impact instead: "I feel hurt and forgotten."',
        skillsGained: ['awareness'],
      },
      {
        id: 'choice_4',
        text: '[Say nothing, just disappear for a while]',
        style: 'passive-aggressive',
        outcome: 'Your friend is confused and hurt. The friendship cools without understanding why.',
        eqInsight: 'Punishment through silence creates more conflict, not resolution.',
        skillsGained: ['communication-need'],
      },
    ],
  },
  {
    id: 'scenario_conflict_001',
    title: 'Disagreement with Partner',
    category: 'conflict',
    type: 'scenario',
    duration: 5,
    difficulty: 'advanced',
    icon: '💬',
    scenario: 'Your partner did something that upset you. They\'re defensive when you bring it up.',
    context: 'You want to resolve this without creating a bigger fight.',
    choices: [
      {
        id: 'choice_1',
        text: 'Let\'s just drop it. I don\'t want to fight.',
        style: 'avoidant',
        outcome: 'The issue festers. Both of you feel unheard. Resentment builds.',
        eqInsight: 'Avoidance prevents resolution. Real intimacy requires honest conversation.',
        skillsGained: ['conflict-awareness'],
      },
      {
        id: 'choice_2',
        text: 'I feel hurt by what happened. Can we talk about it calmly?',
        style: 'assertive',
        outcome: 'By using "I" statements and inviting dialogue, defensiveness often decreases.',
        eqInsight: 'Focusing on YOUR feelings rather than THEIR behavior reduces defensiveness.',
        skillsGained: ['emotional-expression', 'conflict-resolution', 'empathy'],
      },
      {
        id: 'choice_3',
        text: 'You always do this. You don\'t care about my feelings.',
        style: 'aggressive',
        outcome: 'Your partner becomes more defensive. You\'re now both attacking each other.',
        eqInsight: '"Always/never" statements feel like attacks and prevent real dialogue.',
        skillsGained: ['awareness'],
      },
    ],
  },
];

// ─── GAME LIBRARY ─────────────────────────────────────────────
export const GAME_EXERCISES: GameExercise[] = [
  {
    id: 'game_emotion_match',
    title: 'Emotion Match',
    category: 'self_awareness',
    type: 'game',
    gameType: 'emotion-match',
    duration: 5,
    difficulty: 'beginner',
    icon: '💭',
    description: 'Given a scenario, identify the most likely emotion. Build emotional vocabulary.',
    rounds: [
      {
        id: 'round_1',
        prompt: 'You worked hard on a project for weeks. Your boss gives you critical feedback without acknowledging your effort.',
        options: ['Angry', 'Disappointed', 'Embarrassed', 'Motivated'],
        correct: ['Disappointed', 'Angry'],
        explanation: 'Disappointment (effort not recognized) + Anger (feeling undervalued) are both present. "Motivated" would be dismissing your legitimate feelings.',
      },
      {
        id: 'round_2',
        prompt: 'Your friend shared a secret with you, and you accidentally told someone else. You found out they know.',
        options: ['Guilty', 'Ashamed', 'Anxious', 'Indifferent'],
        correct: 'Guilty',
        explanation: 'Guilt = "I did something wrong." Shame = "I am wrong." In this case, you made a mistake (guilt), and the anxiety comes from consequences, but the core feeling is guilt.',
      },
      {
        id: 'round_3',
        prompt: 'You\'ve been working toward a goal for months. You just achieved it.',
        options: ['Happy', 'Proud', 'Relieved', 'All of the above'],
        correct: 'All of the above',
        explanation: 'Complex emotions! Achievement often brings happiness (joy), pride (accomplishment), and relief (effort paid off).',
      },
      {
        id: 'round_4',
        prompt: 'Someone cut you off in traffic. You feel your heart racing and fists clenching.',
        options: ['Annoyed', 'Frustrated', 'Enraged', 'Fearful'],
        correct: ['Enraged', 'Fearful'],
        explanation: 'The physical symptoms point to high arousal: Enraged (intense anger) or fearful (threat response). "Annoyed" is too mild for this reaction.',
      },
    ],
  },
  {
    id: 'game_trigger_mapper',
    title: 'Trigger Mapper',
    category: 'self_awareness',
    type: 'game',
    gameType: 'trigger-mapper',
    duration: 5,
    difficulty: 'intermediate',
    icon: '🗺️',
    description: 'Categorize events by emotional impact. Learn your personal triggers.',
    rounds: [
      {
        id: 'round_1',
        prompt: 'Being interrupted while speaking.',
        options: ['Not a trigger', 'Mild trigger', 'Strong trigger', 'Varies by context'],
        correct: 'Varies by context',
        explanation: 'Context matters! Interrupted by a friend = mild frustration. Interrupted by boss in meeting = strong trigger (feeling unheard + disrespected).',
      },
      {
        id: 'round_2',
        prompt: 'Someone pointing out a mistake you made.',
        options: ['Not a trigger', 'Mild trigger', 'Strong trigger'],
        correct: ['Mild trigger', 'Strong trigger'],
        explanation: 'For most people: mild frustration. But if you struggle with perfectionism or past criticism, it could be strong. The key is noticing YOUR pattern.',
      },
      {
        id: 'round_3',
        prompt: 'Plans changing at the last minute.',
        options: ['Not a trigger', 'Mild trigger', 'Strong trigger', 'Depends on who changed it'],
        correct: 'Depends on who changed it',
        explanation: 'A friend changing plans = mild. Your partner cancelling = stronger (feels like deprioritization). Your boss = depends on timing. Notice the pattern.',
      },
    ],
  },
  {
    id: 'game_perspective_swap',
    title: 'Perspective Swap',
    category: 'empathy',
    type: 'game',
    gameType: 'perspective-swap',
    duration: 5,
    difficulty: 'advanced',
    icon: '🔄',
    description: 'Retell a conflict from the other person\'s perspective. Build empathy.',
    rounds: [
      {
        id: 'round_1',
        prompt: 'YOU: Your partner didn\'t help with housework like they promised.\nFROM THEIR PERSPECTIVE: ___',
        options: [
          'They forgot because they don\'t care about you',
          'They were overwhelmed at work and forgot their commitment',
          'They don\'t think housework is important',
          'They\'re lazy',
        ],
        correct: 'They were overwhelmed at work and forgot their commitment',
        explanation: 'Empathy means assuming good intent first. Maybe they genuinely forgot due to stress, not malice. You can still be upset AND understand their perspective.',
      },
      {
        id: 'round_2',
        prompt: 'YOU: Your friend has been distant lately.\nFROM THEIR PERSPECTIVE: ___',
        options: [
          'They don\'t like you anymore',
          'They\'re dealing with personal stress and have less energy for socializing',
          'They\'re intentionally punishing you',
          'They\'re too busy',
        ],
        correct: 'They\'re dealing with personal stress and have less energy for socializing',
        explanation: 'Distance often signals struggle, not rejection. Before assuming the worst, ask: "Is everything okay?" You might discover they need support.',
      },
    ],
  },
];

// ─── PATTERNS & INSIGHTS ─────────────────────────────────────
// This is computed from EQ completion history
export interface EQPattern {
  type: 'trigger' | 'strength' | 'growth' | 'avoidance';
  title: string;
  description: string;
  evidence: string;
  suggestion: string;
}

export function analyzeEQPatterns(completions: any[]): EQPattern[] {
  // This will be computed from user's exercise completions
  // For now, placeholder logic:
  return [
    {
      type: 'strength',
      title: 'Strong Empathy Recognition',
      description: 'You consistently identify others\' emotions accurately in games.',
      evidence: '9/10 correct on Emotion Match, Perspective Swap',
      suggestion: 'Channel this into conflict resolution—you understand people well.',
    },
    {
      type: 'avoidance',
      title: 'Avoidant Communication Style',
      description: 'When faced with conflict scenarios, you often choose the "avoidant" path.',
      evidence: 'Chose avoidant option in 3/5 conflict scenarios',
      suggestion: 'Try "assertive" responses next time. Practice with scenarios you normally avoid.',
    },
    {
      type: 'growth',
      title: 'Improving Trigger Awareness',
      description: 'Your trigger mapper performance improved by 40% over 2 weeks.',
      evidence: 'Week 1: 5/8 correct. Week 2: 7/8 correct.',
      suggestion: 'Keep tracking! This awareness will help you manage triggers in real life.',
    },
  ];
}
