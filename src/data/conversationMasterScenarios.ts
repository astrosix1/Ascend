// Conversation Master Game - Real-world scenarios for building EQ through dialogue

export type ResponseStyle = 'assertive' | 'aggressive' | 'passive' | 'passive-aggressive' | 'people-pleaser';
export type RelationshipImpact = 'damaged' | 'neutral' | 'improved' | 'strengthened';

export interface NPCResponse {
  text: string;
  emoticon: string; // 😊 😐 😕 😢 😡
  relationshipImpact: RelationshipImpact;
  eqLesson: string;
  eqScore: number; // 0-10
}

export interface UserChoice {
  id: string;
  text: string;
  style: ResponseStyle;
  npcResponses: {
    [key: string]: NPCResponse; // Can branch further
  };
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  situation: string;
  context: string;
  npcName: string;
  npcEmoji: string;
  npcInitialMessage: string;
  userGoal: string;
  initialChoices: UserChoice[];
  eqSkillsFocused: string[];
}

export const CONVERSATION_MASTER_SCENARIOS: Scenario[] = [
  {
    id: 'scenario_interrupt_001',
    title: 'The Constant Interrupter',
    difficulty: 'easy',
    icon: '💬',
    situation: 'Your coworker keeps interrupting you in meetings',
    context: 'This has happened multiple times. You need to address it without creating tension.',
    npcName: 'Alex',
    npcEmoji: '👤',
    npcInitialMessage: "Hey! Got a second? I wanted to grab you about that project...",
    userGoal: 'Address the interruption pattern respectfully',
    initialChoices: [
      {
        id: 'choice_dismiss',
        text: '"Not now, I\'m busy."',
        style: 'aggressive',
        npcResponses: {
          response: {
            text: 'Oh... okay. Sorry for bothering you.',
            emoticon: '😕',
            relationshipImpact: 'damaged',
            eqLesson: 'Dismissing people damages relationships. They feel rejected and unvalued.',
            eqScore: 2,
          },
        },
      },
      {
        id: 'choice_accept',
        text: '"Sure, what\'s up?"',
        style: 'people-pleaser',
        npcResponses: {
          response: {
            text: 'Cool, so about the project... oh wait, I\'m interrupting you again, aren\'t I?',
            emoticon: '😐',
            relationshipImpact: 'neutral',
            eqLesson: 'Accepting interruptions without addressing them teaches others to keep interrupting.',
            eqScore: 4,
          },
        },
      },
      {
        id: 'choice_assertive',
        text: '"Actually, I\'ve been wanting to talk to you about something. Can we grab coffee after work?"',
        style: 'assertive',
        npcResponses: {
          response: {
            text: 'Sure! Is everything okay? You seem a bit serious.',
            emoticon: '😐',
            relationshipImpact: 'neutral',
            eqLesson: 'Good! You\'ve created a safe space for the conversation. They\'re a bit nervous but open.',
            eqScore: 7,
          },
        },
      },
    ],
    eqSkillsFocused: ['boundary-setting', 'assertiveness', 'conflict-resolution'],
  },
  {
    id: 'scenario_critical_feedback_001',
    title: 'Receiving Harsh Feedback',
    difficulty: 'medium',
    icon: '📊',
    situation: 'Your manager gives you critical feedback in front of the team',
    context: 'It was embarrassing and hurt your feelings. You need to respond professionally.',
    npcName: 'Jordan',
    npcEmoji: '👔',
    npcInitialMessage: 'Can I see you in my office? I want to talk about your presentation.',
    userGoal: 'Stay calm and respond professionally without being defensive or shutting down',
    initialChoices: [
      {
        id: 'choice_defensive',
        text: '"That\'s not fair. I worked hard on it."',
        style: 'aggressive',
        npcResponses: {
          response: {
            text: 'Look, I\'m just trying to help you improve. You don\'t have to get defensive.',
            emoticon: '😡',
            relationshipImpact: 'damaged',
            eqLesson: 'Defensiveness makes the other person feel unheard and creates conflict.',
            eqScore: 2,
          },
        },
      },
      {
        id: 'choice_silent',
        text: '[Stay quiet, nod, say nothing]',
        style: 'passive',
        npcResponses: {
          response: {
            text: 'Are you upset with me? I can\'t tell what you\'re thinking.',
            emoticon: '😕',
            relationshipImpact: 'neutral',
            eqLesson: 'Shutting down leaves the other person uncertain. Feedback won\'t be useful to you.',
            eqScore: 3,
          },
        },
      },
      {
        id: 'choice_curious',
        text: '"I appreciate the feedback. Can you give me a specific example so I understand better?"',
        style: 'assertive',
        npcResponses: {
          response: {
            text: 'Yeah, sure. For instance, your data visualization was hard to follow. Here\'s what I mean...',
            emoticon: '😊',
            relationshipImpact: 'improved',
            eqLesson: 'Asking clarifying questions shows you\'re open to growth. This builds trust and respect.',
            eqScore: 9,
          },
        },
      },
    ],
    eqSkillsFocused: ['emotional-regulation', 'openness', 'growth-mindset'],
  },
  {
    id: 'scenario_boundary_friend_001',
    title: 'Friend Always Venting',
    difficulty: 'medium',
    icon: '🤝',
    situation: 'Your friend calls you every day to vent about their problems',
    context: 'You care about them but it\'s draining. You need space but don\'t want to hurt them.',
    npcName: 'Sam',
    npcEmoji: '👫',
    npcInitialMessage: 'Hey, can you talk? I\'m having a really rough day and I just need to vent...',
    userGoal: 'Set a healthy boundary while showing you care',
    initialChoices: [
      {
        id: 'choice_avoid',
        text: '"I can\'t talk right now, sorry."',
        style: 'passive',
        npcResponses: {
          response: {
            text: 'Oh... okay. [Hangs up quietly. Doesn\'t reach out for weeks.]',
            emoticon: '😢',
            relationshipImpact: 'damaged',
            eqLesson: 'Without explanation, they feel rejected. Boundaries need context.',
            eqScore: 2,
          },
        },
      },
      {
        id: 'choice_aggressive',
        text: '"I can\'t be your therapist. You need to deal with your own problems."',
        style: 'aggressive',
        npcResponses: {
          response: {
            text: 'Wow. I didn\'t expect that from you. I guess I can\'t rely on you.',
            emoticon: '😢',
            relationshipImpact: 'damaged',
            eqLesson: 'Harsh boundaries hurt people. Kindness + boundaries = mutual respect.',
            eqScore: 1,
          },
        },
      },
      {
        id: 'choice_boundaried',
        text: '"I care about you and I\'m here for you. But I\'ve been feeling drained lately. Can we chat on Sundays instead? I want to give you my full attention."',
        style: 'assertive',
        npcResponses: {
          response: {
            text: 'Oh, I didn\'t realize I was doing that. I appreciate you being honest. Sunday works.',
            emoticon: '😊',
            relationshipImpact: 'strengthened',
            eqLesson: 'Honest, kind boundaries actually strengthen relationships. Both people feel respected.',
            eqScore: 10,
          },
        },
      },
    ],
    eqSkillsFocused: ['boundary-setting', 'empathy', 'emotional-honesty'],
  },
  {
    id: 'scenario_apology_001',
    title: 'Making a Mistake at Work',
    difficulty: 'hard',
    icon: '⚠️',
    situation: 'You made an error that cost the team time. Your boss noticed.',
    context: 'You\'re embarrassed and want to minimize it, but you know it was your fault.',
    npcName: 'Casey',
    npcEmoji: '💼',
    npcInitialMessage: 'I saw the bug in the code. That\'s going to set us back.',
    userGoal: 'Own the mistake, apologize genuinely, and show what you\'ll do differently',
    initialChoices: [
      {
        id: 'choice_excuse',
        text: '"I was rushing because the deadline was tight."',
        style: 'passive-aggressive',
        npcResponses: {
          response: {
            text: 'So it\'s the deadline\'s fault? We all work under deadlines.',
            emoticon: '😕',
            relationshipImpact: 'damaged',
            eqLesson: 'Making excuses doesn\'t fix the problem. It looks like you\'re avoiding responsibility.',
            eqScore: 2,
          },
        },
      },
      {
        id: 'choice_minimize',
        text: '"It\'s not that bad. We can fix it pretty easily."',
        style: 'people-pleaser',
        npcResponses: {
          response: {
            text: 'It cost us 3 hours today. That doesn\'t feel easy.',
            emoticon: '😕',
            relationshipImpact: 'damaged',
            eqLesson: 'Minimizing impact dismisses the other person\'s frustration. They feel unheard.',
            eqScore: 3,
          },
        },
      },
      {
        id: 'choice_own_it',
        text: '"You\'re right, I made a mistake. I should have reviewed my code more carefully. I\'m sorry for the disruption. Going forward, I\'ll build in extra review time. Can I help fix it?"',
        style: 'assertive',
        npcResponses: {
          response: {
            text: 'I appreciate that. Yeah, let\'s work on it together. And thanks for being straight with me.',
            emoticon: '😊',
            relationshipImpact: 'strengthened',
            eqLesson: 'Owning mistakes + showing solutions = respect and trust. People respect accountability.',
            eqScore: 10,
          },
        },
      },
    ],
    eqSkillsFocused: ['accountability', 'emotional-honesty', 'resilience'],
  },
  {
    id: 'scenario_disagreement_001',
    title: 'Partner Disagrees With You',
    difficulty: 'hard',
    icon: '💔',
    situation: 'Your partner disagrees with an important decision you want to make',
    context: 'They\'re upset, you feel unheard. You need to navigate this together.',
    npcName: 'Taylor',
    npcEmoji: '💕',
    npcInitialMessage: 'I don\'t think that\'s a good idea. I\'m worried about us if you do this.',
    userGoal: 'Validate their concerns while honoring your own needs',
    initialChoices: [
      {
        id: 'choice_dismiss',
        text: '"I don\'t care what you think. It\'s my decision."',
        style: 'aggressive',
        npcResponses: {
          response: {
            text: 'Wow. I guess my feelings don\'t matter to you.',
            emoticon: '😢',
            relationshipImpact: 'damaged',
            eqLesson: 'Dismissing your partner\'s emotions creates distance and resentment.',
            eqScore: 1,
          },
        },
      },
      {
        id: 'choice_comply',
        text: '"Okay, forget it. I won\'t do it then."',
        style: 'people-pleaser',
        npcResponses: {
          response: {
            text: 'I don\'t want you to resent me for this. But... thank you.',
            emoticon: '😐',
            relationshipImpact: 'neutral',
            eqLesson: 'Sacrificing your needs builds resentment. True partnership means both people matter.',
            eqScore: 4,
          },
        },
      },
      {
        id: 'choice_validate_and_discuss',
        text: '"I hear you, and I understand you\'re worried. I am too. Can we talk about what specifically concerns you? I want to find a way that works for both of us."',
        style: 'assertive',
        npcResponses: {
          response: {
            text: 'Thank you for asking. I was scared you didn\'t care about my perspective. Let\'s talk through it.',
            emoticon: '😊',
            relationshipImpact: 'strengthened',
            eqLesson: 'Validating + staying true to yourself = healthy relationships. Both people feel heard.',
            eqScore: 10,
          },
        },
      },
    ],
    eqSkillsFocused: ['empathy', 'assertiveness', 'vulnerability'],
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return CONVERSATION_MASTER_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Scenario[] {
  return CONVERSATION_MASTER_SCENARIOS.filter(s => s.difficulty === difficulty);
}
