import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';

interface ServiceCompleteScreenProps {
  /** e.g. installation saved */
  message?: string;
  onHome: () => void;
  /** Same as Dashboard — opens semi-annual inspection report flow */
  onReport: () => void;
}

export function ServiceCompleteScreen({
  message = 'Your installation has been saved.',
  onHome,
  onReport,
}: ServiceCompleteScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>All set</Text>
      <Text style={styles.subtitle}>{message}</Text>
      <View style={styles.buttons}>
        <AppButton title="Home" onPress={onHome} />
        <View style={styles.spacing} />
        <AppButton title="Report" onPress={onReport} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 32,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    width: '100%',
  },
  spacing: {
    height: 16,
  },
});
