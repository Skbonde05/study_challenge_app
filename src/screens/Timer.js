// src/screens/Timer.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import AppButton from '../components/AppButton';
import { calculateXPEarned, calculateCoinsEarned, updateStreak, checkBadgeUnlocks } from '../utils/gamification';

const { width } = Dimensions.get('window');

const Timer = ({ navigation, route }) => {
  const [time, setTime] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [notes, setNotes] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [focusScore, setFocusScore] = useState(80);
  const [profile, setProfile] = useState(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  
  // Animation values
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Timer configurations
  const timerConfigs = {
    pomodoro: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
  };

  // Load challenges and profile
  useEffect(() => {
    loadChallenges();
    loadProfile();
    
    // If challenge passed via route params
    if (route.params?.challenge) {
      setSelectedChallenge(route.params.challenge);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && time !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, time]);

  // Pulse animation for running timer
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    Vibration.vibrate([500, 500, 500]);
    Alert.alert(
      'Time\'s up! 🎉',
      timerMode === 'pomodoro' 
        ? 'Great work! Take a break.'
        : 'Break time is over! Ready to focus again?',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Save Session', 
          onPress: () => setShowSaveModal(true)
        },
      ]
    );
  };

  const toggleTimer = () => {
    if (time === 0) {
      Alert.alert('Select Time', 'Please select a timer duration first');
      return;
    }

    if (!isRunning) {
      // Start animation
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }

    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(timerConfigs[timerMode]);
    scaleAnim.setValue(1);
    pulseAnim.setValue(1);
  };

  const setTimerModeAndReset = (mode) => {
    setTimerMode(mode);
    setTime(timerConfigs[mode]);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSessionRewards = (minutesStudied) => {
    const xp = calculateXPEarned(minutesStudied, focusScore);
    const coins = calculateCoinsEarned(minutesStudied, focusScore, profile?.current_streak || 0);
    
    return { xp, coins };
  };

  const handleSaveSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to save sessions');
        return;
      }

      const minutesStudied = Math.floor((timerConfigs[timerMode] - time) / 60);
      if (minutesStudied === 0) {
        Alert.alert('No time recorded', 'Please study for at least 1 minute');
        return;
      }

      // Calculate rewards
      const rewards = calculateSessionRewards(minutesStudied);
      setXpEarned(rewards.xp);
      setCoinsEarned(rewards.coins);

      // Save study session
      const sessionData = {
        user_id: user.id,
        challenge_id: selectedChallenge?.id || null,
        duration_minutes: minutesStudied,
        subject: subject || 'General',
        topic: topic || '',
        notes: notes,
        session_title: sessionTitle || `${timerMode} Session`,
        session_type: timerMode,
        xp_earned: rewards.xp,
        coins_earned: rewards.coins,
        focus_score: focusScore,
        session_date: new Date().toISOString().split('T')[0],
      };

      const { error: sessionError } = await supabase
        .from('study_sessions')
        .insert([sessionData]);

      if (sessionError) throw sessionError;

      // Update user profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('xp, coins, total_study_time, current_streak')
        .eq('id', user.id)
        .single();

      const updates = {
        xp: (currentProfile?.xp || 0) + rewards.xp,
        coins: (currentProfile?.coins || 0) + rewards.coins,
        total_study_time: (currentProfile?.total_study_time || 0) + minutesStudied,
      };

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      // Update streak
      await updateStreak(user.id);

      // Check for badge unlocks
      await checkBadgeUnlocks(user.id, 'time', minutesStudied);
      await checkBadgeUnlocks(user.id, 'streak', currentProfile?.current_streak + 1);

      // Update challenge progress if selected
      if (selectedChallenge) {
        // Check if user has this challenge
        const { data: userChallenge } = await supabase
          .from('user_challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', selectedChallenge.id)
          .single();

        if (userChallenge) {
          const newMinutes = (userChallenge.current_minutes || 0) + minutesStudied;
          const isCompleted = newMinutes >= selectedChallenge.target_minutes;

          await supabase
            .from('user_challenges')
            .update({
              current_minutes: newMinutes,
              is_completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : null,
            })
            .eq('id', userChallenge.id);

          if (isCompleted) {
            Alert.alert('🎉 Challenge Completed!', `You've completed "${selectedChallenge.title}"!`);
            
            // Award challenge rewards
            await supabase
              .from('profiles')
              .update({
                xp: supabase.raw('xp + ?', [selectedChallenge.xp_reward]),
                coins: supabase.raw('coins + ?', [selectedChallenge.coins_reward]),
                completed_challenges: supabase.raw('completed_challenges + 1'),
              })
              .eq('id', user.id);
          }
        } else {
          // Create new user challenge entry
          await supabase
            .from('user_challenges')
            .insert([
              {
                user_id: user.id,
                challenge_id: selectedChallenge.id,
                current_minutes: minutesStudied,
                is_completed: minutesStudied >= selectedChallenge.target_minutes,
              },
            ]);
        }
      }

      setShowSaveModal(false);
      setShowRewardModal(true);

    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1D1D1F', '#2C2C2E']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Study Timer</Text>
        
        <TouchableOpacity 
          style={styles.challengeButton}
          onPress={() => setShowChallengeModal(true)}
        >
          <Icon name="target" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View 
          style={[
            styles.timerCircle,
            {
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim }
              ],
            },
          ]}
        >
          <LinearGradient
            colors={getTimerColor()}
            style={styles.timerGradient}
          >
            <Text style={styles.timerText}>{formatTime(time)}</Text>
            <Text style={styles.timerMode}>
              {timerMode === 'pomodoro' ? 'Focus Time' : 
               timerMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Selected Challenge */}
        {selectedChallenge && (
          <View style={styles.selectedChallenge}>
            <Text style={styles.selectedChallengeTitle}>
              {selectedChallenge.title}
            </Text>
            <Text style={styles.selectedChallengeProgress}>
              {selectedChallenge.target_minutes} mins target
            </Text>
          </View>
        )}

        {/* Timer Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={toggleTimer}
            disabled={time === 0}
          >
            <Icon 
              name={isRunning ? "pause" : "play"} 
              size={32} 
              color={time === 0 ? "#CCC" : "#4A90E2"} 
            />
            <Text style={[
              styles.controlButtonText,
              time === 0 && styles.disabledText
            ]}>
              {isRunning ? "Pause" : "Start"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={resetTimer}
          >
            <Icon name="refresh" size={32} color="#FF6B6B" />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Focus Score Selector */}
      <View style={styles.focusSection}>
        <Text style={styles.focusLabel}>Focus Score: {focusScore}%</Text>
        <View style={styles.focusSlider}>
          {[50, 60, 70, 80, 90, 100].map((score) => (
            <TouchableOpacity
              key={score}
              style={[
                styles.focusDot,
                focusScore >= score && styles.focusDotActive,
              ]}
              onPress={() => setFocusScore(score)}
            />
          ))}
        </View>
      </View>

      {/* Subject Input */}
      <View style={styles.subjectSection}>
        <TextInput
          style={styles.subjectInput}
          placeholder="Subject (e.g., Math, Physics)"
          value={subject}
          onChangeText={setSubject}
        />
        <TextInput
          style={styles.topicInput}
          placeholder="Topic (e.g., Calculus, Optics)"
          value={topic}
          onChangeText={setTopic}
        />
      </View>

      {/* Timer Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'pomodoro' && styles.modeButtonActive
          ]}
          onPress={() => setTimerModeAndReset('pomodoro')}
        >
          <LinearGradient
            colors={timerMode === 'pomodoro' ? ['#FF6B6B', '#FF4757'] : ['#F2F2F7', '#E5E5EA']}
            style={styles.modeButtonGradient}
          >
            <Icon 
              name="brain" 
              size={24} 
              color={timerMode === 'pomodoro' ? '#FFF' : '#8E8E93'} 
            />
            <Text style={[
              styles.modeButtonText,
              timerMode === 'pomodoro' && styles.modeButtonTextActive
            ]}>
              25:00
            </Text>
            <Text style={styles.modeButtonLabel}>Focus</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'shortBreak' && styles.modeButtonActive
          ]}
          onPress={() => setTimerModeAndReset('shortBreak')}
        >
          <LinearGradient
            colors={timerMode === 'shortBreak' ? ['#4A90E2', '#357ABD'] : ['#F2F2F7', '#E5E5EA']}
            style={styles.modeButtonGradient}
          >
            <Icon 
              name="coffee" 
              size={24} 
              color={timerMode === 'shortBreak' ? '#FFF' : '#8E8E93'} 
            />
            <Text style={[
              styles.modeButtonText,
              timerMode === 'shortBreak' && styles.modeButtonTextActive
            ]}>
              05:00
            </Text>
            <Text style={styles.modeButtonLabel}>Short Break</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'longBreak' && styles.modeButtonActive
          ]}
          onPress={() => setTimerModeAndReset('longBreak')}
        >
          <LinearGradient
            colors={timerMode === 'longBreak' ? ['#2ED573', '#25CC63'] : ['#F2F2F7', '#E5E5EA']}
            style={styles.modeButtonGradient}
          >
            <Icon 
              name="beach" 
              size={24} 
              color={timerMode === 'longBreak' ? '#FFF' : '#8E8E93'} 
            />
            <Text style={[
              styles.modeButtonText,
              timerMode === 'longBreak' && styles.modeButtonTextActive
            ]}>
              15:00
            </Text>
            <Text style={styles.modeButtonLabel}>Long Break</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Time Presets */}
      <View style={styles.presetsSection}>
        <Text style={styles.sectionTitle}>Quick Start</Text>
        <View style={styles.presetsGrid}>
          {[10, 15, 20, 30, 45, 60].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={styles.presetButton}
              onPress={() => {
                setTime(minutes * 60);
                setTimerMode('pomodoro');
                setIsRunning(false);
              }}
            >
              <LinearGradient
                colors={['#5AC8FA', '#34C759']}
                style={styles.presetGradient}
              >
                <Text style={styles.presetText}>{minutes}m</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Challenge Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showChallengeModal}
        onRequestClose={() => setShowChallengeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Challenge</Text>
              <TouchableOpacity onPress={() => setShowChallengeModal(false)}>
                <Icon name="close" size={24} color="#1D1D1F" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {challenges.length > 0 ? (
                challenges.map((challenge) => (
                  <TouchableOpacity
                    key={challenge.id}
                    style={[
                      styles.challengeOption,
                      selectedChallenge?.id === challenge.id && styles.challengeOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedChallenge(challenge);
                      setShowChallengeModal(false);
                    }}
                  >
                    <View style={styles.challengeInfo}>
                      <Text style={styles.challengeOptionTitle}>
                        {challenge.title}
                      </Text>
                      <Text style={styles.challengeOptionDescription}>
                        {challenge.description || 'No description'}
                      </Text>
                      <View style={styles.challengeRewards}>
                        <View style={styles.rewardBadge}>
                          <Icon name="star" size={14} color="#FFD700" />
                          <Text style={styles.rewardText}>+{challenge.xp_reward} XP</Text>
                        </View>
                        <View style={styles.rewardBadge}>
                          <Icon name="coin" size={14} color="#FFD700" />
                          <Text style={styles.rewardText}>+{challenge.coins_reward} coins</Text>
                        </View>
                      </View>
                      <Text style={styles.challengeTarget}>
                        Target: {challenge.target_minutes} minutes
                      </Text>
                    </View>
                    <Icon 
                      name="check-circle" 
                      size={24} 
                      color={selectedChallenge?.id === challenge.id ? '#4A90E2' : '#E5E5EA'} 
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noChallenges}>
                  <Icon name="target" size={48} color="#CCC" />
                  <Text style={styles.noChallengesText}>No active challenges</Text>
                  <Text style={styles.noChallengesSubtext}>
                    Join challenges from the Challenges screen
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedChallenge(null);
                  setShowChallengeModal(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Session Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSaveModal}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saveModalContent}>
            <Text style={styles.saveModalTitle}>Save Study Session</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Session Title</Text>
              <TextInput
                style={styles.input}
                value={sessionTitle}
                onChangeText={setSessionTitle}
                placeholder="e.g., Math Chapter 3"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="What did you study?"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.sessionStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Duration:</Text>
                <Text style={styles.statValue}>
                  {Math.floor((timerConfigs[timerMode] - time) / 60)} minutes
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Focus Score:</Text>
                <Text style={styles.statValue}>{focusScore}%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Subject:</Text>
                <Text style={styles.statValue}>{subject || 'General'}</Text>
              </View>
              {selectedChallenge && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Challenge:</Text>
                  <Text style={styles.statValue}>{selectedChallenge.title}</Text>
                </View>
              )}
            </View>

            <View style={styles.saveModalButtons}>
              <TouchableOpacity
                style={styles.cancelSaveButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.cancelSaveButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSaveButton}
                onPress={handleSaveSession}
              >
                <Text style={styles.confirmSaveButtonText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reward Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRewardModal}
        onRequestClose={() => setShowRewardModal(false)}
      >
        <View style={styles.rewardModalOverlay}>
          <View style={styles.rewardModalContent}>
            <View style={styles.confettiContainer}>
              <Icon name="party-popper" size={60} color="#FFD700" />
            </View>
            
            <Text style={styles.rewardTitle}>Session Complete! 🎉</Text>
            <Text style={styles.rewardSubtitle}>Great work! Here's what you earned:</Text>
            
            <View style={styles.rewardsContainer}>
              <View style={styles.rewardItem}>
                <LinearGradient
                  colors={['#FFD700', '#FFC107']}
                  style={styles.rewardIcon}
                >
                  <Icon name="coin" size={30} color="#FFF" />
                </LinearGradient>
                <Text style={styles.rewardValue}>+{coinsEarned}</Text>
                <Text style={styles.rewardLabel}>Coins</Text>
              </View>
              
              <View style={styles.rewardItem}>
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.rewardIcon}
                >
                  <Icon name="star" size={30} color="#FFF" />
                </LinearGradient>
                <Text style={styles.rewardValue}>+{xpEarned}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              
              <View style={styles.rewardItem}>
                <LinearGradient
                  colors={['#FF9500', '#E68500']}
                  style={styles.rewardIcon}
                >
                  <Icon name="fire" size={30} color="#FFF" />
                </LinearGradient>
                <Text style={styles.rewardValue}>+1</Text>
                <Text style={styles.rewardLabel}>Day Streak</Text>
              </View>
            </View>
            
            <View style={styles.rewardActions}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  Alert.alert('Shared!', 'Your achievement has been shared.');
                  setShowRewardModal(false);
                }}
              >
                <Icon name="share-variant" size={20} color="#4A90E2" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
              
              <AppButton
                title="Continue"
                onPress={() => {
                  setShowRewardModal(false);
                  navigation.navigate('Dashboard');
                }}
                style={styles.continueButton}
              />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  challengeButton: {
    padding: 8,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 40,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  timerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  timerMode: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  selectedChallenge: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedChallengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  selectedChallengeProgress: {
    fontSize: 14,
    color: '#8E8E93',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    width: '100%',
  },
  controlButton: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 8,
  },
  disabledText: {
    color: '#CCC',
  },
  focusSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  focusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
    textAlign: 'center',
  },
  focusSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  focusDot: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  focusDotActive: {
    backgroundColor: '#4A90E2',
  },
  subjectSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subjectInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  topicInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modeButtonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginVertical: 8,
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  modeButtonLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  presetsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '31%',
    height: 60,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  presetGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
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
  challengeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  challengeOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E210',
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  challengeOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  challengeRewards: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  rewardText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 4,
  },
  challengeTarget: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  noChallenges: {
    padding: 40,
    alignItems: 'center',
  },
  noChallengesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 4,
  },
  noChallengesSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  clearButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  saveModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
  },
  saveModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 24,
    textAlign: 'center',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sessionStats: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  saveModalButtons: {
    flexDirection: 'row',
  },
  cancelSaveButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  cancelSaveButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmSaveButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmSaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    width: width * 0.9,
    alignItems: 'center',
  },
  confettiContainer: {
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  rewardItem: {
    alignItems: 'center',
    flex: 1,
  },
  rewardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  rewardActions: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginRight: 12,
  },
  shareButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButton: {
    flex: 2,
  },
});

export default Timer;