# Glosario del proyecto DK Fitt Mobile

Glosario redactado a partir de los términos, pantallas, campos y servicios que aparecen en el proyecto.

## Siglas y abreviaturas

- API: Application Programming Interface. Interfaz que conecta la app con el servidor.
- DB: Base de datos. Lugar donde se guarda la información.
- IMC: Índice de Masa Corporal.
- JWT: JSON Web Token. Token usado para autenticación y sesión.
- UI: User Interface. Interfaz de usuario.
- UX: User Experience. Experiencia de usuario.
- JS: JavaScript. Lenguaje de programación base del proyecto.
- TS: TypeScript. Variante tipada de JavaScript usada en la app.
- RN: React Native. Framework para crear aplicaciones móviles.
- HTTP: HyperText Transfer Protocol. Protocolo usado para comunicar cliente y servidor.
- URL: Uniform Resource Locator. Dirección de un recurso o endpoint.
- JSON: JavaScript Object Notation. Formato de intercambio de datos.
- SDK: Software Development Kit. Conjunto de herramientas para desarrollar sobre una plataforma.
- kcal: Kilocaloría. Unidad de energía usada para alimentos y gasto calórico.
- AsyncStorage: Almacenamiento local persistente del dispositivo.
- Node.js: Entorno de ejecución de JavaScript usado para scripts y herramientas del proyecto.

## Términos generales

- App: Aplicación móvil DK Fitt orientada a seguimiento nutricional, actividad física y planes personalizados.
- API: Interfaz de programación que conecta la app con el servidor para guardar y consultar datos.
- API Client: Cliente HTTP usado para hacer peticiones a la API.
- AsyncStorage: Almacenamiento local del teléfono donde se guarda la sesión y parte del estado de la app.
- Auth: Autenticación del usuario mediante correo y contraseña.
- Bottom Nav: Barra de navegación inferior con accesos principales.
- Dashboard: Panel principal con información resumida del usuario.
- Endpoint: Ruta concreta de la API, por ejemplo login, registro o actualización del perfil.
- Expo Router: Sistema de navegación basado en archivos y rutas.
- Formulario: Pantalla de captura de datos del usuario dentro del onboarding.
- Hook: Función reutilizable de React para manejar lógica compartida.
- IMC: Índice de Masa Corporal.
- Kcal: Kilocalorías, unidad usada para medir energía de alimentos y planes.
- Macro: Macronutriente, como proteína, carbohidratos o grasas.
- Onboarding: Proceso inicial para recopilar información del usuario y armar su perfil.
- Profile: Perfil del usuario, donde se muestran y editan sus datos.
- Plan semanal: Distribución de comidas y ejercicios por día.
- Route: Pantalla o ruta de navegación dentro de la app.
- Session: Sesión del usuario autenticado.
- Token: Credencial digital usada para mantener la sesión activa.

## Autenticación y sesión

- Login: Inicio de sesión con correo institucional y contraseña.
- Register: Registro de un nuevo usuario.
- Access token: Token principal que permite consumir la API sin volver a iniciar sesión.
- Refresh token: Token secundario que permite renovar la sesión.
- AuthUser: Estructura con los datos del usuario autenticado.
- AuthSession: Estructura que guarda la sesión local del usuario.
- Logout: Cierre de sesión y limpieza de credenciales guardadas.
- correo_institucional: Correo usado como identificador de acceso.
- contrasena: Contraseña del usuario.
- formulario_completado: Estado que indica si el onboarding ya fue terminado.
- modulo_habilitado: Estado que indica si el acceso al módulo está activado.

## Onboarding y perfil clínico

- OnboardingData: Estructura con los datos del formulario inicial.
- nivel_actividad_fisica: Nivel de actividad física del usuario.
- condicion_medica: Condición médica declarada en el formulario.
- alergias_intolerancias: Campo de texto libre para alergias o intolerancias.
- objetivo: Meta principal del usuario.
- alimentos_preferidos: Lista de alimentos preferidos.
- alimentos_restringidos: Lista de alimentos que el usuario evita o no puede consumir.
- restricciones_alimenticias: Texto libre con restricciones alimenticias adicionales.
- deporte: Deporte o actividad física principal del usuario.
- Condición médica: Estado de salud relevante para el plan nutricional.
- Evaluación clínica: Datos profesionales usados para definir calorías y distribución de macronutrientes.
- calorias_diarias_calculadas: Cantidad diaria recomendada de calorías según la evaluación clínica.
- distribucion_carbohidratos_pct: Porcentaje de carbohidratos recomendado.
- distribucion_proteinas_pct: Porcentaje de proteínas recomendado.
- distribucion_grasas_pct: Porcentaje de grasas recomendado.

## Formularios del onboarding

- Form01: Nivel de actividad física.
- Form02: Condición médica.
- Form03: Alergias e intolerancias.
- Form04: Objetivo principal.
- Form05: Alimentos preferidos y restringidos.
- Form06: Restricciones alimenticias.
- Form07: Deporte o disciplina practicada.

## Actividad física y deportes

