import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../components/common/ScreenHeader';
import { supabase } from '../services/supabase';
import { useAppTheme } from '../theme/useAppTheme';
import { useSettings } from '../hooks/useSettings';
import { useProfile } from '../hooks/useProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsItem = ({ icon, label, description, rightComponent, onPress, color, theme }) => (
  <TouchableOpacity 
    style={[styles.item, { backgroundColor: theme.colors.card }]} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.iconBox, { backgroundColor: (color || theme.colors.primary) + '15' }]}>
      <Icon name={icon} size={22} color={color || theme.colors.primary} />
    </View>
    <View style={styles.itemInfo}>
      <Text style={[styles.itemLabel, { color: theme.colors.text }]}>{label}</Text>
      {description && <Text style={[styles.itemDesc, { color: theme.colors.secondaryText }]} numberOfLines={1}>{description}</Text>}
    </View>
    {rightComponent || (onPress && <Icon name="chevron-right" size={20} color={theme.colors.border} />)}
  </TouchableOpacity>
);

const Settings = ({ navigation }) => {
  const { theme, setTheme } = useAppTheme();
  const { 
    settings, 
    updateSettings, 
    isUpdating, 
    sendFeedback, 
    isSubmittingFeedback 
  } = useSettings();
  const { profile } = useProfile();
  
  const [feedback, setFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const togglePreference = (key, value) => {
    const updated = { ...settings, [key]: value };
    updateSettings(updated);

    if (key === 'darkMode') {
      setTheme(value ? 'dark' : 'light');
    }
  };

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    
    sendFeedback(feedback.trim(), {
      onSuccess: () => {
        Alert.alert('Thank You!', 'Your feedback helps us improve Streakify. 🚀');
        setFeedback('');
        setShowFeedbackModal(false);
      },
      onError: () => {
        Alert.alert('Error', 'Failed to send feedback. Please try again.');
      }
    });
  };

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await supabase.auth.signOut();
        await AsyncStorage.clear();
      } catch (err) {
        console.error("Logout failed:", err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) performLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: performLogout
        }
      ]);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account', 
      'This will permanently delete ALL your progress, badges, and study history. This action cannot be undone!', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive', 
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('profiles').delete().eq('id', user.id);
              await supabase.auth.signOut();
              await AsyncStorage.clear();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              Alert.alert('Account Deleted', 'We are sorry to see you go.');
            }
          }
        }
      ]
    );
  };

  const sections = [
    {
      title: 'App Preferences',
      items: [
        { 
          icon: 'brightness-6', 
          label: 'Dark Mode', 
          description: 'Switch between light and dark theme',
          rightComponent: <Switch 
            value={settings.darkMode || false} 
            onValueChange={(v) => togglePreference('darkMode', v)} 
            trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
            thumbColor={Platform.OS === 'ios' ? undefined : (settings.darkMode ? theme.colors.primary : '#f4f3f4')}
          />
        },
        { 
          icon: 'bell-ring-outline', 
          label: 'Notifications', 
          description: 'Receive study reminders and updates',
          rightComponent: <Switch 
            value={settings.notifications ?? true} 
            onValueChange={(v) => togglePreference('notifications', v)} 
            trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
            thumbColor={Platform.OS === 'ios' ? undefined : (settings.notifications ? theme.colors.primary : '#f4f3f4')}
          />
        },
        { 
          icon: 'volume-high', 
          label: 'Sound Effects', 
          rightComponent: <Switch 
            value={settings.soundEffects ?? true} 
            onValueChange={(v) => togglePreference('soundEffects', v)} 
            trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
            thumbColor={Platform.OS === 'ios' ? undefined : (settings.soundEffects ? theme.colors.primary : '#f4f3f4')}
          />
        }
      ]
    },
    {
      title: 'Account & Support',
      items: [
        { icon: 'bug-outline', label: 'Report a Bug', onPress: () => setShowFeedbackModal(true) },
        { icon: 'help-circle-outline', label: 'Help & FAQ', onPress: () => Linking.openURL('https://streakify.app/help') },
        { icon: 'shield-check-outline', label: 'Privacy Policy', onPress: () => Linking.openURL('https://streakify.app/privacy') }
      ]
    },
    {
      title: 'Data & Privacy',
      items: [
        { icon: 'eye-outline', label: 'Visible on Leaderboard', rightComponent: <Switch value={settings.leaderboardVisibility ?? true} onValueChange={(v) => togglePreference('leaderboardVisibility', v)} /> },
        { icon: 'trash-can-outline', label: 'Delete Account', color: theme.colors.error, onPress: handleDeleteAccount }
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        title="Settings" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 120 }]} 
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
        nestedScrollEnabled={true}
      >
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <SettingsItem {...item} theme={theme} />
                  {idx < section.items.length - 1 && <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: theme.colors.error }]} 
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: theme.colors.secondaryText }]}>Streakify Professional Suite v1.5.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Styled Feedback Modal */}
      <Modal visible={showFeedbackModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Feedback or Bug Report</Text>
            <Text style={[styles.modalDesc, { color: theme.colors.secondaryText }]}>
              Help us build the best version of Streakify. We read every single message!
            </Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]} 
              placeholder="Tell us what you think..." 
              placeholderTextColor={theme.colors.secondaryText + '80'}
              multiline numberOfLines={4}
              value={feedback} onChangeText={setFeedback}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.canBtn} onPress={() => setShowFeedbackModal(false)}>
                <Text style={{ color: theme.colors.secondaryText, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subBtn, { backgroundColor: theme.colors.primary, opacity: feedback.trim() ? 1 : 0.6 }]} 
                onPress={handleSendFeedback}
                disabled={isSubmittingFeedback || !feedback.trim()}
              >
                {isSubmittingFeedback ? <ActivityIndicator color="#FFF" /> : <Text style={styles.subBtnText}>Submit Feedback</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 8, paddingBottom: 35 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerBack: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  scrollContent: { padding: 16, paddingTop: 10, paddingBottom: 80 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 16, marginBottom: 10, letterSpacing: 1.5 },
  sectionCard: { borderRadius: 28, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: 'transparent' },
  iconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemInfo: { flex: 1 },
  itemLabel: { fontWeight: '700', fontSize: 16 },
  itemDesc: { fontSize: 12, marginTop: 3, opacity: 0.8 },
  divider: { height: 1, marginHorizontal: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, borderRadius: 24, borderWidth: 2, marginTop: 10, marginBottom: 10 },
  logoutText: { fontWeight: 'bold', fontSize: 17 },
  versionText: { textAlign: 'center', marginTop: 30, fontSize: 12, fontWeight: '600', opacity: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderRadius: 40, padding: 28, elevation: 20 },
  modalHandle: { width: 40, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2.5, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  input: { borderRadius: 20, padding: 18, minHeight: 140, textAlignVertical: 'top', borderWidth: 1.5, marginBottom: 25, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 14 },
  canBtn: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  subBtn: { flex: 2, padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  subBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default Settings;