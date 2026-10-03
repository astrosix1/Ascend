import React, { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, BorderRadius, Typography, Touch } from '../utils/theme';
import Sheet from './Sheet';
import Chip from './Chip';
import Button from './Button';

export type QuickAddType = 'good' | 'bad';

interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, type: QuickAddType) => void;
}

/**
 * Add a habit in two taps: type a name, press Enter. Only the name is
 * required; "Build" vs "Quit" defaults to Build and is remembered per open.
 */
export default function QuickAddSheet({ visible, onClose, onAdd }: QuickAddSheetProps) {
  const { colors } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<QuickAddType>('good');

  useEffect(() => {
    if (visible) setName('');
  }, [visible]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, type);
    setName('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Add a habit">
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <Chip label="Build a habit" selected={type === 'good'} onPress={() => setType('good')} />
        <Chip label="Quit a habit" selected={type === 'bad'} onPress={() => setType('bad')} />
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={submit}
        autoFocus
        returnKeyType="done"
        accessibilityLabel="Habit name"
        placeholder={type === 'good' ? 'e.g. Read for 10 minutes' : 'e.g. No doomscrolling'}
        placeholderTextColor={colors.textTertiary}
        style={[
          Typography.body,
          {
            color: colors.text,
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
            minHeight: Touch.minTarget,
          },
        ]}
      />
      <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
        Press Enter to add. You can fine-tune it later.
      </Text>

      <View style={{ marginTop: Spacing.lg }}>
        <Button title="Add habit" onPress={submit} disabled={!name.trim()} />
      </View>
    </Sheet>
  );
}
