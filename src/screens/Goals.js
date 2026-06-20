import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, FlatList, Modal, TextInput, Alert, Platform,  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import ScreenHeader from '../components/common/ScreenHeader';

const CATEGORIES = [
  { id: 'study', name: 'Study Time', icon: 'clock-outline', color: '#4facfe' },
  { id: 'revision', name: 'Revision', icon: 'book-open-variant', color: '#FF9500' },
  { id: 'prep', name: 'Exam Prep', icon: 'pencil-box-multiple-outline', color: '#FF3B30' },
  { id: 'coding', name: 'Coding', icon: 'xml', color: '#34C759' },
  { id: 'other', name: 'Other', icon: 'tag-outline', color: '#9B30FF' },
];

export default function Goals({ navigation }) {
  const { theme } = useAppTheme();
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCat, setSelectedCat] = useState('study');
  const [newTarget, setNewTarget] = useState('10'); // in hours or counts
  const [newDeadline, setNewDeadline] = useState('');

  // Load goals from storage on mount
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem('STUDY_CHALLENGE_GOALS');
      if (stored) {
        setGoals(JSON.parse(stored));
      } else {
        // Initial mock goals if empty
        const initial = [
          {
            id: 'g_1',
            title: 'Master React Native Navigation',
            category: 'study',
            target: 20,
            current: 12,
            deadline: '2026-07-01',
            isCompleted: false,
          },
          {
            id: 'g_2',
            title: 'Practice 50 Coding Problems',
            category: 'coding',
            target: 50,
            current: 50,
            deadline: '2026-06-25',
            isCompleted: true,
          },
        ];
        await AsyncStorage.setItem('STUDY_CHALLENGE_GOALS', JSON.stringify(initial));
        setGoals(initial);
      }
    } catch (e) {
      console.warn('Failed to load goals:', e.message);
    }
  };

  const saveGoals = async (updatedGoals) => {
    try {
      setGoals(updatedGoals);
      await AsyncStorage.setItem('STUDY_CHALLENGE_GOALS', JSON.stringify(updatedGoals));
    } catch (e) {
      console.error('Failed to save goals:', e);
    }
  };

  const handleAddGoal = () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal title.');
      return;
    }
    const targetVal = parseInt(newTarget, 10);
    if (isNaN(targetVal) || targetVal <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target number.');
      return;
    }

    const newGoal = {
      id: 'g_' + Date.now(),
      title: newTitle,
      category: selectedCat,
      target: targetVal,
      current: 0,
      deadline: newDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now default
      isCompleted: false,
    };

    const updated = [newGoal, ...goals];
    saveGoals(updated);

    // Reset Form
    setNewTitle('');
    setSelectedCat('study');
    setNewTarget('10');
    setNewDeadline('');
    setShowAddModal(false);
  };

  const handleProgressIncrement = (id, amount) => {
    const updated = goals.map((goal) => {
      if (goal.id === id) {
        const nextVal = Math.min(goal.current + amount, goal.target);
        const isCompleted = nextVal >= goal.target;
        return { ...goal, current: nextVal, isCompleted };
      }
      return goal;
    });
    saveGoals(updated);
  };

  const handleDeleteGoal = (id) => {
    const performDelete = () => {
      const updated = goals.filter((g) => g.id !== id);
      saveGoals(updated);
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('Are you sure you want to delete this study goal?');
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert('Delete Goal', 'Are you sure you want to delete this study goal?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]);
    }
  };

  const stats = useMemo(() => {
    const active = goals.filter((g) => !g.isCompleted).length;
    const completed = goals.filter((g) => g.isCompleted).length;
    const total = goals.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, total, completionRate };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => (activeTab === 'active' ? !g.isCompleted : g.isCompleted));
  }, [goals, activeTab]);

  const renderGoalItem = ({ item }) => {
    const catConfig = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[4];
    const progress = Math.min((item.current || 0) / (item.target || 1), 1);

    return (
      <View style={[styles.goalCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.catIconContainer, { backgroundColor: catConfig.color + '15' }]}>
            <Icon name={catConfig.icon} size={22} color={catConfig.color} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.goalTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.deadlineText, { color: theme.colors.secondaryText }]}>
              Deadline: {item.deadline}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteGoal(item.id)} style={styles.deleteBtn}>
            <Icon name="trash-can-outline" size={20} color={theme.colors.error || '#FF3B30'} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressValText, { color: theme.colors.text }]}>
              {item.current} / {item.target}
            </Text>
            <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.colors.progressBackground }]}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: catConfig.color }]} />
          </View>
        </View>

        {!item.isCompleted && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.incrementBtn, { borderColor: theme.colors.border }]}
              onPress={() => handleProgressIncrement(item.id, 1)}
            >
              <Text style={[styles.incrementBtnText, { color: theme.colors.text }]}>+1 Unit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.incrementBtn, { borderColor: theme.colors.border }]}
              onPress={() => handleProgressIncrement(item.id, 5)}
            >
              <Text style={[styles.incrementBtnText, { color: theme.colors.text }]}>+5 Units</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleProgressIncrement(item.id, item.target - item.current)}
            >
              <Icon name="check" size={16} color="#FFF" />
              <Text style={styles.completeBtnText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Study Goals" 
        onBack={() => navigation.goBack()} 
        theme={theme}
        rightElement={
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Icon name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <View style={[styles.statsRow, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.completionRate}%</Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>Rate</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? theme.colors.primary : theme.colors.secondaryText }]}>
            Active Goals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'completed' ? theme.colors.primary : theme.colors.secondaryText }]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredGoals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="bullseye-arrow" size={72} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Goals Found</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.secondaryText }]}>
              {activeTab === 'active' 
                ? 'Create a new study goal to keep yourself accountable and productive!' 
                : "No completed goals yet. Keep study sessions going!"}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyAddBtnText}>Add Goal</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Create Study Goal</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Goal Title</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="e.g. Read 5 chapters of Calculus"
                placeholderTextColor={theme.colors.secondaryText}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChoiceBtn,
                        { borderColor: theme.colors.border },
                        isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                      ]}
                      onPress={() => setSelectedCat(cat.id)}
                    >
                      <Icon name={cat.icon} size={18} color={isSelected ? '#FFF' : theme.colors.text} />
                      <Text style={[styles.catChoiceText, { color: isSelected ? '#FFF' : theme.colors.text }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Target Amount (Units / Hours)</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="e.g. 10"
                keyboardType="numeric"
                value={newTarget}
                onChangeText={setNewTarget}
              />

              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Deadline Date</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.secondaryText}
                value={newDeadline}
                onChangeText={setNewDeadline}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddGoal}
            >
              <Text style={styles.saveBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
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
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  goalCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  catIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTextContainer: { flex: 1, marginRight: 8 },
  goalTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  deadlineText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  deleteBtn: { padding: 4 },
  progressContainer: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressValText: { fontSize: 13, fontWeight: '600' },
  progressPercent: { fontSize: 13, fontWeight: 'bold' },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  incrementBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  incrementBtnText: { fontSize: 12, fontWeight: '600' },
  completeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  completeBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.7, marginBottom: 24 },
  emptyAddBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  emptyAddBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScroll: { paddingBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catChoiceBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  catChoiceText: { fontSize: 12, fontWeight: '600' },
  saveBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});