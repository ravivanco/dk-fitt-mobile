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
			{ id: 'pollo', label: 'Pollo', emoji: '🍗' },
			{ id: 'res', label: 'Carne de Res', emoji: '🥩' },
			{ id: 'pescado', label: 'Pescado', emoji: '🐟' },
			{ id: 'huevos', label: 'Huevos', emoji: '🥚' },
			{ id: 'legumbres', label: 'Legumbres', emoji: '🫘' },
			{ id: 'atun', label: 'Atun', emoji: '🐠' },
			{ id: 'pavo', label: 'Pavo', emoji: '🦃' },
		],
	},
	{
		id: 'carbohidratos',
		title: 'Carbohidratos',
		options: [
			{ id: 'arroz', label: 'Arroz', emoji: '🍚' },
			{ id: 'pan', label: 'Pan', emoji: '🍞' },
			{ id: 'pasta', label: 'Pasta', emoji: '🍝' },
			{ id: 'papas', label: 'Papas', emoji: '🥔' },
			{ id: 'avena', label: 'Avena', emoji: '🌾' },
			{ id: 'quinoa', label: 'Quinoa', emoji: '🥣' },
			{ id: 'batata', label: 'Batata', emoji: '🍠' },
		],
	},
	{
		id: 'lacteos',
		title: 'Lacteos',
		options: [
			{ id: 'leche', label: 'Leche', emoji: '🥛' },
			{ id: 'yogur', label: 'Yogur', emoji: '🥣' },
			{ id: 'queso', label: 'Queso', emoji: '🧀' },
			{ id: 'cuajada', label: 'Cuna', emoji: '🧀' },
			{ id: 'mantequilla', label: 'Mantequilla', emoji: '🧈' },
			{ id: 'crema', label: 'Crema', emoji: '🍶' },
			{ id: 'requeson', label: 'Requeson', emoji: '🥣' },
		],
	},
	{
		id: 'vegetales',
		title: 'Vegetales',
		options: [
			{ id: 'brocoli', label: 'Brocoli', emoji: '🥦' },
			{ id: 'zanahoria', label: 'Zanahorias', emoji: '🥕' },
			{ id: 'espinaca', label: 'Espinacas', emoji: '🥬' },
			{ id: 'cebolla', label: 'Cebollas', emoji: '🧅' },
			{ id: 'pimientos', label: 'Pimientos', emoji: '🫑' },
			{ id: 'lechuga', label: 'Lechuga', emoji: '🥗' },
		],
	},
	{
		id: 'frutas',
		title: 'Frutas',
		options: [
			{ id: 'manzana', label: 'Manzanas', emoji: '🍎' },
			{ id: 'banana', label: 'Bananas', emoji: '🍌' },
			{ id: 'naranja', label: 'Naranjas', emoji: '🍊' },
			{ id: 'uvas', label: 'Uvas', emoji: '🍇' },
			{ id: 'fresas', label: 'Fresas', emoji: '🍓' },
			{ id: 'sandia', label: 'Sandia', emoji: '🍉' },
			{ id: 'arandanos', label: 'Arandanos', emoji: '🫐' },
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
