import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/services/api.client';
import { authStore } from '@/store/auth.store';
import { intakeImageService } from '@/services/intake-image.service';
import { IntakeEstimation } from '@/types/intake.types';
import type { AdditionalIntakeRequest, AdditionalIntakeRecord } from '@/types/intake.types';

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

export type WeightRecordApiResponse = {
  id_registro_peso: number;
  id_perfil: number;
  fecha: string;
  peso_kg: number | string;
  created_at?: string;
  diferencia_vs_ayer?: number | null;
  diferencia_vs_inicio?: number | null;
  diferencia_vs_anterior?: number | null;
  es_primer_registro: boolean;
};

export type SaveDailyWeightResult = {
  dashboard: CalorieDashboard;
  record: WeightRecordApiResponse;
  message?: string;
};

export type FoodEstimate = {
  id: string;
  name: string;
  calories: number;
  imageUri: string;
  estimation?: IntakeEstimation;
  requiresManualCalories?: boolean;
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
  date: string;
  dailyTarget: number;
  consumedCalories: number;
  planActive: boolean;
  macros: MacroProgress[];
  weightEntries: WeightEntry[];
  mealHistory: MealHistoryEntry[];
  trackedMeals: Record<string, TrackedMealImpact>;
};

const STORAGE_KEY_BASE = '@dk_fitt:calorie_dashboard';
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
  date: formatLocalDate(),
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

