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
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useRealtime } from './src/hooks/useRealtime';

// Global toast error handler configuration
const createQueryClient = (showToast) => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      showToast(error.message || 'Failed to fetch data', 'error');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      showToast(error.message || 'Operation failed', 'error');
    },
  }),
});

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
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(themes.light);

  // Initialize global real-time synchronization
  useRealtime();

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);

        // Load theme preferences for authenticated user
        if (session) {
          loadUserTheme(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserTheme = async (userId) => {
    try {
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      if (userPrefs?.preferences?.darkMode) {
        setTheme(themes.dark);
      } else {
        setTheme(themes.light);
      }
    } catch (error) {
      console.error('Error loading user theme:', error);
    }
  };

  return (
    <ThemeProvider theme={theme} setTheme={setTheme}>
      <View style={{ flex: 1, backgroundColor: loading ? '#4A90E2' : theme.background }} key="root-container">
        {loading ? (
          <View key="loading-view" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
            <SplashScreen />
          </View>
        ) : (
          <NavigationContainer theme={MyTheme} key="nav-container">
            <StatusBar
              barStyle={theme === themes.dark ? 'light-content' : 'dark-content'}
              backgroundColor={theme.primary}
            />
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