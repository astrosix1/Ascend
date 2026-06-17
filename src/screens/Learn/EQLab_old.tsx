import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { EQ_EXERCISES, EQ_CATEGORIES, getDailyChallenge, getExercisesByCategory, EQExercise } from '../../data/eqExercises';
import EQExerciseDetail from './EQExerciseDetail';
import EQExercisePlayer from './EQExercisePlayer';
import EQCompletion from './EQCompletion';

type EQScreen = 'landing' | 'category' | 'detail' | 'player' | 'completion';

export default function EQLab() {
  const { colors } = useApp();
  const [screen, setScreen] = useState<EQScreen>('landing');
  const [selectedExercise, setSelectedExercise] = useState<EQExercise | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EQ_CATEGORIES | null>(null);
  const [completionData, setCompletionData] = useState<{ exercise: EQExercise; timeSpent: number } | null>(null);

  const dailyChallenge = getDailyChallenge();

  const handleStartChallenge = () => {
    setSelectedExercise(dailyChallenge);
    setScreen('detail');
  };

  const handleCategorySelect = (category: keyof typeof EQ_CATEGORIES) => {
    setSelectedCategory(category);
    setScreen('category');
  };

  const handleExerciseSelect = (exercise: EQExercise) => {
    setSelectedExercise(exercise);
    setScreen('detail');
  };

  const handleStartExercise = () => {
    setScreen('player');
  };

  const handleExerciseComplete = (timeSpent: number) => {
    if (selectedExercise) {
      setCompletionData({ exercise: selectedExercise, timeSpent });
      setScreen('completion');
    }
  };

  const handleBackToLanding = () => {
    setScreen('landing');
    setSelectedExercise(null);
    setSelectedCategory(null);
  };

  const handleBackToCategory = () => {
    setScreen('category');
  };

  // ─── LANDING SCREEN ──────────────────────────────────────────
  const renderLanding = () => (
    <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
      <SectionHeader title="EQ Lab" />
      <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg, marginHorizontal: Spacing.md }}>
        Daily exercises to boost your emotional intelligence
      </Text>

      {/* Daily Challenge Card */}
      <Card style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.lg }}>
        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', marginBottom: Spacing.xs, letterSpacing: 0.5 }}>
          Today's Challenge
        </Text>
        <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>
          {dailyChallenge.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 }}>
          {dailyChallenge.description}
        </Text>
        <Button title="Start Challenge →" onPress={handleStartChallenge} />
      </Card>

      {/* Categories */}
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md, marginHorizontal: Spacing.md, marginBottom: Spacing.md }}>
        Browse Exercises
      </Text>
      <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.md }}>
        {Object.entries(EQ_CATEGORIES).map(([key, category]) => {
          const count = getExercisesByCategory(key as keyof typeof EQ_CATEGORIES).length;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => handleCategorySelect(key as keyof typeof EQ_CATEGORIES)}
              style={[
                s.categoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
                  <Text style={{ fontSize: 24 }}>{category.icon}</Text>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: FontSize.md }}>
                      {category.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
                      {count} exercises
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.accent, fontSize: 18 }}>→</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  // ─── CATEGORY LIST SCREEN ────────────────────────────────────
  const renderCategory = () => {
    if (!selectedCategory) return null;
    const category = EQ_CATEGORIES[selectedCategory];
    const exercises = getExercisesByCategory(selectedCategory);

    return (
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.lg }}>
          <TouchableOpacity onPress={handleBackToLanding}>
            <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold }}>
            {category.name}
          </Text>
        </View>

        <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.md }}>
          {exercises.map(exercise => (
            <TouchableOpacity key={exercise.id} onPress={() => handleExerciseSelect(exercise)}>
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
                        ⏱ {exercise.duration} min
                      </Text>
                      <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs }}>
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
  };

  // Render based on screen state
  if (screen === 'detail' && selectedExercise) {
    return <EQExerciseDetail exercise={selectedExercise} onStart={handleStartExercise} onBack={handleBackToCategory} />;
  }

  if (screen === 'player' && selectedExercise) {
    return <EQExercisePlayer exercise={selectedExercise} onComplete={handleExerciseComplete} />;
  }

  if (screen === 'completion' && completionData) {
    return <EQCompletion exercise={completionData.exercise} timeSpent={completionData.timeSpent} onDone={handleBackToLanding} />;
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {screen === 'landing' && renderLanding()}
      {screen === 'category' && renderCategory()}
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
  categoryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 0,
  },
});
