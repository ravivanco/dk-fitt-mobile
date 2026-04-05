import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';

export default function CalendarioScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <View style={styles.content}>
          <Text style={styles.title}>Calendario</Text>
          <Text style={styles.subtitle}>Tus dias activos, controles y recordatorios.</Text>
        </View>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f1',
  },
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  title: {
    color: '#11141b',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    color: '#8e8579',
    fontSize: 16,
    lineHeight: 20,
    maxWidth: 320,
  },
});
