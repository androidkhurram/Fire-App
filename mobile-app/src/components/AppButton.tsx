import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {colors} from '../theme/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: object;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' && styles.buttonOutline,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.accent} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variant === 'outline' && styles.textOutline]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  textOutline: {
    color: colors.accent,
  },
});
