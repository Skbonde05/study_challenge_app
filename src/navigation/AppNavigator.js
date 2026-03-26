// src/navigation/AppNavigator.js (FIXED - Bottom tabs visible)
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Dashboard from '../screens/Dashboard';
import Profile from '../screens/Profile';
import Timer from '../screens/Timer';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ClassroomsScreen from '../screens/ClassroomsScreen';
import StoreScreen from '../screens/StoreScreen';
import Challenges from '../screens/Challenges';
import FocusMusic from '../screens/FocusMusic';
import Goals from '../screens/Goals';
import Resources from '../screens/Resources';
import BadgesScreen from '../screens/BadgesScreen';
import Notifications from '../screens/Notifications';
import Settings from '../screens/Settings';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator - This is the MAIN APP with bottom tabs
function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={({ route }) => ({
        headerShown: false, // Hide headers in tabs (screens have their own headers)
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TimerTab') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'ChallengesTab') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'LeaderboardTab') {
            iconName = focused ? 'podium' : 'podium-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
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
        name="ChallengesTab" 
        component={Challenges}
        options={{
          tabBarLabel: 'Challenges',
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

// Auth Stack Navigator (before login)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: '#F5F5F7' },
      }}
      initialRouteName="Splash"
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
      />
      <Stack.Screen 
        name="Login" 
        component={Login}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUp}
        options={{
          headerShown: true,
          title: 'Create Account',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Main Stack Navigator (for modal screens that show over tabs)
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal', // Modal presentation for screens that appear over tabs
      }}
    >
      {/* Main tabs as the first screen */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
      />
      
      {/* Modal screens - these will appear OVER the tabs */}
      <Stack.Screen 
        name="Classrooms" 
        component={ClassroomsScreen}
        options={{
          headerShown: true,
          title: 'Study Groups',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Store" 
        component={StoreScreen}
        options={{
          headerShown: true,
          title: 'Store',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="FocusMusic" 
        component={FocusMusic}
        options={{
          headerShown: true,
          title: 'Focus Music',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Goals" 
        component={Goals}
        options={{
          headerShown: true,
          title: 'Goals',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Resources" 
        component={Resources}
        options={{
          headerShown: true,
          title: 'Study Resources',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Badges" 
        component={BadgesScreen}
        options={{
          headerShown: true,
          title: 'My Badges',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={Notifications}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={Settings}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: {
            backgroundColor: '#4A90E2',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        setTimeout(() => {
          setLoading(false);
          setInitializing(false);
        }, 500);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
        setInitializing(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}