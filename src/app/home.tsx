import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { apiClient } from '@/services/api.client';
import {
  loadCalorieDashboard
} from '@/services/calorie.service';
import { fetchCalorieControlDashboard, type CalorieControlDashboard } from '@/services/calorie-control.service';
import {
  getCachedCalorieControlDashboard,
  refreshCalorieControlDashboard,
  setCachedCalorieControlDashboard,
  subscribeCalorieControlDashboard,
} from '@/store/calorie-control-dashboard.store';
import { authStore } from '@/store/auth.store';

type MacroRingProps = {
  value: number;
  color: string;
  icon: string;
  label: string;
  status: string;
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function deriveMacroStatus(percent: number) {
  if (percent >= 60) return 'Alto';
  if (percent >= 40) return 'Medio';
  return 'Bajo';
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function MacroRing({ value, color, icon, label, status }: MacroRingProps) {
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

export default function HomeScreen() {
  const [userName, setUserName] = useState('Usuario');
  const [userEval, setUserEval] = useState<any>(null);
  const [dashboard, setDashboard] = useState<CalorieControlDashboard | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        const user = await authStore.getUser();
        if (!mounted) return;
        if (user?.nombres) {
          setUserName(user.nombres);
        }

        try {
          const evalRes = await apiClient.get('/clinical-evaluations/me/history');
          if (mounted && evalRes.data?.data && Array.isArray(evalRes.data.data) && evalRes.data.data.length > 0) {
            setUserEval(evalRes.data.data[0]);
          } else if (user?.evaluacion_clinica) {
            setUserEval(user.evaluacion_clinica);
          }
        } catch (error: any) {
          // 401 = sin sesión activa aún, es esperado si el token no está listo todavía
          const isAuthError =
            error?.status === 401 ||
            (typeof error?.message === 'string' &&
              (error.message.includes('Token') || error.message.includes('acceso') || error.message.includes('Credenciales')));

          if (!isAuthError && __DEV__) {
            console.warn('[home] Clinical eval fetch failed:', error?.message ?? error);
          }

          if (user?.evaluacion_clinica) {
            setUserEval(user.evaluacion_clinica);
          }
        }
      } catch {
        if (mounted) {
          setUserName('Usuario');
        }
      }
    };

    void loadUserData();

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const loadDashboardState = async () => {
        const today = formatLocalIsoDate();

        // ─── LOG 1: ¿Qué fecha se está usando? ───
        console.log('[HOME][1] Fecha enviada al dashboard:', today);

        const cached = getCachedCalorieControlDashboard(today);
        if (cached && active) {
          console.log('[HOME][2] Cache encontrada:', JSON.stringify(cached?.balance));
          setDashboard(cached);
        }
        try {
          const nextDashboard = await refreshCalorieControlDashboard(today);

          // ─── LOG 2: ¿Qué devuelve el endpoint? ───
          console.log('[HOME][3] Dashboard recibido RAW:', JSON.stringify(nextDashboard));
          console.log('[HOME][4] balance object:', JSON.stringify(nextDashboard?.balance));
          console.log('[HOME][5] dailyTarget:', nextDashboard?.balance?.dailyTarget);
          console.log('[HOME][6] consumedCalories:', nextDashboard?.balance?.consumedCalories);
          console.log('[HOME][7] remainingCalories:', nextDashboard?.balance?.remainingCalories);

          if (active) setDashboard(nextDashboard);
        } catch (err) {
          // ─── LOG 3: ¿Está cayendo al fallback? ───
          console.warn('[HOME][8] ERROR — cayó al fallback legacy:', err);
          const legacy = await loadCalorieDashboard();
          console.log('[HOME][9] Legacy dashboard:', JSON.stringify(legacy));
          if (!active) return;
          const fallback = {
            balance: {
              dailyTarget: legacy.dailyTarget,
              consumedCalories: legacy.consumedCalories,
              remainingCalories: legacy.dailyTarget - legacy.consumedCalories,
            },
            meals: [],
            additionalIntakes: [],
          };
          setDashboard(fallback);
          setCachedCalorieControlDashboard(today, fallback);
        }
      };

      void loadDashboardState();

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    const today = formatLocalIsoDate();
    return subscribeCalorieControlDashboard(today, () => {
      setDashboard(getCachedCalorieControlDashboard(today) ?? null);
    });
  }, []);

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(today, index - 3);
        const isToday =
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();

        return {
          key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
          month: MONTHS[date.getMonth()],
          day: date.getDate(),
          weekday: WEEKDAYS[date.getDay()],
          isToday,
        };
      }),
    [today]
  );

  const planActive = userEval !== null;

  // Paciente nuevo sin evaluación clínica → la nutricionista no ha ingresado datos aún
  const hasEval = userEval !== null;

  const dailyTarget = hasEval
    ? (userEval?.calorias_diarias_calculadas ?? dashboard?.balance?.dailyTarget ?? 1771)
    : 0;
  const consumedCalories = hasEval ? (dashboard?.balance?.consumedCalories ?? 0) : 0;
  const consumedAdditionalCalories = hasEval ? (dashboard?.balance?.consumedAdditionalCalories ?? 0) : 0;
  const consumedPlanCalories = hasEval
    ? (dashboard?.balance?.consumedPlanCalories ?? Math.max(0, consumedCalories - consumedAdditionalCalories))
    : 0;
  const totalConsumedCalories = hasEval ? Math.max(0, consumedCalories) : 0;
  const exceededCalories = hasEval ? Math.max(0, totalConsumedCalories - dailyTarget) : 0;
  const excessColor = exceededCalories >= 300 ? '#ef4444' : '#f97316';
  const excessBg = exceededCalories >= 300 ? '#fee2e2' : '#ffedd5';
  const additionalProgress = hasEval
    ? Math.max(0, Math.min(1, consumedAdditionalCalories / (dailyTarget || 1)))
    : 0;
  // El anillo representa kcal restantes: empieza lleno con la meta del paciente y baja al consumir.
  const remainingCaloriesRaw = hasEval
    ? (dashboard?.balance?.remainingCalories ?? dailyTarget - consumedCalories)
    : 0;
  const remainingCalories = Number.isFinite(remainingCaloriesRaw) ? remainingCaloriesRaw : 0;
  const calorieValue = hasEval ? Math.max(0, Math.round(remainingCalories)) : 0;
  const calorieProgress = hasEval ? Math.max(0, Math.min(1, remainingCalories / (dailyTarget || 1))) : 0;
  const calorieRingColor = hasEval ? (remainingCalories < 0 ? '#ef4444' : '#1aa44f') : '#d9d4cc';

  const macroData = [
    {
      key: 'protein',
      label: 'Proteina',
      percent: hasEval ? (userEval?.distribucion_proteinas_pct ?? 35) : 0,
      status: hasEval ? deriveMacroStatus(Number(userEval?.distribucion_proteinas_pct ?? 0)) : '–',
      color: hasEval ? '#34c759' : '#d9d4cc',
      icon: '🥩',
    },
    {
      key: 'carbs',
      label: 'Carbohidratos',
      percent: hasEval ? (userEval?.distribucion_carbohidratos_pct ?? 40) : 0,
      status: hasEval ? deriveMacroStatus(Number(userEval?.distribucion_carbohidratos_pct ?? 0)) : '–',
      color: hasEval ? '#ff3b30' : '#d9d4cc',
      icon: '🍞',
    },
    {
      key: 'fat',
      label: 'Grasas',
      percent: hasEval ? (userEval?.distribucion_grasas_pct ?? 25) : 0,
      status: hasEval ? deriveMacroStatus(Number(userEval?.distribucion_grasas_pct ?? 0)) : '–',
      color: hasEval ? '#eab308' : '#d9d4cc',
      icon: '🥑',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.greeting}>Hola, {userName}</Text>
            <View style={styles.notificationButton}>
              <MaterialCommunityIcons name="bell-outline" size={20} color="#666" />
              <View style={styles.notificationBadge} />
            </View>
          </View>

          <View style={styles.calendarWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarContent}
              style={styles.calendarRow}>
              {weekDays.map((item) => (
                <View key={item.key} style={[styles.dayCard, item.isToday && styles.dayCardActive]}>
                  <Text style={[styles.monthText, item.isToday && styles.monthTextActive]}>{item.month}</Text>
                  <Text style={[styles.dayNumber, item.isToday && styles.dayNumberActive]}>{item.day}</Text>
                  <Text style={[styles.weekdayText, item.isToday && styles.weekdayTextActive]}>{item.weekday}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!hasEval) {
                Alert.alert(
                  'Módulo bloqueado',
                  'Tu nutricionista activará el Control Calórico después de tu primera consulta.',
                  [{ text: 'Entendido' }]
                );
                return;
              }
              router.push('/control-calorico');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.card, !hasEval && styles.cardLocked]}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <View style={styles.flameCircle}>
                    <MaterialCommunityIcons name="fire" size={14} color={hasEval ? '#ff8a3d' : '#c8c3bb'} />
                  </View>
                  <Text style={[styles.cardTitle, !hasEval && { color: '#c8c3bb' }]}>Control Calorico</Text>
                </View>

                <View style={styles.planBadge}>
                  <View
                    style={[
                      styles.planIconCircle,
                      { backgroundColor: hasEval ? (planActive ? '#22a656' : '#e53935') : '#c8c3bb' },
                    ]}>
                    <MaterialCommunityIcons name={hasEval ? 'check' : 'lock'} size={10} color="#ffffff" />
                  </View>
                  <Text numberOfLines={1} style={styles.planText}>
                    {hasEval ? (planActive ? 'Plan activo' : 'Plan no activo') : 'Pendiente'}
                  </Text>
                </View>
              </View>

              <View style={styles.calorieRingWrap}>
                <ProgressRing
                  size={198}
                  strokeWidth={14}
                  progress={calorieProgress}
                  trackColor="#eceae6"
                  progressColor={calorieRingColor}
                />
                <View style={styles.calorieInner}>
                  <Text style={[styles.calorieValue, !hasEval && { color: '#c8c3bb' }]}>
                    {hasEval ? calorieValue : '–'}
                  </Text>
                  <Text style={[styles.calorieUnit, !hasEval && { color: '#d9d4cc' }]}>
                    {hasEval ? 'kcal' : ''}
                  </Text>
                </View>
              </View>

              {hasEval && (
                <View style={styles.calorieBreakdown}>
                  <View style={styles.calorieBreakdownRow}>
                    <Text style={styles.calorieBreakdownLabel}>Meta</Text>
                    <Text style={styles.calorieBreakdownValue}>{dailyTarget} kcal</Text>
                  </View>

                  <View style={styles.calorieBreakdownRow}>
                    <Text style={styles.calorieBreakdownLabel}>Plan consumido</Text>
                    <Text style={styles.calorieBreakdownValue}>{Math.max(0, Math.round(consumedPlanCalories))} kcal</Text>
                  </View>

                  <View style={styles.calorieBreakdownRow}>
                    <Text style={styles.calorieBreakdownLabel}>Adicional</Text>
                    <Text style={styles.calorieBreakdownValue}>{Math.max(0, Math.round(consumedAdditionalCalories))} kcal</Text>
                  </View>

                  <View style={styles.calorieBreakdownRow}>
                    <Text style={styles.calorieBreakdownLabel}>Total consumido</Text>
                    <Text style={[styles.calorieBreakdownValue, exceededCalories > 0 && { color: '#ef4444' }]}>
                      {Math.max(0, Math.round(totalConsumedCalories))} kcal
                    </Text>
                  </View>

                  {consumedAdditionalCalories > 0 && (
                    <View style={styles.additionalCallout}>
                      <View style={styles.additionalCalloutHeader}>
                        <Text style={styles.additionalCalloutTitle}>Adicional</Text>
                        <Text style={styles.additionalCalloutValue}>{Math.max(0, Math.round(consumedAdditionalCalories))} kcal</Text>
                      </View>
                      <View style={styles.additionalCalloutTrack}>
                        <View
                          style={[
                            styles.additionalCalloutFill,
                            {
                              width: `${Math.round(additionalProgress * 100)}%`,
                              backgroundColor: excessColor,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  {exceededCalories > 0 && (
                    <Text style={[styles.calorieExceededText, { color: excessColor }]}>
                      Exceso: +{Math.round(exceededCalories)} kcal
                    </Text>
                  )}
                </View>
              )}

              {false && hasEval && (
                <Text style={[styles.calorieMetaText, consumedCalories > dailyTarget && { color: '#ef4444' }]}>
                  Meta: {dailyTarget} kcal · Consumidas: {consumedCalories} kcal
                </Text>
              )}

              {!hasEval && (
                <View style={styles.lockedBanner}>
                  <MaterialCommunityIcons name="lock-outline" size={15} color="#b5afa6" />
                  <Text style={styles.lockedBannerText}>
                    Disponible después de tu primera consulta
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionTitle, !hasEval && { color: '#d9d4cc' }]}>Macros del dia</Text>

              <View style={styles.macrosRow}>
                {macroData.map((macro) => (
                  <MacroRing
                    key={macro.key}
                    value={macro.percent}
                    color={macro.color}
                    icon={
                      macro.key === 'protein'
                        ? '🥩'
                        : macro.key === 'carbs'
                          ? '🍞'
                          : '🥑'
                    }
                    label={macro.label}
                    status={macro.status}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => {
                if (!hasEval) {
                  Alert.alert(
                    'Módulo bloqueado',
                    'Tu nutricionista activará Mi Plan después de tu primera consulta.',
                    [{ text: 'Entendido' }]
                  );
                  return;
                }
                router.push('/mi-plan');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.cardSmall, !hasEval && styles.cardSmallLocked]}>
                <View style={styles.iconContainerSmall}>
                  <Image
                    source={require('@/assets/images/MiPlan.png')}
                    style={[styles.cardImage, !hasEval && { opacity: 0.35 }]}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardContentWrapper}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Text style={[styles.cardTitleSmall, { marginBottom: 0 }, !hasEval && { color: '#c8c3bb' }]}>Mi plan</Text>
                    {!hasEval && <MaterialCommunityIcons name="lock-outline" size={14} color="#c8c3bb" />}
                  </View>
                  <Text style={[styles.cardDescSmall, !hasEval && { color: '#d9d4cc' }]}>
                    {hasEval
                      ? 'Tu ruta personalizada para cumplir tus objetivos paso a paso.'
                      : 'Disponible tras tu primera consulta.'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/progreso')} activeOpacity={0.7}>
              <View style={styles.cardSmall}>
                <View style={styles.iconContainerSmall}>
                  <Image source={require('@/assets/images/IMC.png')} style={styles.cardImage} resizeMode="contain" />
                </View>
                <View style={styles.cardContentWrapper}>
                  <Text style={styles.cardTitleSmall}>Progreso</Text>
                  <Text style={styles.cardDescSmall}>Revisa tu avance y compara tus resultados en el tiempo.</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.cardsGrid}>
            <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/menus')} activeOpacity={0.7}>
              <View style={styles.cardSmall}>
                <View style={styles.iconContainerCover}>
                  <Image source={require('@/assets/images/Menu.png')} style={styles.cardImageCover} resizeMode="cover" />
                </View>
                <View style={styles.cardContentWrapper}>
                  <Text style={styles.cardTitleSmall}>Menus</Text>
                  <Text style={styles.cardDescSmall}>Opciones de comidas saludables adaptadas a tu plan diario.</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/ejercicios')} activeOpacity={0.7}>
              <View style={styles.cardSmall}>
                <View style={styles.iconContainerSmall}>
                  <Image source={require('@/assets/images/Ejercicios.png')} style={styles.cardImage} resizeMode="contain" />
                </View>
                <View style={styles.cardContentWrapper}>
                  <Text style={styles.cardTitleSmall}>Ejercicios</Text>
                  <Text style={styles.cardDescSmall}>Rutinas guiadas para entrenar mejor y mantener constancia.</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 112,
  },
  greeting: {
    color: '#0f1115',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 14,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef5444',
  },
  calendarRow: {
    marginBottom: 10,
  },
  calendarWrap: {
    borderRadius: 18,
    backgroundColor: '#f8f6f1',
    paddingVertical: 6,
    marginBottom: 4,
  },
  calendarContent: {
    paddingRight: 22,
    gap: 7,
  },
  dayCard: {
    width: 62,
    height: 80,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3f0',
    borderWidth: 1,
    borderColor: '#e8e4dd',
  },
  dayCardActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e8e4dd',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  monthText: {
    color: '#e0dbd3',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  monthTextActive: {
    color: '#9a9184',
  },
  dayNumber: {
    color: '#ddd8d0',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  dayNumberActive: {
    color: '#1a1a1a',
  },
  weekdayText: {
    color: '#ddd8d0',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  weekdayTextActive: {
    color: '#f5a623',
  },
  card: {
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
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  flameCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffd8be',
    backgroundColor: '#fff8f2',
  },
  cardTitle: {
    color: '#101318',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    flexShrink: 1,
  },
  planBadge: {
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
  planIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: {
    color: '#4f493e',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  calorieRingWrap: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieInner: {
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
  calorieValue: {
    color: '#11141b',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  calorieUnit: {
    color: '#9a9389',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  calorieMetaText: {
    marginTop: 10,
    color: '#8b8378',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  calorieBreakdown: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  calorieBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calorieBreakdownLabel: {
    color: '#8b8378',
    fontSize: 12,
    fontWeight: '700',
  },
  calorieBreakdownValue: {
    color: '#3a352c',
    fontSize: 12,
    fontWeight: '800',
  },
  additionalCallout: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  additionalCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  additionalCalloutTitle: {
    color: '#7c2d12',
    fontSize: 12,
    fontWeight: '900',
  },
  additionalCalloutValue: {
    color: '#7c2d12',
    fontSize: 12,
    fontWeight: '900',
  },
  additionalCalloutTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#fde68a',
    overflow: 'hidden',
  },
  additionalCalloutFill: {
    height: 10,
    borderRadius: 999,
  },
  calorieExceededText: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 16,
    color: '#8e8579',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
  },
  macrosRow: {
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
  macroEmoji: {
    fontSize: 20,
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
    fontWeight: '700',
    marginTop: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  gridCard: {
    flex: 1,
  },
  cardSmall: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    alignItems: 'stretch',
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
    height: 290,
  },
  iconContainerSmall: {
    width: '100%',
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcfbf9',
    padding: 12,
  },
  iconContainerCover: {
    width: '100%',
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcfbf9',
    padding: 0,
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
  cardImageCover: {
    width: '100%',
    height: '100%',
  },
  cardTitleSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1115',
    marginBottom: 6,
    textAlign: 'left',
  },
  cardContentWrapper: {
    padding: 14,
    paddingTop: 10,
    backgroundColor: '#ffffff',
    flex: 1,
  },
  cardDescSmall: {
    fontSize: 12,
    color: '#8e8579',
    textAlign: 'left',
    lineHeight: 16,
  },
  buttonSmall: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fbd232',
    alignItems: 'center',
    marginTop: 0,
  },
  buttonTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardLocked: {
    opacity: 0.82,
  },
  cardSmallLocked: {
    opacity: 0.82,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f3f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e8e4dd',
  },
  lockedBannerText: {
    color: '#b5afa6',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bottomSpacer: {
    height: 6,
  },
});
