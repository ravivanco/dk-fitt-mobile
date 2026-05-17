import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { apiClient } from '@/services/api.client';
import { intakeImageService } from '@/services/intake-image.service';
import { authStore } from '@/store/auth.store';
import {
  CalorieDashboard,
  FoodEstimate,
  confirmEstimatedMeal,
  estimateMealFromUploadedImage,
  getCalorieProgress,
  getLatestWeight,
  getRemainingCalories,
  getWeightDelta,
  loadCalorieDashboard,
  saveDailyWeight,
} from '@/services/calorie.service';

function ProgressRing({
  size,
  strokeWidth,
  progress,
  trackColor,
  progressColor,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  trackColor: string;
  progressColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        origin={`${size / 2}, ${size / 2}`}
        rotation={-90}
      />
    </Svg>
  );
}

function MacroRing({ value, color, icon, label, status }: { value: number; color: string; icon: string; label: string; status: string }) {
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroRingWrap}>
        <ProgressRing size={78} strokeWidth={6} progress={value / 100} trackColor="#edf0eb" progressColor={color} />
        <View style={styles.macroIconWrap}>
          <Text style={styles.macroEmoji}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{value}%</Text>
      <Text style={[styles.macroStatus, { color }]}>{status}</Text>
    </View>
  );
}

function formatShortDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

