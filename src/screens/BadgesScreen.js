import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useBadges } from '../hooks/useBadges';
import { useProfile } from '../hooks/useProfile';
import { useRealtime } from '../hooks/useRealtime';

const BadgesScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Unified hooks for data management
  const { profile } = useProfile();
  const { badges, earnedBadges, isLoading, refetch } = useBadges();
  
  // Real-time updates for achievements
  useRealtime();

  const categories = ['All', 'Streak', 'Time', 'Sessions', 'Subject', 'Special'];

  const stats = useMemo(() => ({
    earnedCount: earnedBadges.length,
    totalCount: badges.length,
    percentage: badges.length > 0 ? Math.round((earnedBadges.length / badges.length) * 100) : 0,
    legendaryCount: earnedBadges.filter(eb => eb.badges?.rarity === 'legendary').length
  }), [badges, earnedBadges]);

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'All') return badges;
    return badges.filter(b => b.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [badges, selectedCategory]);

  const calculateProgress = (badge) => {
    const isEarned = earnedBadges.some(eb => eb.badge_id === badge.id);
    if (isEarned) return 100;

    switch (badge.category.toLowerCase()) {
      case 'streak': return Math.min(((profile?.current_streak || 0) / badge.requirement) * 100, 100);
      case 'time': return Math.min(((profile?.total_study_time || 0) / badge.requirement) * 100, 100);
      case 'sessions': return Math.min(((profile?.completed_sessions || 0) / badge.requirement) * 100, 100);
      default: return 0;
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

  const renderBadgeItem = ({ item }) => {
    const isEarned = earnedBadges.some(eb => eb.badge_id === item.id);
    const progress = calculateProgress(item);
    const rarityColor = getRarityColor(item.rarity);
    
    return (
      <TouchableOpacity 
        style={[styles.badgeCard, { backgroundColor: theme.colors.card }]}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: isEarned ? rarityColor + '20' : theme.colors.background }]}>
          <Text style={styles.emoji}>{item.icon}</Text>
          {!isEarned && <View style={styles.lock}><Icon name="lock" size={16} color={theme.colors.secondaryText} /></View>}
        </View>

        <View style={styles.badgeInfo}>
          <View style={styles.badgeHeader}>
            <Text style={[styles.badgeName, { color: theme.colors.text }]}>{item.name}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.badgeDescription, { color: theme.colors.secondaryText }]} numberOfLines={2}>{item.description}</Text>
          
          {!isEarned && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} /></View>
              <Text style={[styles.progressVal, { color: theme.colors.secondaryText }]}>{Math.round(progress)}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.earnedCount}</Text><Text style={styles.statLabel}>EARNED</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.legendaryCount}</Text><Text style={[styles.statLabel, { color: '#FFD700' }]}>LEGENDARY</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.percentage}%</Text><Text style={styles.statLabel}>COMPLETE</Text></View>
        </View>
      </View>

      <View style={styles.categoryBox}>
        <FlatList 
          horizontal showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.catBtn, selectedCategory === item && { backgroundColor: theme.colors.primary }]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catText, { color: selectedCategory === item ? '#FFF' : theme.colors.secondaryText }]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(i) => i}
        />
      </View>

      <FlatList
        data={filteredBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 10 },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  categoryBox: { paddingVertical: 16 },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginLeft: 16, borderImplicit: 1, borderColor: 'rgba(0,0,0,0.05)' },
  catText: { fontSize: 13, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 40 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  iconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  emoji: { fontSize: 28 },
  lock: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  badgeInfo: { flex: 1 },
  badgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badgeName: { fontWeight: 'bold', fontSize: 16 },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  rarityText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  badgeDescription: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressVal: { fontSize: 10, fontWeight: 'bold', width: 30 },
});

export default BadgesScreen;