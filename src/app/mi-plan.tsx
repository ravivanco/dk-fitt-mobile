import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BackButton } from '@/components/navigation/back-button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import {
  DayKey,
  PlanDay,
  WeeklyPlan,
  DishDetails,
  TodayMealPlan,
  TodayMealDay,
  TodayMealItem,
  loadDishDetails,
  loadTodayMealPlanFromActivePlan,
  loadTodayMealPlan,
  loadWeeklyPlan,
  saveMealTracking,
} from '@/services/plan.service';
import { refreshCalorieControlDashboard } from '@/store/calorie-control-dashboard.store';
import { fetchExerciseTrackingToday, postExerciseTracking, type ExerciseTrackingItem } from '@/services/exercise.service';
import { fetchActiveNutritionPlan } from '@/services/nutrition-plan.service';

function formatLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalTimeHHmm(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeTrackingStatus(input?: string) {
  const normalized = (input ?? '').toLowerCase();
  if (
    normalized === 'done' ||
    normalized === 'realizado' ||
    normalized === 'realizada' ||
    normalized === 'completado' ||
    normalized === 'completada' ||
    normalized === 'true'
  ) return 'done' as const;
  if (
    normalized === 'skip' ||
    normalized === 'no_realizado' ||
    normalized === 'no realizada' ||
    normalized === 'no_completado' ||
    normalized === 'no completado'
  ) return 'skip' as const;
  return null;
}

function normalizeExerciseTrackingStatus(item: ExerciseTrackingItem): 'done' | 'skip' | null {
  // Regla: si el backend devuelve `completado` pero sin `hora_registro`, lo tratamos como pendiente (null).
  // - completado === true => done
  // - completado === false + hora_registro => skip (marcado con X)
  // - completado === false + sin hora_registro => pendiente
  if (typeof (item as any).completado === 'boolean') {
    if ((item as any).completado === true) return 'done';
    const hasTime = typeof (item as any).hora_registro === 'string' && (item as any).hora_registro.trim().length > 0;
    return hasTime ? 'skip' : null;
  }

  const raw = typeof item.status === 'string' ? item.status : typeof item.estado === 'string' ? item.estado : undefined;
  return normalizeTrackingStatus(raw);
}

function intensityBadge(intensity?: string) {
  const normalized = (intensity ?? '').toLowerCase();
  if (normalized.includes('alta')) return { label: 'Alta', color: '#dc2626', bg: '#fee2e2' };
  if (normalized.includes('media')) return { label: 'Media', color: '#f97316', bg: '#ffedd5' };
  return { label: 'Baja', color: '#16a34a', bg: '#dcfce7' };
}

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
  disabled,
}: {
  value: 'done' | 'skip' | null;
  onChange: (next: 'done' | 'skip' | null) => void;
  disabled?: boolean;
}) {
  const handleDone = () => {
    if (disabled) return;
    onChange(value === 'done' ? null : 'done');
  };
  const handleSkip = () => {
    if (disabled) return;
    onChange(value === 'skip' ? null : 'skip');
  };

  return (
    <View style={[styles.dualBtns, disabled && { opacity: 0.45 }]}>
      <TouchableOpacity
        style={[styles.dualBtn, styles.dualBtnCheck, value === 'done' && styles.dualBtnCheckActive]}
        onPress={handleDone}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="check" size={17} color={value === 'done' ? '#ffffff' : '#1aa44f'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dualBtn, styles.dualBtnSkip, value === 'skip' && styles.dualBtnSkipActive]}
        onPress={handleSkip}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="close" size={17} color={value === 'skip' ? '#ffffff' : '#ef4444'} />
      </TouchableOpacity>
    </View>
  );
}

function statusToLabel(status: TodayMealItem['status']) {
  if (status === 'done') return 'Realizada';
  if (status === 'skip') return 'No realizada';
  return 'Pendiente';
}

