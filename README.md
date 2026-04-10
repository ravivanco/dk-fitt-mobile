# DK FITT Mobile - README de Formularios

Este README contiene:
- La estructura actual del proyecto.
- El codigo completo de los formularios del 1 al 7 (archivo de ruta + componente principal).

## Estructura del proyecto

```text
app.json
expo-env.d.ts
package.json
README.md
tsconfig.json
assets/
  expo.icon/
    icon.json
    Assets/
  images/
    tabIcons/
scripts/
  reset-project.js
src/
  global.css
  app/
    _layout.tsx
    calendario.tsx
    home.tsx
    index.tsx
    mi-plan.tsx
    perfil.tsx
    auth/
      login.tsx
      register.tsx
    formularios/
      form01.tsx
      form02.tsx
      form03.tsx
      form04.tsx
      form05.tsx
      form06.tsx
      form07.tsx
    main/
    menus/
    onboarding/
      loading.tsx
    plan/
  components/
    external-link.tsx
    themed-text.tsx
    themed-view.tsx
    forms/
      form01-actividad.tsx
      form02-condicio.tsx
      form03-intoleracia.tsx
      form03-intolerancia.tsx
      form04-objetivo.tsx
      form05-preferencia.tsx
      form06-evitar.tsx
      form07-deporte.tsx
      components/
        form-background-decor.tsx
    navigation/
      bottom-nav.tsx
    ui/
  constants/
    theme.ts
  hooks/
    use-auth.ts
    use-color-scheme.ts
    use-color-scheme.web.ts
    use-theme.ts
  services/
    api.client.ts
    auth.service.ts
  store/
    auth.store.ts
  types/
    auth.types.ts
```

-----------------
## Form 1
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form01.tsx
```tsx
import React from 'react';

import Form01Actividad from '@/components/forms/form01-actividad';

export default function Form01Route() {
  return <Form01Actividad />;
}
```

### Componente principal: src/components/forms/form01-actividad.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

type ActivityLevel = 'sedentario' | 'bajo' | 'mediano' | 'alto';

const OPTIONS: {
	id: ActivityLevel;
	title: string;
	description: string;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	totalSegments: number;
	activeSegments: number;
}[] = [
	{
		id: 'sedentario',
		title: 'Sedentario',
		description: 'Poca o ninguna actividad fisica.',
		icon: 'sofa-outline',
		totalSegments: 4,
		activeSegments: 1,
	},
	{
		id: 'bajo',
		title: 'Bajo',
		description: 'Caminar, tareas domesticas, subir escaleras.',
		icon: 'walk',
		totalSegments: 4,
		activeSegments: 2,
	},
	{
		id: 'mediano',
		title: 'Mediano',
		description: 'Deportes, gimnasio 1-2 veces por semana',
		icon: 'run-fast',
		totalSegments: 4,
		activeSegments: 3,
	},
	{
		id: 'alto',
		title: 'Alto',
		description: 'Entrenamiento intenso, gimnasio 5-6 veces por semana',
		icon: 'weight-lifter',
		totalSegments: 5,
		activeSegments: 5,
	},
];

