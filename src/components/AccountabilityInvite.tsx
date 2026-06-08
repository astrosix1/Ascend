import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Spacing, FontSize, BorderRadius } from '../utils/theme';

interface AccountabilityInviteProps {
  habitId: string;
  habitName: string;
  visible: boolean;
  onClose: () => void;
}

export default function AccountabilityInvite({
  habitId,
  habitName,
  visible,
  onClose,
}: AccountabilityInviteProps) {
  const { colors, updateHabit, habits } = useApp();
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const habit = habits.find(h => h.id === habitId);
  const hasPartner = habit?.accountability?.partner?.email;

  const handleInvite = async () => {
    if (!partnerName.trim() || !partnerEmail.trim()) {
      Alert.alert('Missing Info', 'Please enter partner name and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Update habit with partner info
      updateHabit(habitId, {
        accountability: {
          partner: {
            name: partnerName.trim(),
            email: partnerEmail.trim(),
            invitedAt: new Date().toISOString(),
          },
        },
      });

      // In a real app, you'd send an email invite here
      // For now, we'll just show a success message
      Alert.alert(
        'Invite Sent!',
        `${partnerName} will be notified to hold you accountable for "${habitName}".`,
        [{ text: 'Great', onPress: onClose }]
      );

      setPartnerName('');
      setPartnerEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePartner = () => {
    Alert.alert(
      'Remove Partner',
      'Remove accountability partner?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: () => {
            updateHabit(habitId, { accountability: undefined });
            Alert.alert('Partner Removed', 'You\'re flying solo again.');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        ]}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                🤝 Accountability Partner
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                For: {habitName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: 4, marginLeft: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 20, lineHeight: 22 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {hasPartner ? (
            // Show existing partner
            <View style={[styles.partnerCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.partnerLabel, { color: colors.textSecondary }]}>
                Current Partner
              </Text>
              <Text style={[styles.partnerName, { color: colors.text }]}>
                {habit?.accountability?.partner?.name}
              </Text>
              <Text style={[styles.partnerEmail, { color: colors.textSecondary }]}>
                {habit?.accountability?.partner?.email}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.removeButton, { flex: 1, borderColor: colors.border }]}
                >
                  <Text style={[styles.removeButtonText, { color: colors.textSecondary }]}>
                    Close
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRemovePartner}
                  style={[styles.removeButton, { flex: 1, borderColor: colors.danger }]}
                >
                  <Text style={[styles.removeButtonText, { color: colors.danger }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Show invite form
            <>
              <View style={styles.form}>
                <Text
                  style={[
                    styles.label,
                    { color: colors.textSecondary },
                  ]}
                >
                  Partner Name
                </Text>
                <TextInput
                  placeholder="e.g., Sarah"
                  placeholderTextColor={colors.textTertiary}
                  value={partnerName}
                  onChangeText={setPartnerName}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  editable={!loading}
                />

                <Text
                  style={[
                    styles.label,
                    { color: colors.textSecondary, marginTop: Spacing.md },
                  ]}
                >
                  Partner Email
                </Text>
                <TextInput
                  placeholder="sarah@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={partnerEmail}
                  onChangeText={setPartnerEmail}
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  editable={!loading}
                />

                <Text
                  style={[
                    styles.helpText,
                    { color: colors.textSecondary },
                  ]}
                >
                  They'll receive a weekly check-in to see how you're doing on this habit.
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: colors.border },
                  ]}
                  disabled={loading}
                >
                  <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleInvite}
                  style={[styles.button, styles.inviteButton, { backgroundColor: colors.accent }]}
                  disabled={loading}
                >
                  <Text style={[styles.buttonText, { color: '#FFF' }]}>
                    {loading ? 'Sending...' : 'Send Invite'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
  },
  helpText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
    lineHeight: FontSize.xs * 1.5,
  },
  partnerCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  partnerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  partnerName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  partnerEmail: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  removeButton: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  inviteButton: {
    flex: 1.2,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
