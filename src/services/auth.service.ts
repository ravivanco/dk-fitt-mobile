import { apiClient }             from './api.client';
import { authStore }             from '../store/auth.store';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiSuccessResponse,
  AuthUser,
} from '../types/auth.types';

/**
 * Servicio de autenticación.
 * Conecta la app con los endpoints /api/auth/* de la API DK Fitt.
 */
export const authService = {

  /**
   * Inicia sesión con correo y contraseña.
   *
   * Flujo:
   * 1. Llama a POST /api/auth/login
   * 2. Si es exitoso, guarda la sesión en AsyncStorage
   * 3. Retorna los datos del usuario para la navegación
   *
   * @throws Error con mensaje legible si falla
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>(
      '/auth/login',
      credentials,
    );

    const data = response.data.data;

    // Guardar sesión en AsyncStorage y configurar Axios
    await authStore.saveSession({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_in:    data.expires_in,
      user:          data.user,
    });

    return data;
  },


  /**
   * Registra un nuevo paciente.
   *
   * Flujo:
   * 1. Llama a POST /api/auth/register
   * 2. Si es exitoso, retorna los datos del usuario creado
   * 3. NO guarda sesión — el usuario debe hacer login explícito
   *
   * @throws Error con mensaje legible si falla
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiSuccessResponse<RegisterResponse>>(
      '/auth/register',
      userData,
    );

    return response.data.data;
  },


  /**
   * Obtiene los datos del usuario autenticado desde la API.
   * Requiere tener el token configurado en Axios.
   *
   * @throws Error si no hay sesión activa
   */
  async getProfile(): Promise<AuthUser> {
    const response = await apiClient.get<ApiSuccessResponse<{
      id:        number;
      email:     string;
      role:      string;
      id_perfil: number | null;
      estado:    string;
      edad?:     number;
      fecha_nacimiento?: string;
    }>>('/auth/me');

    const apiData = response.data.data;

    // Convertir el formato de la API al formato de la app
    const user = await authStore.getUser();
    if (!user) throw new Error('No hay sesión activa');

    return {
      ...user,
      id_usuario: apiData.id,
      correo_institucional: apiData.email,
      rol: apiData.role as AuthUser['rol'],
      edad: apiData.edad,
      fecha_nacimiento: apiData.fecha_nacimiento,
    };
  },


  /**
   * Cierra la sesión del usuario.
   * Limpia AsyncStorage y el header de Axios.
   */
  async logout(): Promise<void> {
    try {
      // Intentar notificar a la API (opcional — si falla no importa)
      const session = await authStore.loadSession();
      if (session) {
        await apiClient.post('/auth/logout', {
          refresh_token: session.refresh_token,
        }).catch(() => {
          // Si falla el logout en la API, igual limpiamos local
        });
      }
    } finally {
      await authStore.clearSession();
    }
  },

};