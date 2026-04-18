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
import Svg, { Circle } from 'react-native-svg';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { CalorieDashboard, getCalorieProgress, loadCalorieDashboard } from '@/services/calorie.service';
import {
  DayKey,
  ExercisePlan,
  PlanDay,
  PlanMeal,
  WeeklyPlan,
  loadWeeklyPlan,
  selectMenuOption,
  updateExerciseStatus,
  updateMealStatus,
} from '@/services/plan.service';

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

function MacroRing({
  percent,
  color,
  emoji,
  label,
  status,
}: {
  percent: number;
  color: string;
  emoji: string;
  label: string;
  status: string;
}) {
  return (
    <View style={styles.macroCard}>
      <View style={styles.macroRingWrap}>
        <ProgressRing size={82} strokeWidth={7} progress={percent / 100} trackColor="#ece9e2" progressColor={color} />
        <View style={styles.macroCenter}>
          <Text style={styles.macroEmoji}>{emoji}</Text>
        </View>
      </View>
      <Text style={styles.macroTitle}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{percent}%</Text>
      <Text style={[styles.macroStatus, { color }]}>{status}</Text>
    </View>
  );
}

function DecisionButtons({
  value,
  onChange,
}: {
  value: 'done' | 'skip' | null;
  onChange: (next: 'done' | 'skip') => void;
}) {
  return (
    <View style={styles.decisionRow}>
      <TouchableOpacity
        style={[styles.decisionButton, value === 'done' && styles.decisionButtonActive]}
        onPress={() => onChange('done')}>
        <Text style={styles.decisionEmoji}>✓</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.decisionButton, value === 'skip' && styles.decisionButtonSkip]}
        onPress={() => onChange('skip')}>
        <Text style={styles.decisionEmoji}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function ExerciseCard({
  exercise,
  status,
  onChange,
}: {
  exercise: ExercisePlan;
  status: 'done' | 'skip' | null;
  onChange: (next: 'done' | 'skip') => void;
}) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseEmojiWrap}>
          <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
        </View>
        <View style={styles.exerciseTextWrap}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <Text style={styles.exerciseSubtext}>{exercise.duration} · {exercise.series} · {exercise.repetitions}</Text>
        </View>
        <DecisionButtons value={status} onChange={onChange} />
      </View>
      <Text style={styles.exerciseNote}>{exercise.notes}</Text>
    </View>
  );
}

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
  onChange: (next: 'done' | 'skip') => void;
}) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealEmojiWrap}>
          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
        </View>
        <View style={styles.mealTitleWrap}>
          <Text style={styles.mealSlot}>{meal.slot}</Text>
          <Text style={styles.mealTitle}>{meal.title}</Text>
          <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
        </View>
        <DecisionButtons value={status} onChange={onChange} />
      </View>

      <TouchableOpacity style={styles.detailToggle} onPress={onToggleExpand}>
        <Text style={styles.detailToggleText}>{expanded ? 'Ocultar detalle' : 'Ver ingredientes y preparacion'}</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9a9083"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.mealDetailBox}>
          <Text style={styles.mealDetailTitle}>Ingredientes</Text>
          <Text style={styles.mealDetailText}>{meal.ingredients.join(', ')}</Text>

          <Text style={styles.mealDetailTitle}>Receta</Text>
          <Text style={styles.mealDetailText}>{meal.recipe}</Text>

          <Text style={styles.mealDetailTitle}>Preparacion</Text>
          {meal.preparation.map((step) => (
            <Text key={step} style={styles.mealDetailStep}>• {step}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MiPlanScreen() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [dashboard, setDashboard] = useState<CalorieDashboard | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<DayKey>('monday');
  const [loading, setLoading] = useState(true);
  const [expandedMealIds, setExpandedMealIds] = useState<string[]>([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [nextPlan, nextDashboard] = await Promise.all([loadWeeklyPlan(), loadCalorieDashboard()]);
      setWeeklyPlan(nextPlan);
      setDashboard(nextDashboard);
      setActiveDayKey(nextPlan.activeDayKey);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const activeDay = useMemo<PlanDay | null>(() => {
    if (!weeklyPlan) return null;
    return weeklyPlan.days.find((day) => day.key === activeDayKey) ?? weeklyPlan.days[0] ?? null;
  }, [activeDayKey, weeklyPlan]);

  const calorieValue = dashboard?.consumedCalories ?? 770;
  const calorieProgress = dashboard ? getCalorieProgress(dashboard) : 0.62;
  const dailyTarget = dashboard?.dailyTarget ?? activeDay?.targetCalories ?? 1400;
  const calorieRingColor = calorieValue > dailyTarget ? '#ef4444' : '#1aa44f';

  const toggleMealExpand = (mealId: string) => {
    setExpandedMealIds((previous) =>
      previous.includes(mealId) ? previous.filter((id) => id !== mealId) : [...previous, mealId],
    );
  };

  const refreshAfterPlanUpdate = async (nextPlanPromise: Promise<WeeklyPlan>) => {
    const nextPlan = await nextPlanPromise;
    const nextDashboard = await loadCalorieDashboard();
    setWeeklyPlan(nextPlan);
    setDashboard(nextDashboard);
  };

  if (loading || !weeklyPlan || !activeDay || !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#1aa44f" />
          <Text style={styles.loadingText}>Armando tu plan personalizado...</Text>
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
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Mi Plan</Text>
              <Text style={styles.subtitle}>Nutricion y ejercicio sugeridos de lunes a viernes</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.ringWrap}>
              <ProgressRing
                size={206}
                strokeWidth={15}
                progress={calorieProgress}
                trackColor="#ece9e2"
                progressColor={calorieRingColor}
              />
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>{calorieValue}</Text>
                <Text style={styles.ringUnit}>kcal</Text>
              </View>
            </View>

            <View style={styles.heroSide}>
              <View style={styles.targetCard}>
                <Text style={styles.targetLabel}>Meta sugerida</Text>
                <Text style={styles.targetValue}>{activeDay.targetCalories} kcal</Text>
                <Text style={styles.targetHint}>Calculada con objetivo, actividad y biometria</Text>
              </View>

              <View style={styles.summaryList}>
                {weeklyPlan.summary.map((item) => (
                  <View key={item} style={styles.summaryItem}>
                    <View style={styles.summaryDot} />
                    <Text style={styles.summaryText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.macroSection}>
            {dashboard.macros.map((macro) => (
              <MacroRing
                key={macro.key}
                percent={macro.percent}
                color={macro.color}
                emoji={macro.key === 'protein' ? '🥩' : macro.key === 'carbs' ? '🍞' : '🥑'}
                label={macro.label}
                status={macro.status}
              />
            ))}
          </View>

          <View style={styles.dayTabsRow}>
            {weeklyPlan.days.map((day) => (
              <TouchableOpacity
                key={day.key}
                style={[styles.dayTab, activeDayKey === day.key && styles.dayTabActive]}
                onPress={() => setActiveDayKey(day.key)}>
                <Text style={[styles.dayTabText, activeDayKey === day.key && styles.dayTabTextActive]}>
                  {day.shortLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>5 opciones para {activeDay.label}</Text>
              <Text style={styles.sectionNote}>Elige el menu que mejor se adapte a tu dia y luego marca cada comida con ✓ o ✕.</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
              {activeDay.menuOptions.map((option) => {
                const selected = option.id === activeDay.selectedMenuId;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => void refreshAfterPlanUpdate(selectMenuOption(activeDay.key, option.id))}>
                    <View style={styles.optionTop}>
                      <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{option.label}</Text>
                      {selected && (
                        <View style={styles.optionSelectedBadge}>
                          <Text style={styles.optionSelectedBadgeText}>Elegido</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.optionCalories, selected && styles.optionCaloriesSelected]}>{option.totalCalories} kcal</Text>
                    <Text style={[styles.optionSummary, selected && styles.optionSummarySelected]}>{option.summary}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Menu seleccionado</Text>
              <Text style={styles.sectionNote}>{activeDay.selectedMenu.label} · {activeDay.selectedMenu.totalCalories} kcal totales</Text>
            </View>

            <View style={styles.mealList}>
              {activeDay.selectedMenu.meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  status={activeDay.mealStatuses[meal.id]}
                  expanded={expandedMealIds.includes(meal.id)}
                  onToggleExpand={() => toggleMealExpand(meal.id)}
                  onChange={(next) => void refreshAfterPlanUpdate(updateMealStatus(meal, next))}
                />
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rutina sugerida</Text>
              <Text style={styles.sectionNote}>Ejercicios adaptados al deporte seleccionado en tu formulario.</Text>
            </View>

            <View style={styles.exerciseList}>
              {activeDay.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  status={activeDay.exerciseStatuses[exercise.id]}
                  onChange={(next) => void refreshAfterPlanUpdate(updateExerciseStatus(exercise.id, next))}
                />
              ))}
            </View>
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
    paddingTop: 14,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efe6da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
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
    color: '#8f8578',
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#efe8df',
    padding: 18,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ringWrap: {
    width: 206,
    height: 206,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    borderColor: '#f1ece5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 36,
    lineHeight: 40,
    color: '#11141b',
    fontWeight: '900',
  },
  ringUnit: {
    marginTop: 4,
    fontSize: 18,
    color: '#8f8578',
    fontWeight: '700',
  },
  heroSide: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  targetCard: {
    borderRadius: 20,
    backgroundColor: '#faf6ee',
    borderWidth: 1,
    borderColor: '#ece2d3',
    padding: 14,
  },
  targetLabel: {
    fontSize: 12,
    color: '#968b7d',
    fontWeight: '700',
  },
  targetValue: {
    marginTop: 6,
    fontSize: 24,
    color: '#11141b',
    fontWeight: '900',
  },
  targetHint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: '#8f8578',
    fontWeight: '600',
  },
  summaryList: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1aa44f',
    marginTop: 6,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#5c554a',
    fontWeight: '600',
  },
  macroSection: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#efe8df',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  macroRingWrap: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroCenter: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#eee6da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroEmoji: {
    fontSize: 21,
  },
  macroTitle: {
    marginTop: 8,
    fontSize: 11,
    color: '#1a1d21',
    fontWeight: '700',
  },
  macroValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '900',
  },
  macroStatus: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  dayTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayTab: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#f2ede6',
    borderWidth: 1,
    borderColor: '#e5ddd1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTabActive: {
    backgroundColor: '#11141b',
    borderColor: '#11141b',
  },
  dayTabText: {
    fontSize: 13,
    color: '#736a5f',
    fontWeight: '800',
  },
  dayTabTextActive: {
    color: '#ffffff',
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
  optionRow: {
    gap: 12,
  },
  optionCard: {
    width: 210,
    borderRadius: 20,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    padding: 14,
  },
  optionCardSelected: {
    backgroundColor: '#11141b',
    borderColor: '#11141b',
  },
  optionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 15,
    color: '#11141b',
    fontWeight: '800',
  },
  optionTitleSelected: {
    color: '#ffffff',
  },
  optionSelectedBadge: {
    borderRadius: 12,
    backgroundColor: '#1aa44f',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  optionSelectedBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '800',
  },
  optionCalories: {
    marginTop: 12,
    fontSize: 24,
    color: '#1aa44f',
    fontWeight: '900',
  },
  optionCaloriesSelected: {
    color: '#f5d46c',
  },
  optionSummary: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#7f7669',
    fontWeight: '600',
  },
  optionSummarySelected: {
    color: '#ddd2c3',
  },
  mealList: {
    gap: 12,
  },
  mealCard: {
    borderRadius: 20,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    padding: 14,
  },
  mealHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mealEmojiWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#fff5ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealTitleWrap: {
    flex: 1,
  },
  mealSlot: {
    fontSize: 11,
    color: '#a19485',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mealTitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  mealCalories: {
    marginTop: 6,
    fontSize: 13,
    color: '#1aa44f',
    fontWeight: '800',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  decisionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef8f1',
    borderWidth: 1,
    borderColor: '#d6eadc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionButtonActive: {
    backgroundColor: '#1aa44f',
    borderColor: '#1aa44f',
  },
  decisionButtonSkip: {
    backgroundColor: '#fef0ef',
    borderColor: '#ffd8d3',
  },
  decisionEmoji: {
    fontSize: 18,
    color: '#11141b',
    fontWeight: '900',
  },
  detailToggle: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#efe6da',
  },
  detailToggleText: {
    fontSize: 12,
    color: '#9a9083',
    fontWeight: '700',
  },
  mealDetailBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efe6da',
    padding: 14,
    gap: 6,
  },
  mealDetailTitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#11141b',
    fontWeight: '800',
  },
  mealDetailText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6b6459',
    fontWeight: '500',
  },
  mealDetailStep: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6b6459',
    fontWeight: '500',
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    borderRadius: 20,
    backgroundColor: '#fcfaf6',
    borderWidth: 1,
    borderColor: '#f0e8dd',
    padding: 14,
  },
  exerciseHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  exerciseEmojiWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseEmoji: {
    fontSize: 24,
  },
  exerciseTextWrap: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 14,
    color: '#11141b',
    fontWeight: '800',
  },
  exerciseSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: '#7f7669',
    fontWeight: '600',
  },
  exerciseNote: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#6b6459',
    fontWeight: '500',
  },
});