function buildFoodEstimateFromEstimation(params: {
  estimation: any;
  imageUri: string;
  descripcion_alimento?: string;
}): FoodEstimate {
  const cleanedDescription =
    typeof params.descripcion_alimento === 'string' && params.descripcion_alimento.trim().length > 0
      ? params.descripcion_alimento.trim()
      : undefined;

  const estimation = params.estimation ?? {};
  const items = Array.isArray(estimation?.items) ? estimation.items : [];

  const labelFromTags = (() => {
    const tags = estimation?.etiquetas_detectadas;
    if (Array.isArray(tags) && tags.length > 0) {
      const first = tags[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && typeof (first as any).description === 'string') {
        return (first as any).description;
      }
      if (first && typeof first === 'object' && typeof (first as any).name === 'string') {
        return (first as any).name;
      }
    }
    const labels = estimation?.labels;
    if (Array.isArray(labels) && labels.length > 0 && typeof labels[0]?.description === 'string') {
      return labels[0].description;
    }
    return undefined;
  })();

  const firstName =
    typeof items?.[0]?.name === 'string'
      ? items[0].name
      : Array.isArray(estimation?.alimentos_detectados) && typeof estimation.alimentos_detectados?.[0]?.nombre === 'string'
        ? estimation.alimentos_detectados[0].nombre
        : typeof labelFromTags === 'string'
          ? labelFromTags
          : 'Comida detectada';

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
          : typeof estimation?.calorias_estimadas === 'string'
            ? Number(estimation.calorias_estimadas)
            : sumItems;

  const hasCalories = Number.isFinite(rawTotal);
  const calories = hasCalories ? Math.max(0, Math.round(rawTotal)) : 0;
  const alertTone: FoodEstimate['alertTone'] = calories >= 800 ? 'high' : 'medium';

  const hasDirectEstimate =
    estimation?.calorias_estimadas != null || estimation?.totalCalories != null || estimation?.total_calories != null;

  return {
    id:
      typeof estimation?.jobId === 'string' && estimation.jobId.trim().length > 0
        ? estimation.jobId
        : `${Date.now()}`,
    name: cleanedDescription ?? firstName,
    calories,
    imageUri: params.imageUri,
    estimation: estimation as IntakeEstimation,
    requiresManualCalories:
      estimation?.fuente_estimacion === 'pendiente' ||
      (!hasDirectEstimate && sumItems === 0) ||
      !hasCalories,
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
}

export function buildFoodEstimateFromIntakeEstimation(params: {
  estimation: IntakeEstimation;
  imageUri: string;
  descripcion_alimento?: string;
}): FoodEstimate {
  return buildFoodEstimateFromEstimation(params);
}

function buildAdditionalIntakePayload(params: {
  estimate: FoodEstimate;
  imageUrl: string;
  descripcion_alimento?: string;
  calories?: number;
}): AdditionalIntakeRequest {
  const estimation = params.estimate.estimation ?? {};
  const macros = estimation.macros ?? {};
  const portionValue =
    typeof estimation.porcion_estimada_g === 'number'
      ? estimation.porcion_estimada_g
      : typeof estimation.porcion_g === 'number'
        ? estimation.porcion_g
        : undefined;
  const calories = typeof params.calories === 'number' ? params.calories : params.estimate.calories;

  const proteins = Number(macros.proteinas_g);
  const carbs = Number(macros.carbohidratos_g);
  const fats = Number(macros.grasas_g);

  const alimentos = (() => {
    const raw = (estimation as any).alimentos_detectados;
    if (!Array.isArray(raw) || raw.length === 0) return undefined;

    const normalized = raw
      .map((item: any) => {
        if (typeof item === 'string') {
          const nombre = item.trim();
          return nombre.length > 0 ? { nombre } : null;
        }

        if (!item || typeof item !== 'object') return null;

        const nombre =
          typeof item.nombre === 'string'
            ? item.nombre
            : typeof item.name === 'string'
              ? item.name
              : undefined;

        if (!nombre || nombre.trim().length === 0) return null;

        const cantidad_g = Number(item.cantidad_g ?? item.cantidad ?? item.gramos ?? item.portion_g);
        const calorias = Number(item.calorias ?? item.calories);

        return {
          nombre: nombre.trim(),
          ...(Number.isFinite(cantidad_g) && cantidad_g > 0 ? { cantidad_g: cantidad_g } : {}),
          ...(Number.isFinite(calorias) && calorias > 0 ? { calorias: calorias } : {}),
        };
      })
      .filter(Boolean);

    return normalized.length > 0 ? (normalized as any) : undefined;
  })();

  const descripcionAlimento = (() => {
    const explicit = typeof params.descripcion_alimento === 'string' ? params.descripcion_alimento.trim() : '';
    if (explicit.length > 0) return explicit;

    const fromOcr = typeof estimation.texto_detectado === 'string' ? estimation.texto_detectado.trim() : '';
    if (fromOcr.length > 0) return fromOcr;

    const fromEstimateName = typeof params.estimate?.name === 'string' ? params.estimate.name.trim() : '';
    if (fromEstimateName.length > 0) return fromEstimateName;

    const firstDetected =
      Array.isArray((estimation as any).alimentos_detectados) && typeof (estimation as any).alimentos_detectados?.[0]?.nombre === 'string'
        ? String((estimation as any).alimentos_detectados[0].nombre).trim()
        : '';
    if (firstDetected.length > 0) return firstDetected;

    return 'Consumo adicional';
  })();

  return {
    // El backend actual valida este campo como requerido.
    descripcion_alimento: descripcionAlimento,
    imagen_url: params.imageUrl,
    calorias_estimadas: Math.max(0, Math.round(calories)),
    porcion_g: typeof portionValue === 'number' ? Math.max(0, Math.round(portionValue)) : undefined,
    proteinas_g: Number.isFinite(proteins) && proteins > 0 ? Math.max(0, Math.round(proteins)) : undefined,
    carbohidratos_g: Number.isFinite(carbs) && carbs > 0 ? Math.max(0, Math.round(carbs)) : undefined,
    grasas_g: Number.isFinite(fats) && fats > 0 ? Math.max(0, Math.round(fats)) : undefined,
    confianza_pct:
      typeof estimation.confianza_pct === 'number'
        ? Math.max(0, Math.min(100, Math.round(estimation.confianza_pct)))
        : undefined,
    alimentos_detectados: alimentos,
  };
}

function extractAdditionalIntakeId(value: unknown): number | string | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  const nestedConsumption =
    record.consumo && typeof record.consumo === 'object' ? (record.consumo as Record<string, unknown>) : undefined;
  const nestedData =
    record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>) : undefined;
  const candidates = [
    record.id_consumo_adicional,
    record.id_consumo,
    record.id,
    record.id_registro,
    record.consumo_id,
    nestedConsumption?.id_consumo_adicional,
    nestedConsumption?.id_consumo,
    nestedConsumption?.id,
    nestedConsumption?.id_registro,
    nestedData?.id_consumo_adicional,
    nestedData?.id_consumo,
    nestedData?.id,
    nestedData?.consumo && typeof nestedData.consumo === 'object'
      ? (nestedData.consumo as Record<string, unknown>).id_consumo_adicional
      : undefined,
    nestedData?.consumo && typeof nestedData.consumo === 'object'
      ? (nestedData.consumo as Record<string, unknown>).id_consumo
      : undefined,
    nestedData?.consumo && typeof nestedData.consumo === 'object'
      ? (nestedData.consumo as Record<string, unknown>).id
      : undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate.trim();
  }

  return undefined;
}

function normalizeCalendarDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;

  const trimmed = value.trim();
  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed.length >= 10 ? trimmed.slice(0, 10) : undefined;
  }

  return parsed.toISOString().slice(0, 10);
}

export function extractAdditionalIntakeDate(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  const nestedConsumption =
    record.consumo && typeof record.consumo === 'object' ? (record.consumo as Record<string, unknown>) : undefined;
  const nestedData =
    record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>) : undefined;
  const candidates = [
    record.fecha,
    record.fecha_consumo,
    record.created_at,
    record.createdAt,
    nestedConsumption?.fecha,
    nestedConsumption?.fecha_consumo,
    nestedConsumption?.created_at,
    nestedConsumption?.createdAt,
    nestedData?.fecha,
    nestedData?.fecha_consumo,
    nestedData?.created_at,
    nestedData?.createdAt,
    nestedData?.consumo && typeof nestedData.consumo === 'object'
      ? (nestedData.consumo as Record<string, unknown>).fecha
      : undefined,
    nestedData?.consumo && typeof nestedData.consumo === 'object'
      ? (nestedData.consumo as Record<string, unknown>).fecha_consumo
      : undefined,
    nestedData?.consumo && typeof nestedData.consumo === 'object'
      ? (nestedData.consumo as Record<string, unknown>).created_at
      : undefined,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCalendarDate(candidate);
    if (normalized) return normalized;
  }

  return undefined;
}

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

async function getDashboardStorageKey(): Promise<string> {
  const user = await authStore.getUser();
  const userId = typeof user?.id_usuario === 'number' ? user.id_usuario : undefined;
  return userId ? `${STORAGE_KEY_BASE}:${userId}` : `${STORAGE_KEY_BASE}:anonymous`;
}

