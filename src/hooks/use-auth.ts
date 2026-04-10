import { useState, useCallback } from 'react';
import { router }                from 'expo-router';
import { authService }           from '../services/auth.service';
import { authStore }             from '../store/auth.store';
import { LoginRequest, RegisterRequest } from '../types/auth.types';

/**
 * Hook de autenticación.
 * Maneja el estado de carga y errores de las operaciones de auth.
 * Los componentes de login y registro usan este hook.
 */
export const useAuth = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);


  /**
   * Inicia sesión y navega a la pantalla correcta.
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(credentials);
      const { user } = result;

      // Navegar según el estado del usuario
      if (!user.formulario_completado) {
        // Primer acceso: completar el formulario inicial
        router.replace('/formularios/form01');
      } else if (user.modulo_habilitado) {
        // Plan activo y habilitado
        router.replace('/mi-plan');
      } else {
        // Plan pendiente de activación por la nutricionista
        router.replace('/home');
      }

    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Error al iniciar sesión. Intenta de nuevo.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  /**
   * Registra un nuevo usuario y navega al login.
   */
  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(data);
      // Registro exitoso — navegar al login
      router.replace('/auth/login');
      return true;

    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Error al registrarse. Intenta de nuevo.';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);


  /**
   * Cierra la sesión y navega al login.
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      router.replace('/auth/login');
    } catch {
      // Aunque falle, limpiar local y navegar
      await authStore.clearSession();
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, []);


  /** Limpia el error actual */
  const clearError = useCallback(() => setError(null), []);


  return {
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};