- sedentario: Muy poca o ninguna actividad física.
- bajo: Actividad ligera como caminar o tareas domésticas.
- mediano: Actividad moderada, deportes o gimnasio ocasional.
- alto: Entrenamiento intenso o frecuente.
- gimnasio: Entrenamiento en gimnasio.
- running: Carrera o trote.
- caminata: Caminata como actividad principal.
- ciclismo: Actividad de bicicleta.
- futbol: Fútbol.
- basquet: Básquetbol.
- natacion: Natación.
- entrenamiento_casa: Ejercicio realizado en casa.
- otro: Otra actividad no listada.
- ninguno: Sin deporte o disciplina principal.

## Alimentación y plan nutricional

- Calorie Dashboard: Resumen de calorías consumidas, meta diaria y macronutrientes.
- dailyTarget: Meta diaria de calorías.
- consumedCalories: Calorías consumidas hasta el momento.
- planActive: Indica si el plan está activo.
- Meal: Comida o preparación incluida en el plan.
- MealSlot: Momento del día en el que se consume una comida.
- Desayuno: Primera comida del día.
- Media Manana: Colación de media mañana.
- Almuerzo: Comida principal del mediodía.
- Media Tarde: Colación de media tarde.
- Cena: Última comida del día.
- MenuOption: Opción de menú disponible para un día del plan.
- WeeklyPlan: Plan semanal completo.
- PlanDay: Día del plan con menús, comidas y ejercicios.
- selectedMenu: Menú elegido para un día.
- mealStatuses: Estado de las comidas marcadas como hechas o omitidas.
- exerciseStatuses: Estado de los ejercicios marcados como hechos o omitidos.
- calories: Cantidad de energía de una comida.
- ingredients: Ingredientes de una preparación.
- recipe: Instrucciones o receta resumida.
- preparation: Pasos de preparación de una comida.
- macroImpact: Impacto estimado de una comida sobre los macronutrientes.
- protein: Proteína.
- carbs: Carbohidratos.
- fat: Grasas.

## Métricas y seguimiento

- IMC: Índice de Masa Corporal usado para clasificar el estado nutricional.
- Bajo peso severo: Categoría de IMC muy por debajo del rango saludable.
- Bajo peso grave: Categoría de IMC por debajo del rango saludable.
- Bajo peso: Categoría de IMC inferior al rango normal.
- Normal: Rango de IMC considerado saludable.
- Sobrepeso: Rango de IMC por encima de lo saludable.
- Obesidad Clase I: Primer nivel de obesidad.
- Obesidad Clase II: Segundo nivel de obesidad.
- WeightEntry: Registro de peso con fecha.
- MealHistoryEntry: Historial de comidas confirmadas.
- TrackedMealImpact: Impacto nutricional de una comida registrada.
- MacroProgress: Avance de un macronutriente.
- MacroRing: Indicador circular de progreso de un macronutriente.

## Pantallas y navegación

- Home: Pantalla principal.
- Mi plan: Vista del plan semanal del usuario.
- Datos médicos: Sección con información clínica.
- Perfil: Pantalla de datos personales del usuario.
- Perfil editar: Pantalla para editar el perfil.
- Biom editar: Pantalla para editar biometría o datos corporales.
- Calendario: Vista de calendario dentro de la app.
- Control calórico: Pantalla para seguimiento de calorías.
- Menús: Pantalla con opciones de menú.
- Ejercicios: Pantalla general de rutinas o disciplinas.
- Progreso: Sección de avance y seguimiento.
- Login: Pantalla de acceso.
- Register: Pantalla de registro.
- Loading: Pantalla de carga inicial.

## Componentes y utilidades

- FormBackgroundDecor: Componente decorativo de fondo para formularios.
- ThemedText: Texto adaptado al tema visual.
- ThemedView: Contenedor adaptado al tema visual.
- ExternalLink: Enlace externo abierto fuera de la app.
- useAuth: Hook para consultar o manejar autenticación.
- useTheme: Hook para obtener el tema actual.
- authStore: Almacén local de sesión y usuario autenticado.
- apiClient: Instancia configurada para hablar con la API.

## Términos de la API

- LoginRequest: Datos enviados para iniciar sesión.
- LoginResponse: Respuesta que devuelve el login.
- RegisterRequest: Datos enviados para registrar un usuario.
- RegisterResponse: Respuesta que devuelve el registro.
- ApiSuccessResponse: Respuesta exitosa estándar de la API.
- ApiErrorResponse: Respuesta de error estándar de la API.
- ApiResponse: Tipo que puede ser éxito o error.
- updateMealStatus: Función para actualizar el estado de una comida.
- updateExerciseStatus: Función para actualizar el estado de un ejercicio.
- loadWeeklyPlan: Función para cargar el plan semanal.
- loadCalorieDashboard: Función para cargar el panel calórico.

## Resumen corto

En este proyecto, los términos más importantes giran alrededor de cuatro bloques: autenticación, onboarding, plan nutricional y seguimiento físico. La app recopila datos del usuario, calcula una base clínica y luego organiza comidas, ejercicios y progreso en pantallas como Home, Mi plan y Datos médicos.
