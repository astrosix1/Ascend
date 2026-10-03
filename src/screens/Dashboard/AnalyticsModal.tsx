import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { usePremium } from '../../contexts/PremiumContext';
import { Spacing, FontSize } from '../../utils/theme';
import { buildPremiumCheckoutUrl } from '../../utils/env';
import { calculateMonthStats, getHabitCompletionRate } from '../../utils/dashboardStats';
import ProgressBar from '../../components/ProgressBar';
import Button from '../../components/Button';
import { styles } from './DashboardScreen.styles';

interface AnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  today: string;
}

/**
 * Advanced insights (Premium): top and struggling habits, 30-day summary and
 * per-category breakdown. Non-premium users see the upgrade prompt instead.
 */
export default function AnalyticsModal({ visible, onClose, today }: AnalyticsModalProps) {
  const { colors, habits } = useApp();
  const { isPremium } = usePremium();

  const monthStats = useMemo(() => calculateMonthStats(habits, today), [habits, today]);
  const bestHabits = useMemo(
    () => [...habits].sort((a, b) => getHabitCompletionRate(b) - getHabitCompletionRate(a)).slice(0, 3),
    [habits],
  );
  const worstHabits = useMemo(
    () => [...habits].sort((a, b) => getHabitCompletionRate(a) - getHabitCompletionRate(b)).slice(0, 3),
    [habits],
  );
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, { total: number; count: number }> = {};
    habits.filter(h => h.type === 'good' && h.category).forEach(h => {
      if (!cats[h.category!]) cats[h.category!] = { total: 0, count: 0 };
      cats[h.category!].total += getHabitCompletionRate(h);
      cats[h.category!].count += 1;
    });
    return Object.entries(cats)
      .map(([cat, { total, count }]) => ({ cat, avg: Math.round(total / count) }))
      .sort((a, b) => b.avg - a.avg);
  }, [habits]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => onClose()}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, styles.analyticsModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>📊 Analytics</Text>
            <TouchableOpacity onPress={() => onClose()}>
              <Text style={{ color: colors.text, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>
  
          {!isPremium ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md }}>
              <Text style={{ fontSize: 36 }}>🔒</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md, textAlign: 'center' }}>
                Advanced insights are a Premium feature
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }}>
                See your top and struggling habits, 30-day trends and per-category breakdowns. Your Weekly Insights stay free.
              </Text>
              <Button
                title="Go Premium"
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.open(buildPremiumCheckoutUrl(), '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            </View>
          ) : (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Best Habits */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={[styles.subsectionLabel, { color: colors.success, marginBottom: Spacing.md }]}>Top Performing Habits</Text>
              {bestHabits.length > 0 ? (
                <>
                  {bestHabits.map(habit => (
                    <View key={habit.id} style={[styles.habitAnalyticsRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.habitAnalyticsName}>
                        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                      </View>
                      <Text style={[styles.habitAnalyticsRate, { color: colors.success }]}>
                        {getHabitCompletionRate(habit)}%
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No habits yet</Text>
              )}
            </View>
  
            {/* Worst Habits */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={[styles.subsectionLabel, { color: colors.danger, marginBottom: Spacing.md }]}>Habits Needing Attention</Text>
              {worstHabits.length > 0 ? (
                <>
                  {worstHabits.map(habit => (
                    <View key={habit.id} style={[styles.habitAnalyticsRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.habitAnalyticsName}>
                        <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                      </View>
                      <Text style={[styles.habitAnalyticsRate, { color: colors.danger }]}>
                        {getHabitCompletionRate(habit)}%
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>No habits yet</Text>
              )}
            </View>
  
            {/* Month Summary */}
            <View>
              <Text style={[styles.subsectionLabel, { color: colors.accentText, marginBottom: Spacing.md }]}>30-Day Summary</Text>
              <View style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Completion Rate</Text>
                  <Text style={{ color: colors.accentText, fontWeight: '700' }}>{monthStats.completionRate}%</Text>
                </View>
                <ProgressBar progress={monthStats.completionRate / 100} color={colors.success} />
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.sm }}>
                  Good habits completed: {monthStats.completedCount}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                  Bad habits avoided: {monthStats.avoidedBadCount}
                </Text>
              </View>
            </View>
  
            {/* By Category breakdown */}
            {categoryBreakdown.length > 0 && (
              <View style={{ marginTop: Spacing.lg }}>
                <Text style={[styles.subsectionLabel, { color: colors.warning, marginBottom: Spacing.md }]}>By Category</Text>
                {categoryBreakdown.map(({ cat, avg }) => (
                  <View key={cat} style={{ marginBottom: Spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.text, fontSize: FontSize.sm }}>{cat}</Text>
                      <Text style={{
                        fontSize: FontSize.xs, fontWeight: '700',
                        color: avg >= 80 ? colors.success : avg >= 50 ? colors.warning : colors.danger,
                      }}>{avg}%</Text>
                    </View>
                    <ProgressBar
                      progress={avg / 100}
                      color={avg >= 80 ? colors.success : avg >= 50 ? colors.warning : colors.danger}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
