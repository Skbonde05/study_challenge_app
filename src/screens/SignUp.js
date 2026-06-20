// src/screens/SignUp.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { supabase } from '../services/supabase';
import AppButton from '../components/AppButton';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

export default function SignUp({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          Alert.alert(
            'Account Exists',
            'This email is already registered. Please login instead.',
            [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }]
          );
        } else {
          Alert.alert('Signup Error', authError.message);
        }
        return;
      }

      if (authData?.user) {
        Alert.alert(
          'Success! 🎉',
          'Account created successfully!\n\nPlease check your email to verify your account.',
          [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const KeyboardWrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;

  return (
    <KeyboardWrapper
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { flex: 1 }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { minHeight: '100%', paddingBottom: 140 }]}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={true}
        bounces={true}
        nestedScrollEnabled={true}
      >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Icon name="arrow-left" size={24} color="#4A90E2" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Streakify today!</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  placeholder="John Doe"
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, errors.fullName && styles.inputError]}
                  editable={!loading}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  placeholder="johndoe"
                  value={username}
                  onChangeText={setUsername}
                  style={[styles.input, errors.username && styles.inputError]}
                  autoCapitalize="none"
                  editable={!loading}
                />
                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, errors.email && styles.inputError]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, errors.password && styles.inputError]}
                  secureTextEntry
                  editable={!loading}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  secureTextEntry
                  editable={!loading}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <AppButton
                title={loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleSignUp}
                disabled={loading}
                style={styles.signupButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={handleGoBack} disabled={loading}>
                  <Text style={styles.loginLink}> Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </ScrollView>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { paddingBottom: 140 },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  backText: { fontSize: 16, color: '#4A90E2', marginLeft: 8, fontWeight: '500' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#4A90E2', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFEBEE' },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
  signupButton: { marginTop: 8, marginBottom: 20, height: 52 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 14, color: '#666' },
  loginLink: { fontSize: 14, color: '#4A90E2', fontWeight: '600' },
});