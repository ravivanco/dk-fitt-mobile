import AsyncStorage from '@react-native-async-storage/async-storage';

import { authStore } from '@/store/auth.store';
import { intakeImageService } from '@/services/intake-image.service';

export type MacroKey = 'protein' | 'carbs' | 'fat';

export type MacroProgress = {
  key: MacroKey;
  label: string;
  shortLabel: string;
  color: string;
  icon: string;
  percent: number;
  status: string;
};

export type WeightEntry = {
  date: string;
  value: number;
};

export type FoodEstimate = {
  id: string;
  name: string;
  calories: number;
  imageUri: string;
  alertTone: 'high' | 'medium';
  alertTitle: string;
  alertMessage: string;
  exerciseSuggestions: string[];
  macroImpact: Record<MacroKey, number>;
};

export type MealHistoryEntry = FoodEstimate & {
  confirmedAt: string;
};

export type TrackedMealImpact = {
  calories: number;
  macroImpact: Record<MacroKey, number>;
};

export type CalorieDashboard = {
  dailyTarget: number;
  consumedCalories: number;
  planActive: boolean;
  macros: MacroProgress[];
  weightEntries: WeightEntry[];
  mealHistory: MealHistoryEntry[];
  trackedMeals: Record<string, TrackedMealImpact>;
};

const STORAGE_KEY = '@dk_fitt:calorie_dashboard';
const PLAN_KEY = 'dkfit.planActive';

const DEFAULT_MACROS: MacroProgress[] = [
  {
    key: 'protein',
    label: 'Proteina',
    shortLabel: 'Prot',
    color: '#34c759',
    icon: 'food-drumstick-outline',
    percent: 68,
    status: 'Alto',
  },
  {
    key: 'carbs',
    label: 'Carbohidratos',
    shortLabel: 'Carbs',
    color: '#ff3b30',
    icon: 'bread-slice-outline',
    percent: 52,
    status: 'Medio',
  },
  {
    key: 'fat',
    label: 'Grasas',
    shortLabel: 'Grasas',
    color: '#eab308',
    icon: 'avocado',
    percent: 34,
    status: 'Bajo',
  },
];

const DEFAULT_DASHBOARD: CalorieDashboard = {
  dailyTarget: 1240,
  consumedCalories: 770,
  planActive: true,
  macros: DEFAULT_MACROS,
  weightEntries: [],
  mealHistory: [],
  trackedMeals: {},
};

const ESTIMATE_LIBRARY: Omit<FoodEstimate, 'id' | 'imageUri'>[] = [
  {
    name: 'Hamburguesa artesanal',
    calories: 1000,
    alertTone: 'high',
    alertTitle: 'Carga calorica alta',
    alertMessage:
      'Si la registras, conviene compensarla con una sesion intensa o ajustar el resto del dia.',
    exerciseSuggestions: ['HIIT 25 min', 'Spinning 35 min', 'Circuito funcional 30 min'],
    macroImpact: {
      protein: 12,
      carbs: 24,
      fat: 26,
    },
  },
  {
    name: 'Bowl de pollo con arroz',
    calories: 620,
    alertTone: 'medium',
    alertTitle: 'Comida energetica',
    alertMessage:
      'Puede entrar en tu plan si el resto del dia se mantiene ligero y con buena hidratacion.',
    exerciseSuggestions: ['Caminata rapida 40 min', 'Bicicleta 30 min', 'Pierna y core 25 min'],
    macroImpact: {
      protein: 10,
      carbs: 16,
      fat: 8,
    },
  },
];

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function deriveMacroStatus(percent: number) {
  if (percent >= 60) return 'Alto';
  if (percent >= 40) return 'Medio';
  return 'Bajo';
}

