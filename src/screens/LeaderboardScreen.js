import React, { useState, useMemo } from 'react';
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
import { useAppTheme } from '../theme/useAppTheme';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRealtime } from '../hooks/useRealtime';

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Dynamic Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeBox}>
          {Object.keys(timeframeLabels).map(key => (
            <TouchableOpacity 
              key={key} 
              style={[styles.timeBtn, timeframe === key && styles.timeBtnActive]} 
              onPress={() => setTimeframe(key)}
            >
              <Text style={[styles.timeText, timeframe === key && { color: theme.colors.primary }]}>{timeframeLabels[key]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Rank Summary */}
        {myRank && (
          <View style={styles.userSummary}>
            <View style={styles.userRankBadge}><Text style={styles.userRankNo}>#{myRank.rank}</Text></View>
            <View style={styles.userCol}>
              <Text style={styles.userLabel}>YOUR RANK</Text>
              <Text style={styles.userVal}>{myRank.xp?.toLocaleString()} XP</Text>
            </View>
            <View style={styles.userDivider} />
            <View style={styles.userCol}>
              <Text style={styles.userLabel}>STREAK</Text>
              <Text style={styles.userVal}>{myRank.current_streak} Days</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  timeframeBox: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 4, marginBottom: 20 },
  timeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  timeBtnActive: { backgroundColor: '#FFF' },
  timeText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  userSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 16, borderRadius: 24, gap: 16 },
  userRankBadge: { backgroundColor: '#FFD700', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userRankNo: { fontWeight: 'bold', fontSize: 16, color: '#1D1D1F' },
  userCol: { flex: 1 },
  userLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
  userVal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  userDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
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