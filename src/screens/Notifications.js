import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useNotifications } from '../hooks/useNotifications';
import ScreenHeader from '../components/common/ScreenHeader';

export default function Notifications({ navigation }) {
  const { theme } = useAppTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllRead,
  } = useNotifications();

  const getNotificationIcon = (title = '') => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('achievement') || lowerTitle.includes('badge') || lowerTitle.includes('trophy')) {
      return { name: 'trophy-outline', color: '#FFD700' };
    }
    if (lowerTitle.includes('classroom') || lowerTitle.includes('group') || lowerTitle.includes('message')) {
      return { name: 'account-group-outline', color: '#4facfe' };
    }
    if (lowerTitle.includes('challenge') || lowerTitle.includes('streak')) {
      return { name: 'fire', color: '#FF9500' };
    }
    if (lowerTitle.includes('timer') || lowerTitle.includes('study')) {
      return { name: 'clock-outline', color: '#34C759' };
    }
    return { name: 'bell-outline', color: theme.colors.primary };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }) => {
    const { name: iconName, color: iconColor } = getNotificationIcon(item.title);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.colors.card },
          !item.is_read && styles.unreadCard,
        ]}
        onPress={() => !item.is_read && markAsRead(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Icon name={iconName} size={24} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.cardHeaderRow}>
            <Text 
              style={[
                styles.title, 
                { color: theme.colors.text },
                !item.is_read && styles.unreadText
              ]}
              numberOfLines={1}
            >
              {item.title || 'Notification'}
            </Text>
            <Text style={[styles.time, { color: theme.colors.secondaryText }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <Text style={[styles.message, { color: theme.colors.secondaryText }]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {!item.is_read && (
          <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Notifications" 
        onBack={() => navigation.goBack()} 
        theme={theme}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={() => markAllRead()} style={styles.clearBtn}>
              <Text style={styles.clearText}>Read All</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="bell-off-outline" size={80} color={theme.colors.border} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Notifications</Text>
              <Text style={[styles.emptyDesc, { color: theme.colors.secondaryText }]}>
                You're all caught up! Check back later for study group updates and achievements.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clearBtn: { padding: 4 },
  clearText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1, marginRight: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600' },
  unreadText: { fontWeight: '700' },
  time: { fontSize: 11, fontWeight: '500' },
  message: { fontSize: 13, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, opacity: 0.7 },
});