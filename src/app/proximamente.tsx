import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';

type Params = {
  module?: string;
};

export default function ProximamenteScreen() {
  const { module } = useLocalSearchParams<Params>();
  const moduleName = typeof module === 'string' && module.trim().length > 0 ? module.trim() : 'este módulo';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="alert" size={64} color="#f2b01e" />
          </View>

          <Text style={styles.title}>No se pudo cargar {moduleName}</Text>
          <Text style={styles.subtitle}>Próximamente</Text>

          <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Regresar</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#f8f6f1',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconWrap: {
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: '#0f1115',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8e8579',
    textAlign: 'center',
    marginBottom: 22,
  },
  button: {
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#1aa44f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

