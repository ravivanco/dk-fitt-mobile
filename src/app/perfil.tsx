import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Circle, Path, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { IMCGauge } from '@/components/metrics/IMC';
import { useAuth } from '@/hooks/use-auth';
import { authStore } from '@/store/auth.store';

const formatearFecha = (fechaString: string): string => {
  try {
    let dateStr = fechaString;
    if (fechaString.includes('T')) {
      dateStr = fechaString.split('T')[0];
    }
    const [year, month, day] = dateStr.split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '–';
  }
};

const calcularEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const [year, month, day] = fechaNacimiento.split('-');
  const nacimiento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  
  if (mesActual < mesNacimiento || 
      (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};

const calcularIMC = (peso: number, altura: number): string => {
  if (!peso || !altura || altura <= 0) return '–';
  const imc = peso / (altura * altura);
  return imc.toFixed(1);
};

// Componente Anillo Circular para Porcentajes
const PercentageRing = ({ percentage, color, label, unit }: { percentage: number; color: string; label: string; unit: string }) => {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.ringCardCircular}>
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
    </View>
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

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: any }) => (
  <View style={styles.infoRowContainer}>
    <View style={styles.infoRowLeft}>
      {icon && <MaterialCommunityIcons name={icon as any} size={18} color="#0ea5e9" style={styles.infoIcon} />}
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <Text style={styles.infoRowValue}>{value}</Text>
  </View>
);

