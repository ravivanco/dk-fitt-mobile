import { apiClient }          from './api.client';
import { OnboardingData }     from '../context/onboarding-context';
import { ApiSuccessResponse } from '../types/auth.types';

type FoodCatalogItem = {
  id: number;
  name: string;
  slug?: string;
};

/**
 * Mapeo de condición médica (valor del formulario) al id_condicion de la BD.
 * Estos IDs coinciden con los datos iniciales del script SQL.
 */
const CONDICION_ID_MAP: Record<string, number> = {
  diabetes:      1,
  hipertension:  2,
  hipotiroidismo: 3,
  resistencia:   4,
  ninguna:       5,
};

/**
 * Mapeo de objetivo (valor del formulario) al texto exacto que acepta la API.
 */
const OBJETIVO_MAP: Record<string, string> = {
  reducir: 'Reducir mi peso corporal',
  ganar:   'Ganar masa muscular',
  habitos: 'Mejorar mis hábitos alimenticios',
};

/**
 * Mapeo de nivel de actividad del formulario al valor exacto de la API.
 */
const ACTIVIDAD_MAP: Record<string, string> = {
  sedentario: 'sedentario',
  bajo:       'bajo',
  mediano:    'medio',  // ← el form usa 'mediano', la API usa 'medio'
  alto:       'alto',
};

/**
 * Mapeo de deporte del formulario al valor del CHECK constraint de la BD.
 */
const DEPORTE_MAP: Record<string, string> = {
  gym:      'gimnasio',
  running:  'running',
  football: 'futbol',
  basket:   'basquet',
  cycling:  'ciclismo',
  swimming: 'natacion',
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

const extractFoodCatalogItems = (input: unknown): FoodCatalogItem[] => {
  const items: FoodCatalogItem[] = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!node || typeof node !== 'object') return;

    const record = node as Record<string, unknown>;
    const id =
      typeof record.id === 'number'
        ? record.id
        : typeof record.id_alimento === 'number'
          ? record.id_alimento
          : typeof record.food_id === 'number'
            ? record.food_id
            : null;
    const name =
      typeof record.nombre === 'string'
        ? record.nombre
        : typeof record.name === 'string'
          ? record.name
          : typeof record.nombre_alimento === 'string'
            ? record.nombre_alimento
            : typeof record.food_name === 'string'
              ? record.food_name
          : typeof record.alimento === 'string'
            ? record.alimento
            : null;
    const slug =
      typeof record.slug === 'string'
        ? record.slug
        : typeof record.codigo === 'string'
          ? record.codigo
          : typeof record.code === 'string'
            ? record.code
          : null;

    if (id !== null && name) {
      items.push({ id, name, slug: slug ?? undefined });
    }

    Object.values(record).forEach(visit);
  };

  visit(input);
  return items;
};

const buildFoodIdMap = (items: FoodCatalogItem[]): Map<string, number> => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    map.set(normalizeText(item.name), item.id);
    if (item.slug) {
      map.set(normalizeText(item.slug), item.id);
    }
  });

  return map;
};

const resolveFoodIds = (tokens: string[], foodIdMap: Map<string, number>): number[] => {
  const resolved = tokens
    .map((token) => {
      const directNumber = Number(token);
      if (Number.isInteger(directNumber) && directNumber > 0) {
        return directNumber;
      }

      return foodIdMap.get(normalizeText(token));
    })
    .filter((id): id is number => typeof id === 'number');

  return Array.from(new Set(resolved));
};

const fetchFoodIdMap = async (): Promise<Map<string, number>> => {
  const sources: unknown[] = [];
  const debugSourceLabels: string[] = [];

  try {
    const optionsResponse = await apiClient.get<ApiSuccessResponse<unknown>>('/patient-profile/options');
    sources.push(optionsResponse.data);
    debugSourceLabels.push('patient-profile/options:ok');
    if (__DEV__) {
      console.log('[onboarding] catalog endpoint ok -> /patient-profile/options');
    }
  } catch (error) {
    if (__DEV__) {
      const status = (error as { status?: number; response?: { status?: number } })?.status
        ?? (error as { response?: { status?: number } })?.response?.status;
      const backendData = (error as { backendData?: unknown; response?: { data?: unknown } })?.backendData
        ?? (error as { response?: { data?: unknown } })?.response?.data;
      console.error('[onboarding] catalog endpoint fail -> /patient-profile/options', { status, backendData });
    }
  }

  try {
    const foodsResponse = await apiClient.get<ApiSuccessResponse<unknown>>('/foods?limit=500');
    sources.push(foodsResponse.data);
    debugSourceLabels.push('foods:ok');
    if (__DEV__) {
      console.log('[onboarding] catalog endpoint ok -> /foods?limit=500');
    }
  } catch (error) {
    if (__DEV__) {
      const status = (error as { status?: number; response?: { status?: number } })?.status
        ?? (error as { response?: { status?: number } })?.response?.status;
      const backendData = (error as { backendData?: unknown; response?: { data?: unknown } })?.backendData
        ?? (error as { response?: { data?: unknown } })?.response?.data;
      console.error('[onboarding] catalog endpoint fail -> /foods?limit=500', { status, backendData });
    }
  }

  const catalogItems = sources.flatMap(extractFoodCatalogItems);
  if (__DEV__) {
    console.log('[onboarding] catalog sources used:', debugSourceLabels);
    console.log('[onboarding] catalog items extracted:', catalogItems.length);
    console.log('[onboarding] catalog preview:', catalogItems.slice(0, 10));
  }
  return buildFoodIdMap(catalogItems);
};

