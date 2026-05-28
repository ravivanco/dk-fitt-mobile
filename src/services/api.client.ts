import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ApiErrorResponse } from '../types/auth.types';

/**
 * URL base de la API.
 * En desarrollo: tu API local
 * En producción: la API en Render
 *
 * Cambia esta URL según tu entorno:
 */
function safeParseJson(input: unknown) {
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return input;
  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

function sanitizeHeaders(headers: unknown) {
  if (!headers || typeof headers !== 'object') return headers;
  const record = headers as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'cookie' || lower === 'set-cookie') {
      next[key] = value ? '[REDACTED]' : value;
      continue;
    }
    next[key] = value;
  }
  return next;
}

const DEFAULT_API_BASE_URL = 'https://dk-fitt-api.onrender.com/api';

/**
 * Puedes sobreescribir el backend desde `.env` / variables de Expo:
 * `EXPO_PUBLIC_API_BASE_URL=https://tu-backend/api`
 */
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');
// Para desarrollo local descomenta esta línea y comenta la de arriba:
// EXPO_PUBLIC_API_BASE_URL='http://192.168.X.X:3000/api'
// (reemplaza X.X con tu IP local — la que ves en ipconfig)

/**
 * Cliente HTTP base de la app DK Fitt.
 * Todas las peticiones a la API usan esta instancia.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

/**
 * Interceptor de peticiones.
 * Se ejecuta ANTES de enviar cada petición.
 * Aquí podemos inyectar el token JWT automáticamente.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (__DEV__) {
      const url = config.url ?? '';
      if (
        url.includes('/patient-profile') ||
        url.includes('/foods') ||
        url.includes('/meal-tracking') ||
        url.includes('/dishes') ||
        url.includes('/image-calorie-analyzer') ||
        url.includes('/upload/intake-image') ||
        url.includes('/additional-intake')
      ) {
        console.log('[api][request]', {
          method: config.method,
          url,
          hasAuth: Boolean(config.headers?.Authorization),
          timeout: config.timeout,
          data: config.data,
          params: config.params,
        });
      }
    }

    // El token se inyecta desde authStore cuando se necesita.
    // Ver: src/store/auth.store.ts → setAuthHeader()
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Interceptor de respuestas.
 * Se ejecuta después de recibir cada respuesta.
 * Captura errores y los convierte en mensajes legibles.
 */
