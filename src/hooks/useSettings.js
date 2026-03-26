import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to manage user settings and preferences
 */
export const useSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      // Try cache first for instant feel
      const cached = await AsyncStorage.getItem(`settings_${user.id}`);
      let localData = cached ? JSON.parse(cached) : null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      const remoteData = data?.preferences || {};
      const merged = { ...localData, ...remoteData };
      
      // Update cache
      await AsyncStorage.setItem(`settings_${user.id}`, JSON.stringify(merged));
      return merged;
    },
    staleTime: 1000 * 60 * 10,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: newSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      await AsyncStorage.setItem(`settings_${user.id}`, JSON.stringify(newSettings));
      return newSettings;
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      const previous = queryClient.getQueryData(['settings']);
      queryClient.setQueryData(['settings'], (old) => ({ ...old, ...newSettings }));
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['settings'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const sendFeedbackMutation = useMutation({
    mutationFn: async (message) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_feedback')
        .insert([{ user_id: user.id, message, created_at: new Date().toISOString() }]);

      if (error) throw error;
      return true;
    }
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettingsMutation.mutate,
    sendFeedback: sendFeedbackMutation.mutate,
    isSubmittingFeedback: sendFeedbackMutation.isPending,
    isUpdating: updateSettingsMutation.isPending
  };
};