/**
 * Servicio de perfil del paciente.
 * Convierte los datos del formulario al formato exacto que espera la API.
 */
export const profileService = {

  /**
   * Guarda el perfil inicial del paciente.
   * Se llama una sola vez al finalizar el onboarding (Form07).
   *
   * Endpoint: PUT /api/patient-profile/me
   */
  async saveOnboardingProfile(formData: OnboardingData): Promise<void> {

    const foodIdMap = await fetchFoodIdMap();

    const safePreferidos = Array.isArray(formData.alimentos_preferidos)
      ? formData.alimentos_preferidos
      : [];
    const safeRestringidos = Array.isArray(formData.alimentos_restringidos)
      ? formData.alimentos_restringidos
      : [];
    const safeRestricciones =
      typeof formData.restricciones_alimenticias === 'string'
        ? formData.restricciones_alimenticias
        : '';

    // Convertir nivel de actividad
    const nivel_actividad_fisica = ACTIVIDAD_MAP[formData.nivel_actividad_fisica]
      ?? formData.nivel_actividad_fisica;

    // Convertir condición médica a array de IDs (la API espera un array)
    const id_condicion = CONDICION_ID_MAP[formData.condicion_medica] ?? 5;
    const condiciones  = [id_condicion];

    // Convertir objetivo al texto exacto
    const objetivo = OBJETIVO_MAP[formData.objetivo] ?? formData.objetivo;

    // Convertir deporte al valor del CHECK constraint
    const deporte_mapeado = DEPORTE_MAP[formData.deporte]
      ?? formData.deporte
      ?? 'ninguno';

    // Convertir alimentos preferidos a IDs numéricos.
    const preferidosTokens = safePreferidos.map((key) => {
      const parts = key.split(':');
      return parts[1] ?? key;
    });
    const alimentos_preferidos = resolveFoodIds(preferidosTokens, foodIdMap);
    const preferidosNoMapeados = preferidosTokens.filter(
      (token) => !alimentos_preferidos.includes(Number(token)) && !foodIdMap.has(normalizeText(token)),
    );

    // Convertir alimentos restringidos (seleccionados) a IDs numéricos.
    const restringidosTokens = safeRestringidos.map((key) => {
      const parts = key.split(':');
      return parts[1] ?? key;
    });
    const alimentos_restringidos = resolveFoodIds(restringidosTokens, foodIdMap);
    const restringidosNoMapeados = restringidosTokens.filter(
      (token) => !alimentos_restringidos.includes(Number(token)) && !foodIdMap.has(normalizeText(token)),
    );

    // Construir el body para la API
    const body = {
      nivel_actividad_fisica,
      objetivo,
      alergias_intolerancias: formData.alergias_intolerancias.trim() || null,
      restricciones_alimenticias: safeRestricciones.trim() || null,
      condiciones,
      deportes: [deporte_mapeado],
      ...(alimentos_preferidos.length > 0 ? { alimentos_preferidos } : {}),
      ...(alimentos_restringidos.length > 0 ? { alimentos_restringidos } : {}),
    };

    if (__DEV__) {
      console.log('Food catalog size:', foodIdMap.size);
      console.log('Preferidos tokens UI:', preferidosTokens);
      console.log('Restringidos tokens UI:', restringidosTokens);
      console.log('Resolved food IDs (preferidos):', alimentos_preferidos);
      console.log('Resolved food IDs (restringidos):', alimentos_restringidos);
      console.log('Unmapped preferidos tokens:', preferidosNoMapeados);
      console.log('Unmapped restringidos tokens:', restringidosNoMapeados);
      console.log('Payload onboarding -> /patient-profile/me', body);
    }

    try {
      const response = await apiClient.put<ApiSuccessResponse<unknown>>(
        '/patient-profile/me',
        body,
      );

      if (__DEV__) {
        console.log('[onboarding] save success -> /patient-profile/me', {
          status: response.status,
          data: response.data,
        });
      }
    } catch (error) {
      if (__DEV__) {
        const status = (error as { status?: number; response?: { status?: number } })?.status
          ?? (error as { response?: { status?: number } })?.response?.status;
        const backendData = (error as { backendData?: unknown; response?: { data?: unknown } })?.backendData
          ?? (error as { response?: { data?: unknown } })?.response?.data;
        console.error('[onboarding] save fail -> /patient-profile/me', {
          status,
          backendData,
          payload: body,
        });
      }

      throw error;
    }
  },

};