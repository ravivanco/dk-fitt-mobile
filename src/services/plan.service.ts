import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/services/api.client';
import { fetchActiveNutritionPlanPayload, fetchNutritionPlanWeeks, type NutritionPlanDayApi, type NutritionPlanMenuApi, type NutritionPlanWeekApi } from '@/services/nutrition-plan.service';
import {
  applyTrackedMeal,
  removeTrackedMeal,
  setDailyCalorieTarget,
} from '@/services/calorie.service';
import { fetchCalorieControlDashboard } from '@/services/calorie-control.service';
import { authStore } from '@/store/auth.store';

type MacroImpact = {
  protein: number;
  carbs: number;
  fat: number;
};

type ApiMealTrackingStatus = 'pendiente' | 'realizada' | 'no_realizada' | 'realizado' | 'completada' | 'saltada' | 'skip' | 'done';

export type TodayMealItem = {
  id: string;
  menuTrackingId: string;
  dishId?: string;
  slot: string;
  title: string;
  calories: number;
  emoji: string;
  status: 'done' | 'skip' | 'pending';
  statusLabel: string;
  summary?: string;
};

export type TodayMealPlan = {
  days: TodayMealDay[];
  selectedDayId: string;
  meals: TodayMealItem[];
  completedMeals: number;
  totalMeals: number;
  progressPct: number;
  summary: string[];
  updatedAt?: string;
};

export type TodayMealDay = {
  id: string;
  date?: string;
  label: string;
  shortLabel: string;
  meals: TodayMealItem[];
  completedMeals: number;
  totalMeals: number;
  progressPct: number;
  isBlocked?: boolean;
};

function overlayMealTrackingStatus(plan: TodayMealPlan, tracking: TodayMealPlan): TodayMealPlan {
  const labelForStatus = (status: TodayMealItem['status']) =>
    status === 'done' ? 'Realizada' : status === 'skip' ? 'No realizada' : 'Pendiente';

  const trackingMeals = tracking.days
    .flatMap((day) => day.meals)
    .filter((meal) => typeof meal.menuTrackingId !== 'undefined' && String(meal.menuTrackingId).trim().length > 0);

  const statusByTrackingId = trackingMeals.reduce<Record<string, TodayMealItem['status']>>((acc, meal) => {
      acc[String(meal.menuTrackingId)] = meal.status;
      return acc;
    }, {});

  if (__DEV__) {
    const keys = Object.keys(statusByTrackingId);
    console.log('[plan][overlay-tracking] map', {
      trackingKeys: keys.slice(0, 20),
      trackingCount: keys.length,
      sampleTracking: trackingMeals.slice(0, 3).map((m) => ({ id: m.id, menuTrackingId: m.menuTrackingId, status: m.status })),
      planSample: plan.meals.slice(0, 3).map((m) => ({ id: m.id, menuTrackingId: m.menuTrackingId, status: m.status })),
    });
  }

  const patchMeals = (meals: TodayMealItem[]) =>
    meals.map((meal) => {
      const trackingKey = String(meal.menuTrackingId);
      const nextStatus = statusByTrackingId[trackingKey];
      if (!nextStatus) {
        if (__DEV__) {
          // Solo loguear casos sospechosos donde el plan viene "pending" pero podrÃ­a tener tracking.
          if (trackingKey && meal.status !== 'pending' && statusByTrackingId[trackingKey] === undefined) {
            console.log('[plan][overlay-tracking] missing key', { trackingKey });
          }
        }
        return meal;
      }
      return nextStatus === meal.status ? meal : { ...meal, status: nextStatus, statusLabel: labelForStatus(nextStatus) };
    });

  const nextDays = plan.days.map((day) => {
    const nextMeals = patchMeals(day.meals);
    const completedMeals = nextMeals.filter((meal) => meal.status === 'done').length;
    const totalMeals = nextMeals.length;
    return {
      ...day,
      meals: nextMeals,
      completedMeals,
      totalMeals,
      progressPct: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
    };
  });

  const nextMeals = patchMeals(plan.meals);
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

function overlayMealTrackingStatusMap(plan: TodayMealPlan, statusByTrackingId: Record<string, TodayMealItem['status']>): TodayMealPlan {
  const labelForStatus = (status: TodayMealItem['status']) =>
    status === 'done' ? 'Realizada' : status === 'skip' ? 'No realizada' : 'Pendiente';

  const patchMeals = (meals: TodayMealItem[]) =>
    meals.map((meal) => {
      const trackingKey = String(meal.menuTrackingId);
      const nextStatus = statusByTrackingId[trackingKey];
      if (!nextStatus) return meal;
      return nextStatus === meal.status ? meal : { ...meal, status: nextStatus, statusLabel: labelForStatus(nextStatus) };
    });

  const nextDays = plan.days.map((day) => {
    const nextMeals = patchMeals(day.meals);
    const completedMeals = nextMeals.filter((meal) => meal.status === 'done').length;
    const totalMeals = nextMeals.length;
    return {
      ...day,
      meals: nextMeals,
      completedMeals,
      totalMeals,
      progressPct: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
    };
  });

  const nextMeals = patchMeals(plan.meals);
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

function getLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function coerceToLocalIsoDateString(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const raw = input.trim();
  if (!raw) return undefined;
  // Si viene en formato ISO con hora/zona (p.ej. "2026-05-25T00:00:00.000Z"),
  // NO lo convertimos a Date local porque puede correrse un dÃ­a por timezone.
  // En su lugar, tomamos el componente de fecha tal cual.
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return getLocalIsoDate(parsed);
}

function getWeekStartIsoMonday(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  const day = date.getDay(); // 0=DOM..6=SAB
  const diffToMonday = (day + 6) % 7; // lunes=0
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);
  return getLocalIsoDate(monday);
}

function getWeekEndIsoSunday(mondayIso: string) {
  const monday = new Date(`${mondayIso}T12:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return getLocalIsoDate(sunday);
}

function formatWeekdayLabelEs(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return { label: 'Día', shortLabel: 'DIA' };
  const label = normalizeText(date.toLocaleDateString('es-EC', { weekday: 'long' }));
  const pretty = label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : 'Día';
  const shortLabel = pretty.slice(0, 3).toUpperCase();
  return { label: pretty, shortLabel };
}

function fillMissingDaysWithWeekendBlocks(days: TodayMealDay[]) {
  const dated = days.filter((day) => typeof day.date === 'string' && day.date.length >= 10) as Array<TodayMealDay & { date: string }>;
  if (dated.length === 0) return days;

  const dates = dated.map((day) => day.date.slice(0, 10)).sort();
  const minIso = dates[0];
  const maxIso = dates[dates.length - 1];

  const start = new Date(`${minIso}T12:00:00`);
  const end = new Date(`${maxIso}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return days;

  const byIso = new Map<string, TodayMealDay>();
  for (const day of days) {
    const iso = typeof day.date === 'string' ? day.date.slice(0, 10) : '';
    if (iso) byIso.set(iso, day);
  }

  const result: TodayMealDay[] = [];
  for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor.setDate(cursor.getDate() + 1)) {
    const iso = getLocalIsoDate(cursor);
    const existing = byIso.get(iso);
    if (existing) {
      result.push(existing);
      continue;
    }

    const weekday = cursor.getDay(); // 0 dom, 6 sab
    const isWeekend = weekday === 0 || weekday === 6;
    const labelParts = formatWeekdayLabelEs(iso);

    result.push({
      id: `blocked-${iso}`,
      date: iso,
      label: labelParts.label,
      shortLabel: labelParts.shortLabel,
      meals: [],
      completedMeals: 0,
      totalMeals: 0,
      progressPct: 0,
      isBlocked: isWeekend,
    });
  }

  return ensureUniqueTodayMealDayIds(result);
}

async function fetchMealTrackingStatusMapFromDashboard(dateIso: string) {
  const dashboard = await fetchCalorieControlDashboard(dateIso);
  const map: Record<string, TodayMealItem['status']> = {};
  for (const meal of dashboard.meals ?? []) {
    const id = (meal as any)?.id_menu_diario ?? (meal as any)?.menuTrackingId ?? (meal as any)?.id;
    const trackingId = typeof id === 'undefined' ? '' : String(id);
    if (!trackingId) continue;
    const status = normalizeMealTrackingStatus(undefined, (meal as any)?.realizado, (meal as any)?.hora_registro);
    map[trackingId] = status;
  }
  return map;
}

async function fetchMealTrackingStatusMapForDates(dateIsos: string[]) {
  const uniqueDates = Array.from(
    new Set(
      dateIsos
        .filter((d) => typeof d === 'string' && d.length >= 10)
        .map((d) => d.slice(0, 10)),
    ),
  );

  const merged: Record<string, TodayMealItem['status']> = {};
  const results = await Promise.allSettled(uniqueDates.map((dateIso) => fetchMealTrackingStatusMapFromDashboard(dateIso)));
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    Object.assign(merged, result.value);
  }
  return merged;
}

type WeeklyMealMenuApi = {
  id_menu_diario?: number | string;
  id_tiempo_comida?: number | string;
  tiempo_comida?: string;
  id_plato?: number | string;
  nombre_plato?: string;
  calorias_aportadas?: number | string;
  estado?: string;
  realizado?: boolean;
  summary?: string;
  resumen?: string;
  emoji?: string;
  [key: string]: unknown;
};

type WeeklyMealDayApi = {
  id_dia_plan?: number | string;
  dia_semana?: string;
  fecha?: string;
  menus?: WeeklyMealMenuApi[];
  [key: string]: unknown;
};

type WeeklyMealWeekApi = {
  id_semana?: number | string;
  numero?: number | string;
  fecha_inicio_semana?: string;
  fecha_fin_semana?: string;
  dias?: WeeklyMealDayApi[];
  semanas?: WeeklyMealWeekApi[];
  [key: string]: unknown;
};

export type DishDetails = {
  id: string;
  title: string;
  calories: number;
  ingredients: string[];
  preparation: string[];
  recipe: string;
  emoji: string;
};

