import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { useAuth } from '@/hooks/use-auth';

export default function PerfilScreen() {
  const { logout, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <View style={styles.content}>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Tu informacion, metas y configuracion de cuenta.</Text>

          <TouchableOpacity
            style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
            activeOpacity={0.85}
            onPress={() => void logout()}
            disabled={isLoading}
          >
            <Text style={styles.logoutButtonText}>
              {isLoading ? 'Cerrando sesion...' : 'Cerrar sesion'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Para agregar otro paciente, primero cierra sesion y luego registralo desde la pantalla de login.
          </Text>
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
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#11141b',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    marginTop: 12,
    color: '#8e8579',
    fontSize: 13,
    lineHeight: 18,
  },
});
