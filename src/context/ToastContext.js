import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setToast({ visible: true, message, type });
    
    // Animate in
    Animated.spring(translateY, {
      toValue: Platform.OS === 'ios' ? 60 : 40,
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start();

    timeoutRef.current = setTimeout(() => {
      // Animate out
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
      });
    }, duration);
  }, [translateY]);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast(prev => ({ ...prev, visible: false }));
    });
  }, [translateY]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { transform: [{ translateY }] },
            styles[toast.type]
          ]}
        >
          <Icon 
            name={toast.type === 'error' ? 'alert-circle' : toast.type === 'success' ? 'check-circle' : 'info'} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  info: { backgroundColor: '#4A90E2' },
  success: { backgroundColor: '#34C759' },
  error: { backgroundColor: '#FF3B30' },
  warning: { backgroundColor: '#FF9500' },
});
