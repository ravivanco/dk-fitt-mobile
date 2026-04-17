import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { IMCGauge } from '@/components/metrics/IMC';
import { useAuth } from '@/hooks/use-auth';
import { authStore } from '@/store/auth.store';

// Componente Anillo Circular para Porcentajes
const PercentageRing = ({ percentage, color, label, unit }: { percentage: number; color: string; label: string; unit: string }) => {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <View style={styles.ringSvgWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Fondo del anillo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e0e7ff"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Anillo de progreso */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Porcentaje en el centro */}
          <SvgText
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dy="0.3em"
            fontSize="20"
            fontWeight="900"
            fill={color}
          >
            {percentage.toFixed(1)}%
          </SvgText>
        </Svg>
      </View>
      <Text style={styles.ringLabelCircular}>{label}</Text>
      <Text style={styles.ringUnitCircular}>{unit}</Text>
    </>
  );
};

// Categorías de alimentos (5 grupos)
const FOOD_CATEGORIES = {
  proteinas: { name: 'Proteínas', emoji: '🍗', color: '#ef4444' },
  carbohidratos: { name: 'Carbohidratos', emoji: '🍞', color: '#92400e' },
  lacteos: { name: 'Lácteos', emoji: '🥛', color: '#f97316' },
  vegetales: { name: 'Vegetales', emoji: '🥦', color: '#22c55e' },
  frutas: { name: 'Frutas', emoji: '🍇', color: '#a855f7' },
};

// Mapeo exacto de IDs a categorías según la API
const ALIMENTO_ID_MAPPING: { [key: number]: string } = {
  // Proteínas
  3: 'proteinas',   // Pescado
  5: 'proteinas',   // Legumbres
  6: 'proteinas',   // Pollo
  11: 'proteinas',  // Atun
  12: 'proteinas',  // Res
  16: 'proteinas',  // Pavo
  18: 'proteinas',  // Huevos
  // Carbohidratos
  2: 'carbohidratos',   // Arroz
  4: 'carbohidratos',   // Quinoa
  8: 'carbohidratos',   // Pasta
  10: 'carbohidratos',  // Batata
  20: 'carbohidratos',  // Papas
  25: 'carbohidratos',  // Pan
  28: 'carbohidratos',  // Avena
  // Lácteos
  15: 'lacteos',   // Queso
  17: 'lacteos',   // Yogur
  30: 'lacteos',   // Cuajada
  31: 'lacteos',   // Crema
  33: 'lacteos',   // Mantequilla
  // Vegetales
  1: 'vegetales',   // Zanahoria
  21: 'vegetales',  // Brocoli
  23: 'vegetales',  // Lechuga
  26: 'vegetales',  // Cebolla
  27: 'vegetales',  // Espinaca
  32: 'vegetales',  // Pimientos
  // Frutas
  7: 'frutas',    // Banana
  9: 'frutas',    // Uvas
  13: 'frutas',   // Fresas
  14: 'frutas',   // Naranja
  19: 'frutas',   // Sandia
  22: 'frutas',   // Manzana
  24: 'frutas',   // Arandanos
};

// Mapeo de alimentos a categorías por nombre (fallback)
const categorizarAlimento = (alimento: any): string => {
  const idAlimento = alimento.id_alimento;
  
  // Primero intentar por ID
  if (idAlimento && ALIMENTO_ID_MAPPING[idAlimento]) {
    return ALIMENTO_ID_MAPPING[idAlimento];
  }

  // Fallback por nombre
  const nombre = (alimento.nombre_alimento || alimento.nombre || '').toLowerCase();
  
  const keywordsByCategory = {
    proteinas: ['pollo', 'res', 'carne', 'pescado', 'huevo', 'legumbre', 'atun', 'pavo', 'carne molida'],
    carbohidratos: ['arroz', 'pan', 'pasta', 'papa', 'avena', 'quinoa', 'batata', 'maiz'],
    lacteos: ['leche', 'yogur', 'queso', 'mantequilla', 'crema', 'requeson', 'cuajada'],
    vegetales: ['brocoli', 'zanahoria', 'espinaca', 'cebolla', 'pimiento', 'lechuga', 'tomate', 'pepino'],
    frutas: ['manzana', 'banana', 'naranja', 'uva', 'fresa', 'sandia', 'arandano', 'piña', 'durazno'],
  };

  for (const [category, keywords] of Object.entries(keywordsByCategory)) {
    if (keywords.some(kw => nombre.includes(kw))) {
      return category;
    }
  }

  return 'vegetales'; // categoría por defecto
};

