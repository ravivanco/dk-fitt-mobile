import { apiClient } from './api.client';
import * as FileSystem from 'expo-file-system/legacy';
import { ApiSuccessResponse } from '@/types/auth.types';
import {
  AnalyzeImageRequest,
  AnalyzeImageUrlResponse,
  IntakeEstimation,
  UploadIntakeImageResponse,
} from '@/types/intake.types';

function guessMimeType(uri: string): string {
  const lowered = uri.toLowerCase();
  if (lowered.endsWith('.png')) return 'image/png';
  if (lowered.endsWith('.webp')) return 'image/webp';
  if (lowered.endsWith('.heic')) return 'image/heic';
  if (lowered.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
}

function guessFileName(uri: string): string {
  const base = uri.split('/').pop() ?? 'intake.jpg';
  if (base.includes('.')) return base;
  return `${base}.jpg`;
}

function unwrapApi<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && (payload as any).success === true && 'data' in (payload as any)) {
    return (payload as ApiSuccessResponse<T>).data;
  }
  return payload as T;
}

function normalizeEstimation(input: unknown): IntakeEstimation {
  if (!input || typeof input !== 'object') return {};

  const record = input as Record<string, unknown>;
  const itemsFromApi = Array.isArray(record.items) ? (record.items as any[]) : undefined;

  const alimentosDetectados = Array.isArray(record.alimentos_detectados)
    ? (record.alimentos_detectados as any[])
    : undefined;

  const itemsFromAlimentos =
    alimentosDetectados?.map((food) => {
      const name = typeof food?.nombre === 'string' ? food.nombre : undefined;
      const caloriesRaw = food?.calorias;
      const calories = typeof caloriesRaw === 'number' ? caloriesRaw : undefined;
      return name ? { name, calories } : null;
    }).filter(Boolean) ?? undefined;

  // Extraer calorias_estimadas con coerción de string→number
  const caloriasEstimadas = (() => {
    if (typeof record.calorias_estimadas === 'number') return record.calorias_estimadas as number;
    if (typeof record.calorias_estimadas === 'string') {
      const parsed = Number(record.calorias_estimadas);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  })();

  const confianzaPct = (() => {
    if (typeof record.confianza_pct === 'number') return record.confianza_pct as number;
    if (typeof record.confianza_pct === 'string') {
      const parsed = Number(record.confianza_pct);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  })();

  // totalCalories: priorizar campo explícito, luego calorias_estimadas
  const totalCalories =
    typeof record.totalCalories === 'number'
      ? (record.totalCalories as number)
      : typeof record.total_calories === 'number'
        ? (record.total_calories as number)
        : typeof caloriasEstimadas === 'number'
          ? caloriasEstimadas
          : undefined;

  // Construir resultado: el spread pone todos los campos del record primero,
  // luego sobreescribimos SOLO los campos que tenemos un valor normalizado.
  const result: IntakeEstimation = {
    ...record,
    alimentos_detectados: alimentosDetectados ?? (record.alimentos_detectados as any),
    items: itemsFromApi ?? itemsFromAlimentos ?? (record.items as any),
  };

  // Solo sobreescribir si tenemos valor real (evita borrar con undefined)
  if (typeof caloriasEstimadas === 'number') result.calorias_estimadas = caloriasEstimadas;
  if (typeof confianzaPct === 'number') result.confianza_pct = confianzaPct;
  if (typeof totalCalories === 'number') result.totalCalories = totalCalories;

  return result;
}

export const intakeImageService = {
  async analyzeImageUrl(params: { imagen_url: string; descripcion_alimento?: string }): Promise<AnalyzeImageUrlResponse> {
    return this.analyzeImage({
      imagen_url: params.imagen_url,
      descripcion_alimento: params.descripcion_alimento,
    });
  },

  async analyzeLocalImage(params: { imageUri: string; descripcion_alimento?: string }): Promise<AnalyzeImageUrlResponse> {
    const base64 = await FileSystem.readAsStringAsync(params.imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const dataUri = `data:${guessMimeType(params.imageUri)};base64,${base64}`;

    return this.analyzeImage({
      image_base64: base64,
      imagen_base64: dataUri,
      descripcion_alimento: params.descripcion_alimento,
    });
  },

  async analyzeImage(body: AnalyzeImageRequest): Promise<AnalyzeImageUrlResponse> {
    const response = await apiClient.post('/image-calorie-analyzer/analyze', body, { timeout: 60_000 });
    const data = unwrapApi<AnalyzeImageUrlResponse>(response.data);
    return normalizeEstimation(data) as AnalyzeImageUrlResponse;
  },

  async analyzeAdditionalIntake(body: AnalyzeImageRequest): Promise<AnalyzeImageUrlResponse> {
    const response = await apiClient.post('/additional-intake/analyze', body, { timeout: 60_000 });
    const data = unwrapApi<AnalyzeImageUrlResponse>(response.data);
    return normalizeEstimation(data) as AnalyzeImageUrlResponse;
  },

  async uploadIntakeImage(params: {
    imageUri: string;
    descripcion_alimento?: string;
  }): Promise<UploadIntakeImageResponse> {
    const formData = new FormData();

    // Backend actual espera el campo `image` (ver mensaje 400: "Usa el campo \"image\"")
    formData.append('image', {
      uri: params.imageUri,
      name: guessFileName(params.imageUri),
      type: guessMimeType(params.imageUri),
    } as any);

    if (typeof params.descripcion_alimento === 'string' && params.descripcion_alimento.trim().length > 0) {
      formData.append('descripcion_alimento', params.descripcion_alimento.trim());
    }

    const response = await apiClient.post('/upload/intake-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60_000,
    });

    const data = unwrapApi<UploadIntakeImageResponse>(response.data);
    if (!data || typeof data !== 'object') {
      return {} as UploadIntakeImageResponse;
    }

    const imagen_url =
      typeof (data as any).imagen_url === 'string'
        ? (data as any).imagen_url
        : typeof (data as any).url === 'string'
          ? (data as any).url
          : typeof (data as any).secure_url === 'string'
            ? (data as any).secure_url
            : typeof (data as any).upload?.secure_url === 'string'
              ? (data as any).upload.secure_url
              : typeof (data as any).upload?.url === 'string'
                ? (data as any).upload.url
                : undefined;

    const estimationRaw =
      (data as any).estimacion ?? (data as any).estimation ?? (data as any).data ?? data;

    return {
      ...(data as any),
      imagen_url,
      estimacion: normalizeEstimation(estimationRaw),
    } as UploadIntakeImageResponse;
  },
};
