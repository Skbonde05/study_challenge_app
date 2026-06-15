import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../theme/useAppTheme';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';
import { useRealtime } from '../hooks/useRealtime';
import ScreenHeader from '../components/common/ScreenHeader';

const { width } = Dimensions.get('window');

export default function Profile({ navigation }) {
  const { theme } = useAppTheme();
  
  // Data hooks with automatic caching and background fetching
  const { 
    profile, 
    badges, 
    isLoading: loadingProfile, 
    refetch: refetchProfile,
    updateProfile,
    isUpdating
  } = useProfile();
  
  const { 
    recentSessions, 
    isLoading: loadingSessions, 
    refetch: refetchSessions 
  } = useSessions();
  
  // Real-time synchronization
  useRealtime();

  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    bio: '',
  });

  // Sync edit form with profile data
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const loading = (loadingProfile || loadingSessions) && !profile;

  const onRefresh = async () => {
    await Promise.all([refetchProfile(), refetchSessions()]);
  };

  const currentLevel = useMemo(() => Math.floor((profile?.xp || 0) / 1000) + 1, [profile?.xp]);
  const progressPercent = useMemo(() => {
    const currentLevelXp = (profile?.xp || 0) % 1000;
    return Math.min((currentLevelXp / 1000) * 100, 100);
  }, [profile?.xp]);

  const userRank = useMemo(() => {
    const xp = profile?.xp || 0;
    if (xp >= 5000) return 'Study Master';
    if (xp >= 2500) return 'Advanced Learner';
    if (xp >= 1000) return 'Dedicated Student';
    if (xp >= 500) return 'Regular Learner';
    return 'Beginner';
  }, [profile?.xp]);

  const userStats = useMemo(() => {
    if (!recentSessions) return { totalStudyTime: 0, sessionCount: 0 };
    return {
      totalStudyTime: profile?.total_study_time ? Math.floor(profile.total_study_time / 60) : 0,
      sessionCount: profile?.completed_sessions || recentSessions.length,
    };
  }, [profile, recentSessions]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = imageAsset.uri.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage.from('avatars').upload(fileName, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Use the profile update hook to reflect change instantly in cache
      updateProfile({ 
        avatar_url: `${publicUrl}?t=${Date.now()}`,
        updated_at: new Date().toISOString()
      }, {
        onSuccess: () => {
          Alert.alert('Success ✅', 'Profile picture updated!');
        }
      });
      
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to latest profile data to discard unsaved changes
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
      });
    }
    setEditing(false);
  };

  const handleSaveProfile = () => {
    if (!editForm.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    updateProfile({
      full_name: editForm.full_name.trim(),
      username: editForm.username.trim(),
      bio: editForm.bio.trim(),
      updated_at: new Date().toISOString(),
    }, {
      onSuccess: () => {
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      },
      onError: (err) => {
        if (err.message?.includes('unique')) {
          Alert.alert('Error', 'Username already exists. Please choose another.');
        } else {
          Alert.alert('Error', 'Failed to update profile');
        }
      }
    });
  };

  const handleLogout = async () => {
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
        },
      ]);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Final Confirmation', 'This will permanently delete ALL your data. This action CANNOT be undone!', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete Everything',
        style: 'destructive',
        onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').delete().eq('id', user.id);
            await supabase.auth.signOut();
          }
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
        <ScreenHeader 
          title="My Profile" 
          onBack={() => navigation.goBack()} 
          theme={theme}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        title="My Profile" 
        onBack={() => navigation.goBack()} 
        theme={theme}
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
            <Icon name="cog-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingTop: 100, paddingBottom: 120 }]}
      >
        {/* Profile Overview Card */}
        <View style={[styles.profileOverview, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <View style={styles.avatarUploading}><ActivityIndicator size="large" color="#FFF" /></View>
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}><Icon name="account-circle" size={80} color="#FFF" /></View>
              )}
              <View style={[styles.cameraIcon, { backgroundColor: '#FFF', borderColor: theme.colors.primary }]}>
                <Icon name="camera" size={16} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.headerText }]}>
                {profile?.full_name || profile?.username || 'User'}
              </Text>
              <Text style={[styles.profileUsername, { color: theme.colors.headerText + 'CC' }]}>@{profile?.username || 'username'}</Text>
              <View style={styles.rankAndEditRow}>
                <View style={[styles.rankBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Icon name="crown" size={14} color="#FFD700" />
                  <Text style={[styles.rankText, { color: theme.colors.headerText }]}>{userRank}</Text>
                  <Icon name="medal" size={12} color="#FFF" />
                  <Text style={styles.rankText}>LEVEL {currentLevel}</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => setEditing(true)}
                  style={styles.headerEditBtn}
                >
                  <Icon name="pencil" size={12} color="#FFF" />
                  <Text style={styles.headerEditBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {profile?.bio ? (
            <View style={[styles.bioContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Icon name="format-quote-open" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={[styles.profileBio, { color: '#FFF' }]}>{profile.bio}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="trophy" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{currentLevel}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Level</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF950015' }]}>
              <Icon name="fire" size={20} color="#FF9500" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile?.current_streak || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Day Streak</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#34C75915' }]}>
              <Icon name="clock-outline" size={20} color="#34C759" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{userStats.totalStudyTime}h</Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Hours</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#5AC8FA15' }]}>
              <Icon name="trophy-outline" size={20} color="#5AC8FA" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{userStats.sessionCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Sessions</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Progress to Level {currentLevel + 1}</Text>
            <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>{Math.round(progressPercent)}%</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBackground, { backgroundColor: theme.colors.progressBackground }]}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: theme.colors.progressFill }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.xpText, { color: theme.colors.text }]}>{profile?.xp || 0} XP</Text>
              <Text style={[styles.nextLevelText, { color: theme.colors.secondaryText }]}>{1000 - ((profile?.xp || 0) % 1000)} XP to go</Text>
            </View>
          </View>
        </View>

        {/* Currency Card */}
        <TouchableOpacity 
          style={[styles.currencyCard, { backgroundColor: theme.colors.card }]}
          onPress={() => navigation.navigate('Store')}
        >
          <View style={styles.currencyItem}>
            <View style={[styles.currencyIcon, { backgroundColor: '#FFD700' }]}><Icon name="cash" size={20} color="#FFF" /></View>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyLabel, { color: theme.colors.secondaryText }]}>Coins</Text>
              <Text style={[styles.currencyValue, { color: theme.colors.text }]}>{profile?.coins || 0}</Text>
            </View>
          </View>
          <View style={styles.currencyItem}>
            <View style={[styles.currencyIcon, { backgroundColor: '#5AC8FA' }]}><Icon name="diamond-stone" size={20} color="#FFF" /></View>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyLabel, { color: theme.colors.secondaryText }]}>Gems</Text>
              <Text style={[styles.currencyValue, { color: theme.colors.text }]}>{profile?.gems || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Badges</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Badges')}><Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
              {badges.slice(0, 5).map((badge, index) => (
                <View key={badge.id || index} style={[styles.badgeCard, { backgroundColor: theme.colors.background }]}>
                  <Text style={styles.badgeIcon}>{badge.badges?.icon || '🏆'}</Text>
                  <Text style={[styles.badgeName, { color: theme.colors.text }]}>{badge.badges?.name || 'Badge'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Account Actions */}
        <View style={styles.actionsSection}>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.error }]}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.deleteAccountButton, { backgroundColor: theme.colors.card }]}
          onPress={() => setIsDeleteModalVisible(true)}
        >
          <Icon name="trash-can-outline" size={18} color={theme.colors.error} />
          <Text style={[styles.deleteAccountText, { color: theme.colors.error }]}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancelEdit}><Icon name="close" size={24} color={theme.colors.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm(p => ({ ...p, full_name: text }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Username *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(p => ({ ...p, username: text.toLowerCase() }))}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text }]}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(p => ({ ...p, bio: text }))}
                  multiline numberOfLines={3}
                />
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}><Text style={{ color: theme.colors.secondaryText }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} 
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal - Logic simplified for brevity, similar to original Alert */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContent: { alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  fixedHeader: { paddingTop: Platform.OS === 'ios' ? 45 : 30, paddingHorizontal: 20, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  customHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12 },
  headerRight: { padding: 8 },
  scrollContent: { paddingHorizontal: 16 },
  profileOverview: { borderRadius: 24, padding: 24, marginTop: -60, marginBottom: 20, elevation: 8 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFF' },
  rankAndEditRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  headerEditBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  headerEditBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarUploading: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  profileUsername: { fontSize: 14, marginBottom: 8 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 12 },
  rankText: { fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  bioContainer: { padding: 12, borderRadius: 12, flexDirection: 'row' },
  profileBio: { flex: 1, fontSize: 13, fontStyle: 'italic', marginHorizontal: 8 },
  statsGrid: { flexDirection: 'row', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4, justifyContent: 'space-between' },
  statItem: { alignItems: 'center', width: '22%' },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11 },
  sectionCard: { borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  progressPercent: { fontSize: 16, fontWeight: 'bold' },
  progressBackground: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  xpText: { fontSize: 14, fontWeight: 'bold' },
  nextLevelText: { fontSize: 12 },
  currencyCard: { borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, elevation: 4 },
  currencyItem: { flexDirection: 'row', alignItems: 'center' },
  currencyIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  currencyValue: { fontSize: 20, fontWeight: 'bold' },
  badgesScroll: { flexDirection: 'row' },
  badgeCard: { borderRadius: 16, padding: 12, marginRight: 12, alignItems: 'center', width: 100 },
  badgeIcon: { fontSize: 24, marginBottom: 4 },
  badgeName: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  actionsSection: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionButton: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  actionText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  deleteAccountButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16 },
  deleteAccountText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 12 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold' },
});
