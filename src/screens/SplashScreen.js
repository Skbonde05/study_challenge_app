// src/screens/SplashScreen.js (FIXED VERSION)
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.5)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations in sequence for better flow
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      // Text and particles
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Progress bar animation - FIXED: Using native driver with transform
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web', // Changed to true for native driver compatibility
      }),
    ]).start();

    // Check session after animations
    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Exit animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          if (!navigation) return; // Prevent crash if rendered outside navigator

          if (session) {
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Login');
          }
        });
      } catch (error) {
        console.error('Auth check error:', error);
        if (navigation) navigation.replace('Login');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // FIXED: Progress animation using transform instead of width
  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.8, 0], // Matches 80% width of container
  });

  // Particle animations
  const particle1Y = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });
  
  const particle2Y = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });
  
  const particle3X = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={['#1A237E', '#283593', '#3949AB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated Background Particles */}
        <Animated.View 
          style={[
            styles.particle, 
            styles.particle1,
            {
              opacity: particleAnim,
              transform: [{ translateY: particle1Y }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.particle, 
            styles.particle2,
            {
              opacity: particleAnim,
              transform: [{ translateY: particle2Y }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.particle, 
            styles.particle3,
            {
              opacity: particleAnim,
              transform: [{ translateX: particle3X }]
            }
          ]} 
        />

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo with elegant shadow */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScaleAnim }],
                },
              ]}
            >
              {/* Glow effect behind logo */}
              <View style={styles.logoGlow} />
              
              {/* Main logo */}
              <View style={styles.logoWrapper}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8F9FA']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={require('../../assets/streakify.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              
              {/* Logo border accent */}
              <View style={styles.logoBorderAccent} />
            </Animated.View>
          </View>

          {/* App Title Section */}
          <Animated.View 
            style={[
              styles.titleSection,
              { opacity: textFadeAnim }
            ]}
          >
            <Text style={styles.appName}>STREAKIFY</Text>
            <View style={styles.titleDivider} />
            <Text style={styles.tagline}>Study Smarter. Achieve More.</Text>
          </Animated.View>

          {/* Loading Section - FIXED: Progress bar using transform */}
          <View style={styles.loadingSection}>
            <Text style={styles.loadingText}>Preparing your learning environment...</Text>
            
            {/* Minimal Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View 
                  style={[
                    styles.progressBar, 
                    {
                      transform: [{ translateX: progressTranslateX }]
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Bottom Text */}
          <View style={styles.bottomSection}>
            <Text style={styles.bottomText}>Every minute builds your future</Text>
            <Text style={styles.versionText}>v1.0</Text>
          </View>
        </Animated.View>

        {/* Floating Study Icons */}
        <View style={styles.floatingIcons}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>📚</Text>
          </View>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🎯</Text>
          </View>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🏆</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A237E',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  // Particle styles
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  particle1: {
    width: 100,
    height: 100,
    top: '15%',
    left: '10%',
  },
  particle2: {
    width: 60,
    height: 60,
    bottom: '25%',
    right: '15%',
  },
  particle3: {
    width: 80,
    height: 80,
    top: '65%',
    left: '75%',
  },
  // Logo Section
  logoSection: {
    marginBottom: 40,
    position: 'relative',
  },
  logoContainer: {
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
      }
    }),
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  logoBorderAccent: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    top: -5,
    left: -5,
    zIndex: -1,
  },
  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleDivider: {
    width: 80,
    height: 3,
    backgroundColor: '#4FC3F7',
    borderRadius: 2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 1,
    textAlign: 'center',
  },
  // Loading Section - FIXED: Updated for transform animation
  loadingSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 60,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  progressContainer: {
    width: '80%',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    width: '100%', // Full width of the track
    backgroundColor: '#4FC3F7',
    borderRadius: 2,
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  bottomText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '400',
  },
  // Floating Icons
  floatingIcons: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    bottom: 100,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    fontSize: 24,
  },
});