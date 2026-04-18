import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  applyTrackedMeal,
  removeTrackedMeal,
  setDailyCalorieTarget,
} from '@/services/calorie.service';
import { authStore } from '@/store/auth.store';

type MacroImpact = {
  protein: number;
  carbs: number;
  fat: number;
};

type MealSlot = 'Desayuno' | 'Media Manana' | 'Almuerzo' | 'Media Tarde' | 'Cena';

export type PlanMeal = {
  id: string;
  slot: MealSlot;
  title: string;
  calories: number;
  emoji: string;
  ingredients: string[];
  recipe: string;
  preparation: string[];
  macroImpact: MacroImpact;
};

export type MenuOption = {
  id: string;
  label: string;
  summary: string;
  totalCalories: number;
  meals: PlanMeal[];
};

export type ExercisePlan = {
  id: string;
  title: string;
  emoji: string;
  duration: string;
  series: string;
  repetitions: string;
  notes: string;
};

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type PlanDay = {
  key: DayKey;
  label: string;
  shortLabel: string;
  targetCalories: number;
  menuOptions: MenuOption[];
  selectedMenuId: string;
  selectedMenu: MenuOption;
  mealStatuses: Record<string, 'done' | 'skip' | null>;
  exercises: ExercisePlan[];
  exerciseStatuses: Record<string, 'done' | 'skip' | null>;
};

export type WeeklyPlan = {
  summary: string[];
  activeDayKey: DayKey;
  days: PlanDay[];
};

type PlanState = {
  selectedMenus: Partial<Record<DayKey, string>>;
  mealStatuses: Record<string, 'done' | 'skip'>;
  exerciseStatuses: Record<string, 'done' | 'skip'>;
};

type MealTemplate = {
  slot: MealSlot;
  title: string;
  calories: number;
  emoji: string;
  tags: string[];
  ingredients: string[];
  recipe: string;
  preparation: string[];
  macroImpact: MacroImpact;
};