export default function PerfilScreen() {
  const { logout, isLoading } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [edad, setEdad] = useState(0);
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
        
        if (userData?.edad) {
          setEdad(userData.edad);
        } else if (userData?.fecha_nacimiento) {
          const fechaStr = userData.fecha_nacimiento.split('T')[0];
          const edadCalculada = calcularEdad(fechaStr);
          setEdad(edadCalculada);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setErrorMessage('Los datos guardados están corruptos. Sesión reiniciada.');
        // Si hay error al cargar datos corruptos, limpiar AsyncStorage
        try {
          await authStore.clearSession();
          console.log('Sesión limpiada. Por favor, inicia sesión nuevamente.');
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

  const nombres = user?.nombres || 'Usuario';
  const apellidos = user?.apellidos || '';
  const nombreCompleto = `${nombres} ${apellidos}`.trim();
  const correo = user?.correo_institucional || '';
  const fechaNacimiento = user?.fecha_nacimiento ? formatearFecha(user.fecha_nacimiento.split('T')[0]) : '–';
  const formularioCompletado = user?.formulario_completado ?? false;

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageHeaderLabel}>Mi Perfil</Text>
              <Text style={styles.pageHeaderSubtitle}>Tu información personal</Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient 
                colors={['#0ea5e9', '#06b6d4']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {nombres.charAt(0).toUpperCase()}{apellidos.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={styles.verifyBadge}>
                <MaterialCommunityIcons name="check" size={20} color="white" />
              </View>
            </View>

            <Text style={styles.userName}>{nombreCompleto}</Text>
            <Text style={styles.userEmail}>{correo}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <View style={styles.infoBoxIcon}>
                  <MaterialIcons name="cake" size={24} color="#f5a623" />
                </View>
                <Text style={styles.infoLabel}>EDAD</Text>
                <Text style={styles.infoValue}>{edad} años</Text>
              </View>
              <View style={styles.infoBox}>
                <View style={styles.infoBoxIcon}>
                  <MaterialIcons name="calendar-today" size={24} color="#0ea5e9" />
                </View>
                <Text style={styles.infoLabel}>NACIMIENTO</Text>
                <Text style={styles.infoValue}>{fechaNacimiento}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusLeftContent}>
                <MaterialIcons name="description" size={20} color="#0f172a" />
                <Text style={styles.statusLabel}>Formulario</Text>
              </View>
              <View style={[styles.statusBadge, formularioCompletado ? styles.statusBadgeSuccess : styles.statusBadgePending]}>
                <MaterialIcons 
                  name={formularioCompletado ? 'check-circle' : 'cancel'} 
                  size={16} 
                  color={formularioCompletado ? '#10b981' : '#ef4444'} 
                />
                <Text style={[styles.statusText, formularioCompletado ? styles.statusTextSuccess : styles.statusTextPending]}>
                  {formularioCompletado ? 'Completado' : 'Pendiente'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusLeftContent}>
                <MaterialIcons name="fitness-center" size={20} color="#0f172a" />
                <Text style={styles.statusLabel}>Plan</Text>
              </View>
              <View style={[styles.statusBadge, styles.statusBadgePending]}>
                <MaterialIcons name="cancel" size={16} color="#ef4444" />
                <Text style={styles.statusTextPending}>Desactivado</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' }}>
              <TouchableOpacity style={[styles.editButton, { flex: 1 }]} onPress={() => router.push('/perfil-editar')}>
                <LinearGradient
                  colors={["#ecb607", "#f6c510"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.editButtonGradient}
                >
                  <MaterialIcons name="edit" size={18} color="white" />
                  <Text style={styles.editButtonText}>Editar Perfil</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logoutButtonRed, isLoading && styles.logoutButtonDisabled]} activeOpacity={0.85} onPress={() => void logout()} disabled={isLoading}>
                <LinearGradient
                  colors={["#ef4444", "#dc2626"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoutButtonGradientRed}
                >
                  <MaterialCommunityIcons name="logout" size={18} color="white" />
                  <Text style={styles.logoutButtonText}>{isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdfcf9' },
  wrapper: { flex: 1, position: 'relative' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  contentContainer: { paddingBottom: 120, paddingHorizontal: 0 },
  
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 24 },
  pageHeaderLabel: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  pageHeaderSubtitle: { fontSize: 15, color: '#7c7268', marginTop: 4, fontWeight: '500' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorIcon: { marginBottom: 16 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#11141b', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#5eb3c4', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  
  profileCard: { 
    backgroundColor: 'white', 
    borderRadius: 28, 
    padding: 28, 
    alignItems: 'center', 
    marginBottom: 28, 
    shadowColor: '#1a1a1a', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 16, 
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarText: { color: 'white', fontSize: 42, fontWeight: '700' },
  verifyBadge: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#10b981', borderRadius: 24, padding: 2, borderWidth: 3, borderColor: 'white' },
  
  userName: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 },
  userEmail: { fontSize: 13, color: '#64748b', marginBottom: 24, fontWeight: '500' },
  
  infoRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  infoBox: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, backgroundColor: '#f8f6f1', borderRadius: 14 },
  infoBoxIcon: { marginBottom: 10 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#7c7268', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 18, fontWeight: '800', color: '#5f564d' },
  
  statusRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginBottom: 12, paddingHorizontal: 12, backgroundColor: '#fafaf8', borderRadius: 12 },
  statusLeftContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  statusBadgeSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5' },
  statusBadgePending: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTextSuccess: { color: '#10b981' },
  statusTextPending: { color: '#ef4444' },
  

  editButton: {
    width: '100%',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 40,
  },
  editButtonGradient: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#ecb607',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  logoutButtonRed: {
    flex: 1,
    borderRadius: 12,
    height: 40,
    overflow: 'hidden',
  },
  logoutButtonGradientRed: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: 8,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  
  section: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 22, 
    marginBottom: 20, 
    shadowColor: '#1a1a1a', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', flex: 1, letterSpacing: -0.3 },
  subsectionContainer: { marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e8e4df' },
  subsectionTitle: { fontSize: 16, fontWeight: '700', color: '#5f564d', marginBottom: 12, letterSpacing: -0.2 },
  
  healthRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#f8f6f1', borderRadius: 14, marginBottom: 12, gap: 14 },
  healthIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.6)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  healthEmoji: { fontSize: 28 },
  healthContent: { flex: 1, justifyContent: 'center' },
  healthLabel: { fontSize: 13, fontWeight: '700', color: '#7c7268', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  healthValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  sportsChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  sportChip: { backgroundColor: '#f0ede7', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e8e1d8' },
  sportChipText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  
  dataCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f6f1', borderRadius: 16, padding: 18, marginVertical: 10, justifyContent: 'space-between' },
  dataLeft: { flex: 1 },
  dataLabel: { fontSize: 12, fontWeight: '700', color: '#7c7268', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  dataValue: { fontSize: 20, fontWeight: '800', color: '#5f564d' },
  dataRight: { flexDirection: 'row', gap: 16, justifyContent: 'flex-end' },
  dataDivider: { width: 1.5, height: 50, backgroundColor: '#e8e1d8', marginHorizontal: 16 },
  metricSmall: { alignItems: 'flex-end' },
  metricSmallLabel: { fontSize: 16, fontWeight: '800', color: '#ecb607' },
  metricSmallText: { fontSize: 11, fontWeight: '600', color: '#7c7268', marginTop: 2 },
  trendIcon: { marginLeft: 16, padding: 12, backgroundColor: 'rgba(236, 182, 7, 0.1)', borderRadius: 12 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  metricCard: { width: '31%', backgroundColor: 'linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%)', borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d1fae5' },
  metricLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#10b981', marginBottom: 2 },
  metricUnit: { fontSize: 10, fontWeight: '600', color: '#0ea5e9' },
  
  updateBioButton: { width: '100%', backgroundColor: '#0ea5e9', borderRadius: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  updateBioButtonText: { color: 'white', fontSize: 14, fontWeight: '800' },
  
  infoRowContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 0, gap: 8, backgroundColor: '#f8f6f1', borderRadius: 14, marginVertical: 8 },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  infoIcon: { marginRight: 4, color: '#ecb607' },
  infoRowLabel: { fontSize: 13, fontWeight: '700', color: '#7c7268', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRowValue: { fontSize: 17, fontWeight: '800', color: '#5f564d', flex: 0, textAlign: 'right' },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8, paddingHorizontal: 2 },
  chip: { backgroundColor: '#f8f6f1', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#ecb607' },
  foodChip: { backgroundColor: '#f8f6f1', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#ede9e1', flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipText: { fontSize: 14, fontWeight: '700', color: '#5f564d' },
  chipClose: { marginLeft: 4, padding: 2 },
  addFoodButton: { borderRadius: 50, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginTop: 0 },
  
  categoryContainer: { marginBottom: 8, paddingBottom: 0 },
  categoryHeaderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#f8f6f1', borderRadius: 14, marginBottom: 8 },
  categoryLeftContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  categoryRightContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryEmoji: { fontSize: 20 },
  categoryTitle: { fontSize: 16, fontWeight: '800', color: '#ecb607', flex: 1 },
  categoryCount: { fontSize: 12, fontWeight: '700', color: '#7c7268', backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12, backgroundColor: '#f8f6f1', borderRadius: 14, marginVertical: 8 },
  listItemText: { fontSize: 17, fontWeight: '700', color: '#5f564d' },
  
  // Métricas Biométricas
  bioHeaderRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  bioDataCard: { flex: 1, backgroundColor: '#f5f3f0', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e8e4df' },
  bioIconSmall: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  bioIconText: { fontSize: 24 },
  bioLabel: { fontSize: 12, fontWeight: '700', color: '#7c7268', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  bioValueLarge: { fontSize: 24, fontWeight: '900', color: '#5f564d', letterSpacing: -0.5 },
  ringTitle: { fontSize: 14, fontWeight: '800', color: '#5f564d', marginBottom: 12, textAlign: 'center', letterSpacing: 0.3 },

  imcSectionContainer: { marginBottom: 20, alignItems: 'center', width: '100%', minHeight: 380 },
  imcGaugeWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 380 },

  metricsRingsContainer: { flexDirection: 'row', gap: 16, marginBottom: 12, justifyContent: 'center' },
  ringCardCircular: { alignItems: 'center', flex: 1, maxWidth: '45%' },
  ringSvgWrapper: { marginBottom: 0 },
  ringLabelCircular: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 0, textAlign: 'center', height: 0, opacity: 0 },
  ringUnitCircular: { fontSize: 11, fontWeight: '600', color: '#8e8579', textAlign: 'center' },

  bioMetricsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  bioMetricProgressCard: { flex: 1, backgroundColor: '#f8f6f1', borderRadius: 14, padding: 14, minWidth: '31%', borderWidth: 1, borderColor: '#e8e4df' },
  bioMetricProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bioMetricProgressLabel: { fontSize: 11, fontWeight: '700', color: '#5f564d', textTransform: 'uppercase', letterSpacing: 0.3 },
  bioMetricProgressValue: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  progressBarContainer: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 3 },
  bioMetricProgressSubtext: { fontSize: 9, fontWeight: '600', color: '#8e8579', textAlign: 'center' },

  metabolismCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'linear-gradient(135deg, #fef3c7 0%, #fef08a 100%)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#fde047', justifyContent: 'space-between' },
  metabolismLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  metabolismEmoji: { fontSize: 32 },
  metabolismLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  metabolismDesc: { fontSize: 11, fontWeight: '600', color: '#7c7268', marginTop: 2 },
  metabolismValue: { fontSize: 22, fontWeight: '900', color: '#b8860b', letterSpacing: -0.5 },

  bioNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  bioNoticeText: { fontSize: 12, fontWeight: '600', color: '#0c4a6e', flex: 1, lineHeight: 18 },
});
