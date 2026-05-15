import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { loadCalorieDashboard } from '@/services/calorie.service';
import {
  DayKey,
  ExercisePlan,
  PlanDay,
  PlanMeal,
  WeeklyPlan,
  loadWeeklyPlan,
  updateExerciseStatus,
  updateMealStatus,
} from '@/services/plan.service';

// ─── Calendar helpers ────────────────────────────────────────────────────────

const MONTHS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEKDAYS_ES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ─── Week calendar component (same style as home.tsx) ─────────────────────

function WeekCalendar({
  activeDayKey,
  onSelectDay,
  weeklyPlan,
}: {
  activeDayKey: DayKey;
  onSelectDay: (key: DayKey) => void;
  weeklyPlan: WeeklyPlan;
}) {
  const today = useMemo(() => new Date(), []);

  const calendarDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(today, index - 3);
        const isToday =
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();

        // Map date to day key
        const jsDay = date.getDay();
        const dayKeyMap: Record<number, DayKey> = {
          1: 'monday',
          2: 'tuesday',
          3: 'wednesday',
          4: 'thursday',
          5: 'friday',
        };
        const dayKey = dayKeyMap[jsDay] ?? null;
        const isSelectable = !!dayKey;
        const isActive = dayKey === activeDayKey;

        return {
          key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
          month: MONTHS_ES[date.getMonth()],
          day: date.getDate(),
          weekday: WEEKDAYS_ES[date.getDay()],
          isToday,
          isSelectable,
          dayKey,
          isActive,
        };
      }),
    [today, activeDayKey],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.calendarContent}
      style={styles.calendarRow}
    >
      {calendarDays.map((item) => (
        <TouchableOpacity
          key={item.key}
          activeOpacity={item.isSelectable ? 0.7 : 1}
          onPress={() => {
            if (item.isSelectable && item.dayKey) {
              onSelectDay(item.dayKey);
            }
          }}
        >
          <View
            style={[
              styles.dayCard,
              item.isActive && styles.dayCardActive,
              !item.isSelectable && styles.dayCardDisabled,
            ]}
          >
            <Text style={[styles.monthText, item.isActive && styles.monthTextActive]}>{item.month}</Text>
            <Text style={[styles.dayNumber, item.isActive && styles.dayNumberActive]}>{item.day}</Text>
            <Text style={[styles.weekdayText, item.isActive && styles.weekdayTextActive]}>{item.weekday}</Text>
            {item.isToday && !item.isActive && <View style={styles.todayDot} />}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Dual Action Buttons (✓ verde + ✗ rojo, siempre visibles) ───────────────

function DualActionButtons({
  value,
  onChange,
}: {
  value: 'done' | 'skip' | null;
  onChange: (next: 'done' | 'skip' | null) => void;
}) {
  const handleDone = () => onChange(value === 'done' ? null : 'done');
  const handleSkip = () => onChange(value === 'skip' ? null : 'skip');

  return (
    <View style={styles.dualBtns}>
      <TouchableOpacity
        style={[styles.dualBtn, styles.dualBtnCheck, value === 'done' && styles.dualBtnCheckActive]}
        onPress={handleDone}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="check" size={17} color={value === 'done' ? '#ffffff' : '#1aa44f'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dualBtn, styles.dualBtnSkip, value === 'skip' && styles.dualBtnSkipActive]}
        onPress={handleSkip}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="close" size={17} color={value === 'skip' ? '#ffffff' : '#ef4444'} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Meal Card ─────────────────────────────────────────────────────────────

function MealCard({
  meal,
  status,
  expanded,
  onToggleExpand,
  onChange,
}: {
  meal: PlanMeal;
  status: 'done' | 'skip' | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (next: 'done' | 'skip' | null) => void;
}) {
  return (
    <View style={[styles.mealCard, status === 'done' && styles.mealCardDone, status === 'skip' && styles.mealCardSkip]}>
      {/* ── Header Row ── */}
      <View style={styles.mealHeader}>
        {/* Circular avatar with emoji – swap <Text> for <Image> when ready */}
        <View style={[styles.mealAvatar, status === 'done' && styles.mealAvatarDone, status === 'skip' && styles.mealAvatarSkip]}>
          <Text style={[styles.mealEmoji, status === 'skip' && { opacity: 0.45 }]}>{meal.emoji}</Text>
        </View>

        {/* Center: Title block */}
        <View style={styles.mealInfo}>
          <Text style={[styles.mealTitle, status === 'skip' && styles.mealTitleSkip]} numberOfLines={2}>
            {meal.title}
          </Text>
          <Text style={styles.mealSubtext} numberOfLines={1}>{meal.slot}</Text>
        </View>

        {/* Right: kcal + dual buttons */}
        <View style={styles.mealRight}>
          <Text style={[styles.mealKcal, status === 'skip' && { color: '#b5aba0' }]}>{meal.calories}</Text>
          <Text style={[styles.mealKcalUnit, status === 'skip' && { color: '#c8c2ba' }]}>kcal</Text>
          <DualActionButtons value={status} onChange={onChange} />
        </View>
      </View>

      {/* ── Expand toggle ── */}
      <TouchableOpacity style={styles.expandToggle} onPress={onToggleExpand} activeOpacity={0.7}>
        <Text style={styles.expandToggleText}>{expanded ? 'Ocultar detalle' : 'Ver ingredientes y preparación'}</Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#b5aba0" />
      </TouchableOpacity>

      {/* ── Expanded detail: card hero style ── */}
      {expanded && (
        <View style={styles.detailBox}>
          {/* Hero card with large emoji + meal info */}
          <View style={styles.detailHero}>
            <View style={styles.detailHeroImage}>
              <Text style={styles.detailHeroEmoji}>{meal.emoji}</Text>
            </View>
            <View style={styles.detailHeroBody}>
              <View style={styles.detailHeroTag}>
                <View style={styles.detailHeroTagDot} />
                <Text style={styles.detailHeroTagText}>{meal.slot.toUpperCase()}</Text>
              </View>
              <Text style={styles.detailHeroTitle}>{meal.title}</Text>
              <View style={styles.detailHeroMeta}>
                <MaterialCommunityIcons name="fire" size={12} color="#f5a623" />
                <Text style={styles.detailHeroMetaText}>{meal.calories} kcal</Text>
                <View style={styles.detailHeroMetaDivider} />
                <MaterialCommunityIcons name="silverware-fork-knife" size={12} color="#9a9083" />
                <Text style={styles.detailHeroMetaText}>Comida</Text>
              </View>
            </View>
          </View>

          {/* Macro chips */}
          <View style={styles.macroInfo}>
            <View style={styles.macroInfoChip}>
              <Text style={styles.macroInfoLabel}>Carbos</Text>
              <Text style={[styles.macroInfoValue, { color: '#ef4444' }]}>{meal.macroImpact.carbs * 10}g</Text>
            </View>
            <View style={styles.macroInfoChip}>
              <Text style={styles.macroInfoLabel}>Proteína</Text>
              <Text style={[styles.macroInfoValue, { color: '#1aa44f' }]}>{meal.macroImpact.protein * 10}g</Text>
            </View>
            <View style={styles.macroInfoChip}>
              <Text style={styles.macroInfoLabel}>Grasas</Text>
              <Text style={[styles.macroInfoValue, { color: '#eab308' }]}>{meal.macroImpact.fat * 10}g</Text>
            </View>
          </View>

          {/* Ingredients list  */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <MaterialCommunityIcons name="basket-outline" size={15} color="#1aa44f" />
              <Text style={styles.detailSectionTitle}>Ingredientes</Text>
            </View>
            {meal.ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.ingredientIconWrap}>
                  <MaterialCommunityIcons name="circle-small" size={18} color="#9a9083" />
                </View>
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>

          {/* Preparation steps */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <MaterialCommunityIcons name="chef-hat" size={15} color="#f5a623" />
              <Text style={styles.detailSectionTitle}>Modo de Preparación</Text>
            </View>
            {meal.preparation.map((step, idx) => (
              <View key={idx} style={styles.prepRow}>
                <View style={[styles.prepNumber, idx === 0 && styles.prepNumberActive]}>
                  <Text style={styles.prepNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.prepTextWrap}>
                  <Text style={styles.prepText}>{step}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}


// ─── Exercise Card ─────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  status,
  onChange,
}: {
  exercise: ExercisePlan;
  status: 'done' | 'skip' | null;
  onChange: (next: 'done' | 'skip' | null) => void;
}) {
  return (
    <View style={[styles.exerciseCard, status === 'done' && styles.exerciseCardDone]}>
      <View style={styles.exerciseHeader}>
        <View style={[styles.exerciseAvatar, status === 'done' && styles.exerciseAvatarDone]}>
          <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <View style={styles.exerciseBadges}>
            <View style={styles.exerciseBadge}>
              <MaterialCommunityIcons name="clock-outline" size={10} color="#8e8579" />
              <Text style={styles.exerciseBadgeText}>{exercise.duration}</Text>
            </View>
            <View style={styles.exerciseBadge}>
              <MaterialCommunityIcons name="repeat" size={10} color="#8e8579" />
              <Text style={styles.exerciseBadgeText}>{exercise.series}</Text>
            </View>
            <View style={styles.exerciseBadge}>
              <MaterialCommunityIcons name="numeric" size={10} color="#8e8579" />
              <Text style={styles.exerciseBadgeText}>{exercise.repetitions}</Text>
            </View>
          </View>
          {exercise.notes !== '' && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}
        </View>
        <DualActionButtons value={status} onChange={onChange} />
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

type TabKey = 'menu' | 'ejercicios';

export default function MiPlanScreen() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<DayKey>('monday');
  const [activeTab, setActiveTab] = useState<TabKey>('menu');
  const [loading, setLoading] = useState(true);
  const [expandedMealIds, setExpandedMealIds] = useState<string[]>([]);
  const [totalKcal, setTotalKcal] = useState<number>(0);
  const hasInitializedDayRef = React.useRef(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [nextPlan, nextDashboard] = await Promise.all([loadWeeklyPlan(), loadCalorieDashboard()]);
      setWeeklyPlan(nextPlan);
      setActiveDayKey((prev) => {
        if (hasInitializedDayRef.current && nextPlan.days.some((day) => day.key === prev)) {
          return prev;
        }

        return nextPlan.activeDayKey;
      });
      hasInitializedDayRef.current = true;
      setTotalKcal(nextDashboard?.dailyTarget ?? nextPlan.days[0]?.targetCalories ?? 1800);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const activeDay = useMemo<PlanDay | null>(() => {
    if (!weeklyPlan) return null;
    return weeklyPlan.days.find((day) => day.key === activeDayKey) ?? weeklyPlan.days[0] ?? null;
  }, [activeDayKey, weeklyPlan]);

  const toggleMealExpand = (mealId: string) => {
    setExpandedMealIds((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId],
    );
  };

  const refreshAfterPlanUpdate = async (promise: Promise<WeeklyPlan>) => {
    const next = await promise;
    setWeeklyPlan(next);
  };

  // ── Loading state ──
  if (loading || !weeklyPlan || !activeDay) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#1aa44f" />
          <Text style={styles.loadingText}>Preparando tu plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedMeals = activeDay.selectedMenu.meals.filter(
    (m) => activeDay.mealStatuses[m.id] === 'done',
  ).length;
  const totalMeals = activeDay.selectedMenu.meals.length;
  const progressPct = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#0f1115" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mi Plan</Text>
            <View style={styles.headerAvatar}>
              <MaterialCommunityIcons name="account-circle-outline" size={28} color="#8e8579" />
            </View>
          </View>

          {/* ── Menú / Ejercicios pill tabs ── */}
          <View style={styles.pillTabsWrap}>
            <View style={styles.pillTabs}>
              <TouchableOpacity
                style={[styles.pillTab, activeTab === 'menu' && styles.pillTabActive]}
                onPress={() => setActiveTab('menu')}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillTabText, activeTab === 'menu' && styles.pillTabTextActive]}>
                  Menú
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillTab, activeTab === 'ejercicios' && styles.pillTabActive]}
                onPress={() => setActiveTab('ejercicios')}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillTabText, activeTab === 'ejercicios' && styles.pillTabTextActive]}>
                  Ejercicios
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Week Calendar ── */}
          <View style={styles.calendarWrap}>
            <WeekCalendar
              activeDayKey={activeDayKey}
              onSelectDay={setActiveDayKey}
              weeklyPlan={weeklyPlan}
            />
          </View>

          {/* ── NUTRITION TAB ── */}
          {activeTab === 'menu' && (
            <>
              {/* Day summary header */}
              <View style={styles.daySummaryRow}>
                <View>
                  <Text style={styles.daySummaryLabel}>NUTRICIÓN DIARIA</Text>
                  <Text style={styles.daySummaryTitle}>Comidas de Hoy</Text>
                </View>
                <View style={styles.kcalBadge}>
                  <Text style={styles.kcalValue}>{activeDay.selectedMenu.totalCalories.toLocaleString()}</Text>
                  <Text style={styles.kcalUnit}>kcal totales</Text>
                </View>
              </View>

              {/* Progress strip */}
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{completedMeals}/{totalMeals} comidas completadas</Text>
              </View>

              {/* Meal list */}
              <View style={styles.mealList}>
                {activeDay.selectedMenu.meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    status={activeDay.mealStatuses[meal.id]}
                    expanded={expandedMealIds.includes(meal.id)}
                    onToggleExpand={() => toggleMealExpand(meal.id)}
                    onChange={(next) => void refreshAfterPlanUpdate(updateMealStatus(meal, next ?? 'skip'))}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── EXERCISES TAB ── */}
          {activeTab === 'ejercicios' && (
            <>
              <View style={styles.daySummaryRow}>
                <View>
                  <Text style={styles.daySummaryLabel}>RUTINA SUGERIDA</Text>
                  <Text style={styles.daySummaryTitle}>Ejercicios del Día</Text>
                </View>
                <View style={[styles.kcalBadge, { backgroundColor: '#eef6ff' }]}>
                  <Text style={[styles.kcalValue, { color: '#2563eb' }]}>{activeDay.exercises.length}</Text>
                  <Text style={[styles.kcalUnit, { color: '#6ea9f0' }]}>ejercicios</Text>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {activeDay.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    status={activeDay.exerciseStatuses[exercise.id]}
                    onChange={(next) =>
                      void refreshAfterPlanUpdate(updateExerciseStatus(exercise.id, next ?? 'skip'))
                    }
                  />
                ))}
              </View>

              {/* Empty state for weekend */}
              {activeDay.exercises.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🧘</Text>
                  <Text style={styles.emptyTitle}>Día de descanso</Text>
                  <Text style={styles.emptySubtext}>No hay ejercicios asignados para este día. Descansa y recupérate.</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

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
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#7c7268',
    fontWeight: '600',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
    gap: 14,
  },

  // ── Header ──────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efe6da',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f1115',
    flex: 1,
    textAlign: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0ede8',
    borderWidth: 1,
    borderColor: '#e5ddd1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Pill Tabs ────────────────────────
  pillTabsWrap: {
    alignItems: 'center',
  },
  pillTabs: {
    flexDirection: 'row',
    backgroundColor: '#eeeae3',
    borderRadius: 22,
    padding: 4,
    gap: 4,
    width: '100%',
  },
  pillTab: {
    flex: 1,
    height: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8e8579',
  },
  pillTabTextActive: {
    color: '#0f1115',
  },

  // ── Calendar ────────────────────────
  calendarWrap: {
    marginHorizontal: -4,
  },
  calendarRow: {
    paddingBottom: 2,
  },
  calendarContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  dayCard: {
    width: 56,
    height: 76,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3f0',
    borderWidth: 1,
    borderColor: '#e8e4dd',
    position: 'relative',
  },
  dayCardActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#1aa44f',
    shadowColor: '#1aa44f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  dayCardDisabled: {
    opacity: 0.35,
  },
  monthText: {
    color: '#ccc8c0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  monthTextActive: {
    color: '#1aa44f',
  },
  dayNumber: {
    color: '#ccc8c0',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  dayNumberActive: {
    color: '#0f1115',
  },
  weekdayText: {
    color: '#ccc8c0',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  weekdayTextActive: {
    color: '#f5a623',
  },
  todayDot: {
    position: 'absolute',
    bottom: 7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#f5a623',
  },

  // ── Day Summary ──────────────────────
  daySummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  daySummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1aa44f',
    letterSpacing: 0.6,
  },
  daySummaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f1115',
    marginTop: 2,
  },
  kcalBadge: {
    backgroundColor: '#edf9f3',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  kcalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1aa44f',
    lineHeight: 22,
  },
  kcalUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6dc48c',
  },

  // ── Progress strip ───────────────────
  progressWrap: {
    gap: 6,
    marginTop: -4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ece8e2',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#1aa44f',
  },
  progressLabel: {
    fontSize: 11,
    color: '#9a9083',
    fontWeight: '600',
  },

  // ── Meal Cards ───────────────────────
  mealList: {
    gap: 10,
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mealCardDone: {
    borderColor: '#b9e8cb',
    backgroundColor: '#f5fdf8',
  },
  mealCardSkip: {
    borderColor: '#ede5e5',
    backgroundColor: '#fdfafa',
    opacity: 0.7,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mealAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fdf8f2',
    borderWidth: 1.5,
    borderColor: '#ede5d8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  mealAvatarDone: {
    borderColor: '#a8ddbf',
    backgroundColor: '#f0fdf6',
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealInfo: {
    flex: 1,
    minWidth: 0,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f1115',
    lineHeight: 20,
  },
  mealTitleSkip: {
    textDecorationLine: 'line-through',
    color: '#b5aba0',
  },
  mealSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9a9083',
    marginTop: 3,
  },
  mealRight: {
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    minWidth: 54,
  },
  mealKcal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1aa44f',
    lineHeight: 22,
  },
  mealKcalUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6dc48c',
    marginTop: -4,
  },

  // Expand toggle
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0ece6',
  },
  expandToggleText: {
    fontSize: 12,
    color: '#b5aba0',
    fontWeight: '600',
  },

  // Expanded detail box
  detailBox: {
    marginTop: 12,
    gap: 12,
  },
  detailSection: {
    gap: 6,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f1115',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f6f1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  ingredientIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ingredientText: {
    fontSize: 13,
    color: '#3d3830',
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  prepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  prepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e8e4de',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  prepNumberActive: {
    backgroundColor: '#1aa44f',
  },
  prepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  prepTextWrap: {
    flex: 1,
    paddingVertical: 4,
  },
  prepText: {
    fontSize: 13,
    color: '#4e4840',
    fontWeight: '500',
    lineHeight: 20,
  },
  macroInfo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  macroInfoChip: {
    flex: 1,
    backgroundColor: '#f8f6f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ece8e2',
    paddingVertical: 8,
    alignItems: 'center',
  },
  macroInfoLabel: {
    fontSize: 10,
    color: '#9a9083',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroInfoValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },

  // ── Detail Hero card ─────────────────
  detailHero: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#f8f6f1',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  detailHeroImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e8e2d8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  detailHeroEmoji: {
    fontSize: 36,
  },
  detailHeroBody: {
    flex: 1,
    gap: 4,
  },
  detailHeroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailHeroTagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1aa44f',
  },
  detailHeroTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1aa44f',
    letterSpacing: 0.8,
  },
  detailHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f1115',
    lineHeight: 20,
  },
  detailHeroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailHeroMetaText: {
    fontSize: 12,
    color: '#8e8579',
    fontWeight: '600',
  },
  detailHeroMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ccc8c0',
    marginHorizontal: 2,
  },

  // ── Dual Action Buttons ──────────────
  dualBtns: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 4,
    flexShrink: 0,
  },
  dualBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dualBtnCheck: {
    backgroundColor: '#f0fdf6',
    borderColor: '#a8ddbf',
  },
  dualBtnCheckActive: {
    backgroundColor: '#1aa44f',
    borderColor: '#1aa44f',
  },
  dualBtnSkip: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffc5c5',
  },
  dualBtnSkipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },

  // ── Exercise Cards ───────────────────
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    padding: 14,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  exerciseCardDone: {
    borderColor: '#b9e8cb',
    backgroundColor: '#f5fdf8',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eef3ff',
    borderWidth: 1.5,
    borderColor: '#d5e3ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exerciseAvatarDone: {
    backgroundColor: '#f0fdf6',
    borderColor: '#a8ddbf',
  },
  exerciseEmoji: {
    fontSize: 26,
  },
  exerciseInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f1115',
  },
  exerciseBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  exerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f5f3f0',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  exerciseBadgeText: {
    fontSize: 10,
    color: '#8e8579',
    fontWeight: '600',
  },
  exerciseNotes: {
    fontSize: 11,
    color: '#9a9083',
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 2,
  },

  // ── Empty state ──────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f1115',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9a9083',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
