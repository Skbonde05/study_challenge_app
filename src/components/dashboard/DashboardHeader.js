import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * Dashboard header component for the main screen
 */
const DashboardHeader = ({ navigation, theme, badgeCount = 0 }) => (
  <View style={styles.customHeader}>
    <View style={styles.headerLeft}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/streakify.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.titleContainer}>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>Streakify</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.headerText + '99' }]}>Study Tracker</Text>
      </View>
    </View>
    
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.notificationButton}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Icon name="bell-outline" size={24} color={theme.colors.headerText} />
        <View style={[styles.notificationBadge, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.notificationBadgeText}>{badgeCount}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => navigation.navigate('ProfileTab')}
      >
        <Icon name="account-circle" size={40} color={theme.colors.headerText} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 15,
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default memo(DashboardHeader);
