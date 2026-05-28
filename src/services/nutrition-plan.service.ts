import { apiClient } from '@/services/api.client';

export type ActiveNutritionPlan = {
  id_plan: number | string;
  estado?: string;
  modulo_habilitado: boolean;
  fecha_inicio?: string;
  [key: string]: unknown;
};

export type ActiveNutritionPlanPayload = {
  tiene_plan_activo?: boolean;
  plan?: ActiveNutritionPlan;
  semana_actual?: { id_semana?: number | string; numero?: number | string; [key: string]: unknown };
  semanas?: NutritionPlanWeekApi[];
  dias?: NutritionPlanDayApi[];
  [key: string]: unknown;
};

export type NutritionPlanMenuApi = {
  id_menu_diario?: number | string;
  id_plato?: number | string;
  nombre_plato?: string;
  calorias_aportadas?: number | string;
  estado?: string;
  realizado?: boolean;
  tiempo_comida?: string;
  [key: string]: unknown;
};

export type NutritionPlanDayApi = {
  id_dia_plan?: number | string;
  dia_semana?: string;
  fecha?: string;
  menus?: NutritionPlanMenuApi[];
  comidas?: NutritionPlanMenuApi[];
  meals?: NutritionPlanMenuApi[];
  [key: string]: unknown;
};

export type NutritionPlanWeekApi = {
  id_semana?: number | string;
  numero?: number | string;
  fecha_inicio_semana?: string;
  fecha_fin_semana?: string;
  dias?: NutritionPlanDayApi[];
  days?: NutritionPlanDayApi[];
  [key: string]: unknown;
};

function unwrapApi<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && (payload as any).success === true && 'data' in (payload as any)) {
    return (payload as any).data as T;
  }
  return payload as T;
}

function unwrapDeep<T>(payload: unknown): T {
  let current: any = payload;
  for (let depth = 0; depth < 3; depth += 1) {
    current = unwrapApi<any>(current);
    if (current && typeof current === 'object' && 'data' in current) {
      // Algunos endpoints pueden devolver `{ data: { success, data: ... } }`
      // o volver a envolver el payload en `.data`.
      // El loop se encarga de iterar hasta el contenido final.
      continue;
    }
    break;
  }
  return current as T;
}

export async function fetchActiveNutritionPlan(): Promise<ActiveNutritionPlan | null> {
  const response = await apiClient.get('/nutrition-plans/me/active', { timeout: 60_000 });
  const data = unwrapDeep<any>(response.data);
  if (!data || typeof data !== 'object') return null;
  const plan = data?.plan ?? data?.activePlan ?? data;
  if (!plan || typeof plan !== 'object') return null;
  return {
    ...plan,
    modulo_habilitado: Boolean((plan as any).modulo_habilitado),
  } as ActiveNutritionPlan;
}

export async function fetchActiveNutritionPlanPayload(): Promise<ActiveNutritionPlanPayload | null> {
  const response = await apiClient.get('/nutrition-plans/me/active', { timeout: 60_000 });
  const data = unwrapDeep<any>(response.data);
  if (!data || typeof data !== 'object') return null;
  return data as ActiveNutritionPlanPayload;
}

export async function fetchNutritionPlanWeeks(planId: string | number): Promise<NutritionPlanWeekApi[]> {
  const response = await apiClient.get(`/nutrition-plans/${encodeURIComponent(String(planId))}/weeks`, { timeout: 60_000 });
  const data = unwrapDeep<any>(response.data);
  if (__DEV__) {
    const keys = data && typeof data === 'object' ? Object.keys(data) : [];
    console.log('[nutrition-plan][weeks] unwrapped keys', keys.slice(0, 30));
  }
  const weeks = data?.semanas ?? data?.weeks ?? data?.data ?? data;
  return Array.isArray(weeks) ? (weeks as NutritionPlanWeekApi[]) : [];
}
