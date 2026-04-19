import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {FormInput} from '../components/FormInput';
import {AddressAutocompleteInput} from '../components/AddressAutocompleteInput';
import {DatePickerField} from '../components/DatePickerField';
import {FormPicker} from '../components/FormPicker';
import {US_STATES} from '../constants/formOptions';
import {AppButton} from '../components/AppButton';
import {KeyboardAwareFormScroll} from '../components/KeyboardAwareFormScroll';
import {colors} from '../theme/colors';
import {dataService, Customer, addMonths} from '../services/dataService';
import {handleAsyncError, showError} from '../utils/errorHandler';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateZip,
} from '../utils/validation';

interface EditCustomerScreenProps {
  customerId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function EditCustomerScreen({
  customerId,
  onComplete,
  onCancel,
}: EditCustomerScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<Customer>>({});

  useEffect(() => {
    dataService.getCustomer(customerId).then(c => {
      if (c) {
        setData({
          business_name: c.business_name,
          customer_name: c.customer_name,
          address: c.address,
          suite: c.suite,
          city: c.city,
          state: c.state,
          zip: c.zip,
          phone: c.phone,
          email: c.email,
          contact_person_name: c.contact_person_name,
          contact_person_phone: c.contact_person_phone,
          contact_person_email: c.contact_person_email,
          system_type: c.system_type,
          last_service_date: c.last_service_date,
          next_service_date: c.next_service_date,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [customerId]);

  const handleSave = async () => {
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
      await dataService.updateCustomer(customerId, data);
      onComplete?.();
    } catch (e) {
      handleAsyncError(e, 'Update Failed', 'Could not update customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAwareFormScroll
      style={styles.container}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      keyboardShouldPersistTaps="always">
      <Text style={styles.title}>Edit Customer</Text>
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
        onChange={v =>
          setData(prev => {
            const last = v;
            let next = prev.next_service_date;
            if (last && /^\d{4}-\d{2}-\d{2}$/.test(last)) {
              next = addMonths(last, 6);
            }
            return {...prev, last_service_date: last, next_service_date: next};
          })
        }
      />
      <Text style={styles.fieldHint}>
        Next service date updates automatically to six months after the last service date (you can still change it
        below).
      </Text>
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
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.btn}
        />
      </View>
    </KeyboardAwareFormScroll>
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
  fieldHint: {
    fontSize: 13,
    color: colors.gray,
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 18,
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
