import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { apiClient } from '@/services/api.client';
import {
  CalorieDashboard,
  loadCalorieDashboard
} from '@/services/calorie.service';
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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
  const [dashboard, setDashboard] = useState<CalorieDashboard | null>(null);

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
        } catch (error) {
          console.error("Error fetching clinical evaluation history:", error);
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
        const nextDashboard = await loadCalorieDashboard();
        if (active) {
          setDashboard(nextDashboard);
        }
      };

      void loadDashboardState();

      return () => {
        active = false;
      };
    }, [])
  );

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

  const planActive = dashboard?.planActive ?? true;
  
  const dailyTarget = userEval?.calorias_diarias_calculadas ?? dashboard?.dailyTarget ?? 1771;
  // TODO: Implementar lógica de reducción cuando se registren comidas
  const calorieValue = dailyTarget; // Mostrar el total directamente
  const calorieProgress = 1; // Barra completa
  const calorieRingColor = '#1aa44f';
  
  const macroData = [
    {
      key: 'protein',
      label: 'Proteina',
      percent: userEval?.distribucion_proteinas_pct ?? 35, // Porcentaje objetivo validado
      status: dashboard?.macros?.find(m => m.key === 'protein')?.status ?? 'Medio',
      color: '#34c759',
      icon: '🥩',
    },
    {
      key: 'carbs',
      label: 'Carbohidratos',
      percent: userEval?.distribucion_carbohidratos_pct ?? 40,
      status: dashboard?.macros?.find(m => m.key === 'carbs')?.status ?? 'Medio',
      color: '#ff3b30',
      icon: '🍞',
    },
    {
      key: 'fat',
      label: 'Grasas',
      percent: userEval?.distribucion_grasas_pct ?? 25,
      status: dashboard?.macros?.find(m => m.key === 'fat')?.status ?? 'Medio',
      color: '#eab308',
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

          <TouchableOpacity onPress={() => router.push('/control-calorico')} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <View style={styles.flameCircle}>
                    <MaterialCommunityIcons name="fire" size={14} color="#ff8a3d" />
                  </View>
                  <Text style={styles.cardTitle}>Control Calorico</Text>
                </View>

                <View style={styles.planBadge}>
                  <View
                    style={[
                      styles.planIconCircle,
                      { backgroundColor: planActive ? '#22a656' : '#e53935' },
                    ]}>
                    <MaterialCommunityIcons name="check" size={10} color="#ffffff" />
                  </View>
                  <Text numberOfLines={1} style={styles.planText}>
                    {planActive ? 'Plan activo' : 'Plan no activo'}
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
                  <Text style={styles.calorieValue}>{calorieValue}</Text>
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Macros del dia</Text>

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
            <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/mi-plan')} activeOpacity={0.7}>
              <View style={styles.cardSmall}>
                <View style={styles.iconContainerSmall}>
                  <Image source={require('@/assets/images/MiPlan.png')} style={styles.cardImage} resizeMode="contain" />
                </View>
                <View style={styles.cardContentWrapper}>
                  <Text style={styles.cardTitleSmall}>Mi plan</Text>
                  <Text style={styles.cardDescSmall}>Tu ruta personalizada para cumplir tus objetivos paso a paso.</Text>
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
                <View style={styles.iconContainerSmall}>
                  <Image source={require('@/assets/images/Menu.png')} style={styles.cardImage} resizeMode="contain" />
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
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    height: 320,
    justifyContent: 'space-between',
  },
  iconContainerSmall: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardImage: {
    width: 130,
    height: 130,
  },
  cardTitleSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1115',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardContentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescSmall: {
    fontSize: 11,
    color: '#8e8579',
    textAlign: 'center',
    lineHeight: 15,
    flex: 1,
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
  bottomSpacer: {
    height: 6,
  },
});
