import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';
import {dataService, Inspection} from '../services/dataService';

/**
 * Inspection History - List past inspections
 */
interface InspectionHistoryScreenProps {
  customerId?: string;
  onSelectInspection?: (inspection: Inspection) => void;
  onBack?: () => void;
}

export function InspectionHistoryScreen({
  customerId,
  onSelectInspection,
  onBack,
}: InspectionHistoryScreenProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInspections = useCallback(async () => {
    try {
      const list = await dataService.getInspections(customerId);
      setInspections(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const statusColor = (status?: string) => {
    switch (status) {
      case 'pass':
        return '#4CAF50';
      case 'fail':
        return '#F44336';
      case 'needs_repair':
        return '#FF9800';
      default:
        return colors.gray;
    }
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
      <Text style={styles.title}>Inspection History</Text>
      <FlatList
        data={inspections}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInspections(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No inspections found</Text>
          </View>
        }
        renderItem={({item}: {item: Inspection}) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelectInspection?.(item)}
            activeOpacity={0.7}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemDate}>{item.inspection_date}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusColor(item.inspection_status)},
                ]}>
                <Text style={styles.statusText}>
                  {(item.inspection_status ?? 'pass').replace('_', ' ')}
                </Text>
              </View>
            </View>
            {item.system_brand && (
              <Text style={styles.itemMeta}>System: {item.system_brand}</Text>
            )}
            {item.technician_name && (
              <Text style={styles.itemMeta}>Technician: {item.technician_name}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 24,
  },
  item: {
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemMeta: {
    fontSize: 14,
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
