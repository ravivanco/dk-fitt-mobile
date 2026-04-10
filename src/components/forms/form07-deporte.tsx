import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';
import { useOnboarding } from '../../context/onboarding-context';
import { profileService } from '../../services/profile.service';
import { authStore } from '../../store/auth.store';

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
		{ id: 'football', title: 'Fútbol', description: 'Partidos o entrenamientos semanales', icon: 'soccer', totalSegments: 5, activeSegments: 4 },
		{ id: 'basket', title: 'Basquet', description: 'Juego recreativo o competitivo', icon: 'basketball', totalSegments: 5, activeSegments: 4 },
		{ id: 'cycling', title: 'Ciclismo', description: 'Rutas al aire libre o bicicleta fija', icon: 'bike', totalSegments: 5, activeSegments: 5 },
		{ id: 'swimming', title: 'Natación', description: 'Sesiones de nado por distancia o tiempo', icon: 'swim', totalSegments: 5, activeSegments: 5 },
	];

export default function Form07Deporte() {
	const router = useRouter();
	const [selected, setSelected] = useState<SportLevel>('gym');
	const [isSaving, setIsSaving] = useState(false);
	const { data, updateData, resetData } = useOnboarding();

	const deporteMap = {
		gym: 'gimnasio',
		running: 'running',
		football: 'futbol',
		basket: 'basquet',
		cycling: 'ciclismo',
		swimming: 'natacion',
	} as const;

	const selectedOption = useMemo(() => OPTIONS.find((o) => o.id === selected), [selected]);

	const handleContinue = async () => {
		if (isSaving) return;
		setIsSaving(true);

		try {
			// 1. Guardar el deporte en el contexto
			const datosCompletos = {
				...data,
				deporte: deporteMap[selected],
			};

			// 2. Enviar TODOS los datos del onboarding a la API
			await profileService.saveOnboardingProfile(datosCompletos);

			// 3. Actualizar el usuario en AsyncStorage para que
			//    formulario_completado = true en la próxima apertura
			const session = await authStore.loadSession();
			if (session) {
				await authStore.saveSession({
					access_token: session.access_token,
					refresh_token: session.refresh_token,
					expires_in: 900,
					user: {
						...session.user,
						formulario_completado: true,
					},
				});
			}

			// 4. Limpiar el contexto del onboarding
			resetData();

			// 5. Navegar a la pantalla de carga/bienvenida
			router.replace('/onboarding/loading');

		} catch (error) {
			const backendData = (error as { backendData?: unknown; response?: { data?: unknown } })?.backendData
				?? (error as { response?: { data?: unknown } })?.response?.data;

			if (__DEV__) {
				console.error('Error guardando onboarding:', error);
				if (backendData) {
					console.error('error.response.data:', backendData);
				}
			}

			const message = backendData
				? JSON.stringify(backendData)
				: error instanceof Error
					? error.message
					: 'Error al guardar tu perfil. Intenta de nuevo.';

			Alert.alert(
				'Error al guardar',
				message,
				[{ text: 'Reintentar', onPress: () => setIsSaving(false) }],
			);
		} finally {
			setIsSaving(false);
		}
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
							<TouchableOpacity
								style={styles.continueButton}
								activeOpacity={0.9}
								onPress={handleContinue}
								disabled={isSaving}>
								{isSaving
									? <ActivityIndicator color="#fdfcf9" />
									: <Text style={styles.continueText}>Finalizar</Text>
								}
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
