// src/screens/LeaderboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly'); // weekly, monthly, all-time
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, xp, total_study_time, current_streak, level')
        .order('xp', { ascending: false });

      // Apply timeframe filter
      if (timeframe === 'weekly') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startDate = startOfWeek.toISOString();
        
        // Get weekly XP from study sessions
        const { data: weeklyData } = await supabase
          .from('study_sessions')
          .select('user_id, duration')
          .gte('created_at', startDate)
          .eq('is_completed', true);

        // Calculate weekly XP (assuming 1 minute = 1 XP)
        const weeklyXP = {};
        weeklyData?.forEach(session => {
          if (!weeklyXP[session.user_id]) {
            weeklyXP[session.user_id] = 0;
          }
          weeklyXP[session.user_id] += Math.floor(session.duration / 60);
        });

        // Get all profiles and sort by weekly XP
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*');

        const sortedProfiles = allProfiles?.map(profile => ({
          ...profile,
          weekly_xp: weeklyXP[profile.id] || 0,
        })).sort((a, b) => b.weekly_xp - a.weekly_xp)
          .slice(0, 50);

        // Map to leaderboard format
        const rankedData = (sortedProfiles || []).map((item, index) => ({
          id: item.id,
          username: item.username,
          avatar_url: item.avatar_url,
          xp: item.weekly_xp,
          total_study_time: item.total_study_time,
          current_streak: item.current_streak,
          level: item.level,
          rank: index + 1,
          isCurrentUser: item.id === user.id,
        }));

        setLeaderboard(rankedData);
        
        // Find user's rank
        const userRankData = rankedData.find(item => item.id === user.id);
        setUserRank(userRankData);
      } else {
        // For monthly and all-time, use total XP
        const { data: leaderboardData } = await query.limit(50);
        
        const rankedData = (leaderboardData || []).map((item, index) => ({
          ...item,
          rank: index + 1,
          isCurrentUser: item.id === user.id,
        }));

        setLeaderboard(rankedData);
        
        // Find user's rank
        const userRankData = rankedData.find(item => item.id === user.id);
        setUserRank(userRankData);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const renderRankItem = ({ item, index }) => {
    const isTopThree = item.rank <= 3;
    
    return (
      <TouchableOpacity 
        style={[
          styles.rankItem,
          item.isCurrentUser && styles.currentUserItem,
        ]}
        onPress={() => {
          navigation.navigate('UserProfile', { userId: item.id });
        }}
      >
        <View style={styles.rankNumberContainer}>
          {isTopThree ? (
            <View style={[
              styles.topRankBadge,
              item.rank === 1 && styles.firstPlace,
              item.rank === 2 && styles.secondPlace,
              item.rank === 3 && styles.thirdPlace,
            ]}>
              <Icon 
                name="crown" 
                size={item.rank === 1 ? 24 : 20} 
                color={item.rank === 1 ? '#FFD700' : 
                       item.rank === 2 ? '#C0C0C0' : '#CD7F32'} 
              />
            </View>
          ) : (
            <Text style={[
              styles.rankNumber,
              item.rank <= 10 && styles.topTenRank,
              item.isCurrentUser && styles.currentUserRankNumber,
            ]}>
              #{item.rank}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          {item.avatar_url ? (
            <Image 
              source={{ uri: item.avatar_url }} 
              style={[
                styles.avatar,
                item.rank <= 3 && styles.topThreeAvatar,
              ]} 
            />
          ) : (
            <View style={[
              styles.avatarPlaceholder,
              item.rank <= 3 && styles.topThreeAvatar,
            ]}>
              <Icon 
                name="account" 
                size={item.rank <= 3 ? 24 : 20} 
                color={item.rank <= 3 ? "#FFF" : "#4A90E2"} 
              />
            </View>
          )}
          
          <View style={styles.userDetails}>
            <Text 
              style={[
                styles.username,
                item.isCurrentUser && styles.currentUsername,
              ]}
              numberOfLines={1}
            >
              {item.username}
              {item.isCurrentUser && (
                <Text style={styles.youLabel}> • You</Text>
              )}
            </Text>
            <Text style={styles.userLevel}>Level {item.level}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.statValue}>{item.xp?.toLocaleString() || 0} XP</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTopThree = () => {
    if (loading || leaderboard.length < 3) return null;

    return (
      <View style={styles.topThreeSection}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
        <View style={styles.topThreeContainer}>
          {/* Second Place */}
          {leaderboard[1] && (
            <TouchableOpacity 
              style={[styles.topThreeCard, styles.secondCard]}
              onPress={() => navigation.navigate('UserProfile', { userId: leaderboard[1].id })}
            >
              <View style={styles.topThreeRank}>
                <Icon name="crown" size={24} color="#C0C0C0" />
                <Text style={styles.topThreeRankNumber}>#2</Text>
              </View>
              
              <View style={styles.topThreeAvatar}>
                {leaderboard[1].avatar_url ? (
                  <Image 
                    source={{ uri: leaderboard[1].avatar_url }} 
                    style={styles.topThreeAvatarImage} 
                  />
                ) : (
                  <LinearGradient
                    colors={['#C0C0C0', '#A0A0A0']}
                    style={styles.topThreeAvatarPlaceholder}
                  >
                    <Icon name="account" size={30} color="#FFF" />
                  </LinearGradient>
                )}
              </View>
              
              <Text style={styles.topThreeUsername} numberOfLines={1}>
                {leaderboard[1].username}
              </Text>
              <Text style={styles.topThreeXP}>
                {leaderboard[1].xp?.toLocaleString() || 0} XP
              </Text>
            </TouchableOpacity>
          )}

          {/* First Place */}
          {leaderboard[0] && (
            <TouchableOpacity 
              style={[styles.topThreeCard, styles.firstCard]}
              onPress={() => navigation.navigate('UserProfile', { userId: leaderboard[0].id })}
            >
              <View style={styles.topThreeRank}>
                <Icon name="crown" size={28} color="#FFD700" />
                <Text style={styles.topThreeRankNumber}>#1</Text>
              </View>
              
              <View style={styles.topThreeAvatar}>
                {leaderboard[0].avatar_url ? (
                  <Image 
                    source={{ uri: leaderboard[0].avatar_url }} 
                    style={styles.topThreeAvatarImage} 
                  />
                ) : (
                  <LinearGradient
                    colors={['#FFD700', '#FFC400']}
                    style={styles.topThreeAvatarPlaceholder}
                  >
                    <Icon name="account" size={30} color="#FFF" />
                  </LinearGradient>
                )}
              </View>
              
              <Text style={styles.topThreeUsername} numberOfLines={1}>
                {leaderboard[0].username}
              </Text>
              <Text style={styles.topThreeXP}>
                {leaderboard[0].xp?.toLocaleString() || 0} XP
              </Text>
            </TouchableOpacity>
          )}

          {/* Third Place */}
          {leaderboard[2] && (
            <TouchableOpacity 
              style={[styles.topThreeCard, styles.thirdCard]}
              onPress={() => navigation.navigate('UserProfile', { userId: leaderboard[2].id })}
            >
              <View style={styles.topThreeRank}>
                <Icon name="crown" size={24} color="#CD7F32" />
                <Text style={styles.topThreeRankNumber}>#3</Text>
              </View>
              
              <View style={styles.topThreeAvatar}>
                {leaderboard[2].avatar_url ? (
                  <Image 
                    source={{ uri: leaderboard[2].avatar_url }} 
                    style={styles.topThreeAvatarImage} 
                  />
                ) : (
                  <LinearGradient
                    colors={['#CD7F32', '#B87333']}
                    style={styles.topThreeAvatarPlaceholder}
                  >
                    <Icon name="account" size={30} color="#FFF" />
                  </LinearGradient>
                )}
              </View>
              
              <Text style={styles.topThreeUsername} numberOfLines={1}>
                {leaderboard[2].username}
              </Text>
              <Text style={styles.topThreeXP}>
                {leaderboard[2].xp?.toLocaleString() || 0} XP
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Icon name="trophy" size={64} color="#CCC" />
        <Text style={styles.emptyStateTitle}>No Leaderboard Data</Text>
        <Text style={styles.emptyStateText}>
          Complete study sessions to appear on the leaderboard
        </Text>
        <TouchableOpacity 
          style={styles.startStudyingButton}
          onPress={() => navigation.navigate('StudyTimer')}
        >
          <Text style={styles.startStudyingText}>Start Studying</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTimeframeLabel = (time) => {
    switch(time) {
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'all-time': return 'All Time';
      default: return time;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.timeframeSubtitle}>
              {renderTimeframeLabel(timeframe)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadLeaderboard}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name="refresh" 
              size={24} 
              color="#FFF" 
              style={loading && styles.refreshIconLoading}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.timeframeSelector}>
          {['weekly', 'monthly', 'all-time'].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeframeButton,
                timeframe === time && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(time)}
            >
              <Text style={[
                styles.timeframeText,
                timeframe === time && styles.timeframeTextActive,
              ]}>
                {renderTimeframeLabel(time)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {userRank && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.userRankCard}
          >
            <View style={styles.userRankInfo}>
              <Text style={styles.userRankLabel}>Your Rank</Text>
              <Text style={styles.userRankNumber}>#{userRank.rank || '--'}</Text>
              <Text style={styles.userRankUsername}>{userRank.username}</Text>
            </View>
            
            <View style={styles.userStats}>
              <View style={styles.userStatItem}>
                <Text style={styles.userStatValue}>{userRank.xp?.toLocaleString() || 0}</Text>
                <Text style={styles.userStatLabel}>XP</Text>
              </View>
              <View style={styles.userStatDivider} />
              <View style={styles.userStatItem}>
                <Text style={styles.userStatValue}>{userRank.level || 1}</Text>
                <Text style={styles.userStatLabel}>Level</Text>
              </View>
              <View style={styles.userStatDivider} />
              <View style={styles.userStatItem}>
                <Text style={styles.userStatValue}>{userRank.current_streak || 0}</Text>
                <Text style={styles.userStatLabel}>Streak</Text>
              </View>
            </View>
          </LinearGradient>
        )}
      </LinearGradient>

      {loading && leaderboard.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard.slice(3)} // Skip top 3 for the main list
          renderItem={renderRankItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderTopThree}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={() => (
            leaderboard.length > 0 && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Showing {Math.min(leaderboard.length, 50)} of {leaderboard.length} users
                </Text>
              </View>
            )
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  timeframeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 4,
  },
  refreshIconLoading: {
    opacity: 0.5,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#FFF',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeframeTextActive: {
    color: '#4A90E2',
  },
  userRankCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userRankInfo: {
    flex: 1,
  },
  userRankLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userRankNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userRankUsername: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  userStatItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  userStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  userStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  listContent: {
    paddingBottom: 20,
  },
  topThreeSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  topThreeCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '32%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  firstCard: {
    height: 180,
    marginBottom: 0,
  },
  secondCard: {
    height: 160,
    marginBottom: 20,
  },
  thirdCard: {
    height: 160,
    marginBottom: 20,
  },
  topThreeRank: {
    alignItems: 'center',
    marginBottom: 12,
  },
  topThreeRankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  topThreeAvatar: {
    marginBottom: 12,
  },
  topThreeAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  topThreeAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topThreeUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    textAlign: 'center',
  },
  topThreeXP: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: '#E8F2FF',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  rankNumberContainer: {
    width: 40,
    alignItems: 'center',
  },
  topRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  firstPlace: {
    backgroundColor: '#FFF8E1',
  },
  secondPlace: {
    backgroundColor: '#F5F5F5',
  },
  thirdPlace: {
    backgroundColor: '#FEF3E2',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  topTenRank: {
    color: '#4A90E2',
    fontWeight: '700',
  },
  currentUserRankNumber: {
    color: '#4A90E2',
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  topThreeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  currentUsername: {
    fontWeight: '600',
  },
  youLabel: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '400',
  },
  userLevel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startStudyingButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startStudyingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default LeaderboardScreen;