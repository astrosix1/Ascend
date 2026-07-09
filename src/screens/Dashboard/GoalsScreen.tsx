import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { GoalEntry, GoalCategory, Habit } from '../../utils/types';

const CATEGORIES: { key: GoalCategory; label: string; emoji: string; color: string }[] = [
  { key: 'physical',     label: 'Physical',     emoji: '💪', color: '#EF4444' },
  { key: 'mental',       label: 'Mental',       emoji: '🧠', color: '#8B5CF6' },
  { key: 'emotional',    label: 'Emotional',    emoji: '❤️', color: '#EC4899' },
  { key: 'social',       label: 'Social',       emoji: '🤝', color: '#F59E0B' },
  { key: 'financial',    label: 'Financial',    emoji: '💰', color: '#10B981' },
  { key: 'professional', label: 'Professional', emoji: '🚀', color: '#3B82F6' },
];

function getCategoryMeta(key: GoalCategory) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[0];
}

interface ProgressInfo {
  percent: number;
  completions: number;    // actual individual habit completions so far
  maxCompletions: number; // linked habits × total days
  totalDays: number;
  daysRemaining: number | null;
  hasTarget: boolean;
}

function computeProgressInfo(goal: GoalEntry, habits: Habit[]): ProgressInfo {
  const linked = habits.filter(h => goal.relatedHabits.includes(h.id) && h.type === 'good');
  const todayStr = new Date().toISOString().split('T')[0];

  const daysRemaining = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - new Date(todayStr).getTime()) / 86400000)
    : null;

  if (!goal.targetDate || linked.length === 0) {
    return { percent: goal.progress, completions: 0, maxCompletions: 0, totalDays: 0, daysRemaining, hasTarget: !!goal.targetDate };
  }

  const startDate = new Date(goal.createdAt.split('T')[0]);
  const endDate = new Date(goal.targetDate);
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  const maxCompletions = linked.length * totalDays;

  // Each individual habit completion on each day contributes equally
  let completions = 0;
  const cursor = new Date(startDate);
  const today = new Date(todayStr);
  while (cursor <= today && cursor < endDate) {
    const dateStr = cursor.toISOString().split('T')[0];
    for (const h of linked) {
      if (h.completedDates.includes(dateStr)) completions++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    percent: Math.min(100, Math.round((completions / maxCompletions) * 100)),
    completions,
    maxCompletions,
    totalDays,
    daysRemaining,
    hasTarget: true,
  };
}

