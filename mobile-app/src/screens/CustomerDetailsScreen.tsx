import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {KeyboardAwareFormScroll} from '../components/KeyboardAwareFormScroll';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';
import {dataService, Customer} from '../services/dataService';

/**
 * Customer Details - View existing customer
 */
interface CustomerDetailsScreenProps {
  customerId: string;
  onEdit?: () => void;
  onNewInspection?: () => void;
  onNewMaintenance?: () => void;
  onNewInstallation?: () => void;
  onInspectionHistory?: () => void;
  onInvoices?: () => void;
  onBack?: () => void;
}

export function CustomerDetailsScreen({
  customerId,
  onEdit,
  onNewInspection,
  onNewMaintenance,
  onNewInstallation,
  onInspectionHistory,
  onInvoices,
  onBack,
}: CustomerDetailsScreenProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomer = useCallback(() => {
    setLoading(true);
    dataService.getCustomer(customerId).then(c => {
      setCustomer(c ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [customerId]);

  useFocusEffect(loadCustomer);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Customer not found</Text>
          {onBack && <AppButton title="Back" onPress={onBack} style={{marginTop: 16}} />}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAwareFormScroll style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{customer.business_name}</Text>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {customer.customer_name && (
            <Text style={styles.subtitle}>{customer.customer_name}</Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <InfoRow label="Address" value={[customer.address, customer.suite].filter(Boolean).join(', ') || undefined} />
          <InfoRow label="City" value={customer.city} />
          <InfoRow label="State" value={customer.state} />
          <InfoRow label="Zip" value={customer.zip} />
          <InfoRow label="Phone" value={customer.phone} />
          <InfoRow label="Email" value={customer.email} />
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <InfoRow label="System Type" value={customer.system_type} />
          <InfoRow label="Last Service" value={customer.last_service_date} />
          <InfoRow label="Next Service" value={customer.next_service_date} />
        </View>
        <View style={styles.actions}>
          {onNewInspection && (
            <AppButton title="New Inspection" onPress={onNewInspection} style={styles.btn} />
          )}
          {onNewMaintenance && (
            <AppButton title="New Maintenance" onPress={onNewMaintenance} style={styles.btn} />
          )}
          {onNewInstallation && (
            <AppButton title="New Installation" onPress={onNewInstallation} style={styles.btn} />
          )}
          {onInspectionHistory && (
            <AppButton title="View History" onPress={onInspectionHistory} style={styles.btn} />
          )}
          {onInvoices && (
            <AppButton title="Invoices" onPress={onInvoices} style={styles.btn} />
          )}
        </View>
      </KeyboardAwareFormScroll>
    </SafeAreaView>
  );
}

function InfoRow({label, value}: {label: string; value?: string}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.darkGray,
    flex: 1,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  editBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: colors.darkGray,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    minWidth: 140,
    flex: 1,
  },
});
