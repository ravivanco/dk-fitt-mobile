import { apiClient } from '@/services/api.client';

export type ExerciseCatalogItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion_min?: number;
  frecuencia_semanal?: number;
  intensidad?: 'baja' | 'media' | 'alta' | string;
  categoria?: string;
  deporte?: string;
  activo?: boolean;
  [key: string]: unknown;
};

export type ExerciseTrackingItem = {
  id: string;
  dailyId?: string;
  nombre: string;
  descripcion?: string;
  duracion_min?: number;
  series?: string | number;
  bloques?: string | number;
  distancia?: string | number;
  repeticiones?: string | number;
  intensidad?: 'baja' | 'media' | 'alta' | string;
  status?: 'done' | 'skip' | 'pending' | string;
  estado?: 'pendiente' | 'completado' | 'no_completado' | string;
  completado?: boolean;
  hora_registro?: string;
  raw?: unknown;
};

export type ExerciseTrackingToday = {
  date: string;
  totalDurationMin: number;
  hasExercises: boolean;
  message?: string;
  items: ExerciseTrackingItem[];
};

export type ExerciseRecommendation = {
  id_ejercicio: string | number;
  nombre: string;
  deporte?: string;
  intensidad?: 'baja' | 'media' | 'alta' | string;
  minutos_sugeridos: number;
  calorias_quemadas_estimadas: number;
  preferido: boolean;
  advertencia_clinica?: string | null;
  raw?: unknown;
};

function unwrapApi<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && (payload as any).success === true && 'data' in (payload as any)) {
    return (payload as any).data as T;
  }
  return payload as T;
}

function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeCatalogItem(input: any, index: number): ExerciseCatalogItem {
  const id = toText(input?.id_ejercicio ?? input?.id ?? input?.exercise_id, `exercise-${index}`);
  const nombre = toText(input?.nombre ?? input?.title ?? input?.name, `Ejercicio ${index + 1}`);
  const descripcion = toText(input?.descripcion ?? input?.description ?? input?.detalle, '');
  const duracion_min = toNumber(input?.duracion_min ?? input?.duracion ?? input?.duration_min);
  const frecuencia_semanal = toNumber(input?.frecuencia_semanal ?? input?.frecuencia ?? input?.weekly_frequency);
  const intensidad = toText(input?.intensidad ?? input?.level ?? input?.intensity, '');
  const categoria = toText(input?.categoria ?? input?.category, '');
  const deporte = toText(input?.deporte ?? input?.sport, '');
  const activo = typeof input?.activo === 'boolean' ? input.activo : typeof input?.is_active === 'boolean' ? input.is_active : undefined;

  return {
    id,
    nombre,
    descripcion: descripcion || undefined,
    duracion_min,
    frecuencia_semanal,
    intensidad: intensidad || undefined,
    categoria: categoria || undefined,
    deporte: deporte || undefined,
    activo,
    ...input,
  };
}

function normalizeTrackingItem(input: any, index: number): ExerciseTrackingItem {
  const nested = input?.ejercicio ?? input?.exercise ?? input;
  const id = toText(nested?.id_ejercicio ?? nested?.id ?? input?.id_ejercicio ?? input?.id, `tracking-${index}`);
  const dailyId = toText(input?.id_ejercicio_diario ?? input?.daily_id ?? input?.exercise_daily_id, '');
  const nombre = toText(nested?.nombre ?? nested?.title ?? nested?.name, `Ejercicio ${index + 1}`);
  const descripcion = toText(nested?.descripcion ?? nested?.description ?? nested?.detalle, '');
  const duracion_min = toNumber(nested?.duracion_min ?? nested?.duracion ?? nested?.duration_min);

  const series = nested?.series ?? input?.series;
  const bloques = nested?.bloques ?? input?.bloques;
  const distancia = nested?.distancia ?? input?.distancia;
  const repeticiones = nested?.repeticiones ?? nested?.reps ?? input?.repeticiones;

  const intensidad = toText(nested?.intensidad ?? nested?.intensity ?? input?.intensidad, '');
  const estado = toText(input?.estado ?? input?.state, '');
  const status = toText(input?.status ?? input?.realizado ?? input?.completed, '');
  const completado =
    typeof input?.completado === 'boolean'
      ? input.completado
      : typeof input?.completed === 'boolean'
        ? input.completed
        : typeof input?.realizado === 'boolean'
          ? input.realizado
          : undefined;
  const hora_registro = toText(input?.hora_registro ?? input?.horaRegistro ?? input?.registered_time, '');

  return {
    id,
    dailyId: dailyId || undefined,
    nombre,
    descripcion: descripcion || undefined,
    duracion_min,
    series,
    bloques,
    distancia,
    repeticiones,
    intensidad: intensidad || undefined,
    status: status || undefined,
    estado: estado || undefined,
    completado,
    hora_registro: hora_registro || undefined,
    raw: input,
  };
}

