import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';

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
          <Text style={[styles.macroIcon, { color }]}>{icon}</Text>
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
  const [planActive, setPlanActive] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        const [storedName, storedPlan] = await Promise.all([
          AsyncStorage.getItem('dkfit.userName'),
          AsyncStorage.getItem('dkfit.planActive'),
        ]);

        if (!mounted) {
          return;
        }

        if (storedName && storedName.trim().length > 0) {
          setUserName(storedName.trim());
        }

        if (storedPlan === 'false') {
          setPlanActive(false);
        } else if (storedPlan === 'true') {
          setPlanActive(true);
        }
      } catch {
        if (mounted) {
          setUserName('Usuario');
          setPlanActive(true);
        }
      }
    };

    loadUserData();

    return () => {
      mounted = false;
    };
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.greeting}>Hola, {userName}</Text>

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
              <ProgressRing size={198} strokeWidth={14} progress={0.62} trackColor="#eceae6" progressColor="#1aa44f" />
              <View style={styles.calorieInner}>
                <Text style={styles.calorieValue}>750</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Macros del dia</Text>

            <View style={styles.macrosRow}>
              <MacroRing value={68} color="#34e323" icon="🥬" label="Proteina" status="Alto" />
              <MacroRing value={52} color="#ff2020" icon="🍞" label="Carbohidratos" status="Medio" />
              <MacroRing value={34} color="#e7b300" icon="🥑" label="Grasas" status="Bajo" />
            </View>
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
    paddingHorizontal: 16,
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
  calendarRow: {
    marginTop: 0,
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
    paddingVertical: 6,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayCardActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.6,
    borderColor: '#e5ddd1',
    shadowColor: '#b8ab97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  monthText: {
    color: '#d3cdc2',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  monthTextActive: {
    color: '#7e7568',
  },
  dayNumber: {
    color: '#c7c0b7',
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '800',
    marginTop: 0,
  },
  dayNumberActive: {
    color: '#11141b',
  },
  weekdayText: {
    color: '#cbc2b7',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  weekdayTextActive: {
    color: '#ef5444',
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
  macroIcon: {
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
  bottomSpacer: {
    height: 6,
  },
});
