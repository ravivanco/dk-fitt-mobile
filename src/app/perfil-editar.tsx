import React, { useState, useEffect } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { useAuth } from '@/hooks/use-auth';
import { authStore } from '@/store/auth.store';

export default function PerfilEditarScreen() {
  const [user, setUser] = useState<any>(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authStore.getUser();
        setUser(userData);
        setNombres(userData?.nombres || '');
        setApellidos(userData?.apellidos || '');
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la imagen');
      console.error(error);
    }
  };

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

            {/* Sección de Foto */}
            <View style={styles.photoSection}>
              <TouchableOpacity 
                style={styles.photoContainer}
                onPress={pickImage}
              >
                {photoUri ? (
                  <Image 
                    source={{ uri: photoUri }} 
                    style={styles.photoImage}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={48} color="#f5a623" />
                  </View>
                )}
                <View style={styles.editPhotoIcon}>
                  <MaterialIcons name="edit" size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Toca para cambiar foto</Text>
            </View>

            {/* Campo: Nombres */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithIcon}>
                <MaterialIcons name="person" size={18} color="#f5a623" />
                <Text style={styles.label}>Nombres</Text>
              </View>
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
              <View style={styles.labelWithIcon}>
                <MaterialIcons name="badge" size={18} color="#f5a623" />
                <Text style={styles.label}>Apellidos</Text>
              </View>
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
              <View style={styles.labelWithIcon}>
                <MaterialIcons name="cake" size={18} color="#f5a623" />
                <Text style={styles.label}>Edad (opcional)</Text>
              </View>
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
                <MaterialIcons name="close" size={20} color="#0f1115" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <MaterialIcons name="check-circle" size={20} color="#ffffff" />
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
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#f5a623',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f6f1',
    borderWidth: 2,
    borderColor: '#f5a623',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5a623',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  photoHint: {
    fontSize: 12,
    color: '#7c7268',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f1115',
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
