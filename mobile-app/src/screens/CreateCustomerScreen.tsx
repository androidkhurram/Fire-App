import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {FormInput} from '../components/FormInput';
import {AddressAutocompleteInput} from '../components/AddressAutocompleteInput';
import {DatePickerField} from '../components/DatePickerField';
import {FormPicker} from '../components/FormPicker';
import {US_STATES} from '../constants/formOptions';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';
import {dataService, Customer} from '../services/dataService';
import {handleAsyncError, showError} from '../utils/errorHandler';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateZip,
} from '../utils/validation';

interface CreateCustomerScreenProps {
  onComplete?: (customerId: string) => void;
  onCancel?: () => void;
}

/**
 * Create Customer - Standalone form to add a new customer
 */
export function CreateCustomerScreen({
  onComplete,
  onCancel,
}: CreateCustomerScreenProps) {
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<Customer>>({});

  const handleCreate = async () => {
    const check = validateRequired(data.business_name ?? '', 'Business name');
    if (!check.valid) {
      showError('Validation', check.message ?? 'Business name is required.');
      return;
    }
    const emailCheck = validateEmail(data.email ?? '');
    if (!emailCheck.valid) {
      showError('Validation', emailCheck.message ?? 'Invalid email');
      return;
    }
    const phoneCheck = validatePhone(data.phone ?? '');
    if (!phoneCheck.valid) {
      showError('Validation', phoneCheck.message ?? 'Invalid phone');
      return;
    }
    const zipCheck = validateZip(data.zip ?? '');
    if (!zipCheck.valid) {
      showError('Validation', zipCheck.message ?? 'Invalid zip');
      return;
    }
    setSaving(true);
    try {
      const customer = await dataService.createCustomer({
        business_name: data.business_name!,
        customer_name: data.customer_name ?? data.business_name,
        address: data.address,
        suite: data.suite,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        contact_person_name: data.contact_person_name,
        contact_person_phone: data.contact_person_phone,
        contact_person_email: data.contact_person_email,
        system_type: data.system_type,
        last_service_date: data.last_service_date,
        next_service_date: data.next_service_date,
      });
      if (customer) {
        onComplete?.(customer.id);
      }
    } catch (e) {
      handleAsyncError(e, 'Create Failed', 'Could not create customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create New Customer</Text>
      <FormInput
        label="Business Name"
        placeholder="Required"
        value={data.business_name ?? ''}
        onChangeText={v => setData(prev => ({...prev, business_name: v}))}
      />
      <FormInput
        label="Customer Name"
        placeholder="Optional"
        value={data.customer_name ?? ''}
        onChangeText={v => setData(prev => ({...prev, customer_name: v}))}
      />
      <AddressAutocompleteInput
        label="Address"
        value={data.address ?? ''}
        onChange={v => setData(prev => ({...prev, address: v}))}
        onAddressSelect={r => setData(prev => ({...prev, address: r.address, suite: r.suite ?? '', city: r.city, state: r.state, zip: r.zipCode}))}
      />
      <FormInput
        label="Suite (optional)"
        placeholder="e.g. Suite 100, Unit C"
        value={data.suite ?? ''}
        onChangeText={v => setData(prev => ({...prev, suite: v}))}
      />
      <FormInput
        label="City"
        placeholder="Enter city"
        value={data.city ?? ''}
        onChangeText={v => setData(prev => ({...prev, city: v}))}
      />
      <FormPicker
        label="State"
        value={data.state ?? ''}
        options={US_STATES}
        onSelect={v => setData(prev => ({...prev, state: v}))}
        placeholder="Select state"
      />
      <FormInput
        label="Zip Code"
        placeholder="Zip"
        value={data.zip ?? ''}
        onChangeText={v => setData(prev => ({...prev, zip: v}))}
        keyboardType="numeric"
      />
      <FormInput
        label="Phone"
        placeholder="Phone"
        value={data.phone ?? ''}
        onChangeText={v => setData(prev => ({...prev, phone: v}))}
        keyboardType="phone-pad"
      />
      <FormInput
        label="Email"
        placeholder="Email"
        value={data.email ?? ''}
        onChangeText={v => setData(prev => ({...prev, email: v}))}
        keyboardType="email-address"
      />
      <FormInput
        label="Contact Person Name"
        placeholder="Optional"
        value={data.contact_person_name ?? ''}
        onChangeText={v => setData(prev => ({...prev, contact_person_name: v}))}
      />
      <FormInput
        label="Contact Phone"
        placeholder="Optional"
        value={data.contact_person_phone ?? ''}
        onChangeText={v => setData(prev => ({...prev, contact_person_phone: v}))}
        keyboardType="phone-pad"
      />
      <FormInput
        label="Contact Email"
        placeholder="Optional"
        value={data.contact_person_email ?? ''}
        onChangeText={v => setData(prev => ({...prev, contact_person_email: v}))}
        keyboardType="email-address"
      />
      <FormInput
        label="System Type"
        placeholder="e.g. Wet Chemical"
        value={data.system_type ?? ''}
        onChangeText={v => setData(prev => ({...prev, system_type: v}))}
      />
      <DatePickerField
        label="Last Service Date"
        value={data.last_service_date ?? ''}
        onChange={v => setData(prev => ({...prev, last_service_date: v}))}
      />
      <DatePickerField
        label="Next Service Date"
        value={data.next_service_date ?? ''}
        onChange={v => setData(prev => ({...prev, next_service_date: v}))}
      />
      <View style={styles.buttons}>
        {onCancel && (
          <AppButton title="Cancel" onPress={onCancel} variant="outline" style={styles.btn} />
        )}
        <AppButton
          title="Create Customer"
          onPress={handleCreate}
          loading={saving}
          style={styles.btn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  btn: {
    flex: 1,
  },
});