apiClient.interceptors.response.use(
  // Respuesta exitosa — la deja pasar tal cual
  (response) => {
    if (__DEV__) {
      const url = response.config?.url ?? '';
      if (
        url.includes('/patient-profile') ||
        url.includes('/foods') ||
        url.includes('/meal-tracking') ||
        url.includes('/dishes') ||
        url.includes('/image-calorie-analyzer') ||
        url.includes('/upload/intake-image') ||
        url.includes('/additional-intake')
      ) {
        console.log('[api][response]', {
          status: response.status,
          url,
          data: response.data,
        });
      }
    }

    return response;
  },

  // Error — lo convierte en un mensaje claro
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config;

    if (__DEV__) {
      const cfg = error.config as any;
      const responseData = safeParseJson(error.response?.data);
      const requestData = safeParseJson(cfg?.data);
      console.log('[api][error]', {
        url: cfg?.url,
        baseURL: cfg?.baseURL,
        method: cfg?.method,
        timeout: cfg?.timeout,
        code: (error as any).code,
        message: error.message,
        hasResponse: Boolean(error.response),
        status: error.response?.status,
        request: {
          params: cfg?.params,
          data: requestData,
          headers: sanitizeHeaders(cfg?.headers),
        },
        response: {
          headers: sanitizeHeaders(error.response?.headers),
          data: responseData,
          // Metro/Chrome suelen colapsar Arrays/Objects como [Array]/[Object]. Esta cadena ayuda a ver `details` completos.
          dataJson:
            (() => {
              try {
                return JSON.stringify(responseData);
              } catch {
                return undefined;
              }
            })(),
        },
      });
    }
    
    // Si el error es 401 (Token expirado/inválido), intentamos renovar
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;
      try {
        const rawSession = await AsyncStorage.getItem('@dk_fitt:auth_session');
        if (rawSession) {
          const session = JSON.parse(rawSession);
          if (session.refresh_token) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: session.refresh_token,
            });
            
            const { access_token, refresh_token, expires_in } = response.data;
            
            session.access_token = access_token;
            if (refresh_token) session.refresh_token = refresh_token;
            if (expires_in) session.expires_at = Date.now() + expires_in * 1000;
            
            await AsyncStorage.setItem('@dk_fitt:auth_session', JSON.stringify(session));
            
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            if (originalRequest.headers) {
               originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            
            return apiClient(originalRequest);
          }
        }
      } catch (refreshErr) {
        await AsyncStorage.removeItem('@dk_fitt:auth_session');
        delete apiClient.defaults.headers.common['Authorization'];
        router.replace('/auth/login');
        return Promise.reject(new Error('Sesión finalizada de forma segura. Por favor, ingresa de nuevo para continuar.'));
      }
    }

    if (error.response) {
      // La API respondió con un error (4xx, 5xx)
      const apiError = error.response.data as
        | ApiErrorResponse
        | { message?: string; error?: string | { message?: string; details?: Array<{ field: string; message: string }> } }
        | undefined;
      const apiErrorRecord = apiError as {
        message?: string;
        error?: string | { message?: string; details?: Array<{ field: string; message: string }> };
      } | undefined;

      // Si la API retornó un error estructurado, lo lanzamos tal cual
      const structuredMessage =
        typeof apiErrorRecord?.error === 'object' ? apiErrorRecord.error?.message : undefined;
      const plainMessage =
        typeof apiErrorRecord?.message === 'string'
          ? apiErrorRecord.message
          : typeof apiErrorRecord?.error === 'string'
            ? apiErrorRecord.error
            : undefined;

      const detailMessage =
        typeof apiErrorRecord?.error === 'object' && Array.isArray(apiErrorRecord.error?.details)
          ? apiErrorRecord.error.details
              .map((d) => `${d.field}: ${d.message}`)
              .join(' | ')
          : '';

      const backendMessage = structuredMessage ?? plainMessage;
      if (backendMessage) {
        const combined = detailMessage ? `${backendMessage} (${detailMessage})` : backendMessage;
        const normalizedError = Object.assign(new Error(combined), {
          backendData: apiErrorRecord,
          status: error.response.status,
        });
        return Promise.reject(normalizedError);
      }

      // Errores HTTP genéricos
      const statusMessages: Record<number, string> = {
        400: 'Datos de entrada inválidos',
        401: 'Credenciales inválidas',
        403: 'No tienes permiso para esta acción',
        404: 'Recurso no encontrado',
        409: 'Este correo ya está registrado',
        422: 'Datos inválidos. Revisa la información e inténtalo de nuevo',
        429: 'Demasiados intentos. Espera 15 minutos.',
        500: 'Error del servidor. Intenta más tarde.',
        503: 'Servicio no disponible temporalmente.',
      };

      const message = statusMessages[error.response.status] ?? `Error HTTP ${error.response.status}`;
      const normalizedError = Object.assign(new Error(message), {
        backendData: apiErrorRecord,
        status: error.response.status,
      });
      return Promise.reject(normalizedError);
    }

    const networkCode = (error as any).code as string | undefined;
    if (networkCode === 'ECONNABORTED') {
      return Promise.reject(new Error('La solicitud tardó demasiado (timeout). Intenta de nuevo.'));
    }

    if (error.request) {
      // La petición se envió pero no hubo respuesta (sin internet, API caída)
      return Promise.reject(new Error('Sin conexión. Verifica tu internet e intenta de nuevo.'));
    }

    // Error al configurar la petición
    return Promise.reject(new Error('Error al conectar con el servidor.'));
  },
);

/**
 * Agrega el token JWT a todas las peticiones siguientes.
 * Se llama después del login.
 */
export const setAuthHeader = (token: string): void => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Elimina el token JWT de las peticiones.
 * Se llama después del logout.
 */
export const removeAuthHeader = (): void => {
  delete apiClient.defaults.headers.common['Authorization'];
};
