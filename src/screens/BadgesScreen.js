import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useBadges } from '../hooks/useBadges';
import { useProfile } from '../hooks/useProfile';
import { useRealtime } from '../hooks/useRealtime';
import ScreenHeader from '../components/common/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const BadgesScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Unified hooks for data management
  const { profile } = useProfile();
  const { badges, earnedBadges, isLoading, refetch } = useBadges();
  
  // Real-time updates for achievements
  useRealtime();

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(badges.map(b => b.category)));
    const sortedCats = uniqueCats.sort();
    return ['All', ...sortedCats];
  }, [badges]);

  const stats = useMemo(() => ({
    earnedCount: earnedBadges.length,
    totalCount: badges.length,
    percentage: badges.length > 0 ? Math.round((earnedBadges.length / badges.length) * 100) : 0,
    legendaryCount: earnedBadges.filter(eb => eb.badges?.rarity === 'legendary').length
  }), [badges, earnedBadges]);

  const filteredBadges = useMemo(() => {
    let list = badges;
    if (selectedCategory !== 'All') {
      list = badges.filter(b => b.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    // Sort so earned badges come first, then by rarity/requirement
    return [...list].sort((a, b) => {
      const aEarned = earnedBadges.some(eb => eb.badge_id === a.id);
      const bEarned = earnedBadges.some(eb => eb.badge_id === b.id);
      if (aEarned !== bEarned) return aEarned ? -1 : 1;
      return a.requirement - b.requirement;
    });
  }, [badges, selectedCategory, earnedBadges]);

  const calculateProgress = useCallback((badge) => {
    const isEarned = earnedBadges.some(eb => eb.badge_id === badge.id);
    if (isEarned) return 100;

    const requirement = badge.requirement || 0;
    if (requirement <= 0) return 0;

    switch (badge.category?.toLowerCase()) {
      case 'streak': 
        return Math.min(((profile?.current_streak || 0) / requirement) * 100, 100);
      case 'time': 
        return Math.min(((profile?.total_study_time || 0) / requirement) * 100, 100);
      case 'sessions': 
        return Math.min(((profile?.completed_sessions || 0) / requirement) * 100, 100);
      case 'challenges': 
        return Math.min(((profile?.completed_challenges || 0) / requirement) * 100, 100);
      case 'level':
        return Math.min(((profile?.level || 1) / requirement) * 100, 100);
      case 'xp':
        return Math.min(((profile?.xp || 0) / requirement) * 100, 100);
      default: 
        return 0;
    }
  }, [earnedBadges, profile]);

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#AF52DE';
      case 'rare': return '#5AC8FA';
      case 'uncommon': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const handleBadgePress = (badge) => {
    setSelectedBadge(badge);
    setShowDetailModal(true);
  };

  const renderBadgeItem = ({ item }) => {
    const earnedData = earnedBadges.find(eb => eb.badge_id === item.id);
    const isEarned = !!earnedData;
    const progress = calculateProgress(item);
    const rarityColor = getRarityColor(item.rarity);
    
    return (
      <TouchableOpacity 
        style={[styles.badgeCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleBadgePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: isEarned ? rarityColor + '15' : theme.colors.background }]}>
          <Text style={[styles.emoji, !isEarned && { opacity: 0.4, grayscale: 1 }]}>{item.icon}</Text>
          {!isEarned && (
            <View style={styles.lockBadge}>
              <Icon name="lock" size={14} color={theme.colors.secondaryText} />
            </View>
          )}
        </View>

        <View style={styles.badgeInfo}>
          <View style={styles.badgeHeader}>
            <Text style={[styles.badgeName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
            {isEarned && <Icon name="check-decagram" size={18} color={theme.colors.primary} />}
          </View>
          
          <Text style={[styles.badgeDescription, { color: theme.colors.secondaryText }]} numberOfLines={1}>
            {isEarned ? 'Achievement unlocked!' : item.description}
          </Text>
          
          {!isEarned ? (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.progressBackground }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
              </View>
              <Text style={[styles.progressVal, { color: theme.colors.secondaryText }]}>{Math.round(progress)}%</Text>
            </View>
          ) : (
            <Text style={[styles.earnedDate, { color: theme.colors.primary }]}>
              Earned on {new Date(earnedData.earned_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.border} />
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedBadge) return null;
    const earnedData = earnedBadges.find(eb => eb.badge_id === selectedBadge.id);
    const isEarned = !!earnedData;
    const rarityColor = getRarityColor(selectedBadge.rarity);
    const progress = calculateProgress(selectedBadge);

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
              colors={[rarityColor + '20', theme.colors.background]}
              style={styles.modalHeader}
            >
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setShowDetailModal(false)}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              
              <View style={[styles.largeIconBox, { backgroundColor: isEarned ? rarityColor + '30' : theme.colors.card }]}>
                <Text style={styles.largeEmoji}>{selectedBadge.icon}</Text>
              </View>
              
              <Text style={[styles.modalBadgeName, { color: theme.colors.text }]}>{selectedBadge.name}</Text>
              <View style={[styles.modalRarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.modalRarityText}>{selectedBadge.rarity?.toUpperCase()}</Text>
              </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
                <Text style={[styles.sectionText, { color: theme.colors.secondaryText }]}>
                  {selectedBadge.description}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Status</Text>
                {isEarned ? (
                  <View style={[styles.statusCard, { backgroundColor: theme.colors.card }]}>
                    <Icon name="trophy-outline" size={32} color={rarityColor} />
                    <View style={styles.statusInfo}>
                      <Text style={[styles.statusTitle, { color: theme.colors.text }]}>Earned!</Text>
                      <Text style={[styles.statusSub, { color: theme.colors.secondaryText }]}>
                        You unlocked this on {new Date(earnedData.earned_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.statusCard, { backgroundColor: theme.colors.card }]}>
                    <Icon name="lock-outline" size={32} color={theme.colors.secondaryText} />
                    <View style={styles.statusInfo}>
                      <Text style={[styles.statusTitle, { color: theme.colors.text }]}>In Progress</Text>
                      <Text style={[styles.statusSub, { color: theme.colors.secondaryText }]}>
                        Complete {selectedBadge.requirement} {selectedBadge.category.toLowerCase()} to unlock.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {(selectedBadge.coins_reward > 0 || selectedBadge.gems_reward > 0) && (
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Rewards</Text>
                  <View style={styles.rewardsRowLarge}>
                    {selectedBadge.coins_reward > 0 && (
                      <View style={[styles.rewardItemBox, { backgroundColor: theme.colors.card }]}>
                        <Icon name="cash" size={24} color="#FFD700" />
                        <Text style={[styles.rewardValueText, { color: theme.colors.text }]}>{selectedBadge.coins_reward}</Text>
                        <Text style={[styles.rewardLabelText, { color: theme.colors.secondaryText }]}>Coins</Text>
                      </View>
                    )}
                    {selectedBadge.gems_reward > 0 && (
                      <View style={[styles.rewardItemBox, { backgroundColor: theme.colors.card }]}>
                        <Icon name="diamond" size={24} color="#5AC8FA" />
                        <Text style={[styles.rewardValueText, { color: theme.colors.text }]}>{selectedBadge.gems_reward}</Text>
                        <Text style={[styles.rewardLabelText, { color: theme.colors.secondaryText }]}>Gems</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {!isEarned && (
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Progress</Text>
                  <View style={[styles.modalProgressBar, { backgroundColor: theme.colors.progressBackground }]}>
                    <View style={[styles.modalProgressFill, { width: `${progress}%`, backgroundColor: rarityColor }]} />
                  </View>
                  <Text style={[styles.modalProgressText, { color: rarityColor }]}>
                    {Math.round(progress)}% Complete
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && !badges.length) {
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
        title="Achievements" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />

      <View style={[styles.statsHeader, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: theme.colors.text }]}>{stats.earnedCount}</Text>
            <Text style={styles.statLabel}>EARNED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: '#FFD700' }]}>{stats.legendaryCount}</Text>
            <Text style={[styles.statLabel, { color: '#FFD700' }]}>LEGENDARY</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: theme.colors.primary }]}>{stats.percentage}%</Text>
            <Text style={styles.statLabel}>COMPLETE</Text>
          </View>
        </View>
      </View>

      <View style={[styles.categoryBox, { backgroundColor: theme.colors.card }]}>
        <FlatList 
          horizontal showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.catBtn, 
                selectedCategory === item && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catText, { color: selectedCategory === item ? '#FFF' : theme.colors.secondaryText }]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(i) => i}
          contentContainerStyle={{ paddingRight: 20 }}
        />
      </View>

      <FlatList
        data={filteredBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="medal-outline" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>No badges found in this category.</Text>
          </View>
        }
      />

      {renderDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginTop: -20,
    zIndex: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#8E8E93', fontSize: 10, fontWeight: 'bold', marginTop: 4, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 35, backgroundColor: 'rgba(0,0,0,0.08)' },
  categoryBox: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  catBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginLeft: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  catText: { fontSize: 14, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  emoji: { fontSize: 26 },
  lockBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#FFF', borderRadius: 10, padding: 3, elevation: 2 },
  badgeInfo: { flex: 1, marginRight: 8 },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  badgeName: { fontWeight: 'bold', fontSize: 16, flex: 1 },
  badgeDescription: { fontSize: 13, marginBottom: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressVal: { fontSize: 11, fontWeight: 'bold', width: 35 },
  earnedDate: { fontSize: 11, fontWeight: '600' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: '500' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: height * 0.8, borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { alignItems: 'center', padding: 30, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 20, right: 20, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)' },
  largeIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  largeEmoji: { fontSize: 50 },
  modalBadgeName: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalRarityBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  modalRarityText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  modalScroll: { padding: 24 },
  modalSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sectionText: { fontSize: 15, lineHeight: 22 },
  statusCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, gap: 16 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  statusSub: { fontSize: 13 },
  modalProgressBar: { height: 12, borderRadius: 6, marginBottom: 10, overflow: 'hidden' },
  modalProgressFill: { height: '100%', borderRadius: 6 },
  modalProgressText: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  rewardsRowLarge: { flexDirection: 'row', gap: 16 },
  rewardItemBox: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  rewardValueText: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  rewardLabelText: { fontSize: 12, fontWeight: 'bold' },
  doneBtn: { marginHorizontal: 24, padding: 20, borderRadius: 20, alignItems: 'center' },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default BadgesScreen;
