import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useChallenges } from '../hooks/useChallenges';
import { useProfile } from '../hooks/useProfile';
import { useRealtime } from '../hooks/useRealtime';
import ScreenHeader from '../components/common/ScreenHeader';

const { width } = Dimensions.get('window');

export default function Challenges({ navigation }) {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'available'

  // Data hooks
  const { 
    challenges, 
    dailyChallenge, 
    availableChallenges, 
    isLoading, 
    joinChallenge, 
    isJoining,
    claimDaily,
    isClaiming,
    completeChallenge,
    isCompleting,
    refetch 
  } = useChallenges();

  const { profile } = useProfile();
  
  // Real-time sync
  useRealtime();

  const handleClaimDaily = () => {
    if (!dailyChallenge || !profile) return;
    claimDaily({ dailyChallenge, currentProfile: profile }, {
      onSuccess: () => {
        Alert.alert('Success', 'Daily rewards claimed! 🎉');
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Failed to claim rewards');
      }
    });
  };

  const handleJoinChallenge = (challengeId) => {
    joinChallenge(challengeId, {
      onSuccess: () => {
        Alert.alert('Success', 'You have joined the challenge! 🚀');
        setActiveTab('active');
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Failed to join challenge');
      }
    });
  };

  const handleCompleteChallenge = (userChallengeId, coinReward, xpReward) => {
    completeChallenge({ userChallengeId, coinReward, xpReward }, {
      onSuccess: () => {
        Alert.alert('Success', 'Rewards claimed successfully! 🏆');
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Failed to claim rewards');
      }
    });
  };

  const onRefresh = async () => {
    await refetch();
  };

  const ChallengeCard = ({ challenge, type }) => {
    const isReadyToClaim = (challenge.current_minutes >= challenge.target_minutes) && !challenge.is_completed;
    const progress = Math.min((challenge.current_minutes || 0) / (challenge.target_minutes || 60), 1);
    const difficultyColor = getDifficultyColor(challenge.difficulty);

    return (
      <View style={[styles.challengeCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '15' }]}>
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {challenge.difficulty?.toUpperCase() || 'EASY'}
            </Text>
          </View>
          <View style={styles.rewardBox}>
            <View style={styles.rewardItem}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={[styles.rewardText, { color: theme.colors.text }]}>+{challenge.xp_reward}</Text>
            </View>
            <View style={styles.rewardItem}>
              <Icon name="cash" size={12} color="#34C759" />
              <Text style={[styles.rewardText, { color: theme.colors.text }]}>+{challenge.coins_reward}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>{challenge.title}</Text>
        <Text style={[styles.challengeDesc, { color: theme.colors.secondaryText }]} numberOfLines={2}>
          {challenge.description}
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: theme.colors.secondaryText }]}>
              {Math.min(challenge.current_minutes || 0, challenge.target_minutes)} / {challenge.target_minutes} mins
            </Text>
            <Text style={[styles.percentText, { color: theme.colors.primary }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.progressBackground }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.colors.primary }]} />
          </View>
        </View>

        {type === 'available' ? (
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleJoinChallenge(challenge.id)}
            disabled={isJoining}
          >
            {isJoining ? <ActivityIndicator color="#FFF" /> : (
              <View style={styles.btnRow}>
                <Icon name="plus-circle" size={18} color="#FFF" />
                <Text style={styles.joinButtonText}>Join Challenge</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.statusSection}>
            {isReadyToClaim ? (
              <TouchableOpacity 
                style={[styles.claimRewardBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleCompleteChallenge(challenge.id, challenge.coins_reward, challenge.xp_reward)}
                disabled={isCompleting}
              >
                {isCompleting ? <ActivityIndicator color="#FFF" /> : (
                  <View style={styles.btnRow}>
                    <Icon name="trophy" size={18} color="#FFF" />
                    <Text style={styles.claimRewardText}>Claim Rewards</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              challenge.is_completed ? (
                <View style={[styles.completedBadge, { backgroundColor: '#34C75915' }]}>
                  <Icon name="check-decagram" size={20} color="#34C759" />
                  <Text style={styles.completedText}>Earned!</Text>
                </View>
              ) : (
                <View style={[styles.activeBadge, { backgroundColor: theme.colors.primary + '10' }]}>
                  <Icon name="clock-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.activeText, { color: theme.colors.primary }]}>Keep going!</Text>
                </View>
              )
            )}
          </View>
        )}
      </View>
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'hard': return '#FF3B30';
      case 'medium': return '#FF9500';
      default: return '#34C759';
    }
  };

  if (isLoading && !challenges.length) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScreenHeader 
        title="Study Challenges" 
        onBack={() => navigation.goBack()} 
        theme={theme} 
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { minHeight: '100%', paddingBottom: 140 }]}
        nestedScrollEnabled={true}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {/* Daily Challenge Card - Featured */}
        {dailyChallenge && (
          <View style={[styles.dailyCard, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.dailyHeader}>
              <View>
                <Text style={styles.dailyBadge}>DAILY GOAL</Text>
                <Text style={styles.dailyTitle}>{dailyChallenge.title}</Text>
              </View>
              <Icon name="star-circle" size={40} color="#FFD700" />
            </View>
            
            <Text style={styles.dailyDesc}>{dailyChallenge.description}</Text>
            
            <View style={styles.dailyProgressContainer}>
              <View style={styles.dailyProgressHeader}>
                <Text style={styles.dailyProgressText}>
                  {dailyChallenge.current_minutes} / {dailyChallenge.target_minutes} mins
                </Text>
                <Text style={styles.dailyProgressText}>
                  {Math.round(Math.min(dailyChallenge.current_minutes / dailyChallenge.target_minutes, 1) * 100)}%
                </Text>
              </View>
              <View style={styles.dailyProgressBar}>
                <View style={[styles.dailyProgressFill, { width: `${Math.min(dailyChallenge.current_minutes / dailyChallenge.target_minutes, 1) * 100}%` }]} />
              </View>
            </View>

            {dailyChallenge.current_minutes >= dailyChallenge.target_minutes && !dailyChallenge.is_completed ? (
              <TouchableOpacity style={styles.claimButton} onPress={handleClaimDaily} disabled={isClaiming}>
                {isClaiming ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={[styles.claimButtonText, { color: theme.colors.primary }]}>Claim Rewards</Text>}
              </TouchableOpacity>
            ) : dailyChallenge.is_completed ? (
              <View style={styles.alreadyClaimed}>
                <Icon name="check-decagram" size={20} color="#FFF" />
                <Text style={styles.alreadyClaimedText}>Rewards Claimed</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'active' ? theme.colors.primary : theme.colors.secondaryText }]}>
              My Challenges ({challenges.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'available' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'available' ? theme.colors.primary : theme.colors.secondaryText }]}>
              Explore ({availableChallenges.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        <View style={styles.listContainer}>
          {activeTab === 'active' ? (
            challenges.length > 0 ? (
              challenges.map(c => <ChallengeCard key={c.id} challenge={c} type="active" />)
            ) : (
              <View style={styles.emptyState}>
                <Icon name="target" size={60} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No active challenges</Text>
                <Text style={[styles.emptyDesc, { color: theme.colors.secondaryText }]}>Join a challenge from the Explore tab to start earning rewards.</Text>
                <TouchableOpacity style={[styles.exploreBtn, { borderColor: theme.colors.primary }]} onPress={() => setActiveTab('available')}>
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Explore Challenges</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            availableChallenges.length > 0 ? (
              availableChallenges.map(c => <ChallengeCard key={c.id} challenge={c} type="available" />)
            ) : (
              <View style={styles.emptyState}>
                <Icon name="rocket-launch" size={60} color={theme.colors.border} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>All caught up!</Text>
                <Text style={[styles.emptyDesc, { color: theme.colors.secondaryText }]}>Check back later for new study challenges.</Text>
              </View>
            )
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16 },
  // Daily Card
  dailyCard: { borderRadius: 24, padding: 24, marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  dailyBadge: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  dailyTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  dailyDesc: { color: '#FFF', opacity: 0.9, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  dailyProgressContainer: { marginBottom: 20 },
  dailyProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dailyProgressText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  dailyProgressBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' },
  dailyProgressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 5 },
  claimButton: { backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  claimButtonText: { fontWeight: 'bold', fontSize: 16 },
  alreadyClaimed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  alreadyClaimedText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  // Tabs
  tabContainer: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15, fontWeight: '600' },
  // Challenge Card
  challengeCard: { borderRadius: 20, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  difficultyText: { fontSize: 10, fontWeight: 'bold' },
  rewardBox: { flexDirection: 'row', gap: 10 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { fontSize: 13, fontWeight: 'bold' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  challengeDesc: { fontSize: 13, marginBottom: 16 },
  progressSection: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, fontWeight: '500' },
  percentText: { fontSize: 12, fontWeight: 'bold' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  joinButton: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  joinButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  claimRewardBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  claimRewardText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  statusSection: {  },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, justifyContent: 'center' },
  completedText: { color: '#34C759', fontWeight: 'bold', fontSize: 14 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, justifyContent: 'center' },
  activeText: { fontWeight: 'bold', fontSize: 14 },
  // Empty State
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  exploreBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
});