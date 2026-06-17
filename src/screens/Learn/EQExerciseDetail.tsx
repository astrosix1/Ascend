import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { EQExercise, EQ_CATEGORIES } from '../../data/eqExercises';

interface EQExerciseDetailProps {
  exercise: EQExercise;
  onStart: () => void;
  onBack: () => void;
}

export default function EQExerciseDetail({ exercise, onStart, onBack }: EQExerciseDetailProps) {
  const { colors } = useApp();
  const category = EQ_CATEGORIES[exercise.category];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
          {/* Back button + category */}
          <TouchableOpacity onPress={onBack} style={{ marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
            <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '500' }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', marginBottom: Spacing.sm, letterSpacing: 0.5 }}>
            {category.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
            <Text style={{ fontSize: 32 }}>{exercise.icon}</Text>
            <Text style={{ color: colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, flex: 1 }}>
              {exercise.title}
            </Text>
          </View>

          {/* Metadata */}
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.lg, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', marginBottom: 4 }}>Duration</Text>
              <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600' }}>{exercise.duration} min</Text>
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', marginBottom: 4 }}>Difficulty</Text>
              <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', textTransform: 'capitalize' }}>
                {exercise.difficulty}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
              What is {exercise.title}?
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
              {exercise.fullDescription || exercise.description}
            </Text>
          </Card>

          {/* Steps */}
          <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
            How to do it
          </Text>
          <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
            {exercise.steps.map((step, idx) => (
              <View key={idx} style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.accentLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Text style={{ color: colors.accent, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: FontSize.sm, lineHeight: 20 }}>
                    {step.instruction}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Skills Built */}
          <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
            Skills built
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg }}>
            {exercise.skillsBuilt.map(skill => (
              <View key={skill} style={{
                backgroundColor: colors.accentLight,
                borderRadius: BorderRadius.full,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 4,
              }}>
                <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'capitalize' }}>
                  {skill.replace('-', ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Start button */}
      <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title="Start Exercise" onPress={onStart} />
      </View>
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