const STORAGE_KEY = '@dk_fitt:weekly_plan_state';
const DAY_DEFS: Array<{ key: DayKey; label: string; shortLabel: string }> = [
  { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
  { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
  { key: 'wednesday', label: 'Miercoles', shortLabel: 'Mie' },
  { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
  { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
];

const MEAL_BANK: Record<MealSlot, MealTemplate[]> = {
  Desayuno: [
    {
      slot: 'Desayuno',
      title: 'Avena con yogur y frutos rojos',
      calories: 320,
      emoji: '🥣',
      tags: ['avena', 'yogur', 'fruta', 'ligero'],
      ingredients: ['Avena', 'Yogur natural', 'Frutos rojos', 'Chia'],
      recipe: 'Combina avena cocida con yogur y termina con frutos rojos y chia.',
      preparation: ['Cocina la avena 5 minutos.', 'Sirve con yogur.', 'Agrega frutos rojos y chia.'],
      macroImpact: { protein: 4, carbs: 8, fat: 3 },
    },
    {
      slot: 'Desayuno',
      title: 'Huevos revueltos con espinaca y pan integral',
      calories: 360,
      emoji: '🍳',
      tags: ['huevo', 'espinaca', 'pan', 'proteina'],
      ingredients: ['Huevos', 'Espinaca', 'Pan integral', 'Aceite de oliva'],
      recipe: 'Prepara huevos revueltos suaves y acompañalos con pan integral.',
      preparation: ['Saltea la espinaca.', 'Agrega huevo batido.', 'Sirve con pan integral tostado.'],
      macroImpact: { protein: 8, carbs: 6, fat: 5 },
    },
    {
      slot: 'Desayuno',
      title: 'Smoothie bowl de banana y avena',
      calories: 300,
      emoji: '🍌',
      tags: ['banana', 'avena', 'fruta'],
      ingredients: ['Banana', 'Avena', 'Leche vegetal', 'Mantequilla de mani'],
      recipe: 'Licua la fruta con avena y sirve en bowl con topping crujiente.',
      preparation: ['Licua todos los ingredientes.', 'Sirve frio.', 'Decora con semillas.'],
      macroImpact: { protein: 3, carbs: 9, fat: 3 },
    },
    {
      slot: 'Desayuno',
      title: 'Tostadas de pavo con aguacate',
      calories: 340,
      emoji: '🥪',
      tags: ['pavo', 'aguacate', 'pan', 'salado'],
      ingredients: ['Pan integral', 'Pavo', 'Aguacate', 'Tomate'],
      recipe: 'Arma tostadas nutritivas con pavo y aguacate laminado.',
      preparation: ['Tuesta el pan.', 'Agrega aguacate y pavo.', 'Finaliza con tomate.'],
      macroImpact: { protein: 7, carbs: 5, fat: 5 },
    },
    {
      slot: 'Desayuno',
      title: 'Quinoa dulce con manzana y canela',
      calories: 330,
      emoji: '🍎',
      tags: ['quinoa', 'manzana', 'sin lacteos'],
      ingredients: ['Quinoa cocida', 'Manzana', 'Canela', 'Almendras'],
      recipe: 'Usa quinoa como base dulce con fruta cocida y canela.',
      preparation: ['Cocina la quinoa.', 'Saltea manzana con canela.', 'Sirve con almendras.'],
      macroImpact: { protein: 4, carbs: 7, fat: 3 },
    },
  ],
  'Media Manana': [
    {
      slot: 'Media Manana',
      title: 'Yogur con nueces',
      calories: 160,
      emoji: '🥛',
      tags: ['yogur', 'snack', 'proteina'],
      ingredients: ['Yogur griego', 'Nueces', 'Canela'],
      recipe: 'Mezcla yogur con nueces para una colacion rapida.',
      preparation: ['Sirve el yogur.', 'Agrega nueces troceadas.', 'Espolvorea canela.'],
      macroImpact: { protein: 2, carbs: 1, fat: 2 },
    },
    {
      slot: 'Media Manana',
      title: 'Fruta fresca con semillas',
      calories: 150,
      emoji: '🍓',
      tags: ['fruta', 'ligero'],
      ingredients: ['Fruta de temporada', 'Semillas de girasol'],
      recipe: 'Colacion fresca para mantener energia estable.',
      preparation: ['Lava y corta la fruta.', 'Agrega semillas al final.'],
      macroImpact: { protein: 1, carbs: 3, fat: 1 },
    },
    {
      slot: 'Media Manana',
      title: 'Rollitos de pavo y pepino',
      calories: 170,
      emoji: '🥒',
      tags: ['pavo', 'salado', 'bajo en carbos'],
      ingredients: ['Pavo', 'Pepino', 'Queso crema ligero'],
      recipe: 'Rollitos faciles y altos en saciedad.',
      preparation: ['Unta queso crema.', 'Envuelve con pavo.', 'Sirve con pepino.'],
      macroImpact: { protein: 3, carbs: 1, fat: 1 },
    },
    {
      slot: 'Media Manana',
      title: 'Batido de proteina y cacao',
      calories: 180,
      emoji: '🥤',
      tags: ['proteina', 'cacao'],
      ingredients: ['Leche', 'Proteina', 'Cacao sin azucar'],
      recipe: 'Batido rapido para sostener masa muscular.',
      preparation: ['Licua todos los ingredientes.', 'Toma frio.'],
      macroImpact: { protein: 4, carbs: 1, fat: 1 },
    },
    {
      slot: 'Media Manana',
      title: 'Taza de frutas con queso fresco',
      calories: 175,
      emoji: '🍍',
      tags: ['fruta', 'queso'],
      ingredients: ['Pina', 'Manzana', 'Queso fresco'],
      recipe: 'Combina fruta con una porcion de queso fresco.',
      preparation: ['Corta la fruta.', 'Agrega cubos de queso.', 'Sirve frio.'],
      macroImpact: { protein: 2, carbs: 3, fat: 1 },
    },
  ],
  Almuerzo: [
    {
      slot: 'Almuerzo',
      title: 'Pollo a la plancha con quinoa y vegetales',
      calories: 480,
      emoji: '🍗',
      tags: ['pollo', 'quinoa', 'vegetales'],
      ingredients: ['Pollo', 'Quinoa', 'Brocoli', 'Zanahoria'],
      recipe: 'Plato balanceado alto en proteina y fibra.',
      preparation: ['Asa el pollo.', 'Cocina la quinoa.', 'Saltea vegetales.'],
      macroImpact: { protein: 8, carbs: 10, fat: 4 },
    },
    {
      slot: 'Almuerzo',
      title: 'Pescado al horno con batata y ensalada',
      calories: 460,
      emoji: '🐟',
      tags: ['pescado', 'batata', 'ensalada'],
      ingredients: ['Filete de pescado', 'Batata', 'Lechuga', 'Tomate'],
      recipe: 'Preparacion suave y digestiva, ideal para salud metabolica.',
      preparation: ['Hornea el pescado.', 'Asa la batata.', 'Sirve con ensalada fresca.'],
      macroImpact: { protein: 7, carbs: 9, fat: 3 },
    },
    {
      slot: 'Almuerzo',
      title: 'Bowl de res magra con arroz integral',
      calories: 510,
      emoji: '🥩',
      tags: ['res', 'arroz', 'fuerte'],
      ingredients: ['Res magra', 'Arroz integral', 'Pimientos', 'Cebolla'],
      recipe: 'Bowl completo para dias de mayor carga fisica.',
      preparation: ['Cocina la res.', 'Prepara arroz integral.', 'Saltea vegetales.'],
      macroImpact: { protein: 9, carbs: 11, fat: 4 },
    },
    {
      slot: 'Almuerzo',
      title: 'Pasta integral con pavo y vegetales',
      calories: 500,
      emoji: '🍝',
      tags: ['pasta', 'pavo', 'energia'],
      ingredients: ['Pasta integral', 'Pavo', 'Espinaca', 'Tomate'],
      recipe: 'Pasta moderada y rica en proteina para mantener adherencia.',
      preparation: ['Cocina pasta.', 'Saltea pavo.', 'Integra vegetales y tomate.'],
      macroImpact: { protein: 7, carbs: 12, fat: 3 },
    },
    {
      slot: 'Almuerzo',
      title: 'Ensalada tibia de legumbres con huevo',
      calories: 430,
      emoji: '🥗',
      tags: ['legumbres', 'huevo', 'fibra'],
      ingredients: ['Lentejas', 'Huevo', 'Espinaca', 'Pepino'],
      recipe: 'Opcion saciante, practica y amigable para control de apetito.',
      preparation: ['Cocina legumbres.', 'Hierve huevo.', 'Une con vegetales frescos.'],
      macroImpact: { protein: 6, carbs: 8, fat: 3 },
    },
  ],
  'Media Tarde': [
    {
      slot: 'Media Tarde',
      title: 'Galletas de avena con queso cottage',
      calories: 170,
      emoji: '🧀',
      tags: ['avena', 'queso'],
      ingredients: ['Galletas de avena', 'Queso cottage'],
      recipe: 'Snack sencillo para sostener energia y no llegar con hambre a la cena.',
      preparation: ['Sirve el queso.', 'Acompana con galletas de avena.'],
      macroImpact: { protein: 2, carbs: 2, fat: 1 },
    },
    {
      slot: 'Media Tarde',
      title: 'Hummus con bastones de zanahoria',
      calories: 160,
      emoji: '🥕',
      tags: ['hummus', 'vegetales'],
      ingredients: ['Hummus', 'Zanahoria', 'Pepino'],
      recipe: 'Colacion ligera con fibra y buena saciedad.',
      preparation: ['Sirve el hummus.', 'Corta vegetales en bastones.'],
      macroImpact: { protein: 1, carbs: 2, fat: 1 },
    },
    {
      slot: 'Media Tarde',
      title: 'Batido verde con proteina',
      calories: 180,
      emoji: '🥬',
      tags: ['verde', 'proteina'],
      ingredients: ['Espinaca', 'Proteina', 'Banana', 'Agua'],
      recipe: 'Batido funcional para dias de entrenamiento.',
      preparation: ['Licua todos los ingredientes.', 'Sirve frio.'],
      macroImpact: { protein: 3, carbs: 2, fat: 1 },
    },
    {
      slot: 'Media Tarde',
      title: 'Tostada ligera con aguacate',
      calories: 175,
      emoji: '🥑',
      tags: ['aguacate', 'pan'],
      ingredients: ['Pan integral', 'Aguacate', 'Limon'],
      recipe: 'Grasa saludable para mantener saciedad.',
      preparation: ['Tuesta el pan.', 'Tritura aguacate.', 'Agrega limon.'],
      macroImpact: { protein: 1, carbs: 2, fat: 2 },
    },
    {
      slot: 'Media Tarde',
      title: 'Fruta con mantequilla de mani',
      calories: 190,
      emoji: '🍏',
      tags: ['fruta', 'mani'],
      ingredients: ['Manzana', 'Mantequilla de mani'],
      recipe: 'Snack dulce controlado y muy facil de adherir.',
      preparation: ['Corta la fruta.', 'Sirve con una cucharada de mantequilla de mani.'],
      macroImpact: { protein: 1, carbs: 3, fat: 2 },
    },
  ],
  Cena: [
    {
      slot: 'Cena',
      title: 'Tortilla de vegetales con ensalada fresca',
      calories: 350,
      emoji: '🌮',
      tags: ['huevo', 'vegetales', 'ligera'],
      ingredients: ['Huevos', 'Espinaca', 'Pimiento', 'Lechuga'],
      recipe: 'Cena ligera para cerrar el dia sin pesadez.',
      preparation: ['Prepara la tortilla.', 'Sirve con ensalada fresca.'],
      macroImpact: { protein: 6, carbs: 3, fat: 3 },
    },
    {
      slot: 'Cena',
      title: 'Crema de vegetales con pavo',
      calories: 330,
      emoji: '🍲',
      tags: ['vegetales', 'pavo'],
      ingredients: ['Calabaza', 'Zanahoria', 'Pavo desmechado'],
      recipe: 'Cena suave para digestion y recuperacion.',
      preparation: ['Cocina vegetales.', 'Licua hasta obtener crema.', 'Agrega pavo al servir.'],
      macroImpact: { protein: 5, carbs: 4, fat: 2 },
    },
    {
      slot: 'Cena',
      title: 'Salmon con pure de coliflor',
      calories: 390,
      emoji: '🍽️',
      tags: ['salmon', 'coliflor'],
      ingredients: ['Salmon', 'Coliflor', 'Ajo', 'Aceite de oliva'],
      recipe: 'Cena rica en omega 3 y proteina de alta calidad.',
      preparation: ['Cocina salmon a la plancha.', 'Haz pure con coliflor.', 'Sirve caliente.'],
      macroImpact: { protein: 7, carbs: 3, fat: 4 },
    },
    {
      slot: 'Cena',
      title: 'Bowl templado de pollo y verduras',
      calories: 360,
      emoji: '🍛',
      tags: ['pollo', 'verduras'],
      ingredients: ['Pollo', 'Zucchini', 'Brocoli', 'Hongos'],
      recipe: 'Opcion completa para dias de hambre moderada.',
      preparation: ['Dora el pollo.', 'Saltea las verduras.', 'Une y sirve.'],
      macroImpact: { protein: 6, carbs: 4, fat: 3 },
    },
    {
      slot: 'Cena',
      title: 'Wrap integral de atun y vegetales',
      calories: 340,
      emoji: '🌯',
      tags: ['atun', 'wrap', 'practico'],
      ingredients: ['Wrap integral', 'Atun', 'Lechuga', 'Pepino'],
      recipe: 'Cena practica para dias de poca disponibilidad.',
      preparation: ['Mezcla el atun.', 'Rellena el wrap.', 'Sirve con vegetales frescos.'],
      macroImpact: { protein: 6, carbs: 5, fat: 2 },
    },
  ],
};

const SPORT_WORKOUTS: Record<string, ExercisePlan[]> = {
  gimnasio: [
    { id: 'gym-1', title: 'Tren inferior + core', emoji: '🏋️', duration: '45 min', series: '4 series', repetitions: '12 repeticiones', notes: 'Enfocate en sentadilla, desplantes y plancha.' },
    { id: 'gym-2', title: 'Espalda y pecho', emoji: '💪', duration: '50 min', series: '4 series', repetitions: '10 repeticiones', notes: 'Mantiene postura, fuerza y gasto calorico.' },
    { id: 'gym-3', title: 'HIIT en cinta', emoji: '🔥', duration: '25 min', series: '10 bloques', repetitions: '40 seg trabajo', notes: 'Ideal si hay alta carga calorica en el dia.' },
    { id: 'gym-4', title: 'Hombro y brazos', emoji: '🏋️', duration: '40 min', series: '3 series', repetitions: '12 repeticiones', notes: 'Prioriza buena tecnica y descanso corto.' },
    { id: 'gym-5', title: 'Full body metabolico', emoji: '⚡', duration: '45 min', series: '5 rondas', repetitions: '8 estaciones', notes: 'Cierra la semana elevando gasto energetico.' },
  ],
  running: [
    { id: 'run-1', title: 'Rodaje suave', emoji: '🏃', duration: '35 min', series: '1 bloque', repetitions: 'Ritmo continuo', notes: 'Activa la semana sin fatiga excesiva.' },
    { id: 'run-2', title: 'Intervalos cortos', emoji: '⏱️', duration: '30 min', series: '8 series', repetitions: '1 min rapido / 1 min suave', notes: 'Mejora capacidad cardiovascular.' },
    { id: 'run-3', title: 'Trabajo de tecnica', emoji: '👟', duration: '25 min', series: '6 drills', repetitions: '30 seg por drill', notes: 'Incluye skipping y talones al gluteo.' },
    { id: 'run-4', title: 'Tempo run', emoji: '🌬️', duration: '30 min', series: '1 bloque', repetitions: '15 min ritmo medio-alto', notes: 'Controla respiracion y zancada.' },
    { id: 'run-5', title: 'Fondo moderado', emoji: '🏞️', duration: '45 min', series: '1 bloque', repetitions: 'Ritmo estable', notes: 'Ideal para cerrar la semana con volumen.' },
  ],
  caminata: [
    { id: 'walk-1', title: 'Caminata activa', emoji: '🚶', duration: '40 min', series: '1 bloque', repetitions: 'Ritmo vivo', notes: 'Mantiene gasto energetico sin sobrecargar articulaciones.' },
    { id: 'walk-2', title: 'Subidas suaves', emoji: '⛰️', duration: '30 min', series: '6 repeticiones', repetitions: '2 min subida', notes: 'Usa inclinacion o colina ligera.' },
    { id: 'walk-3', title: 'Movilidad + paseo', emoji: '🧘', duration: '35 min', series: '3 bloques', repetitions: '10 min + movilidad', notes: 'Muy util en dias de alta rigidez.' },
    { id: 'walk-4', title: 'Caminata larga', emoji: '🌤️', duration: '50 min', series: '1 bloque', repetitions: 'Ritmo estable', notes: 'Favorece recuperacion y control glucemico.' },
    { id: 'walk-5', title: 'Paso variable', emoji: '👣', duration: '35 min', series: '5 bloques', repetitions: '3 min normal / 2 min rapido', notes: 'Cierra la semana con variacion de intensidad.' },
  ],
  ciclismo: [
    { id: 'bike-1', title: 'Rodaje base', emoji: '🚴', duration: '45 min', series: '1 bloque', repetitions: 'Cadencia estable', notes: 'Prioriza ritmo aeróbico.' },
    { id: 'bike-2', title: 'Series de velocidad', emoji: '⚙️', duration: '35 min', series: '8 series', repetitions: '45 seg fuerte', notes: 'Sube gasto calorico sin perder tecnica.' },
    { id: 'bike-3', title: 'Recuperacion activa', emoji: '🌿', duration: '30 min', series: '1 bloque', repetitions: 'Muy suave', notes: 'Enfocada en recuperacion.' },
    { id: 'bike-4', title: 'Trabajo de cuestas', emoji: '🛣️', duration: '40 min', series: '5 series', repetitions: '3 min subida', notes: 'Desarrolla potencia y resistencia.' },
    { id: 'bike-5', title: 'Ruta media', emoji: '🏁', duration: '60 min', series: '1 bloque', repetitions: 'Ritmo estable', notes: 'Ideal para viernes o cierre semanal.' },
  ],
  futbol: [
    { id: 'soc-1', title: 'Tecnica + pases', emoji: '⚽', duration: '40 min', series: '5 bloques', repetitions: '6 min por bloque', notes: 'Control, pase y movilidad lateral.' },
    { id: 'soc-2', title: 'Sprints cortos', emoji: '🏃', duration: '25 min', series: '10 series', repetitions: '20 m', notes: 'Mantiene explosividad.' },
    { id: 'soc-3', title: 'Core y estabilidad', emoji: '🛡️', duration: '20 min', series: '4 series', repetitions: '30 seg por ejercicio', notes: 'Reduce riesgo de lesion.' },
    { id: 'soc-4', title: 'Cambios de direccion', emoji: '↔️', duration: '30 min', series: '6 series', repetitions: '5 conos', notes: 'Muy util para agilidad.' },
    { id: 'soc-5', title: 'Partido condicionado', emoji: '🥅', duration: '45 min', series: '3 tiempos', repetitions: '12 min', notes: 'Aplica tecnica en contexto real.' },
  ],
  basquet: [
    { id: 'bas-1', title: 'Fundamentos y tiros', emoji: '🏀', duration: '40 min', series: '6 bloques', repetitions: '8 tiros por punto', notes: 'Combina manejo y tiro.' },
    { id: 'bas-2', title: 'Pliometria ligera', emoji: '⬆️', duration: '25 min', series: '4 series', repetitions: '10 saltos', notes: 'Mejora respuesta y potencia.' },
    { id: 'bas-3', title: 'Defensa lateral', emoji: '🛡️', duration: '20 min', series: '5 series', repetitions: '30 seg', notes: 'Enfasis en desplazamiento lateral.' },
    { id: 'bas-4', title: 'Circuito de cancha', emoji: '🏃', duration: '30 min', series: '6 series', repetitions: 'Ida y vuelta', notes: 'Sube resistencia especifica.' },
    { id: 'bas-5', title: 'Juego controlado', emoji: '🎯', duration: '45 min', series: '4 bloques', repetitions: '8 min', notes: 'Integra lectura y toma de decisiones.' },
  ],
  natacion: [
    { id: 'swim-1', title: 'Tecnica respiratoria', emoji: '🏊', duration: '35 min', series: '6 series', repetitions: '50 m', notes: 'Enfasis en control y eficiencia.' },
    { id: 'swim-2', title: 'Series moderadas', emoji: '🌊', duration: '40 min', series: '8 series', repetitions: '50 m', notes: 'Mejora capacidad cardiovascular.' },
    { id: 'swim-3', title: 'Patada y tabla', emoji: '🦵', duration: '25 min', series: '6 series', repetitions: '25 m', notes: 'Fortalece tren inferior.' },
    { id: 'swim-4', title: 'Nado continuo', emoji: '💧', duration: '30 min', series: '1 bloque', repetitions: 'Ritmo medio', notes: 'Buena sesion de control tecnico.' },
    { id: 'swim-5', title: 'Mixto por estilos', emoji: '🏁', duration: '40 min', series: '4 bloques', repetitions: '100 m', notes: 'Variedad para cerrar la semana.' },
  ],
  entrenamiento_casa: [
    { id: 'home-1', title: 'Full body sin equipo', emoji: '🏠', duration: '30 min', series: '4 rondas', repetitions: '40 seg por ejercicio', notes: 'Sentadilla, push-up, puente y plancha.' },
    { id: 'home-2', title: 'Core y movilidad', emoji: '🧘', duration: '20 min', series: '3 rondas', repetitions: '30 seg', notes: 'Ideal para complementar otros dias.' },
    { id: 'home-3', title: 'Circuito cardio', emoji: '🔥', duration: '25 min', series: '5 rondas', repetitions: '5 ejercicios', notes: 'Saltos bajos, mountain climbers y sentadillas.' },
    { id: 'home-4', title: 'Pierna y gluteo', emoji: '🦵', duration: '30 min', series: '4 series', repetitions: '15 repeticiones', notes: 'Controla tecnica y respiracion.' },
    { id: 'home-5', title: 'Tren superior', emoji: '💪', duration: '25 min', series: '4 series', repetitions: '12 repeticiones', notes: 'Usa mochila o banda si tienes.' },
  ],
  ninguno: [
    { id: 'none-1', title: 'Movilidad general', emoji: '🧘', duration: '15 min', series: '1 bloque', repetitions: 'Rutina guiada', notes: 'Excelente para empezar a construir habito.' },
    { id: 'none-2', title: 'Caminata consciente', emoji: '🚶', duration: '25 min', series: '1 bloque', repetitions: 'Ritmo suave', notes: 'Manten la respiracion comoda.' },
    { id: 'none-3', title: 'Activacion suave', emoji: '🌿', duration: '12 min', series: '2 rondas', repetitions: '8 movimientos', notes: 'Previene sedentarismo prolongado.' },
    { id: 'none-4', title: 'Estiramiento guiado', emoji: '🤸', duration: '15 min', series: '1 bloque', repetitions: '20 seg por zona', notes: 'Ideal al final del dia.' },
    { id: 'none-5', title: 'Mini circuito basico', emoji: '⚡', duration: '18 min', series: '3 rondas', repetitions: '20 seg por ejercicio', notes: 'Para ganar confianza antes de progresar.' },
  ],
};

const DEFAULT_STATE: PlanState = {
  selectedMenus: {},
  mealStatuses: {},
  exerciseStatuses: {},
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function loadPlanState(): Promise<PlanState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<PlanState>;
    return {
      selectedMenus: parsed.selectedMenus ?? {},
      mealStatuses: parsed.mealStatuses ?? {},
      exerciseStatuses: parsed.exerciseStatuses ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

async function savePlanState(state: PlanState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayDayKey(): DayKey {
  const day = new Date().getDay();
  switch (day) {
    case 1:
      return 'monday';
    case 2:
      return 'tuesday';
    case 3:
      return 'wednesday';
    case 4:
      return 'thursday';
    case 5:
      return 'friday';
    default:
      return 'monday';
  }
}

function scoreTemplate(template: MealTemplate, preferredTokens: string[], avoidTokens: string[]) {
  let score = 0;

  preferredTokens.forEach((token) => {
    if (template.tags.some((tag) => normalizeText(tag).includes(token))) {
      score += 3;
    }
  });

  avoidTokens.forEach((token) => {
    if (template.tags.some((tag) => normalizeText(tag).includes(token)) || normalizeText(template.title).includes(token)) {
      score -= 10;
    }
  });

  return score;
}

function getUserSignals(user: any) {
  const onboarding = user?.onboarding ?? {};
  const preferredFoods = Array.isArray(onboarding.alimentos_preferidos)
    ? onboarding.alimentos_preferidos.map((item: any) => item?.nombre_alimento ?? item?.nombre ?? '').filter(Boolean)
    : [];
  const restrictedFoods = Array.isArray(onboarding.alimentos_restringidos)
    ? onboarding.alimentos_restringidos.map((item: any) => item?.nombre_alimento ?? item?.nombre ?? '').filter(Boolean)
    : [];
  const restrictionText = [
    onboarding.alergias_intolerancias,
    onboarding.restricciones_alimenticias,
    ...(Array.isArray(onboarding.condiciones) ? onboarding.condiciones.map((item: any) => item?.nombre ?? '') : []),
  ]
    .filter(Boolean)
    .join(' ');
  const preferredTokens = preferredFoods.map(normalizeText);
  const avoidTokens = [...restrictedFoods.map(normalizeText), ...restrictionText.split(/\s+/).map(normalizeText)].filter(Boolean);

  return {
    preferredFoods,
    restrictedFoods,
    preferredTokens,
    avoidTokens,
    objective: onboarding.objetivo ?? 'Mejorar mis habitos alimenticios',
    activity: onboarding.nivel_actividad_fisica ?? 'medio',
    sport: onboarding.deportes?.[0] ?? 'ninguno',
    conditions: Array.isArray(onboarding.condiciones)
      ? onboarding.condiciones.map((item: any) => item?.nombre ?? '').filter(Boolean)
      : [],
  };
}

function calculateTargetCalories(user: any, activity: string, objective: string) {
  const basal = typeof user?.metabolismo_basal === 'number' ? user.metabolismo_basal : 1600;
  const activityMap: Record<string, number> = {
    sedentario: 1.15,
    bajo: 1.25,
    medio: 1.35,
    alto: 1.45,
  };
  const multiplier = activityMap[normalizeText(activity)] ?? 1.3;
  let target = basal * multiplier;

  const normalizedObjective = normalizeText(objective);
  if (normalizedObjective.includes('reducir')) target -= 180;
  if (normalizedObjective.includes('ganar')) target += 150;

  return Math.max(1200, Math.round(target));
}

function buildMenuOptions(dayKey: DayKey, targetCalories: number, userSignals: ReturnType<typeof getUserSignals>) {
  const dayOffset = DAY_DEFS.findIndex((day) => day.key === dayKey);

  const slots = Object.keys(MEAL_BANK) as MealSlot[];
  return Array.from({ length: 5 }, (_, optionIndex) => {
    const meals = slots.map((slot, slotIndex) => {
      const ranked = [...MEAL_BANK[slot]].sort((a, b) => {
        const scoreA = scoreTemplate(a, userSignals.preferredTokens, userSignals.avoidTokens);
        const scoreB = scoreTemplate(b, userSignals.preferredTokens, userSignals.avoidTokens);
        return scoreB - scoreA;
      });

      const picked = ranked[(optionIndex + dayOffset + slotIndex) % ranked.length];
      return {
        id: `${dayKey}-${optionIndex}-${slotIndex}`,
        slot,
        title: picked.title,
        calories: picked.calories,
        emoji: picked.emoji,
        ingredients: picked.ingredients,
        recipe: picked.recipe,
        preparation: picked.preparation,
        macroImpact: picked.macroImpact,
      } as PlanMeal;
    });

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const delta = targetCalories - totalCalories;
    const summary =
      delta >= 0
        ? `Plan equilibrado, ${delta} kcal por debajo del maximo recomendado`
        : `Plan potente, ${Math.abs(delta)} kcal por encima para dias de mayor demanda`;

    return {
      id: `${dayKey}-option-${optionIndex + 1}`,
      label: `Menu ${optionIndex + 1}`,
      summary,
      totalCalories,
      meals,
    };
  });
}

function buildExercises(dayKey: DayKey, sport: string) {
  const normalizedSport = normalizeText(sport);
  const workoutBank = SPORT_WORKOUTS[normalizedSport] ?? SPORT_WORKOUTS.ninguno;
  const dayIndex = DAY_DEFS.findIndex((day) => day.key === dayKey);

  return Array.from({ length: 2 }, (_, index) => workoutBank[(dayIndex + index) % workoutBank.length]).map((exercise, index) => ({
    ...exercise,
    id: `${dayKey}-${exercise.id}-${index}`,
  }));
}

export async function loadWeeklyPlan(): Promise<WeeklyPlan> {
  const user = (await authStore.getUser()) as any;
  const state = await loadPlanState();
  const userSignals = getUserSignals(user);
  const targetCalories = calculateTargetCalories(user, userSignals.activity, userSignals.objective);
  await setDailyCalorieTarget(targetCalories);

  const days = DAY_DEFS.map((day) => {
    const menuOptions = buildMenuOptions(day.key, targetCalories, userSignals);
    const selectedMenuId = state.selectedMenus[day.key] ?? menuOptions[0].id;
    const selectedMenu = menuOptions.find((option) => option.id === selectedMenuId) ?? menuOptions[0];
    const exercises = buildExercises(day.key, userSignals.sport);

    const mealStatuses = selectedMenu.meals.reduce<Record<string, 'done' | 'skip' | null>>((acc, meal) => {
      acc[meal.id] = state.mealStatuses[meal.id] ?? null;
      return acc;
    }, {});

    const exerciseStatuses = exercises.reduce<Record<string, 'done' | 'skip' | null>>((acc, exercise) => {
      acc[exercise.id] = state.exerciseStatuses[exercise.id] ?? null;
      return acc;
    }, {});

    return {
      key: day.key,
      label: day.label,
      shortLabel: day.shortLabel,
      targetCalories,
      menuOptions,
      selectedMenuId,
      selectedMenu,
      mealStatuses,
      exercises,
      exerciseStatuses,
    } satisfies PlanDay;
  });

  const summary = [
    `Meta diaria estimada: ${targetCalories} kcal`,
    `Objetivo: ${userSignals.objective}`,
    `Deporte principal: ${userSignals.sport || 'ninguno'}`,
    userSignals.preferredFoods.length > 0
      ? `Preferencias consideradas: ${userSignals.preferredFoods.slice(0, 3).join(', ')}`
      : 'Menus equilibrados segun actividad y biometria',
  ];

  return {
    summary,
    activeDayKey: getTodayDayKey(),
    days,
  };
}

export async function selectMenuOption(dayKey: DayKey, menuId: string): Promise<WeeklyPlan> {
  const state = await loadPlanState();
  const nextState: PlanState = {
    ...state,
    selectedMenus: {
      ...state.selectedMenus,
      [dayKey]: menuId,
    },
  };
  await savePlanState(nextState);
  return loadWeeklyPlan();
}

export async function updateMealStatus(
  meal: PlanMeal,
  status: 'done' | 'skip' | null,
): Promise<WeeklyPlan> {
  const state = await loadPlanState();
  const previousStatus = state.mealStatuses[meal.id] ?? null;
  const nextMealStatuses = { ...state.mealStatuses };

  if (status) {
    nextMealStatuses[meal.id] = status;
  } else {
    delete nextMealStatuses[meal.id];
  }

  if (previousStatus !== 'done' && status === 'done') {
    await applyTrackedMeal(meal.id, meal.calories, meal.macroImpact);
  }

  if (previousStatus === 'done' && status !== 'done') {
    await removeTrackedMeal(meal.id);
  }

  await savePlanState({
    ...state,
    mealStatuses: nextMealStatuses,
  });

  return loadWeeklyPlan();
}

export async function updateExerciseStatus(
  exerciseId: string,
  status: 'done' | 'skip' | null,
): Promise<WeeklyPlan> {
  const state = await loadPlanState();
  const nextExerciseStatuses = { ...state.exerciseStatuses };

  if (status) {
    nextExerciseStatuses[exerciseId] = status;
  } else {
    delete nextExerciseStatuses[exerciseId];
  }

  await savePlanState({
    ...state,
    exerciseStatuses: nextExerciseStatuses,
  });

  return loadWeeklyPlan();
}
