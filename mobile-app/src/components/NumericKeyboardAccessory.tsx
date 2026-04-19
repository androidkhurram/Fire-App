import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  InputAccessoryView,
  Keyboard,
  Platform,
} from 'react-native';
import {colors} from '../theme/colors';

/**
 * iOS number pads have no "Done" key — attach via TextInput `inputAccessoryViewID={nativeID}`.
 */
export function NumericKeyboardAccessory({nativeID}: {nativeID: string}) {
  if (Platform.OS !== 'ios') {
    return null;
  }
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneWrap} hitSlop={12}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#E8E8E8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#A7A7A7',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneWrap: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  done: {
    fontSize: 17,
    color: colors.accent,
    fontWeight: '600',
  },
});
