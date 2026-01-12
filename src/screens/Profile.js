// src/screens/Profile.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled
import AppButton from '../components/AppButton';
import { calculateLevel, calculateProgress } from '../utils/xpLogic';
import { updateStreak } from '../utils/streakLogic';

export default function Profile({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    completedChallenges: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    bio: '',
  });

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
      });

      // Get stats
      const { data: studyStats } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id);

      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, is_completed')
        .eq('user_id', user.id);

      const totalMinutes = studyStats?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
      const completedChallenges = challenges?.filter(c => c.is_completed).length || 0;

      setStats({
        totalStudyTime: totalMinutes,
        completedChallenges,
        currentStreak: profileData.current_streak || 0,
        longestStreak: profileData.longest_streak || 0,
      });

      // Update streak
      await updateStreak(user.id);

    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle profile image upload (Temporarily simplified)
  const pickImage = async () => {
    Alert.alert('Feature Coming Soon', 'Image upload will be available in the next update!');
    
    // Temporarily disabled - Uncomment when expo-image-picker is installed
    /*
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        Alert.alert('Success', 'Image selected! Upload feature coming soon.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
    */
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        },
      ]
    );
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);

              if (error) throw error;

              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const currentLevel = calculateLevel(profile?.xp || 0);
  const progressPercent = calculateProgress(profile?.xp || 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with profile info */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={styles.profileHeader}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="account" size={60} color="#4A90E2" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {profile?.full_name || profile?.username || 'User'}
          </Text>
          <Text style={styles.profileUsername}>@{profile?.username || 'username'}</Text>
          
          {profile?.bio ? (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.addBioText}>+ Add a bio</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setEditing(true)}
          >
            <Icon name="pencil" size={20} color="#4A90E2" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
          <View style={styles.levelCard}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>LEVEL {currentLevel}</Text>
              <Text style={styles.levelXp}>{profile?.xp || 0} XP</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progressPercent)}% to Level {currentLevel + 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Study Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#FF9500', '#FF7A00']}
                style={styles.statIcon}
              >
                <Icon name="clock-outline" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.statValue}>
                {Math.floor(stats.totalStudyTime / 60)}h
              </Text>
              <Text style={styles.statLabel}>Total Study</Text>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={['#34C759', '#2AA24F']}
                style={styles.statIcon}
              >
                <Icon name="trophy" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.completedChallenges}</Text>
              <Text style={styles.statLabel}>Challenges</Text>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={['#FF3B30', '#E5352B']}
                style={styles.statIcon}
              >
                <Icon name="fire" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={['#5856D6', '#4A48C7']}
                style={styles.statIcon}
              >
                <Icon name="chart-line" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.achievementCard}>
              <View style={[styles.achievementIcon, { backgroundColor: '#FFD70020' }]}>
                <Icon name="star" size={32} color="#FFD700" />
              </View>
              <Text style={styles.achievementTitle}>First Step</Text>
              <Text style={styles.achievementDesc}>Complete 1 study session</Text>
            </View>
            <View style={styles.achievementCard}>
              <View style={[styles.achievementIcon, { backgroundColor: '#4A90E220' }]}>
                <Icon name="fire" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.achievementTitle}>Streak Starter</Text>
              <Text style={styles.achievementDesc}>3-day study streak</Text>
            </View>
            <View style={styles.achievementCard}>
              <View style={[styles.achievementIcon, { backgroundColor: '#34C75920' }]}>
                <Icon name="trophy" size={32} color="#34C759" />
              </View>
              <Text style={styles.achievementTitle}>Challenge Master</Text>
              <Text style={styles.achievementDesc}>Complete 5 challenges</Text>
            </View>
          </ScrollView>
        </View>

        {/* Settings & Actions */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <Icon name="bell-outline" size={24} color="#1D1D1F" />
              <Text style={styles.settingText}>Notifications</Text>
              <Icon name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Icon name="palette-outline" size={24} color="#1D1D1F" />
              <Text style={styles.settingText}>Appearance</Text>
              <Icon name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Icon name="help-circle-outline" size={24} color="#1D1D1F" />
              <Text style={styles.settingText}>Help & Support</Text>
              <Icon name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Icon name="shield-check-outline" size={24} color="#1D1D1F" />
              <Text style={styles.settingText}>Privacy Policy</Text>
              <Icon name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout & Delete */}
        <View style={styles.actionsSection}>
          <AppButton
            title="Logout"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editing}
        onRequestClose={() => setEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditing(false)}>
                <Icon name="close" size={24} color="#1D1D1F" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text.toLowerCase() }))}
                  placeholder="Enter username"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <AppButton
                title="Save Changes"
                onPress={handleSaveProfile}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Icon name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.confirmModalTitle}>Delete Account?</Text>
            <Text style={styles.confirmModalText}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  addBioText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  levelSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  levelCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  levelXp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    width: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  settingsList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
    marginLeft: 12,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginBottom: 12,
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1D1D1F',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
  },
  confirmModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmCancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmDeleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});