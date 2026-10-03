import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { Spacing, Typography } from '../../utils/theme';
import AppText from '../../components/AppText';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Checkbox from '../../components/Checkbox';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import Sheet from '../../components/Sheet';

/** Dev-only gallery (localhost, ?ui=preview) for reviewing the design system. */
export default function ComponentPreview() {
  const { colors, toggleTheme, theme } = useApp();
  const [checked, setChecked] = useState(false);
  const [chip, setChip] = useState('All');
  const [sheet, setSheet] = useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
      <AppText variant="hero">Design system</AppText>
      <Button title={`Switch to ${theme === 'dark' ? 'light' : 'dark'}`} variant="secondary" onPress={toggleTheme} />

      <AppText variant="label" color={colors.textTertiary}>Type</AppText>
      <AppText variant="hero">Display</AppText>
      <AppText variant="h2">Title</AppText>
      <AppText variant="h3">Heading</AppText>
      <AppText variant="body">Body text on the base background.</AppText>
      <AppText variant="secondary" color={colors.textSecondary}>Secondary supporting copy</AppText>

      <AppText variant="label" color={colors.textTertiary}>Buttons</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <Button title="Primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
        <Button title="Loading" loading onPress={() => {}} />
        <Button title="Disabled" disabled onPress={() => {}} />
      </View>

      <AppText variant="label" color={colors.textTertiary}>Card, checkbox, chips</AppText>
      <Card interactive onPress={() => setChecked(c => !c)} accessibilityLabel="Read for 10 minutes">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Checkbox checked={checked} onChange={setChecked} label="Read for 10 minutes" />
          <Text style={[Typography.body, { color: colors.text }]}>Read for 10 minutes</Text>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {['All', 'Good', 'Quit'].map(l => <Chip key={l} label={l} selected={chip === l} onPress={() => setChip(l)} />)}
      </View>

      <AppText variant="label" color={colors.textTertiary}>Empty state and sheet</AppText>
      <Card>
        <EmptyState icon="🌱" title="No habits yet" message="Start with one small habit you can do today." actionLabel="Add a habit" onAction={() => setSheet(true)} />
      </Card>
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Add a habit">
        <AppText variant="body">Sheet content goes here. Press Escape or tap outside to close.</AppText>
      </Sheet>
    </ScrollView>
  );
}
