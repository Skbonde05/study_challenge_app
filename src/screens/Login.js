// src/screens/Login.js (COMPLETELY FIXED - SCROLLABLE VERSION)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../services/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const passwordInput = React.useRef(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        // Handle specific error cases
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (loginError.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Verification Required',
            'Please check your email to verify your account before logging in.',
            [{ text: 'OK', style: 'default' }]
          );
          setError('Please verify your email address');
        } else {
          setError('An error occurred. Please try again.');
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('Login successful');
        // Navigation is handled by App.js based on auth state
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Email Required',
        'Please enter your email address to reset your password',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'studyapp://reset-password',
        }
      );

      if (error) {
        Alert.alert('Error', 'Failed to send password reset email');
      } else {
        Alert.alert(
          'Check Your Email',
          'If an account exists with this email, password reset instructions have been sent.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      Alert.alert('Error', 'Failed to send password reset email');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const KeyboardWrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;

  return (
    <KeyboardWrapper
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { flex: 1 }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={true}
        bounces={true}
        nestedScrollEnabled={true}
      >
            <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Icon name="brain" size={60} color="#4A90E2" />
                </View>
                <Text style={styles.title}>Study Challenge</Text>
                <Text style={styles.subtitle}>Unlock your potential through focused learning</Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={20} color="#D32F2F" />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              {/* Login Form */}
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Welcome Back</Text>
                <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="you@example.com"
                      value={email}
                      onChangeText={setEmail}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!loading}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        passwordInput.current?.focus();
                      }}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={styles.forgotPasswordLabel}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInput}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      style={[styles.input, styles.passwordInput]}
                      secureTextEntry={secureTextEntry}
                      editable={!loading}
                      returnKeyType="go"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      onPress={toggleSecureEntry}
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Icon name="login" size={20} color="#FFF" style={styles.buttonIcon} />
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={handleSignUp} disabled={loading}>
                    <Text style={styles.signupHighlight}> Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By signing in, you agree to our{' '}
                  <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increased for better visibility of bottom elements
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10, // Reduced to move content up
  },
  header: {
    alignItems: 'center',
    marginTop: 0, // Reduced to move content up
    marginBottom: 20, // Reduced to move content up
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#4A90E210',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4A90E220',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  forgotPasswordLabel: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1D1D1F',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#8E8E93',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  signupText: {
    fontSize: 15,
    color: '#666',
  },
  signupHighlight: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    color: '#D32F2F',
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
});