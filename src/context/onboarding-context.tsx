import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

/**
 * Estructura completa del formulario de onboarding.
 * Cada campo corresponde exactamente a lo que la API espera.
 *
 * Endpoint: PUT /api/patient-profile/me
 */
export interface OnboardingData {
  // Form01 — Nivel de actividad física
  nivel_actividad_fisica: 'sedentario' | 'bajo' | 'medio' | 'alto' | '';

  // Form02 — Condición médica (se convierte a id_condicion para la API)
  condicion_medica: 'diabetes' | 'hipertension' | 'hipotiroidismo' | 'resistencia' | 'ninguna' | '';

  // Form03 — Alergias e intolerancias (texto libre)
  alergias_intolerancias: string;

  // Form04 — Objetivo principal
  objetivo: 'Reducir mi peso corporal' | 'Ganar masa muscular' | 'Mejorar mis hábitos alimenticios' | '';

  // Form05 — Alimentos preferidos (tokens UI o IDs serializados)
  alimentos_preferidos: string[];

  // Alimentos restringidos por selección (tokens UI o IDs serializados)
  alimentos_restringidos: string[];

  // Form06 — Restricciones alimenticias en texto libre
  restricciones_alimenticias: string;

  // Form07 — Deporte (valor exacto que acepta la API)
  deporte: 'gimnasio' | 'running' | 'caminata' | 'ciclismo' | 'futbol' | 'basquet' | 'natacion' | 'entrenamiento_casa' | 'otro' | 'ninguno' | '';
}

/**
 * Valores iniciales — todos vacíos al comenzar el onboarding.
 */
const INITIAL_DATA: OnboardingData = {
  nivel_actividad_fisica: '',
  condicion_medica:       '',
  alergias_intolerancias: '',
  objetivo:               '',
  alimentos_preferidos:   [],
  alimentos_restringidos: [],
  restricciones_alimenticias: '',
  deporte:                '',
};

/**
 * Tipo del contexto — datos + función para actualizar.
 */
interface OnboardingContextType {
  data:       OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
  resetData:  () => void;
}

/**
 * Crear el contexto.
 */
const OnboardingContext = createContext<OnboardingContextType | null>(null);

/**
 * Provider — envuelve los formularios para que todos accedan al mismo estado.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const resetData = useCallback(() => {
    setData(INITIAL_DATA);
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook para usar el contexto en cualquier formulario.
 * Lanza error si se usa fuera del Provider.
 */
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding debe usarse dentro de OnboardingProvider');
  }
  return context;
}