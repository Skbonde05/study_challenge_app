import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import ScreenHeader from '../components/common/ScreenHeader';

export default function FocusMusic({ navigation }) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Focus Music" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Icon name="music-note" size={64} color={theme.colors.border} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Lo-fi Beats Soon</Text>
        <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
          We're working on a curated collection of focus-enhancing music for your study sessions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});