function normalizeMacros(input: unknown): MacroProgress[] {
  if (!Array.isArray(input)) {
    return DEFAULT_MACROS.map((macro) => ({ ...macro }));
  }

  return DEFAULT_MACROS.map((macro) => {
    const found = input.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        (item as { key?: string }).key === macro.key,
    ) as Partial<MacroProgress> | undefined;

    const percent = typeof found?.percent === 'number' ? found.percent : macro.percent;

    return {
      ...macro,
      ...found,
      percent,
      status: deriveMacroStatus(percent),
    };
  });
}

function normalizeWeights(input: unknown): WeightEntry[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(
      (entry): entry is WeightEntry =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        typeof (entry as WeightEntry).date === 'string' &&
        typeof (entry as WeightEntry).value === 'number',
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeMeals(input: unknown): MealHistoryEntry[] {
  if (!Array.isArray(input)) return [];

  return input.filter(
    (entry): entry is MealHistoryEntry =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as MealHistoryEntry).id === 'string' &&
      typeof (entry as MealHistoryEntry).name === 'string' &&
      typeof (entry as MealHistoryEntry).calories === 'number',
  );
}

function normalizeTrackedMeals(input: unknown): Record<string, TrackedMealImpact> {
  if (!input || typeof input !== 'object') return {};

  return Object.entries(input as Record<string, unknown>).reduce<Record<string, TrackedMealImpact>>(
    (accumulator, [key, value]) => {
      if (
        value &&
        typeof value === 'object' &&
        typeof (value as TrackedMealImpact).calories === 'number' &&
        typeof (value as TrackedMealImpact).macroImpact === 'object'
      ) {
        accumulator[key] = value as TrackedMealImpact;
      }

      return accumulator;
    },
    {},
  );
}

function withNormalizedMacros(macros: MacroProgress[]) {
  return macros.map((macro) => ({
    ...macro,
    status: deriveMacroStatus(macro.percent),
  }));
}

async function persistDashboard(dashboard: CalorieDashboard) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard));
}

async function createInitialWeightEntry() {
  const user = (await authStore.getUser()) as { peso?: number } | null;
  if (typeof user?.peso !== 'number') {
    return [];
  }

  return [
    {
      date: formatLocalDate(),
      value: user.peso,
    },
  ];
}

export async function loadCalorieDashboard(): Promise<CalorieDashboard> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const storedPlan = await AsyncStorage.getItem(PLAN_KEY);
  const user = await authStore.getUser();

  let targetDaily = DEFAULT_DASHBOARD.dailyTarget;
  let targetMacros = DEFAULT_MACROS;

  if (user?.evaluacion_clinica) {
    targetDaily = user.evaluacion_clinica.calorias_diarias_calculadas;
    targetMacros = [
      {
        ...DEFAULT_MACROS[0], // protein
        percent: Number(user.evaluacion_clinica.distribucion_proteinas_pct || 0), 
      },
      {
        ...DEFAULT_MACROS[1], // carbs
        percent: Number(user.evaluacion_clinica.distribucion_carbohidratos_pct || 0), 
      },
      {
        ...DEFAULT_MACROS[2], // fat
        percent: Number(user.evaluacion_clinica.distribucion_grasas_pct || 0), 
      },
    ];
  }

  if (!raw) {
    const initialWeights = await createInitialWeightEntry();
    
    const created = {
      ...DEFAULT_DASHBOARD,
      dailyTarget: targetDaily,
      consumedCalories: 0, // Reset to 0 initially
      planActive: storedPlan !== 'false',
      macros: targetMacros,
      weightEntries: initialWeights,
    };
    await persistDashboard(created);
    return created;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CalorieDashboard>;
    const normalized: CalorieDashboard = {
      dailyTarget: user?.evaluacion_clinica ? targetDaily : (typeof parsed.dailyTarget === 'number' ? parsed.dailyTarget : DEFAULT_DASHBOARD.dailyTarget),
      consumedCalories:
        typeof parsed.consumedCalories === 'number'
          ? parsed.consumedCalories
          : 0,
      planActive:
        typeof parsed.planActive === 'boolean' ? parsed.planActive : storedPlan !== 'false',
      macros: user?.evaluacion_clinica ? targetMacros : normalizeMacros(parsed.macros),
      weightEntries: normalizeWeights(parsed.weightEntries),
      mealHistory: normalizeMeals(parsed.mealHistory),
      trackedMeals: normalizeTrackedMeals(parsed.trackedMeals),
    };

    if (normalized.weightEntries.length === 0) {
      normalized.weightEntries = await createInitialWeightEntry();
      await persistDashboard(normalized);
    }

    return normalized;
  } catch {
    const initialWeights = await createInitialWeightEntry();
    const fallback = {
      ...DEFAULT_DASHBOARD,
      dailyTarget: targetDaily,
      consumedCalories: 0,
      macros: targetMacros,
      weightEntries: initialWeights,
      planActive: storedPlan !== 'false',
    };
    await persistDashboard(fallback);
    return fallback;
  }
}