export default function Form01Actividad() {
	const router = useRouter();
	const [selected, setSelected] = useState<ActivityLevel>('mediano');

	const selectedOption = useMemo(() => OPTIONS.find((o) => o.id === selected), [selected]);

	const handleContinue = () => {
		console.log('Nivel seleccionado:', selectedOption?.title ?? selected);
		router.push('/formularios/form02' as Href);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.wrapper}>
					<FormBackgroundDecor />

					<View style={styles.headerWrap}>
						<View style={styles.headerTopRow}>
							<TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
								<MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
							</TouchableOpacity>
							<Text style={styles.stepText}>Paso 1/7</Text>
						</View>

						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.title}>Cual es tu nivel de actividad fisica?</Text>
						<Text style={styles.subtitle}>Selecciona la opcion que mejor describe tu rutina actual.</Text>
					</View>

					<View style={styles.card}>
						{OPTIONS.map((item) => {
							const isSelected = selected === item.id;

							return (
								<TouchableOpacity
									key={item.id}
									style={[styles.optionCard, isSelected && styles.optionCardSelected]}
									activeOpacity={0.9}
									onPress={() => setSelected(item.id)}>
									<View style={[styles.optionLeft, isSelected && styles.optionLeftSelected]}>
										<View style={styles.illustrationFallback}>
											<MaterialCommunityIcons
												name={item.icon}
												size={42}
												color={isSelected ? '#a9862a' : '#9a9284'}
											/>
										</View>
									</View>

									<View style={styles.optionCenter}>
										<Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{item.title}</Text>
										<Text style={styles.optionDescription}>{item.description}</Text>

										<View style={styles.miniTrackRow}>
											{Array.from({ length: item.totalSegments }).map((_, index) => {
												const active = index < item.activeSegments;
												return (
													<View
														key={`${item.id}-${index}`}
														style={[
															styles.miniTrack,
															active && styles.miniTrackActive,
															isSelected && active && styles.miniTrackActiveSelected,
														]}
													/>
												);
											})}
										</View>
									</View>

									<View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
										{isSelected ? <MaterialCommunityIcons name="check" size={14} color="#1f1f1f" /> : null}
									</View>
								</TouchableOpacity>
							);
						})}

						<LinearGradient
							colors={['#ecb607', '#f6c510', '#fbd232']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.continueGradient}>
							<TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
								<Text style={styles.continueText}>Continuar</Text>
							</TouchableOpacity>
						</LinearGradient>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8f6f1',
	},
	scrollContent: {
		flexGrow: 1,
	},
	wrapper: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 22,
		position: 'relative',
		backgroundColor: '#f8f6f1',
		overflow: 'visible',
	},
	headerWrap: {
		width: '100%',
		zIndex: 3,
	},
	headerTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.4,
		borderColor: '#ddd6ca',
		backgroundColor: '#f3f0e8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepText: {
		color: '#2d2a27',
		fontSize: 16,
		fontWeight: '700',
	},
	progressTrack: {
		marginTop: 10,
		width: '100%',
		height: 7,
		borderRadius: 999,
		backgroundColor: '#dfd9ce',
		overflow: 'hidden',
	},
	progressFill: {
		width: '14.3%',
		height: '100%',
		backgroundColor: '#d7a300',
	},
	title: {
		marginTop: 14,
		color: '#1f1f1f',
		fontSize: 16,
		lineHeight: 23,
		fontWeight: '800',
	},
	subtitle: {
		marginTop: 4,
		color: '#4f4740',
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 8,
		maxWidth: 280,
	},
	card: {
		width: Math.min(width * 0.84, 350),
		backgroundColor: 'transparent',
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingTop: 8,
		paddingBottom: 14,
		shadowColor: '#8f877d',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
		zIndex: 3,
	},
	optionCard: {
		borderWidth: 1.3,
		borderColor: '#cfc7ba',
		borderRadius: 14,
		minHeight: 92,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 9,
		marginBottom: 10,
		backgroundColor: '#ffffff',
	},
	optionCardSelected: {
		borderColor: '#e8a800',
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 3,
		backgroundColor: '#fff9e7',
	},
	optionLeft: {
		width: 84,
		height: 64,
		borderRadius: 12,
		backgroundColor: '#f7f4ec',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	optionLeftSelected: {
		backgroundColor: '#f5ebcf',
	},
	illustrationFallback: {
		width: 76,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
	},
	optionCenter: {
		flex: 1,
		paddingRight: 6,
	},
	optionTitle: {
		color: '#111111',
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 2,
	},
	optionTitleSelected: {
		color: '#111111',
	},
	optionDescription: {
		color: '#282828',
		fontSize: 12,
		lineHeight: 16,
		maxWidth: 190,
	},
	miniTrackRow: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 8,
	},
	miniTrack: {
		width: 15,
		height: 15,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#c9c2b6',
		backgroundColor: '#ffffff',
	},
	miniTrackActive: {
		backgroundColor: '#c5bdae',
		borderColor: '#c5bdae',
	},
	miniTrackActiveSelected: {
		backgroundColor: '#c8920a',
		borderColor: '#c8920a',
	},
	radioOuter: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.8,
		borderColor: '#cfc7ba',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	radioOuterSelected: {
		borderColor: '#e8a800',
		backgroundColor: '#e8b006',
	},
	continueGradient: {
		borderRadius: 999,
		marginTop: 8,
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.26,
		shadowRadius: 8,
		elevation: 4,
	},
	continueButton: {
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueText: {
		color: '#fdfcf9',
		fontWeight: '600',
		fontSize: 17,
	},
});
```

-----------------
## Form 2
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form02.tsx
```tsx
import React from 'react';

import Form02Condicio from '@/components/forms/form02-condicio';

