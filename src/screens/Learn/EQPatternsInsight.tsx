import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { analyzeEQPatterns } from '../../data/eqInteractiveExercises';

interface EQPatternsInsightProps {
  completions?: any[];
}

export default function EQPatternsInsight({ completions = [] }: EQPatternsInsightProps) {
  const { colors } = useApp();
  const patterns = analyzeEQPatterns(completions);

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
        {/* Header */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>
            Your EQ Patterns
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
            Based on your exercise completions, here's what we're noticing about your emotional intelligence.
          </Text>
        </View>

        {patterns.length === 0 ? (
          <Card style={{ backgroundColor: colors.surfaceLight }}>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 }}>
              Complete more exercises to see your patterns emerge. The more you practice, the clearer your strengths and growth areas become.
            </Text>
          </Card>
        ) : (
          <>
            {/* Strengths */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md }}>
                Your Strengths
              </Text>
              {patterns
                .filter(p => p.type === 'strength')
                .map((pattern, idx) => (
                  <Card key={idx} style={{ marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: colors.success }}>
                    <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
                      {pattern.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 }}>
                      {pattern.description}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, fontStyle: 'italic', marginBottom: Spacing.md }}>
                      Evidence: {pattern.evidence}
                    </Text>
                    <View style={{ backgroundColor: colors.success + '15', borderRadius: BorderRadius.md, padding: Spacing.sm }}>
                      <Text style={{ color: colors.success, fontSize: FontSize.sm, fontWeight: '500' }}>
                        💡 {pattern.suggestion}
                      </Text>
                    </View>
                  </Card>
                ))}
            </View>

            {/* Growth Areas */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md }}>
                Growth Areas
              </Text>
              {patterns
                .filter(p => p.type === 'avoidance')
                .map((pattern, idx) => (
                  <Card key={idx} style={{ marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
                    <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
                      {pattern.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 }}>
                      {pattern.description}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, fontStyle: 'italic', marginBottom: Spacing.md }}>
                      Evidence: {pattern.evidence}
                    </Text>
                    <View style={{ backgroundColor: colors.warning + '15', borderRadius: BorderRadius.md, padding: Spacing.sm }}>
                      <Text style={{ color: colors.warning, fontSize: FontSize.sm, fontWeight: '500' }}>
                        💡 {pattern.suggestion}
                      </Text>
                    </View>
                  </Card>
                ))}
            </View>

            {/* Progress */}
            <View>
              <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md }}>
                Recent Progress
              </Text>
              {patterns
                .filter(p => p.type === 'growth')
                .map((pattern, idx) => (
                  <Card key={idx} style={{ marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: colors.accent }}>
                    <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
                      {pattern.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 }}>
                      {pattern.description}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.xs, fontStyle: 'italic', marginBottom: Spacing.md }}>
                      Evidence: {pattern.evidence}
                    </Text>
                    <View style={{ backgroundColor: colors.accent + '15', borderRadius: BorderRadius.md, padding: Spacing.sm }}>
                      <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '500' }}>
                        ✨ {pattern.suggestion}
                      </Text>
                    </View>
                  </Card>
                ))}
            </View>

            {/* Pro Tips */}
            <Card style={{ backgroundColor: colors.accentLight, marginTop: Spacing.lg }}>
              <Text style={{ color: colors.accent, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm }}>
                How to Use These Insights
              </Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.sm, lineHeight: 20 }}>
                • Use your strengths to help others (share your empathy, communication skills)
                {'\n'}
                • Practice scenarios in your growth areas 2-3 times per week
                {'\n'}
                • Notice these patterns in real life and experiment with new approaches
              </Text>
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
});
