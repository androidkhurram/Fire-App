import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Share,
  Alert,
  Platform,
} from 'react-native';
import {KeyboardAwareFormScroll} from '../components/KeyboardAwareFormScroll';
import {FormInput} from '../components/FormInput';
import {DatePickerField} from '../components/DatePickerField';
import {AddressAutocompleteInput} from '../components/AddressAutocompleteInput';
import {FormPicker} from '../components/FormPicker';
import {US_STATES} from '../constants/formOptions';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';
import {
  dataService,
  type SemiAnnualReportItem,
  type SemiAnnualReportFormData,
  type Customer,
} from '../services/dataService';
import {useNavigation} from '@react-navigation/native';
import {handleAsyncError, showError} from '../utils/errorHandler';
import {generateSemiAnnualReportPdf} from '../services/semiAnnualReportService';
import {validateRequired, validateEmail, validatePhone, validateZip} from '../utils/validation';

interface SemiAnnualReportScreenProps {
  reportId?: string;
  onComplete?: (reportId: string) => void;
  onCancel?: () => void;
}

const REPORT_TYPES = [
  {value: 'annual' as const, label: 'Annual Inspection'},
  {value: 'semi_annual' as const, label: 'Semi-Annual Inspection'},
  {value: 'certified' as const, label: 'Certified Inspection'},
];

