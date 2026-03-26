import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import { useStore } from '../hooks/useStore';
import { useProfile } from '../hooks/useProfile';
import { useRealtime } from '../hooks/useRealtime';
import ScreenHeader from '../components/common/ScreenHeader';

const { width } = Dimensions.get('window');

const StoreScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Data hooks
  const { 
    items, 
    ownedItemsIds, 
    isLoading: loadingStore, 
    purchase, 
    isPurchasing,
    refetch: refetchStore 
  } = useStore();
  
  const { 
    profile, 
    isLoading: loadingProfile, 
    refetch: refetchProfile 
  } = useProfile();
  
  // Real-time sync
  useRealtime();

  const categories = useMemo(() => [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'avatars', name: 'Avatars', icon: 'account' },
    { id: 'themes', name: 'Themes', icon: 'palette' },
    { id: 'boosts', name: 'Boosts', icon: 'rocket' },
    { id: 'premium', name: 'Premium', icon: 'crown' },
  ], []);

  const handleRefresh = async () => {
    await Promise.all([refetchStore(), refetchProfile()]);
  };

  const currentCoins = profile?.coins || 0;
  const currentGems = profile?.gems || 0;

  const handlePurchase = (item) => {
    if (!profile) return;
    
    // Check ownership
    if (ownedItemsIds.includes(item.id)) {
      Alert.alert('Owned', 'You already own this item!');
      return;
    }

    // Check balance
    const balance = item.currency === 'coins' ? currentCoins : currentGems;
    if (balance < item.price) {
      Alert.alert('Insufficient Balance', `You need ${item.price} ${item.currency} to buy this.`);
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${item.name} for ${item.price} ${item.currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            purchase({ item, currentProfile: profile }, {
              onSuccess: () => {
                Alert.alert('Success!', `${item.name} has been added to your inventory. 🎉`);
              },
              onError: (err) => {
                Alert.alert('Error', err.message || 'Purchase failed.');
              }
            });
          },
        },
      ]
    );
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter(item => item.type === activeCategory);
  }, [items, activeCategory]);

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'epic': return '#9B30FF';
      case 'legendary': return '#FF9500';
      case 'rare': return '#007AFF';
      default: return '#34C759';
    }
  };

  const loading = (loadingStore || loadingProfile) && !profile;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Icon name="store" size={48} color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>Loading Store...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScreenHeader 
        title="Store" 
        onBack={() => navigation.goBack()} 
        theme={theme}
        rightElement={
          <View style={styles.headerCurrency}>
            <View style={[styles.currencyBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Icon name="coin" size={16} color="#FFD700" />
              <Text style={[styles.currencyText, { color: '#FFF' }]}>{currentCoins}</Text>
            </View>
            <View style={[styles.currencyBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Icon name="diamond" size={16} color="#5AC8FA" />
              <Text style={[styles.currencyText, { color: '#FFF' }]}>{currentGems}</Text>
            </View>
          </View>
        }
      />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} colors={[theme.colors.primary]} />}
      >
        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <LinearGradient
            colors={['#9B30FF', '#7B1FA2']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.featuredCard}
          >
            <View style={styles.featuredHeader}>
              <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>FEATURED</Text></View>
              <Icon name="crown" size={32} color="#FFD700" />
            </View>
            <Text style={styles.featuredTitle}>Premium Access</Text>
            <Text style={styles.featuredDesc}>Unlock all skins, double rewards, and custom sounds!</Text>
            <TouchableOpacity style={styles.premiumBtn}>
              <Text style={styles.premiumBtnText}>Get Premium</Text>
              <Icon name="arrow-right" size={16} color="#7B1FA2" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Categories Scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroller} contentContainerStyle={styles.catContent}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[
                styles.catBtn, 
                { backgroundColor: theme.colors.card },
                activeCategory === cat.id && { borderColor: theme.colors.primary, borderWidth: 1.5 }
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Icon name={cat.icon} size={20} color={activeCategory === cat.id ? theme.colors.primary : theme.colors.secondaryText} />
              <Text style={[styles.catText, { color: activeCategory === cat.id ? theme.colors.primary : theme.colors.secondaryText }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items Grid */}
        <View style={styles.itemsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Items
          </Text>
          <View style={styles.itemsGrid}>
            {filteredItems.map(item => {
              const isOwned = ownedItemsIds.includes(item.id);
              const canAfford = item.currency === 'coins' ? currentCoins >= item.price : currentGems >= item.price;

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.itemCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => handlePurchase(item)}
                  disabled={isOwned || isPurchasing}
                >
                  <View style={[styles.rarityBar, { backgroundColor: getRarityColor(item.rarity) }]} />
                  <View style={styles.itemIconBox}>
                    <Text style={styles.itemEmoji}>{item.icon}</Text>
                  </View>
                  <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                  
                  <View style={styles.itemFooter}>
                    <View style={styles.priceRow}>
                      <Icon name={item.currency === 'coins' ? 'coin' : 'diamond'} size={14} color={item.currency === 'coins' ? '#FFD700' : '#5AC8FA'} />
                      <Text style={[styles.priceValue, { color: !canAfford && !isOwned ? theme.colors.error : theme.colors.text }]}>
                        {item.price}
                      </Text>
                    </View>
                    {isOwned ? (
                      <Icon name="check-circle" size={18} color="#34C759" />
                    ) : (
                      <View style={[styles.buyBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={[styles.buyText, { color: theme.colors.primary }]}>BUY</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backButton: { padding: 4 },
  headerCurrency: { flexDirection: 'row', gap: 8 },
  currencyBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  currencyText: { fontWeight: '700', fontSize: 13 },
  featuredSection: { padding: 16 },
  featuredCard: { borderRadius: 24, padding: 24, elevation: 8 },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  featuredBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  featuredBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  featuredTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  featuredDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  premiumBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6 },
  premiumBtnText: { color: '#7B1FA2', fontWeight: 'bold', fontSize: 14 },
  catScroller: { paddingHorizontal: 16, marginBottom: 20 },
  catContent: { paddingRight: 32, gap: 10 },
  catBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, elevation: 2 },
  catText: { fontWeight: '600', fontSize: 14 },
  itemsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: { width: (width - 44) / 2, borderRadius: 20, padding: 12, elevation: 3, overflow: 'hidden' },
  rarityBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  itemIconBox: { height: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, marginBottom: 10 },
  itemEmoji: { fontSize: 32 },
  itemName: { fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceValue: { fontWeight: 'bold', fontSize: 14 },
  buyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  buyText: { fontSize: 10, fontWeight: 'bold' },
});

export default StoreScreen;