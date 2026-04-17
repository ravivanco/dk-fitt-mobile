import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';

export default function BiomEditarScreen() {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [masaMuscular, setMasaMuscular] = useState('');
  const [porcentajeGrasa, setPorcentajeGrasa] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!peso.trim() || !altura.trim()) {
      Alert.alert('Error', 'Por favor completa los campos de peso y altura.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar llamada a API para guardar datos de bioimpedancia
      // await bioimpedanciaService.saveMeasurement({...});
      
      Alert.alert('Éxito', 'Datos de bioimpedancia registrados correctamente.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIMC = () => {
    if (peso && altura) {
      const alt = parseFloat(altura);
      const p = parseFloat(peso);
      if (alt > 0 && p > 0) {
        const imc = p / (alt * alt);
        return imc.toFixed(1);
      }
    }
    return '—';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#0f1115" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bioimpedancia</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Registra tus medidas corporales.</Text>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={18} color="#f5a623" />
              <Text style={styles.infoText}>
                Estos datos fueron medidos con la nutricionista. Actualiza cuando tengas nuevas mediciones.
              </Text>
            </View>

            {/* Campo: Peso */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 75.5"
                placeholderTextColor="#c4bfb6"
                value={peso}
                onChangeText={setPeso}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            {/* Campo: Altura */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Altura (m) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 1.75"
                placeholderTextColor="#c4bfb6"
                value={altura}
                onChangeText={setAltura}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            {/* IMC Automático */}
            {(peso || altura) && (
              <View style={styles.imcCard}>
                <Text style={styles.imcLabel}>IMC Calculado</Text>
                <Text style={styles.imcValue}>{calculateIMC()}</Text>
              </View>
            )}

            {/* Campo: Masa Muscular */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Masa Muscular (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 32"
                placeholderTextColor="#c4bfb6"
                value={masaMuscular}
                onChangeText={setMasaMuscular}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            {/* Campo: Porcentaje de Grasa */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Porcentaje de Grasa Corporal (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 18"
                placeholderTextColor="#c4bfb6"
                value={porcentajeGrasa}
                onChangeText={setPorcentajeGrasa}
                keyboardType="decimal-pad"
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
                  {loading ? 'Guardando...' : 'Guardar Medidas'}
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
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fffbf7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8e8579',
    lineHeight: 18,
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
  imcCard: {
    backgroundColor: '#f8f6f1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  imcLabel: {
    fontSize: 12,
    color: '#8e8579',
    marginBottom: 8,
  },
  imcValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f5a623',
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
