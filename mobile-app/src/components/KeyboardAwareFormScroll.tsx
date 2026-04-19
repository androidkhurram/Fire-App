import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * Scrollable form body: KeyboardAvoidingView + extra bottom padding when the keyboard is
 * open so focused fields can scroll above the keyboard (stack headers + iPad layouts).
 */
export function KeyboardAwareFormScroll({
  children,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  ...scrollProps
}: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const baseBottom = Math.max(insets.bottom, 12) + 28;
  const keyboardPad = keyboardHeight > 0 ? keyboardHeight + 72 : 0;
  const avoidingBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={avoidingBehavior}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <ScrollView
        {...scrollProps}
        style={[styles.flex, style]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={scrollProps.keyboardDismissMode ?? 'interactive'}
        showsVerticalScrollIndicator={scrollProps.showsVerticalScrollIndicator ?? true}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={[
          {
            paddingBottom: baseBottom + keyboardPad,
            flexGrow: 1,
            width: '100%',
          },
          contentContainerStyle,
        ]}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /** minWidth: 0 so this flex:1 sibling beside a sidebar can grow to full remaining width */
  flex: {flex: 1, minWidth: 0, alignSelf: 'stretch'},
});
