import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';
import {dataService, type InvoiceListRow} from '../services/dataService';
import {getDisplayInvoiceNumber} from '../utils/invoiceDisplay';

type PaymentFilter = 'all' | 'paid' | 'pending' | 'overdue';
type ServiceFilter = 'all' | 'installation' | 'inspection' | 'maintenance';

interface InvoicesListScreenProps {
  /** When set (e.g. from customer details), only invoices for this customer are listed. */
  filterCustomerId?: string;
  filterCustomerLabel?: string;
  onSelectInvoice: (invoiceId: string) => void;
}

const PAYMENT_OPTIONS: Array<{id: PaymentFilter; label: string}> = [
  {id: 'all', label: 'All'},
  {id: 'paid', label: 'Paid'},
  {id: 'pending', label: 'Pending'},
  {id: 'overdue', label: 'Overdue'},
];

const SERVICE_OPTIONS: Array<{id: ServiceFilter; label: string}> = [
  {id: 'all', label: 'All services'},
  {id: 'installation', label: 'Installation'},
  {id: 'inspection', label: 'Inspection'},
  {id: 'maintenance', label: 'Maintenance'},
];

export function InvoicesListScreen({
  filterCustomerId,
  filterCustomerLabel,
  onSelectInvoice,
}: InvoicesListScreenProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [rows, setRows] = useState<InvoiceListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const list = await dataService.getInvoices();
      setRows(list);
    } catch (e) {
      if (__DEV__) console.warn('getInvoices failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices]),
  );

  const searchLower = search.toLowerCase().trim();
  const searchCompact = search.replace(/\s/g, '').toUpperCase();

  const filtered = useMemo(() => {
    return rows.filter(inv => {
      if (filterCustomerId && inv.customer_id !== filterCustomerId) return false;
      if (paymentFilter !== 'all' && (inv.payment_status ?? 'pending') !== paymentFilter) return false;
      if (serviceFilter !== 'all' && (inv.service_type ?? 'inspection') !== serviceFilter) return false;
      if (!searchLower && !searchCompact) return true;
      const invNo = getDisplayInvoiceNumber(inv);
      const totalStr = inv.total.toFixed(2);
      const cust = (inv.customer_business_name ?? '').toLowerCase();
      const idFrag = inv.id.replace(/-/g, '').toUpperCase();
      return (
        invNo.toLowerCase().includes(searchLower) ||
        (searchCompact.length > 0 && invNo.replace(/\s/g, '').includes(searchCompact)) ||
        idFrag.includes(searchCompact.replace(/^INV-?/i, '')) ||
        cust.includes(searchLower) ||
        (inv.invoice_date && inv.invoice_date.includes(searchLower)) ||
        totalStr.includes(searchLower)
      );
    });
  }, [rows, filterCustomerId, paymentFilter, serviceFilter, searchLower, searchCompact]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        {filterCustomerLabel ? (
          <Text style={styles.scopeHint}>Showing invoices for {filterCustomerLabel}</Text>
        ) : null}
        <TextInput
          style={styles.search}
          placeholder="Search by number, customer, date, total…"
          placeholderTextColor={colors.gray}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <View style={styles.chipRow}>
          {PAYMENT_OPTIONS.map(opt => {
            const selected = paymentFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setPaymentFilter(opt.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.chipRow}>
          {SERVICE_OPTIONS.map(opt => {
            const selected = serviceFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setServiceFilter(opt.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{paddingBottom: 24 + insets.bottom}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {rows.length === 0 ? 'No invoices yet.' : 'No invoices match your filters.'}
            </Text>
          }
          renderItem={({item}) => {
            const status = item.payment_status ?? 'pending';
            const service = item.service_type ?? 'inspection';
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => onSelectInvoice(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.invoiceNo}>{getDisplayInvoiceNumber(item)}</Text>
                  <Text style={styles.statusBadge}>{status}</Text>
                </View>
                <Text style={styles.customerName} numberOfLines={1}>
                  {item.customer_business_name ?? 'Unknown customer'}
                </Text>
                <View style={styles.rowBottom}>
                  <Text style={styles.meta}>
                    {item.invoice_date} · {service}
                  </Text>
                  <Text style={styles.total}>${item.total.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeHint: {
    fontSize: 14,
    color: colors.gray,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.darkGray,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.darkGray,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  row: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.darkGray,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'capitalize',
  },
  customerName: {
    fontSize: 15,
    color: colors.gray,
    marginBottom: 8,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 13,
    color: colors.gray,
    textTransform: 'capitalize',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
    fontSize: 16,
    color: colors.gray,
  },
});
