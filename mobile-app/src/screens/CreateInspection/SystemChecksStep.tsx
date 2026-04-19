import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {StepProgress, type Step} from '../../components/StepProgress';
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

/** Fallback when API unavailable - exported for report/reportService compatibility */
export const SYSTEM_CHECKS = [
  'All appliances properly covered w/correct nozzles',
  'Nozzles aimed correctly at appliances',
  'System installed in accordance w/MFG UL listing',
  'Piping properly supported',
  'Correct pipe size used',
  'Pressure gauge in proper range',
  'Has system has been discharged? report same',
  'Fusible links in proper position',
  'Manual pull station accessible',
  'Gas valve properly installed',
  'Electrical connections correct',
  'System tagged and dated',
  'Replaced fusible links',
  'Replaced thermal detectors',
  'Portable extinguishers properly serviced',
  'Service & Certification tag on system',
];

type CheckResponse = 'yes' | 'no' | 'na';

export interface SystemChecksInfo {
  responses: Record<string, CheckResponse>;
}

interface SystemChecksStepProps {
  initialData?: Partial<SystemChecksInfo>;
  onBack: () => void;
  onSaveAndContinue: (data: SystemChecksInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Step 5 - System Checks
 * From designer: work progress phase-1.jpg
 */
export function SystemChecksStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = WIZARD_STEPS,
  currentStep = 5,
  onStepSelect,
}: SystemChecksStepProps) {
  const [checks, setChecks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, CheckResponse>>(
    initialData?.responses ?? {},
  );

  useEffect(() => {
    dataService.getSystemChecks().then(list => {
      setChecks(list);
      setLoading(false);
    }).catch(() => {
      setChecks([...SYSTEM_CHECKS]);
      setLoading(false);
    });
  }, []);

  const setResponse = (item: string, value: CheckResponse) => {
    setResponses(prev => ({...prev, [item]: value}));
  };

  const handleSave = () => {
    onSaveAndContinue({responses});
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
        </View>
        <View style={[styles.content, styles.centered]}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  const checkItems = checks.length > 0 ? checks : [...SYSTEM_CHECKS];

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAwareFormScroll style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>System Checks</Text>
        <View style={styles.checklist}>
          {checkItems.map((item, index) => (
            <View key={item} style={styles.checkRow}>
              <Text style={styles.checkNumber}>{index + 1}.</Text>
              <Text style={styles.checkLabel}>{item}</Text>
              <View style={styles.responseRow}>
                {(['yes', 'no', 'na'] as const).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.responseBtn,
                      responses[item] === opt && styles.responseBtnActive,
                    ]}
                    onPress={() => setResponse(item, opt)}>
                    <Text
                      style={[
                        styles.responseText,
                        responses[item] === opt && styles.responseTextActive,
                      ]}>
                      {opt === 'na' ? 'N/A' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  checkNumber: {
    width: 24,
    fontSize: 14,
    color: colors.gray,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.darkGray,
    marginRight: 12,
    minWidth: 200,
  },
  responseRow: {
    flexDirection: 'row',
    gap: 8,
  },
  responseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  responseBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  responseText: {
    fontSize: 12,
    color: colors.gray,
  },
  responseTextActive: {
    color: colors.white,
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
