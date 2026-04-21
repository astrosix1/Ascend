import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp } from '../../utils/supabase';
import { useApp } from '../../contexts/AppContext';
import { FontSize, Spacing, BorderRadius } from '../../utils/theme';

interface Props {
  onAuthenticated: (userId: string, email: string) => void;
  onGuest: () => void;
}

type Mode = 'landing' | 'login' | 'signup';

export default function AuthScreen({ onAuthenticated, onGuest }: Props) {
  const { colors } = useApp();
  const [mode, setMode] = useState<Mode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await signIn(email.trim(), password);
      if (error) throw error;
      if (data.user) onAuthenticated(data.user.id, data.user.email || email);
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await signUp(email.trim(), password);
      if (error) throw error;
      if (data.user) {
        Alert.alert(
          'Account created!',
          'Check your email to confirm your account, then log in.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        );
      }
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    logo: {
      alignItems: 'center', marginBottom: Spacing.xxl,
    },
    logoText: {
      fontSize: 48, fontWeight: '800', color: colors.accent, letterSpacing: 4,
    },
    tagline: {
      fontSize: FontSize.md, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center',
    },
    title: {
      fontSize: FontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 20,
    },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.md, color: colors.text, backgroundColor: colors.surface,
      fontSize: FontSize.md, marginBottom: Spacing.sm,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', borderWidth: 1,
      borderColor: colors.border, borderRadius: BorderRadius.sm,
      backgroundColor: colors.surface, marginBottom: Spacing.sm,
    },
    inputInRow: {
      flex: 1, padding: Spacing.md, color: colors.text, fontSize: FontSize.md,
    },
    eyeBtn: { padding: Spacing.md },
    primaryBtn: {
      backgroundColor: colors.accent, borderRadius: BorderRadius.sm,
      padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    primaryBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: FontSize.md },
    secondaryBtn: {
      borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    secondaryBtnText: { color: colors.textSecondary, fontSize: FontSize.md },
    linkBtn: { alignItems: 'center', marginTop: Spacing.lg },
    linkText: { color: colors.accent, fontSize: FontSize.sm },
    divider: {
      flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textSecondary, paddingHorizontal: Spacing.sm, fontSize: FontSize.sm },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
    featureText: { color: colors.textSecondary, fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
    noKeyBanner: {
      backgroundColor: colors.surfaceLight, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
    },
  });

  // Landing page
  if (mode === 'landing') {
    return (
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.logo}>
            <Text style={s.logoText}>ASCEND</Text>
            <Text style={s.tagline}>Build better habits. Live more fully.</Text>
          </View>

          <View style={{ marginBottom: Spacing.xl }}>
            {[
              ['cloud-upload-outline', 'Sync your habits across all your devices'],
              ['shield-checkmark-outline', 'Your data stays private and secure'],
              ['people-outline', 'Join a real community working toward the same goals'],
              ['phone-portrait-outline', 'Use offline — syncs when you reconnect'],
            ].map(([icon, text]) => (
              <View key={text} style={s.featureRow}>
                <Ionicons name={icon as any} size={18} color={colors.accent} />
                <Text style={s.featureText}>{text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => setMode('signup')}
          >
            <Text style={s.primaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setMode('login')}
          >
            <Text style={s.secondaryBtnText}>Log In</Text>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.secondaryBtn} onPress={onGuest}>
            <Text style={s.secondaryBtnText}>Continue Without Account</Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 }}>
            Without an account, your data is stored locally on this device only.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // Login / Sign Up forms
  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={() => setMode('landing')}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.accent} />
          <Text style={{ color: colors.accent, marginLeft: Spacing.xs, fontSize: FontSize.sm }}>Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
        <Text style={s.subtitle}>
          {mode === 'login'
            ? 'Sign in to sync your progress across devices.'
            : 'Your data will be saved to the cloud and available on any device.'}
        </Text>

        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <View style={s.inputRow}>
          <TextInput
            style={s.inputInRow}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPassword}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {mode === 'signup' && (
          <TextInput
            style={s.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPassword}
          />
        )}

        <TouchableOpacity
          style={[s.primaryBtn, { opacity: loading ? 0.7 : 1 }]}
          onPress={mode === 'login' ? handleLogin : handleSignUp}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#1A1A1A" />
            : <Text style={s.primaryBtnText}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.linkBtn} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={s.linkText}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.secondaryBtn} onPress={onGuest}>
          <Text style={s.secondaryBtnText}>Continue Without Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
