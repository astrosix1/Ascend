import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, FlatList, Alert
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';
import { learnHabits, habitCategories } from '../../data/learnHabits';
import { Habit, LearnHabit } from '../../utils/types';

export default function LearnScreen() {
  const { colors, addHabit, habits } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'good' | 'bad'>('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedHabit, setSelectedHabit] = useState<LearnHabit | null>(null);
  const [addMicroHabit, setAddMicroHabit] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  const filtered = useMemo(() => {
    return learnHabits.filter(h => {
      const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || h.category === selectedCategory;
      const matchType = selectedType === 'all' || h.type === selectedType;
      return matchSearch && matchCategory && matchType;
    });
  }, [search, selectedCategory, selectedType]);

  const displayed = filtered.slice(0, visibleCount);
  const alreadyAdded = (id: string) => habits.some(h => h.id === id || h.name === learnHabits.find(l => l.id === id)?.name);

  const handleAddHabit = (learnHabit: LearnHabit, microHabitName?: string) => {
    const name = microHabitName || learnHabit.name;
    const habit: Habit = {
      id: Date.now().toString(),
      name,
      type: learnHabit.type,
      description: learnHabit.description,
      microHabit: microHabitName,
      trigger: learnHabit.triggers?.[0],
      replacement: learnHabit.replacements?.[0],
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
      category: learnHabit.category,
    };
    addHabit(habit);
    Alert.alert(
      learnHabit.type === 'good' ? 'Habit Added!' : 'Tracking Added!',
      learnHabit.type === 'good'
        ? `"${name}" has been added to your good habits.`
        : `"${name}" has been added to your habits to avoid.`
    );
    setSelectedHabit(null);
    setAddMicroHabit(null);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: Spacing.md },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    searchInput: {
      flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, color: colors.text, backgroundColor: colors.surface,
      fontSize: FontSize.md,
    },
    filterRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
    filterChip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1 },
    habitCard: { marginBottom: Spacing.sm, overflow: 'hidden' },
    habitTypeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
    habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
    habitName: { fontSize: FontSize.lg, fontWeight: '700', flex: 1 },
    habitDesc: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: '#000000CC' },
    modalContent: {
      flex: 1, marginTop: 60, borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg, overflow: 'hidden',
    },
    modalScroll: { padding: Spacing.lg, paddingBottom: 60 },
    sectionBlock: { marginBottom: Spacing.lg },
    blockTitle: { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
    timelineText: { fontSize: FontSize.sm, color: '#F5A623', lineHeight: 20 },
    microHabitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
    triggerRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', marginBottom: Spacing.sm },
    inputCustom: {
      borderWidth: 1, borderColor: '#F5A62355', borderRadius: BorderRadius.sm,
      padding: Spacing.sm, fontSize: FontSize.sm, marginTop: Spacing.xs, marginBottom: Spacing.sm,
    },
  });

  const TypeBadge = ({ type }: { type: 'good' | 'bad' }) => (
    <View style={[s.habitTypeBadge, { backgroundColor: type === 'good' ? colors.success + '22' : colors.danger + '22' }]}>
      <Text style={{ color: type === 'good' ? colors.success : colors.danger, fontSize: FontSize.xs, fontWeight: '700' }}>
        {type === 'good' ? '▲ GOOD' : '▼ AVOID'}
      </Text>
    </View>
  );

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader title="Discover" subtitle="Learn. Decide. Act." />

        {/* Search */}
        <View style={s.searchRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 18 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={t => { setSearch(t); setVisibleCount(5); }}
            placeholder="Search habits..."
            placeholderTextColor={colors.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter */}
        <View style={s.filterRow}>
          {(['all', 'good', 'bad'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => { setSelectedType(type); setVisibleCount(5); }}
              style={[s.filterChip, {
                backgroundColor: selectedType === type
                  ? (type === 'good' ? colors.success + '22' : type === 'bad' ? colors.danger + '22' : colors.accentLight)
                  : 'transparent',
                borderColor: selectedType === type
                  ? (type === 'good' ? colors.success : type === 'bad' ? colors.danger : colors.accent)
                  : colors.border,
              }]}
            >
              <Text style={{
                color: selectedType === type
                  ? (type === 'good' ? colors.success : type === 'bad' ? colors.danger : colors.accent)
                  : colors.textSecondary,
                fontSize: FontSize.sm, fontWeight: '600',
              }}>
                {type === 'all' ? 'All' : type === 'good' ? '▲ Good' : '▼ Avoid'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
            <TouchableOpacity
              onPress={() => { setSelectedCategory(null); setVisibleCount(5); }}
              style={[s.filterChip, {
                backgroundColor: !selectedCategory ? colors.accentLight : 'transparent',
                borderColor: !selectedCategory ? colors.accent : colors.border,
              }]}
            >
              <Text style={{ color: !selectedCategory ? colors.accent : colors.textSecondary, fontSize: FontSize.sm }}>All</Text>
            </TouchableOpacity>
            {habitCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => { setSelectedCategory(cat === selectedCategory ? null : cat); setVisibleCount(5); }}
                style={[s.filterChip, {
                  backgroundColor: selectedCategory === cat ? colors.accentLight : 'transparent',
                  borderColor: selectedCategory === cat ? colors.accent : colors.border,
                }]}
              >
                <Text style={{ color: selectedCategory === cat ? colors.accent : colors.textSecondary, fontSize: FontSize.sm }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Habit Cards — max 5 at a time */}
        {displayed.map(habit => (
          <TouchableOpacity key={habit.id} onPress={() => setSelectedHabit(habit)} activeOpacity={0.85}>
            <Card style={s.habitCard}>
              <View style={s.habitHeader}>
                <Text style={[s.habitName, { color: colors.text, marginRight: Spacing.sm }]}>{habit.name}</Text>
                <TypeBadge type={habit.type} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>
                {habit.category}
              </Text>
              <Text style={[s.habitDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                {habit.description}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs }}>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>Tap to learn more →</Text>
                {alreadyAdded(habit.id) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: colors.success, fontSize: 14 }}>✓</Text>
                    <Text style={{ color: colors.success, fontSize: FontSize.xs }}>In your stack</Text>
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
            <Text style={{ color: colors.textSecondary, fontSize: 48 }}>🔍</Text>
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>No habits found</Text>
          </View>
        )}

        {/* Load More */}
        {visibleCount < filtered.length && (
          <TouchableOpacity
            onPress={() => setVisibleCount(prev => prev + 5)}
            style={{
              padding: Spacing.md, alignItems: 'center', borderWidth: 1,
              borderColor: colors.border, borderRadius: BorderRadius.sm, marginTop: Spacing.sm,
            }}
          >
            <Text style={{ color: colors.accent }}>Load more ({filtered.length - visibleCount} remaining)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── HABIT DETAIL MODAL ───────────────────────────────── */}
      <Modal visible={!!selectedHabit} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background }]}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
            }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: FontSize.xl, flex: 1 }}>
                {selectedHabit?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedHabit(null)}>
                <Text style={{ color: colors.textSecondary, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalScroll} contentContainerStyle={{ paddingBottom: 80 }}>
              {selectedHabit && (
                <>
                  {/* Type badge + category */}
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <TypeBadge type={selectedHabit.type} />
                    <View style={{ paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: colors.surfaceLight }}>
                      <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>{selectedHabit.category}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={{ color: colors.text, fontSize: FontSize.md, lineHeight: 24, marginBottom: Spacing.lg }}>
                    {selectedHabit.description}
                  </Text>

                  {/* Real World Story */}
                  <View style={[s.sectionBlock, { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: Spacing.md }]}>
                    <Text style={[s.blockTitle, { color: colors.accent }]}>REAL WORLD EVIDENCE</Text>
                    <Text style={{ color: colors.text, fontSize: FontSize.sm, lineHeight: 22 }}>
                      {selectedHabit.realWorldStory}
                    </Text>
                  </View>

                  {/* Timeline */}
                  <View style={[s.sectionBlock, { backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md }]}>
                    <Text style={[s.blockTitle, { color: colors.textSecondary }]}>TIMELINE — WHEN TO EXPECT RESULTS</Text>
                    <Text style={s.timelineText}>{selectedHabit.timeline}</Text>
                  </View>

                  {/* Benefits or Drawbacks */}
                  {(selectedHabit.benefits || selectedHabit.drawbacks) && (
                    <View style={s.sectionBlock}>
                      <Text style={[s.blockTitle, { color: colors.textSecondary }]}>
                        {selectedHabit.type === 'good' ? 'BENEFITS' : 'WHY TO STOP'}
                      </Text>
                      {(selectedHabit.benefits || selectedHabit.drawbacks || []).map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                          <Text style={{
                            color: selectedHabit.type === 'good' ? colors.success : colors.danger,
                            fontSize: 16
                          }}>
                            {selectedHabit.type === 'good' ? '✓' : '✕'}
                          </Text>
                          <Text style={{ color: colors.text, fontSize: FontSize.sm, flex: 1 }}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Break It Down — Micro Habits */}
                  <View style={s.sectionBlock}>
                    <Text style={[s.blockTitle, { color: colors.textSecondary }]}>BREAK IT DOWN — START SMALL</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                      Add the full habit or a smaller micro-habit to your stack:
                    </Text>
                    {/* Full habit option */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1,
                        borderColor: colors.accent, backgroundColor: colors.accentLight, marginBottom: Spacing.sm,
                      }}
                      onPress={() => handleAddHabit(selectedHabit)}
                    >
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>{selectedHabit.name} (Full)</Text>
                      <Text style={{ color: colors.accent, fontSize: 18 }}>➕</Text>
                    </TouchableOpacity>
                    {selectedHabit.microHabits.map((micro, i) => (
                      <TouchableOpacity
                        key={i}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1,
                          borderColor: colors.border, marginBottom: Spacing.xs,
                        }}
                        onPress={() => handleAddHabit(selectedHabit, micro)}
                      >
                        <Text style={{ color: colors.text, flex: 1 }}>{micro}</Text>
                        <Text style={{ color: colors.accent, fontSize: 16 }}>➕</Text>
                      </TouchableOpacity>
                    ))}
                    {/* Custom micro-habit */}
                    {addMicroHabit === selectedHabit.id ? (
                      <View>
                        <TextInput
                          style={[s.inputCustom, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                          value={customName}
                          onChangeText={setCustomName}
                          placeholder="Custom habit name..."
                          placeholderTextColor={colors.textSecondary}
                        />
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                          <Button
                            title="Add Custom"
                            size="small"
                            onPress={() => { if (customName.trim()) handleAddHabit(selectedHabit, customName.trim()); }}
                            style={{ flex: 1 }}
                          />
                          <Button
                            title="Cancel"
                            variant="ghost"
                            size="small"
                            onPress={() => { setAddMicroHabit(null); setCustomName(''); }}
                            style={{ flex: 1 }}
                          />
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setAddMicroHabit(selectedHabit.id)}
                        style={{ padding: Spacing.sm, alignItems: 'center' }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>+ Write my own micro-habit</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Trigger & Replace (for bad habits or habits with triggers) */}
                  {selectedHabit.triggers && selectedHabit.triggers.length > 0 && (
                    <View style={[s.sectionBlock, { backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md }]}>
                      <Text style={[s.blockTitle, { color: colors.textSecondary }]}>TRIGGER & REPLACE</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                        Common triggers and healthier alternatives:
                      </Text>
                      {selectedHabit.triggers.map((trigger, i) => (
                        <View key={i} style={s.triggerRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.danger, fontSize: FontSize.xs, fontWeight: '700' }}>TRIGGER</Text>
                            <Text style={{ color: colors.text, fontSize: FontSize.sm }}>{trigger}</Text>
                          </View>
                          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>→</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.success, fontSize: FontSize.xs, fontWeight: '700' }}>INSTEAD</Text>
                            <Text style={{ color: colors.text, fontSize: FontSize.sm }}>
                              {selectedHabit.replacements?.[i] || selectedHabit.replacements?.[0] || '—'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
