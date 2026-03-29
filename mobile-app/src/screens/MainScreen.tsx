import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions, TouchableOpacity} from 'react-native';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';

interface MainScreenProps {
  onNewInstallation: () => void;
  onNewInspection: () => void;
  onCustomers?: () => void;
}

/**
 * Main dashboard - New Installation / New Inspection
 * From designer: Main.jpg
 * Added: Customers link (spec requirement)
 */
export function MainScreen({
  onNewInstallation,
  onNewInspection,
  onCustomers,
}: MainScreenProps) {
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View style={styles.buttonContainer}>
        <AppButton title="New Installation" onPress={onNewInstallation} />
        <View style={styles.buttonSpacing}>
          <AppButton title="New Inspection" onPress={onNewInspection} />
        </View>
        {onCustomers && (
          <TouchableOpacity style={styles.linkBtn} onPress={onCustomers}>
            <Text style={styles.linkText}>View Customers</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  containerTablet: {
    padding: 48,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
  },
  buttonSpacing: {
    marginTop: 16,
  },
  linkBtn: {
    marginTop: 24,
    padding: 12,
  },
  linkText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
});
