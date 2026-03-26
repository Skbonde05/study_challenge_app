import { supabase } from '../services/supabase';

/**
 * Fetch all available store items
 */
export const getStoreItems = async () => {
  const { data, error } = await supabase
    .from('store_items')
    .select('*')
    .order('price', { ascending: true });

  if (error && error.code === 'PGRST116') return []; // Empty or missing table
  if (error) throw error;
  
  return data || [];
};

/**
 * Fetch items owned by the user
 * @param {string} userId
 */
export const getOwnedItems = async (userId) => {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('*, item:item_id (*)')
    .eq('user_id', userId);

  if (error && error.code === 'PGRST116') return [];
  if (error) throw error;
  
  return data || [];
};

/**
 * Purchase an item
 * @param {string} userId
 * @param {object} item
 * @param {object} currentProfile
 */
export const purchaseItem = async (userId, item, currentProfile) => {
  // Check currency
  const isCoins = item.currency === 'coins';
  const balance = isCoins ? currentProfile.coins : currentProfile.gems;
  
  if (balance < item.price) {
    throw new Error(`Not enough ${item.currency}`);
  }

  // Transaction: Deduct currency and add to inventory
  const updateData = {};
  if (isCoins) {
    updateData.coins = (currentProfile.coins || 0) - item.price;
  } else {
    updateData.gems = (currentProfile.gems || 0) - item.price;
  }

  // We should ideally use a transaction or RPC here, but for now we'll do sequential updates
  const { error: profileError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (profileError) throw profileError;

  const { data: inventoryData, error: inventoryError } = await supabase
    .from('user_inventory')
    .insert([{
      user_id: userId,
      item_id: item.id,
      purchased_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (inventoryError) throw inventoryError;

  return { inventoryData, newBalance: updateData };
};