export default function Form02Route() {
  return <Form02Condicio />;
}
```

### Componente principal: src/components/forms/form02-condicio.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

type ConditionLevel = 'diabetes' | 'hipertension' | 'hipotiroidismo' | 'resistencia' | 'ninguna';

const OPTIONS: {
	id: ConditionLevel;
	title: string;
	description: string;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	totalSegments: number;
	activeSegments: number;
}[] = [
	{
		id: 'diabetes',
		title: 'Diabetes',
		description: 'Control de azucar y alimentacion estable',
		icon: 'water-outline',
		totalSegments: 4,
		activeSegments: 4,
	},
	{
		id: 'hipertension',
		title: 'Hipertension arterial',
		description: 'Monitoreo de sodio y presion arterial',
		icon: 'stethoscope',
		totalSegments: 4,
		activeSegments: 4,
	},
	{
		id: 'hipotiroidismo',
		title: 'Hipotiroidismo',
		description: 'Ajuste de energia y balance metabolico',
		icon: 'brain',
		totalSegments: 4,
		activeSegments: 3,
	},
	{
		id: 'resistencia',
		title: 'Resistencia a la insulina',
		description: 'Seleccion de carbohidratos de bajo impacto',
		icon: 'molecule-co2',
		totalSegments: 5,
		activeSegments: 5,
	},
	{
		id: 'ninguna',
		title: 'Ninguna',
		description: 'No tengo condiciones medicas actualmente',
		icon: 'shield-check-outline',
		totalSegments: 4,
		activeSegments: 2,
	},
];

export default function Form02Condicio() {
	const router = useRouter();
	const [selected, setSelected] = useState<ConditionLevel>('ninguna');

	const selectedOption = useMemo(() => OPTIONS.find((o) => o.id === selected), [selected]);

	const handleContinue = () => {
		console.log('Condicion seleccionada:', selectedOption?.title ?? selected);
		router.push('/formularios/form03' as Href);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.wrapper}>
					<FormBackgroundDecor />

					<View style={styles.headerWrap}>
						<View style={styles.headerTopRow}>
							<TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
								<MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
							</TouchableOpacity>
							<Text style={styles.stepText}>Paso 2/7</Text>
						</View>

						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.title}>Padece de una condicion medica?</Text>
						<Text style={styles.subtitle}>Esta informacion nos ayuda a personalizar mejor su plan.</Text>
					</View>

					<View style={styles.card}>
						{OPTIONS.map((item) => {
							const isSelected = selected === item.id;

							return (
								<TouchableOpacity
									key={item.id}
									style={[styles.optionCard, isSelected && styles.optionCardSelected]}
									activeOpacity={0.9}
									onPress={() => setSelected(item.id)}>
									<View style={[styles.optionLeft, isSelected && styles.optionLeftSelected]}>
										<View style={styles.illustrationFallback}>
											<MaterialCommunityIcons
												name={item.icon}
												size={42}
												color={isSelected ? '#a9862a' : '#9a9284'}
											/>
										</View>
									</View>

									<View style={styles.optionCenter}>
										<Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{item.title}</Text>
										<Text style={styles.optionDescription}>{item.description}</Text>

										<View style={styles.miniTrackRow}>
											{Array.from({ length: item.totalSegments }).map((_, index) => {
												const active = index < item.activeSegments;
												return (
													<View
														key={`${item.id}-${index}`}
														style={[
															styles.miniTrack,
															active && styles.miniTrackActive,
															isSelected && active && styles.miniTrackActiveSelected,
														]}
													/>
												);
											})}
										</View>
									</View>

									<View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
										{isSelected ? <MaterialCommunityIcons name="check" size={14} color="#1f1f1f" /> : null}
									</View>
								</TouchableOpacity>
							);
						})}

						<LinearGradient
							colors={['#ecb607', '#f6c510', '#fbd232']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.continueGradient}>
							<TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
								<Text style={styles.continueText}>Continuar</Text>
							</TouchableOpacity>
						</LinearGradient>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8f6f1',
	},
	scrollContent: {
		flexGrow: 1,
	},
	wrapper: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 22,
		position: 'relative',
		backgroundColor: '#f8f6f1',
		overflow: 'visible',
	},
	headerWrap: {
		width: '100%',
		zIndex: 3,
	},
	headerTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.4,
		borderColor: '#ddd6ca',
		backgroundColor: '#f3f0e8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepText: {
		color: '#2d2a27',
		fontSize: 16,
		fontWeight: '700',
	},
	progressTrack: {
		marginTop: 10,
		width: '100%',
		height: 7,
		borderRadius: 999,
		backgroundColor: '#dfd9ce',
		overflow: 'hidden',
	},
	progressFill: {
		width: '28.6%',
		height: '100%',
		backgroundColor: '#d7a300',
	},
	title: {
		marginTop: 14,
		color: '#1f1f1f',
		fontSize: 16,
		lineHeight: 23,
		fontWeight: '800',
	},
	subtitle: {
		marginTop: 4,
		color: '#4f4740',
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 8,
		maxWidth: 280,
	},
	card: {
		width: Math.min(width * 0.84, 350),
		backgroundColor: 'transparent',
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingTop: 8,
		paddingBottom: 14,
		zIndex: 3,
	},
	optionCard: {
		borderWidth: 1.3,
		borderColor: '#cfc7ba',
		borderRadius: 14,
		minHeight: 92,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 9,
		marginBottom: 10,
		backgroundColor: '#ffffff',
	},
	optionCardSelected: {
		borderColor: '#e8a800',
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 3,
		backgroundColor: '#fff9e7',
	},
	optionLeft: {
		width: 84,
		height: 64,
		borderRadius: 12,
		backgroundColor: '#f7f4ec',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	optionLeftSelected: {
		backgroundColor: '#f5ebcf',
	},
	illustrationFallback: {
		width: 76,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
	},
	optionCenter: {
		flex: 1,
		paddingRight: 6,
	},
	optionTitle: {
		color: '#111111',
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 2,
	},
	optionTitleSelected: {
		color: '#111111',
	},
	optionDescription: {
		color: '#282828',
		fontSize: 12,
		lineHeight: 16,
		maxWidth: 190,
	},
	miniTrackRow: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 8,
	},
	miniTrack: {
		width: 15,
		height: 15,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#c9c2b6',
		backgroundColor: '#ffffff',
	},
	miniTrackActive: {
		backgroundColor: '#c5bdae',
		borderColor: '#c5bdae',
	},
	miniTrackActiveSelected: {
		backgroundColor: '#c8920a',
		borderColor: '#c8920a',
	},
	radioOuter: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.8,
		borderColor: '#cfc7ba',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	radioOuterSelected: {
		borderColor: '#e8a800',
		backgroundColor: '#e8b006',
	},
	continueGradient: {
		borderRadius: 999,
		marginTop: 8,
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.26,
		shadowRadius: 8,
		elevation: 4,
	},
	continueButton: {
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueText: {
		color: '#fdfcf9',
		fontWeight: '600',
		fontSize: 17,
	},
});
```

-----------------
## Form 3
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form03.tsx
```tsx
import React from 'react';

import Form03Intolerancia from '@/components/forms/form03-intolerancia';

export default function Form03Route() {
  return <Form03Intolerancia />;
}
```

### Componente principal: src/components/forms/form03-intolerancia.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

