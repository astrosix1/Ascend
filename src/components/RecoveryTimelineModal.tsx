import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, FontSize, BorderRadius } from '../utils/theme';
import { Habit } from '../utils/types';
import { getRecoveryTimeline } from '../data/recoveryMilestones';

interface RecoveryTimelineModalProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}

export default function RecoveryTimelineModal({
  habit,
  visible,
  onClose,
}: RecoveryTimelineModalProps) {
  const { colors } = useApp();

  if (!habit) return null;

  const timeline = getRecoveryTimeline(habit);
  const { daysClean, reachedCount, total, milestones, nextMilestone, progressToNext } = timeline;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              🩺 Recovery Timeline
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={{ color: colors.textSecondary, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.habitName, { color: colors.textSecondary }]} numberOfLines={1}>
            {habit.name}
          </Text>

          {/* Hero — days clean + progress to next milestone */}
          <View style={[styles.hero, { backgroundColor: colors.background }]}>
            <Text style={[styles.heroDays, { color: colors.accent }]}>{daysClean}</Text>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
              {daysClean === 1 ? 'day clean' : 'days clean'} · {reachedCount}/{total} milestones
            </Text>

            {nextMilestone ? (
              <>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.accent, width: `${Math.round(progressToNext * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.nextText, { color: colors.textTertiary }]}>
                  Next: {nextMilestone.icon} {nextMilestone.title} ({nextMilestone.when})
                </Text>
              </>
            ) : (
              <Text style={[styles.nextText, { color: colors.accent }]}>
                🏆 Every milestone reached — incredible work.
              </Text>
            )}
          </View>

          {/* Milestone list */}
          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: Spacing.sm }}>
            {milestones.map((m, i) => {
              const isLast = i === milestones.length - 1;
              const isNext = nextMilestone?.id === m.id;
              return (
                <View key={m.id} style={styles.row}>
                  {/* Rail + node */}
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.node,
                        m.reached
                          ? { backgroundColor: colors.accent, borderColor: colors.accent }
                          : { backgroundColor: 'transparent', borderColor: isNext ? colors.accent : colors.border },
                      ]}
                    >
                      <Text style={styles.nodeIcon}>{m.reached ? '✓' : m.icon}</Text>
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.connector,
                          { backgroundColor: m.reached ? colors.accent : colors.border },
                        ]}
                      />
                    )}
                  </View>

                  {/* Content */}
                  <View style={[styles.body, { opacity: m.reached ? 1 : 0.55 }]}>
                    <View style={styles.bodyTop}>
                      <Text style={[styles.when, { color: m.reached ? colors.accent : colors.textTertiary }]}>
                        {m.when}
                      </Text>
                      {isNext && (
                        <Text style={[styles.nextPill, { color: colors.accent, borderColor: colors.accent }]}>
                          UP NEXT
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.mTitle, { color: colors.text }]}>
                      {m.icon} {m.title}
                    </Text>
                    <Text style={[styles.mBody, { color: colors.textSecondary }]}>{m.body}</Text>
                  </View>
                </View>
              );
            })}

            {/* Sources */}
            <Text style={[styles.sources, { color: colors.textTertiary }]}>
              {timeline.sources.map(s => `Source: ${s}`).join('\n')}
              {'\n'}General guidance only — recovery varies by person and is not medical advice.
            </Text>
          </ScrollView>

          {/* Close */}
          <TouchableOpacity onPress={onClose} style={[styles.closeLarge, { borderColor: colors.border }]}>
            <Text style={[styles.closeLargeText, { color: colors.textSecondary }]}>Keep going 💪</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    width: '90%',
    maxWidth: 500,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    maxHeight: '88%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: '700', flex: 1 },
  closeButton: { padding: Spacing.sm },
  habitName: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.md },
  hero: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroDays: { fontSize: 44, fontWeight: '800', lineHeight: 50 },
  heroLabel: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  nextText: { fontSize: FontSize.xs, fontWeight: '500', textAlign: 'center' },
  list: { maxHeight: 340 },
  row: { flexDirection: 'row' },
  rail: { width: 36, alignItems: 'center' },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIcon: { fontSize: 13, color: '#FFFFFF' },
  connector: { width: 2, flex: 1, minHeight: 18, marginVertical: 2 },
  body: { flex: 1, paddingBottom: Spacing.md, paddingLeft: Spacing.sm },
  bodyTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  when: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.4 },
  nextPill: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  mTitle: { fontSize: FontSize.md, fontWeight: '700', marginTop: 2, marginBottom: 3 },
  mBody: { fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.45 },
  sources: { fontSize: FontSize.xs, lineHeight: FontSize.xs * 1.5, marginTop: Spacing.sm, fontStyle: 'italic' },
  closeLarge: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeLargeText: { fontSize: FontSize.sm, fontWeight: '600' },
});