type MealSlot = 'Desayuno' | 'Media Manana' | 'Almuerzo' | 'Media Tarde' | 'Cena';

export type PlanMeal = {
  id: string;
  slot: MealSlot;
  title: string;
  calories: number;
  emoji: string;
  ingredients: string[];
  recipe: string;
  preparation: string[];
  macroImpact: MacroImpact;
};

export type MenuOption = {
  id: string;
  label: string;
  summary: string;
  totalCalories: number;
  meals: PlanMeal[];
};

export type ExercisePlan = {
  id: string;
  title: string;
  emoji: string;
  duration: string;
  series: string;
  repetitions: string;
  notes: string;
};

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type PlanDay = {
  key: DayKey;
  label: string;
  shortLabel: string;
  targetCalories: number;
  menuOptions: MenuOption[];
  selectedMenuId: string;
  selectedMenu: MenuOption;
  mealStatuses: Record<string, 'done' | 'skip' | null>;
  exercises: ExercisePlan[];
  exerciseStatuses: Record<string, 'done' | 'skip' | null>;
};

export type WeeklyPlan = {
  summary: string[];
  activeDayKey: DayKey;
  days: PlanDay[];
};

type PlanState = {
  selectedMenus: Partial<Record<DayKey, string>>;
  mealStatuses: Record<string, 'done' | 'skip'>;
  exerciseStatuses: Record<string, 'done' | 'skip'>;
};

type MealTemplate = {
  slot: MealSlot;
  title: string;
  calories: number;
  emoji: string;
  tags: string[];
  ingredients: string[];
  recipe: string;
  preparation: string[];
  macroImpact: MacroImpact;
};

