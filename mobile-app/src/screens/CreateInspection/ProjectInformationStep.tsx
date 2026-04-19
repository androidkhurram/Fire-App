import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {StepProgress, type Step} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {DatePickerField} from '../../components/DatePickerField';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {dataService} from '../../services/dataService';

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

export interface ProjectInfo {
  projectDate: string;
  installationStartDate: string;
  installationEndDate: string;
  technicianName: string;
}

interface ProjectInformationStepProps {
  initialData?: Partial<ProjectInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: ProjectInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Step 3 - Project Information
 * From designer: project information.jpg
 */
export function ProjectInformationStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 2,
  onStepSelect,
}: ProjectInformationStepProps) {
  const [data, setData] = useState<ProjectInfo>({
    projectDate: initialData?.projectDate ?? '',
    installationStartDate: initialData?.installationStartDate ?? '',
    installationEndDate: initialData?.installationEndDate ?? '',
    technicianName: initialData?.technicianName ?? '',
  });

  useEffect(() => {
    let cancelled = false;
    dataService.getSession().then(session => {
      if (cancelled || !session) return;
      const name = session.displayName?.trim() || session.email;
      setData(prev => ({...prev, technicianName: name}));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Project Information</Text>
        <DatePickerField
          label="Project Date"
          value={data.projectDate}
          onChange={v => setData({...data, projectDate: v})}
        />
        <DatePickerField
          label="Installation Start Date"
          value={data.installationStartDate}
          onChange={v => setData({...data, installationStartDate: v})}
        />
        <DatePickerField
          label="Installation End Date"
          value={data.installationEndDate}
          onChange={v => setData({...data, installationEndDate: v})}
        />
        <FormInput
          label="Technician Name"
          placeholder="—"
          value={data.technicianName || '—'}
          readOnly
        />
        <Text style={styles.readOnlyHint}>Taken from your signed-in account</Text>
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  readOnlyHint: {
    fontSize: 12,
    color: colors.gray,
    marginTop: -8,
    marginBottom: 8,
  },
});
