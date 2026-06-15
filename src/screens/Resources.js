import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import ScreenHeader from '../components/common/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

const RESOURCE_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'guide', name: 'Guides' },
  { id: 'cheat_sheet', name: 'Cheat Sheets' },
  { id: 'template', name: 'Templates' },
  { id: 'productivity', name: 'Productivity' },
];

const RESOURCES = [
  {
    id: 'res_1',
    title: 'The Ultimate Pomodoro Study Guide',
    description: 'Learn how to maximize your study blocks, manage energy levels, and avoid mental burnout.',
    category: 'guide',
    type: 'PDF',
    link: 'https://example.com/pomodoro-guide.pdf',
    readTime: '5 min read',
    rating: 4.8,
  },
  {
    id: 'res_2',
    title: 'Markdown & Coding Cheat Sheet',
    description: 'A quick reference sheet for formatting markdown files and core coding shortcuts.',
    category: 'cheat_sheet',
    type: 'Cheat Sheet',
    link: 'https://example.com/markdown-shortcuts.pdf',
    readTime: '3 min read',
    rating: 4.9,
  },
  {
    id: 'res_3',
    title: 'Daily & Weekly Planner Template',
    description: 'Printable or digital planner templates to organize your homework, exams, and habits.',
    category: 'template',
    type: 'Template',
    link: 'https://example.com/weekly-planner.pdf',
    readTime: '2 min read',
    rating: 4.5,
  },
  {
    id: 'res_4',
    title: 'Science of Spaced Repetition',
    description: 'How to review topics at systematic intervals to commit facts to permanent long-term memory.',
    category: 'productivity',
    type: 'Article',
    link: 'https://en.wikipedia.org/wiki/Spaced_repetition',
    readTime: '8 min read',
    rating: 4.7,
  },
  {
    id: 'res_5',
    title: 'Feynman Learning Technique Guide',
    description: 'Understand topics deeper by explaining them in simple terms as if teaching a child.',
    category: 'guide',
    type: 'PDF',
    link: 'https://example.com/feynman-technique.pdf',
    readTime: '6 min read',
    rating: 4.9,
  },
];

export default function Resources({ navigation }) {
  const { theme } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);

  // Load bookmarked resources
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem('STUDY_CHALLENGE_BOOKMARKS');
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load bookmarks:', e.message);
    }
  };

  const toggleBookmark = async (resId) => {
    try {
      let updated;
      if (bookmarks.includes(resId)) {
        updated = bookmarks.filter((id) => id !== resId);
      } else {
        updated = [...bookmarks, resId];
      }
      setBookmarks(updated);
      await AsyncStorage.setItem('STUDY_CHALLENGE_BOOKMARKS', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save bookmark:', e);
    }
  };

  const handleOpenResource = (resource) => {
    setSelectedResource(resource);
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch((err) => {
      Alert.alert('Error', 'Unable to open link: ' + err.message);
    });
  };

  const filteredResources = useMemo(() => {
    return RESOURCES.filter((res) => {
      const matchesSearch =
        res.title.toLowerCase().includes(search.toLowerCase()) ||
        res.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'all' || res.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, selectedCategory]);

  const renderResourceItem = ({ item }) => {
    const isBookmarked = bookmarks.includes(item.id);

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.typeText, { color: theme.colors.primary }]}>{item.type}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleBookmark(item.id)} style={styles.bookmarkBtn}>
            <Icon
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? theme.colors.primary : theme.colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => handleOpenResource(item)} activeOpacity={0.7}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.desc, { color: theme.colors.secondaryText }]} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Icon name="clock-outline" size={14} color={theme.colors.secondaryText} />
            <Text style={[styles.footerText, { color: theme.colors.secondaryText }]}>{item.readTime}</Text>
          </View>
          <View style={styles.footerInfo}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={[styles.footerText, { color: theme.colors.secondaryText }]}>{item.rating}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleOpenLink(item.link)}
          >
            <Text style={styles.actionBtnText}>Open</Text>
            <Icon name="open-in-new" size={12} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Study Resources" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />

      {/* Featured Banner */}
      <View style={styles.featuredContainer}>
        <LinearGradient
          colors={['#5c258d', '#4389a2']}
          style={styles.featuredCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="library-shelves" size={32} color="rgba(255,255,255,0.8)" style={styles.featuredIcon} />
          <Text style={styles.featuredLabel}>WEEKLY HIGHLIGHT</Text>
          <Text style={styles.featuredTitle}>Spaced Repetition Mastery</Text>
          <Text style={styles.featuredDesc}>
            Learn how to use active recall to retain 90% of what you study.
          </Text>
          <TouchableOpacity
            style={styles.featuredBtn}
            onPress={() => handleOpenLink('https://en.wikipedia.org/wiki/Spaced_repetition')}
          >
            <Text style={styles.featuredBtnText}>Read Guide</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Icon name="magnify" size={22} color={theme.colors.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search resources, templates, cheat sheets..."
          placeholderTextColor={theme.colors.secondaryText}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RESOURCE_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.tab,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={[styles.tabText, { color: isSelected ? '#FFF' : theme.colors.text }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.tabsContent}
        />
      </View>

      <FlatList
        data={filteredResources}
        renderItem={renderResourceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="folder-search-outline" size={72} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Resources Found</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.secondaryText }]}>
              Try altering your keywords or category filters.
            </Text>
          </View>
        }
      />

      {/* Resource Detail Modal */}
      <Modal visible={!!selectedResource} animationType="slide" transparent>
        {selectedResource && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Resource Details</Text>
                <TouchableOpacity onPress={() => setSelectedResource(null)}>
                  <Icon name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalResourceTitle, { color: theme.colors.text }]}>
                {selectedResource.title}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.typeText, { color: theme.colors.primary }]}>{selectedResource.type}</Text>
                </View>
                <Text style={[styles.metaText, { color: theme.colors.secondaryText }]}>
                  {selectedResource.readTime}
                </Text>
              </View>

              <Text style={[styles.modalDesc, { color: theme.colors.secondaryText }]}>
                {selectedResource.description}
              </Text>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  handleOpenLink(selectedResource.link);
                  setSelectedResource(null);
                }}
              >
                <Text style={styles.modalActionBtnText}>Read / View Online</Text>
                <Icon name="open-in-new" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  featuredContainer: { paddingHorizontal: 16, marginTop: -10, marginBottom: 16 },
  featuredCard: { borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden' },
  featuredIcon: { position: 'absolute', right: -10, top: -10, opacity: 0.15, transform: [{ scale: 3 }] },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  featuredTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 6 },
  featuredDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, lineHeight: 18, marginRight: 40 },
  featuredBtn: { backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 14 },
  featuredBtnText: { color: '#5c258d', fontSize: 12, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, padding: 0 },
  tabsRow: { marginBottom: 10 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: 'bold' },
  bookmarkBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, fontWeight: '500' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalResourceTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  metaText: { fontSize: 12, fontWeight: '500' },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16 },
  modalActionBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});