// src/screens/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppButton from '../components/AppButton';
import Header from '../components/Header';

export default function Dashboard({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    currentStreak: 0,
    totalHours: 0,
    completedChallenges: 0,
    level: 1,
  });
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Calculate stats from profile
      setStats({
        currentStreak: data.current_streak || 0,
        totalHours: Math.floor((data.total_study_time || 0) / 60),
        completedChallenges: data.completed_challenges || 0,
        level: calculateLevel(data.xp || 0),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const getRecentChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to fetch challenges
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.warn('Error fetching challenges, using empty array:', error.message);
        setRecentChallenges([]);
        return;
      }
      
      setRecentChallenges(challengesData || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setRecentChallenges([]);
    }
  };

  const getDailyChallenge = async () => {
    try {
      // Mock daily challenge
      const mockDailyChallenge = {
        id: 'daily_1',
        title: 'Study for 60 minutes',
        description: 'Complete 60 minutes of focused study today',
        target_minutes: 60,
        current_minutes: 45,
        rewards: {
          coins: 100,
          xp: 500,
        },
        deadline: new Date().setHours(23, 59, 59, 999),
        is_completed: false,
      };
      setDailyChallenge(mockDailyChallenge);
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
    }
  };

  const calculateLevel = (xp) => {
    return Math.floor(xp / 1000) + 1;
  };

  const calculateProgress = (xp) => {
    const currentLevelXp = xp % 1000;
    return (currentLevelXp / 1000) * 100;
  };

  const addXp = async (xpToAdd) => {
    if (!profile) return;

    try {
      const newXp = profile.xp + xpToAdd;
      const { error } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', profile.id);

      if (!error) {
        setProfile({ ...profile, xp: newXp });
        setStats(prev => ({
          ...prev,
          level: calculateLevel(newXp),
        }));
        Alert.alert('Success', `+${xpToAdd} XP added!`);
      }
    } catch (error) {
      console.error('Error adding XP:', error);
      Alert.alert('Error', 'Failed to add XP');
    }
  };

  const claimDailyChallenge = async () => {
    if (!dailyChallenge || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          coins: (profile.coins || 0) + dailyChallenge.rewards.coins,
          xp: (profile.xp || 0) + dailyChallenge.rewards.xp,
        })
        .eq('id', profile.id);

      if (!error) {
        Alert.alert(
          'Challenge Completed!',
          `🎉 You earned ${dailyChallenge.rewards.coins} coins and ${dailyChallenge.rewards.xp} XP!`
        );
        await getProfile();
        setDailyChallenge(prev => ({ ...prev, is_completed: true }));
      }
    } catch (error) {
      console.error('Error claiming challenge:', error);
      Alert.alert('Error', 'Failed to claim rewards');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      getProfile(),
      getRecentChallenges(),
      getDailyChallenge(),
    ]);
    setRefreshing(false);
  };

  const startStudySession = () => {
    navigation.navigate('Timer');
  };

  const viewAllChallenges = () => {
    navigation.navigate('Challenges');
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        getProfile(),
        getRecentChallenges(),
        getDailyChallenge(),
      ]);
      setLoading(false);
    };
    loadData();

    // Handle Android back button
    const backAction = () => {
      if (navigation.isFocused()) {
        Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'YES', onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Header 
            title="Study Challenge"
            onProfilePress={() => navigation.navigate('Profile')}
            profileImage={profile?.avatar_url}
            showNotification={true}
            onNotificationPress={() => navigation.navigate('Notifications')}
          />
          
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Hello, {profile?.username || 'Student'}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Ready for today's study session?
            </Text>
          </View>

          {/* Coins and Gems Display */}
          <View style={styles.currencySection}>
            <TouchableOpacity 
              style={styles.currencyItem}
              onPress={() => navigation.navigate('Store')}
            >
              <Icon name="coin" size={20} color="#FFD700" />
              <Text style={styles.currencyValue}>{profile?.coins || 0}</Text>
              <Text style={styles.currencyLabel}>Coins</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.currencyItem}
              onPress={() => navigation.navigate('Store')}
            >
              <Icon name="diamond" size={20} color="#5AC8FA" />
              <Text style={styles.currencyValue}>{profile?.gems || 0}</Text>
              <Text style={styles.currencyLabel}>Gems</Text>
            </TouchableOpacity>
          </View>

          {/* Level and XP Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={styles.levelNumber}>{stats.level}</Text>
            </View>
            <View style={styles.xpSection}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpText}>{profile?.xp || 0} XP</Text>
                <Text style={styles.nextLevelText}>
                  Next: {(stats.level * 1000) - (profile?.xp % 1000 || 0)} XP
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${calculateProgress(profile?.xp || 0)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FF9500', '#E68500']}
              style={styles.statIcon}
            >
              <Icon name="fire" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#34C759', '#2AA24F']}
              style={styles.statIcon}
            >
              <Icon name="clock-outline" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.totalHours}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#5856D6', '#4A48C7']}
              style={styles.statIcon}
            >
              <Icon name="trophy" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.completedChallenges}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
        </View>

        {/* Quick Actions for New Features */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Badges')}
          >
            <LinearGradient colors={['#FFD700', '#FFC107']} style={styles.quickActionIcon}>
              <Icon name="trophy" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Badges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.quickActionIcon}>
              <Icon name="podium" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Leaderboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Classrooms')}
          >
            <LinearGradient colors={['#34C759', '#2AA24F']} style={styles.quickActionIcon}>
              <Icon name="account-group" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Groups</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Store')}
          >
            <LinearGradient colors={['#FF9500', '#E68500']} style={styles.quickActionIcon}>
              <Icon name="shopping" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Store</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Challenge Section */}
        {dailyChallenge && (
          <View style={styles.dailyChallengeSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Challenge</Text>
              <TouchableOpacity 
                onPress={dailyChallenge.is_completed ? null : claimDailyChallenge}
                disabled={dailyChallenge.is_completed}
              >
                <Text style={[
                  styles.seeAllText,
                  dailyChallenge.is_completed && styles.disabledText
                ]}>
                  {dailyChallenge.is_completed ? 'Claimed' : 'Claim'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.challengeCard}>
              <Text style={styles.challengeTitle}>{dailyChallenge.title}</Text>
              <Text style={styles.challengeDescription}>{dailyChallenge.description}</Text>
              <View style={styles.challengeProgress}>
                <Text style={styles.challengeProgressText}>
                  {dailyChallenge.current_minutes}/{dailyChallenge.target_minutes} mins
                </Text>
                <View style={styles.challengeProgressBar}>
                  <View style={[
                    styles.challengeProgressFill,
                    { 
                      width: `${Math.min(
                        (dailyChallenge.current_minutes / dailyChallenge.target_minutes) * 100,
                        100
                      )}%`
                    }
                  ]} />
                </View>
              </View>
              <View style={styles.challengeRewards}>
                <View style={styles.rewardItem}>
                  <Icon name="coin" size={16} color="#FFD700" />
                  <Text style={styles.rewardText}>+{dailyChallenge.rewards.coins}</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Icon name="star" size={16} color="#4A90E2" />
                  <Text style={styles.rewardText}>+{dailyChallenge.rewards.xp} XP</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Study Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Study Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={startStudySession}
            >
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.actionGradient}
              >
                <Icon name="play-circle" size={32} color="#FFF" />
                <Text style={styles.actionText}>Start Timer</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('FocusMusic')}
            >
              <LinearGradient
                colors={['#AF52DE', '#9C28B1']}
                style={styles.actionGradient}
              >
                <Icon name="music-note" size={32} color="#FFF" />
                <Text style={styles.actionText}>Focus Music</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Goals')}
            >
              <LinearGradient
                colors={['#FF9500', '#E68500']}
                style={styles.actionGradient}
              >
                <Icon name="target" size={32} color="#FFF" />
                <Text style={styles.actionText}>Set Goals</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Resources')}
            >
              <LinearGradient
                colors={['#34C759', '#2AA24F']}
                style={styles.actionGradient}
              >
                <Icon name="book-open-variant" size={32} color="#FFF" />
                <Text style={styles.actionText}>Resources</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Challenges */}
        <View style={styles.challengesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Challenges</Text>
            <TouchableOpacity onPress={viewAllChallenges}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentChallenges.length > 0 ? (
            recentChallenges.map((challenge, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.challengeCard}
                onPress={() => navigation.navigate('Challenges')}
              >
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    challenge.is_completed ? styles.completedBadge : styles.activeBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {challenge.is_completed ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.challengeDescription}>
                  {challenge.description || 'No description'}
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>
                      {Math.min(challenge.current_minutes || 0, challenge.target_minutes)} / {challenge.target_minutes} mins
                    </Text>
                    <Text style={styles.progressPercent}>
                      {Math.round(((challenge.current_minutes || 0) / challenge.target_minutes) * 100)}%
                    </Text>
                  </View>
                  <View style={styles.challengeProgressBar}>
                    <View 
                      style={[
                        styles.challengeProgressFill,
                        { 
                          width: `${Math.min(((challenge.current_minutes || 0) / challenge.target_minutes) * 100, 100)}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyChallenges}>
              <Icon name="target" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No challenges yet</Text>
              <Text style={styles.emptySubtext}>Create your first challenge!</Text>
            </View>
          )}
        </View>

        {/* Daily Goal */}
        <View style={styles.dailyGoalSection}>
          <LinearGradient
            colors={['#5AC8FA', '#34C759']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dailyGoalCard}
          >
            <Icon name="calendar-check" size={48} color="#FFF" />
            <View style={styles.goalContent}>
              <Text style={styles.goalTitle}>Daily Goal</Text>
              <Text style={styles.goalSubtitle}>Study for 2 hours today</Text>
              <View style={styles.goalProgress}>
                <Text style={styles.goalProgressText}>45% Complete</Text>
                <View style={styles.goalProgressBar}>
                  <View style={[styles.goalProgressFill, { width: '45%' }]} />
                </View>
              </View>
              <TouchableOpacity 
                style={styles.goalButton}
                onPress={() => navigation.navigate('Goals')}
              >
                <Text style={styles.goalButtonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <AppButton
            title="Logout"
            onPress={async () => {
              try {
                await supabase.auth.signOut();
                navigation.replace('Login');
              } catch (error) {
                console.error('Error logging out:', error);
                Alert.alert('Error', 'Failed to logout');
              }
            }}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  currencySection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 100,
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
    marginRight: 4,
  },
  currencyLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelInfo: {
    marginRight: 20,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  xpSection: {
    flex: 1,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  nextLevelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dailyChallengeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  seeAllText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#CCC',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    height: 100,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  challengesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  challengeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#34C75920',
  },
  activeBadge: {
    backgroundColor: '#4A90E220',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  challengeProgress: {
    marginBottom: 12,
  },
  challengeProgressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  challengeRewards: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 4,
  },
  emptyChallenges: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  dailyGoalSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dailyGoalCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  goalContent: {
    flex: 1,
    marginLeft: 20,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  goalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  goalProgress: {
    marginBottom: 16,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  goalButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  goalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
});