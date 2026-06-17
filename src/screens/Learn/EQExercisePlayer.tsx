import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { Spacing, FontSize, BorderRadius, FontWeight, Animations } from '../../utils/theme';
import { EQExercise } from '../../data/eqExercises';

interface EQExercisePlayerProps {
  exercise: EQExercise;
  onComplete: (timeSpent: number) => void;
}

export default function EQExercisePlayer({ exercise, onComplete }: EQExercisePlayerProps) {
  const { colors } = useApp();
  const [isRunning, setIsRunning] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(exercise.duration * 60); // seconds
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime] = useState(Date.now());

  const totalTime = exercise.duration * 60;
  const progress = (totalTime - timeRemaining) / totalTime;

  // Calculate step timing for breathing exercises
  const getStepTiming = () => {
    if (exercise.type === 'breathing') {
      const cycle = exercise.steps;
      const cycleDuration = cycle.reduce((sum, step) => sum + (step.duration || 0), 0);
      const cycleProgress = (progress * totalTime) % cycleDuration;
      let accumulated = 0;

      for (let i = 0; i < cycle.length; i++) {
        const stepDuration = cycle[i].duration || 0;
        if (cycleProgress >= accumulated && cycleProgress < accumulated + stepDuration) {
          return i;
        }
        accumulated += stepDuration;
      }
      return 0;
    }
    return 0;
  };

  const currentStepIdx = exercise.type === 'breathing' ? getStepTiming() : 0;
  const currentStep = exercise.steps[currentStepIdx] || exercise.steps[0];

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsRunning(false);
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          setTimeout(() => onComplete(timeSpent), 500);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsRunning(!isRunning);
  };

  const handleSkip = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete(timeSpent);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Timer Section */}
      <View style={[s.timerSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500', textTransform: 'uppercase', marginBottom: Spacing.md, letterSpacing: 0.5 }}>
          Time Remaining
        </Text>

        <Text style={{ color: colors.text, fontSize: 56, fontWeight: FontWeight.bold, marginBottom: Spacing.md, textAlign: 'center', fontFamily: 'monospace' }}>
          {formatTime(timeRemaining)}
        </Text>

        {/* Progress Bar */}
        <View style={[s.progressBar, { backgroundColor: colors.border }]}>
          <View style={[s.progressBarFill, { backgroundColor: colors.accent, width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Instruction Section */}
      <View style={[s.instructionSection, { backgroundColor: colors.surfaceLight }]}>
        <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.md, textAlign: 'center' }}>
          {currentStep.instruction}
        </Text>
        {exercise.type === 'guided' && (
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 }}>
            Follow the instructions and take your time. There's no rush.
          </Text>
        )}
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Controls */}
      <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <TouchableOpacity
            onPress={handlePause}
            style={[s.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600' }}>
              {isRunning ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            style={[s.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600' }}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  timerSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
    borderBottomWidth: 1,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  instructionSection: {
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  controlButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
});
