import React from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';

interface AccountSelectionScreenProps {
  onExistingAccount: () => void;
  onNewAccount: () => void;
}

/**
 * Account selection - Existing Account / New Account
 * From designer: new inspection.jpg
 */
export function AccountSelectionScreen({
  onExistingAccount,
  onNewAccount,
}: AccountSelectionScreenProps) {
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View style={styles.buttonContainer}>
        <AppButton title="Existing Account" onPress={onExistingAccount} />
        <View style={styles.buttonSpacing}>
          <AppButton title="New Account" onPress={onNewAccount} />
        </View>
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
});