export function SemiAnnualReportScreen({
  reportId,
  onComplete,
  onCancel,
}: SemiAnnualReportScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<SemiAnnualReportItem[]>([]);
  const [data, setData] = useState<SemiAnnualReportFormData>({
    reportType: 'semi_annual',
    checklist: {},
    explanations: {},
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({title: 'Inspection Report', headerTitle: 'Inspection Report'});
  }, [navigation]);
  const [createFormData, setCreateFormData] = useState({
    businessName: '',
    address: '',
    suite: '',
    city: '',
    state: '',
    zipCode: '',
    telephone: '',
    email: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
  });

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const list = await dataService.getCustomers();
      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const list = await dataService.getSemiAnnualReportItems();
      if (!cancelled) setItems(list);
      if (reportId) {
        const report = await dataService.getSemiAnnualReport(reportId);
        if (!cancelled && report?.form_data) {
          setData(report.form_data);
          if (report.customer_id) setSelectedCustomerId(report.customer_id);
        }
      }
      if (!cancelled) setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  useEffect(() => {
    if (!showCreateCustomer) loadCustomers();
  }, [showCreateCustomer, loadCustomers]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    dataService.getSession().then(session => {
      if (cancelled || !session) return;
      const name = session.displayName?.trim() || session.email;
      setData(prev => ({...prev, inspectorName: name}));
    });
    return () => {
      cancelled = true;
    };
  }, [loading]);

  const searchLower = customerSearch.toLowerCase().trim();
  const searchDigits = customerSearch.replace(/\D/g, '');
  const showSearchResults = searchLower.length > 0 || searchDigits.length > 0;
  const filteredCustomers = showSearchResults
    ? customers.filter(c => {
    if (!searchLower && !searchDigits) return true;
    const matches = (s: string | undefined) =>
      s != null && s.toLowerCase().includes(searchLower);
    const matchesDigits = (s: string | undefined) =>
      searchDigits.length > 0 && s != null && String(s).replace(/\D/g, '').includes(searchDigits);
    return (
      matches(c.business_name) ||
      matches(c.customer_name) ||
      matches(c.contact_person_name) ||
      matches(c.address) ||
      matches(c.suite) ||
      matches(c.city) ||
      matches(c.state) ||
      matches(c.zip) ||
      matches(c.email) ||
      matches(c.system_type) ||
      matchesDigits(c.phone ?? '') ||
      matchesDigits(c.contact_person_phone ?? '')
    );
  })
    : [];

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    const addr2 = [customer.suite, customer.city, customer.state, customer.zip].filter(Boolean).join(', ');
    setData(prev => ({
      ...prev,
      customerName: customer.business_name ?? customer.customer_name ?? '',
      addressLine1: customer.address ?? '',
      addressLine2: addr2,
    }));
    setShowCreateCustomer(false);
  };

  const handleCreateCustomer = async () => {
    const check = validateRequired(createFormData.businessName ?? '', 'Business name');
    if (!check.valid) {
      showError('Validation', check.message ?? 'Business name is required.');
      return;
    }
    const emailCheck = validateEmail(createFormData.email ?? '');
    if (!emailCheck.valid) {
      showError('Validation', emailCheck.message ?? 'Invalid email');
      return;
    }
    const phoneCheck = validatePhone(createFormData.telephone ?? '');
    if (!phoneCheck.valid) {
      showError('Validation', phoneCheck.message ?? 'Invalid phone');
      return;
    }
    const zipCheck = validateZip(createFormData.zipCode ?? '');
    if (!zipCheck.valid) {
      showError('Validation', zipCheck.message ?? 'Invalid zip');
      return;
    }
    try {
      const customer = await dataService.createCustomer({
        business_name: createFormData.businessName,
        customer_name: createFormData.businessName,
        address: createFormData.address,
        suite: createFormData.suite || undefined,
        city: createFormData.city,
        state: createFormData.state,
        zip: createFormData.zipCode,
        phone: createFormData.telephone,
        email: createFormData.email,
        contact_person_name: createFormData.contactPersonName || undefined,
        contact_person_phone: createFormData.contactPersonPhone || undefined,
        contact_person_email: createFormData.contactPersonEmail || undefined,
      });
      const addr2 = [createFormData.suite, createFormData.city, createFormData.state, createFormData.zipCode].filter(Boolean).join(', ');
      setSelectedCustomerId(customer.id);
      setData(prev => ({
        ...prev,
        customerName: createFormData.businessName,
        addressLine1: createFormData.address,
        addressLine2: addr2,
      }));
      setCreateFormData({
        businessName: '',
        address: '',
        suite: '',
        city: '',
        state: '',
        zipCode: '',
        telephone: '',
        email: '',
        contactPersonName: '',
        contactPersonPhone: '',
        contactPersonEmail: '',
      });
      setShowCreateCustomer(false);
    } catch (e) {
      handleAsyncError(e, 'Create Customer Failed', 'Could not create the customer. Please try again.');
    }
  };

  const setCheck = (itemId: string, system: 'system1' | 'system2', value: 'yes' | 'no') => {
    setData(prev => {
      const prevCheck = prev.checklist?.[itemId] ?? {system1: 'yes', system2: 'yes'};
      const next = {...prevCheck, [system]: value};
      return {
        ...prev,
        checklist: {...prev.checklist, [itemId]: next},
      };
    });
  };

  const getSpecialFieldKey = (item: SemiAnnualReportItem): string | null => {
    if (item.special_field_type === 'psi') return 'item5_psi';
    if (item.special_field_type === 'lb') return 'item6_lb';
    if (item.special_field_type === 'old_links') return 'item12_oldLinksLeftWith';
    if (item.special_field_type === 'mfg_date') return 'item20_mfgOrHTDate';
    return null;
  };

  const handleSave = async () => {
    if (!data.customerName?.trim()) {
      showError('Validation', 'Customer name is required.');
      return;
    }
    if (!data.date?.trim()) {
      showError('Validation', 'Date is required.');
      return;
    }
    setSaving(true);
    try {
      let report;
      if (reportId) {
        report = await dataService.updateSemiAnnualReport(reportId, data, undefined, selectedCustomerId);
      } else {
        report = await dataService.createSemiAnnualReport(data, selectedCustomerId);
      }
      if (report) {
        const pdfResult = await generateSemiAnnualReportPdf(report.id, data, items);
        if (pdfResult) {
          await dataService.updateSemiAnnualReport(report.id, data, pdfResult.url);
          try {
            await Share.share(
              {
                url: pdfResult.fileUri,
                title: 'Inspection Report',
                message:
                  Platform.OS === 'ios'
                    ? 'Inspection Report'
                    : `Inspection Report ${report.id.slice(0, 8)}`,
              },
              {dialogTitle: 'Save & Share PDF'},
            );
          } catch (shareErr) {
            // User cancelled or share failed - report is saved, that's ok
          }
        } else {
          Alert.alert(
            'PDF Generation Failed',
            'Report saved, but PDF could not be generated. Try: 1) Rebuild the app (cd ios && pod install), 2) Run on a physical device, or 3) View and download the PDF from the admin portal.',
          );
        }
        onComplete?.(report.id);
      } else {
        showError('Save Failed', 'Could not save report.');
      }
    } catch (e) {
      handleAsyncError(e, 'Save Failed', 'Could not save report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
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
      <Text style={styles.title}>Inspection Report</Text>

      {/* Customer info - FIRST so user sees picker immediately */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        {showCreateCustomer ? (
          <>
            <TouchableOpacity
              onPress={() => setShowCreateCustomer(false)}
              style={styles.searchLink}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.searchLinkText}>← Search existing customer</Text>
            </TouchableOpacity>
            <FormInput
              label="Business Name"
              placeholder="Required"
              value={createFormData.businessName}
              onChangeText={v => setCreateFormData(prev => ({...prev, businessName: v}))}
            />
            <AddressAutocompleteInput
              label="Address"
              value={createFormData.address}
              onChange={v => setCreateFormData(prev => ({...prev, address: v}))}
              onAddressSelect={r =>
                setCreateFormData(prev => ({
                  ...prev,
                  address: r.address,
                  suite: r.suite ?? '',
                  city: r.city,
                  state: r.state,
                  zipCode: r.zipCode,
                }))
              }
            />
            <FormInput
              label="Suite"
              placeholder="Optional"
              value={createFormData.suite}
              onChangeText={v => setCreateFormData(prev => ({...prev, suite: v}))}
            />
            <FormInput
              label="City"
              placeholder=""
              value={createFormData.city}
              onChangeText={v => setCreateFormData(prev => ({...prev, city: v}))}
            />
            <FormPicker
              label="State"
              value={createFormData.state}
              options={US_STATES}
              onSelect={v => setCreateFormData(prev => ({...prev, state: v}))}
              placeholder="Select state"
            />
            <FormInput
              label="Zip Code"
              placeholder=""
              value={createFormData.zipCode}
              onChangeText={v => setCreateFormData(prev => ({...prev, zipCode: v}))}
              keyboardType="numeric"
            />
            <FormInput
              label="Phone"
              placeholder=""
              value={createFormData.telephone}
              onChangeText={v => setCreateFormData(prev => ({...prev, telephone: v}))}
              keyboardType="phone-pad"
            />
            <FormInput
              label="Email"
              placeholder=""
              value={createFormData.email}
              onChangeText={v => setCreateFormData(prev => ({...prev, email: v}))}
              keyboardType="email-address"
            />
            <AppButton title="Create & Use Customer" onPress={handleCreateCustomer} style={styles.createBtn} />
          </>
        ) : (
          <>
            <Text style={styles.searchHint}>
              Search by business name, contact person, phone, or address
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. ABC Restaurant, John Smith, 555-1234..."
              placeholderTextColor={colors.gray}
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
            {selectedCustomerId ? (
              <View style={styles.selectedRow}>
                <Text style={styles.selectedLabel}>Selected: {data.customerName ?? '—'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCustomerId(null);
                    setData(prev => ({...prev, customerName: '', addressLine1: '', addressLine2: ''}));
                  }}
                  style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : customersLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loadingText}>Loading customers...</Text>
              </View>
            ) : showSearchResults ? (
              <View style={styles.customerList}>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.slice(0, 8).map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.customerItem}
                      onPress={() => handleSelectCustomer(c)}
                      activeOpacity={0.7}>
                      <Text style={styles.customerItemTitle}>{c.business_name}</Text>
                      {(c.address || c.city) && (
                        <Text style={styles.customerItemMeta}>
                          {[c.address, c.city, c.state].filter(Boolean).join(', ')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.noCustomers}>
                      {customers.length === 0
                        ? 'No customers yet. Tap "Create new customer" below, or add customers from Dashboard → + New Customer first.'
                        : 'No matches for "' +
                          customerSearch +
                          '". Try a different search, or create new below.'}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => setShowCreateCustomer(true)}
              style={styles.searchLink}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.searchLinkText}>+ Create new customer</Text>
            </TouchableOpacity>
            <DatePickerField
              label="Date"
              value={data.date ?? ''}
              onChange={v => setData(prev => ({...prev, date: v}))}
            />
            <FormInput
              label="Address Line 1"
              placeholder=""
              value={data.addressLine1 ?? ''}
              onChangeText={v => setData(prev => ({...prev, addressLine1: v}))}
            />
            <FormInput
              label="Address Line 2"
              placeholder=""
              value={data.addressLine2 ?? ''}
              onChangeText={v => setData(prev => ({...prev, addressLine2: v}))}
            />
            <FormInput
              label="System #1"
              placeholder=""
              value={data.system1Label ?? ''}
              onChangeText={v => setData(prev => ({...prev, system1Label: v}))}
            />
            <FormInput
              label="System #2"
              placeholder=""
              value={data.system2Label ?? ''}
              onChangeText={v => setData(prev => ({...prev, system2Label: v}))}
            />
          </>
        )}
      </View>

      {/* Report type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Type</Text>
        <View style={styles.reportTypeRow}>
          {REPORT_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.reportTypeBtn,
                data.reportType === t.value && styles.reportTypeBtnActive,
              ]}
              onPress={() => setData(prev => ({...prev, reportType: t.value}))}>
              <Text
                style={[
                  styles.reportTypeText,
                  data.reportType === t.value && styles.reportTypeTextActive,
                ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Comments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comments</Text>
        <TextInput
          style={styles.commentsInput}
          placeholder="Enter comments..."
          placeholderTextColor={colors.gray}
          multiline
          numberOfLines={4}
          value={data.comments ?? ''}
          onChangeText={v => setData(prev => ({...prev, comments: v}))}
        />
      </View>

      {/* Certification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certification</Text>
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>This is certification of original installation?</Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              style={[styles.yesNoBtn, data.isCertificationOfOriginalInstallation && styles.yesNoActive]}
              onPress={() => setData(prev => ({...prev, isCertificationOfOriginalInstallation: true}))}>
              <Text style={[styles.yesNoText, data.isCertificationOfOriginalInstallation && styles.yesNoTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoBtn, data.isCertificationOfOriginalInstallation === false && styles.yesNoActive]}
              onPress={() => setData(prev => ({...prev, isCertificationOfOriginalInstallation: false}))}>
              <Text style={[styles.yesNoText, data.isCertificationOfOriginalInstallation === false && styles.yesNoTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>Copy was left with client?</Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              style={[styles.yesNoBtn, data.copyLeftWithClient && styles.yesNoActive]}
              onPress={() => setData(prev => ({...prev, copyLeftWithClient: true}))}>
              <Text style={[styles.yesNoText, data.copyLeftWithClient && styles.yesNoTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoBtn, data.copyLeftWithClient === false && styles.yesNoActive]}
              onPress={() => setData(prev => ({...prev, copyLeftWithClient: false}))}>
              <Text style={[styles.yesNoText, data.copyLeftWithClient === false && styles.yesNoTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection Checklist</Text>
        {items.map((item, idx) => {
          const check = data.checklist?.[item.id] ?? {system1: 'yes', system2: 'yes'};
          const specialKey = getSpecialFieldKey(item);
          return (
            <View key={item.id} style={styles.checkRow}>
              <Text style={styles.checkNum}>{idx + 1}.</Text>
              <View style={styles.checkContent}>
                <Text style={styles.checkDesc}>{item.description}</Text>
                <View style={styles.sysRow}>
                  <Text style={styles.sysLabel}>Sys 1:</Text>
                  <TouchableOpacity
                    style={[styles.ynBtn, check.system1 === 'yes' && styles.ynActive]}
                    onPress={() => setCheck(item.id, 'system1', 'yes')}>
                    <Text style={[styles.ynText, check.system1 === 'yes' && styles.ynTextActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ynBtn, check.system1 === 'no' && styles.ynActive]}
                    onPress={() => setCheck(item.id, 'system1', 'no')}>
                    <Text style={[styles.ynText, check.system1 === 'no' && styles.ynTextActive]}>No</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sysLabel, {marginLeft: 12}]}>Sys 2:</Text>
                  <TouchableOpacity
                    style={[styles.ynBtn, check.system2 === 'yes' && styles.ynActive]}
                    onPress={() => setCheck(item.id, 'system2', 'yes')}>
                    <Text style={[styles.ynText, check.system2 === 'yes' && styles.ynTextActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ynBtn, check.system2 === 'no' && styles.ynActive]}
                    onPress={() => setCheck(item.id, 'system2', 'no')}>
                    <Text style={[styles.ynText, check.system2 === 'no' && styles.ynTextActive]}>No</Text>
                  </TouchableOpacity>
                </View>
                {specialKey === 'item5_psi' && (
                  <View style={styles.specialRow}>
                    <Text style={styles.specialLabel}>System #1: </Text>
                    <TextInput
                      style={styles.specialInput}
                      placeholder="PSI"
                      placeholderTextColor={colors.gray}
                      value={data.item5_psi?.system1 ?? ''}
                      onChangeText={v =>
                        setData(prev => ({
                          ...prev,
                          item5_psi: {...prev.item5_psi, system1: v},
                        }))
                      }
                    />
                    <Text style={[styles.specialLabel, {marginLeft: 8}]}>#2: </Text>
                    <TextInput
                      style={styles.specialInput}
                      placeholder="PSI"
                      placeholderTextColor={colors.gray}
                      value={data.item5_psi?.system2 ?? ''}
                      onChangeText={v =>
                        setData(prev => ({
                          ...prev,
                          item5_psi: {...prev.item5_psi, system2: v},
                        }))
                      }
                    />
                  </View>
                )}
                {specialKey === 'item6_lb' && (
                  <View style={styles.specialRow}>
                    <Text style={styles.specialLabel}>System #1: </Text>
                    <TextInput
                      style={styles.specialInput}
                      placeholder="Lb"
                      placeholderTextColor={colors.gray}
                      value={data.item6_lb?.system1 ?? ''}
                      onChangeText={v =>
                        setData(prev => ({
                          ...prev,
                          item6_lb: {...prev.item6_lb, system1: v},
                        }))
                      }
                    />
                    <Text style={[styles.specialLabel, {marginLeft: 8}]}>#2: </Text>
                    <TextInput
                      style={styles.specialInput}
                      placeholder="Lb"
                      placeholderTextColor={colors.gray}
                      value={data.item6_lb?.system2 ?? ''}
                      onChangeText={v =>
                        setData(prev => ({
                          ...prev,
                          item6_lb: {...prev.item6_lb, system2: v},
                        }))
                      }
                    />
                  </View>
                )}
                {specialKey === 'item12_oldLinksLeftWith' && (
                  <View style={styles.specialRow}>
                    <Text style={styles.specialLabel}>Old Links Left With: </Text>
                    <TextInput
                      style={[styles.specialInput, {flex: 1}]}
                      placeholder=""
                      placeholderTextColor={colors.gray}
                      value={data.item12_oldLinksLeftWith ?? ''}
                      onChangeText={v =>
                        setData(prev => ({...prev, item12_oldLinksLeftWith: v}))
                      }
                    />
                  </View>
                )}
                {specialKey === 'item20_mfgOrHTDate' && (
                  <View style={styles.specialRow}>
                    <Text style={styles.specialLabel}>Mfg or H/T Date: </Text>
                    <TextInput
                      style={[styles.specialInput, {flex: 1}]}
                      placeholder=""
                      placeholderTextColor={colors.gray}
                      value={data.item20_mfgOrHTDate ?? ''}
                      onChangeText={v =>
                        setData(prev => ({...prev, item20_mfgOrHTDate: v}))
                      }
                    />
                  </View>
                )}
                <FormInput
                  label=""
                  placeholder="Explanations/Exceptions (optional)"
                  value={data.explanations?.[item.id] ?? ''}
                  onChangeText={v =>
                    setData(prev => ({
                      ...prev,
                      explanations: {...prev.explanations, [item.id]: v},
                    }))
                  }
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Acknowledgement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acknowledgement of Inspection</Text>
        <FormInput
          label="Inspector Name"
          placeholder="—"
          value={data.inspectorName?.trim() ? data.inspectorName : '—'}
          readOnly
        />
        <Text style={styles.readOnlyHint}>From your signed-in account</Text>
        <FormInput
          label="Texas License Number (FEL-...)"
          placeholder="FEL-"
          value={data.texasLicenseNumber ?? ''}
          onChangeText={v => setData(prev => ({...prev, texasLicenseNumber: v}))}
        />
        <FormInput
          label="Inspector Signature (type name)"
          placeholder=""
          value={data.inspectorSignature ?? ''}
          onChangeText={v => setData(prev => ({...prev, inspectorSignature: v}))}
        />
        <DatePickerField
          label="Inspection Date"
          value={data.inspectionDate ?? ''}
          onChange={v => setData(prev => ({...prev, inspectionDate: v}))}
        />
        <FormInput
          label="Licensed Company"
          placeholder=""
          value={data.licensedCompany ?? ''}
          onChangeText={v => setData(prev => ({...prev, licensedCompany: v}))}
        />
        <FormInput
          label="Texas Certificate of Registration Number"
          placeholder=""
          value={data.texasCertificateNumber ?? ''}
          onChangeText={v => setData(prev => ({...prev, texasCertificateNumber: v}))}
        />
        <FormInput
          label="Customer Name (Acknowledgement)"
          placeholder=""
          value={data.customerAcknowledgementName ?? ''}
          onChangeText={v => setData(prev => ({...prev, customerAcknowledgementName: v}))}
        />
        <FormInput
          label="Customer Acknowledgement Signature (type name)"
          placeholder=""
          value={data.customerAcknowledgementSignature ?? ''}
          onChangeText={v => setData(prev => ({...prev, customerAcknowledgementSignature: v}))}
        />
      </View>

      <View style={styles.buttons}>
        {onCancel && (
          <AppButton title="Cancel" onPress={onCancel} variant="outline" style={styles.btn} />
        )}
        <AppButton
          title={saving ? 'Saving...' : 'Save & Generate PDF'}
          onPress={handleSave}
          disabled={saving}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 12,
  },
  readOnlyHint: {
    fontSize: 12,
    color: colors.gray,
    marginTop: -8,
    marginBottom: 12,
  },
  reportTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportTypeBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  reportTypeText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  reportTypeTextActive: {
    color: colors.white,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.darkGray,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  certLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.darkGray,
    marginRight: 12,
    minWidth: 200,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yesNoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yesNoActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  yesNoText: {
    fontSize: 12,
    color: colors.gray,
  },
  yesNoTextActive: {
    color: colors.white,
  },
  checkRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  checkNum: {
    width: 24,
    fontSize: 14,
    color: colors.gray,
  },
  checkContent: {
    flex: 1,
    minWidth: 0,
  },
  checkDesc: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 6,
  },
  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  sysLabel: {
    fontSize: 12,
    color: colors.gray,
  },
  ynBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ynActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ynText: {
    fontSize: 12,
    color: colors.gray,
  },
  ynTextActive: {
    color: colors.white,
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  specialLabel: {
    fontSize: 12,
    color: colors.gray,
  },
  specialInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: colors.darkGray,
    minWidth: 60,
  },
  searchLink: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  searchLinkText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '500',
  },
  searchHint: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 12,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    flex: 1,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeBtnText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '500',
  },
  customerLoader: {
    marginVertical: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray,
  },
  emptyState: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  customerList: {
    marginBottom: 12,
  },
  customerItem: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
  },
  customerItemMeta: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
  },
  noCustomers: {
    fontSize: 14,
    color: colors.gray,
    padding: 16,
    textAlign: 'center',
  },
  createBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
  },
});
