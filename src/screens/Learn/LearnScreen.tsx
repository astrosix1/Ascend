import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, FlatList, Alert, ActivityIndicator
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';
import { useScreenWidth, BREAKPOINTS } from '../../utils/responsive';
import { learnHabits, habitCategories } from '../../data/learnHabits';
import { Habit, LearnHabit, GoalEntry } from '../../utils/types';
import { generateHabitsFromGoal, generateGoalsFromHabit } from '../../utils/claude-ai';
import { getData, setData, KEYS } from '../../utils/storage';

export default function LearnScreen() {
  const { colors, addHabit, habits, addGoal } = useApp();
  const screenWidth = useScreenWidth();
  const desktop = screenWidth > BREAKPOINTS.tablet;
  // Discover tab state
  const [learnTab, setLearnTab] = useState<'discover' | 'generator'>('discover');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'good' | 'bad'>('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedHabit, setSelectedHabit] = useState<LearnHabit | null>(null);
  const [addMicroHabit, setAddMicroHabit] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  // AI Generator state
  const [aiMode, setAiMode] = useState<'goal-to-habits' | 'habit-to-goals'>('goal-to-habits');
  const [aiInput, setAiInput] = useState('');
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAdded, setAiAdded] = useState<Set<string>>(new Set());
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Load saved API key on mount
  React.useEffect(() => {
    getData<string>(KEYS.ANTHROPIC_KEY).then(k => { if (k) setAnthropicKey(k); });
  }, []);

  async function handleSaveKey() {
    await setData(KEYS.ANTHROPIC_KEY, anthropicKey.trim());
    setShowKeyInput(false);
  }

  async function handleGenerate() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResults([]);
    setAiAdded(new Set());
    try {
      const results = aiMode === 'goal-to-habits'
        ? await generateHabitsFromGoal(aiInput.trim())
        : await generateGoalsFromHabit(aiInput.trim());
      setAiResults(results);
      if (results.length === 0) setAiError('No suggestions returned. Try rephrasing your input.');
    } catch (err: any) {
      if (err.message === 'NO_KEY') {
        setAiError('Enter your Anthropic API key below to use the AI Generator.');
        setShowKeyInput(true);
      } else if (err.message === 'INVALID_KEY') {
        setAiError('Invalid API key. Please check and re-enter it below.');
        setShowKeyInput(true);
      } else {
        setAiError(`Error: ${err.message}`);
      }
    } finally {
      setAiLoading(false);
    }
  }

  function handleAddAiHabit(name: string) {
    const habit: Habit = {
      id: Date.now().toString() + Math.random(),
      name,
      type: 'good',
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    addHabit(habit);
    setAiAdded(prev => new Set(prev).add(name));
  }

  function handleAddAiGoal(title: string) {
    const goal: GoalEntry = {
      id: Date.now().toString() + Math.random(),
      title,
      description: '',
      targetDate: '',
      status: 'active',
      progress: 0,
      relatedHabits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
    };
    addGoal(goal);
    setAiAdded(prev => new Set(prev).add(title));
  }

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

  // Discover column content (shared between desktop and mobile)
  const discoverColumn = (
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
  );

  // Generator column content (shared)
  const generatorColumn = (
    <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <SectionHeader title="AI Generator" subtitle="Powered by Claude" />

          {/* Mode toggle */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
            {([
              { key: 'goal-to-habits', label: '🎯 Goal → Habits' },
              { key: 'habit-to-goals', label: '🔁 Habit → Goals' },
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => { setAiMode(key); setAiResults([]); setAiError(''); }}
                style={{ flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center', borderWidth: 1, borderColor: aiMode === key ? colors.accent : colors.border, backgroundColor: aiMode === key ? colors.accentLight : 'transparent' }}
              >
                <Text style={{ color: aiMode === key ? colors.accent : colors.textSecondary, fontSize: FontSize.sm, fontWeight: aiMode === key ? '700' : '400' }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs }}>
            {aiMode === 'goal-to-habits' ? 'Enter your goal:' : 'Enter your daily habit:'}
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm, padding: Spacing.sm, color: colors.text, backgroundColor: colors.surface, fontSize: FontSize.md, marginBottom: Spacing.md }}
            value={aiInput}
            onChangeText={setAiInput}
            placeholder={aiMode === 'goal-to-habits' ? 'e.g. Run a marathon, Learn Spanish...' : 'e.g. Walk 10 000 steps, Read daily...'}
            placeholderTextColor={colors.textSecondary}
          />

          <Button
            title={aiLoading ? 'Generating...' : '✨ Generate'}
            variant="primary"
            onPress={handleGenerate}
            style={{ marginBottom: Spacing.md }}
          />

          {aiLoading && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>Claude is thinking...</Text>
            </View>
          )}

          {/* Error / key prompt */}
          {!!aiError && (
            <Card style={{ marginBottom: Spacing.md, borderColor: colors.warning, borderWidth: 1 }}>
              <Text style={{ color: colors.warning, marginBottom: Spacing.sm }}>{aiError}</Text>
            </Card>
          )}

          {/* API Key input */}
          {showKeyInput && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: Spacing.xs }}>🔑 Anthropic API Key</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
                Get your key at console.anthropic.com. It's stored locally on your device only.
              </Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm, padding: Spacing.sm, color: colors.text, backgroundColor: colors.surface, fontSize: FontSize.sm, marginBottom: Spacing.sm }}
                value={anthropicKey}
                onChangeText={setAnthropicKey}
                placeholder="sk-ant-..."
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
              <Button title="Save Key" variant="primary" size="small" onPress={handleSaveKey} />
            </Card>
          )}

          {/* Results */}
          {aiResults.length > 0 && (
            <>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md, marginBottom: Spacing.sm }}>
                {aiMode === 'goal-to-habits' ? '💡 Suggested Habits' : '🎯 Suggested Goals'}
              </Text>
              {aiResults.map((item, i) => (
                <Card key={i} style={{ marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.text, flex: 1, marginRight: Spacing.sm }}>{item}</Text>
                  {aiAdded.has(item) ? (
                    <Text style={{ color: colors.success, fontSize: 16 }}>✓ Added</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => aiMode === 'goal-to-habits' ? handleAddAiHabit(item) : handleAddAiGoal(item)}
                      style={{ backgroundColor: colors.accent, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}
                    >
                      <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: FontSize.sm }}>+ Add</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ))}
            </>
          )}

          {/* Key management (when key is already saved) */}
          {!showKeyInput && (
            <TouchableOpacity onPress={() => setShowKeyInput(true)} style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                {anthropicKey ? '🔑 Change API key' : '🔑 Set API key to enable AI'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
  );

  return (
    <View style={s.container}>
      {/* ── Desktop: Sidebar + content panel ── */}
      {desktop && (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
          {/* Sidebar */}
          <View style={{ width: 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface }}>
            <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}>Discover</Text>
            </View>
            {([
              { key: 'discover' as const, label: 'Habit Library', icon: '🔍', sub: 'Learn · Decide · Act' },
              { key: 'generator' as const, label: 'AI Generator', icon: '✨', sub: 'Powered by Claude' },
            ]).map(cat => {
              const isActive = learnTab === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setLearnTab(cat.key)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                    paddingHorizontal: Spacing.md, paddingVertical: 12,
                    backgroundColor: isActive ? colors.accentLight : 'transparent',
                    borderRightWidth: isActive ? 3 : 0, borderRightColor: colors.accent,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: isActive ? '700' : '500', color: isActive ? colors.accent : colors.text }}>{cat.label}</Text>
                    <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{cat.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Content panel */}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ width: 3, height: 18, backgroundColor: colors.accent, borderRadius: 2, marginRight: Spacing.sm }} />
              <Text style={{ flex: 1, fontSize: FontSize.md, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                {learnTab === 'discover' ? 'Habit Library' : 'AI Generator'}
              </Text>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                {learnTab === 'discover' ? 'Learn · Decide · Act' : 'Powered by Claude'}
              </Text>
            </View>
            {learnTab === 'discover' ? discoverColumn : generatorColumn}
          </View>
        </View>
      )}

      {/* ── Mobile: Tab-based layout ── */}
      {!desktop && (
        <>
          {/* Tab Bar */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {([
              { key: 'discover',  label: '🔍 Discover' },
              { key: 'generator', label: '✨ Generator' },
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setLearnTab(key)}
                style={{ flex: 1, paddingVertical: Spacing.md, borderBottomWidth: learnTab === key ? 2 : 0, borderBottomColor: colors.accent }}
              >
                <Text style={{ textAlign: 'center', color: learnTab === key ? colors.accent : colors.textSecondary, fontWeight: learnTab === key ? '700' : '400', fontSize: FontSize.sm }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {learnTab === 'discover' && discoverColumn}
          {learnTab === 'generator' && generatorColumn}
        </>
      )}

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
