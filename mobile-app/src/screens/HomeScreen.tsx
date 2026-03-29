import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';

/**
 * Home screen - iPad-optimized with responsive layout
 * Uses useWindowDimensions for tablet vs phone breakpoints
 */
export function HomeScreen(): React.JSX.Element {
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Text style={[styles.title, isTablet && styles.titleTablet]}>
        FireApp
      </Text>
      <Text style={styles.subtitle}>
        {isTablet ? 'iPad Optimized' : 'Mobile'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  containerTablet: {
    padding: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  titleTablet: {
    fontSize: 42,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#666',
  },
});
