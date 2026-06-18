import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { SCENARIO_EXERCISES, GAME_EXERCISES, ScenarioChoice, GameExercise, ScenarioExercise } from '../../data/eqInteractiveExercises';
import EQScenarioExercise from './EQScenarioExercise';
import EQGameExercise from './EQGameExercise';
import EQCompletion from './EQCompletion';
import EQPatternsInsight from './EQPatternsInsight';
import ConversationMasterGame from './ConversationMasterGame';

type EQScreen = 'landing' | 'scenario-browser' | 'game-browser' | 'scenario-active' | 'game-active' | 'patterns' | 'completion' | 'conversation-master';

export default function EQLab() {
  const { colors } = useApp();
  const [screen, setScreen] = useState<EQScreen>('landing');
  const [selectedExercise, setSelectedExercise] = useState<ScenarioExercise | GameExercise | null>(null);
  const [completionData, setCompletionData] = useState<{ timeSpent: number; score?: number } | null>(null);

  const allExercises = [...SCENARIO_EXERCISES, ...GAME_EXERCISES];

  const handleStartExercise = (exercise: ScenarioExercise | GameExercise) => {
    setSelectedExercise(exercise);
    if ('gameType' in exercise) {
      setScreen('game-active');
    } else {
      setScreen('scenario-active');
    }
  };

  const handleScenarioComplete = (choice: ScenarioChoice) => {
    setCompletionData({ timeSpent: Math.floor(Math.random() * 300) + 60 }); // Mock time
    setScreen('completion');
  };

  const handleGameComplete = (score: number, totalRounds: number) => {
    setCompletionData({ timeSpent: Math.floor(Math.random() * 300) + 60, score });
    setScreen('completion');
  };

  const handleCompletionDone = () => {
    setScreen('landing');
    setSelectedExercise(null);
    setCompletionData(null);
  };

  // ─── LANDING SCREEN ──────────────────────────────────────────
  const renderLanding = () => (
    <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
      <SectionHeader title="EQ Lab" />
      <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg, marginHorizontal: Spacing.md }}>
        Interactive exercises to build emotional intelligence through scenarios, games, and insights.
      </Text>

      {/* Navigation Cards */}
      <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.md }}>
        {/* Scenarios */}
        <TouchableOpacity onPress={() => setScreen('scenario-browser')}>
          <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: 28 }}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md }}>
                  Scenario Exercises
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
                  {SCENARIO_EXERCISES.length} branching dialogues
                </Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18 }}>→</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 }}>
              Face realistic conflicts and see how different communication styles play out.
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Games */}
        <TouchableOpacity onPress={() => setScreen('game-browser')}>
          <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.success }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: 28 }}>🎮</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md }}>
                  Interactive Games
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
                  {GAME_EXERCISES.length} skill-building games
                </Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18 }}>→</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 }}>
              Build emotional awareness and empathy through engaging mini-games.
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Conversation Master */}
        <TouchableOpacity onPress={() => setScreen('conversation-master')}>
          <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: 28 }}>🎮</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md }}>
                  Conversation Master
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
                  Interactive mini-game
                </Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18 }}>→</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 }}>
              Navigate real conversations and build emotional intelligence through interactive dialogue.
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Patterns */}
        <TouchableOpacity onPress={() => setScreen('patterns')}>
          <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.warning }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: 28 }}>📈</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md }}>
                  Your EQ Patterns
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
                  Data-driven insights
                </Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18 }}>→</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 }}>
              See your emotional strengths, growth areas, and progress over time.
            </Text>
          </Card>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── SCENARIO BROWSER ────────────────────────────────────────
  const renderScenarioBrowser = () => (
    <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.lg }}>
        <TouchableOpacity onPress={() => setScreen('landing')}>
          <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold }}>
          Scenario Exercises
        </Text>
      </View>

      <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.md }}>
        {SCENARIO_EXERCISES.map(exercise => (
          <TouchableOpacity key={exercise.id} onPress={() => handleStartExercise(exercise)}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                <Text style={{ fontSize: 28 }}>{exercise.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md, marginBottom: 4 }}>
                    {exercise.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
                    {exercise.scenario}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs }}>
                      💬 {exercise.choices.length} options
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, textTransform: 'capitalize' }}>
                      📊 {exercise.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // ─── GAME BROWSER ───────────────────────────────────────────
  const renderGameBrowser = () => (
    <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.lg }}>
        <TouchableOpacity onPress={() => setScreen('landing')}>
          <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold }}>
          Interactive Games
        </Text>
      </View>

      <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.md }}>
        {GAME_EXERCISES.map(exercise => (
          <TouchableOpacity key={exercise.id} onPress={() => handleStartExercise(exercise)}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                <Text style={{ fontSize: 28 }}>{exercise.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md, marginBottom: 4 }}>
                    {exercise.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
                    {exercise.description}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs }}>
                      🎮 {exercise.rounds.length} rounds
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, textTransform: 'capitalize' }}>
                      📊 {exercise.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // ─── RENDER BY SCREEN ────────────────────────────────────────
  if (screen === 'landing') {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {renderLanding()}
      </View>
    );
  }

  if (screen === 'scenario-browser') {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {renderScenarioBrowser()}
      </View>
    );
  }

  if (screen === 'game-browser') {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {renderGameBrowser()}
      </View>
    );
  }

  if (screen === 'scenario-active' && selectedExercise && 'choices' in selectedExercise) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <EQScenarioExercise
          exercise={selectedExercise}
          onComplete={handleScenarioComplete}
        />
      </View>
    );
  }

  if (screen === 'game-active' && selectedExercise && 'gameType' in selectedExercise) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <EQGameExercise
          exercise={selectedExercise}
          onComplete={handleGameComplete}
        />
      </View>
    );
  }

  if (screen === 'completion' && completionData) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <EQCompletion
          exercise={{ title: selectedExercise?.title || 'Exercise' } as any}
          timeSpent={completionData.timeSpent}
          onDone={handleCompletionDone}
        />
      </View>
    );
  }

  if (screen === 'conversation-master') {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <ConversationMasterGame />
      </View>
    );
  }

  if (screen === 'patterns') {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, marginBottom: Spacing.lg }}>
          <TouchableOpacity onPress={() => setScreen('landing')}>
            <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
        </View>
        <EQPatternsInsight completions={[]} />
      </View>
    );
  }

  // Fallback (shouldn't reach here)
  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {renderLanding()}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
