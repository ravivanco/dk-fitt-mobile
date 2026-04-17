import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
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

// Categorías de alimentos (5 grupos)
const FOOD_CATEGORIES = {
  proteinas: { name: 'Proteínas', icon: 'egg' },
  carbohidratos: { name: 'Carbohidratos', icon: 'baguette' },
  lacteos: { name: 'Lácteos', icon: 'glass-mug' },
  vegetales: { name: 'Vegetales', icon: 'carrot' },
  frutas: { name: 'Frutas', icon: 'banana' },
};

// Mapeo de alimentos a categorías por ID o nombre
const categorizarAlimento = (alimento: any): string => {
  const nombre = (alimento.nombre_alimento || alimento.nombre || '').toLowerCase();
  const id = (alimento.id_alimento || '').toString().toLowerCase();

  // Por ID
  const idsProtein = [1, 2, 3, 4, 5, 6, 7]; // pollo, res, pescado, huevos, legumbres, atun, pavo
  const idsCarbs = [8, 9, 10, 11, 12, 13, 14]; // arroz, pan, pasta, papas, avena, quinoa, batata
  const idsLacteos = [15, 16, 17, 18, 19, 20, 21]; // leche, yogur, queso, etc
  const idsVegetales = [22, 23, 24, 25, 26, 27]; // brocoli, zanahoria, espinaca, etc
  const idsFrutas = [28, 29, 30, 31, 32, 33, 34]; // manzana, banana, naranja, etc

  if (idsProtein.includes(parseInt(id))) return 'proteinas';
  if (idsCarbs.includes(parseInt(id))) return 'carbohidratos';
  if (idsLacteos.includes(parseInt(id))) return 'lacteos';
  if (idsVegetales.includes(parseInt(id))) return 'vegetales';
  if (idsFrutas.includes(parseInt(id))) return 'frutas';

  // Por nombre (fallback)
  const keywordsByCategory = {
    proteinas: ['pollo', 'res', 'carne', 'pescado', 'huevo', 'legumbre', 'atun', 'pavo', 'carne molida'],
    carbohidratos: ['arroz', 'pan', 'pasta', 'papa', 'avena', 'quinoa', 'batata', 'maiz'],
    lacteos: ['leche', 'yogur', 'queso', 'mantequilla', 'crema', 'requeson'],
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

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
  <View style={styles.infoRowContainer}>
    <View style={styles.infoRowLeft}>
      {icon && <MaterialCommunityIcons name={icon} size={18} color="#0ea5e9" style={styles.infoIcon} />}
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
                <Text style={styles.infoLabel}>EDAD</Text>
                <Text style={styles.infoValue}>{edad} años</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>NACIMIENTO</Text>
                <Text style={styles.infoValue}>{fechaNacimiento}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Formulario</Text>
              <View style={[styles.statusBadge, formularioCompletado ? styles.statusBadgeSuccess : styles.statusBadgePending]}>
                <MaterialCommunityIcons 
                  name={formularioCompletado ? 'check-circle' : 'close-circle'} 
                  size={16} 
                  color={formularioCompletado ? '#10b981' : '#ef4444'} 
                />
                <Text style={[styles.statusText, formularioCompletado ? styles.statusTextSuccess : styles.statusTextPending]}>
                  {formularioCompletado ? 'Completado' : 'Pendiente'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Plan</Text>
              <View style={[styles.statusBadge, styles.statusBadgePending]}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#ef4444" />
                <Text style={styles.statusTextPending}>Desactivado</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="white" />
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="run" size={28} color="#ecb607" />
              <Text style={styles.sectionTitle}>Actividad Física</Text>
            </View>
            <InfoRow label="Nivel" value={nivelActividad.charAt(0).toUpperCase() + nivelActividad.slice(1)} icon="run" />
          </View>

          {condiciones.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="hospital-box" size={28} color="#ecb607" />
                <Text style={styles.sectionTitle}>Condición Médica</Text>
              </View>
              {condiciones.map((cond: any, idx: number) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.listItemText}>{cond.nombre || '–'}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-circle" size={28} color="#ef4444" />
              <Text style={styles.sectionTitle}>Alergias e Intolerancias</Text>
            </View>
            <InfoRow label="Restricción" value={alergias || 'Ninguna'} icon="alert-circle" />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="target" size={28} color="#10b981" />
              <Text style={styles.sectionTitle}>Objetivo</Text>
            </View>
            <InfoRow label="Meta" value={objetivo} icon="target-variant" />
          </View>

          {deportes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="soccer" size={28} color="#ec4899" />
                <Text style={styles.sectionTitle}>Deportes Favoritos</Text>
              </View>
              <View style={styles.chipContainer}>
                {deportes.map((deporte: string, idx: number) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{deporte.charAt(0).toUpperCase() + deporte.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {alimentos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="leaf" size={28} color="#0ea5e9" />
                <Text style={styles.sectionTitle}>Alimentos Preferidos</Text>
              </View>
              
              {Object.entries(FOOD_CATEGORIES).map(([categoryKey, categoryInfo]: any) => {
                const alimentosEnCategoria = alimentos.filter((a: any) => categorizarAlimento(a) === categoryKey);
                if (alimentosEnCategoria.length === 0) return null;
                
                return (
                  <View key={categoryKey} style={styles.categoryContainer}>
                    <View style={styles.categoryHeader}>
                      <MaterialCommunityIcons name={categoryInfo.icon} size={20} color="#0ea5e9" />
                      <Text style={styles.categoryTitle}>{categoryInfo.name}</Text>
                      <View style={styles.categoryCount}>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>{alimentosEnCategoria.length}</Text>
                      </View>
                    </View>
                    <View style={styles.chipContainer}>
                      {alimentosEnCategoria.map((alimento: any, idx: number) => (
                        <View key={idx} style={styles.foodChip}>
                          <Text style={styles.chipText}>{alimento.nombre_alimento || alimento.nombre || '–'}</Text>
                        </View>
                      ))}
                      <Pressable style={styles.addFoodButton}>
                        <MaterialCommunityIcons name="plus" size={24} color="white" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lock" size={28} color="#ef4444" />
              <Text style={styles.sectionTitle}>Alimentos a Evitar</Text>
            </View>
            <InfoRow label="Restricción" value={restricciones || 'Ninguna'} icon="lock" />
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
            activeOpacity={0.85}
            onPress={() => void logout()}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="logout" size={20} color="white" />
            <Text style={styles.logoutButtonText}>
              {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>

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
  
  userName: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 },
  userEmail: { fontSize: 13, color: '#64748b', marginBottom: 24, fontWeight: '500' },
  
  infoRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  infoBox: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, backgroundColor: '#f8f6f1', borderRadius: 14 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#7c7268', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#5f564d' },
  
  statusRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginBottom: 12 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  statusBadgeSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5' },
  statusBadgePending: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTextSuccess: { color: '#10b981' },
  statusTextPending: { color: '#ef4444' },
  
  editButton: { width: '100%', backgroundColor: '#ecb607', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 10, shadowColor: '#ecb607', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  editButtonText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  
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
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1, letterSpacing: -0.3 },
  
  dataCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f6f1', borderRadius: 16, padding: 18, marginVertical: 10, justifyContent: 'space-between' },
  dataLeft: { flex: 1 },
  dataLabel: { fontSize: 11, fontWeight: '700', color: '#7c7268', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  dataValue: { fontSize: 18, fontWeight: '800', color: '#5f564d' },
  dataRight: { flexDirection: 'row', gap: 16, justifyContent: 'flex-end' },
  dataDivider: { width: 1.5, height: 50, backgroundColor: '#e8e1d8', marginHorizontal: 16 },
  metricSmall: { alignItems: 'flex-end' },
  metricSmallLabel: { fontSize: 16, fontWeight: '800', color: '#ecb607' },
  metricSmallText: { fontSize: 11, fontWeight: '600', color: '#7c7268', marginTop: 2 },
  trendIcon: { marginLeft: 16, padding: 12, backgroundColor: 'rgba(236, 182, 7, 0.1)', borderRadius: 12 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  metricCard: { width: '31%', backgroundColor: 'linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%)', borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d1fae5' },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  metricValue: { fontSize: 18, fontWeight: '800', color: '#10b981', marginBottom: 2 },
  metricUnit: { fontSize: 10, fontWeight: '600', color: '#0ea5e9' },
  
  updateBioButton: { width: '100%', backgroundColor: '#0ea5e9', borderRadius: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  updateBioButtonText: { color: 'white', fontSize: 14, fontWeight: '800' },
  
  infoRowContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 0, gap: 8, backgroundColor: '#f8f6f1', borderRadius: 14, marginVertical: 8 },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  infoIcon: { marginRight: 4, color: '#ecb607' },
  infoRowLabel: { fontSize: 12, fontWeight: '700', color: '#7c7268', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRowValue: { fontSize: 16, fontWeight: '800', color: '#5f564d', flex: 0, textAlign: 'right' },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip: { backgroundColor: '#f8f6f1', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#ecb607' },
  foodChip: { backgroundColor: '#f8f6f1', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#ede9e1', flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipText: { fontSize: 14, fontWeight: '700', color: '#5f564d' },
  chipClose: { marginLeft: 4, padding: 2 },
  addFoodButton: { backgroundColor: '#ecb607', borderRadius: 26, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  
  categoryContainer: { marginBottom: 18, paddingBottom: 14 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  categoryTitle: { fontSize: 15, fontWeight: '800', color: '#ecb607', flex: 1 },
  categoryCount: { fontSize: 12, fontWeight: '700', color: '#7c7268', backgroundColor: '#f8f6f1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12, backgroundColor: '#f8f6f1', borderRadius: 14, marginVertical: 8 },
  listItemText: { fontSize: 16, fontWeight: '700', color: '#5f564d' },
  
  logoutButton: { marginVertical: 24, backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButtonText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
