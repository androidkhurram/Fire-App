import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';
import {dataService, Customer} from '../services/dataService';

/**
 * Customers List - Browse/search customers
 */
interface CustomersListScreenProps {
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomersListScreen({
  onSelectCustomer,
}: CustomersListScreenProps) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const list = await dataService.getCustomers();
      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load on mount and when screen comes into focus (e.g. after editing a customer)
  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers]),
  );

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

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search by name, address, phone, email..."
        placeholderTextColor={colors.gray}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelectCustomer(item)}
            activeOpacity={0.7}>
            <Text style={styles.itemTitle}>{item.business_name}</Text>
            <Text style={styles.itemSubtitle}>{item.customer_name ?? item.business_name}</Text>
            {(item.address || item.suite) && (
              <Text style={styles.itemMeta}>
                {[item.address, item.suite].filter(Boolean).join(', ')}
              </Text>
            )}
            {item.next_service_date && (
              <Text style={styles.itemMeta}>
                Next service: {item.next_service_date}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
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
  empty: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
  },
});
