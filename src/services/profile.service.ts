import { apiClient }          from './api.client';
import { OnboardingData }     from '../context/onboarding-context';
import { ApiSuccessResponse } from '../types/auth.types';

/**
 * Mapeo de condición médica (valor del formulario) al id_condicion de la BD.
 * Estos IDs coinciden con los datos iniciales del script SQL.
 */
const CONDICION_ID_MAP: Record<string, number> = {
  diabetes:      1,
  hipertension:  2,
  hipotiroidismo: 3,
  resistencia:   4,
  ninguna:       5,
};

/**
 * Mapeo de objetivo (valor del formulario) al texto exacto que acepta la API.
 */
const OBJETIVO_MAP: Record<string, string> = {
  reducir: 'Reducir mi peso corporal',
  ganar:   'Ganar masa muscular',
  habitos: 'Mejorar mis hábitos alimenticios',
};

/**
 * Mapeo de nivel de actividad del formulario al valor exacto de la API.
 */
const ACTIVIDAD_MAP: Record<string, string> = {
  sedentario: 'sedentario',
  bajo:       'bajo',
  mediano:    'medio',  // ← el form usa 'mediano', la API usa 'medio'
  alto:       'alto',
};

/**
 * Mapeo de deporte del formulario al valor del CHECK constraint de la BD.
 */
const DEPORTE_MAP: Record<string, string> = {
  gym:      'gimnasio',
  running:  'running',
  football: 'futbol',
  basket:   'basquet',
  cycling:  'ciclismo',
  swimming: 'natacion',
};

/**
 * Servicio de perfil del paciente.
 * Convierte los datos del formulario al formato exacto que espera la API.
 */
export const profileService = {

  /**
   * Guarda el perfil inicial del paciente.
   * Se llama una sola vez al finalizar el onboarding (Form07).
   *
   * Endpoint: PUT /api/patient-profile/me
   */
  async saveOnboardingProfile(formData: OnboardingData): Promise<void> {

    // Convertir nivel de actividad
    const nivel_actividad_fisica = ACTIVIDAD_MAP[formData.nivel_actividad_fisica]
      ?? formData.nivel_actividad_fisica;

    // Convertir condición médica a array de IDs (la API espera un array)
    const id_condicion = CONDICION_ID_MAP[formData.condicion_medica] ?? 5;
    const condiciones  = [id_condicion];

    // Convertir objetivo al texto exacto
    const objetivo = OBJETIVO_MAP[formData.objetivo] ?? formData.objetivo;

    // Convertir deporte al valor del CHECK constraint
    const deporte_mapeado = DEPORTE_MAP[formData.deporte]
      ?? formData.deporte
      ?? 'ninguno';

    // Convertir alimentos preferidos: extraer solo el id del alimento
    // El formato del Form05 es "grupo:alimento" (ej: "proteinas:pollo")
    // La API espera un array de strings con los nombres
    const alimentos_preferidos = formData.alimentos_preferidos.map(key => {
      const parts = key.split(':');
      return parts[1] ?? key; // extraer "pollo" de "proteinas:pollo"
    });

    // Construir el body para la API
    const body = {
      nivel_actividad_fisica,
      objetivo,
      alergias_intolerancias: formData.alergias_intolerancias.trim() || null,
      condiciones,
      alimentos_preferidos,
      alimentos_restringidos: formData.alimentos_restringidos.trim()
        ? formData.alimentos_restringidos.trim().split('\n').filter(Boolean)
        : [],
      deportes: [deporte_mapeado],
    };

    await apiClient.put<ApiSuccessResponse<unknown>>(
      '/patient-profile/me',
      body,
    );
  },

};