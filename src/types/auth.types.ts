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

// ── Response types (lo que retorna la API) ────────────────────

export interface AuthUser {
  id_usuario:           number;
  nombres:              string;
  apellidos:            string;
  correo_institucional: string;
  rol:                  'paciente' | 'nutricionista' | 'administrador';
  formulario_completado: boolean;
  modulo_habilitado:    boolean;
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