import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

/**
 * A beautiful, animated skeleton component for a smoother load experience
 */
export const SkeletonRect = ({ width, height, borderRadius = 8, style }) => {
  const { theme } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        styles.skeleton,
        { 
          width, 
          height, 
          borderRadius, 
          opacity, 
          backgroundColor: theme.colors.border 
        },
        style
      ]} 
    />
  );
};

export const SkeletonCircle = ({ size, style }) => (
  <SkeletonRect 
    width={size} 
    height={size} 
    borderRadius={size / 2} 
    style={style} 
  />
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
