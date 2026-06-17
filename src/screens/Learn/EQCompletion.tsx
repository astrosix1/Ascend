import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { EQExercise } from '../../data/eqExercises';

interface EQCompletionProps {
  exercise: EQExercise;
  timeSpent: number;
  onDone: () => void;
}

export default function EQCompletion({ exercise, timeSpent, onDone }: EQCompletionProps) {
  const { colors } = useApp();
  const [effectiveness, setEffectiveness] = useState<1 | 2 | 3 | 4 | null>(null);
  const [notes, setNotes] = useState('');

  const handleDone = () => {
    // TODO: Save completion to database
    // {
    //   exerciseId: exercise.id,
    //   effectiveness,
    //   reflection: notes,
    //   timeSpent,
    //   completedAt: new Date()
    // }
    onDone();
  };

  const effectivenessEmojis = {
    1: '😞',
    2: '😐',
    3: '🙂',
    4: '😊',
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Success Header */}
        <View style={{ alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl }}>
          <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>✓</Text>
          <Text style={{ color: colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.xs }}>
            Well done!
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.md }}>
            You completed {exercise.title} in {formatTime(timeSpent)}
          </Text>
        </View>

        {/* Effectiveness Rating */}
        <Card style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
            How helpful was this?
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {([1, 2, 3, 4] as const).map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => setEffectiveness(level)}
                style={[
                  s.emojiButton,
                  {
                    backgroundColor: effectiveness === level ? colors.accentLight : colors.surfaceLight,
                    borderColor: effectiveness === level ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 32 }}>{effectivenessEmojis[level]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Notes / Reflection */}
        <Card style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
            Notes (optional)
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.md }}>
            How did you feel? When will you do this again?
          </Text>
          <TextInput
            style={[
              s.notesInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Write your thoughts..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
          />
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, textAlign: 'right', marginTop: Spacing.xs }}>
            {notes.length}/500
          </Text>
        </Card>

        {/* Stats */}
        <Card style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', marginBottom: 4 }}>
                Time Spent
              </Text>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: '600' }}>
                {formatTime(timeSpent)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', marginBottom: 4 }}>
                Difficulty
              </Text>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: '600', textTransform: 'capitalize' }}>
                {exercise.difficulty}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title="Done" onPress={handleDone} style={{ marginBottom: Spacing.md }} />
        <Button title="Try Another Exercise" variant="secondary" onPress={onDone} />
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
  emojiButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
