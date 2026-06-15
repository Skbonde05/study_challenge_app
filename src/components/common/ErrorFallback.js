import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';

/**
 * A beautiful full-screen fallback component for errors
 */
const ErrorFallback = ({ 
  error = 'Something went wrong', 
  resetError, 
  title = 'Oh No!', 
  icon = 'alert-circle-outline' 
}) => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '20' }]}>
          <Icon name={icon} size={64} color={theme.colors.error} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.colors.secondaryText }]}>
          {typeof error === 'string' ? error : (error?.message || 'We encountered an unexpected error.')}
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={resetError}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.textButton}
          onPress={() => resetError?.()} // or a nav.goBack() equivalent
        >
          <Text style={[styles.textButtonText, { color: theme.colors.secondaryText }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32 
  },
  iconContainer: { 
    padding: 24, 
    borderRadius: 40, 
    marginBottom: 24 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  message: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 40, 
    lineHeight: 24 
  },
  button: { 
    width: '100%', 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    elevation: 4 
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  textButton: { 
    marginTop: 20, 
    padding: 8 
  },
  textButtonText: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
});

export default ErrorFallback;
