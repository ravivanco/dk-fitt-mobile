import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Gender = 'Masculino' | 'Femenino' | 'Otro';

export default function RegisterScreen() {
	const router = useRouter();

	const [name, setName] = useState('');
	const [lastName, setLastName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [gender, setGender] = useState<Gender>('Masculino');

	const goToLogin = () => {
		router.replace('/auth/login' as Href);
	};

	return (
		<View style={styles.container}>
			<View style={[styles.block, styles.blockTopLeft]} />
			<View style={[styles.block, styles.blockBottomRight]} />
			<View style={[styles.sideBar, styles.sideBarRight]} />
			<View style={[styles.sideBar, styles.sideBarLeft]} />

			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					<View style={styles.card}>
						<Text style={styles.title}>Crear Cuenta</Text>
						<Text style={styles.subtitle}>Completa tus datos para empezar</Text>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Nombre</Text>
							<View style={styles.inputWrap}>
								<MaterialCommunityIcons name="account" size={20} color="#8f877d" />
								<TextInput
									placeholder="Nombre"
									placeholderTextColor="#8f877d"
									value={name}
									onChangeText={setName}
									style={styles.input}
								/>
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Apellido</Text>
							<View style={styles.inputWrap}>
								<MaterialCommunityIcons name="account" size={20} color="#8f877d" />
								<TextInput
									placeholder="Apellido"
									placeholderTextColor="#8f877d"
									value={lastName}
									onChangeText={setLastName}
									style={styles.input}
								/>
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Fecha de nacimiento</Text>
							<View style={styles.inputWrap}>
								<TextInput
									placeholder="dd/mm/aaaa"
									placeholderTextColor="#8f877d"
									value={birthDate}
									onChangeText={setBirthDate}
									style={styles.input}
								/>
								<MaterialCommunityIcons name="calendar-month-outline" size={20} color="#8f877d" />
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Edad</Text>
							<View style={styles.inputWrap}>
								<MaterialCommunityIcons name="account-outline" size={20} color="#8f877d" />
								<Text style={styles.disabledText}>Se calcula automaticamente</Text>
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Sexo</Text>
							<View style={styles.genderRow}>
								{(['Masculino', 'Femenino', 'Otro'] as Gender[]).map((item) => {
									const selected = gender === item;
									return (
										<TouchableOpacity
											key={item}
											style={[styles.genderChip, selected && styles.genderChipSelected]}
											onPress={() => setGender(item)}>
											<Text style={[styles.genderText, selected && styles.genderTextSelected]}>{item}</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Correo electronico</Text>
							<View style={styles.inputWrap}>
								<MaterialCommunityIcons name="email-outline" size={20} color="#8f877d" />
								<TextInput
									placeholder="Correo electronico"
									placeholderTextColor="#8f877d"
									autoCapitalize="none"
									keyboardType="email-address"
									value={email}
									onChangeText={setEmail}
									style={styles.input}
								/>
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Contrasena</Text>
							<View style={styles.inputWrap}>
								<MaterialCommunityIcons name="lock-outline" size={20} color="#8f877d" />
								<TextInput
									placeholder="Contrasena"
									placeholderTextColor="#8f877d"
									secureTextEntry={!showPassword}
									value={password}
									onChangeText={setPassword}
									style={styles.input}
								/>
								<TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
									<MaterialCommunityIcons
										name={showPassword ? 'eye-off-outline' : 'eye-outline'}
										size={20}
										color="#8f877d"
									/>
								</TouchableOpacity>
							</View>
						</View>

						<Pressable style={styles.buttonShadow}>
							<LinearGradient colors={['#ecb607', '#f6c510', '#fbd232']} style={styles.button}>
								<Text style={styles.buttonText}>Crear Cuenta</Text>
							</LinearGradient>
						</Pressable>

						<View style={styles.loginWrap}>
							<Text style={styles.loginText}>Ya tienes una cuenta? </Text>
							<Pressable onPress={goToLogin}>
								<Text style={styles.loginLink}>Iniciar sesion</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fdfcf9',
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingHorizontal: 16,
		paddingVertical: 18,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 24,
		paddingHorizontal: 18,
		paddingVertical: 22,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 3 },
		elevation: 4,
	},
	title: {
		color: '#1a1a1a',
		textAlign: 'center',
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
	},
	subtitle: {
		color: '#5f564d',
		textAlign: 'center',
		fontSize: 16,
		marginTop: 4,
		marginBottom: 14,
	},
	formGroup: {
		marginBottom: 8,
	},
	label: {
		color: '#5f564d',
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 6,
	},
	inputWrap: {
		height: 54,
		borderWidth: 1.6,
		borderColor: '#b7aea4',
		borderRadius: 14,
		backgroundColor: '#ffffff',
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	input: {
		flex: 1,
		color: '#5f564d',
		fontSize: 16,
	},
	disabledText: {
		color: '#8f877d',
		fontSize: 16,
	},
	genderRow: {
		flexDirection: 'row',
		gap: 8,
	},
	genderChip: {
		flex: 1,
		height: 46,
		borderWidth: 1.6,
		borderColor: '#b7aea4',
		borderRadius: 23,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	genderChipSelected: {
		backgroundColor: '#f8f5ef',
		borderColor: '#99824d',
	},
	genderText: {
		color: '#5f564d',
		fontSize: 16,
		fontWeight: '600',
	},
	genderTextSelected: {
		color: '#5f564d',
		fontWeight: '700',
	},
	buttonShadow: {
		marginTop: 8,
		borderRadius: 16,
		shadowColor: '#d3a100',
		shadowOpacity: 0.4,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
	},
	button: {
		borderRadius: 16,
		height: 58,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 20,
		fontWeight: '700',
	},
	loginWrap: {
		marginTop: 12,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	loginText: {
		color: '#8f877d',
		fontSize: 16,
	},
	loginLink: {
		color: '#5f564d',
		fontSize: 16,
		fontWeight: '700',
	},
	block: {
		position: 'absolute',
		width: 62,
		height: 62,
		backgroundColor: '#ecb607',
		transform: [{ rotate: '35deg' }],
	},
	blockTopLeft: {
		top: 40,
		left: 12,
	},
	blockBottomRight: {
		bottom: 42,
		right: 18,
	},
	sideBar: {
		position: 'absolute',
		width: 8,
		height: 50,
		backgroundColor: '#99824d',
		transform: [{ rotate: '42deg' }],
	},
	sideBarRight: {
		right: -2,
		top: 270,
	},
	sideBarLeft: {
		left: -2,
		bottom: 180,
	},
});
