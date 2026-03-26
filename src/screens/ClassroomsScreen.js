import React, { useState, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useClassrooms } from '../hooks/useClassrooms';
import { useRealtime } from '../hooks/useRealtime';
import ScreenHeader from '../components/common/ScreenHeader';

const { width } = Dimensions.get('window');

/**
 * Performance-optimized Classroom Card (Memoized)
 * Prevents unnecessary re-renders when list changes
 */
const ClassroomCard = memo(({ classroom, onJoin, theme }) => (
  <TouchableOpacity 
    style={[styles.card, { backgroundColor: theme.colors.card }]}
    onPress={() => onJoin?.(classroom)}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}>
        <Icon name="school" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.headerInfo}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {classroom.name}
        </Text>
        <Text style={[styles.cardMeta, { color: theme.colors.secondaryText }]}>
          By {classroom.creator?.username || 'Teacher'} • {classroom.member_count || 0} Members
        </Text>
      </View>
    </View>
    
    <Text style={[styles.description, { color: theme.colors.secondaryText }]} numberOfLines={2}>
      {classroom.description || 'No description available for this classroom.'}
    </Text>

    <View style={styles.cardFooter}>
      <View style={[styles.badge, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.badgeText, { color: theme.colors.secondaryText }]}>{classroom.is_public ? 'Public' : 'Private'}</Text>
      </View>
      {classroom.is_member ? (
        <View style={styles.joinedBox}>
          <Icon name="check-circle" size={16} color={theme.colors.success} />
          <Text style={[styles.joinedText, { color: theme.colors.success }]}>Joined</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.joinBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => onJoin?.(classroom)}
        >
          <Text style={styles.joinBtnText}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
));

const ClassroomsScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState('my-rooms');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // Custom hook for classrooms with automatic caching
  const { 
    userClassrooms, 
    exploreClassrooms, 
    isLoading, 
    isJoining, 
    joinByCode 
  } = useClassrooms();

  // Listen for real-time classroom messages and memberships
  useRealtime();

  const handleJoinByCode = () => {
    if (!inviteCode.trim()) return;
    joinByCode(inviteCode, {
      onSuccess: (classroom) => {
        Alert.alert('Joined!', `Successfully joined ${classroom.name}`);
        setShowJoinModal(false);
        setInviteCode('');
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Check your code and try again.');
      }
    });
  };

  const currentList = useMemo(() => 
    activeTab === 'my-rooms' ? userClassrooms : exploreClassrooms, 
  [activeTab, userClassrooms, exploreClassrooms]);

  if (isLoading && !currentList.length) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScreenHeader 
        title="Classroom Hub" 
        onBack={() => navigation.goBack()} 
        theme={theme}
        rightElement={
          <TouchableOpacity onPress={() => setShowJoinModal(true)}>
            <Icon name="plus-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <View style={[styles.tabSection, { backgroundColor: theme.colors.card }]}>
        {/* Tab Switcher */}
        <View style={[styles.tabBox, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'my-rooms' && styles.tabActive]} 
            onPress={() => setActiveTab('my-rooms')}
          >
            <Text style={[styles.tabText, activeTab === 'my-rooms' ? { color: theme.colors.primary } : { color: theme.colors.secondaryText }]}>My Rooms</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'explore' && styles.tabActive]} 
            onPress={() => setActiveTab('explore')}
          >
            <Text style={[styles.tabText, activeTab === 'explore' ? { color: theme.colors.primary } : { color: theme.colors.secondaryText }]}>Explore</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={currentList}
        renderItem={({ item }) => (
          <ClassroomCard 
            classroom={item} 
            theme={theme} 
            onJoin={(c) => c.is_member ? navigation.navigate('DashboardTab') : null} 
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="school-outline" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>No classrooms found in this category.</Text>
          </View>
        }
      />

      {/* Join Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Join Room</Text>
            <Text style={[styles.modalHint, { color: theme.colors.secondaryText }]}>Enter the 6-character code from your teacher.</Text>
            
            <TextInput 
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="ABCD12" placeholderTextColor={theme.colors.secondaryText}
              value={inviteCode} onChangeText={(t) => setInviteCode(t.toUpperCase())}
              maxLength={6} autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowJoinModal(false)}><Text style={{ color: theme.colors.secondaryText }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSave, { backgroundColor: theme.colors.primary }]} 
                onPress={handleJoinByCode}
                disabled={isJoining}
              >
                {isJoining ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveText}>Join Now</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabBox: { flexDirection: 'row', borderRadius: 20, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontWeight: 'bold', fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 24, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 17 },
  cardMeta: { fontSize: 12, marginTop: 2 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  joinBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  joinedBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  joinedText: { fontWeight: 'bold', fontSize: 13 },
  emptyBox: { alignItems: 'center', marginTop: 100, padding: 40 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 15, opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, borderRadius: 32, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalHint: { fontSize: 14, marginBottom: 20 },
  input: { borderRadius: 12, padding: 16, fontSize: 18, borderWidth: 1, marginBottom: 20, textAlign: 'center', letterSpacing: 4, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 16, alignItems: 'center' },
  modalSave: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { color: '#FFF', fontWeight: 'bold' },
});

export default ClassroomsScreen;