// ─── Goal Card ────────────────────────────────────────────────────
function GoalCard({
  goal, habits, onComplete, onDelete, onEdit,
}: {
  goal: GoalEntry;
  habits: Habit[];
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { colors } = useApp();
  const meta = getCategoryMeta(goal.category);
  const info = computeProgressInfo(goal, habits);
  const linked = habits.filter(h => goal.relatedHabits.includes(h.id));
  const [showActions, setShowActions] = useState(false);

  const progressColor = info.percent >= 70 ? '#10B981' : info.percent >= 40 ? '#F59E0B' : '#EF4444';
  const { daysRemaining } = info;

  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <TouchableOpacity onPress={() => setShowActions(a => !a)} activeOpacity={0.85}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          <View style={[s.catBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '700', lineHeight: 20 }}>
              {goal.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
              {meta.label}
              {daysRemaining !== null && (
                <Text style={{ color: daysRemaining < 0 ? '#EF4444' : daysRemaining <= 7 ? '#F59E0B' : colors.textSecondary }}>
                  {' · '}
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : daysRemaining === 0 ? 'Due today' : `${daysRemaining}d left`}
                </Text>
              )}
            </Text>
          </View>
          <Text style={{ color: progressColor, fontWeight: '700', fontSize: FontSize.md }}>
            {info.percent}%
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[s.barTrack, { backgroundColor: colors.border }]}>
          <View style={[s.barFill, { backgroundColor: progressColor, width: `${info.percent}%` }]} />
        </View>

        {/* Completion breakdown */}
        {info.hasTarget && info.maxCompletions > 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 6 }}>
            {info.completions} of {info.maxCompletions} habit completions
            {' · '}{info.percent === 100 ? 'Goal reached! 🎉' : `${info.maxCompletions - info.completions} remaining`}
          </Text>
        ) : !info.hasTarget && linked.length > 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 6, fontStyle: 'italic' }}>
            Add a target date to track progress
          </Text>
        ) : null}

        {/* Linked habits */}
        {linked.length > 0 && (
          <View style={[s.habitChips, { marginTop: Spacing.sm }]}>
            {linked.slice(0, 4).map(h => (
              <View key={h.id} style={[s.chip, { backgroundColor: colors.accentLight }]}>
                <Text style={{ color: colors.accent, fontSize: FontSize.xs }}>
                  {h.name}
                </Text>
              </View>
            ))}
            {linked.length > 4 && (
              <View style={[s.chip, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                  +{linked.length - 4} more
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Action row */}
      {showActions && (
        <View style={[s.actionRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={onEdit} style={s.actionBtn}>
            <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onComplete} style={s.actionBtn}>
            <Text style={{ color: '#10B981', fontSize: FontSize.sm, fontWeight: '600' }}>✓ Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={s.actionBtn}>
            <Text style={{ color: '#EF4444', fontSize: FontSize.sm, fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

// ─── Goal Form (create / edit) ────────────────────────────────────
interface FormState {
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string;
  relatedHabits: string[];
}

const DEFAULT_FORM: FormState = {
  title: '',
  description: '',
  category: 'mental',
  targetDate: '',
  relatedHabits: [],
};

function GoalForm({
  initial,
  habits,
  onSave,
  onCancel,
}: {
  initial?: FormState;
  habits: Habit[];
  onSave: (form: FormState) => void;
  onCancel: () => void;
}) {
  const { colors } = useApp();
  const [form, setForm] = useState<FormState>(initial ?? DEFAULT_FORM);
  const goodHabits = habits.filter(h => h.type === 'good');

  const set = (key: keyof FormState, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleHabit = (id: string) => {
    setForm(prev => ({
      ...prev,
      relatedHabits: prev.relatedHabits.includes(id)
        ? prev.relatedHabits.filter(x => x !== id)
        : [...prev.relatedHabits, id],
    }));
  };

  const canSave = form.title.trim().length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }}>

        {/* Title */}
        <Text style={[s.fieldLabel, { color: colors.text }]}>Goal Title *</Text>
        <TextInput
          value={form.title}
          onChangeText={v => set('title', v)}
          placeholder="e.g. Run a 5K"
          placeholderTextColor={colors.textSecondary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        />

        {/* Description */}
        <Text style={[s.fieldLabel, { color: colors.text }]}>Description (optional)</Text>
        <TextInput
          value={form.description}
          onChangeText={v => set('description', v)}
          placeholder="Why does this goal matter to you?"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          style={[s.input, s.inputMulti, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        />

        {/* Category */}
        <Text style={[s.fieldLabel, { color: colors.text }]}>Category</Text>
        <View style={s.catGrid}>
          {CATEGORIES.map(cat => {
            const active = form.category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => set('category', cat.key)}
                style={[
                  s.catPill,
                  {
                    backgroundColor: active ? cat.color : colors.surface,
                    borderColor: active ? cat.color : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text style={{
                  color: active ? '#fff' : colors.text,
                  fontSize: FontSize.xs,
                  fontWeight: active ? '700' : '400',
                  marginLeft: 4,
                }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Target date */}
        <Text style={[s.fieldLabel, { color: colors.text }]}>Target Date (optional)</Text>
        <TextInput
          value={form.targetDate}
          onChangeText={v => set('targetDate', v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        />

        {/* Link habits */}
        <Text style={[s.fieldLabel, { color: colors.text }]}>Link Habits</Text>
        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
          Progress is auto-calculated from how consistently you do these habits.
        </Text>
        {goodHabits.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
            No good habits yet — add some on the Today tab first.
          </Text>
        ) : (
          <View style={{ gap: Spacing.xs }}>
            {goodHabits.map(h => {
              const linked = form.relatedHabits.includes(h.id);
              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => toggleHabit(h.id)}
                  style={[
                    s.habitRow,
                    {
                      backgroundColor: linked ? colors.accentLight : colors.surface,
                      borderColor: linked ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <View style={[s.checkbox, {
                    backgroundColor: linked ? colors.accent : 'transparent',
                    borderColor: linked ? colors.accent : colors.border,
                  }]}>
                    {linked && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={{ color: colors.text, fontSize: FontSize.sm, flex: 1 }}>{h.name}</Text>
                  {h.streak > 0 && (
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>🔥 {h.streak}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
          <Button title="Save Goal" onPress={() => canSave && onSave(form)} disabled={!canSave} />
          <Button title="Cancel" variant="secondary" onPress={onCancel} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main Goals Screen ────────────────────────────────────────────
export default function GoalsScreen() {
  const { colors, goals, habits, addGoal, updateGoal, deleteGoal } = useApp();
  const [mode, setMode] = useState<'list' | 'creating' | 'editing'>('list');
  const [editingGoal, setEditingGoal] = useState<GoalEntry | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals]);

  const handleSaveNew = (form: FormState) => {
    const now = new Date().toISOString();
    addGoal({
      id: `goal_${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      targetDate: form.targetDate,
      status: 'active',
      progress: 0,
      relatedHabits: form.relatedHabits,
      createdAt: now,
      updatedAt: now,
      notes: '',
    });
    setMode('list');
  };

  const handleSaveEdit = (form: FormState) => {
    if (!editingGoal) return;
    updateGoal(editingGoal.id, {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      targetDate: form.targetDate,
      relatedHabits: form.relatedHabits,
    });
    setEditingGoal(null);
    setMode('list');
  };

  const handleComplete = (goalId: string) => {
    updateGoal(goalId, { status: 'completed', progress: 100 });
  };

  const handleDelete = (goalId: string) => {
    deleteGoal(goalId);
  };

  const handleEdit = (goal: GoalEntry) => {
    setEditingGoal(goal);
    setMode('editing');
  };

  // ── Create / Edit form ───────────────────────────────────────────
  if (mode === 'creating') {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={[s.formHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[s.formTitle, { color: colors.text }]}>New Goal</Text>
        </View>
        <GoalForm habits={habits} onSave={handleSaveNew} onCancel={() => setMode('list')} />
      </View>
    );
  }

  if (mode === 'editing' && editingGoal) {
    const initial: FormState = {
      title: editingGoal.title,
      description: editingGoal.description,
      category: editingGoal.category ?? 'mental',
      targetDate: editingGoal.targetDate ?? '',
      relatedHabits: editingGoal.relatedHabits,
    };
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={[s.formHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[s.formTitle, { color: colors.text }]}>Edit Goal</Text>
        </View>
        <GoalForm habits={habits} initial={initial} onSave={handleSaveEdit} onCancel={() => { setMode('list'); setEditingGoal(null); }} />
      </View>
    );
  }

  // ── Goals List ───────────────────────────────────────────────────
  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}>

        {/* Header */}
        <View style={s.listHeader}>
          <View>
            <Text style={[s.listTitle, { color: colors.text }]}>Your Goals</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
              {activeGoals.length} active · {completedGoals.length} completed
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMode('creating')}
            style={[s.newBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: FontSize.sm }}>+ New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state */}
        {activeGoals.length === 0 && (
          <Card style={{ backgroundColor: colors.surface, marginBottom: Spacing.lg }}>
            <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🎯</Text>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm }}>
                Set your first goal
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg }}>
                Goals give your habits meaning. Link daily habits to a goal and watch your progress build automatically.
              </Text>
              <Button title="Create a Goal" onPress={() => setMode('creating')} />
            </View>
          </Card>
        )}

        {/* Active goals */}
        {activeGoals.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            habits={habits}
            onComplete={() => handleComplete(goal.id)}
            onDelete={() => handleDelete(goal.id)}
            onEdit={() => handleEdit(goal)}
          />
        ))}

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setShowCompleted(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.xs }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' }}>
                {showCompleted ? '▾' : '▸'} Completed ({completedGoals.length})
              </Text>
            </TouchableOpacity>

            {showCompleted && completedGoals.map(goal => {
              const meta = getCategoryMeta(goal.category ?? 'mental');
              return (
                <Card key={goal.id} style={{ marginBottom: Spacing.sm, opacity: 0.65 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm }, { textDecorationLine: 'line-through' }]}>
                        {goal.title}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>{meta.label}</Text>
                    </View>
                    <Text style={{ color: '#10B981', fontSize: 18 }}>✓</Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },

  // Card parts
  catBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  habitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  actionRow: { flexDirection: 'row', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },

  // Form
  formHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  // List
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  listTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  newBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
});
