import React from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, Typography } from '../utils/theme';
import Card from './Card';
import Button from './Button';

export interface Suggestion {
  name: string;
  type: 'good' | 'bad';
  why: string;
}

export const STARTER_SUGGESTIONS: Suggestion[] = [
  { name: 'Drink a glass of water after waking up', type: 'good', why: 'A small first win to anchor your morning.' },
  { name: 'Walk for 10 minutes', type: 'good', why: 'Movement steadies mood and sleep.' },
  { name: 'Write one line in your journal', type: 'good', why: 'Noticing how you feel makes change easier.' },
  { name: 'No phone in bed', type: 'bad', why: 'Protects your sleep and your mornings.' },
];

interface StartHereProps {
  onAdd: (name: string, type: 'good' | 'bad') => void;
  onCustom: () => void;
}

/**
 * First-run view: instead of an empty list, offer a few gentle starting points
 * that can be added in one tap, with an escape hatch to write your own.
 */
export default function StartHere({ onAdd, onCustom }: StartHereProps) {
  const { colors } = useApp();
  return (
    <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
      <Text style={[Typography.heading, { color: colors.text }]}>Start with one small step</Text>
      <Text style={[Typography.bodySmall, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
        Pick something you can do today. You can change or add more at any time.
      </Text>

      {STARTER_SUGGESTIONS.map(s => (
        <Card key={s.name} style={{ marginBottom: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.subheading, { color: colors.text }]}>{s.name}</Text>
              <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {s.type === 'bad' ? 'Quit · ' : ''}{s.why}
              </Text>
            </View>
            <Button title="Add" size="small" variant="secondary" onPress={() => onAdd(s.name, s.type)} accessibilityHint={`Adds ${s.name} to your habits`} />
          </View>
        </Card>
      ))}

      <View style={{ alignItems: 'flex-start', marginTop: Spacing.xs }}>
        <Button title="Write my own" variant="ghost" size="small" onPress={onCustom} />
      </View>
    </View>
  );
}