const calcularIMC = (peso: number, altura: number): string => {
  if (!peso || !altura || altura <= 0) return '–';
  const imc = peso / (altura * altura);
  return imc.toFixed(1);
};

export default function DatosMedicosScreen() {
  const { logout, isLoading } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    proteinas: false,
    carbohidratos: false,
    lacteos: false,
    vegetales: false,
    frutas: false,
  });

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authStore.getUser();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        setErrorMessage('Los datos guardados están corruptos. Sesión reiniciada.');
        try {
          await authStore.clearSession();
        } catch (clearError) {
          console.error('Error clearing session:', clearError);
        }
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5eb3c4" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef5350" style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void logout()}>
            <Text style={styles.retryButtonText}>Ir al Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const onboarding = user?.onboarding || {};
  const nivelActividad = onboarding.nivel_actividad_fisica || '–';
  const objetivo = onboarding.objetivo || '–';
  const alergias = onboarding.alergias_intolerancias || '–';
  const restricciones = onboarding.restricciones_alimenticias || '–';
  const condiciones = onboarding.condiciones || [];
  const alimentos = onboarding.alimentos_preferidos || [];
  const deportes = onboarding.deportes || [];

  const peso = user?.peso || 75;
  const altura = user?.altura || 1.75;
  const porcentajeGrasa = user?.porcentaje_grasa || 20;
  const masaMuscular = user?.masa_muscular || 30;
  const grasaVisceral = user?.grasa_visceral || 5;
  const porcentajeAgua = user?.agua || 60;
  const masaOsea = user?.masa_osea || 3.2;
  const metabolismoBasal = user?.metabolismo_basal || 1600;
  const imc = calcularIMC(peso, altura);
  const muscleMin = 20;
  const muscleMax = 50;
  const muscleProgress = Math.min(Math.max(((masaMuscular - muscleMin) / (muscleMax - muscleMin)) * 100, 0), 100);
  const muscleStatus = masaMuscular >= 28 ? 'Bueno' : masaMuscular >= 24 ? 'Moderado' : 'Bajo';
  const muscleStatusColor = masaMuscular >= 28 ? '#10b981' : masaMuscular >= 24 ? '#f59e0b' : '#ef4444';
  const visceralFatMax = 20;
  const visceralFatProgress = Math.min((grasaVisceral / visceralFatMax) * 100, 100);
  const visceralFatStatus = grasaVisceral <= 9 ? 'Buen progreso' : grasaVisceral <= 14 ? 'Moderado' : 'Elevado';
  const visceralFatStatusColor = grasaVisceral <= 9 ? '#22c55e' : grasaVisceral <= 14 ? '#f59e0b' : '#ef4444';
  const boneMassMax = 5;
  const boneMassProgress = Math.min((masaOsea / boneMassMax) * 100, 100);
  const boneMassStatus = masaOsea >= 3 ? 'Huesos fuertes' : masaOsea >= 2.3 ? 'Óptimo' : 'Bajo';
  const boneMassStatusColor = masaOsea >= 3 ? '#22c55e' : masaOsea >= 2.3 ? '#7c5a36' : '#ef4444';
  const boneMassMarkerLeft = `${Math.min(Math.max(boneMassProgress - 2, 0), 96)}%`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FormBackgroundDecor />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderLabel}>Datos Médicos</Text>
          <Text style={styles.pageHeaderSubtitle}>Tu información de salud</Text>
        </View>

        {/* Información de Salud */}
        <View style={styles.card}>
          <Text style={styles.subsectionTitle}>Información de Salud</Text>
          
          <View style={styles.healthRow}>
            <View style={styles.healthIcon}>
              <Text style={styles.healthEmoji}>💪</Text>
            </View>
            <View style={styles.healthContent}>
              <Text style={styles.healthLabel}>ACTIVIDAD FÍSICA</Text>
              <Text style={styles.healthValue}>{nivelActividad.charAt(0).toUpperCase() + nivelActividad.slice(1)}</Text>
            </View>
          </View>

          {condiciones.length > 0 && (
            <View style={styles.healthRow}>
              <View style={styles.healthIcon}>
                <Text style={styles.healthEmoji}>🏥</Text>
              </View>
              <View style={styles.healthContent}>
                <Text style={styles.healthLabel}>CONDICIÓN MÉDICA</Text>
                <Text style={styles.healthValue}>{condiciones.map((c: any) => c.nombre).join(', ')}</Text>
              </View>
            </View>
          )}

          <View style={styles.healthRow}>
            <View style={styles.healthIcon}>
              <Text style={styles.healthEmoji}>⚠️</Text>
            </View>
            <View style={styles.healthContent}>
              <Text style={styles.healthLabel}>ALERGIAS</Text>
              <Text style={styles.healthValue}>{alergias || 'Ninguna'}</Text>
            </View>
          </View>

          <View style={styles.healthRow}>
            <View style={styles.healthIcon}>
              <Text style={styles.healthEmoji}>🎯</Text>
            </View>
            <View style={styles.healthContent}>
              <Text style={styles.healthLabel}>OBJETIVO</Text>
              <Text style={styles.healthValue}>{objetivo}</Text>
            </View>
          </View>

          {deportes.length > 0 && (
            <View style={styles.healthRow}>
              <View style={styles.healthIcon}>
                <Text style={styles.healthEmoji}>⚽</Text>
              </View>
              <View style={styles.healthContent}>
                <Text style={styles.healthLabel}>DEPORTES</Text>
                <Text style={styles.healthValue}>{deportes.join(', ')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Alimentos Preferidos */}
        {alimentos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.subsectionTitle}>Alimentos Preferidos</Text>
            
            {Object.entries(FOOD_CATEGORIES).map(([categoryKey, categoryInfo]: any) => {
              const alimentosEnCategoria = alimentos.filter((a: any) => categorizarAlimento(a) === categoryKey);
              if (alimentosEnCategoria.length === 0) return null;
              
              const isExpanded = expandedCategories[categoryKey];
              
              return (
                <View key={categoryKey} style={styles.categoryContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.categoryHeaderButton,
                      isExpanded && styles.categoryHeaderButtonExpanded,
                    ]}
                    onPress={() => toggleCategory(categoryKey)}
                  >
                    <View style={styles.categoryLeftContent}>
                      <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
                      <Text style={styles.categoryTitle}>{categoryInfo.name}</Text>
                    </View>
                    <View style={styles.categoryRightContent}>
                      <View style={styles.categoryCount}>
                        <Text style={styles.categoryCountText}>{alimentosEnCategoria.length}</Text>
                      </View>
                      <MaterialIcons 
                        name={isExpanded ? 'expand-less' : 'expand-more'} 
                        size={24} 
                        color="#7c7268" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.chipContainer}>
                      {alimentosEnCategoria.map((alimento: any, idx: number) => (
                        <View key={idx} style={styles.foodChip}>
                          <Text style={styles.chipText}>{alimento.nombre_alimento || alimento.nombre || '–'}</Text>
                        </View>
                      ))}
                      <Pressable style={[styles.addFoodButton, { backgroundColor: categoryInfo.color }]}>
                        <MaterialIcons name="add" size={24} color="white" />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Alimentos a Evitar */}
        <View style={styles.card}>
          <Text style={styles.subsectionTitle}>Alimentos a Evitar</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthIcon}>
              <Text style={styles.healthEmoji}>🚫</Text>
            </View>
            <View style={styles.healthContent}>
              <Text style={styles.healthLabel}>RESTRICCIÓN</Text>
              <Text style={styles.healthValue}>{restricciones || 'Ninguna'}</Text>
            </View>
          </View>
        </View>

        {/* Métricas Biométricas */}
        <View style={styles.card}>
          <Text style={styles.subsectionTitle}>Métricas Biométricas</Text>

          {/* Altura y Peso - Visión General */}
          <View style={styles.bioHeaderRow}>
            <View style={styles.bioDataCard}>
              <View style={styles.bioIconSmall}>
                <Text style={styles.bioIconText}>📏</Text>
              </View>
              <Text style={styles.bioLabel}>ALTURA</Text>
              <Text style={styles.bioValueLarge}>{altura}m</Text>
            </View>
            <View style={styles.bioDataCard}>
              <View style={styles.bioIconSmall}>
                <Text style={styles.bioIconText}>⚖️</Text>
              </View>
              <Text style={styles.bioLabel}>PESO</Text>
              <Text style={styles.bioValueLarge}>{peso}kg</Text>
            </View>
          </View>

          {/* IMC Gauge */}
          <View style={styles.imcSectionContainer}>
            <View style={styles.imcGaugeWrapper}>
              <IMCGauge height={altura} weight={peso} gender="Male" age={0} />
            </View>
          </View>

          {/* Anillos de Porcentajes */}
          <View style={styles.metricsRingsContainer}>
            <View style={styles.ringCardCircular}>
              <Text style={styles.ringTitle}>Grasa Corporal</Text>
              <PercentageRing 
                percentage={porcentajeGrasa} 
                color="#ef4444"
                label=""
                unit=""
              />
            </View>
            <View style={styles.ringCardCircular}>
              <Text style={styles.ringTitle}>Agua Corporal</Text>
              <PercentageRing 
                percentage={porcentajeAgua} 
                color="#0ea5e9"
                label=""
                unit=""
              />
            </View>
          </View>

          {/* Datos Adicionales con Barras Progresivas */}
          {/* Primera Fila: Masa Muscular (ancho completo) */}
          <View style={styles.muscleCardFull}>
            <View style={styles.muscleCardHeader}>
              <View style={styles.muscleCardHeaderLeft}>
                <View style={styles.muscleCardIconWrapper}>
                  <Text style={styles.muscleCardIcon}>💪</Text>
                </View>
                <View style={styles.muscleCardTitleWrapper}>
                  <Text style={styles.muscleCardTitle}>Masa Muscular</Text>
                  <Text style={styles.muscleCardSubtitle}>Peso de músculos</Text>
                </View>
              </View>
              <View style={styles.muscleCardValueInline}>
                <Text style={styles.muscleCardValue}>{masaMuscular}</Text>
                <Text style={styles.muscleCardUnit}>kg</Text>
              </View>
            </View>

            <View style={styles.muscleCardRangeContainer}>
              <Text style={styles.muscleCardRangeLabel}>Rango</Text>
              <View style={styles.muscleCardRangeValues}>
                <Text style={styles.muscleCardRangeMin}>20kg</Text>
                <View style={styles.muscleCardRangeBar}>
                  {Array.from({ length: 7 }).map((_, index) => {
                    const segmentStart = (index / 7) * 100;
                    const segmentEnd = ((index + 1) / 7) * 100;
                    const isActive = muscleProgress > segmentStart;
                    const activeWidth = Math.min(Math.max((muscleProgress - segmentStart) / (segmentEnd - segmentStart), 0), 1);

                    return (
                      <View key={index} style={styles.muscleCardSegment}>
                        <View
                          style={[
                            styles.muscleCardSegmentFill,
                            {
                              width: isActive ? `${activeWidth * 100}%` : '0%',
                              backgroundColor: muscleStatusColor,
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.muscleCardRangeMax}>50kg</Text>
              </View>
            </View>

            <View style={styles.muscleCardStatus}>
              <Text style={styles.muscleCardStatusLabel}>Estado:</Text>
              <Text style={[styles.muscleCardStatusText, { color: muscleStatusColor }]}>{muscleStatus}</Text>
              <MaterialIcons name="info-outline" size={16} color="#c4b8aa" />
            </View>
          </View>

          {/* Grasa Visceral */}
          <View style={styles.visceralFatCardHorizontal}>
            <View style={styles.visceralFatHeader}>
              <View style={styles.visceralFatHeaderLeft}>
                <View style={styles.visceralFatIconBadge}>
                  <MaterialCommunityIcons name="heart-pulse" size={30} color="#f97316" />
                </View>
                <View style={styles.visceralFatTitleWrap}>
                  <Text style={styles.visceralFatTitle}>Grasa Visceral</Text>
                  <Text style={styles.visceralFatSubtitle}>Grasa alrededor de órganos</Text>
                </View>
              </View>
              <Text style={styles.visceralFatValueLarge}>{grasaVisceral}</Text>
            </View>

            <View style={styles.visceralFatRangeContainer}>
              <Text style={styles.visceralFatRangeLabel}>Rango</Text>
              <View style={styles.visceralFatScaleRow}>
                <Text style={styles.visceralFatScaleMin}>1</Text>
                <View style={styles.visceralFatScaleTrack}>
                  {Array.from({ length: 10 }).map((_, index) => {
                    const segmentValue = index + 1;
                    const segmentColor =
                      segmentValue <= 5 ? '#34c759' : segmentValue <= 8 ? '#fbbf24' : '#ef4444';

                    return (
                      <View key={index} style={[styles.visceralFatScaleSegment, { backgroundColor: segmentColor }]} />
                    );
                  })}
                  <View style={[styles.visceralFatMarker, { left: `${Math.min(Math.max(visceralFatProgress - 2, 0), 96)}%` }]} />
                </View>
                <Text style={styles.visceralFatScaleMax}>{visceralFatMax}</Text>
              </View>
            </View>

            <View style={styles.visceralFatFooter}>
              <Text style={styles.visceralFatFooterLabel}>Estado:</Text>
              <Text style={[styles.visceralFatFooterValue, { color: visceralFatStatusColor }]}>{visceralFatStatus}</Text>
              <MaterialIcons name="info-outline" size={16} color="#c4b8aa" />
            </View>
          </View>

          {/* Masa Ósea */}
          <View style={styles.boneMassCardHorizontal}>
            <View style={styles.boneMassHeader}>
              <View style={styles.boneMassHeaderLeft}>
                <View style={styles.boneMassIconBadge}>
                  <MaterialCommunityIcons name="bone" size={32} color="#7c5a36" />
                </View>
                <View style={styles.boneMassTitleWrap}>
                  <Text style={styles.boneMassTitle}>Masa Ósea</Text>
                  <Text style={styles.boneMassSubtitle}>Densidad y soporte óseo</Text>
                </View>
              </View>
              <View style={styles.boneMassValueInline}>
                <Text style={styles.boneMassValue}>{masaOsea.toFixed(1)}</Text>
                <Text style={styles.boneMassUnit}>kg</Text>
              </View>
            </View>

            <View style={styles.boneMassRangeContainer}>
              <Text style={styles.boneMassRangeLabel}>Rango</Text>
              <View style={styles.boneMassScaleArea}>
                <View style={styles.boneMassScaleTrack}>
                  <View style={styles.boneMassScaleSectionLight} />
                  <View style={styles.boneMassScaleSectionMid} />
                  <View style={styles.boneMassScaleSectionStrong} />
                  <View
                    style={[
                      styles.boneMassMarker,
                      { left: boneMassMarkerLeft, borderTopColor: boneMassStatusColor },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.boneMassScaleLabels}>
                <Text style={styles.boneMassScaleText}>Frágil</Text>
                <Text style={styles.boneMassScaleText}>Promedio</Text>
                <Text style={[styles.boneMassScaleText, { color: boneMassStatusColor }]}>{boneMassStatus === 'Huesos fuertes' ? 'Fuerte' : boneMassStatus}</Text>
              </View>
            </View>

            <View style={styles.boneMassFooter}>
              <Text style={styles.boneMassFooterLabel}>Estado:</Text>
              <Text style={[styles.boneMassFooterValue, { color: boneMassStatusColor }]}>{boneMassStatus}</Text>
              <MaterialIcons name="info-outline" size={16} color="#c4b8aa" />
            </View>
          </View>

          {/* Metabolismo Basal */}
          <View style={styles.metabolismCard}>
            <View style={styles.metabolismHeaderLeft}>
              <View style={styles.metabolismIconBadge}>
                <Text style={styles.metabolismEmoji}>🔥</Text>
              </View>
              <View style={styles.metabolismTextWrap}>
                <Text style={styles.metabolismLabel}>Metabolismo Basal</Text>
                <Text style={styles.metabolismDesc}>Calorías en reposo</Text>
              </View>
            </View>
            <View style={styles.metabolismValueWrap}>
              <Text style={styles.metabolismValue}>{metabolismoBasal}</Text>
              <Text style={styles.metabolismUnit}>kcal</Text>
            </View>
          </View>

          {/* Nota sobre actualización */}
          <View style={styles.bioNotice}>
            <MaterialIcons name="info" size={18} color="#0ea5e9" />
            <Text style={styles.bioNoticeText}>
              Estos datos son actualizados por tu nutricionista durante la consulta
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  
  pageHeader: { marginBottom: 26, marginTop: 10 },
  pageHeaderLabel: { fontSize: 30, fontWeight: '900', color: '#0f2742', letterSpacing: -0.7 },
  pageHeaderSubtitle: { fontSize: 15, color: '#8f8376', marginTop: 4, fontWeight: '500' },
  
  section: { marginBottom: 28 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e7d9c8', padding: 16, marginBottom: 20, shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 3 },
  subsectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f2742', marginBottom: 14, letterSpacing: -0.25 },
  
  // Health Info
  healthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 16, paddingHorizontal: 14, backgroundColor: '#f7f3ee', borderRadius: 14, borderWidth: 1, borderColor: '#f1ebe3' },
  healthIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#f3eee8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  healthEmoji: { fontSize: 22 },
  healthContent: { flex: 1 },
  healthLabel: { fontSize: 11, color: '#b2aaa1', fontWeight: '800', marginBottom: 4, letterSpacing: 0.7, textTransform: 'uppercase' },
  healthValue: { fontSize: 15, color: '#0f2742', fontWeight: '800' },
  
  // Food Categories
  categoryContainer: { marginBottom: 12, borderRadius: 16, backgroundColor: '#fbf8f4', overflow: 'hidden', borderWidth: 1, borderColor: '#eee4d8' },
  categoryHeaderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 14, backgroundColor: '#f7f3ee', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  categoryHeaderButtonExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  categoryLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryEmoji: { fontSize: 20, marginRight: 12 },
  categoryTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  categoryRightContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryCount: { minWidth: 26, alignItems: 'center' },
  categoryCountText: { color: '#8e857b', fontSize: 15, fontWeight: '800' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 8, backgroundColor: '#fbf8f4', borderTopWidth: 1, borderTopColor: '#f0e7dc' },
  foodChip: { backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#eadfce' },
  chipText: { fontSize: 12, color: '#6d6258', fontWeight: '600' },
  addFoodButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  // Bio Data
  bioHeaderRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  bioDataCard: { flex: 1, backgroundColor: '#ffffff', paddingVertical: 20, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e7d9c8', alignItems: 'center', shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  bioIconSmall: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f7f3ee', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bioIconText: { fontSize: 18 },
  bioLabel: { fontSize: 11, color: '#b2aaa1', fontWeight: '800', marginBottom: 6, letterSpacing: 0.7, textTransform: 'uppercase' },
  bioValueLarge: { fontSize: 20, fontWeight: '900', color: '#0f2742' },
  
  // IMC Section
  imcSectionContainer: { marginBottom: 24 },
  imcGaugeWrapper: { alignItems: 'center' },
  
  // Rings Container
  metricsRingsContainer: { flexDirection: 'row', gap: 16, marginBottom: 24, backgroundColor: '#f7f3ee', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e7d9c8', shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  ringCardCircular: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f3ee', paddingVertical: 24, paddingHorizontal: 14, borderRadius: 14, borderWidth: 0 },
  ringSvgWrapper: { marginBottom: 12 },
  ringTitle: { fontSize: 14, fontWeight: '800', color: '#5f564d', marginBottom: 16, textAlign: 'center', letterSpacing: -0.2 },
  ringLabelCircular: { height: 0, opacity: 0 },
  ringUnitCircular: { height: 0, opacity: 0 },
  
  // Bio Metrics Grid
  bioMetricsGridRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  bioMetricProgressCard: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e6dfd3', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  bioMetricProgressCardFull: { width: '100%', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e6dfd3', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, marginBottom: 20 },
  bioMetricProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bioMetricLabelWrapper: { flex: 1, marginRight: 10 },
  bioMetricProgressLabel: { fontSize: 12, color: '#7c7268', fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
  bioMetricProgressDesc: { fontSize: 11, color: '#a8a29e', fontWeight: '500' },
  bioMetricProgressValue: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  progressBarContainer: { height: 8, backgroundColor: '#d9d0c7', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', borderRadius: 4 },
  bioMetricProgressSubtext: { fontSize: 11, color: '#10b981', fontWeight: '700', letterSpacing: 0.3 },
  
  // Muscle Card Styles
  muscleCardFull: { width: '100%', backgroundColor: '#f7f3ee', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e7d9c8', shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 3, marginBottom: 16 },
  muscleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: 'space-between' },
  muscleCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  muscleCardIconWrapper: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#f7f3ee', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  muscleCardIcon: { fontSize: 32 },
  muscleCardTitleWrapper: { flex: 1, marginHorizontal: 2 },
  muscleCardTitle: { fontSize: 15, fontWeight: '800', color: '#0f2742', marginBottom: 2 },
  muscleCardSubtitle: { fontSize: 12, color: '#a79f96', fontWeight: '500' },
  muscleCardValueInline: { flexDirection: 'row', alignItems: 'flex-end', minWidth: 92, justifyContent: 'flex-end' },
  muscleCardValue: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: '#0f2742' },
  muscleCardUnit: { fontSize: 16, fontWeight: '700', color: '#7f7368', marginLeft: 4, marginBottom: 4 },
  muscleCardRangeContainer: { marginBottom: 14 },
  muscleCardRangeLabel: { fontSize: 11, color: '#b2aaa1', fontWeight: '800', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  muscleCardRangeValues: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muscleCardRangeBar: { flex: 1, flexDirection: 'row', gap: 4, height: 12 },
  muscleCardSegment: { flex: 1, backgroundColor: '#d9d0c7', borderRadius: 999, overflow: 'hidden' },
  muscleCardSegmentFill: { height: '100%', borderRadius: 999 },
  muscleCardRangeMin: { fontSize: 12, color: '#7f7368', fontWeight: '700', minWidth: 32, textAlign: 'center' },
  muscleCardRangeMax: { fontSize: 12, color: '#7f7368', fontWeight: '700', minWidth: 32, textAlign: 'center' },
  muscleCardStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muscleCardStatusLabel: { fontSize: 15, fontWeight: '700', color: '#7f7368' },
  muscleCardStatusText: { fontSize: 15, color: '#10b981', fontWeight: '800' },
  
  // Metabolism Card
  metabolismCard: { backgroundColor: '#f7f3ee', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e7d9c8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 3 },
  metabolismHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  metabolismIconBadge: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff2ea', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  metabolismEmoji: { fontSize: 28 },
  metabolismTextWrap: { flex: 1 },
  metabolismLabel: { fontSize: 15, fontWeight: '800', color: '#0f2742', marginBottom: 1 },
  metabolismDesc: { fontSize: 12, color: '#a79f96', fontWeight: '500' },
  metabolismValueWrap: { flexDirection: 'row', alignItems: 'flex-end', minWidth: 92, justifyContent: 'flex-end', flexShrink: 1 },
  metabolismValue: { fontSize: 26, lineHeight: 28, fontWeight: '900', color: '#ef4444' },
  metabolismUnit: { fontSize: 13, fontWeight: '700', color: '#ef4444', marginLeft: 2, marginBottom: 2 },
  
  // Bio Notice
  bioNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#eef7ff', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#cfe3fb' },
  bioNoticeText: { fontSize: 12, color: '#4b84b8', fontWeight: '600', flex: 1, lineHeight: 18 },
  
  // Loading & Error
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorIcon: { marginBottom: 16 },
  errorText: { fontSize: 16, color: '#1f2937', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  retryButton: { backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  // Visceral Fat Card Styles
  visceralFatCardHorizontal: { width: '100%', backgroundColor: '#f7f3ee', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e7d9c8', shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 3, marginBottom: 16 },
  visceralFatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  visceralFatHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  visceralFatTitleWrap: { flex: 1, marginLeft: 2 },
  visceralFatTitle: { fontSize: 15, fontWeight: '800', color: '#0f2742', marginBottom: 2 },
  visceralFatSubtitle: { fontSize: 12, color: '#a79f96', fontWeight: '500', marginTop: 3 },
  visceralFatIconBadge: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff2ea', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  visceralFatValueLarge: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: '#0f2742', minWidth: 58, textAlign: 'right' },
  visceralFatRangeContainer: { marginBottom: 14 },
  visceralFatRangeLabel: { fontSize: 11, color: '#b2aaa1', fontWeight: '800', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  visceralFatScaleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visceralFatScaleMin: { fontSize: 12, fontWeight: '700', color: '#7f7368', minWidth: 20, textAlign: 'center' },
  visceralFatScaleTrack: { flex: 1, height: 14, borderRadius: 999, overflow: 'visible', flexDirection: 'row', gap: 3, position: 'relative' },
  visceralFatScaleSegment: { flex: 1, borderRadius: 4, height: '100%' },
  visceralFatMarker: { position: 'absolute', top: -3, width: 4, height: 20, borderRadius: 999, backgroundColor: '#111827' },
  visceralFatScaleMax: { fontSize: 12, fontWeight: '700', color: '#7f7368', minWidth: 32, textAlign: 'center' },
  visceralFatFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 },
  visceralFatFooterLabel: { fontSize: 15, fontWeight: '700', color: '#7f7368' },
  visceralFatFooterValue: { fontSize: 15, fontWeight: '800' },
  
  // Bone Mass Card Styles
  boneMassCardHorizontal: { width: '100%', backgroundColor: '#f7f3ee', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e7d9c8', shadowColor: '#b9a48a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 3, marginBottom: 16 },
  boneMassHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  boneMassHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  boneMassTitleWrap: { flex: 1, marginLeft: 2 },
  boneMassTitle: { fontSize: 15, fontWeight: '800', color: '#0f2742', marginBottom: 2 },
  boneMassSubtitle: { fontSize: 12, color: '#a79f96', fontWeight: '500', marginTop: 3 },
  boneMassIconBadge: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#f3eee8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  boneMassValueInline: { flexDirection: 'row', alignItems: 'flex-end', minWidth: 92, justifyContent: 'flex-end' },
  boneMassValue: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: '#0f2742' },
  boneMassUnit: { fontSize: 16, fontWeight: '700', color: '#7f7368', marginLeft: 4, marginBottom: 4 },
  boneMassRangeContainer: { marginBottom: 14 },
  boneMassRangeLabel: { fontSize: 11, color: '#b2aaa1', fontWeight: '800', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  boneMassScaleArea: { marginTop: 0 },
  boneMassScaleTrack: { height: 14, borderRadius: 999, overflow: 'hidden', position: 'relative', flexDirection: 'row', backgroundColor: '#e9e4dc' },
  boneMassScaleSectionLight: { flex: 1, backgroundColor: '#ebe5da', borderRightWidth: 2, borderRightColor: '#ffffff' },
  boneMassScaleSectionMid: { flex: 1, backgroundColor: '#ded2bf', borderRightWidth: 2, borderRightColor: '#ffffff' },
  boneMassScaleSectionStrong: { flex: 1, backgroundColor: '#b99767' },
  boneMassMarker: { position: 'absolute', top: -8, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#111827' },
  boneMassScaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  boneMassScaleText: { fontSize: 12, fontWeight: '700', color: '#6b5d4b' },
  boneMassFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 },
  boneMassFooterLabel: { fontSize: 15, fontWeight: '700', color: '#7f7368' },
  boneMassFooterValue: { fontSize: 15, fontWeight: '800' },
});