export default function Form03Intolerancia() {
  const router = useRouter();
  const [notes, setNotes] = useState('');

  const handleContinue = () => {
    router.push('/formularios/form04' as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.wrapper}>
          <FormBackgroundDecor />

          <View style={styles.headerWrap}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
                <MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
              </TouchableOpacity>
              <Text style={styles.stepText}>Paso 3/7</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <Text style={styles.title}>Tienes alguna alergia o intolerancia?</Text>
            <Text style={styles.subtitle}>Escribe los alimentos o ingredientes que debes evitar.</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.textArea}
              placeholder="Describa cual .."
              placeholderTextColor="#9f9587"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <LinearGradient
            colors={['#ecb607', '#f6c510', '#fbd232']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}>
            <TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
              <Text style={styles.continueText}>Continuar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f1',
  },
  scrollContent: {
    flexGrow: 1,
  },
  wrapper: {
    flex: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 24,
    position: 'relative',
    backgroundColor: '#f8f6f1',
    overflow: 'visible',
  },
  headerWrap: {
    width: '100%',
    zIndex: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: '#ddd6ca',
    backgroundColor: '#f3f0e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: '#2d2a27',
    fontSize: 16,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 10,
    width: '100%',
    height: 7,
    borderRadius: 999,
    backgroundColor: '#dfd9ce',
    overflow: 'hidden',
  },
  progressFill: {
    width: '42.9%',
    height: '100%',
    backgroundColor: '#d7a300',
  },
  title: {
    marginTop: 14,
    color: '#1f1f1f',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#4f4740',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: 300,
  },
  card: {
    width: Math.min(width * 0.84, 350),
    zIndex: 3,
  },
  textArea: {
    minHeight: 235,
    borderWidth: 1.3,
    borderColor: '#cfc7ba',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#26231f',
    fontSize: 18,
  },
  continueGradient: {
    width: Math.min(width * 0.84, 350),
    borderRadius: 999,
    marginTop: 300,
    shadowColor: '#e8a800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 3,
  },
  continueButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#fdfcf9',
    fontWeight: '600',
    fontSize: 17,
  },
});
```

-----------------
## Form 4
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form04.tsx
```tsx
import React from 'react';

import Form04Objetivo from '@/components/forms/form04-objetivo';

export default function Form04Route() {
  return <Form04Objetivo />;
}
```

### Componente principal: src/components/forms/form04-objetivo.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

type Objective = 'reducir' | 'ganar' | 'habitos';

const OPTIONS: {
	id: Objective;
	title: string;
	description: string;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	totalSegments: number;
	activeSegments: number;
}[] = [
	{
		id: 'reducir',
		title: 'Reducir peso',
		description: 'Plan enfocado en deficit calorico controlado',
		icon: 'scale-bathroom',
		totalSegments: 4,
		activeSegments: 3,
	},
	{
		id: 'ganar',
		title: 'Ganar musculo',
		description: 'Mayor aporte proteico y calorias de calidad',
		icon: 'arm-flex',
		totalSegments: 5,
		activeSegments: 5,
	},
	{
		id: 'habitos',
		title: 'Mejorar habitos',
		description: 'Alimentacion balanceada y sostenible',
		icon: 'star-four-points',
		totalSegments: 4,
		activeSegments: 4,
	},
];

export default function Form04Objetivo() {
	const router = useRouter();
	const [selected, setSelected] = useState<Objective>('reducir');

	const selectedOption = useMemo(() => OPTIONS.find((o) => o.id === selected), [selected]);

	const handleContinue = () => {
		console.log('Objetivo seleccionado:', selectedOption?.title ?? selected);
		router.push('/formularios/form05' as Href);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.wrapper}>
					<FormBackgroundDecor />

					<View style={styles.headerWrap}>
						<View style={styles.headerTopRow}>
							<TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
								<MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
							</TouchableOpacity>
							<Text style={styles.stepText}>Paso 4/7</Text>
						</View>

						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.title}>Cual es tu objetivo?</Text>
						<Text style={styles.subtitle}>Elige la meta principal que quieres alcanzar.</Text>
					</View>

					<View style={styles.card}>
						{OPTIONS.map((item) => {
							const isSelected = selected === item.id;

							return (
								<TouchableOpacity
									key={item.id}
									style={[styles.optionCard, isSelected && styles.optionCardSelected]}
									activeOpacity={0.9}
									onPress={() => setSelected(item.id)}>
									<View style={[styles.optionLeft, isSelected && styles.optionLeftSelected]}>
										<View style={styles.illustrationFallback}>
											<MaterialCommunityIcons
												name={item.icon}
												size={42}
												color={isSelected ? '#a9862a' : '#9a9284'}
											/>
										</View>
									</View>

									<View style={styles.optionCenter}>
										<Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{item.title}</Text>
										<Text style={styles.optionDescription}>{item.description}</Text>

										<View style={styles.miniTrackRow}>
											{Array.from({ length: item.totalSegments }).map((_, index) => {
												const active = index < item.activeSegments;
												return (
													<View
														key={`${item.id}-${index}`}
														style={[
															styles.miniTrack,
															active && styles.miniTrackActive,
															isSelected && active && styles.miniTrackActiveSelected,
														]}
													/>
												);
											})}
										</View>
									</View>

									<View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
										{isSelected ? <MaterialCommunityIcons name="check" size={14} color="#1f1f1f" /> : null}
									</View>
								</TouchableOpacity>
							);
						})}

						<LinearGradient
							colors={['#ecb607', '#f6c510', '#fbd232']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.continueGradient}>
							<TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
								<Text style={styles.continueText}>Continuar</Text>
							</TouchableOpacity>
						</LinearGradient>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8f6f1',
	},
	scrollContent: {
		flexGrow: 1,
	},
	wrapper: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 22,
		position: 'relative',
		backgroundColor: '#f8f6f1',
		overflow: 'visible',
	},
	headerWrap: {
		width: '100%',
		zIndex: 3,
	},
	headerTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.4,
		borderColor: '#ddd6ca',
		backgroundColor: '#f3f0e8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepText: {
		color: '#2d2a27',
		fontSize: 16,
		fontWeight: '700',
	},
	progressTrack: {
		marginTop: 10,
		width: '100%',
		height: 7,
		borderRadius: 999,
		backgroundColor: '#dfd9ce',
		overflow: 'hidden',
	},
	progressFill: {
		width: '57.2%',
		height: '100%',
		backgroundColor: '#d7a300',
	},
	title: {
		marginTop: 14,
		color: '#1f1f1f',
		fontSize: 16,
		lineHeight: 23,
		fontWeight: '800',
	},
	subtitle: {
		marginTop: 4,
		color: '#4f4740',
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 8,
		maxWidth: 280,
	},
	card: {
		width: Math.min(width * 0.84, 350),
		backgroundColor: 'transparent',
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingTop: 8,
		paddingBottom: 14,
		zIndex: 3,
	},
	optionCard: {
		borderWidth: 1.3,
		borderColor: '#cfc7ba',
		borderRadius: 14,
		minHeight: 92,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 9,
		marginBottom: 10,
		backgroundColor: '#ffffff',
	},
	optionCardSelected: {
		borderColor: '#e8a800',
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 3,
		backgroundColor: '#fff9e7',
	},
	optionLeft: {
		width: 84,
		height: 64,
		borderRadius: 12,
		backgroundColor: '#f7f4ec',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	optionLeftSelected: {
		backgroundColor: '#f5ebcf',
	},
	illustrationFallback: {
		width: 76,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
	},
	optionCenter: {
		flex: 1,
		paddingRight: 6,
	},
	optionTitle: {
		color: '#111111',
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 2,
	},
	optionTitleSelected: {
		color: '#111111',
	},
	optionDescription: {
		color: '#282828',
		fontSize: 12,
		lineHeight: 16,
		maxWidth: 190,
	},
	miniTrackRow: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 8,
	},
	miniTrack: {
		width: 15,
		height: 15,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#c9c2b6',
		backgroundColor: '#ffffff',
	},
	miniTrackActive: {
		backgroundColor: '#c5bdae',
		borderColor: '#c5bdae',
	},
	miniTrackActiveSelected: {
		backgroundColor: '#c8920a',
		borderColor: '#c8920a',
	},
	radioOuter: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.8,
		borderColor: '#cfc7ba',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	radioOuterSelected: {
		borderColor: '#e8a800',
		backgroundColor: '#e8b006',
	},
	continueGradient: {
		borderRadius: 999,
		marginTop: 8,
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.26,
		shadowRadius: 8,
		elevation: 4,
	},
	continueButton: {
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueText: {
		color: '#fdfcf9',
		fontWeight: '600',
		fontSize: 17,
	},
});
```

