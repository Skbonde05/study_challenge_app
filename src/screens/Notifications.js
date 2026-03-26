import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import ScreenHeader from '../components/common/ScreenHeader';

export default function Notifications({ navigation }) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Notifications" 
        onBack={() => navigation.goBack()} 
        theme={theme}
        rightElement={
          <TouchableOpacity>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Icon name="bell-outline" size={80} color={theme.colors.border} style={styles.icon} />
        <Text style={[styles.title, { color: theme.colors.text }]}>No Notifications</Text>
        <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
          You're all caught up! Check back later for study reminders and achievement updates.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  clearText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  icon: { marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 15, textAlign: 'center', lineHeight: 22, opacity: 0.7 },
});