const STORAGE_KEY = '@dk_fitt:weekly_plan_state';
const DAY_DEFS: Array<{ key: DayKey; label: string; shortLabel: string }> = [
  { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
  { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
  { key: 'wednesday', label: 'Miercoles', shortLabel: 'Mie' },
  { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
  { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
];

const MEAL_BANK: Record<MealSlot, MealTemplate[]> = {
  Desayuno: [
    {
      slot: 'Desayuno',
      title: 'Avena con yogur y frutos rojos',
      calories: 320,
      emoji: '🥣',
      tags: ['avena', 'yogur', 'fruta', 'ligero'],
      ingredients: ['Avena', 'Yogur natural', 'Frutos rojos', 'Chia'],
      recipe: 'Combina avena cocida con yogur y termina con frutos rojos y chia.',
      preparation: ['Cocina la avena 5 minutos.', 'Sirve con yogur.', 'Agrega frutos rojos y chia.'],
      macroImpact: { protein: 4, carbs: 8, fat: 3 },
    },
    {
      slot: 'Desayuno',
      title: 'Huevos revueltos con espinaca y pan integral',
      calories: 360,
      emoji: '🍳',
      tags: ['huevo', 'espinaca', 'pan', 'proteina'],
      ingredients: ['Huevos', 'Espinaca', 'Pan integral', 'Aceite de oliva'],
      recipe: 'Prepara huevos revueltos suaves y acompañalos con pan integral.',
      preparation: ['Saltea la espinaca.', 'Agrega huevo batido.', 'Sirve con pan integral tostado.'],
      macroImpact: { protein: 8, carbs: 6, fat: 5 },
    },
    {
      slot: 'Desayuno',
      title: 'Smoothie bowl de banana y avena',
      calories: 300,
      emoji: '🍌',
      tags: ['banana', 'avena', 'fruta'],
      ingredients: ['Banana', 'Avena', 'Leche vegetal', 'Mantequilla de mani'],
      recipe: 'Licua la fruta con avena y sirve en bowl con topping crujiente.',
      preparation: ['Licua todos los ingredientes.', 'Sirve frio.', 'Decora con semillas.'],
      macroImpact: { protein: 3, carbs: 9, fat: 3 },
    },
    {
      slot: 'Desayuno',
      title: 'Tostadas de pavo con aguacate',
      calories: 340,
      emoji: '🥪',
      tags: ['pavo', 'aguacate', 'pan', 'salado'],
      ingredients: ['Pan integral', 'Pavo', 'Aguacate', 'Tomate'],
      recipe: 'Arma tostadas nutritivas con pavo y aguacate laminado.',
      preparation: ['Tuesta el pan.', 'Agrega aguacate y pavo.', 'Finaliza con tomate.'],
      macroImpact: { protein: 7, carbs: 5, fat: 5 },
    },
    {
      slot: 'Desayuno',
      title: 'Quinoa dulce con manzana y canela',
      calories: 330,
      emoji: '🍎',
      tags: ['quinoa', 'manzana', 'sin lacteos'],
      ingredients: ['Quinoa cocida', 'Manzana', 'Canela', 'Almendras'],
      recipe: 'Usa quinoa como base dulce con fruta cocida y canela.',
      preparation: ['Cocina la quinoa.', 'Saltea manzana con canela.', 'Sirve con almendras.'],
      macroImpact: { protein: 4, carbs: 7, fat: 3 },
    },
  ],
  'Media Manana': [
    {
      slot: 'Media Manana',
      title: 'Yogur con nueces',
      calories: 160,
      emoji: '🥛',
      tags: ['yogur', 'snack', 'proteina'],
      ingredients: ['Yogur griego', 'Nueces', 'Canela'],
      recipe: 'Mezcla yogur con nueces para una colacion rapida.',
      preparation: ['Sirve el yogur.', 'Agrega nueces troceadas.', 'Espolvorea canela.'],
      macroImpact: { protein: 2, carbs: 1, fat: 2 },
    },
    {
      slot: 'Media Manana',
      title: 'Fruta fresca con semillas',
      calories: 150,
      emoji: '🍓',
      tags: ['fruta', 'ligero'],
      ingredients: ['Fruta de temporada', 'Semillas de girasol'],
      recipe: 'Colacion fresca para mantener energia estable.',
      preparation: ['Lava y corta la fruta.', 'Agrega semillas al final.'],
      macroImpact: { protein: 1, carbs: 3, fat: 1 },
    },
    {
      slot: 'Media Manana',
      title: 'Rollitos de pavo y pepino',
      calories: 170,
      emoji: '🥒',
      tags: ['pavo', 'salado', 'bajo en carbos'],
      ingredients: ['Pavo', 'Pepino', 'Queso crema ligero'],
      recipe: 'Rollitos faciles y altos en saciedad.',
      preparation: ['Unta queso crema.', 'Envuelve con pavo.', 'Sirve con pepino.'],
      macroImpact: { protein: 3, carbs: 1, fat: 1 },
    },
    {
      slot: 'Media Manana',
      title: 'Batido de proteina y cacao',
      calories: 180,
      emoji: '🥤',
      tags: ['proteina', 'cacao'],
      ingredients: ['Leche', 'Proteina', 'Cacao sin azucar'],
      recipe: 'Batido rapido para sostener masa muscular.',
      preparation: ['Licua todos los ingredientes.', 'Toma frio.'],
      macroImpact: { protein: 4, carbs: 1, fat: 1 },
    },
    {
      slot: 'Media Manana',
      title: 'Taza de frutas con queso fresco',
      calories: 175,
      emoji: '🍍',
      tags: ['fruta', 'queso'],
      ingredients: ['Pina', 'Manzana', 'Queso fresco'],
      recipe: 'Combina fruta con una porcion de queso fresco.',
      preparation: ['Corta la fruta.', 'Agrega cubos de queso.', 'Sirve frio.'],
      macroImpact: { protein: 2, carbs: 3, fat: 1 },
    },
  ],
  Almuerzo: [
    {
      slot: 'Almuerzo',
      title: 'Pollo a la plancha con quinoa y vegetales',
      calories: 480,
      emoji: '🍗',
      tags: ['pollo', 'quinoa', 'vegetales'],
      ingredients: ['Pollo', 'Quinoa', 'Brocoli', 'Zanahoria'],
      recipe: 'Plato balanceado alto en proteina y fibra.',
      preparation: ['Asa el pollo.', 'Cocina la quinoa.', 'Saltea vegetales.'],
      macroImpact: { protein: 8, carbs: 10, fat: 4 },
    },
    {
      slot: 'Almuerzo',
      title: 'Pescado al horno con batata y ensalada',
      calories: 460,
      emoji: '🐟',
      tags: ['pescado', 'batata', 'ensalada'],
      ingredients: ['Filete de pescado', 'Batata', 'Lechuga', 'Tomate'],
      recipe: 'Preparacion suave y digestiva, ideal para salud metabolica.',
      preparation: ['Hornea el pescado.', 'Asa la batata.', 'Sirve con ensalada fresca.'],
      macroImpact: { protein: 7, carbs: 9, fat: 3 },
    },
    {
      slot: 'Almuerzo',
      title: 'Bowl de res magra con arroz integral',
      calories: 510,
      emoji: '🥩',
      tags: ['res', 'arroz', 'fuerte'],
      ingredients: ['Res magra', 'Arroz integral', 'Pimientos', 'Cebolla'],
      recipe: 'Bowl completo para dias de mayor carga fisica.',
      preparation: ['Cocina la res.', 'Prepara arroz integral.', 'Saltea vegetales.'],
      macroImpact: { protein: 9, carbs: 11, fat: 4 },
    },
    {
      slot: 'Almuerzo',
      title: 'Pasta integral con pavo y vegetales',
      calories: 500,
      emoji: '🍝',
      tags: ['pasta', 'pavo', 'energia'],
      ingredients: ['Pasta integral', 'Pavo', 'Espinaca', 'Tomate'],
      recipe: 'Pasta moderada y rica en proteina para mantener adherencia.',
      preparation: ['Cocina pasta.', 'Saltea pavo.', 'Integra vegetales y tomate.'],
      macroImpact: { protein: 7, carbs: 12, fat: 3 },
    },
    {
      slot: 'Almuerzo',
      title: 'Ensalada tibia de legumbres con huevo',
      calories: 430,
      emoji: '🥗',
      tags: ['legumbres', 'huevo', 'fibra'],
      ingredients: ['Lentejas', 'Huevo', 'Espinaca', 'Pepino'],
      recipe: 'Opcion saciante, practica y amigable para control de apetito.',
      preparation: ['Cocina legumbres.', 'Hierve huevo.', 'Une con vegetales frescos.'],
      macroImpact: { protein: 6, carbs: 8, fat: 3 },
    },
  ],
  'Media Tarde': [
    {
      slot: 'Media Tarde',
      title: 'Galletas de avena con queso cottage',
      calories: 170,
      emoji: '🧀',
      tags: ['avena', 'queso'],
      ingredients: ['Galletas de avena', 'Queso cottage'],
      recipe: 'Snack sencillo para sostener energia y no llegar con hambre a la cena.',
      preparation: ['Sirve el queso.', 'Acompana con galletas de avena.'],
      macroImpact: { protein: 2, carbs: 2, fat: 1 },
    },
    {
      slot: 'Media Tarde',
      title: 'Hummus con bastones de zanahoria',
      calories: 160,
      emoji: '🥕',
      tags: ['hummus', 'vegetales'],
      ingredients: ['Hummus', 'Zanahoria', 'Pepino'],
      recipe: 'Colacion ligera con fibra y buena saciedad.',
      preparation: ['Sirve el hummus.', 'Corta vegetales en bastones.'],
      macroImpact: { protein: 1, carbs: 2, fat: 1 },
    },
    {
      slot: 'Media Tarde',
      title: 'Batido verde con proteina',
      calories: 180,
      emoji: '🥬',
      tags: ['verde', 'proteina'],
      ingredients: ['Espinaca', 'Proteina', 'Banana', 'Agua'],
      recipe: 'Batido funcional para dias de entrenamiento.',
      preparation: ['Licua todos los ingredientes.', 'Sirve frio.'],
      macroImpact: { protein: 3, carbs: 2, fat: 1 },
    },
    {
      slot: 'Media Tarde',
      title: 'Tostada ligera con aguacate',
      calories: 175,
      emoji: '🥑',
      tags: ['aguacate', 'pan'],
      ingredients: ['Pan integral', 'Aguacate', 'Limon'],
      recipe: 'Grasa saludable para mantener saciedad.',
      preparation: ['Tuesta el pan.', 'Tritura aguacate.', 'Agrega limon.'],
      macroImpact: { protein: 1, carbs: 2, fat: 2 },
    },
    {
      slot: 'Media Tarde',
      title: 'Fruta con mantequilla de mani',
      calories: 190,
      emoji: '🍏',
      tags: ['fruta', 'mani'],
      ingredients: ['Manzana', 'Mantequilla de mani'],
      recipe: 'Snack dulce controlado y muy facil de adherir.',
      preparation: ['Corta la fruta.', 'Sirve con una cucharada de mantequilla de mani.'],
      macroImpact: { protein: 1, carbs: 3, fat: 2 },
    },
  ],
  Cena: [
    {
      slot: 'Cena',
      title: 'Tortilla de vegetales con ensalada fresca',
      calories: 350,
      emoji: '🌮',
      tags: ['huevo', 'vegetales', 'ligera'],
      ingredients: ['Huevos', 'Espinaca', 'Pimiento', 'Lechuga'],
      recipe: 'Cena ligera para cerrar el dia sin pesadez.',
      preparation: ['Prepara la tortilla.', 'Sirve con ensalada fresca.'],
      macroImpact: { protein: 6, carbs: 3, fat: 3 },
    },
    {
      slot: 'Cena',
      title: 'Crema de vegetales con pavo',
      calories: 330,
      emoji: '🍲',
      tags: ['vegetales', 'pavo'],
      ingredients: ['Calabaza', 'Zanahoria', 'Pavo desmechado'],
      recipe: 'Cena suave para digestion y recuperacion.',
      preparation: ['Cocina vegetales.', 'Licua hasta obtener crema.', 'Agrega pavo al servir.'],
      macroImpact: { protein: 5, carbs: 4, fat: 2 },
    },
    {
      slot: 'Cena',
      title: 'Salmon con pure de coliflor',
      calories: 390,
      emoji: '🍽️',
      tags: ['salmon', 'coliflor'],
      ingredients: ['Salmon', 'Coliflor', 'Ajo', 'Aceite de oliva'],
      recipe: 'Cena rica en omega 3 y proteina de alta calidad.',
      preparation: ['Cocina salmon a la plancha.', 'Haz pure con coliflor.', 'Sirve caliente.'],
      macroImpact: { protein: 7, carbs: 3, fat: 4 },
    },
    {
      slot: 'Cena',
      title: 'Bowl templado de pollo y verduras',
      calories: 360,
      emoji: '🍛',
      tags: ['pollo', 'verduras'],
      ingredients: ['Pollo', 'Zucchini', 'Brocoli', 'Hongos'],
      recipe: 'Opcion completa para dias de hambre moderada.',
      preparation: ['Dora el pollo.', 'Saltea las verduras.', 'Une y sirve.'],
      macroImpact: { protein: 6, carbs: 4, fat: 3 },
    },
    {
      slot: 'Cena',
      title: 'Wrap integral de atun y vegetales',
      calories: 340,
      emoji: '🌯',
      tags: ['atun', 'wrap', 'practico'],
      ingredients: ['Wrap integral', 'Atun', 'Lechuga', 'Pepino'],
      recipe: 'Cena practica para dias de poca disponibilidad.',
      preparation: ['Mezcla el atun.', 'Rellena el wrap.', 'Sirve con vegetales frescos.'],
      macroImpact: { protein: 6, carbs: 5, fat: 2 },
    },
  ],
};

const SPORT_WORKOUTS: Record<string, ExercisePlan[]> = {
  gimnasio: [
    { id: 'gym-1', title: 'Tren inferior + core', emoji: '🏋️', duration: '45 min', series: '4 series', repetitions: '12 repeticiones', notes: 'Enfocate en sentadilla, desplantes y plancha.' },
    { id: 'gym-2', title: 'Espalda y pecho', emoji: '💪', duration: '50 min', series: '4 series', repetitions: '10 repeticiones', notes: 'Mantiene postura, fuerza y gasto calorico.' },
    { id: 'gym-3', title: 'HIIT en cinta', emoji: '🔥', duration: '25 min', series: '10 bloques', repetitions: '40 seg trabajo', notes: 'Ideal si hay alta carga calorica en el dia.' },
    { id: 'gym-4', title: 'Hombro y brazos', emoji: '🏋️', duration: '40 min', series: '3 series', repetitions: '12 repeticiones', notes: 'Prioriza buena tecnica y descanso corto.' },
    { id: 'gym-5', title: 'Full body metabolico', emoji: '⚡', duration: '45 min', series: '5 rondas', repetitions: '8 estaciones', notes: 'Cierra la semana elevando gasto energetico.' },
  ],
  running: [
    { id: 'run-1', title: 'Rodaje suave', emoji: '🏃', duration: '35 min', series: '1 bloque', repetitions: 'Ritmo continuo', notes: 'Activa la semana sin fatiga excesiva.' },
    { id: 'run-2', title: 'Intervalos cortos', emoji: '⏱️', duration: '30 min', series: '8 series', repetitions: '1 min rapido / 1 min suave', notes: 'Mejora capacidad cardiovascular.' },
    { id: 'run-3', title: 'Trabajo de tecnica', emoji: '👟', duration: '25 min', series: '6 drills', repetitions: '30 seg por drill', notes: 'Incluye skipping y talones al gluteo.' },
    { id: 'run-4', title: 'Tempo run', emoji: '🌬️', duration: '30 min', series: '1 bloque', repetitions: '15 min ritmo medio-alto', notes: 'Controla respiracion y zancada.' },
    { id: 'run-5', title: 'Fondo moderado', emoji: '🏞️', duration: '45 min', series: '1 bloque', repetitions: 'Ritmo estable', notes: 'Ideal para cerrar la semana con volumen.' },
  ],
  caminata: [
    { id: 'walk-1', title: 'Caminata activa', emoji: '🚶', duration: '40 min', series: '1 bloque', repetitions: 'Ritmo vivo', notes: 'Mantiene gasto energetico sin sobrecargar articulaciones.' },
    { id: 'walk-2', title: 'Subidas suaves', emoji: '⛰️', duration: '30 min', series: '6 repeticiones', repetitions: '2 min subida', notes: 'Usa inclinacion o colina ligera.' },
    { id: 'walk-3', title: 'Movilidad + paseo', emoji: '🧘', duration: '35 min', series: '3 bloques', repetitions: '10 min + movilidad', notes: 'Muy util en dias de alta rigidez.' },
    { id: 'walk-4', title: 'Caminata larga', emoji: '🌤️', duration: '50 min', series: '1 bloque', repetitions: 'Ritmo estable', notes: 'Favorece recuperacion y control glucemico.' },
    { id: 'walk-5', title: 'Paso variable', emoji: '👣', duration: '35 min', series: '5 bloques', repetitions: '3 min normal / 2 min rapido', notes: 'Cierra la semana con variacion de intensidad.' },
  ],
  ciclismo: [
    { id: 'bike-1', title: 'Rodaje base', emoji: '🚴', duration: '45 min', series: '1 bloque', repetitions: 'Cadencia estable', notes: 'Prioriza ritmo aeróbico.' },
    { id: 'bike-2', title: 'Series de velocidad', emoji: '⚙️', duration: '35 min', series: '8 series', repetitions: '45 seg fuerte', notes: 'Sube gasto calorico sin perder tecnica.' },
    { id: 'bike-3', title: 'Recuperacion activa', emoji: '🌿', duration: '30 min', series: '1 bloque', repetitions: 'Muy suave', notes: 'Enfocada en recuperacion.' },
    { id: 'bike-4', title: 'Trabajo de cuestas', emoji: '🛣️', duration: '40 min', series: '5 series', repetitions: '3 min subida', notes: 'Desarrolla potencia y resistencia.' },
    { id: 'bike-5', title: 'Ruta media', emoji: '🏁', duration: '60 min', series: '1 bloque', repetitions: 'Ritmo estable', notes: 'Ideal para viernes o cierre semanal.' },
  ],
  futbol: [
    { id: 'soc-1', title: 'Tecnica + pases', emoji: '⚽', duration: '40 min', series: '5 bloques', repetitions: '6 min por bloque', notes: 'Control, pase y movilidad lateral.' },
    { id: 'soc-2', title: 'Sprints cortos', emoji: '🏃', duration: '25 min', series: '10 series', repetitions: '20 m', notes: 'Mantiene explosividad.' },
    { id: 'soc-3', title: 'Core y estabilidad', emoji: '🛡️', duration: '20 min', series: '4 series', repetitions: '30 seg por ejercicio', notes: 'Reduce riesgo de lesion.' },
    { id: 'soc-4', title: 'Cambios de direccion', emoji: '↔️', duration: '30 min', series: '6 series', repetitions: '5 conos', notes: 'Muy util para agilidad.' },
    { id: 'soc-5', title: 'Partido condicionado', emoji: '🥅', duration: '45 min', series: '3 tiempos', repetitions: '12 min', notes: 'Aplica tecnica en contexto real.' },
  ],
  basquet: [
    { id: 'bas-1', title: 'Fundamentos y tiros', emoji: '🏀', duration: '40 min', series: '6 bloques', repetitions: '8 tiros por punto', notes: 'Combina manejo y tiro.' },
    { id: 'bas-2', title: 'Pliometria ligera', emoji: '⬆️', duration: '25 min', series: '4 series', repetitions: '10 saltos', notes: 'Mejora respuesta y potencia.' },
    { id: 'bas-3', title: 'Defensa lateral', emoji: '🛡️', duration: '20 min', series: '5 series', repetitions: '30 seg', notes: 'Enfasis en desplazamiento lateral.' },
    { id: 'bas-4', title: 'Circuito de cancha', emoji: '🏃', duration: '30 min', series: '6 series', repetitions: 'Ida y vuelta', notes: 'Sube resistencia especifica.' },
    { id: 'bas-5', title: 'Juego controlado', emoji: '🎯', duration: '45 min', series: '4 bloques', repetitions: '8 min', notes: 'Integra lectura y toma de decisiones.' },
  ],
  natacion: [
    { id: 'swim-1', title: 'Tecnica respiratoria', emoji: '🏊', duration: '35 min', series: '6 series', repetitions: '50 m', notes: 'Enfasis en control y eficiencia.' },
    { id: 'swim-2', title: 'Series moderadas', emoji: '🌊', duration: '40 min', series: '8 series', repetitions: '50 m', notes: 'Mejora capacidad cardiovascular.' },
    { id: 'swim-3', title: 'Patada y tabla', emoji: '🦵', duration: '25 min', series: '6 series', repetitions: '25 m', notes: 'Fortalece tren inferior.' },
    { id: 'swim-4', title: 'Nado continuo', emoji: '💧', duration: '30 min', series: '1 bloque', repetitions: 'Ritmo medio', notes: 'Buena sesion de control tecnico.' },
    { id: 'swim-5', title: 'Mixto por estilos', emoji: '🏁', duration: '40 min', series: '4 bloques', repetitions: '100 m', notes: 'Variedad para cerrar la semana.' },
  ],
  entrenamiento_casa: [
    { id: 'home-1', title: 'Full body sin equipo', emoji: '🏠', duration: '30 min', series: '4 rondas', repetitions: '40 seg por ejercicio', notes: 'Sentadilla, push-up, puente y plancha.' },
    { id: 'home-2', title: 'Core y movilidad', emoji: '🧘', duration: '20 min', series: '3 rondas', repetitions: '30 seg', notes: 'Ideal para complementar otros dias.' },
    { id: 'home-3', title: 'Circuito cardio', emoji: '🔥', duration: '25 min', series: '5 rondas', repetitions: '5 ejercicios', notes: 'Saltos bajos, mountain climbers y sentadillas.' },
    { id: 'home-4', title: 'Pierna y gluteo', emoji: '🦵', duration: '30 min', series: '4 series', repetitions: '15 repeticiones', notes: 'Controla tecnica y respiracion.' },
    { id: 'home-5', title: 'Tren superior', emoji: '💪', duration: '25 min', series: '4 series', repetitions: '12 repeticiones', notes: 'Usa mochila o banda si tienes.' },
  ],
  ninguno: [
    { id: 'none-1', title: 'Movilidad general', emoji: '🧘', duration: '15 min', series: '1 bloque', repetitions: 'Rutina guiada', notes: 'Excelente para empezar a construir habito.' },
    { id: 'none-2', title: 'Caminata consciente', emoji: '🚶', duration: '25 min', series: '1 bloque', repetitions: 'Ritmo suave', notes: 'Manten la respiracion comoda.' },
    { id: 'none-3', title: 'Activacion suave', emoji: '🌿', duration: '12 min', series: '2 rondas', repetitions: '8 movimientos', notes: 'Previene sedentarismo prolongado.' },
    { id: 'none-4', title: 'Estiramiento guiado', emoji: '🤸', duration: '15 min', series: '1 bloque', repetitions: '20 seg por zona', notes: 'Ideal al final del dia.' },
    { id: 'none-5', title: 'Mini circuito basico', emoji: '⚡', duration: '18 min', series: '3 rondas', repetitions: '20 seg por ejercicio', notes: 'Para ganar confianza antes de progresar.' },
  ],
};

const DEFAULT_STATE: PlanState = {
  selectedMenus: {},
  mealStatuses: {},
  exerciseStatuses: {},
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function getFirstObject(value: unknown, keys: string[]): Record<string, unknown> | null {
  const objectValue = asObject(value);
  if (!objectValue) return null;

  for (const key of keys) {
    const nested = objectValue[key];
    const nestedObject = asObject(nested);
    if (nestedObject) return nestedObject;
  }

  return objectValue;
}

function getArrayCandidate(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const objectValue = asObject(value);
  if (!objectValue) return [];

  for (const key of keys) {
    const nested = objectValue[key];
    if (Array.isArray(nested)) return nested;
  }

  return [];
}

function collectArraysDeep(value: unknown, seen = new WeakSet<object>()): unknown[][] {
  if (Array.isArray(value)) {
    return [value, ...value.flatMap((item) => collectArraysDeep(item, seen))];
  }

  const objectValue = asObject(value);
  if (!objectValue) return [];

  if (seen.has(objectValue)) return [];
  seen.add(objectValue);

  const nestedArrays: unknown[][] = [];
  Object.values(objectValue).forEach((nested) => {
    if (Array.isArray(nested)) {
      nestedArrays.push(nested);
      nestedArrays.push(...nested.flatMap((item) => collectArraysDeep(item, seen)));
    } else if (nested && typeof nested === 'object') {
      nestedArrays.push(...collectArraysDeep(nested, seen));
    }
  });

  return nestedArrays;
}

function isMealLikeObject(value: unknown): value is Record<string, unknown> {
  const record = asObject(value);
  if (!record) return false;

  const keyNames = Object.keys(record).map(normalizeText);
  return (
    keyNames.some((key) => ['comida', 'slot', 'title', 'nombre', 'caloria', 'calories', 'estado', 'realizado', 'plato', 'menu'].some((hint) => key.includes(hint))) ||
    typeof record.id_menu_diario !== 'undefined' ||
    typeof record.id_plato !== 'undefined' ||
    typeof record.realizado !== 'undefined'
  );
}

function pickBestMealArray(input: unknown): unknown[] {
  const candidates: unknown[][] = [];

  const direct = asObject(input);
  if (Array.isArray(input)) {
    candidates.push(input);
  }

  if (direct) {
    ['data', 'result', 'payload', 'meals', 'comidas', 'items', 'menus', 'menu_diario', 'platos', 'seguimiento_comidas', 'tracking', 'records'].forEach((key) => {
      const nested = direct[key];
      if (Array.isArray(nested)) {
        candidates.push(nested);
      }
    });
  }

  candidates.push(...collectArraysDeep(input));

  const scored = candidates
    .filter((candidate) => candidate.length > 0)
    .map((candidate) => {
      const objects = candidate.filter(isMealLikeObject).length;
      const withStatus = candidate.filter((item) => {
        const record = asObject(item);
        return Boolean(record && (record.estado || record.status || typeof record.realizado !== 'undefined'));
      }).length;
      const withCalories = candidate.filter((item) => {
        const record = asObject(item);
        return Boolean(record && (typeof record.calorias !== 'undefined' || typeof record.calories !== 'undefined' || typeof record.kcal !== 'undefined'));
      }).length;

      return {
        candidate,
        score: objects * 4 + withStatus * 3 + withCalories * 2 + candidate.length,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.candidate ?? [];
}

function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeMealTrackingStatus(
  rawStatus: unknown,
  realizedFlag?: unknown,
  registeredTime?: unknown,
): TodayMealItem['status'] {
  const hasRegisteredTime = typeof registeredTime === 'string' && registeredTime.trim().length > 0;

  // Regla de negocio del tracking:
  // - `realizado === true` => hecho (✓)
  // - `realizado === false` + `hora_registro` => marcado como no realizado (✗)
  // - `realizado === false` + sin `hora_registro` => aÃºn pendiente (no marcado)
  if (typeof realizedFlag === 'boolean') {
    if (realizedFlag) return 'done';
    return hasRegisteredTime ? 'skip' : 'pending';
  }

  const status = normalizeText(typeof rawStatus === 'string' ? rawStatus : '');
  if (!status) return hasRegisteredTime ? 'skip' : 'pending';
  if (status.includes('pend')) return 'pending';
  if (status.includes('no_real') || status.includes('no real') || status.includes('salt') || status.includes('skip')) return 'skip';
  if (status.includes('realiz') || status.includes('real') || status.includes('compl') || status === 'done') return 'done';
  return hasRegisteredTime ? 'skip' : 'pending';
}

function slotFromMealLabel(value: unknown, fallbackIndex = 0): string {
  const normalized = normalizeText(toText(value));
  if (normalized.includes('desay')) return 'Desayuno';
  if (normalized.includes('media manana') || normalized.includes('media mañana')) return 'Media Mañana';
  if (normalized.includes('almuer')) return 'Almuerzo';
  if (normalized.includes('media tarde')) return 'Media Tarde';
  if (normalized.includes('cena')) return 'Cena';

  const slotMap = ['Desayuno', 'Media Mañana', 'Almuerzo', 'Media Tarde', 'Cena'];
  return slotMap[fallbackIndex] ?? 'Comida';
}

function emojiForSlot(slot: string): string {
  const normalized = normalizeText(slot);
  if (normalized.includes('desay')) return '🍳';
  if (normalized.includes('media manana') || normalized.includes('media mañana')) return '🥛';
  if (normalized.includes('almuer')) return '🍽️';
  if (normalized.includes('media tarde')) return '🍏';
  if (normalized.includes('cena')) return '🌙';
  return '🍽️';
}

function normalizeArrayOfStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return [];
    // Permitir que el backend envíe la preparación como string único o multilinea.
    const lines = trimmed
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean);

    const splitByPunctuation = (text: string) =>
      text
        .split(/(?:;\s+)|(?<=[a-zÃ¡Ã©Ã­Ã³ÃºÃ±])\.\s+/gi)
        .map((part) => part.trim())
        .filter(Boolean);

    const numbered = lines.flatMap((line) => {
      const matches = [...line.matchAll(/(?:^|\s)(\d+)\.\s*([^]+?)(?=(?:\s+\d+\.\s*)|$)/g)];
      if (matches.length === 0) return [line];
      return matches.map((m) => `${m[1]}. ${m[2]}`.trim()).filter(Boolean);
    });

    const parts = numbered.length > 1
      ? numbered
      : splitByPunctuation(numbered[0] ?? trimmed);

    return parts.length > 0 ? parts : [trimmed];
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return toText(record.nombre ?? record.name ?? record.title ?? record.descripcion ?? record.descripcion_paso ?? record.instruction ?? record.step);
      }
      return '';
    })
    .filter(Boolean);
}

function normalizeTodayMealItem(item: unknown, index: number): TodayMealItem {
  const record = asObject(item) ?? {};
  const menuTrackingId = toText(
    record.id_menu_diario ?? record.idSeguimiento ?? record.id_seguimiento_comida ?? record.id_tracking ?? record.id ?? record.meal_tracking_id,
    `meal-${index + 1}`,
  );
  const dishId = toText(record.id_plato ?? record.idPlato ?? record.dish_id ?? record.plato_id ?? record.id_dish, '');
  const slot = slotFromMealLabel(record.slot ?? record.comida ?? record.nombre_comida ?? record.meal_slot ?? record.turno, index);
  const title = toText(record.nombre_plato ?? record.nombre ?? record.title ?? record.plato ?? record.meal_name, slot);
  const calories = toNumber(record.calorias ?? record.calories ?? record.kcal ?? record.total_calories ?? record.valor_calorias, 0);
  const status = normalizeMealTrackingStatus(
    record.estado ?? record.status ?? record.realizado ?? record.completed,
    record.realizado,
    record.hora_registro ?? record.horaRegistro ?? record.registered_time,
  );
  const summary = toText(record.resumen ?? record.summary ?? record.descripcion ?? record.descripcion_corta, '');

  return {
    id: menuTrackingId,
    menuTrackingId,
    dishId: dishId || undefined,
    slot,
    title,
    calories: Math.max(0, Math.round(calories)),
    emoji: toText(record.emoji, emojiForSlot(slot)),
    status,
    statusLabel: status === 'done' ? 'Realizada' : status === 'skip' ? 'No realizada' : 'Pendiente',
    summary: summary || undefined,
  };
}

function normalizeTodayMealFromMenu(menu: WeeklyMealMenuApi, index: number): TodayMealItem {
  const nestedDish = (menu as any)?.plato ?? (menu as any)?.dish ?? (menu as any)?.plato_detalle ?? undefined;
  const slotLabel = (menu as any)?.nombre_tiempo ?? (menu as any)?.tiempo_comida ?? (menu as any)?.slot;
  const slot = slotFromMealLabel(slotLabel, index);
  const calories = toNumber(menu.calorias_aportadas, 0);
  const menuTrackingId = toText((menu as any)?.menuTrackingId ?? menu.id_menu_diario ?? (menu as any)?.id_menu, `meal-${index + 1}`);
  const dishId = toText(
    (menu as any)?.dishId ??
      (menu as any)?.id_plato ??
      (menu as any)?.idPlato ??
      (menu as any)?.dish_id ??
      (menu as any)?.id_dish ??
      nestedDish?.id_plato ??
      nestedDish?.id ??
      (nestedDish as any)?.dishId ??
      (nestedDish as any)?.idPlato,
    '',
  );

  if (__DEV__ && (!dishId || menuTrackingId.startsWith('meal-'))) {
    console.log('[plan][today][menu] suspicious ids', {
      index,
      slotLabel,
      menuTrackingId,
      dishId,
      raw: {
        id_menu_diario: (menu as any)?.id_menu_diario,
        menuTrackingId: (menu as any)?.menuTrackingId,
        id_plato: (menu as any)?.id_plato,
        dishId: (menu as any)?.dishId,
        idPlato: (menu as any)?.idPlato,
        dish_id: (menu as any)?.dish_id,
        nombre_tiempo: (menu as any)?.nombre_tiempo,
      },
    });
  }

  const status = normalizeMealTrackingStatus(
    (menu as any).estado ?? undefined,
    (menu as any).realizado,
    (menu as any).hora_registro ?? (menu as any).horaRegistro ?? (menu as any).registered_time,
  );

  return {
    id: menuTrackingId,
    menuTrackingId,
    dishId: dishId || undefined,
    slot,
    title: toText(menu.nombre_plato ?? nestedDish?.nombre_plato ?? nestedDish?.nombre ?? (menu as any)?.title, slot),
    calories: Math.max(0, Math.round(calories)),
    emoji: toText(menu.emoji, emojiForSlot(slot)),
    status,
    statusLabel: status === 'done' ? 'Realizada' : status === 'skip' ? 'No realizada' : 'Pendiente',
    summary: toText(menu.resumen ?? menu.summary, '') || undefined,
  };
}

function normalizeMealDayLabel(day: WeeklyMealDayApi, fallbackIndex: number) {
  const label = toText(day.dia_semana, '');
  const shortLabel = label
    ? label.slice(0, 3).toUpperCase()
    : ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'][fallbackIndex] ?? 'DIA';

  return {
    label: label || `Día ${fallbackIndex + 1}`,
    shortLabel,
  };
}

function normalizeMealDayId(day: WeeklyMealDayApi, fallbackIndex: number) {
  return toText(
    // Preferimos `fecha` real del dÃ­a del plan. En algunos payloads el dÃ­a viene anidado como `dia`.
    (day as any)?.dia?.fecha ?? day.fecha ?? day.dia_semana ?? day.id_dia_plan ?? (day as any).id ?? '',
    `day-${fallbackIndex + 1}`,
  );
}

function buildTodayMealDay(day: WeeklyMealDayApi, index: number): TodayMealDay {
  const rawMenus =
    Array.isArray(day.menus) ? day.menus
      : Array.isArray((day as any).comidas) ? (day as any).comidas
        : Array.isArray((day as any).meals) ? (day as any).meals
          : [];
  const meals = sortMealsBySlot(rawMenus.map((menu: any, mealIndex: number) => normalizeTodayMealFromMenu(menu, mealIndex)));
  const completedMeals = meals.filter((meal) => meal.status === 'done').length;
  const totalMeals = meals.length;
  const labelParts = normalizeMealDayLabel(day, index);

  return {
    id: normalizeMealDayId(day, index),
    date: coerceToLocalIsoDateString((day as any).fecha),
    label: labelParts.label,
    shortLabel: labelParts.shortLabel,
    meals,
    completedMeals,
    totalMeals,
    progressPct: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
  };
}

function ensureUniqueTodayMealDayIds(days: TodayMealDay[]): TodayMealDay[] {
  const seen = new Map<string, number>();
  let hadDuplicates = false;

  const next = days.map((day) => {
    const base = `${day.id}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (count === 0) return day;

    hadDuplicates = true;
    return {
      ...day,
      id: `${base}#${count + 1}`,
    };
  });

  if (__DEV__ && hadDuplicates) {
    const duplicates = Array.from(seen.entries()).filter(([, count]) => count > 1);
    console.warn('[plan][today] duplicated day ids detected; normalized with suffix', duplicates.slice(0, 10));
  }

  return next;
}

function collectTodayMealDays(input: unknown): TodayMealDay[] {
  const root = asObject(input) ?? {};

  // El backend envuelve respuestas en `data` y a veces vuelve a envolver dentro de `data.data`.
  let payload: any = root;
  for (let depth = 0; depth < 3; depth += 1) {
    const next = asObject(payload?.data);
    if (!next) break;
    payload = next;
  }
  // Si aÃºn hay una forma `{ success, data: { ... } }`, el loop anterior ya la redujo,
  // pero si viene como `{ data: { success, data: { ... } } }` necesitamos un unwrap adicional.
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    payload = asObject((payload as any).data) ?? payload;
  }

  if (__DEV__) {
    const keys = payload && typeof payload === 'object' ? Object.keys(payload) : [];
    console.log('[plan][today] payload keys', keys.slice(0, 30));
  }

  const directDays: unknown[] = Array.isArray(payload.dias) ? (payload.dias as unknown[]) : [];
  if (directDays.length > 0) {
    return ensureUniqueTodayMealDayIds(directDays
      .filter((day): day is WeeklyMealDayApi => Boolean(day) && typeof day === 'object')
      .map((day, index) => buildTodayMealDay(day, index)));
  }

  const weeks: unknown[] = Array.isArray(payload.semanas)
    ? (payload.semanas as unknown[])
    : Array.isArray(payload.weeks)
      ? (payload.weeks as unknown[])
      : Array.isArray(payload.data)
        ? (payload.data as unknown[])
        : [];

  const allDays: WeeklyMealDayApi[] = weeks
    .filter((week): week is WeeklyMealWeekApi => Boolean(week) && typeof week === 'object')
    .flatMap((week) => (Array.isArray(week.dias) ? week.dias : []).filter((day): day is WeeklyMealDayApi => Boolean(day) && typeof day === 'object'));

  return ensureUniqueTodayMealDayIds(allDays.map((day, index) => buildTodayMealDay(day, index)));
}

function pickActiveTodayMealDay(days: TodayMealDay[]) {
  if (days.length === 0) return null;

  const todayIso = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const todayWeekday = normalizeText(new Date().toLocaleDateString('es-ES', { weekday: 'long' }));

  const byExactDate = days.find((day) => day.date === todayIso);
  if (byExactDate) return byExactDate;

  const withDate = days.filter((day) => typeof day.date === 'string' && day.date.length >= 10);
  if (withDate.length > 0) {
    const today = new Date(`${todayIso}T12:00:00`);
    const sorted = [...withDate].sort((a, b) => {
      const timeA = new Date(`${a.date}T12:00:00`).getTime();
      const timeB = new Date(`${b.date}T12:00:00`).getTime();
      const diffA = Math.abs(timeA - today.getTime());
      const diffB = Math.abs(timeB - today.getTime());
      return diffA - diffB;
    });
    return sorted[0] ?? days[0];
  }

  return (
    days.find((day) => day.date === todayIso || normalizeText(day.label) === todayWeekday || normalizeText(day.shortLabel) === todayWeekday.slice(0, 3))
    ?? days[0]
  );
}

function statusToRealizado(status: 'done' | 'skip'): boolean {
  return status === 'done';
}

function sortMealsBySlot(items: TodayMealItem[]) {
  const order = ['desayuno', 'media manana', 'media mañana', 'almuerzo', 'media tarde', 'cena'];
  return [...items].sort((a, b) => {
    const indexA = order.findIndex((slot) => normalizeText(a.slot).includes(slot));
    const indexB = order.findIndex((slot) => normalizeText(b.slot).includes(slot));
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });
}

function extractDishDetails(input: unknown, dishId: string): DishDetails {
  const source = getFirstObject(input, ['plato', 'data', 'result', 'payload']) ?? asObject(input) ?? {};
  const ingredients = (() => {
    const raw = source.ingredientes ?? source.ingredients ?? source.alimentos ?? source.insumos;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
      return raw
        .map((item: any) => {
          const name = toText(item?.nombre_alimento ?? item?.nombre ?? item?.name ?? item?.alimento, '');
          const grams = toNumber(item?.gramos ?? item?.cantidad_g ?? item?.cantidad ?? item?.g, NaN);
          const kcal = toNumber(item?.calorias ?? item?.kcal ?? item?.calories, NaN);
          const parts = [
            name,
            Number.isFinite(grams) ? `${Math.round(grams)} g` : '',
            Number.isFinite(kcal) ? `${Math.round(kcal)} kcal` : '',
          ].filter(Boolean);
          return parts.join(' · ');
        })
        .filter((line: string) => line.trim().length > 0);
    }
    return normalizeArrayOfStrings(raw);
  })();
  const preparation = normalizeArrayOfStrings(
    source.pasos_preparacion ??
      source.modo_preparacion ??
      source.preparation ??
      source.preparacion ??
      source.instructions ??
      source.steps,
  );
  const calories = toNumber(source.calorias ?? source.calories ?? source.kcal ?? source.total_calories, 0);
  const title = toText(source.nombre_plato ?? source.nombre ?? source.title ?? source.plato, `Plato ${dishId}`);
  const recipe = toText(source.descripcion_plato ?? source.receta ?? source.recipe ?? source.descripcion ?? source.summary, '');
  const emoji = toText(source.emoji, '🍽️');

  return {
    id: dishId,
    title,
    calories: Math.max(0, Math.round(calories)),
    ingredients,
    preparation,
    recipe,
    emoji,
  };
}

