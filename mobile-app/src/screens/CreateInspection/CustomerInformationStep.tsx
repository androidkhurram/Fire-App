import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {StepProgress, type Step} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {AddressAutocompleteInput} from '../../components/AddressAutocompleteInput';
import {FormPicker} from '../../components/FormPicker';
import {US_STATES} from '../../constants/formOptions';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {validateRequired, validateEmail, validatePhone, validateZip} from '../../utils/validation';
import {showError} from '../../utils/errorHandler';

const STEPS = [
  {id: 1, title: 'Customer Information'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Project Information'},
  {id: 4, title: 'Work Progress'},
  {id: 5, title: 'System Checks'},
  {id: 6, title: 'System Brands'},
  {id: 7, title: 'Comments'},
];

export interface CustomerInfo {
  businessName: string;
  address: string;
  suite: string;
  city: string;
  state: string;
  zipCode: string;
  telephone: string;
  storeNo: string;
  fax: string;
  email: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
}

interface CustomerInformationStepProps {
  initialData?: Partial<CustomerInfo>;
  onBack?: () => void;
  onSaveAndContinue: (data: CustomerInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
}

/**
 * Step 1 - Customer Information
 * From designer: customer information.jpg
 */
export function CustomerInformationStep({
  initialData,
  onBack,
  onSaveAndContinue,
  steps = STEPS,
  currentStep = 0,
  onStepSelect,
}: CustomerInformationStepProps) {
  const [data, setData] = useState<CustomerInfo>({
    businessName: initialData?.businessName ?? '',
    address: initialData?.address ?? '',
    suite: initialData?.suite ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? '',
    zipCode: initialData?.zipCode ?? '',
    telephone: initialData?.telephone ?? '',
    storeNo: initialData?.storeNo ?? '',
    fax: initialData?.fax ?? '',
    email: initialData?.email ?? '',
    contactPersonName: initialData?.contactPersonName ?? '',
    contactPersonPhone: initialData?.contactPersonPhone ?? '',
    contactPersonEmail: initialData?.contactPersonEmail ?? '',
  });

  // Sync when initialData loads asynchronously (e.g. when opening from CustomerDetails)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(prev => ({
        ...prev,
        businessName: initialData.businessName ?? prev.businessName,
        address: initialData.address ?? prev.address,
        suite: initialData.suite ?? prev.suite,
        city: initialData.city ?? prev.city,
        state: initialData.state ?? prev.state,
        zipCode: initialData.zipCode ?? prev.zipCode,
        telephone: initialData.telephone ?? prev.telephone,
        storeNo: initialData.storeNo ?? prev.storeNo,
        fax: initialData.fax ?? prev.fax,
        email: initialData.email ?? prev.email,
        contactPersonName: initialData.contactPersonName ?? prev.contactPersonName,
        contactPersonPhone: initialData.contactPersonPhone ?? prev.contactPersonPhone,
        contactPersonEmail: initialData.contactPersonEmail ?? prev.contactPersonEmail,
      }));
    }
  }, [
    initialData?.businessName,
    initialData?.address,
    initialData?.suite,
    initialData?.city,
    initialData?.state,
    initialData?.zipCode,
    initialData?.telephone,
    initialData?.email,
    initialData?.contactPersonName,
    initialData?.contactPersonPhone,
    initialData?.contactPersonEmail,
  ]);

  const handleSave = () => {
    const bizCheck = validateRequired(data.businessName ?? '', 'Business name');
    if (!bizCheck.valid) {
      showError('Validation', bizCheck.message ?? 'Business name is required.');
      return;
    }
    const emailCheck = validateEmail(data.email ?? '');
    if (!emailCheck.valid) {
      showError('Validation', emailCheck.message ?? 'Invalid email');
      return;
    }
    const phoneCheck = validatePhone(data.telephone ?? '');
    if (!phoneCheck.valid) {
      showError('Validation', phoneCheck.message ?? 'Invalid phone');
      return;
    }
    const zipCheck = validateZip(data.zipCode ?? '');
    if (!zipCheck.valid) {
      showError('Validation', zipCheck.message ?? 'Invalid zip');
      return;
    }
    onSaveAndContinue(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>Customer Information</Text>
        <FormInput
          label="Business Name"
          placeholder="Enter business name"
          value={data.businessName}
          onChangeText={v => setData({...data, businessName: v})}
        />
        <AddressAutocompleteInput
          label="Address"
          value={data.address}
          onChange={v => setData(prev => ({...prev, address: v}))}
          onAddressSelect={r => setData(prev => ({...prev, address: r.address, suite: r.suite ?? '', city: r.city, state: r.state, zipCode: r.zipCode}))}
        />
        <FormInput
          label="Suite (optional)"
          placeholder="e.g. Suite 100, Unit C"
          value={data.suite}
          onChangeText={v => setData(prev => ({...prev, suite: v}))}
        />
        <View style={styles.row}>
          <FormInput
            label="City"
            placeholder="Enter city"
            value={data.city}
            onChangeText={v => setData({...data, city: v})}
            halfWidth
          />
          <FormPicker
            label="State"
            value={data.state}
            options={US_STATES}
            onSelect={v => setData({...data, state: v})}
            placeholder="Select state"
            halfWidth
          />
        </View>
        <FormInput
          label="Zip Code"
          placeholder="Enter zip code"
          value={data.zipCode}
          onChangeText={v => setData({...data, zipCode: v})}
          keyboardType="numeric"
          halfWidth
        />
        <View style={styles.row}>
          <FormInput
            label="Telephone"
            placeholder="Enter telephone number"
            value={data.telephone}
            onChangeText={v => setData({...data, telephone: v})}
            keyboardType="phone-pad"
            halfWidth
          />
          <FormInput
            label="Store No"
            placeholder="Enter store no"
            value={data.storeNo}
            onChangeText={v => setData({...data, storeNo: v})}
            halfWidth
          />
        </View>
        <View style={styles.row}>
          <FormInput
            label="Fax"
            placeholder="Enter fax number"
            value={data.fax}
            onChangeText={v => setData({...data, fax: v})}
            keyboardType="phone-pad"
            halfWidth
          />
          <FormInput
            label="Email Address"
            placeholder="Enter email address"
            value={data.email}
            onChangeText={v => setData({...data, email: v})}
            keyboardType="email-address"
            halfWidth
          />
        </View>
        <Text style={styles.sectionLabel}>Contact Person</Text>
        <FormInput
          label="Contact Person Name"
          placeholder="Enter name"
          value={data.contactPersonName}
          onChangeText={v => setData({...data, contactPersonName: v})}
        />
        <View style={styles.row}>
          <FormInput
            label="Contact Phone"
            placeholder="Enter phone"
            value={data.contactPersonPhone}
            onChangeText={v => setData({...data, contactPersonPhone: v})}
            keyboardType="phone-pad"
            halfWidth
          />
          <FormInput
            label="Contact Email"
            placeholder="Enter email"
            value={data.contactPersonEmail}
            onChangeText={v => setData({...data, contactPersonEmail: v})}
            keyboardType="email-address"
            halfWidth
          />
        </View>
        <View style={styles.buttons}>
          {onBack && (
            <AppButton title="Back" onPress={onBack} variant="outline" style={styles.backBtn} />
          )}
          <AppButton title="Save & Continue" onPress={handleSave} style={styles.continueBtn} />
        </View>
      </ScrollView>
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
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginTop: 24,
    marginBottom: 12,
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
