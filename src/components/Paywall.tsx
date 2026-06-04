import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Linking from 'expo-linking';
import { useApp } from '../contexts/AppContext';
import { Spacing, FontSize } from '../utils/theme';

export const Paywall: React.FC = () => {
  const { colors } = useApp();

  const handleSubscribe = async (plan: string) => {
    const url = `https://asix.live/checkout?app=ascend&plan=${plan}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open checkout:', err);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
          🚀 Ascend Pro
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
          Unlock the full power of habit tracking with advanced features and unlimited access
        </Text>
      </View>

      {/* Free vs Pro Comparison */}
      <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
        {/* Free Tier */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>
            Free Tier (Current)
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Limited to 5 habits</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Basic analytics</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✓ Offline mode</Text>
            <Text style={{ color: colors.danger, fontSize: 14 }}>✗ Cloud sync limited</Text>
            <Text style={{ color: colors.danger, fontSize: 14 }}>✗ Community features</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16 }}>
            $0/month
          </Text>
        </View>

        {/* Pro Tier */}
        <View
          style={{
            backgroundColor: colors.surfaceLight,
            borderRadius: 12,
            padding: 20,
            borderWidth: 2,
            borderColor: colors.accent,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>
            Pro Tier (Recommended)
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.success, fontSize: 14 }}>✓ Unlimited habits</Text>
            <Text style={{ color: colors.success, fontSize: 14 }}>✓ Advanced analytics & insights</Text>
            <Text style={{ color: colors.success, fontSize: 14 }}>✓ Full cloud sync</Text>
            <Text style={{ color: colors.success, fontSize: 14 }}>✓ Community access</Text>
            <Text style={{ color: colors.success, fontSize: 14 }}>✓ Priority support</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.accent, marginTop: 16 }}>
            $9.99/month
          </Text>
          <TouchableOpacity
            onPress={() => handleSubscribe('pro')}
            style={{
              backgroundColor: colors.accent,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.background, fontSize: 16, fontWeight: 'bold' }}>
              Subscribe to Pro
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enterprise CTA */}
      <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
          Need more? Contact us for enterprise plans
        </Text>
        <TouchableOpacity
          onPress={() => handleSubscribe('enterprise')}
          style={{
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
            Contact Sales
          </Text>
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>
          FAQ
        </Text>
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ color: '#F5A623', fontWeight: '600', marginBottom: 4 }}>
              Can I try Pro for free?
            </Text>
            <Text style={{ color: '#888', fontSize: 12 }}>
              Yes! You get a 7-day free trial when you subscribe. No credit card required upfront.
            </Text>
          </View>
          <View>
            <Text style={{ color: '#F5A623', fontWeight: '600', marginBottom: 4 }}>
              Can I cancel anytime?
            </Text>
            <Text style={{ color: '#888', fontSize: 12 }}>
              Yes, cancel your subscription at any time in your account settings.
            </Text>
          </View>
          <View>
            <Text style={{ color: '#F5A623', fontWeight: '600', marginBottom: 4 }}>
              Is my data secure?
            </Text>
            <Text style={{ color: '#888', fontSize: 12 }}>
              All data is encrypted end-to-end and synced securely to our Supabase backend.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
