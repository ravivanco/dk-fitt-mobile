import AsyncStorage             from '@react-native-async-storage/async-storage';
import { setAuthHeader, removeAuthHeader } from '../services/api.client';
import { AuthSession, AuthUser }           from '../types/auth.types';

/** Clave usada para guardar la sesión en AsyncStorage */
const SESSION_KEY = '@dk_fitt:auth_session';

/**
 * Store de autenticación.
 * Maneja el guardado, carga y eliminación de la sesión JWT.
 */
export const authStore = {

  /**
   * Guarda la sesión después del login.
   * También configura el header de Axios automáticamente.
   */
  async saveSession(data: {
    access_token:  string;
    refresh_token: string;
    expires_in:    number;
    user:          AuthUser;
  }): Promise<void> {
    // Log detallado de qué se está guardando
    console.log('[authStore.saveSession] User data received:', {
      id_usuario: data.user.id_usuario,
      nombres: data.user.nombres,
      edad: (data.user as any).edad,
      fecha_nacimiento: (data.user as any).fecha_nacimiento,
      sexo: (data.user as any).sexo,
    });

    // Guardar TODO el objeto user sin filtros (incluye cualquier campo extra que venga del API)
    const session: AuthSession = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      user:          data.user as any, // guardar sin restricciones de tipo
      expires_at:    Date.now() + data.expires_in * 1000,
    };

    const sessionJson = JSON.stringify(session);
    console.log('[authStore.saveSession] Guardando en AsyncStorage:', sessionJson.length, 'bytes');
    
    await AsyncStorage.setItem(SESSION_KEY, sessionJson);
    console.log('[authStore] Sesión guardada exitosamente');

    // Configurar el header de Axios para peticiones futuras
    setAuthHeader(data.access_token);
  },


  /**
   * Carga la sesión guardada al abrir la app.
   * Retorna null si no hay sesión o si expiró.
   */
  async loadSession(): Promise<AuthSession | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);

      // Verificar si el access_token expiró
      // (dejamos 60 segundos de margen para renovarlo)
      const isExpired = Date.now() > session.expires_at - 60_000;

      if (!isExpired) {
        // Token válido — configurar el header de Axios
        setAuthHeader(session.access_token);
        return session;
      }

      // Token expirado pero tenemos refresh_token
      // Por ahora retornamos null (el refresh lo implementamos después)
      // TODO: Implementar renovación automática con refresh_token
      await this.clearSession();
      return null;

    } catch {
      await this.clearSession();
      return null;
    }
  },


  /**
   * Obtiene solo los datos del usuario sin verificar expiración.
   * Útil para mostrar el nombre del usuario en la UI.
   */
  async getUser(): Promise<AuthUser | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      console.log('[authStore.getUser] User retrieved:', {
        id: (session.user as any).id_usuario,
        edad: (session.user as any).edad,
        fecha_nacimiento: (session.user as any).fecha_nacimiento,
      });
      return session.user;
    } catch {
      return null;
    }
  },


  /**
   * Elimina la sesión al hacer logout.
   * También elimina el header de Axios.
   */
  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
    removeAuthHeader();
  },


  /**
   * Verifica rápidamente si hay una sesión activa.
   */
  async hasActiveSession(): Promise<boolean> {
    const session = await this.loadSession();
    return session !== null;
  },

};