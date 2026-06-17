import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Spacing, FontSize, BorderRadius, FontWeight } from '../../utils/theme';
import { GameExercise, GameRound } from '../../data/eqInteractiveExercises';

interface EQGameExerciseProps {
  exercise: GameExercise;
  onComplete: (score: number, totalRounds: number) => void;
}

export default function EQGameExercise({ exercise, onComplete }: EQGameExerciseProps) {
  const { colors } = useApp();
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const currentRound = exercise.rounds[currentRoundIndex];
  const selectedAnswer = selectedAnswers[currentRound.id];
  const isMultipleChoice = Array.isArray(currentRound.correct);

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentRound.id]: option }));
  };

  const handleSubmitAnswer = () => {
    const correct = isMultipleChoice
      ? (currentRound.correct as string[]).includes(selectedAnswer)
      : selectedAnswer === currentRound.correct;

    setIsAnswerCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
    }
    setShowFeedback(true);
  };

  const handleNextRound = () => {
    if (currentRoundIndex < exercise.rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
      setShowFeedback(false);
      setIsAnswerCorrect(null);
    } else {
      onComplete(score + (isAnswerCorrect ? 1 : 0), exercise.rounds.length);
    }
  };

  const progress = ((currentRoundIndex + 1) / exercise.rounds.length) * 100;

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
        {/* Progress */}
        <View style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={{ color: colors.text, fontSize: FontSize.sm, fontWeight: '600' }}>
              Round {currentRoundIndex + 1} of {exercise.rounds.length}
            </Text>
            <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '600' }}>
              Score: {score}
            </Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ height: '100%', backgroundColor: colors.accent, width: `${progress}%` }} />
          </View>
        </View>

        {/* Question */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold, lineHeight: 26 }}>
            {currentRound.prompt}
          </Text>
        </Card>

        {/* Options */}
        {!showFeedback ? (
          <>
            <Text style={{ color: colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md }}>
              Select your answer
            </Text>
            <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
              {currentRound.options.map(option => (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelectAnswer(option)}
                  style={[
                    s.optionCard,
                    {
                      backgroundColor: selectedAnswer === option ? colors.accentLight : colors.surface,
                      borderColor: selectedAnswer === option ? colors.accent : colors.border,
                      borderWidth: selectedAnswer === option ? 2 : 0.5,
                    },
                  ]}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedAnswer === option ? colors.accent : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: Spacing.md,
                  }}>
                    {selectedAnswer === option && (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                    )}
                  </View>
                  <Text style={{
                    color: selectedAnswer === option ? colors.accent : colors.text,
                    fontSize: FontSize.md,
                    fontWeight: selectedAnswer === option ? '600' : '500',
                    flex: 1,
                  }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Submit Answer"
              onPress={handleSubmitAnswer}
              disabled={!selectedAnswer}
            />
          </>
        ) : (
          <>
            {/* Feedback */}
            <View style={{ marginBottom: Spacing.lg }}>
              {isAnswerCorrect ? (
                <Card style={{ backgroundColor: colors.success + '20', borderLeftWidth: 4, borderLeftColor: colors.success }}>
                  <Text style={{ color: colors.success, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>
                    ✓ Correct!
                  </Text>
                  <Text style={{ color: colors.success, fontSize: FontSize.md, lineHeight: 22 }}>
                    {currentRound.explanation}
                  </Text>
                </Card>
              ) : (
                <Card style={{ backgroundColor: colors.danger + '20', borderLeftWidth: 4, borderLeftColor: colors.danger }}>
                  <Text style={{ color: colors.danger, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>
                    Not quite right
                  </Text>
                  <Text style={{ color: colors.danger, fontSize: FontSize.md, marginBottom: Spacing.md, lineHeight: 22 }}>
                    The correct answer is: <Text style={{ fontWeight: '600' }}>
                      {Array.isArray(currentRound.correct) ? currentRound.correct.join(' or ') : currentRound.correct}
                    </Text>
                  </Text>
                  <Text style={{ color: colors.danger, fontSize: FontSize.sm, lineHeight: 20 }}>
                    {currentRound.explanation}
                  </Text>
                </Card>
              )}
            </View>

            {/* Additional Learning */}
            {currentRound.eqLessonIfWrong && !isAnswerCorrect && (
              <Card style={{ backgroundColor: colors.accentLight, marginBottom: Spacing.lg }}>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm }}>
                  💡 EQ Lesson
                </Text>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm, lineHeight: 20 }}>
                  {currentRound.eqLessonIfWrong}
                </Text>
              </Card>
            )}

            <Button
              title={currentRoundIndex < exercise.rounds.length - 1 ? 'Next Round' : 'Complete Exercise'}
              onPress={handleNextRound}
            />
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
  optionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
