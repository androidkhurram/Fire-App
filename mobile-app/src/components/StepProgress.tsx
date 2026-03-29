import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors} from '../theme/colors';

export interface Step {
  id: number;
  title: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  /** When provided, completed steps (index <= currentStep) become clickable to jump back for review */
  onStepPress?: (index: number) => void;
}

export function StepProgress({steps, currentStep, onStepPress}: StepProgressProps) {
  const rowContent = (step: Step, index: number) => {
    const isActive = index <= currentStep;
    return (
      <>
        <View style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
          <Text style={[styles.stepNumberText, isActive && styles.stepNumberTextActive]}>
            {step.id}
          </Text>
        </View>
        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>
          {step.title}
        </Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isClickable = onStepPress && index <= currentStep;
        if (isClickable) {
          return (
            <TouchableOpacity
              key={step.id}
              onPress={() => onStepPress(index)}
              activeOpacity={0.7}
              style={styles.stepRow}
            >
              {rowContent(step, index)}
            </TouchableOpacity>
          );
        }
        return (
          <View key={step.id} style={styles.stepRow}>
            {rowContent(step, index)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    paddingVertical: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberActive: {
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
  },
  stepNumberTextActive: {
    color: colors.white,
  },
  stepTitle: {
    fontSize: 14,
    color: colors.gray,
    flex: 1,
  },
  stepTitleActive: {
    color: colors.darkGray,
    fontWeight: '500',
  },
});