-----------------
## Form 5
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form05.tsx
```tsx
import React from 'react';

import Form05Preferencia from '@/components/forms/form05-preferencia';

export default function Form05Route() {
  return <Form05Preferencia />;
}
```

### Componente principal: src/components/forms/form05-preferencia.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

type FoodOption = {
	id: string;
	label: string;
	emoji: string;
};

type FoodGroup = {
	id: string;
	title: string;
	options: FoodOption[];
};

const GROUPS: FoodGroup[] = [
	{
		id: 'proteinas',
		title: 'Proteinas',
		options: [
			{ id: 'pollo', label: 'Pollo', emoji: 'ðŸ—' },
			{ id: 'res', label: 'Carne de Res', emoji: 'ðŸ¥©' },
			{ id: 'pescado', label: 'Pescado', emoji: 'ðŸŸ' },
			{ id: 'huevos', label: 'Huevos', emoji: 'ðŸ¥š' },
			{ id: 'legumbres', label: 'Legumbres', emoji: 'ðŸ«˜' },
			{ id: 'atun', label: 'Atun', emoji: 'ðŸ ' },
			{ id: 'pavo', label: 'Pavo', emoji: 'ðŸ¦ƒ' },
		],
	},
	{
		id: 'carbohidratos',
		title: 'Carbohidratos',
		options: [
			{ id: 'arroz', label: 'Arroz', emoji: 'ðŸš' },
			{ id: 'pan', label: 'Pan', emoji: 'ðŸž' },
			{ id: 'pasta', label: 'Pasta', emoji: 'ðŸ' },
			{ id: 'papas', label: 'Papas', emoji: 'ðŸ¥”' },
			{ id: 'avena', label: 'Avena', emoji: 'ðŸŒ¾' },
			{ id: 'quinoa', label: 'Quinoa', emoji: 'ðŸ¥£' },
			{ id: 'batata', label: 'Batata', emoji: 'ðŸ ' },
		],
	},
	{
		id: 'lacteos',
		title: 'Lacteos',
		options: [
			{ id: 'leche', label: 'Leche', emoji: 'ðŸ¥›' },
			{ id: 'yogur', label: 'Yogur', emoji: 'ðŸ¥£' },
			{ id: 'queso', label: 'Queso', emoji: 'ðŸ§€' },
			{ id: 'cuajada', label: 'Cuna', emoji: 'ðŸ§€' },
			{ id: 'mantequilla', label: 'Mantequilla', emoji: 'ðŸ§ˆ' },
			{ id: 'crema', label: 'Crema', emoji: 'ðŸ¶' },
			{ id: 'requeson', label: 'Requeson', emoji: 'ðŸ¥£' },
		],
	},
	{
		id: 'vegetales',
		title: 'Vegetales',
		options: [
			{ id: 'brocoli', label: 'Brocoli', emoji: 'ðŸ¥¦' },
			{ id: 'zanahoria', label: 'Zanahorias', emoji: 'ðŸ¥•' },
			{ id: 'espinaca', label: 'Espinacas', emoji: 'ðŸ¥¬' },
			{ id: 'cebolla', label: 'Cebollas', emoji: 'ðŸ§…' },
			{ id: 'pimientos', label: 'Pimientos', emoji: 'ðŸ«‘' },
			{ id: 'lechuga', label: 'Lechuga', emoji: 'ðŸ¥—' },
		],
	},
	{
		id: 'frutas',
		title: 'Frutas',
		options: [
			{ id: 'manzana', label: 'Manzanas', emoji: 'ðŸŽ' },
			{ id: 'banana', label: 'Bananas', emoji: 'ðŸŒ' },
			{ id: 'naranja', label: 'Naranjas', emoji: 'ðŸŠ' },
			{ id: 'uvas', label: 'Uvas', emoji: 'ðŸ‡' },
			{ id: 'fresas', label: 'Fresas', emoji: 'ðŸ“' },
			{ id: 'sandia', label: 'Sandia', emoji: 'ðŸ‰' },
			{ id: 'arandanos', label: 'Arandanos', emoji: 'ðŸ«' },
		],
	},
];

