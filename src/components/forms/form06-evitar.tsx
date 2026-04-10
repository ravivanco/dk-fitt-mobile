import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from './components/form-background-decor';

import { useOnboarding } from '../../context/onboarding-context';

const { width } = Dimensions.get('window');

export default function Form06Evitar() {
	const router = useRouter();
	const [notes, setNotes] = useState('');
	const { updateData } = useOnboarding();

	const handleContinue = () => {
		updateData({ restricciones_alimenticias: notes });
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
