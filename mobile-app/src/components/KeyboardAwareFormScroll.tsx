import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * Scrollable form body with iOS keyboard avoidance (accounts for stack header height).
 * Use instead of a bare ScrollView on screens with text fields.
 */
export function KeyboardAwareFormScroll({
  children,
  style,
  contentContainerStyle,
  ...scrollProps
}: ScrollViewProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView
        {...scrollProps}
        style={style}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={scrollProps.keyboardDismissMode ?? 'interactive'}
        showsVerticalScrollIndicator={scrollProps.showsVerticalScrollIndicator ?? true}
        contentContainerStyle={[
          {paddingBottom: Math.max(insets.bottom, 12) + 28, flexGrow: 1},
          contentContainerStyle,
        ]}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
});
