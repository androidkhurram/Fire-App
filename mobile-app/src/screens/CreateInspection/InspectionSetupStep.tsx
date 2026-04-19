import React, {useState} from 'react';
import {View, Text, StyleSheet, Switch} from 'react-native';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {StepProgress, type Step} from '../../components/StepProgress';
import {DatePickerField} from '../../components/DatePickerField';
import {FormPicker} from '../../components/FormPicker';
import {INSPECTION_RESULTS} from '../../constants/formOptions';
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

export interface InspectionSetupInfo {
  inspectionScheduled: boolean;
  inspectionDate: string;
  inspectionResult: 'pass' | 'fail' | 'needs_repair';
}

interface InspectionSetupStepProps {
  initialData?: Partial<InspectionSetupInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: InspectionSetupInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Step 7 - Inspection Setup (before Comments)
 */
export function InspectionSetupStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 6,
  onStepSelect,
}: InspectionSetupStepProps) {
  const [data, setData] = useState<InspectionSetupInfo>({
    inspectionScheduled: initialData?.inspectionScheduled ?? false,
    inspectionDate: initialData?.inspectionDate ?? new Date().toISOString().split('T')[0],
    inspectionResult: initialData?.inspectionResult ?? 'pass',
  });

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Inspection Setup</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Inspection Scheduled</Text>
          <Switch
            value={data.inspectionScheduled}
            onValueChange={v => setData({...data, inspectionScheduled: v})}
            trackColor={{false: colors.lightGray, true: colors.accentLight}}
            thumbColor={data.inspectionScheduled ? colors.accent : colors.gray}
          />
        </View>
        <DatePickerField
          label="Inspection Date"
          value={data.inspectionDate}
          onChange={v => setData({...data, inspectionDate: v})}
        />
        <FormPicker
          label="Inspection Result"
          value={data.inspectionResult}
          options={INSPECTION_RESULTS}
          onSelect={v =>
            setData({
              ...data,
              inspectionResult: v as 'pass' | 'fail' | 'needs_repair',
            })
          }
        />
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton
            title="Save & Continue"
            onPress={() => onSaveAndContinue(data)}
            style={styles.continueBtn}
          />
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
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.darkGray,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  backBtn: {
    flex: 1,
  },
  continueBtn: {
    flex: 1,
  },
});
