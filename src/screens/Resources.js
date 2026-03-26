import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/useAppTheme';
import ScreenHeader from '../components/common/ScreenHeader';

export default function Resources({ navigation }) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ScreenHeader 
        title="Study Resources" 
        onBack={() => navigation.goBack()} 
        theme={theme}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Icon name="library-shelves" size={64} color={theme.colors.border} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Resource Library</Text>
        <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
          Find curated study guides, templates, and helpful articles to boost your focus and productivity.
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