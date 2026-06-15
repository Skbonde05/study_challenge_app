import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * Optimized stat card component with performance memoization
 */
const StatCard = ({ iconName, colors, value, label, theme }) => {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <LinearGradient
        colors={colors}
        style={styles.statIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name={iconName} size={24} color="#FFF" />
      </LinearGradient>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    padding: 16,
    borderRadius: 16,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default memo(StatCard);
