import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput} from 'react-native';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {StepProgress, type Step} from '../../components/StepProgress';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';

const WIZARD_STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Project Information'},
  {id: 4, title: 'Permit Status'},
  {id: 5, title: 'Work Progress'},
  {id: 6, title: 'System Checks'},
  {id: 7, title: 'Inspection Setup'},
  {id: 8, title: 'Comments'},
];

export interface CommentsInfo {
  commentText: string;
}

interface CommentsStepProps {
  initialData?: Partial<CommentsInfo>;
  onBack: () => void;
  onSave: (data: CommentsInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Step 7 - Comments (final step)
 * From designer: comments.jpg
 */
export function CommentsStep({
  initialData,
  onBack,
  onSave,
  steps = WIZARD_STEPS,
  currentStep = 7,
  onStepSelect,
}: CommentsStepProps) {
  const [commentText, setCommentText] = useState(
    initialData?.commentText ?? '',
  );

  const handleSave = () => {
    onSave({commentText});
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Comments</Text>
        <Text style={styles.label}>Comments</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write your comments here..."
          placeholderTextColor={colors.gray}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton title="Save" onPress={handleSave} style={styles.continueBtn} />
        </View>
      </KeyboardAwareFormScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    paddingLeft: 24,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  contentInner: {
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.darkGray,
    backgroundColor: colors.white,
    minHeight: 120,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backBtn: {
    flex: 1,
  },
  continueBtn: {
    flex: 1,
  },
});
