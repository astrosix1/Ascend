import React from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, Typography } from '../utils/theme';
import { getRecoveryTimeline } from '../data/recoveryMilestones';
import type { Habit } from '../utils/types';
import Card from './Card';
import Button from './Button';
import ProgressBar from './ProgressBar';

interface RecoveryOverviewProps {
  habits: Habit[];
  onOpen: (habit: Habit) => void;
  /** Called from the empty state to start a quit habit. */
  onAddQuit: () => void;
}

function daysUntil(atDays: number, daysClean: number): string {
  const left = Math.max(0, atDays - daysClean);
  if (left <= 0) return 'today';
  if (left < 1) return 'within a day';
  const d = Math.ceil(left);
  return d === 1 ? 'in 1 day' : `in ${d} days`;
}

/** What your clean days are doing for you, per quit habit. Opens the full timeline. */
export default function RecoveryOverview({ habits, onOpen, onAddQuit }: RecoveryOverviewProps) {
  const { colors } = useApp();
  const quitting = habits.filter(h => h.type === 'bad');

  if (quitting.length === 0) {
    return (
      <Card style={{ marginBottom: Spacing.md }}>
        <Text style={[Typography.label, { color: colors.accentText }]}>RECOVERY</Text>
        <Text style={[Typography.heading, { color: colors.text, marginTop: 2 }]}>See what your clean days do</Text>
        <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
          Add a habit you want to quit and Ascend shows what often changes in your sleep, mood and body, day by day.
        </Text>
        <View style={{ marginTop: Spacing.md, alignItems: 'flex-start' }}>
          <Button title="Add a quit habit" variant="secondary" size="small" onPress={onAddQuit} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <Text style={[Typography.label, { color: colors.accentText }]}>RECOVERY</Text>
      <Text style={[Typography.heading, { color: colors.text, marginTop: 2, marginBottom: Spacing.sm }]}>
        What your clean days are doing
      </Text>

      {quitting.map((habit, i) => {
        const t = getRecoveryTimeline(habit);
        return (
          <View
            key={habit.id}
            style={{
              paddingVertical: Spacing.sm,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.subheading, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
                <Text style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                  {t.daysClean === 1 ? '1 day clean' : `${t.daysClean} days clean`} · {t.reachedCount} of {t.total} milestones
                </Text>
              </View>
              <Button title="View timeline" variant="ghost" size="small" onPress={() => onOpen(habit)} accessibilityHint={`Opens the recovery timeline for ${habit.name}`} />
            </View>

            {t.nextMilestone ? (
              <View style={{ marginTop: Spacing.sm }}>
                <ProgressBar progress={t.progressToNext} color={colors.accent} />
                <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Next: {t.nextMilestone.title} {daysUntil(t.nextMilestone.atDays, t.daysClean)}
                </Text>
              </View>
            ) : (
              <Text style={[Typography.caption, { color: colors.success, marginTop: Spacing.sm }]}>
                Every milestone reached. Remarkable work.
              </Text>
            )}
          </View>
        );
      })}
    </Card>
  );
}
