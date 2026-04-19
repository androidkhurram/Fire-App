import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {colors} from './src/theme/colors';

/**
 * FireApp - iPad-optimized React Native app
 * Top safe area applied here so the native stack header clears the status bar / multitasking
 * chrome (nested SafeAreaProvider inside native-stack can report top inset 0 on some iPad layouts).
 */
export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top', 'left', 'right']}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
