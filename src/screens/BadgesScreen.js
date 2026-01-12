// src/screens/BadgesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';

const BadgesScreen = ({ navigation }) => {
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userStats, setUserStats] = useState({
    totalStudyTime: 0,
    currentStreak: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    loadBadges();
    loadUserStats();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('requirement', { ascending: true });

      if (badgesError) throw badgesError;

      // Get user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      setBadges(allBadges || []);
      setEarnedBadges(userBadges?.map(b => b.badge_id) || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for stats
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_study_time, current_streak')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get total completed sessions
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      setUserStats({
        totalStudyTime: profile?.total_study_time || 0,
        currentStreak: profile?.current_streak || 0,
        completedSessions: sessionsCount || 0,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9B30FF';
      case 'rare': return '#4A90E2';
      default: return '#34C759';
    }
  };

  const getRarityLabel = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'Legendary';
      case 'epic': return 'Epic';
      case 'rare': return 'Rare';
      default: return 'Common';
    }
  };

  const getCategoryBadges = () => {
    if (selectedCategory === 'All') return badges;
    return badges.filter(badge => badge.category.toLowerCase() === selectedCategory.toLowerCase());
  };

  const calculateProgress = (badge) => {
    switch (badge.category) {
      case 'streak':
        return Math.min((userStats.currentStreak / badge.requirement) * 100, 100);
      case 'time':
        return Math.min((userStats.totalStudyTime / badge.requirement) * 100, 100);
      case 'subject':
        // For subject badges, we'd need to track subject-specific sessions
        return 0;
      case 'special':
        // Special badges have different requirements
        return 0;
      default:
        return 0;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'streak': return 'fire';
      case 'time': return 'clock-outline';
      case 'subject': return 'book-open-page-variant';
      case 'special': return 'star';
      default: return 'trophy';
    }
  };

  const categories = ['All', 'Streak', 'Time', 'Subject', 'Special'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredBadges = getCategoryBadges();
  const earnedCount = earnedBadges.length;
  const totalCount = badges.length;
  const legendaryCount = badges.filter(b => earnedBadges.includes(b.id) && b.rarity === 'legendary').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerRight}>
          <Text style={styles.badgeCount}>
            {earnedCount}/{totalCount}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <Icon name="trophy" size={32} color="#FFF" />
              <Text style={styles.statValue}>{earnedCount}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Icon name="crown" size={32} color="#FFD700" />
              <Text style={styles.statValue}>{legendaryCount}</Text>
              <Text style={styles.statLabel}>Legendary</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Icon name="progress-check" size={32} color="#FFF" />
              <Text style={styles.statValue}>
                {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity 
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Icon 
                  name={getCategoryIcon(category)} 
                  size={20} 
                  color={selectedCategory === category ? '#4A90E2' : '#8E8E93'} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Badges Grid */}
        <View style={styles.badgesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All Badges' : `${selectedCategory} Badges`}
            </Text>
            <Text style={styles.badgesCount}>
              {filteredBadges.length} total
            </Text>
          </View>

          {filteredBadges.length > 0 ? (
            filteredBadges.map((badge) => {
              const isEarned = earnedBadges.includes(badge.id);
              const progress = calculateProgress(badge);
              
              return (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={[
                    styles.badgeIconContainer,
                    { backgroundColor: isEarned ? getRarityColor(badge.rarity) + '20' : '#F2F2F7' }
                  ]}>
                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                    {!isEarned && (
                      <View style={styles.lockedOverlay}>
                        <Icon name="lock" size={20} color="#8E8E93" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.badgeInfo}>
                    <View style={styles.badgeHeader}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <View style={[
                        styles.rarityBadge,
                        { backgroundColor: getRarityColor(badge.rarity) }
                      ]}>
                        <Text style={styles.rarityText}>
                          {getRarityLabel(badge.rarity)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                    
                    <View style={styles.badgeRewards}>
                      <View style={styles.rewardItem}>
                        <Icon name="coin" size={16} color="#FFD700" />
                        <Text style={styles.rewardText}>+{badge.coins_reward}</Text>
                      </View>
                      {badge.gems_reward > 0 && (
                        <View style={styles.rewardItem}>
                          <Icon name="diamond" size={16} color="#5AC8FA" />
                          <Text style={styles.rewardText}>+{badge.gems_reward}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        {badge.category === 'time' 
                          ? `${userStats.totalStudyTime}/${badge.requirement} minutes`
                          : badge.category === 'streak'
                          ? `${userStats.currentStreak}/${badge.requirement} days`
                          : `Requirement: ${badge.requirement}`
                        }
                      </Text>
                      {!isEarned && progress > 0 && (
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill,
                              { width: `${progress}%` }
                            ]} 
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {isEarned ? (
                    <View style={styles.earnedBadge}>
                      <Icon name="check-circle" size={24} color="#34C759" />
                    </View>
                  ) : (
                    <View style={styles.lockedBadge}>
                      <Icon name="lock" size={20} color="#8E8E93" />
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Icon name="trophy-outline" size={64} color="#E5E5EA" />
              <Text style={styles.emptyStateTitle}>No badges found</Text>
              <Text style={styles.emptyStateText}>
                No badges available in {selectedCategory.toLowerCase()} category
              </Text>
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>How to earn badges?</Text>
          <View style={styles.helpTips}>
            <View style={styles.tipItem}>
              <Icon name="fire" size={20} color="#FF9500" />
              <Text style={styles.tipText}>Maintain study streaks</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="clock-outline" size={20} color="#4A90E2" />
              <Text style={styles.tipText}>Study more hours</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="star" size={20} color="#FFD700" />
              <Text style={styles.tipText}>Complete special challenges</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="book-open" size={20} color="#34C759" />
              <Text style={styles.tipText}>Study different subjects</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  badgeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    padding: 20,
  },
  statsGradient: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  categoryButtonActive: {
    backgroundColor: '#4A90E210',
    borderColor: '#4A90E2',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#4A90E2',
  },
  badgesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgesCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  badgeEmoji: {
    fontSize: 28,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
    marginRight: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  badgeRewards: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  rewardText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  earnedBadge: {
    marginLeft: 12,
  },
  lockedBadge: {
    marginLeft: 12,
    opacity: 0.5,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  helpTips: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginLeft: 12,
    flex: 1,
  },
});

export default BadgesScreen;