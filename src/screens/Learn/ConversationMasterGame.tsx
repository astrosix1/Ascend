import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { Scenario, UserChoice, NPCResponse, CONVERSATION_MASTER_SCENARIOS, getScenariosByDifficulty } from '../../data/conversationMasterScenarios';

type GameScreen = 'difficulty-select' | 'scenario-select' | 'playing' | 'outcome';

interface GameState {
  scenario: Scenario | null;
  currentConversation: Array<{ speaker: 'npc' | 'user'; text: string; emoticon?: string }>;
  selectedChoices: UserChoice[];
  currentOutcome: NPCResponse | null;
  eqScores: number[];
  gameStarted: boolean;
}

export default function ConversationMasterGame() {
  const { colors } = useApp();
  const [screen, setScreen] = useState<GameScreen>('difficulty-select');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    scenario: null,
    currentConversation: [],
    selectedChoices: [],
    currentOutcome: null,
    eqScores: [],
    gameStarted: false,
  });

  const handleSelectDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setScreen('scenario-select');
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setGameState({
      scenario,
      currentConversation: [
        { speaker: 'npc', text: scenario.npcInitialMessage, emoticon: '😐' },
      ],
      selectedChoices: [],
      currentOutcome: null,
      eqScores: [],
      gameStarted: true,
    });
    setScreen('playing');
  };

  const handleChoice = (choice: UserChoice) => {
    // Add user response to conversation
    const updatedConversation = [...gameState.currentConversation, { speaker: 'user' as const, text: choice.text }];

    // Get NPC response
    const npcResponse = choice.npcResponses.response;

    // Add NPC reaction
    updatedConversation.push({
      speaker: 'npc',
      text: npcResponse.text,
      emoticon: npcResponse.emoticon,
    });

    setGameState(prev => ({
      ...prev,
      currentConversation: updatedConversation,
      selectedChoices: [...prev.selectedChoices, choice],
      currentOutcome: npcResponse,
      eqScores: [...prev.eqScores, npcResponse.eqScore],
    }));

    setScreen('outcome');
  };

  const handleContinue = () => {
    if (gameState.selectedChoices.length >= 1) {
      // Game over - show final score
      setScreen('outcome');
    }
  };

  const handlePlayAgain = () => {
    setGameState({
      scenario: null,
      currentConversation: [],
      selectedChoices: [],
      currentOutcome: null,
      eqScores: [],
      gameStarted: false,
    });
    setScreen('difficulty-select');
    setSelectedDifficulty(null);
  };

  const handleBackToScenarios = () => {
    setScreen('scenario-select');
  };

  const handleBackToDifficulty = () => {
    setScreen('difficulty-select');
    setSelectedDifficulty(null);
  };

  // ─── DIFFICULTY SELECT ──────────────────────────────────────
  if (screen === 'difficulty-select') {
    return (
      <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>
            Conversation Master
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.lg, lineHeight: 24 }}>
            Navigate real-world conversations and build emotional intelligence through dialogue. Your choices matter.
          </Text>

          <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md }}>
            Choose Difficulty
          </Text>

          {[
            { level: 'easy' as const, title: 'Easy', description: 'Simple conversations, clear outcomes', emoji: '🌱' },
            { level: 'medium' as const, title: 'Medium', description: 'Complex situations, mixed emotions', emoji: '🌿' },
            { level: 'hard' as const, title: 'Hard', description: 'Nuanced conflicts, challenging dynamics', emoji: '🌳' },
          ].map(({ level, title, description, emoji }) => (
            <TouchableOpacity key={level} onPress={() => handleSelectDifficulty(level)}>
              <Card style={{ marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: colors.accent }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md }}>
                      {title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
                      {description}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ─── SCENARIO SELECT ────────────────────────────────────────
  if (screen === 'scenario-select' && selectedDifficulty) {
    const scenarios = getScenariosByDifficulty(selectedDifficulty);
    return (
      <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <TouchableOpacity onPress={handleBackToDifficulty}>
              <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textTransform: 'capitalize' }}>
              {selectedDifficulty} Scenarios
            </Text>
          </View>

          {scenarios.map(scenario => (
            <TouchableOpacity key={scenario.id} onPress={() => handleSelectScenario(scenario)}>
              <Card style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                  <Text style={{ fontSize: 28 }}>{scenario.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md, marginBottom: 4 }}>
                      {scenario.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
                      {scenario.situation}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                      {scenario.eqSkillsFocused.slice(0, 2).map(skill => (
                        <View key={skill} style={{
                          backgroundColor: colors.accentLight,
                          paddingHorizontal: Spacing.xs,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}>
                          <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '600' }}>
                            {skill.replace('-', ' ')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ─── PLAYING ────────────────────────────────────────────────
  if (screen === 'playing' && gameState.scenario && !gameState.currentOutcome) {
    const choices = gameState.currentConversation.length === 1
      ? gameState.scenario.initialChoices
      : [];

    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
            {/* Scenario Header */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>
                {gameState.scenario.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md }}>
                Goal: {gameState.scenario.userGoal}
              </Text>
              <Card style={{ backgroundColor: colors.surfaceLight }}>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
                  {gameState.scenario.context}
                </Text>
              </Card>
            </View>

            {/* Conversation */}
            <View style={{ marginBottom: Spacing.lg }}>
              {gameState.currentConversation.map((msg, idx) => (
                <View key={idx} style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                    <Text style={{ fontSize: 24 }}>
                      {msg.speaker === 'npc' ? gameState.scenario?.npcEmoji : '😊'}
                    </Text>
                    <View style={{
                      flex: 1,
                      backgroundColor: msg.speaker === 'npc' ? colors.surface : colors.accentLight,
                      borderRadius: BorderRadius.md,
                      padding: Spacing.md,
                    }}>
                      <Text style={{
                        color: msg.speaker === 'npc' ? colors.text : colors.accent,
                        fontSize: FontSize.md,
                        lineHeight: 22,
                      }}>
                        {msg.text}
                      </Text>
                      {msg.emoticon && (
                        <Text style={{ marginTop: Spacing.xs, fontSize: 18 }}>
                          {msg.emoticon}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Choices */}
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
              How do you respond?
            </Text>
            <View style={{ gap: Spacing.md }}>
              {choices.map(choice => (
                <TouchableOpacity key={choice.id} onPress={() => handleChoice(choice)}>
                  <Card style={{
                    backgroundColor: colors.surface,
                    borderLeftWidth: 3,
                    borderLeftColor: {
                      assertive: colors.success,
                      aggressive: colors.danger,
                      passive: colors.warning,
                      'passive-aggressive': colors.warning,
                      'people-pleaser': colors.warning,
                    }[choice.style],
                  }}>
                    <Text style={{ color: colors.text, fontSize: FontSize.md, marginBottom: Spacing.xs, lineHeight: 22 }}>
                      {choice.text}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontStyle: 'italic' }}>
                      {choice.style.replace('-', ' ')} response
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── OUTCOME ────────────────────────────────────────────────
  if (screen === 'outcome' && gameState.scenario && gameState.currentOutcome) {
    const avgScore = gameState.eqScores.length > 0
      ? Math.round(gameState.eqScores.reduce((a, b) => a + b, 0) / gameState.eqScores.length)
      : 0;

    const getRelationshipEmoji = () => {
      switch (gameState.currentOutcome?.relationshipImpact) {
        case 'damaged': return '💔';
        case 'neutral': return '😐';
        case 'improved': return '💚';
        case 'strengthened': return '💪';
        default: return '😐';
      }
    };

    return (
      <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
          {/* Outcome Header */}
          <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>
              {getRelationshipEmoji()}
            </Text>
            <Text style={{ color: colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textTransform: 'capitalize' }}>
              Relationship: {gameState.currentOutcome.relationshipImpact}
            </Text>
          </View>

          {/* EQ Score */}
          <Card style={{ marginBottom: Spacing.lg, backgroundColor: colors.accentLight }}>
            <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '600', textTransform: 'uppercase', marginBottom: Spacing.sm }}>
              EQ Score
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md }}>
              <Text style={{ color: colors.accent, fontSize: 48, fontWeight: FontWeight.bold }}>
                {avgScore}
              </Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.md, marginBottom: Spacing.sm }}>
                / 10
              </Text>
            </View>
          </Card>

          {/* Lesson */}
          <Card style={{ marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.accent }}>
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
              💡 What You Learned
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 }}>
              {gameState.currentOutcome.eqLesson}
            </Text>
          </Card>

          {/* Skills */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
              Skills Practiced
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {gameState.scenario.eqSkillsFocused.map(skill => (
                <View key={skill} style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 4,
                  borderRadius: BorderRadius.full,
                }}>
                  <Text style={{ color: '#fff', fontSize: FontSize.xs, fontWeight: '600' }}>
                    {skill.replace('-', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Actions */}
          <Button title="Play Again" onPress={handlePlayAgain} style={{ marginBottom: Spacing.md }} />
          <Button title="Choose Different Scenario" variant="secondary" onPress={handleBackToScenarios} />
        </View>
      </ScrollView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
