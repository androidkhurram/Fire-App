import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions, TouchableOpacity} from 'react-native';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';

interface DashboardScreenProps {
  onNewInstallation: () => void;
  onExistingCustomer: () => void;
  onCreateInvoice: () => void;
  onInvoices: () => void;
  onReport: () => void;
  onSignOut: () => void;
  canCreateInstallation?: boolean;
  canCreateInspection?: boolean;
  canCreateInvoice?: boolean;
}

/**
 * Dashboard - Main screen after login
 * New Installation | Existing Customer | Create Invoice | Sign Out
 */
export function DashboardScreen({
  onNewInstallation,
  onExistingCustomer,
  onCreateInvoice,
  onInvoices,
  onReport,
  onSignOut,
  canCreateInstallation = true,
  canCreateInspection = true,
  canCreateInvoice = true,
}: DashboardScreenProps) {
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;

  const buttons: Array<{title: string; onPress: () => void; show: boolean}> = [
    {title: 'New Installation', onPress: onNewInstallation, show: canCreateInstallation},
    {title: 'Existing Customer', onPress: onExistingCustomer, show: canCreateInspection},
    {title: 'Create Invoice', onPress: onCreateInvoice, show: canCreateInvoice},
    {title: 'Invoices', onPress: onInvoices, show: true},
    {title: 'Report', onPress: onReport, show: true},
  ].filter(b => b.show);

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View style={styles.column}>
        <View style={styles.buttonContainer}>
          {buttons.map((btn, i) => (
            <View key={btn.title} style={i > 0 ? styles.buttonSpacing : undefined}>
              <AppButton title={btn.title} onPress={btn.onPress} />
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.signOut} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 12,
  },
  containerTablet: {
    padding: 48,
    paddingTop: 16,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonSpacing: {
    marginTop: 16,
  },
  signOut: {
    alignSelf: 'center',
    padding: 12,
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 16,
    color: colors.gray,
    textDecorationLine: 'underline',
  },
});
