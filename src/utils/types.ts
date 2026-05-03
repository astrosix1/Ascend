export interface Habit {
  id: string;
  name: string;
  type: 'good' | 'bad';
  description?: string;
  microHabit?: string;
  trigger?: string;
  replacement?: string;
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ISO date strings
  createdAt: string;
  category?: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  xpReward: number;
}

export interface UserStats {
  xp: number;
  level: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  habitsCompletedToday: number;
  weeklyCompletion: number[];
  monthlyCompletion: number[];
}

export interface PomodoroSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  breakDuration: number;
  breakActivity?: string;
  completed: boolean;
  date: string;
}

export interface Alarm {
  id: string;
  time: string; // HH:MM
  days: number[]; // 0-6 (Sun-Sat)
  enabled: boolean;
  label: string;
  voiceOption: 'news' | 'weather' | 'briefing' | 'motivational' | 'silent';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date
  time?: string; // HH:MM
  description?: string;
  fromCommunity?: boolean;
  eventId?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  attendees: number;
  isGoing: boolean;
  category: string;
  url?: string;
  weather?: { high: number; low: number };
}

export interface ForumPost {
  id: string;
  title: string;
  body: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  comments: ForumComment[];
  isFeatured: boolean;
  helpfulResponses: string[];
}

export interface ForumComment {
  id: string;
  body: string;
  author: string;
  date: string;
  isHelpful: boolean;
}

export interface RealWorldWin {
  id: string;
  text: string;
  date: string;
}

export interface JournalEntry {
  id: string;
  habitId: string;
  habitName: string;
  text: string;
  date: string;
}

export interface RelapseEntry {
  id: string;
  habitId: string;
  habitName: string;
  trigger: string;
  lesson: string;
  microHabitRetry?: string;
  date: string;
}

export interface GoalEntry {
  id: string;
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'abandoned';
  progress: number; // 0-100%
  relatedHabits: string[]; // habitIds that support this goal
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface DetoxSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  pointsEarned: number;
  date: string;
}

export interface ReflectionResponse {
  id: string;
  prompt: string;
  response: string;
  date: string;
}

export interface UserSettings {
  username: string;
  usernameLastChanged: string;
  location: string;
  theme: 'dark' | 'light';
  maxDailyAppTime: number; // minutes, 0 = unlimited
  doNotDisturbStart: string; // HH:MM
  doNotDisturbEnd: string; // HH:MM
  reflectionFrequency: 'daily' | 'weekly' | 'never';
  accountabilityPartner: {
    name: string;
    contact: string; // email or phone
  } | null;
  pomodoroStudyTime: number;
  pomodoroBreakTime: number;
  // Profile customization (v2.1)
  realName?: string;
  profilePictureUrl?: string;
  profilePictureBase64?: string;
  // Dashboard preferences (v2.1)
  dashboardPreferences?: {
    showMotivationQuote: boolean;
    showStreakHighlight: boolean;
    showAvoidedBadHabits: boolean;
    showSummary: boolean;
    showAnalyticsButton: boolean;
    showCalendar: boolean;
    showWins: boolean;
    showRelapse: boolean;
    showJournals: boolean;
  };
}

export interface LearnHabit {
  id: string;
  name: string;
  type: 'good' | 'bad';
  category: string;
  description: string;
  benefits?: string[];
  drawbacks?: string[];
  realWorldStory: string;
  timeline: string;
  microHabits: string[];
  triggers?: string[];
  replacements?: string[];
}