async function persistDashboard(dashboard: CalorieDashboard) {
  const storageKey = await getDashboardStorageKey();
  await AsyncStorage.setItem(storageKey, JSON.stringify(dashboard));
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

function normalizeWeightRecord(record: WeightRecordApiResponse): WeightEntry {
  const date =
    typeof record.fecha === 'string' && record.fecha.length >= 10 ? record.fecha.slice(0, 10) : formatLocalDate();
  const value = typeof record.peso_kg === 'number' ? record.peso_kg : Number.parseFloat(record.peso_kg);

  return {
    date,
    value: Number.isFinite(value) ? Number(value.toFixed(2)) : 0,
  };
}

export async function loadLatestWeightRecord(): Promise<WeightRecordApiResponse | null> {
  const response = await apiClient.get<{ success: true; data: WeightRecordApiResponse[]; meta?: unknown }>(
    '/weight-records/me',
    {
      params: {
        page: 1,
        limit: 1,
      },
    },
  );

  const latest = response.data.data?.[0];
  return latest ?? null;
}

export async function loadWeightHistory(limit = 30): Promise<WeightEntry[]> {
  const response = await apiClient.get<{ success: true; data: WeightRecordApiResponse[]; meta?: unknown }>(
    '/weight-records/me',
    {
      params: {
        page: 1,
        limit,
      },
    },
  );

  return (response.data.data ?? [])
    .map(normalizeWeightRecord)
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadCalorieDashboard(): Promise<CalorieDashboard> {
  const storageKey = await getDashboardStorageKey();
  const raw = await AsyncStorage.getItem(storageKey);
  const storedPlan = await AsyncStorage.getItem(PLAN_KEY);
  const user = await authStore.getUser();
  const today = formatLocalDate();

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
      date: today,
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
    const storedDate = typeof parsed.date === 'string' && parsed.date.length >= 10 ? parsed.date.slice(0, 10) : today;
    const shouldResetDay = storedDate !== today;
    const normalized: CalorieDashboard = {
      date: today,
      dailyTarget: user?.evaluacion_clinica ? targetDaily : (typeof parsed.dailyTarget === 'number' ? parsed.dailyTarget : DEFAULT_DASHBOARD.dailyTarget),
      consumedCalories:
        !shouldResetDay && typeof parsed.consumedCalories === 'number' ? parsed.consumedCalories : 0,
      planActive:
        typeof parsed.planActive === 'boolean' ? parsed.planActive : storedPlan !== 'false',
      macros: user?.evaluacion_clinica ? targetMacros : normalizeMacros(parsed.macros),
      weightEntries: normalizeWeights(parsed.weightEntries),
      mealHistory: shouldResetDay ? [] : normalizeMeals(parsed.mealHistory),
      trackedMeals: shouldResetDay ? {} : normalizeTrackedMeals(parsed.trackedMeals),
    };

    if (normalized.weightEntries.length === 0) {
      normalized.weightEntries = await createInitialWeightEntry();
      await persistDashboard(normalized);
    }

    if (shouldResetDay) {
      await persistDashboard(normalized);
    }

    return normalized;
  } catch {
    const initialWeights = await createInitialWeightEntry();
    const fallback = {
      ...DEFAULT_DASHBOARD,
      date: today,
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

export async function saveDailyWeight(value: number): Promise<SaveDailyWeightResult> {
  const response = await apiClient.post<{ success: true; data: WeightRecordApiResponse; message?: string }>(
    '/weight-records',
    {
      peso_kg: Number(value.toFixed(2)),
    },
  );

  const savedEntry = normalizeWeightRecord(response.data.data);
  const dashboard = await loadCalorieDashboard();
  const cleaned = dashboard.weightEntries.filter((entry) => entry.date !== savedEntry.date);
  const updated: CalorieDashboard = {
    ...dashboard,
    weightEntries: [savedEntry, ...cleaned].sort((a, b) => b.date.localeCompare(a.date)),
  };
  await persistDashboard(updated);
  return {
    dashboard: updated,
    record: response.data.data,
    message: response.data.message,
  };
}

export async function estimateMealFromPhoto(
  imageUri: string,
  descripcion_alimento?: string,
): Promise<FoodEstimate> {
  try {
    const cleanedDescription =
      typeof descripcion_alimento === 'string' && descripcion_alimento.trim().length > 0
        ? descripcion_alimento.trim()
        : undefined;

    const looksLikeRemoteUrl = /^https?:\/\//i.test(imageUri);
    const response = looksLikeRemoteUrl
      ? await intakeImageService.analyzeImageUrl({ imagen_url: imageUri, descripcion_alimento: cleanedDescription })
      : (() => {
          return intakeImageService
            .uploadIntakeImage({ imageUri, descripcion_alimento: cleanedDescription })
            .then((upload) => {
              // El servicio normaliza el campo como imagen_url; también aceptamos url como fallback
              const url =
                typeof upload?.imagen_url === 'string'
                  ? upload.imagen_url
                  : typeof (upload as any)?.url === 'string'
                    ? (upload as any).url
                    : undefined;
              if (!url) {
                throw new Error('No se pudo subir la imagen. Verifica tu conexión.');
              }
              return intakeImageService.analyzeImageUrl({ imagen_url: url, descripcion_alimento: cleanedDescription });
            });
        })();

    const estimation = response as any;
    if (__DEV__) {
      console.log('[calorie][estimateMealFromPhoto][estimation]', {
        fuente_estimacion: estimation?.fuente_estimacion,
        calorias_estimadas: estimation?.calorias_estimadas,
        totalCalories: estimation?.totalCalories,
        total_calories: estimation?.total_calories,
        confianza_pct: estimation?.confianza_pct,
        hasItems: Array.isArray(estimation?.items) ? estimation.items.length : undefined,
        hasFoods: Array.isArray(estimation?.alimentos_detectados) ? estimation.alimentos_detectados.length : undefined,
      });
    }
    return buildFoodEstimateFromEstimation({
      estimation,
      imageUri,
      descripcion_alimento: cleanedDescription,
    });
  } catch (error) {
    throw error;
  }
}

export async function estimateMealFromUploadedImage(params: {
  uploadedImageUrl: string;
  previewImageUri: string;
  descripcion_alimento?: string;
}): Promise<FoodEstimate> {
  const cleanedDescription =
    typeof params.descripcion_alimento === 'string' && params.descripcion_alimento.trim().length > 0
      ? params.descripcion_alimento.trim()
      : undefined;

  const response = await intakeImageService.analyzeImageUrl({
    imagen_url: params.uploadedImageUrl,
    descripcion_alimento: cleanedDescription,
  });

  const estimation = response as any;
  if (__DEV__) {
    console.log('[calorie][estimateMealFromUploadedImage][estimation]', {
      fuente_estimacion: estimation?.fuente_estimacion,
      calorias_estimadas: estimation?.calorias_estimadas,
      totalCalories: estimation?.totalCalories,
      confianza_pct: estimation?.confianza_pct,
      hasItems: Array.isArray(estimation?.items) ? estimation.items.length : undefined,
      hasFoods: Array.isArray(estimation?.alimentos_detectados) ? estimation.alimentos_detectados.length : undefined,
    });
  }

  return buildFoodEstimateFromEstimation({
    estimation,
    imageUri: params.previewImageUri,
    descripcion_alimento: cleanedDescription,
  });
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

async function applyAdditionalIntakeToDashboard(params: {
  id_consumo_adicional: number | string;
  calories: number;
}): Promise<CalorieDashboard> {
  const dashboard = await loadCalorieDashboard();
  const trackingKey = `additional:${params.id_consumo_adicional}`;

  if (dashboard.trackedMeals[trackingKey]) {
    return dashboard;
  }

  const updated: CalorieDashboard = {
    ...dashboard,
    consumedCalories: dashboard.consumedCalories + Math.max(0, Math.round(params.calories)),
    trackedMeals: {
      ...dashboard.trackedMeals,
      [trackingKey]: {
        calories: Math.max(0, Math.round(params.calories)),
        macroImpact: {
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      },
    },
  };

  await persistDashboard(updated);
  return updated;
}

export async function registerAdditionalIntakeFromEstimate(params: {
  estimate: FoodEstimate;
  imageUrl: string;
  descripcion_alimento?: string;
  calories?: number;
}): Promise<AdditionalIntakeRecord> {
  const payload = buildAdditionalIntakePayload(params);
  const record = await intakeImageService.registerAdditionalIntake(payload);
  const rawId = extractAdditionalIntakeId(record);
  const id = typeof rawId === 'string' ? Number(rawId) : rawId;

  if (!id || !Number.isFinite(id)) {
    throw new Error('La API no devolvió id_consumo_adicional para confirmar el registro.');
  }

  return {
    ...record,
    id_consumo_adicional: id,
  };
}

export async function confirmAdditionalIntakeOnBackend(params: {
  id_consumo_adicional: number | string;
  estimate: FoodEstimate;
  calories?: number;
}): Promise<void> {
  if (typeof params.id_consumo_adicional === 'undefined' || params.id_consumo_adicional === null || `${params.id_consumo_adicional}`.trim().length === 0) {
    throw new Error('Falta id_consumo_adicional para confirmar el consumo.');
  }

  const calories = typeof params.calories === 'number' ? params.calories : params.estimate.calories;
  await intakeImageService.confirmAdditionalIntake({
    id_consumo_adicional: params.id_consumo_adicional,
    calorias_estimadas: Math.max(0, Math.round(calories)),
  });
}

export async function discardAdditionalIntakeOnBackend(id_consumo_adicional: number | string): Promise<void> {
  await intakeImageService.discardAdditionalIntake(id_consumo_adicional);
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
