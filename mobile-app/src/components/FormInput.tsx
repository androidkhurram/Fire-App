import React from 'react';
import {View, Text, TextInput, StyleSheet, TextInputProps} from 'react-native';
import {colors} from '../theme/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  halfWidth?: boolean;
  /** Non-editable display (e.g. name from account) */
  readOnly?: boolean;
}

export function FormInput({
  label,
  error,
  halfWidth,
  readOnly,
  style,
  editable,
  ...props
}: FormInputProps) {
  const resolvedEditable = readOnly ? false : editable;
  return (
    <View style={[styles.container, halfWidth && styles.halfWidth]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.gray}
        {...props}
        style={[
          styles.input,
          readOnly && styles.inputReadOnly,
          error ? styles.inputError : undefined,
          style,
        ]}
        editable={resolvedEditable}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    minWidth: 0,
    alignSelf: 'stretch',
    width: '100%',
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
  inputReadOnly: {
    backgroundColor: '#F5F5F5',
    color: colors.darkGray,
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
