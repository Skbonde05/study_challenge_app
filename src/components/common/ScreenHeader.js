import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Common Header component for consistent look across all pages
 */
const ScreenHeader = ({ title, showBack = true, onBack, rightElement, theme }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header, 
        { 
          paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10,
          backgroundColor: theme.colors.primary 
        }
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        
        <View style={styles.rightContainer}>
          {rightElement}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});

export default ScreenHeader;
