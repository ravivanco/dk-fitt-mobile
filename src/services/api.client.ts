import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types/auth.types';

/**
 * URL base de la API.
 * En desarrollo: tu API local
 * En producción: la API en Render
 *
 * Cambia esta URL según tu entorno:
 */
const API_BASE_URL = 'https://dk-fitt-api.onrender.com/api';
// Para desarrollo local descomenta esta línea y comenta la de arriba:
// const API_BASE_URL = 'http://192.168.X.X:3000/api';
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
  (response) => response,

  // Error — lo convierte en un mensaje claro
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      // La API respondió con un error (4xx, 5xx)
      const apiError = error.response.data;

      // Si la API retornó un error estructurado, lo lanzamos tal cual
      if (apiError?.error?.message) {
        return Promise.reject(new Error(apiError.error.message));
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

      const message = statusMessages[error.response.status] ?? 'Error desconocido';
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      // La petición se envió pero no hubo respuesta (sin internet, API caída)
      return Promise.reject(
        new Error('Sin conexión. Verifica tu internet e intenta de nuevo.')
      );
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