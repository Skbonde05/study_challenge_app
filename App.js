// App.js (COMPLETE FIXED VERSION - Proper Navigation Setup)
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './src/services/supabase';
import { ThemeProvider, themes } from './src/context/ThemeContext';
import { ToastProvider, useToast } from './src/context/ToastContext';
import { useQueryClient, QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useRealtime } from './src/hooks/useRealtime';
import { useAppTheme } from './src/theme/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ensureProfile, getProfile } from './src/api/profile';
import { getRecentSessions } from './src/api/sessions';
import { getUserChallenges } from './src/api/challenges';

const createQueryClient = (showToast) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        gcTime: 1000 * 60 * 60 * 24, // 24 hours persistence
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({
      onError: (err) => {
        if (!err.silent) {
          showToast?.(err.message || 'Something went wrong', 'error');
        }
      },
    }),
  });

  const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'STREAKIFY_QUERY_CACHE',
    throttleTime: 1000,
  });

  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    hydrateOptions: {
      shouldDehydrateQuery: (query) => {
        return query.state.status === 'success';
      }
    }
  });

  return queryClient;
};

// Import all screens
import SplashScreen from './src/screens/SplashScreen';
import Login from './src/screens/Login';
import SignUp from './src/screens/SignUp';
import Dashboard from './src/screens/Dashboard';
import Profile from './src/screens/Profile';
import Timer from './src/screens/Timer';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ClassroomsScreen from './src/screens/ClassroomsScreen';
import StoreScreen from './src/screens/StoreScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import Challenges from './src/screens/Challenges';
import FocusMusic from './src/screens/FocusMusic';
import Goals from './src/screens/Goals';
import Resources from './src/screens/Resources';
import Notifications from './src/screens/Notifications';
import Settings from './src/screens/Settings';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom navigation theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F7',
    card: '#FFFFFF',
    text: '#1D1D1F',
    border: '#F0F0F0',
  },
};


// Bottom Tab Navigator - Main app interface
function MainTabNavigator() {
  const { theme } = useAppTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TimerTab') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'LeaderboardTab') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingTop: 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // Each screen has its own custom header
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={Dashboard}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="TimerTab"
        component={Timer}
        options={{
          tabBarLabel: 'Timer',
        }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Rank',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator for screens accessible from the bottom tabs
function AppStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // All screens have their own custom headers
        cardStyle: { backgroundColor: '#F5F5F7' },
        presentation: 'card',
      }}
    >
      {/* MainTabNavigator is the home screen */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          headerShown: false,
        }}
      />

      {/* Modal/Detail screens - accessible from bottom tabs */}
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Classrooms"
        component={ClassroomsScreen}
      />
      <Stack.Screen
        name="Store"
        component={StoreScreen}
      />
      <Stack.Screen
        name="Badges"
        component={BadgesScreen}
      />
      <Stack.Screen
        name="Challenges"
        component={Challenges}
      />
      <Stack.Screen
        name="FocusMusic"
        component={FocusMusic}
      />
      <Stack.Screen
        name="Goals"
        component={Goals}
      />
      <Stack.Screen
        name="Resources"
        component={Resources}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
      />
    </Stack.Navigator>
  );
}

// Auth Stack Navigator
function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F5F7' },
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
}

// Root Navigator that switches between Auth and App based on session
function RootNavigator() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const shouldUseSplash = Platform.OS !== 'web';
  const [loading, setLoading] = useState(shouldUseSplash);
  const [theme, setTheme] = useState(themes.light);

  // Initialize global real-time synchronization
  useRealtime();

  useEffect(() => {
    const hydrateAuthenticatedUser = async (nextSession) => {
      if (!nextSession?.user?.id) {
        return;
      }

      try {
        await ensureProfile(nextSession.user);
      } catch (profileError) {
        console.error(
          'Error ensuring user profile:',
          profileError?.message,
          profileError
        );
      }

      await Promise.allSettled([
        loadUserTheme(nextSession.user.id),
        prefetchEssentialData(nextSession),
      ]);
    };

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          await hydrateAuthenticatedUser(session);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        if (!shouldUseSplash) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Inside RootNavigator (where session logic lives)
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);

        // Load theme preferences for authenticated user
        if (session) {
          await hydrateAuthenticatedUser(session);
        } else {
          // Clear all cached study data on logout for security and clean state
          queryClient.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const prefetchEssentialData = async (session) => {
    if (!session?.user?.id) return;
    
    // Use the memoized queryClient
    try {
      // Prefetch critical data in parallel
      queryClient.prefetchQuery({ queryKey: ['profile'], queryFn: () => getProfile(session.user.id) });
      queryClient.prefetchQuery({ queryKey: ['recent-sessions'], queryFn: () => getRecentSessions(session.user.id) });
      queryClient.prefetchQuery({ queryKey: ['challenges'], queryFn: () => getUserChallenges(session.user.id) });
    } catch (e) {
      console.warn('Prefetch failed:', e);
    }
  };

  const loadUserTheme = async (userId) => {
    try {
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();

      if (userPrefs?.preferences?.darkMode) {
        setTheme(themes.dark);
      } else {
        setTheme(themes.light);
      }
    } catch (error) {
      console.error('Error loading user theme:', error);
    }
  };

  // Calculate effective navigation theme
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <ThemeProvider theme={theme} setTheme={setTheme}>
      <View style={{ flex: 1, backgroundColor: loading ? '#0F172A' : theme.colors.background }}>
        <StatusBar
          barStyle={loading ? 'light-content' : (theme.mode === 'dark' ? 'light-content' : 'dark-content')}
          backgroundColor={loading ? '#0F172A' : theme.colors.primary}
        />
        {loading ? (
          <SplashScreen 
            key="app-splash"
            onComplete={(finalSession) => {
              if (finalSession) setSession(finalSession);
              // Defer unmounting to prevent DOM removal errors on Web
              setTimeout(() => setLoading(false), 50);
            }} 
          />
        ) : (
          <NavigationContainer key="app-nav" theme={navTheme}>
            {session ? <AppStackNavigator /> : <AuthStackNavigator />}
          </NavigationContainer>
        )}
      </View>
    </ThemeProvider>
  );
}

function AppWithToast() {
  const { showToast } = useToast();
  // memoize queryClient to prevent recreation
  const [queryClient] = useState(() => createQueryClient(showToast));

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppWithToast />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
