import React, { useEffect, useRef, useMemo } from 'react';
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
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useProfile } from '../hooks/useProfile';
import { useChallenges } from '../hooks/useChallenges';
import { useSessions } from '../hooks/useSessions';
import { useRealtime } from '../hooks/useRealtime';
import { useNotifications } from '../hooks/useNotifications';

// Sub-components
import StatCard from '../components/dashboard/StatCard';
import DailyChallengeCard from '../components/dashboard/DailyChallengeCard';
import DashboardHeader from '../components/dashboard/DashboardHeader';

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation }) {
  const { theme } = useAppTheme();
  
  // Data hooks with automatic caching and background fetching
  const { profile, badges, isLoading: loadingProfile, refetch: refetchProfile } = useProfile();
  const { 
    challenges, 
    dailyChallenge, 
    isLoading: loadingChallenges, 
    claimDaily, 
    refetch: refetchChallenges 
  } = useChallenges();
  const { recentSessions, isLoading: loadingSessions, refetch: refetchSessions } = useSessions();
  const { unreadCount } = useNotifications();
  
  // Real-time synchronization
  useRealtime();

  const scrollViewRef = useRef(null);
  const loading = (loadingProfile || loadingChallenges || loadingSessions) && !profile;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    await Promise.all([
      refetchProfile(),
      refetchChallenges(),
      refetchSessions()
    ]);
  };

  const handleClaimDaily = () => {
    if (!dailyChallenge || !profile) return;
    claimDaily({ dailyChallenge, currentProfile: profile }, {
      onSuccess: () => {
        Alert.alert('Success', 'Rewards claimed successfully! 🎉');
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Failed to claim rewards');
      }
    });
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() }
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const calculateProgress = (xp) => {
    const currentLevelXp = (xp || 0) % 1000;
    return Math.min((currentLevelXp / 1000) * 100, 100);
  };

  // Derived state for stats
  const stats = useMemo(() => ({
    currentStreak: profile?.current_streak || 0,
    totalHours: profile?.total_study_time ? Math.floor(profile.total_study_time / 60) : 0,
    completedChallenges: profile?.completed_challenges || 0,
    level: profile?.level || 1,
    rank: profile?.rank || 'Beginner',
  }), [profile]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.colors.statusBar} backgroundColor={theme.colors.primary} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.statusBar} backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fixedHeader}
      >
        <DashboardHeader 
          navigation={navigation} 
          theme={theme} 
          badgeCount={unreadCount} 
        />
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
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
        contentContainerStyle={[styles.scrollContent, { minHeight: '100%', paddingTop: 120, paddingBottom: 140 }]}
        nestedScrollEnabled={true}
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeSection}
        >
          <Text style={[styles.welcomeText, { color: theme.colors.headerText }]}>
            Hello, {profile?.username || 'Student'}! 👋
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.colors.headerText + 'CC' }]}>
            {stats.rank} • Level {stats.level}
          </Text>
        </LinearGradient>

        {/* Currency Section */}
        <View style={styles.currencySection}>
          <TouchableOpacity 
            style={[styles.currencyItem, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('Store')}
          >
            <Icon name="cash" size={20} color="#FFD700" />
            <Text style={[styles.currencyValue, { color: theme.colors.text }]}>{profile?.coins || 0}</Text>
            <Text style={[styles.currencyLabel, { color: theme.colors.secondaryText }]}>Coins</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.currencyItem, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('Store')}
          >
            <Icon name="diamond" size={20} color="#5AC8FA" />
            <Text style={[styles.currencyValue, { color: theme.colors.text }]}>{profile?.gems || 0}</Text>
            <Text style={[styles.currencyLabel, { color: theme.colors.secondaryText }]}>Gems</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.currencyItem, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('Badges')}
          >
            <Icon name="trophy" size={20} color="#FF9500" />
            <Text style={[styles.currencyValue, { color: theme.colors.text }]}>{badges.length}</Text>
            <Text style={[styles.currencyLabel, { color: theme.colors.secondaryText }]}>Badges</Text>
          </TouchableOpacity>
        </View>

        {/* Level Card */}
        <View style={[styles.levelCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelLabel, { color: theme.colors.secondaryText }]}>LEVEL</Text>
            <Text style={[styles.levelNumber, { color: theme.colors.primary }]}>{stats.level}</Text>
          </View>
          <View style={styles.xpSection}>
            <View style={styles.xpHeader}>
              <Text style={[styles.xpText, { color: theme.colors.text }]}>{profile?.xp || 0} XP</Text>
              <Text style={[styles.nextLevelText, { color: theme.colors.secondaryText }]}>
                Next: {1000 - ((profile?.xp || 0) % 1000)} XP
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.progressBackground }]}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${calculateProgress(profile?.xp || 0)}%`,
                    backgroundColor: theme.colors.progressFill 
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <StatCard 
            iconName="fire" 
            colors={['#FF9500', '#E68500']} 
            value={stats.currentStreak} 
            label="Day Streak"
            theme={theme}
          />
          <StatCard 
            iconName="clock-outline" 
            colors={['#34C759', '#2AA24F']} 
            value={`${stats.totalHours}h`} 
            label="Total Hours"
            theme={theme}
          />
          <StatCard 
            iconName="trophy" 
            colors={['#5856D6', '#4A48C7']} 
            value={stats.completedChallenges} 
            label="Challenges"
            theme={theme}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Badges')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFD700' }]}>
              <Icon name="trophy" size={24} color="#FFF" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.secondaryText }]}>Badges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('LeaderboardTab')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
              <Icon name="podium" size={24} color="#FFF" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.secondaryText }]}>Leaderboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Classrooms')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#34C759' }]}>
              <Icon name="account-group" size={24} color="#FFF" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.secondaryText }]}>Groups</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Store')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF9500' }]}>
              <Icon name="shopping" size={24} color="#FFF" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.secondaryText }]}>Store</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Challenge */}
        <DailyChallengeCard 
          challenge={dailyChallenge} 
          onClaim={handleClaimDaily} 
          theme={theme} 
        />

        {/* Study Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Study Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('TimerTab')}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
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
                colors={['#AF52DE', '#8E44AD']}
                style={styles.actionGradient}
              >
                <Icon name="music-note" size={32} color="#FFF" />
                <Text style={styles.actionText}>Focus Music</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Challenges')}
            >
              <LinearGradient
                colors={['#FF9500', '#E68500']}
                style={styles.actionGradient}
              >
                <Icon name="target" size={32} color="#FFF" />
                <Text style={styles.actionText}>Challenges</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Goals')}
            >
              <LinearGradient
                colors={['#34C759', '#2AA24F']}
                style={styles.actionGradient}
              >
                <Icon name="calendar-check" size={32} color="#FFF" />
                <Text style={styles.actionText}>Goals</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Challenges */}
        <View style={styles.challengesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Active Challenges</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Challenges')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {challenges.length > 0 ? (
            challenges.map((challenge, index) => (
              <TouchableOpacity 
                key={challenge.id || index} 
                style={[styles.challengeCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.challenge_id })}
              >
                <View style={styles.challengeHeader}>
                  <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>{challenge.title}</Text>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: challenge.difficulty === 'hard' ? '#FF3B30' : 
                                     challenge.difficulty === 'medium' ? '#FF9500' : '#34C759' }
                  ]}>
                    <Text style={styles.difficultyText}>
                      {challenge.difficulty?.toUpperCase() || 'EASY'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.challengeDescription, { color: theme.colors.secondaryText }]}>
                  {challenge.description || 'No description'}
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={[styles.progressText, { color: theme.colors.secondaryText }]}>
                      {Math.min(challenge.current_minutes || 0, challenge.target_minutes)} / {challenge.target_minutes} mins
                    </Text>
                    <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                      {Math.round(((challenge.current_minutes || 0) / challenge.target_minutes) * 100)}%
                    </Text>
                  </View>
                  <View style={[styles.challengeProgressBar, { backgroundColor: theme.colors.progressBackground }]}>
                    <View 
                      style={[
                        styles.challengeProgressFill,
                        { 
                          width: `${Math.min(((challenge.current_minutes || 0) / challenge.target_minutes) * 100, 100)}%`,
                          backgroundColor: theme.colors.primary
                        }
                      ]} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyChallenges, { backgroundColor: theme.colors.card }]}>
              <Icon name="target" size={48} color={theme.colors.secondaryText} />
              <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>No active challenges</Text>
              <TouchableOpacity 
                style={[styles.browseButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Challenges')}
              >
                <Text style={styles.browseButtonText}>Browse Challenges</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Study Sessions */}
        {recentSessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Sessions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentSessions.map((session, index) => (
              <View key={session.id || index} style={[styles.sessionCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>{session.session_title || 'Study Session'}</Text>
                  <Text style={[styles.sessionDuration, { color: theme.colors.primary }]}>{session.duration_minutes} min</Text>
                </View>
                {session.subject && (
                  <Text style={[styles.sessionSubject, { color: theme.colors.secondaryText }]}>{session.subject}</Text>
                )}
                <Text style={[styles.sessionDate, { color: theme.colors.secondaryText }]}>
                  {new Date(session.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  fixedHeader: {
    paddingTop: Platform.OS === 'ios' ? 45 : 30,
    paddingHorizontal: 0, // Header component handles padding
    paddingBottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  welcomeSection: {
    borderRadius: 24,
    padding: 24,
    marginTop: -80,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencySection: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  currencyItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  levelInfo: {
    marginRight: 20,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  levelNumber: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  xpSection: {
    flex: 1,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '700',
  },
  nextLevelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    height: 110,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  challengesSection: {
    marginBottom: 24,
  },
  challengeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  challengeDescription: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
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
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  challengeProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sessionsSection: {
    marginBottom: 24,
  },
  sessionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  sessionDuration: {
    fontSize: 15,
    fontWeight: '700',
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyChallenges: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 20,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});