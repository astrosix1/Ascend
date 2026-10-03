import React from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, Typography } from '../utils/theme';
import { getDayState } from '../utils/nextAction';
import type { Habit } from '../utils/types';
import Card from './Card';
import Button from './Button';

interface NextActionProps {
  habits: Habit[];
  today: string;
  onComplete: (habitId: string) => void;
}

/**
 * The one thing to look at first: what to do next, with a single button.
 * When everything is done it says so, plainly and without fuss.
 */
export default function NextAction({ habits, today, onComplete }: NextActionProps) {
  const { colors } = useApp();
  const state = getDayState(habits, today);
  if (state.kind === 'empty') return null;

  if (state.kind === 'done') {
    return (
      <Card style={{ margin: Spacing.md, marginBottom: 0 }}>
        <Text style={[Typography.label, { color: colors.accentText }]}>TODAY</Text>
        <Text style={[Typography.heading, { color: colors.text, marginTop: 2 }]}>All {state.total} done. Well done.</Text>
        <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
          Rest well. Your streaks are safe for today.
        </Text>
      </Card>
    );
  }

  const { habit, remaining } = state;
  return (
    <Card style={{ margin: Spacing.md, marginBottom: 0 }}>
      <Text style={[Typography.label, { color: colors.accentText }]}>
        UP NEXT · {remaining} LEFT
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs }}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.heading, { color: colors.text }]} numberOfLines={2}>{habit.name}</Text>
          {habit.streak > 0 ? (
            <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              Keep your {habit.streak}-day streak going.
            </Text>
          ) : null}
        </View>
        <Button title="Mark done" onPress={() => onComplete(habit.id)} accessibilityHint={`Marks ${habit.name} as done for today`} />
      </View>
    </Card>
  );
}
