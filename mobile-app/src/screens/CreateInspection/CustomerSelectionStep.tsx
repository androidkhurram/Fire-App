import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';
import {KeyboardAwareFormScroll} from '../../components/KeyboardAwareFormScroll';
import {StepProgress, type Step} from '../../components/StepProgress';
import {FormInput} from '../../components/FormInput';
import {AddressAutocompleteInput} from '../../components/AddressAutocompleteInput';
import {FormPicker} from '../../components/FormPicker';
import {US_STATES} from '../../constants/formOptions';
import {AppButton} from '../../components/AppButton';
import {colors} from '../../theme/colors';
import {dataService, Customer} from '../../services/dataService';
import {handleAsyncError, showError} from '../../utils/errorHandler';
import {validateRequired, validateEmail, validatePhone, validateZip} from '../../utils/validation';
import {CustomerInfo} from './CustomerInformationStep';

const WIZARD_STEPS = [
  {id: 1, title: 'Select Customer'},
  {id: 2, title: 'System Information'},
  {id: 3, title: 'Project Information'},
  {id: 4, title: 'Permit Status'},
  {id: 5, title: 'Work Progress'},
  {id: 6, title: 'System Checks'},
  {id: 7, title: 'Inspection Setup'},
  {id: 8, title: 'Comments'},
];

interface CustomerSelectionStepProps {
  onBack: () => void;
  onCustomerSelected: (customerId: string, customerInfo?: CustomerInfo) => void;
  steps?: Step[];
  currentStep?: number;
  onStepSelect?: (index: number) => void;
  /** When provided, parent controls create form visibility (e.g. for header button) */
  showCreateForm?: boolean;
  setShowCreateForm?: (show: boolean) => void;
}

/**
 * Step 0 - Select or Create Customer (for new installations without existing customer)
 */
