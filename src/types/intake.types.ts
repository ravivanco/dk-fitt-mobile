export type IntakeDetectedItem = {
  name: string;
  normalized?: string;
  confidence?: number;
  bbox?: unknown;
  portion?: unknown;
  calories?: number;
};

export type IntakeEstimation = {
  jobId?: string;
  items?: IntakeDetectedItem[];
  totalCalories?: number;
  labels?: Array<{ description: string; score?: number }>;
  notes?: string;
  processedAt?: string;
  // Respuesta actual del backend DK-Fitt
  calorias_estimadas?: number;
  confianza_pct?: number;
  porcion_estimada_g?: number | null;
  fuente_estimacion?: string;
  etiquetas_detectadas?: unknown[];
  texto_detectado?: string | null;
  mensaje?: string;
  [key: string]: unknown;
};

export type UploadResult = {
  url?: string;
  secure_url?: string;
  public_id?: string;
  [key: string]: unknown;
};

export type UploadIntakeImageResponse = {
  upload?: UploadResult;
  estimacion?: IntakeEstimation;
  estimation?: IntakeEstimation;
  [key: string]: unknown;
};

export type AnalyzeImageRequest = {
  imagen_url?: string;
  image_base64?: string;
  imagen_base64?: string;
  descripcion_alimento?: string;
};

export type AnalyzeImageUrlResponse = IntakeEstimation & {
  [key: string]: unknown;
};
