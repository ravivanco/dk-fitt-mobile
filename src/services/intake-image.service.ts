import { apiClient } from './api.client';
import { ApiSuccessResponse } from '@/types/auth.types';
import {
  AnalyzeImageUrlRequest,
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
  const items = Array.isArray(record.items) ? (record.items as any[]) : undefined;

  const caloriasEstimadas =
    typeof record.calorias_estimadas === 'number' ? (record.calorias_estimadas as number) : undefined;
  const confianzaPct =
    typeof record.confianza_pct === 'number' ? (record.confianza_pct as number) : undefined;

  const totalCalories =
    typeof record.totalCalories === 'number'
      ? record.totalCalories
      : typeof record.total_calories === 'number'
        ? (record.total_calories as number)
        : typeof caloriasEstimadas === 'number'
          ? caloriasEstimadas
        : undefined;

  return {
    ...record,
    items,
    totalCalories,
    calorias_estimadas: caloriasEstimadas,
    confianza_pct: confianzaPct,
  };
}

export const intakeImageService = {
  async analyzeImageUrl(body: AnalyzeImageUrlRequest): Promise<AnalyzeImageUrlResponse> {
    const response = await apiClient.post('/image-calorie-analyzer/analyze', body, { timeout: 30_000 });
    const data = unwrapApi<AnalyzeImageUrlResponse>(response.data);
    return normalizeEstimation(data) as AnalyzeImageUrlResponse;
  },

  async analyzeAdditionalIntake(body: AnalyzeImageUrlRequest): Promise<AnalyzeImageUrlResponse> {
    const response = await apiClient.post('/additional-intake/analyze', body, { timeout: 30_000 });
    const data = unwrapApi<AnalyzeImageUrlResponse>(response.data);
    return normalizeEstimation(data) as AnalyzeImageUrlResponse;
  },

  async uploadIntakeImage(params: {
    imageUri: string;
    descripcion_alimento?: string;
  }): Promise<UploadIntakeImageResponse> {
    const formData = new FormData();

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
      timeout: 30_000,
    });

    const data = unwrapApi<UploadIntakeImageResponse>(response.data);

    const estimationRaw =
      (data && typeof data === 'object' && (data as any).estimacion) ? (data as any).estimacion :
      (data && typeof data === 'object' && (data as any).estimation) ? (data as any).estimation :
      data;

    return {
      ...(data && typeof data === 'object' ? data : {}),
      estimacion: normalizeEstimation(estimationRaw),
    } as UploadIntakeImageResponse;
  },
};
