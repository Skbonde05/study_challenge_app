// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/services/supabase';

// Import ALL screens
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

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animationEnabled: true 
          }}
        >
          {!session ? (
            // Auth flow - Login is the initial screen
            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="SignUp" component={SignUp} />
            </>
          ) : (
            // App flow - Dashboard is the initial screen
            // Register ALL screens that your app needs
            <>
              <Stack.Screen name="Dashboard" component={Dashboard} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="Timer" component={Timer} />
              <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
              <Stack.Screen name="Classrooms" component={ClassroomsScreen} />
              <Stack.Screen name="Store" component={StoreScreen} />
              <Stack.Screen name="Badges" component={BadgesScreen} />
              <Stack.Screen name="Challenges" component={Challenges} />
              <Stack.Screen name="FocusMusic" component={FocusMusic} />
              <Stack.Screen name="Goals" component={Goals} />
              <Stack.Screen name="Resources" component={Resources} />
              <Stack.Screen name="Notifications" component={Notifications} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}