export default function ControlCaloricoScreen() {
  const [dashboard, setDashboard] = useState<CalorieDashboard | null>(null);
  const [userEval, setUserEval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [estimate, setEstimate] = useState<FoodEstimate | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [mealDescription, setMealDescription] = useState('');
  const [confirmingMeal, setConfirmingMeal] = useState(false);
  const [manualCalories, setManualCalories] = useState('');

  const loadDashboardState = React.useCallback(async () => {
    let mounted = true;
    setLoading(true);
    try {
      const userObj = await authStore.getUser();
      if (mounted && userObj?.evaluacion_clinica) {
        setUserEval(userObj.evaluacion_clinica);
      }
      
      try {
        const evalRes = await apiClient.get('/clinical-evaluations/me/history');
        if (mounted && evalRes.data?.data && Array.isArray(evalRes.data.data) && evalRes.data.data.length > 0) {
          setUserEval(evalRes.data.data[0]);
        }
      } catch (e) {
        console.log('Error fetching history:', e);
      }

      const nextDashboard = await loadCalorieDashboard();
      if (mounted) {
        setDashboard(nextDashboard);
        const latestWeight = getLatestWeight(nextDashboard);
        setWeightInput(latestWeight ? latestWeight.value.toString() : '');
      }
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    void loadDashboardState();
  }, [loadDashboardState]);

  useFocusEffect(
    React.useCallback(() => {
      void loadDashboardState();
    }, [loadDashboardState])
  );

  const latestWeight = dashboard ? getLatestWeight(dashboard) : null;
  const weightDelta = dashboard ? getWeightDelta(dashboard) : 0;
  
  const dailyTarget = userEval?.calorias_diarias_calculadas ?? dashboard?.dailyTarget ?? 1771;
  const calorieValue = dailyTarget; // Mostrar el total directamente
  const calorieProgress = 1; // Barra completa
  const calorieRingColor = '#1aa44f';
  
  const remainingCalories = dashboard ? getRemainingCalories(dashboard) : 470;
  const planActive = dashboard?.planActive ?? true;

  const weightDeltaLabel = useMemo(() => {
    if (!latestWeight || !dashboard || dashboard.weightEntries.length < 2) {
      return 'Sin cambio reciente';
    }

    if (weightDelta === 0) {
      return 'Igual que el ultimo registro';
    }

    return weightDelta > 0 ? `+${weightDelta} kg vs. ayer` : `${weightDelta} kg vs. ayer`;
  }, [dashboard, latestWeight, weightDelta]);

  const handleSaveWeight = async () => {
    const numericWeight = Number(weightInput.replace(',', '.'));

    if (!numericWeight || Number.isNaN(numericWeight) || numericWeight < 25 || numericWeight > 350) {
      Alert.alert('Peso invalido', 'Ingresa un valor realista en kilogramos.');
      return;
    }

    setSavingWeight(true);
    try {
      const updated = await saveDailyWeight(Number(numericWeight.toFixed(1)));
      setDashboard(updated);
      Alert.alert('Peso guardado', 'Tu registro del dia se actualizo correctamente.');
    } catch {
      Alert.alert('Error', 'No pudimos guardar tu peso por ahora.');
    } finally {
      setSavingWeight(false);
    }
  };

  const handleAnalyzePhoto = async (mode: 'camera' | 'library') => {
    try {
      if (mode === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a la camara para analizar tu comida.');
          return;
        }
      }

      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

      if (result.canceled) {
        return;
      }

      setEstimate(null);
      setSelectedImageUri(result.assets[0].uri);
      setUploadedImageUrl(null);
      setManualCalories('');

      setUploadingPhoto(true);
      const upload = await intakeImageService.uploadIntakeImage({ imageUri: result.assets[0].uri });
      const url = typeof upload?.imagen_url === 'string' ? upload.imagen_url : undefined;
      if (!url) {
        throw new Error('No se pudo subir la imagen. Verifica tu conexión.');
      }
      setUploadedImageUrl(url);
    } catch (error: any) {
      const status = typeof error?.status === 'number' ? error.status : undefined;
      if (status === 401) {
        Alert.alert('Sesión requerida', 'Inicia sesión para poder analizar tu comida.');
      } else if (status === 403) {
        Alert.alert('Acceso restringido', 'Tu cuenta no tiene permiso para analizar imágenes.');
      } else {
        const message = typeof error?.message === 'string' ? error.message : '';
        if (message.toLowerCase().includes('subir la imagen')) {
          Alert.alert('Error', 'No se pudo subir la imagen. Verifica tu conexiÃ³n.');
        } else {
          Alert.alert('Error', 'No se pudo analizar la imagen. Intenta de nuevo.');
        }
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleConfirmEstimate = async () => {
    if (!estimate) return;

    try {
      setConfirmingMeal(true);
      const needsManual = Boolean(estimate.requiresManualCalories);
      const manualValue = Number(manualCalories.replace(',', '.'));
      if (needsManual) {
        if (!manualValue || Number.isNaN(manualValue) || manualValue < 1 || manualValue > 5000) {
          Alert.alert('Calorías requeridas', 'Ingresa un valor válido para registrar esta comida.');
          return;
        }
      }

      const updated = await confirmEstimatedMeal({
        ...estimate,
        calories: needsManual ? Math.round(manualValue) : estimate.calories,
      });
      setDashboard(updated);
      setEstimate(null);
      setSelectedImageUri(null);
      setUploadedImageUrl(null);
      setMealDescription('');
      Alert.alert('Comida registrada', 'Las calorías ya impactan tu resumen del día.');
    } catch {
      Alert.alert('Error', 'No pudimos registrar esta comida.');
    } finally {
      setConfirmingMeal(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedImageUri || !uploadedImageUrl) {
      Alert.alert('Foto requerida', 'Primero toma o sube una foto para poder calcular.');
      return;
    }

    try {
      setAnalyzingPhoto(true);
      setEstimate(null);

      const description = mealDescription.trim().length > 0 ? mealDescription.trim() : undefined;
      const nextEstimate = await estimateMealFromUploadedImage({
        uploadedImageUrl,
        previewImageUri: selectedImageUri,
        descripcion_alimento: description,
      });

      if (__DEV__) {
        console.log('[ui][estimate]', {
          calories: nextEstimate.calories,
          requiresManualCalories: nextEstimate.requiresManualCalories,
          fuente_estimacion: nextEstimate.estimation?.fuente_estimacion,
          calorias_estimadas: nextEstimate.estimation?.calorias_estimadas,
        });
      }

      setManualCalories(nextEstimate.requiresManualCalories ? '' : `${nextEstimate.calories}`);
      setEstimate(nextEstimate);
    } catch (error: any) {
      const status = typeof error?.status === 'number' ? error.status : undefined;
      if (status === 401) {
        Alert.alert('Sesión requerida', 'Inicia sesión para poder analizar tu comida.');
      } else if (status === 403) {
        Alert.alert('Acceso restringido', 'Tu cuenta no tiene permiso para analizar imágenes.');
      } else {
        Alert.alert('Error', 'No se pudo analizar la imagen. Intenta de nuevo.');
      }
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#1aa44f" />
          <Text style={styles.loadingText}>Cargando control calorico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#0f1115" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>Control Calorico</Text>
              <Text style={styles.subtitle}>Tu energia diaria en un solo lugar</Text>
            </View>

            <View style={styles.headerBadge}>
              <View style={[styles.headerBadgeDot, { backgroundColor: planActive ? '#22a656' : '#ef4444' }]} />
              <Text style={styles.headerBadgeText}>{planActive ? 'Plan activo' : 'Plan no activo'}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Registro de Peso</Text>
                <Text style={styles.sectionNote}>Lleva el control de tu peso diariamente</Text>
              </View>
              <View style={styles.iconCircleBadge}>
                <MaterialCommunityIcons name="scale-bathroom" size={20} color="#1aa44f" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {/* Lado izquierdo: Peso guardado */}
              <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1.5, borderColor: '#f0ece3', paddingRight: 4 }}>
                <Text style={{ fontSize: 11, color: '#9e978e', fontWeight: '800', letterSpacing: 0.5 }}>ÚLTIMO PESO</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                  <Text style={{ fontSize: 36, color: '#08253a', fontWeight: '900' }}>{latestWeight ? latestWeight.value : '--'}</Text>
                  <Text style={{ fontSize: 16, color: '#b0a79b', fontWeight: '700', marginLeft: 2 }}>kg</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#b0a79b', marginTop: 2, fontWeight: '600' }}>
                  {latestWeight ? formatShortDate(latestWeight.date) : 'Sin datos'}
                </Text>
              </View>

              {/* Lado derecho: Ingreso */}
              <View style={{ flex: 1, paddingLeft: 12, gap: 10 }}>
                <TextInput
                  style={{ backgroundColor: '#fcfaf6', borderWidth: 1.5, borderColor: '#ece7dd', height: 48, borderRadius: 14, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#11141b' }}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  placeholder="00.0"
                  placeholderTextColor="#d3cbc1"
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <TouchableOpacity 
                  style={{ backgroundColor: '#f5a623', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#f5a623', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 }} 
                  onPress={handleSaveWeight} 
                  disabled={savingWeight}
                >
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>{savingWeight ? '...' : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, color: '#11141b', fontWeight: '800' }}>Balance Diario</Text>
            </View>

            {/* Top row: Calories Progress Bar */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                 <View>
                   <Text style={{ fontSize: 42, fontWeight: '900', color: '#08253a', lineHeight: 46 }}>{Math.max(0, dailyTarget - (dashboard?.consumedCalories ?? 0))}</Text>
                   <Text style={{ fontSize: 13, color: '#8b8378', fontWeight: '700' }}>Kcal Restantes</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end', paddingBottom: 4 }}>
                   <Text style={{ fontSize: 13, color: '#9e978e', fontWeight: '600' }}>Meta: {dailyTarget}</Text>
                 </View>
              </View>
              
              <View style={{ height: 14, backgroundColor: '#f0ece3', borderRadius: 7, overflow: 'hidden', flexDirection: 'row' }}>
                  <View style={{ width: `${Math.min(((dashboard?.consumedCalories ?? 0) / (dailyTarget || 1)) * 100, 100)}%`, backgroundColor: '#1aa44f', height: '100%' }} />
              </View>
              <Text style={{ fontSize: 12, color: '#f5a623', fontWeight: '700', marginTop: 8, textAlign: 'right' }}>
                 🔥 {dashboard?.consumedCalories ?? 0} consumidas
              </Text>
            </View>

            {/* Bottom Row: Macros */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#f0ece3', paddingTop: 16 }}>
              {[
                { label: 'Prot', percent: userEval?.distribucion_proteinas_pct ? parseInt(userEval.distribucion_proteinas_pct, 10) : (dashboard?.macros?.find((m: any) => m.key==='protein')?.percent ?? 35), color: '#34c759' },
                { label: 'Carbs', percent: userEval?.distribucion_carbohidratos_pct ? parseInt(userEval.distribucion_carbohidratos_pct, 10) : (dashboard?.macros?.find((m: any) => m.key==='carbs')?.percent ?? 40), color: '#ff3b30' },
                { label: 'Grasas', percent: userEval?.distribucion_grasas_pct ? parseInt(userEval.distribucion_grasas_pct, 10) : (dashboard?.macros?.find((m: any) => m.key==='fat')?.percent ?? 25), color: '#eab308' },
              ].map((macro) => (
                <View key={macro.label} style={{ flex: 1, paddingHorizontal: 6 }}>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#7c7268' }}>{macro.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: macro.color }}>{macro.percent}%</Text>
                   </View>
                   <View style={{ height: 6, backgroundColor: '#f0ece3', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${macro.percent}%`, backgroundColor: macro.color, height: '100%' }} />
                   </View>
                </View>
              ))}
            </View>
          </View>



          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Cuenta tus calorias</Text>
                <Text style={styles.sectionNote}>
                  Toma o sube una foto, agrega una descripcion opcional y presiona Calcular.
                </Text>
              </View>
              <View style={styles.scanIconBadge}>
                <MaterialCommunityIcons name="fire" size={18} color="#ef4444" />
              </View>
            </View>

            {/* ── PASO 1: Botones de seleccion de foto ── */}
            {!selectedImageUri && !uploadingPhoto && (
              <View style={styles.scanActionsRow}>
                <TouchableOpacity style={styles.scanAction} onPress={() => void handleAnalyzePhoto('camera')} disabled={uploadingPhoto}>
                  <MaterialCommunityIcons name="camera-outline" size={24} color="#f97316" />
                  <Text style={styles.scanActionTitle}>Tomar foto</Text>
                  <Text style={styles.scanActionText}>Captura la comida ahora</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanAction} onPress={() => void handleAnalyzePhoto('library')} disabled={uploadingPhoto}>
                  <MaterialCommunityIcons name="image-outline" size={24} color="#1aa44f" />
                  <Text style={styles.scanActionTitle}>Subir foto</Text>
                  <Text style={styles.scanActionText}>Usa una imagen guardada</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Cargando: subiendo imagen ── */}
            {uploadingPhoto && (
              <View style={styles.analysisCard}>
                <ActivityIndicator size="small" color="#f97316" />
                <Text style={styles.analysisTitle}>Subiendo foto...</Text>
                <Text style={styles.analysisText}>Guardando imagen en el servidor.</Text>
              </View>
            )}

            {/* ── PASO 2: Preview + descripcion + boton Calcular ── */}
            {selectedImageUri && uploadedImageUrl && !estimate && !analyzingPhoto && !uploadingPhoto && (
              <View>
                {/* Imagen preview */}
                <View style={styles.previewCard}>
                  <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="cover" />
                </View>

                {/* Campo de descripcion */}
                <View style={[styles.descriptionCard, { marginTop: 12 }]}>
                  <View style={styles.descriptionHeader}>
                    <MaterialCommunityIcons name="text-short" size={18} color="#8e8579" />
                    <Text style={styles.descriptionTitle}>Descripci\u00f3n (opcional)</Text>
                  </View>
                  <TextInput
                    value={mealDescription}
                    onChangeText={setMealDescription}
                    placeholder="Ej: hamburguesa, pizza, ensalada..."
                    placeholderTextColor="#b7b0a6"
                    style={styles.descriptionInput}
                    maxLength={80}
                    returnKeyType="done"
                  />
                  <Text style={styles.descriptionHint}>
                    Ayuda a la IA a estimar mejor cuando la foto no es clara.
                  </Text>
                </View>

                {/* Boton Calcular */}
                <TouchableOpacity style={styles.calcMainButton} onPress={() => void handleCalculate()} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="calculator-variant-outline" size={22} color="#ffffff" />
                  <Text style={styles.calcMainButtonText}>Calcular calor\u00edas</Text>
                </TouchableOpacity>

                {/* Cambiar foto */}
                <TouchableOpacity
                  onPress={() => { setSelectedImageUri(null); setUploadedImageUrl(null); setMealDescription(''); }}
                  style={{ alignItems: 'center', marginTop: 10, paddingVertical: 6 }}
                >
                  <Text style={{ color: '#9a9389', fontSize: 12, fontWeight: '700' }}>Cambiar foto</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Cargando: analizando ── */}
            {analyzingPhoto && (
              <View style={styles.analysisCard}>
                <ActivityIndicator size="small" color="#f97316" />
                <Text style={styles.analysisTitle}>Analizando comida...</Text>
                <Text style={styles.analysisText}>La IA est\u00e1 estimando calor\u00edas y macros.</Text>
              </View>
            )}

            {/* ── PASO 3: Resultado ── */}
            {estimate && (
              <View style={styles.estimateCard}>
                <Image source={{ uri: estimate.imageUri }} style={styles.estimateImage} />

                <View style={styles.estimateContent}>
                  {/* Nombre + badge */}
                  <View style={styles.estimateTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.estimateName}>{estimate.name}</Text>
                      <Text style={styles.estimateKcal}>
                        {estimate.requiresManualCalories
                          ? 'Calor\u00edas no detectadas'
                          : `${estimate.calories} kcal estimadas`}
                      </Text>
                    </View>
                    <View style={[styles.alertBadge, { backgroundColor: estimate.alertTone === 'high' ? '#fef2f2' : '#fff7ed' }]}>
                      <Text style={[styles.alertBadgeText, { color: estimate.alertTone === 'high' ? '#ef4444' : '#f97316' }]}>
                        {estimate.alertTone === 'high' ? 'Alto impacto' : 'Impacto medio'}
                      </Text>
                    </View>
                  </View>

                  {/* Alerta nutricional */}
                  <View style={styles.alertCard}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>{estimate.alertTitle}</Text>
                      <Text style={styles.alertText}>{estimate.alertMessage}</Text>
                    </View>
                  </View>

                  {/* Baja confianza */}
                  {typeof estimate.estimation?.confianza_pct === 'number' && estimate.estimation.confianza_pct < 50 && (
                    <View style={styles.warningCard}>
                      <MaterialCommunityIcons name="alert" size={18} color="#f97316" />
                      <Text style={styles.warningText}>
                        Estimaci\u00f3n con baja confianza ({Math.round(estimate.estimation.confianza_pct)}%). Revisa y ajusta si es necesario.
                      </Text>
                    </View>
                  )}

                  {/* Pills de meta */}
                  <View style={styles.metaGrid}>
                    {typeof estimate.estimation?.confianza_pct === 'number' && (
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="shield-check-outline" size={16} color="#1aa44f" />
                        <Text style={styles.metaPillText}>Confianza: {Math.round(estimate.estimation.confianza_pct)}%</Text>
                      </View>
                    )}
                    {typeof estimate.estimation?.porcion_estimada_g === 'number' && (
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="scale-bathroom" size={16} color="#8b5cf6" />
                        <Text style={styles.metaPillText}>Porci\u00f3n: {Math.round(estimate.estimation.porcion_estimada_g)} g</Text>
                      </View>
                    )}
                    {typeof estimate.estimation?.fuente_estimacion === 'string' && (
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="robot-outline" size={16} color="#64748b" />
                        <Text style={styles.metaPillText}>Fuente: {estimate.estimation.fuente_estimacion}</Text>
                      </View>
                    )}
                  </View>

                  {/* Input manual si no se pudo estimar */}
                  {estimate.requiresManualCalories && (
                    <View style={styles.manualCard}>
                      <Text style={styles.manualTitle}>No se pudo estimar con seguridad</Text>
                      <Text style={styles.manualText}>Ingresa las calor\u00edas manualmente para registrarla.</Text>
                      <View style={styles.manualInputRow}>
                        <TextInput
                          value={manualCalories}
                          onChangeText={setManualCalories}
                          placeholder="Ej: 650"
                          placeholderTextColor="#b7b0a6"
                          keyboardType="numeric"
                          style={styles.manualInput}
                          maxLength={5}
                        />
                        <Text style={styles.manualUnit}>kcal</Text>
                      </View>
                    </View>
                  )}

                  {/* Macros */}
                  {estimate.estimation?.macros && (
                    <View style={styles.macrosCard}>
                      <Text style={styles.macrosTitle}>Macros</Text>
                      <View style={styles.macrosRowApi}>
                        <View style={styles.macroChip}>
                          <Text style={styles.macroChipLabel}>Prote\u00ednas</Text>
                          <Text style={styles.macroChipValue}>{Math.round(Number(estimate.estimation.macros.proteinas_g ?? 0))} g</Text>
                        </View>
                        <View style={styles.macroChip}>
                          <Text style={styles.macroChipLabel}>Carbs</Text>
                          <Text style={styles.macroChipValue}>{Math.round(Number(estimate.estimation.macros.carbohidratos_g ?? 0))} g</Text>
                        </View>
                        <View style={styles.macroChip}>
                          <Text style={styles.macroChipLabel}>Grasas</Text>
                          <Text style={styles.macroChipValue}>{Math.round(Number(estimate.estimation.macros.grasas_g ?? 0))} g</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Alimentos detectados */}
                  {Array.isArray(estimate.estimation?.alimentos_detectados) && estimate.estimation.alimentos_detectados.length > 0 && (
                    <View style={styles.foodsCard}>
                      <Text style={styles.foodsTitle}>Alimentos detectados</Text>
                      {estimate.estimation.alimentos_detectados.slice(0, 10).map((food: any, index: number) => (
                        <View key={`food-${index}`} style={styles.foodRow}>
                          <Text style={styles.foodName}>{food?.nombre ?? 'Alimento'}</Text>
                          <Text style={styles.foodMeta}>
                            {typeof food?.cantidad_g === 'number' ? `${Math.round(food.cantidad_g)} g \u2022 ` : ''}
                            {typeof food?.calorias === 'number' ? `${Math.round(food.calorias)} kcal` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Mensaje de la IA */}
                  {typeof estimate.estimation?.mensaje === 'string' && estimate.estimation.mensaje.trim().length > 0 && (
                    <View style={styles.messageCard}>
                      <MaterialCommunityIcons name="information-outline" size={18} color="#64748b" />
                      <Text style={styles.messageText}>{estimate.estimation.mensaje}</Text>
                    </View>
                  )}

                  {/* Sugerencias de ejercicio */}
                  <Text style={styles.exerciseTitle}>Si decides consumirla, te sugerimos:</Text>
                  <View style={styles.exerciseChips}>
                    {estimate.exerciseSuggestions.map((suggestion) => (
                      <View key={suggestion} style={styles.exerciseChip}>
                        <Text style={styles.exerciseChipText}>{suggestion}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Acciones */}
                  <View style={styles.estimateButtons}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        setEstimate(null);
                        setSelectedImageUri(null);
                        setUploadedImageUrl(null);
                        setMealDescription('');
                      }}
                    >
                      <View style={styles.decisionContent}>
                        <Text style={styles.decisionEmoji}>\u2715</Text>
                        <Text style={styles.secondaryButtonText}>Descartar</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryButton, confirmingMeal && { opacity: 0.75 }]}
                      disabled={confirmingMeal}
                      onPress={() => void handleConfirmEstimate()}
                    >
                      <View style={styles.decisionContent}>
                        {confirmingMeal
                          ? <ActivityIndicator size="small" color="#ffffff" />
                          : <Text style={styles.decisionEmoji}>\u2713</Text>
                        }
                        <Text style={styles.primaryButtonText}>{confirmingMeal ? 'Guardando...' : 'Registrar'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>


        </ScrollView>

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
    backgroundColor: '#f8f6f1',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 124,
    gap: 16,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f8f6f1',
  },
  loadingText: {
    fontSize: 14,
    color: '#7d756a',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#efe8df',
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f1115',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8b8378',
    fontWeight: '600',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f0e8',
    borderWidth: 1,
    borderColor: '#e9decf',
  },
  headerBadgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f493e',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#efe8df',
    padding: 18,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ringSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ringInner: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 2,
    borderColor: '#f0ece5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  ringCalories: {
    fontSize: 38,
    lineHeight: 42,
    color: '#11141b',
    fontWeight: '900',
  },
  ringUnit: {
    marginTop: 2,
    fontSize: 18,
    color: '#8e8579',
    fontWeight: '700',
  },
  ringCaption: {
    marginTop: 6,
    fontSize: 12,
    color: '#b0a79b',
    fontWeight: '600',
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  metricPill: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#faf7f1',
    borderWidth: 1,
    borderColor: '#efe8df',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricPillLabel: {
    fontSize: 12,
    color: '#9b9185',
    fontWeight: '700',
    marginBottom: 4,
  },
  metricPillValue: {
    fontSize: 15,
    color: '#11141b',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#efe8df',
    padding: 18,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#11141b',
    fontWeight: '800',
  },
  sectionNote: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#908779',
    fontWeight: '500',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fcfaf6',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#f0e8dd',
  },
  macroRingContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroCenter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#eee7dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroEmoji: {
    fontSize: 22,
  },
  macroCardTitle: {
    marginTop: 10,
    fontSize: 12,
    color: '#1a1d21',
    fontWeight: '700',
    textAlign: 'center',
  },
  macroCardValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '900',
  },
  macroCardStatus: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#f5f0e8',
    borderWidth: 1,
    borderColor: '#e8dece',
  },
  weightBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#11141b',
  },
  weightSummaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    padding: 14,
  },
  weightStatLabel: {
    fontSize: 12,
    color: '#9b9185',
    fontWeight: '700',
    marginBottom: 8,
  },
  weightStatValue: {
    fontSize: 24,
    color: '#11141b',
    fontWeight: '900',
  },
  weightStatHint: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#8f8578',
    fontWeight: '600',
  },
  weightEntryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  weightInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fbf8f3',
    borderWidth: 1,
    borderColor: '#ece2d6',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#11141b',
    fontWeight: '700',
  },
  saveWeightButton: {
    minWidth: 124,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f5a623',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveWeightButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  weightHistoryRow: {
    gap: 10,
    paddingTop: 14,
  },
  weightHistoryPill: {
    minWidth: 92,
    borderRadius: 16,
    backgroundColor: '#f7f3ec',
    borderWidth: 1,
    borderColor: '#ece1d4',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weightHistoryDate: {
    fontSize: 11,
    color: '#8f8578',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weightHistoryValue: {
    marginTop: 4,
    fontSize: 15,
    color: '#11141b',
    fontWeight: '800',
  },
  scanIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff3eb',
    borderWidth: 1,
    borderColor: '#ffd7bf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scanAction: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    padding: 16,
  },
  scanActionTitle: {
    marginTop: 12,
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  scanActionText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#908779',
    fontWeight: '500',
  },
  descriptionCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe4',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  descriptionTitle: {
    color: '#4f493e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  descriptionInput: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ece2d6',
    backgroundColor: '#fbf8f3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#11141b',
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionHint: {
    marginTop: 8,
    color: '#9a9389',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  analysisCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#fff8f2',
    borderWidth: 1,
    borderColor: '#ffd9c2',
    padding: 16,
    alignItems: 'center',
  },
  analysisTitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  analysisText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#8e8579',
    textAlign: 'center',
  },
  previewCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe4',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 190,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    backgroundColor: '#f97316',
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  calcMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    backgroundColor: '#f97316',
    borderRadius: 16,
    marginTop: 12,
  },
  calcMainButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  estimateCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    overflow: 'hidden',
  },
  estimateImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1ede7',
  },
  estimateContent: {
    padding: 16,
  },
  estimateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  estimateName: {
    fontSize: 18,
    color: '#11141b',
    fontWeight: '800',
  },
  estimateKcal: {
    marginTop: 4,
    fontSize: 14,
    color: '#1aa44f',
    fontWeight: '800',
  },
  alertBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  alertCard: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    backgroundColor: '#fff4f4',
    borderWidth: 1,
    borderColor: '#ffd2d2',
    padding: 14,
  },
  alertTitle: {
    fontSize: 13,
    color: '#8f1d1d',
    fontWeight: '800',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8f5f5f',
    fontWeight: '600',
  },
  exerciseTitle: {
    marginTop: 14,
    fontSize: 13,
    color: '#11141b',
    fontWeight: '800',
  },
  exerciseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  exerciseChip: {
    borderRadius: 999,
    backgroundColor: '#eef8f1',
    borderWidth: 1,
    borderColor: '#cfead8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exerciseChipText: {
    fontSize: 12,
    color: '#1c7f49',
    fontWeight: '700',
  },
  estimateButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    color: '#7c2d12',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  metaPillText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  manualCard: {
    marginTop: 12,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#efe6d8',
    padding: 12,
    borderRadius: 16,
  },
  manualTitle: {
    color: '#11141b',
    fontSize: 13,
    fontWeight: '900',
  },
  manualText: {
    marginTop: 4,
    color: '#8e8579',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  manualInputRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#efe6d8',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#0f1115',
  },
  manualUnit: {
    color: '#8e8579',
    fontSize: 12,
    fontWeight: '800',
  },
  macrosCard: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 16,
  },
  macrosTitle: {
    color: '#11141b',
    fontSize: 13,
    fontWeight: '900',
  },
  macrosRowApi: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  macroChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  macroChipLabel: {
    color: '#8e8579',
    fontSize: 11,
    fontWeight: '800',
  },
  macroChipValue: {
    marginTop: 4,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  foodsCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe4',
    padding: 12,
    borderRadius: 16,
  },
  foodsTitle: {
    color: '#11141b',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  foodRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#f1efe9',
  },
  foodName: {
    color: '#11141b',
    fontSize: 12,
    fontWeight: '800',
  },
  foodMeta: {
    marginTop: 2,
    color: '#8e8579',
    fontSize: 11,
    fontWeight: '700',
  },
  messageCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    flex: 1,
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  decisionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  decisionEmoji: {
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#f3eee6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#f5a623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    padding: 14,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff3eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextWrap: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  historyDate: {
    marginTop: 4,
    fontSize: 11,
    color: '#908779',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  historyKcal: {
    fontSize: 14,
    color: '#1aa44f',
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  emptyStateTitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  emptyStateText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#908779',
    textAlign: 'center',
    fontWeight: '500',
  },
  homeCardStyle: {
    borderRadius: 26,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#efebe4',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  homeCardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  homeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  homeFlameCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffd8be',
    backgroundColor: '#fff8f2',
  },
  homeCardTitle: {
    color: '#101318',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    flexShrink: 1,
  },
  homePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3efe7',
    borderWidth: 1,
    borderColor: '#e5ddd1',
    borderRadius: 18,
    height: 34,
    paddingHorizontal: 11,
    gap: 6,
    marginLeft: 'auto',
    flexShrink: 1,
    maxWidth: '42%',
  },
  homePlanIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homePlanText: {
    color: '#4f493e',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  homeCalorieRingWrap: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeCalorieInner: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: '#f0eeea',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  homeCalorieValue: {
    color: '#11141b',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  homeCalorieUnit: {
    color: '#9a9389',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  homeSectionTitle: {
    marginTop: 4,
    color: '#8e8579',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
  },
  homeMacrosRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroRingWrap: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroIconWrap: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f7f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ece8e0',
  },
  macroLabel: {
    color: '#1d2028',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },
  macroValue: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  macroStatus: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  iconCircleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eafbe4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#fbf8f3',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ece2d6',
    marginBottom: 16,
  },
  premiumWeightInput: {
    fontSize: 54,
    fontWeight: '900',
    color: '#08253a',
    padding: 0,
    margin: 0,
    height: 64,
    textAlign: 'center',
    minWidth: 120,
  },
  premiumWeightUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9e978e',
    marginBottom: 10,
    marginLeft: 4,
  },
  premiumSaveButton: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#f5a623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f5a623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  premiumSaveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
