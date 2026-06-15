import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useSessions } from '../hooks/useSessions';
import ScreenHeader from '../components/common/ScreenHeader';

export default function HistoryScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { recentSessions, isLoading, refetch } = useSessions();

  // Calculate stats from recent sessions (or we could fetch from profile, but let's derive them)
  const stats = useMemo(() => {
    if (!recentSessions || recentSessions.length === 0) {
      return { totalTime: 0, avgFocus: 0, sessionCount: 0 };
    }
    const totalTime = recentSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const totalFocus = recentSessions.reduce((acc, s) => acc + (s.focus_score || 0), 0);
    return {
      totalTime,
      avgFocus: Math.round(totalFocus / recentSessions.length),
      sessionCount: recentSessions.length,
    };
  }, [recentSessions]);

  const getFocusColor = (score) => {
    if (score >= 80) return '#34C759'; // Green
    if (score >= 60) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSessionItem = ({ item }) => {
    const focusColor = getFocusColor(item.focus_score);
    return (
      <View style={[styles.sessionCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={[styles.sessionTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {item.session_title || 'Focus Session'}
            </Text>
            {item.topic ? (
              <Text style={[styles.sessionTopic, { color: theme.colors.secondaryText }]} numberOfLines={1}>
                {item.subject} • {item.topic}
              </Text>
            ) : (
              <Text style={[styles.sessionTopic, { color: theme.colors.secondaryText }]}>
                {item.subject || 'General'}
              </Text>
            )}
          </View>
          <View style={[styles.focusBadge, { backgroundColor: focusColor + '15' }]}>
            <Text style={[styles.focusText, { color: focusColor }]}>
              {item.focus_score}% Focus
            </Text>
          </View>
        </View>

        {item.notes ? (
          <Text style={[styles.notesText, { color: theme.colors.secondaryText }]} numberOfLines={2}>
            "{item.notes}"
          </Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Icon name="clock-outline" size={16} color={theme.colors.secondaryText} />
            <Text style={[styles.footerVal, { color: theme.colors.text }]}>
              {item.duration_minutes}m
            </Text>
          </View>
          
          <View style={styles.rewardRow}>
            <View style={styles.footerItem}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={[styles.footerVal, { color: theme.colors.text }]}>+{item.xp_earned} XP</Text>
            </View>
            <View style={styles.footerItem}>
              <Icon name="cash" size={14} color="#34C759" />
              <Text style={[styles.footerVal, { color: theme.colors.text }]}>+{item.coins_earned}</Text>
            </View>
          </View>

          <Text style={[styles.dateText, { color: theme.colors.secondaryText }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Study History" 
        onBack={() => navigation.goBack()} 
        theme={theme} 
      />

      <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {stats.totalTime}m
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Total Focused</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: getFocusColor(stats.avgFocus) }]}>
            {stats.avgFocus}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Avg Focus</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats.sessionCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Sessions</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={recentSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="history" size={64} color={theme.colors.border} />
              <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>
                No sessions completed yet.
              </Text>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'TimerTab' })}
              >
                <Text style={styles.startButtonText}>Start Focus Session</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: -10,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: 'bold', marginTop: 4, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 35, backgroundColor: 'rgba(0,0,0,0.08)' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  sessionCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleContainer: { flex: 1, marginRight: 8 },
  sessionTitle: { fontSize: 16, fontWeight: '700' },
  sessionTopic: { fontSize: 12, marginTop: 2 },
  focusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  focusText: { fontSize: 11, fontWeight: 'bold' },
  notesText: { fontSize: 13, fontStyle: 'italic', marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerVal: { fontSize: 12, fontWeight: '600' },
  rewardRow: { flexDirection: 'row', gap: 10 },
  dateText: { fontSize: 11, fontWeight: '500' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: '500', marginBottom: 20 },
  startButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  startButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