function normalizeRecommendation(input: any, index: number): ExerciseRecommendation {
  const id_ejercicio = (input?.id_ejercicio ?? input?.id ?? input?.exercise_id ?? input?.exerciseId) as any;
  const nombre = toText(input?.nombre ?? input?.title ?? input?.name, `Ejercicio ${index + 1}`);
  const deporte = toText(input?.deporte ?? input?.sport, '');
  const intensidad = toText(input?.intensidad ?? input?.intensity, '');
  const minutos = toNumber(input?.minutos_sugeridos ?? input?.minutes ?? input?.duracion_min ?? input?.duracion) ?? 0;
  const kcal = toNumber(input?.calorias_quemadas_estimadas ?? input?.estimatedBurnKcal ?? input?.kcal) ?? 0;
  const preferido = typeof input?.preferido === 'boolean' ? input.preferido : Boolean(input?.preferred);
  const advertencia =
    typeof input?.advertencia_clinica === 'string'
      ? input.advertencia_clinica
      : typeof input?.warning === 'string'
        ? input.warning
        : null;

  return {
    id_ejercicio: id_ejercicio ?? `rec-${index}`,
    nombre,
    deporte: deporte || undefined,
    intensidad: intensidad || undefined,
    minutos_sugeridos: Math.max(0, Math.round(minutos)),
    calorias_quemadas_estimadas: Math.max(0, Math.round(kcal)),
    preferido,
    advertencia_clinica: advertencia,
    raw: input,
  };
}

export async function fetchExercisesCatalog(): Promise<ExerciseCatalogItem[]> {
  const pickArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.data)) return value.data;
    if (value.data && typeof value.data === 'object') {
      if (Array.isArray((value.data as any).items)) return (value.data as any).items;
      if (Array.isArray((value.data as any).data)) return (value.data as any).data;
    }
    return [];
  };

  const limit = 100;
  const maxPages = 50;
  const all: ExerciseCatalogItem[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await apiClient.get('/exercises', {
      params: { page, limit },
      timeout: 60_000,
    });
    const data = unwrapApi<unknown>(response.data);
    const arr = pickArray(data);
    const normalized = arr.map(normalizeCatalogItem);
    all.push(...normalized);

    if (arr.length < limit) break;
  }

  const seen = new Set<string>();
  return all.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function fetchExerciseRecommendations(params: { calories: number }): Promise<{
  calorias_a_compensar: number;
  recomendaciones: ExerciseRecommendation[];
}> {
  const calories = Math.max(0, Math.round(params.calories));
  const response = await apiClient.get('/exercises/recommendations', {
    params: { calories },
    timeout: 60_000,
  });
  const data = unwrapApi<any>(response.data);
  const root = data && typeof data === 'object' ? data : {};
  const calorias_a_compensar = toNumber(root?.calorias_a_compensar ?? root?.calories ?? calories) ?? calories;
  const list = Array.isArray(root?.recomendaciones)
    ? root.recomendaciones
    : Array.isArray(root?.recommendations)
      ? root.recommendations
      : Array.isArray(data)
        ? data
        : [];

  const recomendaciones = (Array.isArray(list) ? list : []).slice(0, 8).map(normalizeRecommendation);
  return {
    calorias_a_compensar: Math.max(0, Math.round(calorias_a_compensar)),
    recomendaciones,
  };
}

export async function fetchExerciseTrackingToday(params: { date?: string } = {}): Promise<ExerciseTrackingToday> {
  const response = await apiClient.get('/exercise-tracking/today', {
    params: params.date ? { date: params.date } : undefined,
    timeout: 60_000,
  });
  const data = unwrapApi<unknown>(response.data);
  const root = (data as any) ?? {};
  const list =
    Array.isArray(root?.ejercicios) ? root.ejercicios
    : Array.isArray(root?.exercises) ? root.exercises
    : Array.isArray(root?.items) ? root.items
    : Array.isArray(root?.data) ? root.data
    : Array.isArray(data) ? data
    : [];
  const arr = Array.isArray(list) ? list : [];
  const items = arr.map(normalizeTrackingItem);

  const date = toText(root?.fecha ?? root?.date ?? params.date, params.date ?? '');
  const totalDurationMinRaw = root?.total_duration_min ?? root?.totalDurationMin ?? root?.total_minutes ?? root?.minutes;
  const totalDurationMin = toNumber(totalDurationMinRaw) ?? items.reduce((sum, item) => sum + (item.duracion_min ?? 0), 0);
  const hasExercises =
    typeof root?.tiene_ejercicios_hoy === 'boolean'
      ? root.tiene_ejercicios_hoy
      : typeof root?.hasExercises === 'boolean'
        ? root.hasExercises
        : items.length > 0;
  const message = toText(root?.mensaje ?? root?.message, '');

  return {
    date,
    totalDurationMin: Math.max(0, Math.round(totalDurationMin)),
    hasExercises,
    message: message || undefined,
    items,
  };
}

export async function postExerciseTracking(params: {
  id_ejercicio?: string | number;
  id_ejercicio_diario?: string | number;
  fecha?: string;
  completado: boolean;
  hora_registro?: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    completado: params.completado,
  };

  if (typeof params.hora_registro === 'string' && params.hora_registro.trim().length > 0) {
    payload.hora_registro = params.hora_registro.trim();
  }

  if (typeof params.id_ejercicio_diario !== 'undefined') {
    payload.id_ejercicio_diario = params.id_ejercicio_diario;
  } else if (typeof params.id_ejercicio !== 'undefined') {
    payload.id_ejercicio = params.id_ejercicio;
    payload.fecha = params.fecha;
  }

  await apiClient.post(
    '/exercise-tracking',
    payload,
    { timeout: 60_000 },
  );
}
