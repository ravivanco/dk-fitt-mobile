import React, { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { useAuth } from '@/hooks/use-auth';

export default function PerfilEditarScreen() {
  const { user } = useAuth();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNombres(user.nombres);
      setApellidos(user.apellidos);
    }
  }, [user]);

  const handleSave = async () => {
    if (!nombres.trim() || !apellidos.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar llamada a API para actualizar perfil
      // await profileService.updateProfile({ nombres, apellidos, edad: parseInt(edad) });
      
      Alert.alert('Éxito', 'Datos actualizados correctamente.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header con botón back */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#0f1115" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Datos Personales</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Actualiza tu información personal.</Text>

            {/* Campo: Nombres */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#c4bfb6"
                value={nombres}
                onChangeText={setNombres}
                editable={!loading}
              />
            </View>

            {/* Campo: Apellidos */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu apellido"
                placeholderTextColor="#c4bfb6"
                value={apellidos}
                onChangeText={setApellidos}
                editable={!loading}
              />
            </View>

            {/* Campo: Edad */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Edad (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu edad"
                placeholderTextColor="#c4bfb6"
                value={edad}
                onChangeText={setEdad}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <MaterialCommunityIcons name="check" size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#efebe4',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f1115',
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  subtitle: {
    color: '#8e8579',
    fontSize: 15,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f1115',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f1115',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f1ede6',
  },
  saveButton: {
    backgroundColor: '#f5a623',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f1115',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 40,
  },
});