function applyMealStatusOptimistic(
  plan: TodayMealPlan | null,
  menuTrackingId: string,
  next: 'done' | 'skip',
): TodayMealPlan | null {
  if (!plan) return plan;

  const patchMeals = (meals: TodayMealItem[]) => meals.map((meal) => (
    meal.menuTrackingId === menuTrackingId
      ? { ...meal, status: next }
      : meal
  ));

  const nextMeals = patchMeals(plan.meals);
  const nextDays = plan.days.map((day) => {
    const patched = patchMeals(day.meals);
    const completed = patched.filter((meal) => meal.status === 'done').length;
    const total = patched.length;
    return {
      ...day,
      meals: patched,
      completedMeals: completed,
      totalMeals: total,
      progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const completedMeals = nextMeals.filter((meal) => meal.status === 'done').length;
  const totalMeals = nextMeals.length;
  return {
    ...plan,
    days: nextDays,
    meals: nextMeals,
    completedMeals,
    totalMeals,
    progressPct: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
  };
}

function MealDayStrip({
  days,
  selectedDayId,
  onSelectDay,
}: {
  days: TodayMealDay[];
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
}) {
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (!selectedDayId || days.length === 0) return;
    const index = days.findIndex((day) => day.id === selectedDayId);
    if (index < 0) return;

    // Cada card mide ~74px + gap 10 => 84px por item (ver styles.mealDayCard + styles.mealDayContent).
    const itemWidth = 84;
    const targetX = Math.max(0, index * itemWidth - itemWidth * 2);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    });
  }, [days, selectedDayId]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mealDayContent}
      style={styles.mealDayRow}
    >
      {days.map((day, index) => {
        const active = day.id === selectedDayId;
        return (
          <TouchableOpacity key={`${day.id}:${day.date ?? ''}:${index}`} activeOpacity={0.8} onPress={() => onSelectDay(day.id)}>
            <View style={[styles.mealDayCard, active && styles.mealDayCardActive]}>
              <Text style={[styles.mealDayLabel, active && styles.mealDayLabelActive]}>{day.shortLabel}</Text>
              <Text style={[styles.mealDayDate, active && styles.mealDayDateActive]}>{day.date ? new Date(`${day.date}T00:00:00`).getDate() : '--'}</Text>
              <Text style={[styles.mealDayMeta, active && styles.mealDayMetaActive]}>{day.progressPct}%</Text>
              <Text style={[styles.mealDaySubtext, active && styles.mealDaySubtextActive]}>{day.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Meal Card ─────────────────────────────────────────────────────────────

function MealCard({
  meal,
  status,
  expanded,
  onToggleExpand,
  onChange,
  details,
  loadingDetails,
  detailsError,
  actionsDisabled,
}: {
  meal: TodayMealItem;
  status: 'done' | 'skip' | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (next: 'done' | 'skip' | null) => void;
  details?: DishDetails | null;
  loadingDetails?: boolean;
  detailsError?: string | null;
  actionsDisabled?: boolean;
}) {
  const visibleIngredients = details?.ingredients ?? [];
  const visiblePreparation = details?.preparation ?? [];
  const detailTitle = details?.title ?? meal.title;
  const detailCalories = details?.calories ?? meal.calories;
  const detailEmoji = details?.emoji ?? meal.emoji;

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
          <Text style={styles.mealSubtext} numberOfLines={1}>
            {meal.slot} · {statusToLabel(status ? status : 'pending')}
          </Text>
        </View>

        {/* Right: kcal + dual buttons */}
        <View style={styles.mealRight}>
          <Text style={[styles.mealKcal, status === 'skip' && { color: '#b5aba0' }]}>{meal.calories}</Text>
          <Text style={[styles.mealKcalUnit, status === 'skip' && { color: '#c8c2ba' }]}>kcal</Text>
          <DualActionButtons value={status} onChange={onChange} disabled={actionsDisabled} />
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
          {loadingDetails ? (
            <View style={styles.detailLoadingBox}>
              <ActivityIndicator size="small" color="#1aa44f" />
              <Text style={styles.detailLoadingText}>Cargando receta...</Text>
            </View>
          ) : null}

          {!loadingDetails && !details && detailsError ? (
            <View style={styles.detailErrorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.detailErrorText}>No pudimos cargar ingredientes y preparaciÃ³n.</Text>
            </View>
          ) : null}

          {/* Hero card with large emoji + meal info */}
          <View style={styles.detailHero}>
            <View style={styles.detailHeroImage}>
              <Text style={styles.detailHeroEmoji}>{detailEmoji}</Text>
            </View>
            <View style={styles.detailHeroBody}>
              <View style={styles.detailHeroTag}>
                <View style={styles.detailHeroTagDot} />
                <Text style={styles.detailHeroTagText}>{meal.slot.toUpperCase()}</Text>
              </View>
              <Text style={styles.detailHeroTitle}>{detailTitle}</Text>
              <View style={styles.detailHeroMeta}>
                <MaterialCommunityIcons name="fire" size={12} color="#f5a623" />
                <Text style={styles.detailHeroMetaText}>{detailCalories} kcal</Text>
                <View style={styles.detailHeroMetaDivider} />
                <MaterialCommunityIcons name="silverware-fork-knife" size={12} color="#9a9083" />
                <Text style={styles.detailHeroMetaText}>Comida</Text>
              </View>
            </View>
          </View>

          {details?.recipe ? (
            <View style={styles.recipeBox}>
              <View style={styles.detailSectionHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={15} color="#f5a623" />
                <Text style={styles.detailSectionTitle}>Receta</Text>
              </View>
              <Text style={styles.recipeText}>{details.recipe}</Text>
            </View>
          ) : null}

          {/* Ingredients list  */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <MaterialCommunityIcons name="basket-outline" size={15} color="#1aa44f" />
              <Text style={styles.detailSectionTitle}>Ingredientes</Text>
            </View>
            {visibleIngredients.length > 0 ? visibleIngredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.ingredientIconWrap}>
                  <MaterialCommunityIcons name="circle-small" size={18} color="#9a9083" />
                </View>
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            )) : (
              <Text style={styles.detailPlaceholderText}>No hay ingredientes disponibles todavía.</Text>
            )}
          </View>

          {/* Preparation steps */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <MaterialCommunityIcons name="chef-hat" size={15} color="#f5a623" />
              <Text style={styles.detailSectionTitle}>Modo de Preparación</Text>
            </View>
            {visiblePreparation.length > 0 ? visiblePreparation.map((step, idx) => (
              <View key={idx} style={styles.prepRow}>
                <View style={[styles.prepNumber, idx === 0 && styles.prepNumberActive]}>
                  <Text style={styles.prepNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.prepTextWrap}>
                  <Text style={styles.prepText}>{step}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.detailPlaceholderText}>No hay pasos de preparación disponibles todavía.</Text>
            )}
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
  actionsDisabled,
}: {
  exercise: ExerciseTrackingItem;
  status: 'done' | 'skip' | null;
  onChange: (next: 'done' | 'skip' | null) => void;
  actionsDisabled?: boolean;
}) {
  const badge = intensityBadge(typeof exercise.intensidad === 'string' ? exercise.intensidad : undefined);

  return (
    <View style={[styles.exerciseCard, status === 'done' && styles.exerciseCardDone]}>
      <View style={styles.exerciseHeader}>
        <View style={[styles.exerciseAvatar, status === 'done' && styles.exerciseAvatarDone]}>
          <Text style={styles.exerciseEmoji}>🏋️</Text>
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{exercise.nombre}</Text>
          <View style={styles.exerciseBadges}>
            <View style={styles.exerciseBadge}>
              <MaterialCommunityIcons name="clock-outline" size={10} color="#8e8579" />
              <Text style={styles.exerciseBadgeText}>{typeof exercise.duracion_min === 'number' ? `${exercise.duracion_min} min` : '—'}</Text>
            </View>
            <View style={styles.exerciseBadge}>
              <MaterialCommunityIcons name="repeat" size={10} color="#8e8579" />
              <Text style={styles.exerciseBadgeText}>{exercise.series ?? exercise.bloques ?? '—'}</Text>
            </View>
            <View style={styles.exerciseBadge}>
              <MaterialCommunityIcons name="numeric" size={10} color="#8e8579" />
              <Text style={styles.exerciseBadgeText}>{exercise.repeticiones ?? exercise.distancia ?? '—'}</Text>
            </View>
            <View style={[styles.exerciseBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.exerciseBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          {!!exercise.descripcion && <Text style={styles.exerciseNotes}>{exercise.descripcion}</Text>}
        </View>
        <DualActionButtons value={status} onChange={onChange} disabled={actionsDisabled ?? status !== null} />
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

type TabKey = 'menu' | 'ejercicios';

export default function MiPlanScreen() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayMealPlan | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | number | null>(null);
  const [selectedMealDayId, setSelectedMealDayId] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<DayKey>('monday');
  const [activeTab, setActiveTab] = useState<TabKey>('menu');
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exerciseTracking, setExerciseTracking] = useState<ExerciseTrackingItem[]>([]);
  const [exerciseStatuses, setExerciseStatuses] = useState<Record<string, 'done' | 'skip' | null>>({});
  const [exerciseTotalMinutes, setExerciseTotalMinutes] = useState<number>(0);
  const [exerciseEmptyMessage, setExerciseEmptyMessage] = useState<string | null>(null);
  const [expandedMealIds, setExpandedMealIds] = useState<string[]>([]);
  const [mealDetailsById, setMealDetailsById] = useState<Record<string, DishDetails>>({});
  const [loadingDishIds, setLoadingDishIds] = useState<Record<string, boolean>>({});
  const [dishLoadErrors, setDishLoadErrors] = useState<Record<string, string>>({});
  const [mealStatusOverrides, setMealStatusOverrides] = useState<Record<string, 'done' | 'skip' | null>>({});
  const [mealSavingByTrackingId, setMealSavingByTrackingId] = useState<Record<string, boolean>>({});
  const hasInitializedDayRef = React.useRef(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const activePlan = await fetchActiveNutritionPlan();
      if (!activePlan || activePlan.modulo_habilitado !== true) {
        setWeeklyPlan(null);
        setTodayPlan(null);
        setActivePlanId(null);
        setLoadError('Tu plan aún no está disponible. Espera a que tu nutricionista lo active.');
        return;
      }

      setActivePlanId(activePlan.id_plan);

      const [weeklyResult, mealResult] = await Promise.allSettled([
        loadWeeklyPlan(),
        loadTodayMealPlanFromActivePlan(),
      ]);

      if (weeklyResult.status === 'fulfilled') {
        const nextPlan = weeklyResult.value;
        setWeeklyPlan(nextPlan);
        setActiveDayKey((prev) => {
          if (hasInitializedDayRef.current && nextPlan.days.some((day) => day.key === prev)) {
            return prev;
          }

          return nextPlan.activeDayKey;
        });
        hasInitializedDayRef.current = true;
      } else {
        setLoadError('No pudimos cargar tu plan semanal.');
      }

      if (mealResult.status === 'fulfilled') {
        setTodayPlan(mealResult.value);
        setSelectedMealDayId(mealResult.value.selectedDayId);
        // selectedMealDayId define la fecha a consultar; no usamos un calendario extra en esta pantalla.
      } else {
        // Fallback: si falla el endpoint nuevo de weeks, mantener la experiencia previa
        // cargando el menÃº del dÃ­a desde meal-tracking/today.
        try {
          const fallback = await loadTodayMealPlan();
          setTodayPlan(fallback);
          setSelectedMealDayId(fallback.selectedDayId);
          // selectedMealDayId define la fecha a consultar; no usamos un calendario extra en esta pantalla.
          setLoadError((current) => current ?? 'No pudimos cargar el plan completo; mostrando el menÃº del dÃ­a.');
        } catch {
          setTodayPlan({
            days: [],
            selectedDayId: '',
            meals: [],
            completedMeals: 0,
            totalMeals: 0,
            progressPct: 0,
            summary: [],
            updatedAt: undefined,
          });
          setSelectedMealDayId('');
          setLoadError((current) => current ?? 'No pudimos cargar las comidas de hoy.');
        }
      }
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

  const selectedMealDay = useMemo<TodayMealDay | null>(() => {
    if (!todayPlan) return null;
    return (
      todayPlan.days.find((day) => day.id === selectedMealDayId)
      ?? todayPlan.days.find((day) => day.id === todayPlan.selectedDayId)
      ?? todayPlan.days[0]
      ?? null
    );
  }, [selectedMealDayId, todayPlan]);

  const selectedDate = useMemo(() => {
    const date = selectedMealDay?.date;
    return typeof date === 'string' && date.length >= 10 ? date.slice(0, 10) : formatLocalIsoDate();
  }, [selectedMealDay]);

  const isTodaySelected = selectedDate === formatLocalIsoDate();

  useFocusEffect(
    React.useCallback(() => {
      if (activeTab !== 'ejercicios') return;
      let active = true;

      const loadExercises = async () => {
        setLoadingExercises(true);
        try {
          const result = await fetchExerciseTrackingToday({ date: selectedDate });
          if (!active) return;
          setExerciseTracking(result.items);
          setExerciseTotalMinutes(result.totalDurationMin);
          setExerciseEmptyMessage(result.message ?? null);
          setExerciseStatuses(
            result.items.reduce<Record<string, 'done' | 'skip' | null>>((acc, ex) => {
              acc[ex.id] = normalizeExerciseTrackingStatus(ex);
              return acc;
            }, {}),
          );
        } catch {
          if (active) {
            setExerciseTracking([]);
            setExerciseStatuses({});
            setExerciseTotalMinutes(0);
            setExerciseEmptyMessage(null);
          }
        } finally {
          if (active) setLoadingExercises(false);
        }
      };

      void loadExercises();
      return () => {
        active = false;
      };
    }, [activeTab, selectedDate]),
  );

  const toggleMealExpand = (mealId: string) => {
    setExpandedMealIds((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId],
    );
  };

  const handleMealExpand = React.useCallback(async (meal: TodayMealItem) => {
    const isExpanded = expandedMealIds.includes(meal.id);

    if (__DEV__) {
      console.log('[mi-plan][expand] toggle', {
        mealId: meal.id,
        menuTrackingId: meal.menuTrackingId,
        dishId: meal.dishId,
        isExpanded,
        hasCachedDetails: Boolean(meal.dishId && mealDetailsById[meal.dishId]),
      });
    }

    if (!isExpanded && meal.dishId && !mealDetailsById[meal.dishId] && !loadingDishIds[meal.dishId]) {
      setLoadingDishIds((current) => ({ ...current, [meal.dishId!]: true }));
      setDishLoadErrors((current) => {
        const next = { ...current };
        delete next[meal.dishId!];
        return next;
      });
      try {
        if (__DEV__) console.log('[mi-plan][expand] fetching dish details', { dishId: meal.dishId });
        const details = await loadDishDetails(meal.dishId);
        if (__DEV__) {
          console.log('[mi-plan][expand] fetched dish details', {
            dishId: meal.dishId,
            ingredientsCount: details.ingredients.length,
            preparationCount: details.preparation.length,
          });
        }
        setMealDetailsById((current) => ({ ...current, [meal.dishId!]: details }));
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : 'Error cargando receta';
        if (__DEV__) console.log('[mi-plan][expand] fetch error', { dishId: meal.dishId, message });
        setDishLoadErrors((current) => ({ ...current, [meal.dishId!]: message }));
      } finally {
        setLoadingDishIds((current) => {
          const next = { ...current };
          delete next[meal.dishId!];
          return next;
        });
      }
    }

    toggleMealExpand(meal.id);
  }, [expandedMealIds, mealDetailsById, loadingDishIds]);

  const handleMealStatusChange = React.useCallback(async (meal: TodayMealItem, next: 'done' | 'skip' | null) => {
    if (!next || meal.status === next) return;
    if (!isTodaySelected) return;
    if (!activePlanId) return;
    const trackingKey = String(meal.menuTrackingId);

    setMealSavingByTrackingId((prev) => ({ ...prev, [trackingKey]: true }));
    setMealStatusOverrides((prev) => ({ ...prev, [trackingKey]: next }));
    setTodayPlan((current) => applyMealStatusOptimistic(current, trackingKey, next));

    try {
      if (__DEV__) {
        console.log('[mi-plan][meal][status] change', {
          mealId: meal.id,
          menuTrackingId: meal.menuTrackingId,
          current: meal.status,
          next,
          activePlanId,
        });
      }
      const updated = await saveMealTracking({
        menuTrackingId: meal.menuTrackingId,
        realized: next === 'done',
        hora_registro: formatLocalTimeHHmm(),
        planId: activePlanId,
      });
      setTodayPlan(updated);
      setSelectedMealDayId(updated.selectedDayId);
      // Refrescar dashboard calÃ³rico del dÃ­a para actualizar el anillo en Home.
      void refreshCalorieControlDashboard(formatLocalIsoDate()).catch((err) => {
        if (__DEV__) {
          const message = err instanceof Error ? err.message : String(err);
          console.log('[mi-plan][meal][status] refresh dashboard failed', { message });
        }
      });
    } catch (err) {
      setMealStatusOverrides((prev) => {
        const copy = { ...prev };
        delete copy[trackingKey];
        return copy;
      });
      if (__DEV__) {
        const message = err instanceof Error ? err.message : String(err);
        console.log('[mi-plan][meal][status] change failed', {
          mealId: meal.id,
          menuTrackingId: meal.menuTrackingId,
          next,
          message,
        });
      }
      Alert.alert('Error', 'No pudimos actualizar el estado de la comida.');
    } finally {
      setMealSavingByTrackingId((prev) => {
        const copy = { ...prev };
        delete copy[trackingKey];
        return copy;
      });
    }
  }, [activePlanId, isTodaySelected]);

  const handleExerciseStatusChange = React.useCallback(
    async (exercise: ExerciseTrackingItem, next: 'done' | 'skip' | null) => {
      if (!next) return;
      const current = exerciseStatuses[exercise.id] ?? null;
      if (current === next) return;

      try {
        // Optimista: marcar y bloquear de inmediato.
        setExerciseStatuses((prev) => ({ ...prev, [exercise.id]: next }));
        await postExerciseTracking(
          exercise.dailyId
            ? {
                id_ejercicio_diario: exercise.dailyId,
                completado: next === 'done',
                hora_registro: formatLocalTimeHHmm(),
              }
            : {
                id_ejercicio: exercise.id,
                fecha: selectedDate,
                completado: next === 'done',
                hora_registro: formatLocalTimeHHmm(),
              },
        );
      } catch {
        setExerciseStatuses((prev) => ({ ...prev, [exercise.id]: current }));
        Alert.alert('Error', 'No pudimos registrar el ejercicio.');
      }
    },
    [exerciseStatuses, selectedDate],
  );

  const refreshAfterPlanUpdate = async (promise: Promise<WeeklyPlan>) => {
    const next = await promise;
    setWeeklyPlan(next);
  };

  // ── Loading state ──
  const todayMeals = selectedMealDay?.meals ?? todayPlan?.meals ?? [];
  const todayMealsCompleted = selectedMealDay?.completedMeals ?? todayPlan?.completedMeals ?? 0;
  const todayMealsTotal = selectedMealDay?.totalMeals ?? todayPlan?.totalMeals ?? 0;
  const todayProgressPct = selectedMealDay?.progressPct ?? todayPlan?.progressPct ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#1aa44f" />
          <Text style={styles.loadingText}>Preparando tu plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!weeklyPlan || !activeDay) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrapper}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>No se pudo cargar Mi Plan</Text>
          <Text style={styles.emptySubtext}>{loadError ?? 'Intenta nuevamente en unos segundos.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadData()} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
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
            <BackButton />
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
          {/* (Calendario general removido; se usa el calendario del plan dentro de Menú) */}

          {/* ── NUTRITION TAB ── */}
          {activeTab === 'menu' && (
            <>
              {todayPlan && todayPlan.days.length > 0 && selectedMealDay && (
                <MealDayStrip
                  days={todayPlan.days}
                  selectedDayId={selectedMealDay.id}
                  onSelectDay={setSelectedMealDayId}
                />
              )}

              {/* Day summary header */}
              <View style={styles.daySummaryRow}>
                <View>
                  <Text style={styles.daySummaryLabel}>MENÚ DE HOY</Text>
                  <Text style={styles.daySummaryTitle}>{selectedMealDay?.label ?? 'Sin comidas asignadas'}</Text>
                </View>
                <View style={styles.kcalBadge}>
                  <Text style={styles.kcalValue}>{todayProgressPct}%</Text>
                  <Text style={styles.kcalUnit}>{todayMealsCompleted}/{todayMealsTotal} comidas</Text>
                </View>
              </View>

              {Array.isArray(todayPlan?.summary) && todayPlan.summary.length > 0 && (
                <View style={styles.summaryBox}>
                  {todayPlan.summary.map((line: string, index: number) => (
                    <Text key={`${line}-${index}`} style={styles.summaryLine}>{line}</Text>
                  ))}
                </View>
              )}

              {/* Progress strip */}
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${todayProgressPct}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{todayMealsCompleted}/{todayMealsTotal} comidas completadas</Text>
              </View>

              {/* Meal list */}
              {todayMeals.length > 0 ? (
                <View style={styles.mealList}>
                  {todayMeals.map((meal) => {
                    const trackingKey = String(meal.menuTrackingId);
                    const override = mealStatusOverrides[trackingKey];
                    const effectiveStatus = override ?? (meal.status === 'pending' ? null : meal.status);
                    const isSaving = Boolean(mealSavingByTrackingId[trackingKey]);

                    return (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        status={effectiveStatus}
                        expanded={expandedMealIds.includes(meal.id)}
                        onToggleExpand={() => void handleMealExpand(meal)}
                        onChange={(next) => void handleMealStatusChange(meal, next)}
                        actionsDisabled={!isTodaySelected || effectiveStatus !== null || isSaving}
                        details={meal.dishId ? mealDetailsById[meal.dishId] : undefined}
                        loadingDetails={meal.dishId ? Boolean(loadingDishIds[meal.dishId]) : false}
                        detailsError={meal.dishId ? (dishLoadErrors[meal.dishId] ?? null) : null}
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🍽️</Text>
                  <Text style={styles.emptyTitle}>No hay comidas para mostrar</Text>
                  <Text style={styles.emptySubtext}>{loadError ?? 'Todavía no hay menús asignados para este día.'}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => void loadData()} activeOpacity={0.8}>
                    <Text style={styles.retryButtonText}>Recargar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── EXERCISES TAB ── */}
          {activeTab === 'ejercicios' && (
            <>
              <View style={styles.daySummaryRow}>
                <View>
                  <Text style={styles.daySummaryLabel}>RUTINA SUGERIDA</Text>
                  <Text style={styles.daySummaryTitle}>{selectedMealDay?.label ?? 'Ejercicios del día'}</Text>
                </View>
                <View style={[styles.kcalBadge, { backgroundColor: '#eef6ff' }]}>
                  <Text style={[styles.kcalValue, { color: '#2563eb' }]}>{exerciseTotalMinutes}</Text>
                  <Text style={[styles.kcalUnit, { color: '#6ea9f0' }]}>min</Text>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {loadingExercises ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color="#1aa44f" />
                    <Text style={styles.loadingText}>Cargando ejercicios...</Text>
                  </View>
                ) : (
                  exerciseTracking.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      status={exerciseStatuses[exercise.id] ?? null}
                      onChange={(next) => void handleExerciseStatusChange(exercise, next)}
                      actionsDisabled={!isTodaySelected || (exerciseStatuses[exercise.id] ?? null) !== null}
                    />
                  ))
                )}
              </View>

              {/* Empty state for weekend */}
              {!loadingExercises && exerciseTracking.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🧘</Text>
                  <Text style={styles.emptyTitle}>Día de descanso</Text>
                  <Text style={styles.emptySubtext}>{exerciseEmptyMessage ?? 'No hay ejercicios asignados para este día. Descansa y recupérate.'}</Text>
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

  mealDayRow: {
    marginTop: 2,
  },
  mealDayContent: {
    paddingHorizontal: 2,
    gap: 10,
  },
  mealDayCard: {
    width: 74,
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: '#f5f3f0',
    borderWidth: 1,
    borderColor: '#e8e4dd',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  mealDayCardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#1aa44f',
    shadowColor: '#1aa44f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  mealDayLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: '#9a9083',
    letterSpacing: 0.4,
  },
  mealDayLabelActive: {
    color: '#1aa44f',
  },
  mealDayDate: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#c7c0b6',
    marginTop: 4,
  },
  mealDayDateActive: {
    color: '#0f1115',
  },
  mealDayMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9a9083',
    marginTop: 1,
  },
  mealDayMetaActive: {
    color: '#f5a623',
  },
  mealDaySubtext: {
    fontSize: 9,
    fontWeight: '700',
    color: '#c7c0b6',
    textAlign: 'center',
    marginTop: 2,
  },
  mealDaySubtextActive: {
    color: '#5f574d',
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
  mealAvatarSkip: {
    borderColor: '#e9dfdf',
    backgroundColor: '#faf7f7',
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

  summaryBox: {
    backgroundColor: '#f8f6f1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ede7dd',
    gap: 6,
  },
  summaryLine: {
    fontSize: 12,
    color: '#5f574d',
    fontWeight: '600',
    lineHeight: 18,
  },

  // Expanded detail box
  detailBox: {
    marginTop: 12,
    gap: 12,
  },
  detailLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  detailLoadingText: {
    fontSize: 12,
    color: '#9a9083',
    fontWeight: '600',
  },
  detailErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  detailErrorText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '700',
    flexShrink: 1,
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
  recipeBox: {
    backgroundColor: '#fffaf0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3e1b4',
    padding: 12,
    gap: 8,
  },
  recipeText: {
    fontSize: 13,
    color: '#4e4840',
    lineHeight: 20,
    fontWeight: '500',
  },
  detailPlaceholderText: {
    fontSize: 12,
    color: '#9a9083',
    fontWeight: '600',
    lineHeight: 18,
    paddingVertical: 2,
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
  retryButton: {
    marginTop: 8,
    backgroundColor: '#1aa44f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
