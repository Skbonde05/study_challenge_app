import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, Image, ActivityIndicator,  } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRealtime } from '../hooks/useRealtime';
import ScreenHeader from '../components/common/ScreenHeader';

const LeaderboardScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [timeframe, setTimeframe] = useState('weekly');
  
  // Custom hook for infinite loading and rank synchronization
  const {
    leaderboardItems,
    myRank,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  } = useLeaderboard(timeframe);

  // Synchronize with external changes (like our own XP updates)
  useRealtime();

  const renderRankItem = ({ item }) => {
    // Top 3 are handled by Header
    if (item.rank <= 3) return null;

    const isTopTen = item.rank <= 10;
    const isCurrentUser = myRank?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.rankItem, { backgroundColor: theme.colors.card }, isCurrentUser && { borderColor: theme.colors.primary, borderWidth: 1 }]}
        activeOpacity={0.7}
      >
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, isTopTen && { color: theme.colors.primary, fontWeight: 'bold' }]}>#{item.rank}</Text>
        </View>

        <View style={styles.avatarBox}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.border }]}><Icon name="account" size={20} color={theme.colors.secondaryText} /></View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.colors.text }]} numberOfLines={1}>{item.username} {isCurrentUser && ' (You)'}</Text>
          <Text style={[styles.level, { color: theme.colors.secondaryText }]}>Lvl {item.level || 1} • {item.current_streak} Day Streak</Text>
        </View>

        <View style={styles.xpBox}>
          <Icon name="star-face" size={14} color="#FFD700" />
          <Text style={[styles.xpText, { color: theme.colors.text }]}>{item.xp?.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTopThree = () => {
    const topThree = leaderboardItems.slice(0, 3);
    if (!topThree.length) return null;

    return (
      <View style={styles.topThreeContainer}>
        {[1, 0, 2].map((idx) => {
          const user = topThree[idx];
          if (!user) return <View key={idx} style={styles.topThreeCardEmpty} />;
          
          const isFirst = user.rank === 1;
          const cardHeight = isFirst ? 190 : 160;

          return (
            <View key={user.id} style={[styles.topThreeCard, { height: cardHeight }]}>
              <View style={styles.topThreeBadge}>
                <Icon name="crown" size={isFirst ? 28 : 20} color={isFirst ? "#FFD700" : user.rank === 2 ? "#C4C4C4" : "#CD7F32"} />
              </View>
              <View style={styles.topThreeAvatarBox}>
                <Image source={{ uri: user.avatar_url || 'https://via.placeholder.com/100' }} style={[styles.topThreeAvatar, isFirst && { width: 80, height: 80, borderRadius: 40, borderColor: '#FFD700' }]} />
              </View>
              <Text style={[styles.topThreeUser, { color: theme.colors.text }]} numberOfLines={1}>{user.username}</Text>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 13 }}>{user.xp?.toLocaleString()} XP</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const timeframeLabels = { weekly: 'Weekly', monthly: 'Monthly', 'all-time': 'All Time' };

  if (isLoading && !leaderboardItems.length) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScreenHeader 
        title="Leaderboard" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />

      <View style={[styles.statsHeader, { backgroundColor: theme.colors.card }]}>
        {/* Timeframe Selector */}
        <View style={[styles.timeframeBox, { backgroundColor: theme.colors.background }]}>
          {Object.keys(timeframeLabels).map(key => (
            <TouchableOpacity 
              key={key} 
              style={[styles.timeBtn, timeframe === key && styles.timeBtnActive]} 
              onPress={() => setTimeframe(key)}
            >
              <Text style={[styles.timeText, timeframe === key ? { color: theme.colors.primary } : { color: theme.colors.secondaryText }]}>
                {timeframeLabels[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Rank Summary */}
        {myRank && (
          <View style={[styles.userSummary, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.userRankBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.userRankNo}>#{myRank.rank}</Text>
            </View>
            <View style={styles.userCol}>
              <Text style={[styles.userLabel, { color: theme.colors.secondaryText }]}>YOUR RANK</Text>
              <Text style={[styles.userVal, { color: theme.colors.text }]}>{myRank.xp?.toLocaleString()} XP</Text>
            </View>
            <View style={[styles.userDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.userCol}>
              <Text style={[styles.userLabel, { color: theme.colors.secondaryText }]}>STREAK</Text>
              <Text style={[styles.userVal, { color: theme.colors.text }]}>{myRank.current_streak} Days</Text>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={leaderboardItems}
        renderItem={renderRankItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderTopThree}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={isRefetching}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} /> : null
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No data available for this period.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginTop: -20,
    zIndex: 5,
    elevation: 4,
  },
  timeframeBox: { flexDirection: 'row', borderRadius: 20, padding: 4, marginBottom: 16 },
  timeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  timeBtnActive: { backgroundColor: '#FFF', elevation: 2 },
  timeText: { fontWeight: 'bold', fontSize: 13 },
  userSummary: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, gap: 12, elevation: 1 },
  userRankBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  userRankNo: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },
  userCol: { flex: 1 },
  userLabel: { fontSize: 9, fontWeight: 'bold' },
  userVal: { fontSize: 15, fontWeight: 'bold' },
  userDivider: { width: 1, height: 24 },
  topThreeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: 24 },
  topThreeCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, alignItems: 'center', padding: 16, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  topThreeCardEmpty: { flex: 1 },
  topThreeBadge: { marginBottom: 10 },
  topThreeAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#EEE' },
  topThreeUser: { fontWeight: 'bold', fontSize: 14, marginTop: 8, marginBottom: 4 },
  listContent: { paddingBottom: 20 },
  rankItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 20, elevation: 2 },
  rankBadge: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '500' },
  avatarBox: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 15 },
  level: { fontSize: 12 },
  xpBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  xpText: { fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 40, opacity: 0.5 },
});

export default LeaderboardScreen;