async function loadPlanState(): Promise<PlanState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<PlanState>;
    return {
      selectedMenus: parsed.selectedMenus ?? {},
      mealStatuses: parsed.mealStatuses ?? {},
      exerciseStatuses: parsed.exerciseStatuses ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

async function savePlanState(state: PlanState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayDayKey(): DayKey {
  const day = new Date().getDay();
  switch (day) {
    case 1:
      return 'monday';
    case 2:
      return 'tuesday';
    case 3:
      return 'wednesday';
    case 4:
      return 'thursday';
    case 5:
      return 'friday';
    case 6:
      return 'friday';
    case 0:
      return 'friday';
    default:
      return 'monday';
  }
}

function scoreTemplate(template: MealTemplate, preferredTokens: string[], avoidTokens: string[]) {
  let score = 0;

  preferredTokens.forEach((token) => {
    if (template.tags.some((tag) => normalizeText(tag).includes(token))) {
      score += 3;
    }
  });

  avoidTokens.forEach((token) => {
    if (template.tags.some((tag) => normalizeText(tag).includes(token)) || normalizeText(template.title).includes(token)) {
      score -= 10;
    }
  });

  return score;
}

function getUserSignals(user: any) {
  const onboarding = user?.onboarding ?? {};
  const preferredFoods = Array.isArray(onboarding.alimentos_preferidos)
    ? onboarding.alimentos_preferidos.map((item: any) => item?.nombre_alimento ?? item?.nombre ?? '').filter(Boolean)
    : [];
  const restrictedFoods = Array.isArray(onboarding.alimentos_restringidos)
    ? onboarding.alimentos_restringidos.map((item: any) => item?.nombre_alimento ?? item?.nombre ?? '').filter(Boolean)
    : [];
  const restrictionText = [
    onboarding.alergias_intolerancias,
    onboarding.restricciones_alimenticias,
    ...(Array.isArray(onboarding.condiciones) ? onboarding.condiciones.map((item: any) => item?.nombre ?? '') : []),
  ]
    .filter(Boolean)
    .join(' ');
  const preferredTokens = preferredFoods.map(normalizeText);
  const avoidTokens = [...restrictedFoods.map(normalizeText), ...restrictionText.split(/\s+/).map(normalizeText)].filter(Boolean);

  return {
    preferredFoods,
    restrictedFoods,
    preferredTokens,
    avoidTokens,
    objective: onboarding.objetivo ?? 'Mejorar mis habitos alimenticios',
    activity: onboarding.nivel_actividad_fisica ?? 'medio',
    sport: onboarding.deportes?.[0] ?? 'ninguno',
    conditions: Array.isArray(onboarding.condiciones)
      ? onboarding.condiciones.map((item: any) => item?.nombre ?? '').filter(Boolean)
      : [],
  };
}

function calculateTargetCalories(user: any, activity: string, objective: string) {
  const basal = typeof user?.metabolismo_basal === 'number' ? user.metabolismo_basal : 1600;
  const activityMap: Record<string, number> = {
    sedentario: 1.15,
    bajo: 1.25,
    medio: 1.35,
    alto: 1.45,
  };
  const multiplier = activityMap[normalizeText(activity)] ?? 1.3;
  let target = basal * multiplier;

  const normalizedObjective = normalizeText(objective);
  if (normalizedObjective.includes('reducir')) target -= 180;
  if (normalizedObjective.includes('ganar')) target += 150;

  return Math.max(1200, Math.round(target));
}

function buildMenuOptions(dayKey: DayKey, targetCalories: number, userSignals: ReturnType<typeof getUserSignals>) {
  const dayOffset = DAY_DEFS.findIndex((day) => day.key === dayKey);

  const slots = Object.keys(MEAL_BANK) as MealSlot[];
  return Array.from({ length: 5 }, (_, optionIndex) => {
    const meals = slots.map((slot, slotIndex) => {
      const ranked = [...MEAL_BANK[slot]].sort((a, b) => {
        const scoreA = scoreTemplate(a, userSignals.preferredTokens, userSignals.avoidTokens);
        const scoreB = scoreTemplate(b, userSignals.preferredTokens, userSignals.avoidTokens);
        return scoreB - scoreA;
      });

      const picked = ranked[(optionIndex + dayOffset + slotIndex) % ranked.length];
      return {
        id: `${dayKey}-${optionIndex}-${slotIndex}`,
        slot,
        title: picked.title,
        calories: picked.calories,
        emoji: picked.emoji,
        ingredients: picked.ingredients,
        recipe: picked.recipe,
        preparation: picked.preparation,
        macroImpact: picked.macroImpact,
      } as PlanMeal;
    });

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const delta = targetCalories - totalCalories;
    const summary =
      delta >= 0
        ? `Plan equilibrado, ${delta} kcal por debajo del maximo recomendado`
        : `Plan potente, ${Math.abs(delta)} kcal por encima para dias de mayor demanda`;

    return {
      id: `${dayKey}-option-${optionIndex + 1}`,
      label: `Menu ${optionIndex + 1}`,
      summary,
      totalCalories,
      meals,
    };
  });
}

function buildExercises(dayKey: DayKey, sport: string) {
  const normalizedSport = normalizeText(sport);
  const workoutBank = SPORT_WORKOUTS[normalizedSport] ?? SPORT_WORKOUTS.ninguno;
  const dayIndex = DAY_DEFS.findIndex((day) => day.key === dayKey);

  return Array.from({ length: 2 }, (_, index) => workoutBank[(dayIndex + index) % workoutBank.length]).map((exercise, index) => ({
    ...exercise,
    id: `${dayKey}-${exercise.id}-${index}`,
  }));
}

export async function loadWeeklyPlan(): Promise<WeeklyPlan> {
  const user = (await authStore.getUser()) as any;
  const state = await loadPlanState();
  const userSignals = getUserSignals(user);
  const targetCalories = calculateTargetCalories(user, userSignals.activity, userSignals.objective);
  await setDailyCalorieTarget(targetCalories);

  const days = DAY_DEFS.map((day) => {
    const menuOptions = buildMenuOptions(day.key, targetCalories, userSignals);
    const selectedMenuId = state.selectedMenus[day.key] ?? menuOptions[0].id;
    const selectedMenu = menuOptions.find((option) => option.id === selectedMenuId) ?? menuOptions[0];
    const exercises = buildExercises(day.key, userSignals.sport);

    const mealStatuses = selectedMenu.meals.reduce<Record<string, 'done' | 'skip' | null>>((acc, meal) => {
      acc[meal.id] = state.mealStatuses[meal.id] ?? null;
      return acc;
    }, {});

    const exerciseStatuses = exercises.reduce<Record<string, 'done' | 'skip' | null>>((acc, exercise) => {
      acc[exercise.id] = state.exerciseStatuses[exercise.id] ?? null;
      return acc;
    }, {});

    return {
      key: day.key,
      label: day.label,
      shortLabel: day.shortLabel,
      targetCalories,
      menuOptions,
      selectedMenuId,
      selectedMenu,
      mealStatuses,
      exercises,
      exerciseStatuses,
    } satisfies PlanDay;
  });

  const summary = [
    `Meta diaria estimada: ${targetCalories} kcal`,
    `Objetivo: ${userSignals.objective}`,
    `Deporte principal: ${userSignals.sport || 'ninguno'}`,
    userSignals.preferredFoods.length > 0
      ? `Preferencias consideradas: ${userSignals.preferredFoods.slice(0, 3).join(', ')}`
      : 'Menus equilibrados segun actividad y biometria',
  ];

  return {
    summary,
    activeDayKey: getTodayDayKey(),
    days,
  };
}

export async function loadTodayMealPlan(): Promise<TodayMealPlan> {
  const response = await apiClient.get('/meal-tracking/today');
  const days = collectTodayMealDays(response.data);
  const activeDay = pickActiveTodayMealDay(days);
  const meals = activeDay?.meals ?? [];
  const completedMeals = activeDay?.completedMeals ?? 0;
  const totalMeals = activeDay?.totalMeals ?? 0;
  const progressPct = activeDay?.progressPct ?? 0;

  const basePlan: TodayMealPlan = {
    days,
    selectedDayId: activeDay?.id ?? days[0]?.id ?? '',
    meals,
    completedMeals,
    totalMeals,
    progressPct,
    summary: [
      `Día activo: ${toText(activeDay?.label ?? '', 'Sin día activo')}`,
      `Comidas realizadas: ${completedMeals}/${Math.max(totalMeals, 1)}`,
    ],
    updatedAt: activeDay?.date,
  };

  return basePlan;
}

function buildTodayMealDayFromPlanApi(day: NutritionPlanDayApi, index: number): TodayMealDay {
  const dayRecord = (day as any);
  const nestedDay = dayRecord?.dia && typeof dayRecord.dia === 'object' ? dayRecord.dia : null;
  const menus = Array.isArray(dayRecord.menus)
    ? dayRecord.menus
    : Array.isArray(dayRecord.comidas)
      ? dayRecord.comidas
    : Array.isArray(dayRecord.meals)
        ? dayRecord.meals
        : [];

  const meals = sortMealsBySlot(menus.map((menu: NutritionPlanMenuApi, mealIndex: number) => {
    const slotLabel = (menu as any)?.nombre_tiempo ?? (menu as any)?.tiempo_comida ?? (menu as any)?.slot;
    const slot = slotFromMealLabel(slotLabel, mealIndex);
    const calories = toNumber(menu.calorias_aportadas, 0);
    const menuTrackingId = toText((menu as any)?.menuTrackingId ?? menu.id_menu_diario, `meal-${mealIndex + 1}`);
    const dishId = toText(
      (menu as any)?.dishId ?? (menu as any)?.id_plato ?? (menu as any)?.idPlato ?? (menu as any)?.dish_id,
      '',
    );
    if (__DEV__ && (!dishId || menuTrackingId.startsWith('meal-'))) {
      console.log('[plan][map-menu] suspicious ids', {
        mealIndex,
        slotLabel,
        menuTrackingId,
        dishId,
        raw: {
          id_menu_diario: (menu as any)?.id_menu_diario,
          menuTrackingId: (menu as any)?.menuTrackingId,
          id_plato: (menu as any)?.id_plato,
          dishId: (menu as any)?.dishId,
          idPlato: (menu as any)?.idPlato,
          dish_id: (menu as any)?.dish_id,
        },
      });
    }
    const status = normalizeMealTrackingStatus(
      (menu as any).estado ?? undefined,
      (menu as any).realizado,
      (menu as any).hora_registro ?? (menu as any).horaRegistro ?? (menu as any).registered_time,
    );
    return {
      id: menuTrackingId,
      menuTrackingId,
      dishId: dishId || undefined,
      slot,
      title: toText(menu.nombre_plato, slot),
      calories: Math.max(0, Math.round(calories)),
      emoji: emojiForSlot(slot),
      status,
      statusLabel: status === 'done' ? 'Realizada' : status === 'skip' ? 'No realizada' : 'Pendiente',
      summary: undefined,
    } satisfies TodayMealItem;
  }));

  const completedMeals = meals.filter((meal) => meal.status === 'done').length;
  const totalMeals = meals.length;
  const labelParts = normalizeMealDayLabel((nestedDay ?? day) as any, index);
  const resolvedDate =
    coerceToLocalIsoDateString(nestedDay?.fecha) ?? coerceToLocalIsoDateString((day as any).fecha);

  return {
    id: normalizeMealDayId((nestedDay ?? day) as any, index),
    // Prefer nested `dia.fecha` cuando exista; el `day.fecha` puede venir como metadata y no coincidir.
    date: resolvedDate,
    label: labelParts.label,
    shortLabel: labelParts.shortLabel,
    meals,
    completedMeals,
    totalMeals,
    progressPct: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
  };
}

function collectPlanWeeksDays(weeks: NutritionPlanWeekApi[]): TodayMealDay[] {
  const days = weeks
    .filter((week): week is NutritionPlanWeekApi => Boolean(week) && typeof week === 'object')
    .flatMap((week) => Array.isArray(week.dias) ? week.dias : Array.isArray(week.days) ? week.days : [])
    .filter((day): day is NutritionPlanDayApi => Boolean(day) && typeof day === 'object');

  return ensureUniqueTodayMealDayIds(days.map((day, index) => buildTodayMealDayFromPlanApi(day, index)));
}

export async function loadTodayMealPlanFromNutritionPlan(planId: string | number): Promise<TodayMealPlan> {
  const weeks = await fetchNutritionPlanWeeks(planId);
  if (weeks.length === 0) {
    throw new Error('El plan no devolviÃ³ semanas (weeks vacÃ­o).');
  }
  const days = ensureUniqueTodayMealDayIds(collectPlanWeeksDays(weeks));
  const activeDay = pickActiveTodayMealDay(days);
  const meals = activeDay?.meals ?? [];
  const completedMeals = activeDay?.completedMeals ?? 0;
  const totalMeals = activeDay?.totalMeals ?? 0;
  const progressPct = activeDay?.progressPct ?? 0;

  const basePlan: TodayMealPlan = {
    days,
    selectedDayId: activeDay?.id ?? days[0]?.id ?? '',
    meals,
    completedMeals,
    totalMeals,
    progressPct,
    summary: [
      `Dia activo: ${toText(activeDay?.label ?? '', 'Sin dÃ­a activo')}`,
      `Comidas realizadas: ${completedMeals}/${Math.max(totalMeals, 1)}`,
    ],
    updatedAt: activeDay?.date,
  };

  try {
    const dateIsos = basePlan.days.map((day) => day.date ?? '').filter(Boolean) as string[];
    const statusMap = await fetchMealTrackingStatusMapForDates(dateIsos.length > 0 ? dateIsos : [getLocalIsoDate()]);
    return overlayMealTrackingStatusMap(basePlan, statusMap);
  } catch {
    return basePlan;
  }
}

export async function loadTodayMealPlanFromActivePlan(): Promise<TodayMealPlan> {
  const payload = await fetchActiveNutritionPlanPayload();
  if (!payload || typeof payload !== 'object') {
    throw new Error('No se pudo cargar el plan activo.');
  }

  const weeks = Array.isArray((payload as any).semanas) ? ((payload as any).semanas as NutritionPlanWeekApi[]) : [];
  const directDays = Array.isArray((payload as any).dias) ? ((payload as any).dias as NutritionPlanDayApi[]) : [];

  const resolveDayIso = (day: any): string | undefined =>
    coerceToLocalIsoDateString(day?.dia?.fecha) ?? coerceToLocalIsoDateString(day?.fecha);

  const pickActiveWeek = (allWeeks: NutritionPlanWeekApi[]) => {
    if (allWeeks.length === 0) return null;

    const todayIso = getLocalIsoDate();
    const sortedWeeks = [...allWeeks].sort((a, b) => {
      const startA = coerceToLocalIsoDateString((a as any).fecha_inicio_semana) ?? '';
      const startB = coerceToLocalIsoDateString((b as any).fecha_inicio_semana) ?? '';
      if (startA && startB) return startA.localeCompare(startB);
      if (startA) return -1;
      if (startB) return 1;
      return 0;
    });

    const weekPointer = (payload as any).semana_actual ?? (payload as any).week_current ?? null;
    const targetId = weekPointer && typeof weekPointer === 'object' ? (weekPointer as any).id_semana : undefined;
    const targetNumber = weekPointer && typeof weekPointer === 'object' ? (weekPointer as any).numero : undefined;

    const byId = typeof targetId !== 'undefined'
      ? sortedWeeks.find((week) => String(week.id_semana ?? '') === String(targetId))
      : undefined;
    if (byId) return byId;

    const byNumber = typeof targetNumber !== 'undefined'
      ? sortedWeeks.find((week) => String(week.numero ?? '') === String(targetNumber))
      : undefined;
    if (byNumber) return byNumber;

    const byDateRange = sortedWeeks.find((week) => {
      const start = coerceToLocalIsoDateString((week as any).fecha_inicio_semana);
      const end = coerceToLocalIsoDateString((week as any).fecha_fin_semana);
      if (!start || !end) return false;
      return start <= todayIso && todayIso <= end;
    });
    if (byDateRange) return byDateRange;

    // Fallback: tomar la semana mÃ¡s cercana a hoy por fecha_inicio_semana.
    const byContainedDay = sortedWeeks.find((week) => {
      const days = Array.isArray((week as any).dias)
        ? (week as any).dias
        : Array.isArray((week as any).days)
          ? (week as any).days
          : [];
      return days.some((day: any) => resolveDayIso(day) === todayIso);
    });
    if (byContainedDay) return byContainedDay;

    const todayTime = new Date(`${todayIso}T12:00:00`).getTime();
    let closest: NutritionPlanWeekApi | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const week of sortedWeeks) {
      const start = coerceToLocalIsoDateString((week as any).fecha_inicio_semana);
      if (!start) continue;
      const diff = Math.abs(new Date(`${start}T12:00:00`).getTime() - todayTime);
      if (diff < bestDiff) {
        bestDiff = diff;
        closest = week;
      }
    }

    return closest ?? sortedWeeks[0];
  };

  const activeWeek = pickActiveWeek(weeks);
  const activeWeekStart = activeWeek ? coerceToLocalIsoDateString((activeWeek as any).fecha_inicio_semana) : undefined;
  const activeWeekEnd = activeWeek ? coerceToLocalIsoDateString((activeWeek as any).fecha_fin_semana) : undefined;

  const activeWeekDays = activeWeek
    ? (Array.isArray((activeWeek as any).dias) ? (activeWeek as any).dias : Array.isArray((activeWeek as any).days) ? (activeWeek as any).days : [])
    : [];

  const nextWeek = (() => {
    if (!activeWeekStart || weeks.length === 0) return null;
    const next = weeks
      .map((week) => ({ week, start: coerceToLocalIsoDateString((week as any).fecha_inicio_semana) ?? '' }))
      .filter((item) => item.start && item.start > activeWeekStart)
      .sort((a, b) => a.start.localeCompare(b.start))[0];
    return next?.week ?? null;
  })();

  const nextWeekDays = nextWeek
    ? (Array.isArray((nextWeek as any).dias) ? (nextWeek as any).dias : Array.isArray((nextWeek as any).days) ? (nextWeek as any).days : [])
    : [];

  const allWeekDays = weeks
    .filter((week): week is NutritionPlanWeekApi => Boolean(week) && typeof week === 'object')
    .flatMap((week) => Array.isArray((week as any).dias) ? (week as any).dias : Array.isArray((week as any).days) ? (week as any).days : [])
    .filter((day): day is NutritionPlanDayApi => Boolean(day) && typeof day === 'object');

  const rawDays: NutritionPlanDayApi[] = activeWeekDays.length > 0
    ? ([...(activeWeekDays as NutritionPlanDayApi[]), ...(nextWeekDays as NutritionPlanDayApi[])])
    : directDays.length > 0
      ? directDays
      : allWeekDays;

  // Fallback robusto: si no hay rango de semana, filtrar por la semana del dispositivo (Lun..Dom)
  // usando la fecha real de cada día. Evita mezclar semanas no activas en el carrusel.
  const todayIso = getLocalIsoDate();
  const currentWeekStart = getWeekStartIsoMonday(todayIso);
  const currentWeekEnd = getWeekEndIsoSunday(currentWeekStart);
  const nextWeekStartDate = new Date(`${currentWeekStart}T12:00:00`);
  nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
  const nextWeekStart = getLocalIsoDate(nextWeekStartDate);
  const nextWeekEnd = getWeekEndIsoSunday(nextWeekStart);

  const windowStart = activeWeekStart ?? currentWeekStart;
  const windowEnd =
    coerceToLocalIsoDateString((nextWeek as any)?.fecha_fin_semana)
    ?? activeWeekEnd
    ?? nextWeekEnd;

  const filteredRawDays = rawDays.filter((day) => {
    const dateIso = resolveDayIso(day);
    if (!dateIso) return true;
    return windowStart <= dateIso && dateIso <= windowEnd;
  });

  const mappedDays = ensureUniqueTodayMealDayIds(filteredRawDays.map((day, index) => buildTodayMealDayFromPlanApi(day, index)));
  const daysWithWeekend = fillMissingDaysWithWeekendBlocks(mappedDays);

  // Fallback: si el filtro dejÃ³ la lista vacÃ­a por fechas mal formateadas, no bloqueamos la UI.
  const days = daysWithWeekend.length > 0
    ? daysWithWeekend
    : ensureUniqueTodayMealDayIds(
      (directDays.length > 0 ? directDays : allWeekDays).map((day, index) => buildTodayMealDayFromPlanApi(day, index)),
    );

  const activeDay = pickActiveTodayMealDay(days);
  const meals = activeDay?.meals ?? [];
  const completedMeals = activeDay?.completedMeals ?? 0;
  const totalMeals = activeDay?.totalMeals ?? 0;
  const progressPct = activeDay?.progressPct ?? 0;

  const basePlan: TodayMealPlan = {
    days,
    selectedDayId: activeDay?.id ?? days[0]?.id ?? '',
    meals,
    completedMeals,
    totalMeals,
    progressPct,
    summary: [
      `Dia activo: ${toText(activeDay?.label ?? '', 'Sin dÃ­a activo')}`,
      `Comidas realizadas: ${completedMeals}/${Math.max(totalMeals, 1)}`,
    ],
    updatedAt: activeDay?.date,
  };

  try {
    const dateIsos = basePlan.days.map((day) => day.date ?? '').filter(Boolean) as string[];
    const statusMap = await fetchMealTrackingStatusMapForDates(dateIsos.length > 0 ? dateIsos : [getLocalIsoDate()]);
    return overlayMealTrackingStatusMap(basePlan, statusMap);
  } catch {
    return basePlan;
  }
}

export async function loadDishDetails(dishId: string): Promise<DishDetails> {
  if (__DEV__) {
    console.log('[plan][loadDishDetails] start', { dishId });
  }
  const response = await apiClient.get(`/dishes/${encodeURIComponent(dishId)}`);
  if (__DEV__) {
    const data = response.data as any;
    console.log('[plan][loadDishDetails] raw', {
      dishId,
      success: data?.success,
      dataKeys: data && typeof data === 'object' && data.data && typeof data.data === 'object' ? Object.keys(data.data) : [],
      rootKeys: data && typeof data === 'object' ? Object.keys(data) : [],
    });
  }
  const parsed = extractDishDetails(response.data, dishId);
  if (__DEV__) {
    console.log('[plan][loadDishDetails] parsed', {
      dishId,
      title: parsed.title,
      calories: parsed.calories,
      ingredientsCount: parsed.ingredients.length,
      preparationCount: parsed.preparation.length,
      hasRecipe: Boolean(parsed.recipe),
    });
  }
  return parsed;
}

export async function saveMealTracking(params: {
  menuTrackingId: string;
  realized: boolean;
  hora_registro?: string;
  planId?: string | number;
}): Promise<TodayMealPlan> {
  if (__DEV__) {
    console.log('[plan][saveMealTracking] start', {
      menuTrackingId: params.menuTrackingId,
      realized: params.realized,
      planId: params.planId,
      menuTrackingIdType: typeof params.menuTrackingId,
    });
  }

  if (!params.menuTrackingId) {
    if (__DEV__) console.log('[plan][saveMealTracking] missing menuTrackingId', { params });
    throw new Error('menuTrackingId is required');
  }

  const rawMenuTrackingId = String(params.menuTrackingId).trim();
  const menuTrackingId =
    /^\d+$/.test(rawMenuTrackingId) && Number.isFinite(Number(rawMenuTrackingId))
      ? Number(rawMenuTrackingId)
      : params.menuTrackingId;

  const payload: Record<string, unknown> = {
    id_menu_diario: menuTrackingId,
    realizado: params.realized,
  };

  if (typeof params.hora_registro === 'string' && params.hora_registro.trim().length > 0) {
    payload.hora_registro = params.hora_registro.trim();
  }

  try {
    await apiClient.post('/meal-tracking', payload);
    if (__DEV__) console.log('[plan][saveMealTracking] post ok', { payload });
  } catch (err) {
    if (__DEV__) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('[plan][saveMealTracking] post failed', { payload, message });
    }
    throw err;
  }

  if (typeof params.planId !== 'undefined') {
    return loadTodayMealPlanFromNutritionPlan(params.planId);
  }

  return loadTodayMealPlan();
}

