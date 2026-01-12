// src/screens/StoreScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';

const StoreScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [storeItems, setStoreItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownedItems, setOwnedItems] = useState([]);

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'avatars', name: 'Avatars', icon: 'account' },
    { id: 'themes', name: 'Themes', icon: 'palette' },
    { id: 'boosts', name: 'Boosts', icon: 'rocket' },
    { id: 'premium', name: 'Premium', icon: 'crown' },
  ];

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProfile(), loadStoreItems(), loadOwnedItems()]);
    } catch (error) {
      console.error('Error loading store data:', error);
      Alert.alert('Error', 'Failed to load store data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStoreItems = async () => {
    try {
      // In a real app, fetch store items from your database
      // For now, using static data
      const items = [
        {
          id: 'avatar_1',
          type: 'avatar',
          name: 'Cool Glasses',
          description: 'Stylish sunglasses for your avatar',
          price: 150,
          currency: 'coins',
          icon: '😎',
          rarity: 'common',
        },
        {
          id: 'avatar_2',
          type: 'avatar',
          name: 'Graduation Hat',
          description: 'Show off your academic achievements',
          price: 300,
          currency: 'coins',
          icon: '🎓',
          rarity: 'rare',
        },
        {
          id: 'avatar_3',
          type: 'avatar',
          name: 'Genius Glasses',
          description: 'Look smarter instantly',
          price: 250,
          currency: 'coins',
          icon: '🤓',
          rarity: 'common',
        },
        {
          id: 'theme_1',
          type: 'theme',
          name: 'Dark Theme',
          description: 'Switch to dark mode theme',
          price: 500,
          currency: 'coins',
          icon: '🌙',
          rarity: 'epic',
        },
        {
          id: 'theme_2',
          type: 'theme',
          name: 'Forest Theme',
          description: 'Nature-inspired color scheme',
          price: 450,
          currency: 'coins',
          icon: '🌲',
          rarity: 'rare',
        },
        {
          id: 'boost_1',
          type: 'boost',
          name: 'XP Booster',
          description: 'Get 2x XP for 1 hour',
          price: 50,
          currency: 'gems',
          icon: '⚡',
          rarity: 'common',
          duration: 3600, // 1 hour in seconds
        },
        {
          id: 'boost_2',
          type: 'boost',
          name: 'Focus Elixir',
          description: 'Increase focus score for next session',
          price: 30,
          currency: 'gems',
          icon: '🧪',
          rarity: 'common',
        },
        {
          id: 'boost_3',
          type: 'boost',
          name: 'Study Streak Freeze',
          description: 'Protect your streak for 1 day',
          price: 75,
          currency: 'gems',
          icon: '❄️',
          rarity: 'rare',
        },
        {
          id: 'premium_1',
          type: 'premium',
          name: 'Premium Membership',
          description: 'Unlock all features for 30 days',
          price: 999,
          currency: 'gems',
          icon: '👑',
          rarity: 'legendary',
        },
      ];
      setStoreItems(items);
    } catch (error) {
      console.error('Error loading store items:', error);
    }
  };

  const loadOwnedItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, fetch owned items from database
      // For now, using mock data
      const mockOwnedItems = ['avatar_1', 'theme_1'];
      setOwnedItems(mockOwnedItems);
    } catch (error) {
      console.error('Error loading owned items:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStoreData();
  };

  const purchaseItem = async (item) => {
    if (!profile) {
      Alert.alert('Error', 'Please sign in to make purchases');
      return;
    }

    // Check if already owned
    if (ownedItems.includes(item.id)) {
      Alert.alert('Already Owned', `You already own ${item.name}`);
      return;
    }

    // Check currency balance
    if (item.currency === 'coins' && profile.coins < item.price) {
      Alert.alert(
        'Not enough coins',
        `You need ${item.price} coins to buy this item\n\nYou have: ${profile.coins} coins`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (item.currency === 'gems' && profile.gems < item.price) {
      Alert.alert(
        'Not enough gems',
        `You need ${item.price} gems to buy this item\n\nYou have: ${profile.gems} gems`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${item.name} for ${item.price} ${item.currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => completePurchase(item),
        },
      ]
    );
  };

  const completePurchase = async (item) => {
    try {
      const updateData = {};
      if (item.currency === 'coins') {
        updateData.coins = profile.coins - item.price;
      } else {
        updateData.gems = profile.gems - item.price;
      }

      // Update user's currency balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Add item to user's inventory (in a real app)
      // await supabase.from('user_inventory').insert([...])

      // Update owned items locally
      setOwnedItems(prev => [...prev, item.id]);

      // Update profile state
      setProfile(prev => ({
        ...prev,
        ...updateData,
      }));

      Alert.alert(
        'Purchase Successful!',
        `You bought ${item.name}\n\nEnjoy your new item!`,
        [{ text: 'Awesome!', onPress: () => loadStoreData() }]
      );
    } catch (error) {
      console.error('Error completing purchase:', error);
      Alert.alert('Error', 'Purchase failed. Please try again.');
    }
  };

  const getFilteredItems = () => {
    if (activeCategory === 'all') return storeItems;
    return storeItems.filter(item => item.type === activeCategory);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#34C759';
      case 'rare': return '#007AFF';
      case 'epic': return '#9B30FF';
      case 'legendary': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const renderItemCard = (item) => {
    const isOwned = ownedItems.includes(item.id);
    const canAfford = item.currency === 'coins' 
      ? profile?.coins >= item.price 
      : profile?.gems >= item.price;

    return (
      <TouchableOpacity 
        key={item.id}
        style={[
          styles.itemCard,
          isOwned && styles.ownedItemCard,
        ]}
        onPress={() => purchaseItem(item)}
        disabled={isOwned}
      >
        <View style={styles.itemHeader}>
          <View style={[
            styles.rarityBadge,
            { backgroundColor: getRarityColor(item.rarity) }
          ]}>
            <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
          </View>
          {isOwned && (
            <View style={styles.ownedBadge}>
              <Icon name="check" size={12} color="#FFF" />
              <Text style={styles.ownedText}>OWNED</Text>
            </View>
          )}
        </View>

        <View style={styles.itemIconContainer}>
          <Text style={styles.itemEmoji}>{item.icon}</Text>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          
          <View style={styles.itemPriceContainer}>
            {item.currency === 'coins' ? (
              <Icon name="coin" size={18} color="#FFD700" />
            ) : (
              <Icon name="diamond" size={18} color="#5AC8FA" />
            )}
            <Text style={[
              styles.itemPrice,
              !canAfford && styles.insufficientPrice,
            ]}>
              {item.price}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.buyButton,
            isOwned && styles.ownedButton,
            (!canAfford && !isOwned) && styles.buyButtonDisabled,
          ]}
          disabled={isOwned || !canAfford}
          onPress={() => purchaseItem(item)}
        >
          <Text style={styles.buyButtonText}>
            {isOwned ? 'Owned' : 'Buy'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCategoryButton = (category) => {
    const isActive = activeCategory === category.id;
    
    return (
      <TouchableOpacity 
        key={category.id}
        style={[
          styles.categoryButton,
          isActive && styles.categoryButtonActive,
        ]}
        onPress={() => setActiveCategory(category.id)}
      >
        <Icon 
          name={category.icon} 
          size={20} 
          color={isActive ? '#4A90E2' : '#8E8E93'} 
        />
        <Text style={[
          styles.categoryText,
          isActive && styles.categoryTextActive,
        ]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Icon name="store" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>Loading Store...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={24} color="#1D1D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <View style={styles.headerCurrency}>
          <TouchableOpacity 
            style={styles.currencyDisplay}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="coin" size={20} color="#FFD700" />
            <Text style={styles.currencyValue}>{profile?.coins || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.currencyDisplay}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="diamond" size={20} color="#5AC8FA" />
            <Text style={styles.currencyValue}>{profile?.gems || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      >
        {/* Featured Item */}
        <View style={styles.featuredSection}>
          <LinearGradient
            colors={['#9B30FF', '#7B1FA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredCard}
          >
            <View style={styles.featuredBadge}>
              <Icon name="crown" size={12} color="#FFD700" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
            <View style={styles.featuredIconContainer}>
              <Text style={styles.featuredEmoji}>👑</Text>
            </View>
            <Text style={styles.featuredTitle}>Premium Theme Pack</Text>
            <Text style={styles.featuredDescription}>
              Unlock all themes and custom colors
            </Text>
            <View style={styles.featuredPrice}>
              <Icon name="diamond" size={20} color="#5AC8FA" />
              <Text style={styles.featuredPriceText}>999 Gems</Text>
            </View>
            <TouchableOpacity 
              style={styles.featuredButton}
              onPress={() => {
                Alert.alert('Coming Soon', 'Premium features coming soon!');
              }}
            >
              <LinearGradient
                colors={['#FFD700', '#FFC400']}
                style={styles.featuredButtonGradient}
              >
                <Text style={styles.featuredButtonText}>Get Premium</Text>
                <Icon name="arrow-right" size={16} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Store Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(renderCategoryButton)}
          </ScrollView>
        </View>

        {/* Store Items Grid */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'all' ? 'All Items' : 
             activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
          </Text>
          
          {getFilteredItems().length > 0 ? (
            <View style={styles.itemsGrid}>
              {getFilteredItems().map(renderItemCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="store-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No items in this category</Text>
            </View>
          )}
        </View>

        {/* Earn More Section */}
        <View style={styles.earnSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earn More Coins</Text>
            <TouchableOpacity onPress={loadStoreData}>
              <Icon name="refresh" size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.earnCard}>
            <View style={styles.earnItem}>
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.earnIcon}
              >
                <Icon name="fire" size={24} color="#FFF" />
              </LinearGradient>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>7-Day Streak</Text>
                <Text style={styles.earnDescription}>Complete 7 days in a row</Text>
                <Text style={styles.earnReward}>+200 Coins</Text>
              </View>
              <TouchableOpacity style={styles.earnButton}>
                <Text style={styles.earnButtonText}>Claim</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.earnItem}>
              <LinearGradient
                colors={['#34C759', '#2AA24F']}
                style={styles.earnIcon}
              >
                <Icon name="clock" size={24} color="#FFF" />
              </LinearGradient>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>5 Hour Study</Text>
                <Text style={styles.earnDescription}>Study 5 hours this week</Text>
                <Text style={styles.earnReward}>+150 Coins</Text>
              </View>
              <TouchableOpacity style={styles.earnButton}>
                <Text style={styles.earnButtonText}>Claim</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.earnItem}>
              <LinearGradient
                colors={['#FF9500', '#E68500']}
                style={styles.earnIcon}
              >
                <Icon name="account-group" size={24} color="#FFF" />
              </LinearGradient>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Invite Friends</Text>
                <Text style={styles.earnDescription}>Invite 3 friends to join</Text>
                <Text style={styles.earnReward}>+100 Coins Each</Text>
              </View>
              <TouchableOpacity 
                style={styles.earnButton}
                onPress={() => Alert.alert('Share', 'Share link with friends')}
              >
                <Text style={styles.earnButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 60,
  },
  currencyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 4,
  },
  featuredSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#9B30FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  featuredIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featuredEmoji: {
    fontSize: 40,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuredPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featuredPriceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  featuredButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  featuredButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  categoriesContainer: {
    paddingRight: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#E8F2FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  itemsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ownedItemCard: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 2,
  },
  itemIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 12,
  },
  itemEmoji: {
    fontSize: 48,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 16,
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    marginLeft: 4,
  },
  insufficientPrice: {
    color: '#FF3B30',
  },
  buyButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  ownedButton: {
    backgroundColor: '#34C759',
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  earnSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  earnCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  earnIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  earnDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  earnReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  earnButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  earnButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StoreScreen;