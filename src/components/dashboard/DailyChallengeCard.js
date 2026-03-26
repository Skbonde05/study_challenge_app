import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Daily challenge card for the dashboard
 */
const DailyChallengeCard = ({ challenge, onClaim, theme }) => {
  if (!challenge) return null;

  const currentVal = challenge.current_minutes || 0;
  const targetVal = challenge.target_minutes || 60;
  const progressPercent = Math.min((currentVal / targetVal) * 100, 100);

  return (
    <View style={styles.dailyChallengeSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Challenge</Text>
        <TouchableOpacity 
          onPress={challenge.is_completed || currentVal < targetVal ? null : onClaim}
          disabled={challenge.is_completed || currentVal < targetVal}
          style={[
            styles.claimButton, 
            challenge.is_completed ? styles.disabledBtn : 
            currentVal >= targetVal ? styles.activeBtn : styles.hiddenBtn
          ]}
        >
          <Text style={[
            styles.claimText,
            { color: '#FFF' }
          ]}>
            {challenge.is_completed ? 'CLAIMED ✓' : currentVal >= targetVal ? 'CLAIM REWARDS' : 'IN PROGRESS'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.challengeCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>{challenge.title}</Text>
        <Text style={[styles.challengeDescription, { color: theme.colors.secondaryText }]}>
          {challenge.description}
        </Text>
        
        <View style={styles.challengeProgress}>
          <Text style={[styles.challengeProgressText, { color: theme.colors.text }]}>
            {currentVal}/{targetVal} mins
          </Text>
          <View style={[styles.challengeProgressBar, { backgroundColor: theme.colors.progressBackground }]}>
            <View style={[
              styles.challengeProgressFill,
              { 
                width: `${progressPercent}%`,
                backgroundColor: theme.colors.primary
              }
            ]} />
          </View>
        </View>
        
        <View style={styles.challengeRewards}>
          <View style={styles.rewardItem}>
            <Icon name="cash" size={16} color="#FFD700" />
            <Text style={[styles.rewardText, { color: theme.colors.text }]}>+{challenge.rewards?.coins || 100}</Text>
          </View>
          <View style={styles.rewardItem}>
            <Icon name="star" size={16} color={theme.colors.primary} />
            <Text style={[styles.rewardText, { color: theme.colors.text }]}>+{challenge.rewards?.xp || 500} XP</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dailyChallengeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  challengeProgress: {
    marginBottom: 16,
  },
  challengeProgressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  challengeProgressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  challengeRewards: {
    flexDirection: 'row',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBtn: {
    backgroundColor: '#34C759', // Success green
  },
  disabledBtn: {
    backgroundColor: '#8E8E93', // Neutral gray
  },
  hiddenBtn: {
    backgroundColor: '#FF9500', // Warning orange for "In Progress"
  },
  claimText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default memo(DailyChallengeCard);