export async function selectMenuOption(dayKey: DayKey, menuId: string): Promise<WeeklyPlan> {
  const state = await loadPlanState();
  const nextState: PlanState = {
    ...state,
    selectedMenus: {
      ...state.selectedMenus,
      [dayKey]: menuId,
    },
  };
  await savePlanState(nextState);
  return loadWeeklyPlan();
}

export async function updateMealStatus(
  meal: PlanMeal,
  status: 'done' | 'skip' | null,
): Promise<WeeklyPlan> {
  const state = await loadPlanState();
  const previousStatus = state.mealStatuses[meal.id] ?? null;
  const nextMealStatuses = { ...state.mealStatuses };

  if (status) {
    nextMealStatuses[meal.id] = status;
  } else {
    delete nextMealStatuses[meal.id];
  }

  if (previousStatus !== 'done' && status === 'done') {
    await applyTrackedMeal(meal.id, meal.calories, meal.macroImpact);
  }

  if (previousStatus === 'done' && status !== 'done') {
    await removeTrackedMeal(meal.id);
  }

  await savePlanState({
    ...state,
    mealStatuses: nextMealStatuses,
  });

  return loadWeeklyPlan();
}

export async function updateExerciseStatus(
  exerciseId: string,
  status: 'done' | 'skip' | null,
): Promise<WeeklyPlan> {
  const state = await loadPlanState();
  const nextExerciseStatuses = { ...state.exerciseStatuses };

  if (status) {
    nextExerciseStatuses[exerciseId] = status;
  } else {
    delete nextExerciseStatuses[exerciseId];
  }

  await savePlanState({
    ...state,
    exerciseStatuses: nextExerciseStatuses,
  });

  return loadWeeklyPlan();
}
