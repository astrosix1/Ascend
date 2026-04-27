import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, useWindowDimensions,
} from 'react-native';
import { signIn, signUp } from '../../utils/supabase';
import { useApp } from '../../contexts/AppContext';

interface Props {
  onAuthenticated: (userId: string, email: string) => void;
  onGuest: () => void;
}

type Mode = 'landing' | 'login' | 'signup';

const FEATURES = [
  { icon: '☁️', label: 'Sync across devices' },
  { icon: '🛡️', label: 'Private & secure' },
  { icon: '👥', label: 'Real community' },
  { icon: '📱', label: 'Works offline' },
];

export default function AuthScreen({ onAuthenticated, onGuest }: Props) {
  const { colors } = useApp();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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
      Alert.alert('Login failed', err.message || 'Please try again.');
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
        Alert.alert('Account created!', 'Check your email to confirm, then log in.', [
          { text: 'OK', onPress: () => setMode('login') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Left panel (brand) ──────────────────────────────────────────────────────
  const LeftPanel = () => (
    <View style={[styles.leftPanel, { backgroundColor: colors.accent }]}>
      <View style={styles.leftContent}>
        {/* Logo */}
        <Text style={styles.brandLogo}>ASCEND</Text>
        <Text style={styles.brandTagline}>Build better habits.{'\n'}Live more fully.</Text>

        {/* Features */}
        <View style={styles.featuresGrid}>
          {FEATURES.map(({ icon, label }) => (
            <View key={label} style={styles.featureChip}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Bottom quote */}
        <Text style={styles.brandQuote}>
          "One small habit, done consistently, changes everything."
        </Text>
      </View>
    </View>
  );

  // ── Landing form ────────────────────────────────────────────────────────────
  const LandingForm = () => (
    <View style={styles.formSection}>
      {!isDesktop && (
        <>
          <Text style={[styles.mobileLogo, { color: colors.accent }]}>ASCEND</Text>
          <Text style={[styles.mobileTagline, { color: colors.textSecondary }]}>
            Build better habits. Live more fully.
          </Text>
        </>
      )}

      <Text style={[styles.formTitle, { color: colors.text }]}>Get started</Text>
      <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
        Join thousands building better habits every day.
      </Text>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
        onPress={() => setMode('signup')}
      >
        <Text style={styles.primaryBtnText}>Create Free Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: colors.border }]}
        onPress={() => setMode('login')}
      >
        <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Sign In</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity onPress={onGuest} style={styles.ghostBtn}>
        <Text style={[styles.ghostBtnText, { color: colors.textSecondary }]}>
          Continue without account
        </Text>
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
        No account? Data stays on this device only.
      </Text>
    </View>
  );

  // ── Auth form (login / signup) ──────────────────────────────────────────────
  const AuthForm = () => (
    <View style={styles.formSection}>
      <TouchableOpacity
        onPress={() => setMode('landing')}
        style={styles.backBtn}
      >
        <Text style={[styles.backBtnText, { color: colors.accent }]}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.formTitle, { color: colors.text }]}>
        {mode === 'login' ? 'Welcome back' : 'Create account'}
      </Text>
      <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
        {mode === 'login'
          ? 'Sign in to sync your progress across devices.'
          : 'Your data will be saved and synced everywhere.'}
      </Text>

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
        placeholderTextColor={colors.textTertiary}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.inputInRow, { color: colors.text }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: colors.textTertiary, fontSize: 16 }}>
            {showPassword ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'signup' && (
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showPassword}
        />
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1, marginTop: 8 }]}
        onPress={mode === 'login' ? handleLogin : handleSignUp}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchModeBtn}
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        <Text style={[styles.switchModeText, { color: colors.accent }]}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity onPress={onGuest} style={styles.ghostBtn}>
        <Text style={[styles.ghostBtnText, { color: colors.textSecondary }]}>
          Continue without account
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Desktop layout (two columns, no scroll) ─────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
        <LeftPanel />
        <View style={[styles.rightPanel, { backgroundColor: colors.background }]}>
          {mode === 'landing' ? <LandingForm /> : <AuthForm />}
        </View>
      </View>
    );
  }

  // ── Mobile layout ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.mobileRoot, { backgroundColor: colors.background }]}>
      {mode === 'landing' ? <LandingForm /> : <AuthForm />}
    </View>
  );
}

const styles = StyleSheet.create({
  // Desktop
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '42%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  leftContent: {
    maxWidth: 360,
    width: '100%',
  },
  brandLogo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
    marginBottom: 12,
  },
  brandTagline: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 30,
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  featureIcon: { fontSize: 16 },
  featureLabel: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
  brandQuote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: 22,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.4)',
    paddingLeft: 14,
  },

  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Mobile
  mobileRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  mobileLogo: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  mobileTagline: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },

  // Form section (shared)
  formSection: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  backBtn: { marginBottom: 24 },
  backBtnText: { fontSize: 14, fontWeight: '500' },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputInRow: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  eyeBtn: { paddingHorizontal: 14 },

  // Buttons
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: { fontWeight: '500', fontSize: 15 },
  ghostBtn: { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { fontSize: 14 },
  switchModeBtn: { alignItems: 'center', paddingVertical: 14 },
  switchModeText: { fontSize: 14, fontWeight: '500' },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 12, fontSize: 13 },

  disclaimer: { fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
