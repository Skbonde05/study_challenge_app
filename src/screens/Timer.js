import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Vibration,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useAppTheme } from '../theme/useAppTheme';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';
import { useChallenges } from '../hooks/useChallenges';
import { useRealtime } from '../hooks/useRealtime';
import { calculateXPEarned, calculateCoinsEarned } from '../utils/gamification';

const { width } = Dimensions.get('window');

const Timer = ({ navigation, route }) => {
  const { theme } = useAppTheme();
  
  // Data hooks with automatic caching
  const { profile } = useProfile();
  const { challenges } = useChallenges();
  const { recentSessions, recordSession, isRecording } = useSessions();
  
  // Real-time synchronization
  useRealtime();

  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [focusScore, setFocusScore] = useState(80);
  
  const [lastRewards, setLastRewards] = useState({ coins: 0, xp: 0 });

  // Refs
  const timerRef = useRef(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(pulseStartValue));
  const [rotateAnim] = useState(new Animated.Value(0));

  const timerConfigs = useMemo(() => ({
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  }), []);

  useEffect(() => {
    if (route.params?.challenge) {
      setSelectedChallenge(route.params.challenge);
    }
  }, [route.params?.challenge]);

  // Timer interval logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isRunning && time > 0) {
      timerRef.current = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, time]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    Vibration.vibrate([300, 300, 300]);
    
    if (timerMode === 'pomodoro') {
      const minutesStudied = Math.floor(timerConfigs.pomodoro / 60);
      const rewards = {
        xp: calculateXPEarned(minutesStudied, focusScore),
        coins: calculateCoinsEarned(minutesStudied, focusScore, profile?.current_streak || 0)
      };
      setLastRewards(rewards);
      setShowSaveModal(true);
    } else {
      Alert.alert('Break Over!', 'Ready to focus again?', [
        { text: 'Start Focus', onPress: () => setTimerModeAndReset('pomodoro') }
      ]);
    }
  };

  const setTimerModeAndReset = (mode) => {
    setTimerMode(mode);
    setTime(timerConfigs[mode]);
    setIsRunning(false);
  };

  const handleSaveSession = () => {
    const minutesStudied = Math.floor((timerConfigs[timerMode] - time) / 60);
    if (minutesStudied < 1) {
      Alert.alert('Session too short', 'Pomodoro sessions under 1 minute are not recorded.');
      setShowSaveModal(false);
      return;
    }

    const sessionData = {
      durationMinutes: minutesStudied,
      subject: subject || 'General',
      topic: topic || '',
      notes: notes || '',
      sessionTitle: sessionTitle || `Focus Session - ${minutesStudied} min`,
      xpEarned: lastRewards.xp,
      coinsEarned: lastRewards.coins,
      focusScore: focusScore,
      challengeId: selectedChallenge?.id || null,
      type: timerMode
    };

    recordSession({ sessionData }, {
      onSuccess: () => {
        setShowSaveModal(false);
        setShowRewardModal(true);
        // Clear session unique states
        setSubject('');
        setTopic('');
        setNotes('');
        setSessionTitle('');
      },
      onError: (err) => {
        Alert.alert('Error Saving', err.message || 'Please try again.');
      }
    });
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    switch (timerMode) {
      case 'pomodoro': return ['#FF6B6B', '#FF4757'];
      case 'shortBreak': return ['#4A90E2', '#357ABD'];
      case 'longBreak': return ['#2ED573', '#25CC63'];
      default: return ['#4A90E2', '#357ABD'];
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Timer Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Study Timer</Text>
        <TouchableOpacity onPress={() => setShowChallengeModal(true)}><Icon name="target" size={24} color="#FFF" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Modes Toggle */}
        <View style={styles.modesContainer}>
          {Object.keys(timerConfigs).map(mode => (
            <TouchableOpacity 
              key={mode} 
              style={[
                styles.modeBtn, 
                timerMode === mode && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setTimerModeAndReset(mode)}
            >
              <Text style={[styles.modeText, timerMode === mode && { color: '#FFF' }]}>
                {mode.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Big Timer Circle */}
        <View style={styles.timerCircleContainer}>
          <LinearGradient colors={getTimerColor()} style={styles.timerCircle}>
            <Text style={styles.timerDisplay}>{formatTime(time)}</Text>
            <Text style={styles.timerHint}>{timerMode.toUpperCase()}</Text>
          </LinearGradient>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlBtn, isRunning ? styles.pauseBtn : styles.startBtn]} 
            onPress={() => setIsRunning(!isRunning)}
          >
            <Icon name={isRunning ? "pause" : "play"} size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setTimerModeAndReset(timerMode)}>
            <Icon name="refresh" size={28} color={theme.colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Focus Settings</Text>
          <Text style={[styles.label, { color: theme.colors.secondaryText }]}>Focus Intensity: {focusScore}%</Text>
          <Slider 
            style={styles.slider}
            minimumValue={50} maximumValue={100} step={10}
            value={focusScore} onValueChange={setFocusScore}
            minimumTrackTintColor={theme.colors.primary}
          />
        </View>

        {/* Active Challenge */}
        {selectedChallenge && (
          <View style={[styles.challengeCard, { backgroundColor: theme.colors.card }]}>
            <Icon name="medal" size={24} color="#FFD700" />
            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>{selectedChallenge.title}</Text>
              <Text style={[styles.challengeTarget, { color: theme.colors.secondaryText }]}>Target: {selectedChallenge.target_minutes} mins</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedChallenge(null)}><Icon name="close" size={20} color={theme.colors.border} /></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Save Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Record Session</Text>
            <Text style={[styles.modalHint, { color: theme.colors.secondaryText }]}>How was your focus during this session?</Text>
            
            <TextInput 
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Topic or Subject" 
              placeholderTextColor={theme.colors.secondaryText}
              value={subject} onChangeText={setSubject} 
            />
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Notes..." 
              placeholderTextColor={theme.colors.secondaryText}
              multiline value={notes} onChangeText={setNotes} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSaveModal(false)}><Text style={{ color: theme.colors.secondaryText }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSave, { backgroundColor: theme.colors.primary }]} 
                onPress={handleSaveSession}
                disabled={isRecording}
              >
                {isRecording ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveText}>Save Session</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rewards Modal */}
      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.rewardContent, { backgroundColor: theme.colors.card }]}>
            <Icon name="trophy" size={64} color="#FFD700" />
            <Text style={[styles.rewardTitle, { color: theme.colors.text }]}>Excellent Work!</Text>
            <View style={styles.rewardsRow}>
              <View style={styles.rewardItem}><Text style={styles.rewardVal}>+{lastRewards.xp}</Text><Text style={styles.rewardLab}>XP</Text></View>
              <View style={styles.rewardItem}><Text style={styles.rewardVal}>+{lastRewards.coins}</Text><Text style={styles.rewardLab}>Coins</Text></View>
            </View>
            <TouchableOpacity style={[styles.rewardClose, { backgroundColor: theme.colors.primary }]} onPress={() => setShowRewardModal(false)}>
              <Text style={styles.rewardCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const pulseStartValue = 1;
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  modesContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30 },
  modeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  modeText: { fontSize: 12, fontWeight: 'bold' },
  timerCircleContainer: { alignItems: 'center', marginBottom: 40 },
  timerCircle: { width: 280, height: 280, borderRadius: 140, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  timerDisplay: { color: '#FFF', fontSize: 64, fontWeight: 'bold' },
  timerHint: { color: '#FFF', fontSize: 14, fontWeight: 'bold', opacity: 0.8 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 40 },
  controlBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  startBtn: { backgroundColor: '#34C759' },
  pauseBtn: { backgroundColor: '#FF3B30' },
  resetBtn: { padding: 10 },
  settingsCard: { borderRadius: 24, padding: 20, elevation: 4, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  challengeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 12, elevation: 4 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontWeight: 'bold', fontSize: 15 },
  challengeTarget: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, borderRadius: 32, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalHint: { fontSize: 14, marginBottom: 20 },
  input: { borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1, marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalCancel: { flex: 1, padding: 16, alignItems: 'center' },
  modalSave: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { color: '#FFF', fontWeight: 'bold' },
  rewardContent: { width: width * 0.8, borderRadius: 32, padding: 32, alignItems: 'center' },
  rewardTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 20 },
  rewardsRow: { flexDirection: 'row', gap: 32, marginBottom: 32 },
  rewardItem: { alignItems: 'center' },
  rewardVal: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  rewardLab: { fontSize: 12, fontWeight: 'bold', opacity: 0.6 },
  rewardClose: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' },
  rewardCloseText: { color: '#FFF', fontWeight: 'bold' },
});

export default Timer;