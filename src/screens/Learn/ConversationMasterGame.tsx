import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import {
  Scenario,
  ConversationNode,
  DialogueChoice,
  NPCEmotion,
  RelationshipImpact,
  CONVERSATION_MASTER_SCENARIOS,
  getScenariosByDifficulty,
} from '../../data/conversationMasterScenarios';

type GameScreen = 'difficulty-select' | 'scenario-select' | 'playing' | 'outcome';

interface ChatMessage {
  id: string;
  speaker: 'npc' | 'user';
  text: string;
  emotion?: NPCEmotion;
}

interface GameState {
  scenario: Scenario | null;
  currentNodeId: string;
  chatHistory: ChatMessage[];
  relationshipScore: number;
  eqScores: number[];
}

const EMOTION_EMOJI: Record<NPCEmotion, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  angry: '😤',
  worried: '😟',
  surprised: '😲',
  hurt: '💔',
  satisfied: '😌',
  defensive: '😒',
  hopeful: '🥺',
};

export default function ConversationMasterGame() {
  const { colors } = useApp();
  const [screen, setScreen] = useState<GameScreen>('difficulty-select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    scenario: null,
    currentNodeId: '',
    chatHistory: [],
    relationshipScore: 50,
    eqScores: [],
  });
  const [showChoices, setShowChoices] = useState(false);
  const [isWaitingForNPC, setIsWaitingForNPC] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const relationshipAnim = useRef(new Animated.Value(50)).current;

  const getCurrentNode = (state: GameState): ConversationNode | null => {
    if (!state.scenario || !state.currentNodeId) return null;
    return state.scenario.nodes[state.currentNodeId] || null;
  };

  const getBarColor = (score: number) => {
    if (score >= 65) return colors.success;
    if (score >= 35) return colors.warning;
    return colors.danger;
  };

  const getRelationshipLabel = (score: number) => {
    if (score >= 80) return 'Strong connection';
    if (score >= 65) return 'Good rapport';
    if (score >= 45) return 'Neutral';
    if (score >= 25) return 'Tension rising';
    return 'Relationship at risk';
  };

  const animateBar = (toValue: number) => {
    Animated.timing(relationshipAnim, {
      toValue,
      duration: 700,
      useNativeDriver: false,
    }).start();
  };

  const handleStartScenario = (scenario: Scenario) => {
    const startNode = scenario.nodes[scenario.startNodeId];
    const firstMsg: ChatMessage = {
      id: 'msg_0',
      speaker: 'npc',
      text: startNode.npcMessage,
      emotion: startNode.npcEmotion,
    };
    relationshipAnim.setValue(scenario.initialRelationship);
    setGameState({
      scenario,
      currentNodeId: scenario.startNodeId,
      chatHistory: [firstMsg],
      relationshipScore: scenario.initialRelationship,
      eqScores: [],
    });
    setScreen('playing');
    setShowChoices(false);
    setIsWaitingForNPC(false);
    setTimeout(() => setShowChoices(true), 500);
  };

  const handleChoice = (choice: DialogueChoice) => {
    if (isWaitingForNPC) return;
    setShowChoices(false);
    setIsWaitingForNPC(true);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      speaker: 'user',
      text: choice.text,
    };

    setGameState(prev => {
      const newScore = Math.min(100, Math.max(0, prev.relationshipScore + choice.relationshipDelta));
      animateBar(newScore);
      return {
        ...prev,
        chatHistory: [...prev.chatHistory, userMsg],
        relationshipScore: newScore,
        eqScores: [...prev.eqScores, choice.eqScore],
        currentNodeId: choice.nextNodeId,
      };
    });

    setTimeout(() => {
      setGameState(prev => {
        if (!prev.scenario) return prev;
        const nextNode = prev.scenario.nodes[choice.nextNodeId];
        if (!nextNode) return prev;
        const npcMsg: ChatMessage = {
          id: `npc_${Date.now()}`,
          speaker: 'npc',
          text: nextNode.npcMessage,
          emotion: nextNode.npcEmotion,
        };
        const updated = { ...prev, chatHistory: [...prev.chatHistory, npcMsg] };

        if (nextNode.isEnding) {
          setTimeout(() => setScreen('outcome'), 1000);
        } else {
          setTimeout(() => {
            setShowChoices(true);
            setIsWaitingForNPC(false);
          }, 600);
        }

        return updated;
      });
    }, 700);
  };

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
  }, [gameState.chatHistory]);

  // ─── DIFFICULTY SELECT ──────────────────────────────────────────
  if (screen === 'difficulty-select') {
    return (
      <ScrollView style={[s.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={s.pagePad}>
          <Text style={[s.pageTitle, { color: colors.text }]}>🎮 Conversation Master</Text>
          <Text style={[s.pageSubtitle, { color: colors.textSecondary }]}>
            Navigate real conversations that matter. Every choice shapes the relationship.{'\n'}There are no perfect answers — only more skillful ones.
          </Text>
          <Text style={[s.sectionLabel, { color: colors.text }]}>Choose Difficulty</Text>
          {([
            { level: 'easy' as const, emoji: '🌱', title: 'Easy', desc: 'Workplace situations. Lower emotional stakes.', accent: colors.success },
            { level: 'medium' as const, emoji: '🌿', title: 'Medium', desc: 'Complex situations with mixed emotions.', accent: colors.warning },
            { level: 'hard' as const, emoji: '🌳', title: 'Hard', desc: 'Intimate relationships. High emotional stakes.', accent: colors.danger },
          ] as const).map(({ level, emoji, title, desc, accent }) => (
            <TouchableOpacity
              key={level}
              onPress={() => { setSelectedDifficulty(level); setScreen('scenario-select'); }}
              style={[s.diffCard, { backgroundColor: colors.surface, borderLeftColor: accent }]}
            >
              <Text style={s.diffEmoji}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.diffTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[s.diffDesc, { color: colors.textSecondary }]}>{desc}</Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ─── SCENARIO SELECT ────────────────────────────────────────────
  if (screen === 'scenario-select' && selectedDifficulty) {
    const scenarios = getScenariosByDifficulty(selectedDifficulty);
    return (
      <ScrollView style={[s.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={s.pagePad}>
          <TouchableOpacity onPress={() => setScreen('difficulty-select')} style={{ marginBottom: Spacing.lg }}>
            <Text style={{ color: colors.accent, fontSize: FontSize.md }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[s.pageTitle, { color: colors.text, textTransform: 'capitalize' }]}>
            {selectedDifficulty} Scenarios
          </Text>
          {scenarios.map(sc => (
            <TouchableOpacity key={sc.id} onPress={() => handleStartScenario(sc)}>
              <View style={[s.scenCard, { backgroundColor: colors.surface }]}>
                <View style={s.scenCardTop}>
                  <Text style={{ fontSize: 34 }}>{sc.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.scenTitle, { color: colors.text }]}>{sc.title}</Text>
                    <Text style={[s.scenSit, { color: colors.textSecondary }]}>{sc.situation}</Text>
                  </View>
                </View>
                <View style={s.tagRow}>
                  {sc.eqSkillsFocused.slice(0, 3).map(skill => (
                    <View key={skill} style={[s.tag, { backgroundColor: colors.accentLight }]}>
                      <Text style={[s.tagText, { color: colors.accent }]}>{skill.replace(/-/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[s.startCta, { color: colors.accent }]}>Begin conversation →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ─── PLAYING ────────────────────────────────────────────────────
  if (screen === 'playing' && gameState.scenario) {
    const lastNPCMsg = [...gameState.chatHistory].reverse().find(m => m.speaker === 'npc');
    const npcEmotion = lastNPCMsg?.emotion || 'neutral';
    const currentNode = getCurrentNode(gameState);

    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        {/* ── Top bar ── */}
        <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { setScreen('difficulty-select'); setSelectedDifficulty(null); }}>
            <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>← Exit</Text>
          </TouchableOpacity>

          <View style={s.npcChip}>
            <Text style={{ fontSize: 36 }}>{EMOTION_EMOJI[npcEmotion]}</Text>
            <Text style={[s.npcName, { color: colors.text }]}>{gameState.scenario.npcName}</Text>
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* ── Relationship bar ── */}
        <View style={[s.relBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={s.relRow}>
            <Text style={[s.relLabel, { color: colors.textSecondary }]}>Relationship</Text>
            <Text style={[s.relStatus, { color: getBarColor(gameState.relationshipScore) }]}>
              {getRelationshipLabel(gameState.relationshipScore)}
            </Text>
          </View>
          <View style={[s.barTrack, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                s.barFill,
                {
                  backgroundColor: getBarColor(gameState.relationshipScore),
                  width: relationshipAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
        </View>

        {/* ── Goal banner ── */}
        <View style={[s.goalBanner, { backgroundColor: colors.accentLight }]}>
          <Text style={[s.goalText, { color: colors.accent }]}>
            Goal: {gameState.scenario.userGoal}
          </Text>
        </View>

        {/* ── Chat history ── */}
        <ScrollView
          ref={scrollViewRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {gameState.chatHistory.map(msg => (
            <View
              key={msg.id}
              style={[s.msgRow, msg.speaker === 'user' ? s.msgRight : s.msgLeft]}
            >
              {msg.speaker === 'npc' && (
                <Text style={s.avatarEmoji}>
                  {EMOTION_EMOJI[msg.emotion || 'neutral']}
                </Text>
              )}
              <View
                style={[
                  s.bubble,
                  msg.speaker === 'user'
                    ? { backgroundColor: colors.accent, borderBottomRightRadius: 4, maxWidth: '72%' }
                    : { backgroundColor: colors.surface, borderBottomLeftRadius: 4, maxWidth: '72%' },
                ]}
              >
                <Text style={[
                  s.bubbleText,
                  { color: msg.speaker === 'user' ? '#fff' : colors.text },
                ]}>
                  {msg.text}
                </Text>
              </View>
              {msg.speaker === 'user' && (
                <Text style={s.avatarEmoji}>😊</Text>
              )}
            </View>
          ))}

          {isWaitingForNPC && (
            <View style={[s.msgRow, s.msgLeft]}>
              <Text style={s.avatarEmoji}>💬</Text>
              <View style={[s.bubble, { backgroundColor: colors.surface, borderBottomLeftRadius: 4 }]}>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>typing…</Text>
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── Choices ── */}
        {showChoices && currentNode && !currentNode.isEnding && currentNode.choices && (
          <View style={[s.choiceArea, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <Text style={[s.choicePrompt, { color: colors.textSecondary }]}>How do you respond?</Text>
            {currentNode.choices.map(ch => (
              <TouchableOpacity
                key={ch.id}
                onPress={() => handleChoice(ch)}
                style={[s.choiceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[s.choiceTxt, { color: colors.text }]}>{ch.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  // ─── OUTCOME ────────────────────────────────────────────────────
  if (screen === 'outcome' && gameState.scenario) {
    const node = getCurrentNode(gameState);
    const ending = node?.endingData;
    const avgEQ = gameState.eqScores.length > 0
      ? Math.round(gameState.eqScores.reduce((a, b) => a + b, 0) / gameState.eqScores.length)
      : 0;

    const impactMeta: Record<RelationshipImpact, { emoji: string; color: string; label: string }> = {
      damaged:     { emoji: '💔', color: colors.danger,  label: 'Relationship Damaged' },
      neutral:     { emoji: '😐', color: colors.textSecondary, label: 'Relationship Unchanged' },
      improved:    { emoji: '💚', color: colors.success, label: 'Relationship Improved' },
      strengthened:{ emoji: '💪', color: colors.accent,  label: 'Relationship Strengthened' },
    };

    const meta = impactMeta[ending?.relationshipImpact || 'neutral'];

    return (
      <ScrollView style={[s.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={s.pagePad}>

          {/* Impact */}
          <View style={s.outcomeHero}>
            <Text style={s.heroEmoji}>{meta.emoji}</Text>
            <Text style={[s.heroLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>

          {/* Relationship meter */}
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <View style={s.relRow}>
              <Text style={[s.cardLabel, { color: colors.text }]}>Final Relationship</Text>
              <Text style={[s.relScore, { color: getBarColor(gameState.relationshipScore) }]}>
                {gameState.relationshipScore}/100
              </Text>
            </View>
            <View style={[s.barTrack, { backgroundColor: colors.border, marginTop: Spacing.sm }]}>
              <View style={[s.barFill, {
                backgroundColor: getBarColor(gameState.relationshipScore),
                width: `${gameState.relationshipScore}%`,
              }]} />
            </View>
          </View>

          {/* EQ Score */}
          <View style={[s.card, { backgroundColor: colors.accentLight }]}>
            <Text style={[s.cardLabel, { color: colors.accent }]}>EQ Score</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={[s.eqBig, { color: colors.accent }]}>{avgEQ}</Text>
              <Text style={[s.eqDenom, { color: colors.accent }]}>/10</Text>
            </View>
          </View>

          {/* What happened */}
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <Text style={[s.cardLabel, { color: colors.text }]}>What Happened</Text>
            <Text style={[s.cardBody, { color: colors.textSecondary }]}>{ending?.finalMessage}</Text>
          </View>

          {/* EQ Lesson */}
          <View style={[s.card, { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.accent }]}>
            <Text style={[s.cardLabel, { color: colors.text }]}>💡 EQ Lesson</Text>
            <Text style={[s.cardBody, { color: colors.textSecondary }]}>{ending?.eqLesson}</Text>
          </View>

          {/* Skills used */}
          {ending?.skillsUsed && ending.skillsUsed.length > 0 && (
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              <Text style={[s.cardLabel, { color: colors.text }]}>Skills Practiced</Text>
              <View style={s.tagRow}>
                {ending.skillsUsed.map(skill => (
                  <View key={skill} style={[s.tag, { backgroundColor: colors.accent }]}>
                    <Text style={[s.tagText, { color: '#fff' }]}>{skill.replace(/-/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            onPress={() => handleStartScenario(gameState.scenario!)}
            style={[s.actionBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={[s.actionBtnTxt, { color: '#fff' }]}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setScreen('scenario-select'); }}
            style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          >
            <Text style={[s.actionBtnTxt, { color: colors.text }]}>Choose Different Scenario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setScreen('difficulty-select'); setSelectedDifficulty(null); }}
          >
            <Text style={[s.backLink, { color: colors.textSecondary }]}>Back to difficulty select</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  pagePad: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },

  // Typography
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  pageSubtitle: { fontSize: FontSize.md, lineHeight: 24, marginBottom: Spacing.xl },
  sectionLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },

  // Difficulty cards
  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
  },
  diffEmoji: { fontSize: 28 },
  diffTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 2 },
  diffDesc: { fontSize: FontSize.sm },

  // Scenario cards
  scenCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  scenCardTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.sm },
  scenTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 4 },
  scenSit: { fontSize: FontSize.sm, lineHeight: 18 },
  startCta: { fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.md },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontSize: FontSize.xs, fontWeight: '600' },

  // Playing top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  npcChip: { flex: 1, alignItems: 'center' },
  npcName: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },

  // Relationship bar
  relBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  relRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  relLabel: { fontSize: FontSize.xs },
  relStatus: { fontSize: FontSize.xs, fontWeight: '600' },
  relScore: { fontSize: FontSize.md, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  // Goal banner
  goalBanner: { paddingHorizontal: Spacing.md, paddingVertical: 6 },
  goalText: { fontSize: FontSize.xs, lineHeight: 16 },

  // Chat
  chatScroll: { flex: 1 },
  chatContent: { padding: Spacing.md, paddingTop: Spacing.lg },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  avatarEmoji: { fontSize: 22, marginBottom: 2 },
  bubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },

  // Choices
  choiceArea: {
    padding: Spacing.md,
    borderTopWidth: 1,
    paddingBottom: Spacing.lg,
  },
  choicePrompt: { fontSize: FontSize.xs, marginBottom: Spacing.sm },
  choiceBtn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  choiceTxt: { fontSize: FontSize.sm, lineHeight: 20 },

  // Outcome
  outcomeHero: { alignItems: 'center', marginBottom: Spacing.xl },
  heroEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  heroLabel: { fontSize: FontSize.xl, fontWeight: '700' },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardLabel: { fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm },
  cardBody: { fontSize: FontSize.sm, lineHeight: 22 },
  eqBig: { fontSize: 52, fontWeight: '800' },
  eqDenom: { fontSize: FontSize.md, marginBottom: 12 },
  actionBtn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  actionBtnTxt: { fontSize: FontSize.md, fontWeight: '700', textAlign: 'center' },
  backLink: { fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.sm },
});
