import React, {useState, useEffect, useLayoutEffect, useRef} from 'react';
import {View, ActivityIndicator, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {dataService} from '../services/dataService';
import {colors} from '../theme/colors';
import type {Step} from '../components/StepProgress';
import {CustomerSelectionStep} from './CreateInspection/CustomerSelectionStep';
import {CustomerInformationStep, CustomerInfo} from './CreateInspection/CustomerInformationStep';
import {SystemInformationStep, type SystemInfo} from './CreateInspection/SystemInformationStep';
import {ProjectInformationStep, ProjectInfo} from './CreateInspection/ProjectInformationStep';
import {PermitStatusStep, PermitStatusInfo} from './CreateInspection/PermitStatusStep';
import {WorkProgressStep, WorkProgressInfo} from './CreateInspection/WorkProgressStep';
import {PhotosStep, type PhotoItem} from './CreateInspection/PhotosStep';
import {SystemChecksStep, SystemChecksInfo} from './CreateInspection/SystemChecksStep';
import {InspectionSetupStep, InspectionSetupInfo} from './CreateInspection/InspectionSetupStep';
import {CommentsStep, CommentsInfo} from './CreateInspection/CommentsStep';
import {PaymentStep, type PaymentInfo} from './CreateInspection/PaymentStep';

export interface InspectionWizardData {
  customerInfo?: CustomerInfo;
  systemInfo?: SystemInfo;
  projectInfo?: ProjectInfo;
  permitStatus?: PermitStatusInfo;
  workProgress?: WorkProgressInfo;
  photos?: PhotoItem[];
  systemChecks?: SystemChecksInfo;
  inspectionSetup?: InspectionSetupInfo;
  paymentInfo?: PaymentInfo;
  comments?: CommentsInfo;
  dynamicFieldValues?: Record<string, string>;
}

type StepKey =
  | 'customer'
  | 'system'
  | 'project'
  | 'permit'
  | 'work'
  | 'photos'
  | 'checks'
  | 'setup'
  | 'payment'
  | 'comments';

const STEP_CONFIGS: Record<
  'installation' | 'inspection' | 'maintenance',
  {keys: StepKey[]; steps: Step[]}
> = {
  installation: {
    keys: ['customer', 'system', 'project', 'permit', 'checks', 'setup', 'payment', 'comments'],
    steps: [
      {id: 1, title: 'Customer Information'},
      {id: 2, title: 'System Information'},
      {id: 3, title: 'Project Information'},
      {id: 4, title: 'Permit Status'},
      {id: 5, title: 'System Checks'},
      {id: 6, title: 'Inspection Setup'},
      {id: 7, title: 'Payment'},
      {id: 8, title: 'Comments'},
    ],
  },
  inspection: {
    keys: ['customer', 'system', 'work', 'photos', 'checks', 'setup', 'payment', 'comments'],
    steps: [
      {id: 1, title: 'Customer'},
      {id: 2, title: 'System Information'},
      {id: 3, title: 'Inspection Work'},
      {id: 4, title: 'Photos'},
      {id: 5, title: 'System Checks'},
      {id: 6, title: 'Inspection Result'},
      {id: 7, title: 'Payment'},
      {id: 8, title: 'Comments'},
    ],
  },
  maintenance: {
    keys: ['customer', 'system', 'work', 'photos', 'checks', 'setup', 'payment', 'comments'],
    steps: [
      {id: 1, title: 'Customer'},
      {id: 2, title: 'System Information'},
      {id: 3, title: 'Maintenance Work'},
      {id: 4, title: 'Photos'},
      {id: 5, title: 'System Checks'},
      {id: 6, title: 'Inspection Result'},
      {id: 7, title: 'Payment'},
      {id: 8, title: 'Comments'},
    ],
  },
};

const SAVING_COPY: Record<
  'installation' | 'inspection' | 'maintenance',
  {title: string; subtitle: string; saveIdle: string; saveSaving: string}
> = {
  installation: {
    title: 'Saving installation…',
    subtitle:
      'Uploading your installation, data, and any photos. This can take up to a minute — please keep this screen open.',
    saveIdle: 'Save installation',
    saveSaving: 'Saving installation…',
  },
  inspection: {
    title: 'Saving inspection…',
    subtitle:
      'Uploading your inspection, data, and photos. This can take up to a minute — please keep this screen open.',
    saveIdle: 'Save inspection',
    saveSaving: 'Saving inspection…',
  },
  maintenance: {
    title: 'Saving maintenance…',
    subtitle:
      'Uploading your maintenance record, data, and photos. This can take up to a minute — please keep this screen open.',
    saveIdle: 'Save maintenance',
    saveSaving: 'Saving maintenance…',
  },
};

interface CreateInspectionScreenProps {
  existingCustomerId?: string;
  serviceType?: 'installation' | 'inspection' | 'maintenance';
  onComplete?: (data: InspectionWizardData, customerId: string) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Create Inspection - Dynamic wizard by service type
 * Installation, inspection, and maintenance all use this screen; final submit uses the same
 * saving overlay, locks, and CreateInspectionWrapper (photos + report where applicable).
 *
 * Installation: Customer → System → Project → Permit → Checks → Setup → Payment → Comments
 * Inspection: Customer → System → Work → Photos → … → Comments
 * Maintenance: Customer → System → Work → Photos → … → Comments
 */
export function CreateInspectionScreen({
  existingCustomerId,
  serviceType = 'inspection',
  onComplete,
  onCancel,
}: CreateInspectionScreenProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<InspectionWizardData>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(existingCustomerId);
  const [loading, setLoading] = useState(Boolean(existingCustomerId));
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(serviceType === 'installation');
  const navigation = useNavigation();
  const mountedRef = useRef(true);
  const submitLockRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const config = STEP_CONFIGS[serviceType];
  const stepKeys = config.keys;
  const steps = config.steps;
  const currentKey = stepKeys[step];

  const isCustomerSelectionStep = currentKey === 'customer' && !existingCustomerId;
  useLayoutEffect(() => {
    if (isCustomerSelectionStep) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => setShowCreateForm(!showCreateForm)}
            style={{marginRight: 16, paddingVertical: 8}}
            hitSlop={{top: 12, bottom: 12, left: 10, right: 10}}>
            <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600'}}>
              {showCreateForm ? 'Search Existing' : '+ Create New Customer'}
            </Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({headerRight: undefined});
    }
  }, [isCustomerSelectionStep, showCreateForm, navigation]);

  useEffect(() => {
    if (!isCustomerSelectionStep) setShowCreateForm(false);
  }, [isCustomerSelectionStep]);

  useEffect(() => {
    if (!existingCustomerId) return;
    const isInspectionOrMaintenance =
      serviceType === 'inspection' || serviceType === 'maintenance';
    Promise.all([
      dataService.getCustomer(existingCustomerId),
      isInspectionOrMaintenance
        ? dataService.getLastInspectionForCustomer(existingCustomerId)
        : Promise.resolve(null),
    ]).then(([customer, lastInspection]) => {
      const updates: Partial<InspectionWizardData> = {};
      if (customer) {
        updates.customerInfo = {
          businessName: customer.business_name,
          address: customer.address ?? '',
          suite: customer.suite ?? '',
          city: customer.city ?? '',
          state: customer.state ?? '',
          zipCode: customer.zip ?? '',
          telephone: customer.phone ?? '',
          storeNo: '',
          fax: '',
          email: customer.email ?? '',
          contactPersonName: customer.contact_person_name ?? '',
          contactPersonPhone: customer.contact_person_phone ?? '',
          contactPersonEmail: customer.contact_person_email ?? '',
        };
      }
      if (lastInspection?.systemInfo) {
        const si = lastInspection.systemInfo as Partial<SystemInfo>;
        updates.systemInfo = {
          systemNameModal: si.systemNameModal ?? '',
          systemType: si.systemType ?? 'Wet Chemical',
          systemBrand: Array.isArray(si.systemBrand)
            ? si.systemBrand
            : si.systemBrand
              ? [si.systemBrand]
              : [],
          systemBrandItems: si.systemBrandItems ?? [],
          systemModel: si.systemModel ?? '',
          serialNumber: si.serialNumber ?? '',
          ul300Requirement: si.ul300Requirement ?? 'Yes',
          cylinderSize: si.cylinderSize ?? 'Master',
          cylinderLocation: si.cylinderLocation ?? 'Right',
          fuelShutOffType: si.fuelShutOffType ?? 'Electric',
          fuelShutOffSize1: si.fuelShutOffSize1 ?? '',
          fuelShutOffSize2: si.fuelShutOffSize2 ?? '',
          fuelShutOffSerial1: si.fuelShutOffSerial1 ?? '',
          fuelShutOffSerial2: si.fuelShutOffSerial2 ?? '',
          lastHydrostaticTestDate: si.lastHydrostaticTestDate ?? '',
          lastRechargeDate: si.lastRechargeDate ?? '',
          fusibleLinks: si.fusibleLinks ?? {},
          thermalHeatDetector: si.thermalHeatDetector ?? {},
        };
      }
      if (Object.keys(updates).length > 0) {
        setData(prev => ({...prev, ...updates}));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [existingCustomerId, serviceType]);

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onCancel?.();
    }
  };

  const handleComplete = async (finalData: CommentsInfo) => {
    if (submitLockRef.current || saving) return;
    const cid = selectedCustomerId ?? existingCustomerId;
    if (!cid) return;
    submitLockRef.current = true;
    setSaving(true);
    const fullData: InspectionWizardData = {...data, comments: finalData};
    try {
      await onComplete?.(fullData, cid);
    } finally {
      submitLockRef.current = false;
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const renderStepFor = (key: StepKey, idx: number) => {
    const common = { steps, currentStep: step, onStepSelect: (i: number) => setStep(i) };
    if (key === 'customer') {
      if (!existingCustomerId) {
        return (
          <CustomerSelectionStep
            key="customer-select"
            onBack={onCancel ?? (() => {})}
            onCustomerSelected={(customerId, customerInfo) => {
              setData(prev => ({...prev, customerInfo: customerInfo ?? prev.customerInfo}));
              setSelectedCustomerId(customerId);
              setStep(1);
            }}
            {...common}
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
          />
        );
      }
      return (
        <CustomerInformationStep
          key="customer-info"
          initialData={data.customerInfo}
          onBack={onCancel}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, customerInfo: d}));
            setStep(1);
          }}
          {...common}
        />
      );
    }
    if (key === 'system') {
      return (
        <SystemInformationStep
          key="system"
          initialData={data.systemInfo}
          initialDynamicValues={data.dynamicFieldValues}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={(d, dynamicFieldValues) => {
            setData(prev => ({...prev, systemInfo: d, dynamicFieldValues}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'project') {
      return (
        <ProjectInformationStep
          key="project"
          initialData={data.projectInfo}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, projectInfo: d}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'permit') {
      return (
        <PermitStatusStep
          key="permit"
          initialData={data.permitStatus}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, permitStatus: d}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'work') {
      return (
        <WorkProgressStep
          key="work"
          initialData={data.workProgress}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, workProgress: d}));
            setStep(idx + 1);
          }}
          {...common}
          serviceType={serviceType}
        />
      );
    }
    if (key === 'photos') {
      return (
        <PhotosStep
          key="photos"
          initialData={data.photos}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={photos => {
            setData(prev => ({...prev, photos}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'checks') {
      return (
        <SystemChecksStep
          key="checks"
          initialData={data.systemChecks}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, systemChecks: d}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'setup') {
      return (
        <InspectionSetupStep
          key="setup"
          initialData={data.inspectionSetup}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, inspectionSetup: d}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'payment') {
      return (
        <PaymentStep
          key="payment"
          initialData={data.paymentInfo}
          onBack={() => setStep(idx - 1)}
          onSaveAndContinue={d => {
            setData(prev => ({...prev, paymentInfo: d}));
            setStep(idx + 1);
          }}
          {...common}
        />
      );
    }
    if (key === 'comments') {
      return (
        <CommentsStep
          key="comments"
          initialData={data.comments}
          onBack={() => setStep(idx - 1)}
          onSave={handleComplete}
          saving={saving}
          saveIdleTitle={SAVING_COPY[serviceType].saveIdle}
          saveSavingTitle={SAVING_COPY[serviceType].saveSaving}
          {...common}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={styles.stepContainer}>
          {stepKeys.map((key, i) => (
            <View
              key={key}
              style={[
                styles.stepWrapper,
                i !== step ? styles.stepHidden : styles.stepVisible,
              ]}
              pointerEvents={i === step ? 'auto' : 'none'}
            >
              {renderStepFor(key, i)}
            </View>
          ))}
        </View>
      )}
      {saving ? (
        <View style={styles.savingOverlay} pointerEvents="auto">
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.savingTitle}>{SAVING_COPY[serviceType].title}</Text>
            <Text style={styles.savingSub}>{SAVING_COPY[serviceType].subtitle}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 24,
  },
  savingCard: {
    maxWidth: 320,
    alignItems: 'center',
  },
  savingTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkGray,
    textAlign: 'center',
  },
  savingSub: {
    marginTop: 10,
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
    position: 'relative',
  },
  stepWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  stepHidden: {
    opacity: 0,
    zIndex: -1,
  },
  stepVisible: {
    zIndex: 1,
  },
});
