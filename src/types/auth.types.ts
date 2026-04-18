/**
 * Tipos TypeScript para el módulo de autenticación.
 * Coinciden exactamente con lo que retorna la API DK Fitt.
 */

// ── Request types (lo que enviamos a la API) ──────────────────

export interface LoginRequest {
  correo_institucional: string;
  contrasena:           string;
}

export interface RegisterRequest {
  correo_institucional: string;
  contrasena:           string;
  nombres:              string;
  apellidos:            string;
  edad:                 number;
  sexo:                 'M' | 'F' | 'O';
  fecha_nacimiento:     string; // formato YYYY-MM-DD
}

// ── Tipos para Onboarding ──────────────────────────────────────

export interface Condicion {
  id_condicion: number;
  nombre: string;
}

export interface AlimentoItem {
  id_alimento: number;
  nombre_alimento: string;
}

export interface OnboardingData {
  nivel_actividad_fisica: string;
  objetivo: string;
  alergias_intolerancias: string;
  restricciones_alimenticias: string;
  condiciones: Condicion[];
  alimentos_preferidos: AlimentoItem[];
  alimentos_restringidos: AlimentoItem[];
  deportes: string[];
}

// ── Response types (lo que retorna la API) ────────────────────

export interface AuthUser {
  id_usuario:            number;
  nombres:               string;
  apellidos:             string;
  correo_institucional:  string;
  rol:                   'paciente' | 'nutricionista' | 'administrador';
  fecha_nacimiento?:     string; // opcional
  edad?:                 number; // opcional, viene del API
  sexo?:                 'M' | 'F' | 'O';
  formulario_completado: boolean;
  modulo_habilitado:     boolean;
  onboarding?:           OnboardingData;
  evaluacion_clinica?:   {
    id_evaluacion: number;
    id_perfil: number;
    id_nutricionista: number;
    fecha_evaluacion: string;
    peso_kg: string;
    altura_cm: string;
    porcentaje_grasa: string;
    masa_muscular_kg: string;
    otros_indicadores: any;
    calorias_diarias_calculadas: number;
    distribucion_carbohidratos_pct: number;
    distribucion_proteinas_pct: number;
    distribucion_grasas_pct: number;
    imc: string;
    agua_corporal_pct?: string;
    masa_osea_kg?: string;
    grasa_visceral?: string;
    tmb_kcal?: string;
    created_at: string;
  };
}

export interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
  token_type:    string;
  user:          AuthUser;
}

export interface RegisterResponse {
  id_usuario:           number;
  correo_institucional: string;
  nombres:              string;
  apellidos:            string;
  rol:                  string;
  formulario_completado: boolean;
}

// ── Respuesta estándar de la API ───────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data:    T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code:    string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Estado de sesión guardado en AsyncStorage ─────────────────

export interface AuthSession {
  access_token:  string;
  refresh_token: string;
  user:          AuthUser;
  expires_at:    number; // timestamp Unix cuando expira el access_token
}