import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { ScenarioExercise, ScenarioChoice } from '../../data/eqInteractiveExercises';

interface EQScenarioExerciseProps {
  exercise: ScenarioExercise;
  onComplete: (choice: ScenarioChoice) => void;
}

export default function EQScenarioExercise({ exercise, onComplete }: EQScenarioExerciseProps) {
  const { colors } = useApp();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);

  const choice = exercise.choices.find(c => c.id === selectedChoice);

  const handleSelectChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
  };

  const handleRevealOutcome = () => {
    setShowOutcome(true);
  };

  const handleContinue = () => {
    if (choice) {
      onComplete(choice);
    }
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
        {/* Scenario Setup */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
            The Scenario
          </Text>
          <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md, lineHeight: 26 }}>
            {exercise.scenario}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
            {exercise.context}
          </Text>
        </Card>

        {/* Choices */}
        {!showOutcome ? (
          <>
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
              What would you do?
            </Text>
            <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
              {exercise.choices.map(choice => (
                <TouchableOpacity
                  key={choice.id}
                  onPress={() => handleSelectChoice(choice.id)}
                  style={[
                    s.choiceCard,
                    {
                      backgroundColor: selectedChoice === choice.id ? colors.accentLight : colors.surface,
                      borderColor: selectedChoice === choice.id ? colors.accent : colors.border,
                      borderWidth: selectedChoice === choice.id ? 2 : 0.5,
                    },
                  ]}
                >
                  <Text style={{
                    color: selectedChoice === choice.id ? colors.accent : colors.text,
                    fontSize: FontSize.md,
                    fontWeight: selectedChoice === choice.id ? '600' : '500',
                    lineHeight: 22,
                  }}>
                    {choice.text}
                  </Text>
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: FontSize.xs,
                    marginTop: Spacing.sm,
                    fontStyle: 'italic',
                  }}>
                    {choice.style.replace('-', ' ')} response
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedChoice && (
              <Button
                title="See What Happens →"
                onPress={handleRevealOutcome}
              />
            )}
          </>
        ) : choice ? (
          <>
            {/* Outcome */}
            <Card style={{ marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
              <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
                What Happens
              </Text>
              <Text style={{ color: colors.text, fontSize: FontSize.md, lineHeight: 24 }}>
                {choice.outcome}
              </Text>
            </Card>

            {/* EQ Insight */}
            <Card style={{ marginBottom: Spacing.lg, backgroundColor: colors.accentLight }}>
              <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '600', textTransform: 'uppercase', marginBottom: Spacing.sm }}>
                💡 EQ Insight
              </Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.md, lineHeight: 24, fontWeight: '500' }}>
                {choice.eqInsight}
              </Text>
            </Card>

            {/* Skills Gained */}
            <Card style={{ marginBottom: Spacing.lg }}>
              <Text style={{ color: colors.text, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.md, textTransform: 'uppercase' }}>
                Skills Gained
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                {choice.skillsGained.map(skill => (
                  <View key={skill} style={{
                    backgroundColor: colors.success,
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

            {/* Reflection Prompt */}
            <Card style={{ backgroundColor: colors.surfaceLight, marginBottom: Spacing.lg }}>
              <Text style={{ color: colors.text, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm }}>
                Reflect
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
                In a real situation like this, which response would feel most natural to you? Is that serving you well?
              </Text>
            </Card>

            <Button title="Complete Exercise" onPress={handleContinue} />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  choiceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
});