export function CustomerSelectionStep({
  onBack,
  onCustomerSelected,
  steps = WIZARD_STEPS,
  currentStep = 0,
  onStepSelect,
  showCreateForm: controlledShowCreate,
  setShowCreateForm: controlledSetShowCreate,
}: CustomerSelectionStepProps) {
  const headerHeight = useHeaderHeight();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalShowCreate, setInternalShowCreate] = useState(false);
  const showCreateForm = controlledShowCreate ?? internalShowCreate;
  const setShowCreateForm = controlledSetShowCreate ?? setInternalShowCreate;
  const [createData, setCreateData] = useState<CustomerInfo>({
    businessName: '',
    address: '',
    suite: '',
    city: '',
    state: '',
    zipCode: '',
    telephone: '',
    storeNo: '',
    fax: '',
    email: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
  });

  const loadCustomers = useCallback(async () => {
    try {
      const list = await dataService.getCustomers();
      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const searchLower = search.toLowerCase().trim();
  const searchDigits = search.replace(/\D/g, '');
  const filteredCustomers = customers.filter(c => {
    if (!searchLower && !searchDigits) return true;
    const matches = (s: string | undefined) =>
      s != null && s.toLowerCase().includes(searchLower);
    const matchesDigits = (s: string | undefined) =>
      searchDigits.length > 0 && s != null && s.replace(/\D/g, '').includes(searchDigits);
    return (
      matches(c.business_name) ||
      matches(c.customer_name) ||
      matches(c.address) ||
      matches(c.suite) ||
      matches(c.city) ||
      matches(c.state) ||
      matches(c.zip) ||
      matches(c.email) ||
      matches(c.contact_person_name) ||
      matches(c.contact_person_phone) ||
      matches(c.contact_person_email) ||
      matches(c.system_type) ||
      matchesDigits(c.phone) ||
      matchesDigits(c.contact_person_phone)
    );
  });

  const handleSelectCustomer = (customer: Customer) => {
    const customerInfo: CustomerInfo = {
      businessName: customer.business_name ?? '',
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
    onCustomerSelected(customer.id, customerInfo);
  };

  const handleCreateCustomer = async () => {
    const check = validateRequired(createData.businessName ?? '', 'Business name');
    if (!check.valid) {
      showError('Validation', check.message ?? 'Business name is required.');
      return;
    }
    const emailCheck = validateEmail(createData.email ?? '');
    if (!emailCheck.valid) {
      showError('Validation', emailCheck.message ?? 'Invalid email');
      return;
    }
    const phoneCheck = validatePhone(createData.telephone ?? '');
    if (!phoneCheck.valid) {
      showError('Validation', phoneCheck.message ?? 'Invalid phone');
      return;
    }
    const zipCheck = validateZip(createData.zipCode ?? '');
    if (!zipCheck.valid) {
      showError('Validation', zipCheck.message ?? 'Invalid zip');
      return;
    }
    try {
      const customer = await dataService.createCustomer({
        business_name: createData.businessName,
        customer_name: createData.businessName,
        address: createData.address,
        suite: createData.suite || undefined,
        city: createData.city,
        state: createData.state,
        zip: createData.zipCode,
        phone: createData.telephone,
        email: createData.email,
        contact_person_name: createData.contactPersonName || undefined,
        contact_person_phone: createData.contactPersonPhone || undefined,
        contact_person_email: createData.contactPersonEmail || undefined,
      });
      onCustomerSelected(customer.id, createData);
    } catch (e) {
      handleAsyncError(e, 'Create Customer Failed', 'Could not create the customer. Please try again.');
    }
  };

  if (showCreateForm) {
    return (
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
        </View>
        <KeyboardAwareFormScroll
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          nestedScrollEnabled>
          <Text style={styles.title}>Create Customer</Text>
          <Text style={styles.subtitle}>Enter customer details to continue</Text>
          <TouchableOpacity
            onPress={() => setShowCreateForm(false)}
            style={styles.searchLink}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          >
            <Text style={styles.searchLinkText}>Already have this customer? Search</Text>
          </TouchableOpacity>
          <CustomerCreateForm data={createData} onChange={setCreateData} />
          <View style={styles.buttons}>
            <AppButton
              title="Back"
              onPress={() => setShowCreateForm(false)}
              variant="outline"
              style={styles.btn}
            />
            <AppButton title="Create & Continue" onPress={handleCreateCustomer} style={styles.btn} />
          </View>
        </KeyboardAwareFormScroll>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <StepProgress steps={steps} currentStep={currentStep} onStepPress={onStepSelect} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}>
      <View style={styles.content}>
        <Text style={styles.title}>Select Customer</Text>
        <Text style={styles.subtitle}>Search for an existing customer or create a new one</Text>
        <TextInput
          style={styles.search}
          placeholder="Search by name, phone, or address..."
          placeholderTextColor={colors.gray}
          value={search}
          onChangeText={setSearch}
        />
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : (
          <>
            <FlatList
              data={filteredCustomers}
              keyExtractor={c => c.id}
              style={styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No customers found</Text>
                  <Text style={styles.emptyHint}>Create a new customer to continue</Text>
                </View>
              }
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelectCustomer(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.itemTitle}>{item.business_name}</Text>
                  <Text style={styles.itemSubtitle}>{item.customer_name ?? item.business_name}</Text>
                  {item.address && item.address.length > 0 && (
                    <Text style={styles.itemMeta}>{item.address}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function CustomerCreateForm({
  data,
  onChange,
}: {
  data: CustomerInfo;
  onChange: (d: CustomerInfo) => void;
}) {
  return (
    <>
      <FormInput
        label="Business Name"
        placeholder="Required"
        value={data.businessName}
        onChangeText={v => onChange({...data, businessName: v})}
      />
      <AddressAutocompleteInput
        label="Address"
        value={data.address}
        onChange={v => onChange({...data, address: v})}
        onAddressSelect={r => onChange({...data, address: r.address, suite: r.suite ?? '', city: r.city, state: r.state, zipCode: r.zipCode})}
      />
      <FormInput
        label="Suite (optional)"
        placeholder="e.g. Suite 100, Unit C"
        value={data.suite}
        onChangeText={v => onChange({...data, suite: v})}
      />
      <FormInput label="City" placeholder="Enter city" value={data.city} onChangeText={v => onChange({...data, city: v})} />
      <FormPicker
        label="State"
        value={data.state}
        options={US_STATES}
        onSelect={v => onChange({...data, state: v})}
        placeholder="Select state"
      />
      <FormInput
        label="Zip Code"
        placeholder="Zip"
        value={data.zipCode}
        onChangeText={v => onChange({...data, zipCode: v})}
        keyboardType="numeric"
      />
      <FormInput
        label="Phone"
        placeholder="Phone"
        value={data.telephone}
        onChangeText={v => onChange({...data, telephone: v})}
        keyboardType="phone-pad"
      />
      <FormInput
        label="Email"
        placeholder="Email"
        value={data.email}
        onChangeText={v => onChange({...data, email: v})}
        keyboardType="email-address"
      />
      <FormInput
        label="Contact Person Name"
        placeholder="Optional"
        value={data.contactPersonName}
        onChangeText={v => onChange({...data, contactPersonName: v})}
      />
      <FormInput
        label="Contact Phone"
        placeholder="Optional"
        value={data.contactPersonPhone}
        onChangeText={v => onChange({...data, contactPersonPhone: v})}
        keyboardType="phone-pad"
      />
      <FormInput
        label="Contact Email"
        placeholder="Optional"
        value={data.contactPersonEmail}
        onChangeText={v => onChange({...data, contactPersonEmail: v})}
        keyboardType="email-address"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  keyboardFlex: {
    flex: 1,
    minWidth: 0,
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
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 8,
  },
  searchLink: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  searchLinkText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '500',
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 16,
  },
  list: {
    flex: 1,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 48,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 8,
  },
  item: {
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.gray,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
  },
});
