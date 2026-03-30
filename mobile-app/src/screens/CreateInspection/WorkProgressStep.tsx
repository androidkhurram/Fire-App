import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
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

const INSTALLATION_TASKS = [
  'Control Box Installation',
  'Nozzles Installation',
  'Black Piping Installation',
  'Pull Station Installation',
  'Gas Valve Installation',
  'Copper Tube Installation',
  'Fuse Links Installation',
  'Fuse Links Hangers Installation',
  'Cartridge Installation',
];

const INSPECTION_TASKS = [
  'Nozzles Inspected',
  'Fusible Links Inspected',
  'Pressure Gauge Checked',
  'Gas Valve Tested',
  'Pull Station Inspected',
  'Electrical Connections Verified',
  'Thermal Detectors Inspected',
  'Service Tag Verified',
  'System Documentation Reviewed',
];

const MAINTENANCE_TASKS = [
  'Fusible Links Replaced',
  'System Recharged',
  'Nozzles Inspected/Replaced',
  'Pressure Gauge Checked',
  'Gas Valve Tested',
  'Electrical Connections Verified',
  'Thermal Detectors Replaced',
  'Service Tag Updated',
  'Portable Extinguishers Serviced',
];

export interface WorkProgressInfo {
  completedTasks: string[];
}

interface WorkProgressStepProps {
  initialData?: Partial<WorkProgressInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: WorkProgressInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
  serviceType?: 'installation' | 'inspection' | 'maintenance';
}

/**
 * Step 4 - Work Progress Phase
 * From designer: work progress phase.jpg
 */
export function WorkProgressStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 4,
  onStepSelect,
  serviceType = 'installation',
}: WorkProgressStepProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    new Set(initialData?.completedTasks ?? []),
  );
  const tasks =
    serviceType === 'maintenance'
      ? MAINTENANCE_TASKS
      : serviceType === 'inspection'
        ? INSPECTION_TASKS
        : INSTALLATION_TASKS;
  const title =
    serviceType === 'maintenance'
      ? 'Maintenance Work Performed'
      : serviceType === 'inspection'
        ? 'Inspection Work Performed'
        : 'Work Progress Phase';

  const toggleTask = (task: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(task)) {
        next.delete(task);
      } else {
        next.add(task);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSaveAndContinue({completedTasks: Array.from(completedTasks)});
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.checklist}>
          <View style={styles.checklistColumn}>
            {tasks.map(task => (
              <TouchableOpacity
                key={task}
                style={styles.checkItem}
                onPress={() => toggleTask(task)}
                activeOpacity={0.7}>
                <View style={[styles.checkbox, completedTasks.has(task) && styles.checkboxChecked]}>
                  {completedTasks.has(task) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>{task}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.buttons}>
          <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          <AppButton title="Save & Continue" onPress={handleSave} style={styles.continueBtn} />
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
  checklist: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 20,
  },
  checklistColumn: {
    minWidth: 0,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    minWidth: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkLabel: {
    fontSize: 16,
    color: colors.darkGray,
    flex: 1,
    flexShrink: 1,
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
