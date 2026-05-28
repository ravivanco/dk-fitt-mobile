import { apiClient } from '@/services/api.client';

export type CalorieControlBalance = {
  date?: string;
  dailyTarget: number;
  consumedCalories: number;
  remainingCalories: number;
  consumedPlanCalories?: number;
  consumedAdditionalCalories?: number;
};

export type CalorieControlMeal = {
  id?: string | number;
  title?: string;
  calories?: number;
  status?: string;
  [key: string]: unknown;
};

export type CalorieControlAdditionalIntake = {
  id_consumo_adicional?: string | number;
  calorias_estimadas?: number;
  status?: string;
  fecha?: string;
  [key: string]: unknown;
};

export type CalorieControlDashboard = {
  balance: CalorieControlBalance;
  meals: CalorieControlMeal[];
  additionalIntakes: CalorieControlAdditionalIntake[];
  raw?: unknown;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeDashboard(raw: unknown): CalorieControlDashboard {
  const root = raw && typeof raw === 'object' ? (raw as any) : {};
  const payload = root?.data ?? root;
  const balanceRaw = payload?.balance ?? payload?.control_calorico ?? payload?.dashboard ?? payload ?? {};

  // ─── LOG TEMPORAL — borrar cuando esté funcionando ───
  if (__DEV__) {
    console.log('[SERVICE] normalizeDashboard raw:', JSON.stringify(raw));
    console.log('[SERVICE] balanceRaw keys:', Object.keys(balanceRaw));
    console.log('[SERVICE] balanceRaw values:', JSON.stringify(balanceRaw));
  }

  // ?? NO funciona con NaN, usar función auxiliar que prueba en orden
  function firstValid(...values: unknown[]): number {
    for (const v of values) {
      const n = toNumber(v, NaN);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  }

  const dailyTarget = firstValid(
    balanceRaw?.dailyTarget,
    balanceRaw?.meta_calorica,
    balanceRaw?.calorias_objetivo,
    balanceRaw?.objetivo_kcal,
    balanceRaw?.meta_kcal,
  );

  const consumedCalories = firstValid(
    balanceRaw?.consumedCalories,
    balanceRaw?.calorias_totales_consumidas,
    balanceRaw?.consumidas_kcal,
    balanceRaw?.total_consumido_kcal,
  );

  const remainingCalories = firstValid(
    balanceRaw?.remainingCalories,
    balanceRaw?.calorias_restantes,
    balanceRaw?.restantes_kcal,
    balanceRaw?.kcal_restantes,
    dailyTarget - consumedCalories, // fallback calculado
  );

  // ─── LOG TEMPORAL ───
  if (__DEV__) {
    console.log('[SERVICE] Resultado normalizado:', { dailyTarget, consumedCalories, remainingCalories });
  }

  const meals = Array.isArray(payload?.meals)
    ? payload.meals
    : Array.isArray(payload?.menus)
      ? payload.menus
      : [];

  const additionalIntakes = Array.isArray(payload?.additionalIntakes)
    ? payload.additionalIntakes
    : Array.isArray(payload?.consumos_adicionales)
      ? payload.consumos_adicionales
      : [];

  return {
    balance: {
      date: typeof balanceRaw?.date === 'string'
        ? balanceRaw.date
        : typeof balanceRaw?.fecha === 'string'
          ? balanceRaw.fecha
          : undefined,
      dailyTarget,
      consumedCalories,
      remainingCalories,
      consumedPlanCalories: firstValid(
        balanceRaw?.consumedPlanCalories,
        balanceRaw?.calorias_plan_consumidas,
        balanceRaw?.plan_consumido_kcal,
      ) || undefined,
      consumedAdditionalCalories: firstValid(
        balanceRaw?.consumedAdditionalCalories,
        balanceRaw?.calorias_adicionales,
        balanceRaw?.adicional_consumido_kcal,
      ) || undefined,
    },
    meals,
    additionalIntakes,
    raw,
  };
}

export async function fetchCalorieControlDashboard(date: string): Promise<CalorieControlDashboard> {
  const response = await apiClient.get('/calorie-control/dashboard', { params: { date } });
  return normalizeDashboard(response.data);
}
