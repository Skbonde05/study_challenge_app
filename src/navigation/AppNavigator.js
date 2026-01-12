// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../services/supabase';

// Import screens
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

const Stack = createStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: '#F5F5F7' },
      }}
      initialRouteName="Dashboard"
    >
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={Profile}
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Timer" 
        component={Timer}
        options={{
          headerShown: true,
          title: 'Study Timer',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          headerShown: true,
          title: 'Leaderboard',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Classrooms" 
        component={ClassroomsScreen}
        options={{
          headerShown: true,
          title: 'Study Groups',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
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
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Badges" 
        component={BadgesScreen}
        options={{
          headerShown: true,
          title: 'Badges',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="Challenges" 
        component={Challenges}
        options={{
          headerShown: true,
          title: 'Challenges',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
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
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
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
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
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
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
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
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: '#F5F5F7' },
      }}
      initialRouteName="Login"
    >
      <Stack.Screen 
        name="Login" 
        component={Login}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUp}
        options={{
          headerShown: true,
          title: 'Create Account',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {session ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}