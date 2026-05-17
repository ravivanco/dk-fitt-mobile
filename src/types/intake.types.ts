export type IntakeDetectedItem = {
  name: string;
  normalized?: string;
  confidence?: number;
  bbox?: unknown;
  portion?: unknown;
  calories?: number;
};

export type IntakeDetectedFood = {
  nombre: string;
  cantidad_g?: number | null;
  calorias?: number | null;
  [key: string]: unknown;
};

export type IntakeMacros = {
  proteinas_g?: number | null;
  carbohidratos_g?: number | null;
  grasas_g?: number | null;
  [key: string]: unknown;
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
  alimentos_detectados?: IntakeDetectedFood[];
  macros?: IntakeMacros;
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
  imagen_url?: string;
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
