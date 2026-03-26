// src/screens/SplashScreen.js (ENHANCED PREMIUM VERSION)
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

const LOADING_MESSAGES = [
  "Preparing your learning environment...",
  "Sharpening your focus...",
  "Syncing your progress...",
  "Building your streak...",
  "Ready to achieve more...",
];

export default function SplashScreen({ navigation, onComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.5)).current;
  const logoPulseAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const msgFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start main entrance sequence
    Animated.sequence([
      // Logo & Container entrance
      Animated.parallel([
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Text and particles fade in
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Start continuous animations after entrance
      startPulsing();
    });

    // Rotate loading messages
    const msgInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(msgFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(msgFadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(msgFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 1200);

    // Transition sequence
    const runTransition = async () => {
      // Wait for animation feel (reduced for performance)
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      } catch (e) {
        console.error("Auth check failed in splash:", e);
      }

      // Smooth exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Option 1: Functional callback (preferred for App.js Root conditional rendering)
        if (onComplete) {
          onComplete(session);
          return;
        }

        // Option 2: Direct navigation (if used as a screen in a navigator)
        if (navigation) {
          if (session) {
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Login');
          }
        }
      });
    };

    runTransition();

    return () => {
      clearInterval(msgInterval);
    };
  }, []);

  const startPulsing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Interpolations

  const particleStyle = (x, y) => ({
    opacity: particleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.4],
    }),
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: particleAnim }
    ]
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Modern Animated Background Particles */}
        <Animated.View style={[styles.particle, { top: '15%', left: '10%', width: 120, height: 120 }, particleStyle(0, 0)]} />
        <Animated.View style={[styles.particle, { bottom: '20%', right: '10%', width: 80, height: 80, backgroundColor: '#38BDF8' }, particleStyle(0, 0)]} />
        <Animated.View style={[styles.particle, { top: '60%', left: '80%', width: 60, height: 60, backgroundColor: '#818CF8' }, particleStyle(0, 0)]} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  transform: [
                    { scale: logoScaleAnim },
                    { scale: logoPulseAnim }
                  ],
                },
              ]}
            >
              <View style={styles.logoGlow} />
              <LinearGradient
                colors={['#FFFFFF', '#F1F5F9']}
                style={styles.logoInner}
              >
                <Image
                  source={require('../../assets/streakify.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Text Section */}
          <Animated.View style={[styles.textSection, { opacity: textFadeAnim }]}>
            <Text style={styles.appName}>STREAKIFY</Text>
            <View style={styles.divider} />
            <Text style={styles.tagline}>Study Smarter • Achieve More</Text>
          </Animated.View>

          {/* Loading Section */}
          <View style={styles.loadingContainer}>
            <Animated.Text style={[styles.loadingMessage, { opacity: msgFadeAnim }]}>
              {LOADING_MESSAGES[loadingMsgIndex]}
            </Animated.Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: textFadeAnim }]}>
          <Text style={styles.footerText}>Version 1.0.0 • Made with ❤️ for Students</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 35,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 10px 30px rgba(56, 189, 248, 0.3)',
      }
    }),
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 50,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    zIndex: -1,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    marginVertical: 15,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    width: '70%',
    alignItems: 'center',
    marginTop: 20,
  },
  loadingMessage: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    height: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});