export default function Form05Preferencia() {
	const router = useRouter();
	const [selected, setSelected] = useState<Set<string>>(new Set(['lacteos:leche']));

	const selectedCount = useMemo(() => selected.size, [selected]);

	const toggleOption = (groupId: string, optionId: string) => {
		const key = `${groupId}:${optionId}`;
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const handleContinue = () => {
		router.push('/formularios/form06' as Href);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.wrapper}>
					<FormBackgroundDecor />

					<View style={styles.headerWrap}>
						<View style={styles.headerTopRow}>
							<TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
								<MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
							</TouchableOpacity>
							<Text style={styles.stepText}>Paso 5/7</Text>
						</View>

						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.title}>Que alimentos le gusta consumir con frecuencia?</Text>
						<Text style={styles.subtitle}>
							Selecciona todos los que formen parte de tu rutina habitual.
						</Text>
					</View>

					<View style={styles.card}>
						{GROUPS.map((group) => (
							<View key={group.id} style={styles.groupBlock}>
								<Text style={styles.groupTitle}>{group.title}</Text>
								<View style={styles.chipsWrap}>
									{group.options.map((option) => {
										const key = `${group.id}:${option.id}`;
										const active = selected.has(key);
										return (
											<TouchableOpacity
												key={key}
												activeOpacity={0.85}
												onPress={() => toggleOption(group.id, option.id)}
												style={[styles.chip, active && styles.chipActive]}>
												<Text style={styles.chipEmoji}>{option.emoji}</Text>
												<Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						))}

						<Text style={styles.selectedCount}>{`${selectedCount} seleccionado(s)`}</Text>

						<LinearGradient
							colors={['#ecb607', '#f6c510', '#fbd232']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.continueGradient}>
							<TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
								<Text style={styles.continueText}>Continuar</Text>
							</TouchableOpacity>
						</LinearGradient>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8f6f1',
	},
	scrollContent: {
		flexGrow: 1,
	},
	wrapper: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 22,
		position: 'relative',
		backgroundColor: '#f8f6f1',
		overflow: 'visible',
	},
	headerWrap: {
		width: '100%',
		zIndex: 3,
	},
	headerTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.4,
		borderColor: '#ddd6ca',
		backgroundColor: '#f3f0e8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepText: {
		color: '#2d2a27',
		fontSize: 16,
		fontWeight: '700',
	},
	progressTrack: {
		marginTop: 10,
		width: '100%',
		height: 7,
		borderRadius: 999,
		backgroundColor: '#dfd9ce',
		overflow: 'hidden',
	},
	progressFill: {
		width: '71.5%',
		height: '100%',
		backgroundColor: '#d7a300',
	},
	title: {
		marginTop: 14,
		color: '#1f1f1f',
		fontSize: 16,
		lineHeight: 23,
		fontWeight: '800',
	},
	subtitle: {
		marginTop: 4,
		color: '#4f4740',
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 8,
		maxWidth: 280,
	},
	card: {
		width: Math.min(width * 0.84, 350),
		backgroundColor: 'transparent',
		borderRadius: 0,
		paddingHorizontal: 0,
		paddingTop: 8,
		paddingBottom: 14,
		zIndex: 3,
	},
	groupBlock: {
		marginBottom: 10,
	},
	groupTitle: {
		color: '#111111',
		fontSize: 16,
		fontWeight: '800',
		marginBottom: 6,
	},
	chipsWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	chip: {
		minHeight: 42,
		borderRadius: 21,
		borderWidth: 1.5,
		borderColor: '#cfc7ba',
		backgroundColor: '#ffffff',
		paddingHorizontal: 14,
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	chipActive: {
		borderColor: '#e8a800',
		backgroundColor: '#fff9e7',
	},
	chipText: {
		color: '#2a2824',
		fontSize: 12,
		fontWeight: '600',
	},
	chipEmoji: {
		fontSize: 14,
	},
	chipTextActive: {
		color: '#c8920a',
		fontWeight: '700',
	},
	selectedCount: {
		color: '#9e9588',
		fontSize: 10,
		textAlign: 'right',
		marginTop: 2,
		marginBottom: 10,
	},
	continueGradient: {
		borderRadius: 999,
		marginTop: 8,
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.26,
		shadowRadius: 8,
		elevation: 4,
	},
	continueButton: {
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueText: {
		color: '#fdfcf9',
		fontWeight: '600',
		fontSize: 17,
	},
});
```

-----------------
## Form 6
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form06.tsx
```tsx
import React from 'react';

import Form06Evitar from '@/components/forms/form06-evitar';

export default function Form06Route() {
  return <Form06Evitar />;
}
```

### Componente principal: src/components/forms/form06-evitar.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

export default function Form06Evitar() {
	const router = useRouter();
	const [notes, setNotes] = useState('');

	const handleContinue = () => {
		router.push('/formularios/form07' as Href);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.wrapper}>
					<FormBackgroundDecor />

					<View style={styles.headerWrap}>
						<View style={styles.headerTopRow}>
							<TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
								<MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
							</TouchableOpacity>
							<Text style={styles.stepText}>Paso 6/7</Text>
						</View>

						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.title}>Hay alimentos que no le gustan o que prefiere evitar?</Text>
						<Text style={styles.subtitle}>Compartenos cualquier restriccion o preferencia especial.</Text>
					</View>

					<View style={styles.card}>
						<TextInput
							style={styles.textArea}
							placeholder="Especifique cual.."
							placeholderTextColor="#b2a58f"
							multiline
							textAlignVertical="top"
							value={notes}
							onChangeText={setNotes}
						/>
					</View>

					<LinearGradient
						colors={['#ecb607', '#f6c510', '#fbd232']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.continueGradient}>
						<TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
							<Text style={styles.continueText}>Continuar</Text>
						</TouchableOpacity>
					</LinearGradient>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8f6f1',
	},
	scrollContent: {
		flexGrow: 1,
	},
	wrapper: {
		flex: 1,
		minHeight: '100%',
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 22,
		position: 'relative',
		backgroundColor: '#f8f6f1',
		overflow: 'visible',
	},
	headerWrap: {
		width: '100%',
		zIndex: 3,
	},
	headerTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.4,
		borderColor: '#ddd6ca',
		backgroundColor: '#f3f0e8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepText: {
		color: '#2d2a27',
		fontSize: 16,
		fontWeight: '700',
	},
	progressTrack: {
		marginTop: 10,
		width: '100%',
		height: 7,
		borderRadius: 999,
		backgroundColor: '#dfd9ce',
		overflow: 'hidden',
	},
	progressFill: {
		width: '85.7%',
		height: '100%',
		backgroundColor: '#d7a300',
	},
	title: {
		marginTop: 14,
		color: '#1f1f1f',
		fontSize: 16,
		lineHeight: 23,
		fontWeight: '800',
	},
	subtitle: {
		marginTop: 4,
		color: '#4f4740',
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 14,
		maxWidth: 300,
	},
	card: {
		width: Math.min(width * 0.84, 350),
		zIndex: 3,
	},
	textArea: {
		minHeight: 235,
		borderWidth: 1.3,
		borderColor: '#cfc7ba',
		borderRadius: 14,
		backgroundColor: '#ffffff',
		paddingHorizontal: 16,
		paddingVertical: 16,
		color: '#26231f',
		fontSize: 18,
	},
	continueGradient: {
		width: Math.min(width * 0.84, 350),
		borderRadius: 999,
		marginTop: 300,
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.26,
		shadowRadius: 8,
		elevation: 4,
		zIndex: 3,
	},
	continueButton: {
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueText: {
		color: '#fdfcf9',
		fontWeight: '600',
		fontSize: 17,
	},
});
```

-----------------
## Form 7
Todo el codigo
-----------------

### Archivo de ruta: src/app/formularios/form07.tsx
```tsx
import React from 'react';

import Form07Deporte from '@/components/forms/form07-deporte';

export default function Form07Route() {
  return <Form07Deporte />;
}
```

### Componente principal: src/components/forms/form07-deporte.tsx
```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

const { width } = Dimensions.get('window');

type SportLevel = 'gym' | 'running' | 'football' | 'basket' | 'cycling' | 'swimming';

const OPTIONS: {
	id: SportLevel;
	title: string;
	description: string;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	totalSegments: number;
	activeSegments: number;
}[] = [
	{ id: 'gym', title: 'Gimnasio', description: 'Entrenamiento de fuerza y pesas', icon: 'dumbbell', totalSegments: 5, activeSegments: 5 },
	{ id: 'running', title: 'Running', description: 'Carreras o trotes en ruta o cinta', icon: 'run', totalSegments: 5, activeSegments: 4 },
	{ id: 'football', title: 'FÃºtbol', description: 'Partidos o entrenamientos semanales', icon: 'soccer', totalSegments: 5, activeSegments: 4 },
	{ id: 'basket', title: 'Basquet', description: 'Juego recreativo o competitivo', icon: 'basketball', totalSegments: 5, activeSegments: 4 },
	{ id: 'cycling', title: 'Ciclismo', description: 'Rutas al aire libre o bicicleta fija', icon: 'bike', totalSegments: 5, activeSegments: 5 },
	{ id: 'swimming', title: 'NataciÃ³n', description: 'Sesiones de nado por distancia o tiempo', icon: 'swim', totalSegments: 5, activeSegments: 5 },
];

export default function Form07Deporte() {
	const router = useRouter();
	const [selected, setSelected] = useState<SportLevel>('gym');

	const selectedOption = useMemo(() => OPTIONS.find((o) => o.id === selected), [selected]);

	const handleContinue = () => {
		console.log('Deporte seleccionado:', selectedOption?.title ?? selected);
		router.push('/onboarding/loading' as Href);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.wrapper}>
					<FormBackgroundDecor />

					<View style={styles.headerWrap}>
						<View style={styles.headerTopRow}>
							<TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.9}>
								<MaterialCommunityIcons name="chevron-left" size={22} color="#6f675f" />
							</TouchableOpacity>
							<Text style={styles.stepText}>Paso 7/7</Text>
						</View>

						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.title}>Practicas actualmente algun deporte?</Text>
						<Text style={styles.subtitle}>Si no practicas uno hoy, elige el que te gustaria comenzar.</Text>
					</View>

					<View style={styles.card}>
						{OPTIONS.map((item) => {
							const isSelected = selected === item.id;

							return (
								<TouchableOpacity
									key={item.id}
									style={[styles.optionCard, isSelected && styles.optionCardSelected]}
									activeOpacity={0.9}
									onPress={() => setSelected(item.id)}>
									<View style={[styles.optionLeft, isSelected && styles.optionLeftSelected]}>
										<View style={styles.illustrationFallback}>
											<MaterialCommunityIcons
												name={item.icon}
												size={42}
												color={isSelected ? '#a9862a' : '#9a9284'}
											/>
										</View>
									</View>

									<View style={styles.optionCenter}>
										<Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{item.title}</Text>
										<Text style={styles.optionDescription}>{item.description}</Text>

										<View style={styles.miniTrackRow}>
											{Array.from({ length: item.totalSegments }).map((_, index) => {
												const active = index < item.activeSegments;
												return (
													<View
														key={`${item.id}-${index}`}
														style={[
															styles.miniTrack,
															active && styles.miniTrackActive,
															isSelected && active && styles.miniTrackActiveSelected,
														]}
													/>
												);
											})}
										</View>
									</View>

									<View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
										{isSelected ? <MaterialCommunityIcons name="check" size={14} color="#1f1f1f" /> : null}
									</View>
								</TouchableOpacity>
							);
						})}

						<LinearGradient
							colors={['#ecb607', '#f6c510', '#fbd232']}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.continueGradient}>
							<TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
								<Text style={styles.continueText}>Finalizar</Text>
							</TouchableOpacity>
						</LinearGradient>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8f6f1',
	},
	scrollContent: {
		flexGrow: 1,
	},
	wrapper: {
		flex: 1,
		minHeight: '100%',
		alignItems: 'center',
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 22,
		position: 'relative',
		backgroundColor: '#f8f6f1',
		overflow: 'visible',
	},
	headerWrap: {
		width: '100%',
		zIndex: 3,
	},
	headerTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.4,
		borderColor: '#ddd6ca',
		backgroundColor: '#f3f0e8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepText: {
		color: '#2d2a27',
		fontSize: 16,
		fontWeight: '700',
	},
	progressTrack: {
		marginTop: 10,
		width: '100%',
		height: 7,
		borderRadius: 999,
		backgroundColor: '#dfd9ce',
		overflow: 'hidden',
	},
	progressFill: {
		width: '100%',
		height: '100%',
		backgroundColor: '#d7a300',
	},
	title: {
		marginTop: 14,
		color: '#1f1f1f',
		fontSize: 16,
		lineHeight: 23,
		fontWeight: '800',
	},
	subtitle: {
		marginTop: 4,
		color: '#4f4740',
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 8,
		maxWidth: 300,
	},
	card: {
		width: Math.min(width * 0.84, 350),
		backgroundColor: 'transparent',
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingTop: 8,
		paddingBottom: 14,
		zIndex: 3,
	},
	optionCard: {
		borderWidth: 1.3,
		borderColor: '#cfc7ba',
		borderRadius: 14,
		minHeight: 92,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 9,
		marginBottom: 10,
		backgroundColor: '#ffffff',
	},
	optionCardSelected: {
		borderColor: '#e8a800',
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 3,
		backgroundColor: '#fff9e7',
	},
	optionLeft: {
		width: 84,
		height: 64,
		borderRadius: 12,
		backgroundColor: '#f7f4ec',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	optionLeftSelected: {
		backgroundColor: '#f5ebcf',
	},
	illustrationFallback: {
		width: 76,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
	},
	optionCenter: {
		flex: 1,
		paddingRight: 6,
	},
	optionTitle: {
		color: '#111111',
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 2,
	},
	optionTitleSelected: {
		color: '#111111',
	},
	optionDescription: {
		color: '#282828',
		fontSize: 12,
		lineHeight: 16,
		maxWidth: 190,
	},
	miniTrackRow: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 8,
	},
	miniTrack: {
		width: 15,
		height: 15,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#c9c2b6',
		backgroundColor: '#ffffff',
	},
	miniTrackActive: {
		backgroundColor: '#c5bdae',
		borderColor: '#c5bdae',
	},
	miniTrackActiveSelected: {
		backgroundColor: '#c8920a',
		borderColor: '#c8920a',
	},
	radioOuter: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.8,
		borderColor: '#cfc7ba',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	radioOuterSelected: {
		borderColor: '#e8a800',
		backgroundColor: '#e8b006',
	},
	continueGradient: {
		borderRadius: 999,
		marginTop: 8,
		shadowColor: '#e8a800',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.26,
		shadowRadius: 8,
		elevation: 4,
	},
	continueButton: {
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueText: {
		color: '#fdfcf9',
		fontWeight: '600',
		fontSize: 17,
	},
});
```


