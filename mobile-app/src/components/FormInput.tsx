import React from 'react';
import {View, Text, TextInput, StyleSheet, TextInputProps} from 'react-native';
import {colors} from '../theme/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  halfWidth?: boolean;
}

export function FormInput({
  label,
  error,
  halfWidth,
  style,
  ...props
}: FormInputProps) {
  return (
    <View style={[styles.container, halfWidth && styles.halfWidth]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined, style]}
        placeholderTextColor={colors.gray}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flex: 1,
    minWidth: 0,
  },
  halfWidth: {
    flex: 0,
    width: '48%',
    maxWidth: '48%',
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.darkGray,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.primary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
});