export async function saveDailyWeight(value: number): Promise<CalorieDashboard> {
  const dashboard = await loadCalorieDashboard();
  const today = formatLocalDate();
  const cleaned = dashboard.weightEntries.filter((entry) => entry.date !== today);
  const updated: CalorieDashboard = {
    ...dashboard,
    weightEntries: [{ date: today, value }, ...cleaned].sort((a, b) => b.date.localeCompare(a.date)),
  };
  await persistDashboard(updated);
  return updated;
}

export async function estimateMealFromPhoto(
  imageUri: string,
  descripcion_alimento?: string,
): Promise<FoodEstimate> {
  try {
    const looksLikeRemoteUrl = /^https?:\/\//i.test(imageUri);
    const response = looksLikeRemoteUrl
      ? await intakeImageService.analyzeImageUrl({ imagen_url: imageUri, descripcion_alimento })
      : await intakeImageService.analyzeLocalImage({ imageUri, descripcion_alimento });

    const estimation = response as any;
    const items = Array.isArray(estimation?.items) ? estimation.items : [];

    const firstName = typeof items?.[0]?.name === 'string' ? items[0].name : 'Comida detectada';

    const sumItems = items.reduce((acc: number, item: any) => {
      const value = typeof item?.calories === 'number' ? item.calories : 0;
      return acc + value;
    }, 0);

    const rawTotal =
      typeof estimation?.totalCalories === 'number'
        ? estimation.totalCalories
        : typeof estimation?.total_calories === 'number'
          ? estimation.total_calories
          : typeof estimation?.calorias_estimadas === 'number'
            ? estimation.calorias_estimadas
            : sumItems;

    const calories = Number.isFinite(rawTotal) ? Math.max(0, Math.round(rawTotal)) : 0;
    const alertTone: FoodEstimate['alertTone'] = calories >= 800 ? 'high' : 'medium';

    return {
      id:
        typeof estimation?.jobId === 'string' && estimation.jobId.trim().length > 0
          ? estimation.jobId
          : `${Date.now()}`,
      name:
        typeof estimation?.texto_detectado === 'string' && estimation.texto_detectado.trim().length > 0
          ? estimation.texto_detectado
          : firstName,
      calories,
      imageUri,
      alertTone,
      alertTitle: alertTone === 'high' ? 'Carga calorica alta' : 'Comida energetica',
      alertMessage: (() => {
        const apiMessage = typeof estimation?.mensaje === 'string' ? estimation.mensaje : undefined;
        if (apiMessage && apiMessage.trim().length > 0) return apiMessage;
        return alertTone === 'high'
          ? 'Si la registras, conviene compensarla con una sesion intensa o ajustar el resto del dia.'
          : 'Puede entrar en tu plan si el resto del dia se mantiene ligero y con buena hidratacion.';
      })(),
      exerciseSuggestions:
        alertTone === 'high'
          ? ['HIIT 25 min', 'Spinning 35 min', 'Circuito funcional 30 min']
          : ['Caminata rapida 40 min', 'Bicicleta 30 min', 'Pierna y core 25 min'],
      macroImpact: {
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[estimateMealFromPhoto] Fallo backend, usando fallback local:', error);

      const seed = imageUri.length % ESTIMATE_LIBRARY.length;
      const selected = ESTIMATE_LIBRARY[seed];
      await new Promise((resolve) => setTimeout(resolve, 700));

      return {
        ...selected,
        id: `${Date.now()}-${seed}`,
        imageUri,
      };
    }

    throw error;
  }
}

export async function confirmEstimatedMeal(estimate: FoodEstimate): Promise<CalorieDashboard> {
  const dashboard = await loadCalorieDashboard();

  const updatedMacros = withNormalizedMacros(
    dashboard.macros.map((macro) => ({
      ...macro,
      percent: Math.min(160, macro.percent + estimate.macroImpact[macro.key]),
    })),
  );

  const updated: CalorieDashboard = {
    ...dashboard,
    consumedCalories: dashboard.consumedCalories + estimate.calories,
    macros: updatedMacros,
    mealHistory: [
      {
        ...estimate,
        confirmedAt: new Date().toISOString(),
      },
      ...dashboard.mealHistory,
    ].slice(0, 6),
  };

  await persistDashboard(updated);
  return updated;
}

export async function setDailyCalorieTarget(target: number): Promise<CalorieDashboard> {
  const dashboard = await loadCalorieDashboard();
  const updated: CalorieDashboard = {
    ...dashboard,
    dailyTarget: Math.max(900, Math.round(target)),
  };
  await persistDashboard(updated);
  return updated;
}

export async function applyTrackedMeal(
  mealId: string,
  calories: number,
  macroImpact: Record<MacroKey, number>,
): Promise<CalorieDashboard> {
  const dashboard = await loadCalorieDashboard();

  if (dashboard.trackedMeals[mealId]) {
    return dashboard;
  }

  const updatedMacros = withNormalizedMacros(
    dashboard.macros.map((macro) => ({
      ...macro,
      percent: Math.min(160, macro.percent + (macroImpact[macro.key] ?? 0)),
    })),
  );

  const updated: CalorieDashboard = {
    ...dashboard,
    consumedCalories: dashboard.consumedCalories + calories,
    macros: updatedMacros,
    trackedMeals: {
      ...dashboard.trackedMeals,
      [mealId]: {
        calories,
        macroImpact,
      },
    },
  };

  await persistDashboard(updated);
  return updated;
}

export async function removeTrackedMeal(mealId: string): Promise<CalorieDashboard> {
  const dashboard = await loadCalorieDashboard();
  const trackedMeal = dashboard.trackedMeals[mealId];

  if (!trackedMeal) {
    return dashboard;
  }

  const nextTrackedMeals = { ...dashboard.trackedMeals };
  delete nextTrackedMeals[mealId];

  const updatedMacros = withNormalizedMacros(
    dashboard.macros.map((macro) => ({
      ...macro,
      percent: Math.max(0, macro.percent - (trackedMeal.macroImpact[macro.key] ?? 0)),
    })),
  );

  const updated: CalorieDashboard = {
    ...dashboard,
    consumedCalories: Math.max(0, dashboard.consumedCalories - trackedMeal.calories),
    macros: updatedMacros,
    trackedMeals: nextTrackedMeals,
  };

  await persistDashboard(updated);
  return updated;
}

export function getCalorieProgress(dashboard: CalorieDashboard) {
  return Math.max(0, Math.min(1, dashboard.consumedCalories / dashboard.dailyTarget));
}

export function getRemainingCalories(dashboard: CalorieDashboard) {
  return dashboard.dailyTarget - dashboard.consumedCalories;
}

export function getLatestWeight(dashboard: CalorieDashboard) {
  return dashboard.weightEntries[0] ?? null;
}

export function getWeightDelta(dashboard: CalorieDashboard) {
  if (dashboard.weightEntries.length < 2) return 0;
  return Number((dashboard.weightEntries[0].value - dashboard.weightEntries[1].value).toFixed(1));
}
