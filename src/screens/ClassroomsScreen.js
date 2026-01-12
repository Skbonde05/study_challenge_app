// src/screens/ClassroomsScreen.js
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
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ClassroomsScreen = ({ navigation }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [userClassrooms, setUserClassrooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      
      // Mock data for now to avoid database errors
      const mockUserClassrooms = [
        {
          id: '1',
          name: 'Math Study Group',
          description: 'Group for studying advanced mathematics',
          invite_code: 'MATH123',
          is_public: true,
          created_by: { username: 'JohnDoe', avatar_url: null },
          created_at: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          name: 'Computer Science',
          description: 'Programming and algorithms study group',
          invite_code: 'CS4567',
          is_public: false,
          created_by: { username: 'JaneSmith', avatar_url: null },
          created_at: '2024-01-10T14:20:00Z',
        },
      ];

      const mockPublicClassrooms = [
        {
          id: '3',
          name: 'Physics Study',
          description: 'Quantum mechanics and relativity',
          invite_code: 'PHY789',
          is_public: true,
          created_by: { username: 'AlbertP', avatar_url: null },
          created_at: '2024-01-12T09:15:00Z',
        },
        {
          id: '4',
          name: 'History Club',
          description: 'World history discussions and study',
          invite_code: 'HIST321',
          is_public: true,
          created_by: { username: 'HistoryBuff', avatar_url: null },
          created_at: '2024-01-08T16:45:00Z',
        },
        {
          id: '5',
          name: 'Language Learning',
          description: 'Practice foreign languages together',
          invite_code: 'LANG654',
          is_public: true,
          created_by: { username: 'Polyglot', avatar_url: null },
          created_at: '2024-01-05T11:00:00Z',
        },
      ];

      setUserClassrooms(mockUserClassrooms);
      setClassrooms(mockPublicClassrooms);
      
    } catch (error) {
      console.error('Error loading classrooms:', error);
      Alert.alert('Error', 'Failed to load classrooms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createClassroom = async () => {
    try {
      if (!newClassroom.name.trim()) {
        Alert.alert('Error', 'Please enter a classroom name');
        return;
      }

      setCreating(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const inviteCode = generateInviteCode();
      
      // Create mock classroom object
      const newClassroomObj = {
        id: Date.now().toString(),
        name: newClassroom.name.trim(),
        description: newClassroom.description.trim(),
        invite_code: inviteCode,
        is_public: newClassroom.isPublic,
        created_by: { username: 'You', avatar_url: null },
        created_at: new Date().toISOString(),
      };

      // Add to user classrooms
      setUserClassrooms(prev => [newClassroomObj, ...prev]);
      
      // If public, also add to public classrooms
      if (newClassroom.isPublic) {
        setClassrooms(prev => [newClassroomObj, ...prev]);
      }

      Alert.alert(
        'Classroom Created!',
        `Invite Code: ${inviteCode}\n\nShare this code with others to join your classroom.`,
        [{ text: 'OK' }]
      );

      setShowCreateModal(false);
      setNewClassroom({ name: '', description: '', isPublic: true });
      
    } catch (error) {
      console.error('Error creating classroom:', error);
      Alert.alert('Error', 'Failed to create classroom');
    } finally {
      setCreating(false);
    }
  };

  const joinClassroom = async () => {
    try {
      if (!inviteCode.trim()) {
        Alert.alert('Error', 'Please enter an invite code');
        return;
      }

      setJoining(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation - check if code matches any classroom
      const allClassrooms = [...classrooms, ...userClassrooms];
      const classroomToJoin = allClassrooms.find(
        classroom => classroom.invite_code === inviteCode.trim().toUpperCase()
      );

      if (!classroomToJoin) {
        Alert.alert('Error', 'Invalid invite code');
        return;
      }

      // Check if already a member (in userClassrooms)
      const isAlreadyMember = userClassrooms.some(
        classroom => classroom.id === classroomToJoin.id
      );

      if (isAlreadyMember) {
        Alert.alert('Already a member', 'You are already in this classroom');
        setShowJoinModal(false);
        setInviteCode('');
        return;
      }

      // Add to user classrooms
      setUserClassrooms(prev => [classroomToJoin, ...prev]);

      Alert.alert('Success', `Joined ${classroomToJoin.name}!`);
      
      setShowJoinModal(false);
      setInviteCode('');
      
    } catch (error) {
      console.error('Error joining classroom:', error);
      Alert.alert('Error', 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  const joinPublicClassroom = async (classroom) => {
    try {
      // Check if already a member
      const isAlreadyMember = userClassrooms.some(
        userClassroom => userClassroom.id === classroom.id
      );

      if (isAlreadyMember) {
        Alert.alert('Already a member', 'You are already in this classroom');
        return;
      }

      Alert.alert(
        'Join Classroom',
        `Do you want to join ${classroom.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join', 
            onPress: () => {
              // Add to user classrooms
              setUserClassrooms(prev => [classroom, ...prev]);
              Alert.alert('Success', `Joined ${classroom.name}!`);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error joining classroom:', error);
      Alert.alert('Error', 'Failed to join classroom');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClassrooms();
  };

  const navigateToClassroomDetail = (classroomId) => {
    const classroom = [...userClassrooms, ...classrooms].find(c => c.id === classroomId);
    if (classroom) {
      Alert.alert('Classroom Details', 
        `${classroom.name}\n\nCode: ${classroom.invite_code}\n\n${classroom.description || 'No description'}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={24} color="#1D1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Icon name="login" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="plus" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      >
        {/* Your Classrooms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Classrooms</Text>
            <TouchableOpacity onPress={loadClassrooms}>
              <Icon name="refresh" size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading classrooms...</Text>
            </View>
          ) : userClassrooms.length > 0 ? (
            userClassrooms.map((classroom) => (
              <TouchableOpacity 
                key={classroom.id}
                style={styles.classroomCard}
                onPress={() => navigateToClassroomDetail(classroom.id)}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.classroomHeader}
                >
                  <Text style={styles.classroomName}>{classroom.name}</Text>
                  <Text style={styles.classroomCode}>Code: {classroom.invite_code}</Text>
                </LinearGradient>
                
                <View style={styles.classroomBody}>
                  <Text style={styles.classroomDescription} numberOfLines={2}>
                    {classroom.description || 'No description provided'}
                  </Text>
                  
                  <View style={styles.classroomStats}>
                    <View style={styles.statItem}>
                      <Icon name="account" size={16} color="#8E8E93" />
                      <Text style={styles.statText}>
                        {classroom.created_by?.username || 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Icon name="calendar" size={16} color="#8E8E93" />
                      <Text style={styles.statText}>
                        {new Date(classroom.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  {!classroom.is_public && (
                    <View style={styles.privateBadge}>
                      <Icon name="lock" size={12} color="#FFF" />
                      <Text style={styles.privateText}>Private</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-group-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No classrooms yet</Text>
              <Text style={styles.emptySubtext}>
                Create or join a classroom to get started
              </Text>
            </View>
          )}
        </View>

        {/* Public Classrooms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Public Classrooms</Text>
            <TouchableOpacity onPress={loadClassrooms}>
              <Icon name="refresh" size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading classrooms...</Text>
            </View>
          ) : classrooms.length > 0 ? (
            classrooms.map((classroom) => {
              // Check if user is already in this classroom
              const isMember = userClassrooms.some(c => c.id === classroom.id);
              
              return (
                <TouchableOpacity 
                  key={classroom.id}
                  style={[
                    styles.publicClassroomCard,
                    isMember && styles.memberClassroomCard
                  ]}
                  onPress={() => {
                    if (isMember) {
                      navigateToClassroomDetail(classroom.id);
                    } else {
                      joinPublicClassroom(classroom);
                    }
                  }}
                >
                  <View style={styles.publicClassroomInfo}>
                    <View style={styles.creatorInfo}>
                      {classroom.created_by?.avatar_url ? (
                        <Image 
                          source={{ uri: classroom.created_by.avatar_url }} 
                          style={styles.creatorAvatar} 
                        />
                      ) : (
                        <View style={styles.creatorAvatarPlaceholder}>
                          <Icon name="account" size={20} color="#4A90E2" />
                        </View>
                      )}
                      <Text style={styles.creatorName}>
                        {classroom.created_by?.username || 'Unknown'}
                      </Text>
                    </View>
                    
                    <Text style={styles.publicClassroomName}>{classroom.name}</Text>
                    <Text style={styles.publicClassroomDescription} numberOfLines={2}>
                      {classroom.description || 'Join to study together!'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.joinButton,
                      isMember && styles.joinedButton
                    ]}
                    onPress={() => {
                      if (isMember) {
                        navigateToClassroomDetail(classroom.id);
                      } else {
                        joinPublicClassroom(classroom);
                      }
                    }}
                  >
                    <Text style={[
                      styles.joinButtonText,
                      isMember && styles.joinedButtonText
                    ]}>
                      {isMember ? 'Open' : 'Join'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-group" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No public classrooms yet</Text>
              <Text style={styles.emptySubtext}>Be the first to create one!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Classroom Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Classroom</Text>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color="#1D1D1F" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Classroom Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Math Study Group"
                  value={newClassroom.name}
                  onChangeText={(text) => setNewClassroom(prev => ({ ...prev, name: text }))}
                  maxLength={50}
                  editable={!creating}
                />
                <Text style={styles.charCount}>
                  {newClassroom.name.length}/50
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your classroom..."
                  value={newClassroom.description}
                  onChangeText={(text) => setNewClassroom(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  editable={!creating}
                />
                <Text style={styles.charCount}>
                  {newClassroom.description.length}/200
                </Text>
              </View>

              <TouchableOpacity
                style={styles.privacyOption}
                onPress={() => !creating && setNewClassroom(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                disabled={creating}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[
                    styles.checkbox,
                    newClassroom.isPublic && styles.checkboxChecked
                  ]}>
                    {newClassroom.isPublic && (
                      <Icon name="check" size={16} color="#FFF" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.checkboxLabel}>Make classroom public</Text>
                    <Text style={styles.privacyHint}>
                      {newClassroom.isPublic 
                        ? 'Anyone can find and join' 
                        : 'Only people with invite code can join'}
                    </Text>
                  </View>
                </View>
                <Icon 
                  name={newClassroom.isPublic ? "earth" : "lock"} 
                  size={20} 
                  color="#4A90E2" 
                />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, creating && styles.disabledButton]}
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!newClassroom.name.trim() || creating) && styles.createButtonDisabled
                ]}
                onPress={createClassroom}
                disabled={!newClassroom.name.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Classroom</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Classroom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showJoinModal}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.joinModalContent}>
            <View style={styles.joinModalHeader}>
              <Text style={styles.joinModalTitle}>Join Classroom</Text>
              <TouchableOpacity 
                onPress={() => setShowJoinModal(false)}
                disabled={joining}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color="#1D1D1F" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.joinModalText}>
              Enter the 6-character invite code provided by the classroom creator
            </Text>
            
            <View style={styles.inviteInputContainer}>
              <Icon name="key" size={20} color="#8E8E93" style={styles.inviteIcon} />
              <TextInput
                style={styles.inviteInput}
                placeholder="ABCDEF"
                placeholderTextColor="#8E8E93"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
                editable={!joining}
              />
            </View>
            
            <View style={styles.joinModalButtons}>
              <TouchableOpacity
                style={[styles.joinCancelButton, joining && styles.disabledButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                }}
                disabled={joining}
              >
                <Text style={styles.joinCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.joinConfirmButton,
                  (!inviteCode.trim() || joining) && styles.joinConfirmButtonDisabled
                ]}
                onPress={joinClassroom}
                disabled={!inviteCode.trim() || joining}
              >
                {joining ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.joinConfirmButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  classroomCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classroomHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  classroomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  classroomCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  classroomBody: {
    padding: 16,
  },
  classroomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  classroomStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E8E93',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  privateText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  publicClassroomCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberClassroomCard: {
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  publicClassroomInfo: {
    flex: 1,
    marginRight: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  creatorName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  publicClassroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  publicClassroomDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  joinButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  joinedButton: {
    backgroundColor: '#E5E5E5',
  },
  joinButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  joinedButtonText: {
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
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
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1D1D1F',
    backgroundColor: '#F5F5F7',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A90E2',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  privacyHint: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  createButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  joinModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    alignItems: 'center',
  },
  joinModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  joinModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  joinModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inviteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    marginBottom: 24,
  },
  inviteIcon: {
    marginLeft: 12,
  },
  inviteInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: 2,
  },
  joinModalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  joinCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 12,
    alignItems: 'center',
  },
  joinCancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  joinConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  joinConfirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  joinConfirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ClassroomsScreen;