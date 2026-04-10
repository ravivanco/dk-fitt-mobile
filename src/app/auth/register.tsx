import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DatePicker, { type DateType } from 'react-native-ui-datepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { useAuth } from '@/hooks/use-auth';

type Gender = 'Masculino' | 'Femenino' | 'Otro';

export default function RegisterScreen() {
	const router = useRouter();
	const { register, isLoading, error, clearError } = useAuth();

	const [name, setName] = useState('');
	const [lastName, setLastName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [gender, setGender] = useState<Gender>('Masculino');
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date(1999, 0, 8));
	const [draftDate, setDraftDate] = useState<Date>(new Date(1999, 0, 8));

	const goToLogin = () => {
		router.replace('/auth/login' as Href);
	};

	const parsedBirthDate = useMemo(() => {
		const raw = birthDate.trim();

		// Soporta YYYY-MM-DD y DD/MM/YYYY para no cambiar la UX visual.
		if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
			return raw;
		}

		if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
			const [dd, mm, yyyy] = raw.split('/');
			return `${yyyy}-${mm}-${dd}`;
		}

		return null;
	}, [birthDate]);

	const formatDateForInput = (date: Date) => {
		const dd = `${date.getDate()}`.padStart(2, '0');
		const mm = `${date.getMonth() + 1}`.padStart(2, '0');
		const yyyy = `${date.getFullYear()}`;
		return `${dd}/${mm}/${yyyy}`;
	};

	const openDatePicker = () => {
		if (isLoading) return;
		setDraftDate(selectedDate);
		setIsCalendarOpen(true);
	};

	const onCalendarChange = (params: { date: DateType }) => {
		const picked = params.date;
		if (!picked) return;
		const parsed = dayjs(picked);
		if (!parsed.isValid()) return;
		setDraftDate(parsed.toDate());
	};

	const confirmCalendarDate = () => {
		setSelectedDate(draftDate);
		setBirthDate(formatDateForInput(draftDate));
		setIsCalendarOpen(false);
	};

	const calculatedAge = useMemo(() => {
		if (!parsedBirthDate) return null;
		const birth = new Date(parsedBirthDate);
		if (Number.isNaN(birth.getTime())) return null;

		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}

		return age;
	}, [parsedBirthDate]);

	const goToFirstForm = async () => {
		if (!email.trim()) {
			Alert.alert('Campo requerido', 'Ingresa tu correo institucional');
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			Alert.alert('Correo invalido', 'Ingresa un correo valido');
			return;
		}

		if (password.length < 8) {
			Alert.alert('Contrasena debil', 'La contrasena debe tener al menos 8 caracteres');
			return;
		}

		if (!/[A-Z]/.test(password)) {
			Alert.alert('Contrasena debil', 'La contrasena debe tener al menos una letra mayuscula');
			return;
		}

		if (!/[a-z]/.test(password)) {
			Alert.alert('Contrasena debil', 'La contrasena debe tener al menos una letra minuscula');
			return;
		}

		if (!/\d/.test(password)) {
			Alert.alert('Contrasena debil', 'La contrasena debe tener al menos un numero');
			return;
		}

		if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
			Alert.alert('Contrasena debil', 'La contrasena debe tener al menos un caracter especial como ! @ # $ % ^ & * ( ) + -');
			return;
		}

		if (!name.trim() || !lastName.trim()) {
			Alert.alert('Campo requerido', 'Ingresa tu nombre y apellido');
			return;
		}

		if (!parsedBirthDate) {
			Alert.alert('Fecha invalida', 'Usa el formato dd/mm/aaaa o YYYY-MM-DD');
			return;
		}

		if (calculatedAge === null || Number.isNaN(calculatedAge) || calculatedAge < 16 || calculatedAge > 99) {
			Alert.alert('Edad invalida', 'La edad debe estar entre 16 y 99 anos');
			return;
		}

		const sexo = gender === 'Masculino' ? 'M' : gender === 'Femenino' ? 'F' : 'O';

		await register({
			correo_institucional: email.trim().toLowerCase(),
			contrasena: password,
			nombres: name.trim(),
			apellidos: lastName.trim(),
			edad: calculatedAge,
			sexo,
			fecha_nacimiento: parsedBirthDate,
		});
	};

	useEffect(() => {
		if (!error) return;
		Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
	}, [error, clearError]);

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
									editable={!isLoading}
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
									editable={!isLoading}
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
									style={styles.input}
									editable={false}
								/>
								<TouchableOpacity onPress={openDatePicker} disabled={isLoading}>
									<MaterialCommunityIcons name="calendar-month-outline" size={20} color="#8f877d" />
								</TouchableOpacity>
							</View>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.label}>Edad</Text>
							<View style={styles.inputWrap}>
								<MaterialCommunityIcons name="account-outline" size={20} color="#8f877d" />
								<Text style={styles.disabledText}>
									{typeof calculatedAge === 'number' && calculatedAge >= 0
										? `${calculatedAge} anos`
										: 'Se calcula automaticamente'}
								</Text>
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
											onPress={() => setGender(item)}
											disabled={isLoading}>
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
									editable={!isLoading}
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
									editable={!isLoading}
								/>
								<TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} disabled={isLoading}>
									<MaterialCommunityIcons
										name={showPassword ? 'eye-off-outline' : 'eye-outline'}
										size={20}
										color="#8f877d"
									/>
								</TouchableOpacity>
							</View>
						</View>

						<Pressable style={styles.buttonShadow} onPress={goToFirstForm} disabled={isLoading}>
							<LinearGradient colors={['#ecb607', '#f6c510', '#fbd232']} style={styles.button}>
								{isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Crear Cuenta</Text>}
							</LinearGradient>
						</Pressable>

						<View style={styles.loginWrap}>
							<Text style={styles.loginText}>Ya tienes una cuenta? </Text>
							<Pressable onPress={goToLogin} disabled={isLoading}>
								<Text style={styles.loginLink}>Iniciar sesion</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={() => setIsCalendarOpen(false)}>
				<View style={styles.calendarOverlay}>
					<View style={styles.calendarCard}>
						<Text style={styles.calendarTitle}>Selecciona tu fecha de nacimiento</Text>

						<DatePicker
							mode="single"
							date={draftDate}
							onChange={onCalendarChange}
							maxDate={new Date()}
							minDate={new Date(1920, 0, 1)}
							styles={{
								month_selector_label: styles.calendarHeaderText,
								year_selector_label: styles.calendarHeaderText,
								weekday_label: styles.calendarWeekText,
								today_label: styles.calendarTodayText,
								day_label: styles.calendarDayText,
								selected: { backgroundColor: '#ecb607' },
								selected_label: styles.calendarSelectedText,
							}}
						/>

						<View style={styles.calendarActions}>
							<Pressable style={styles.calendarActionBtn} onPress={() => setIsCalendarOpen(false)}>
								<Text style={styles.calendarCancelText}>Cancelar</Text>
							</Pressable>
							<Pressable style={[styles.calendarActionBtn, styles.calendarConfirmBtn]} onPress={confirmCalendarDate}>
								<Text style={styles.calendarConfirmText}>Aceptar</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
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
		paddingHorizontal: 14,
		paddingVertical: 14,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 22,
		paddingHorizontal: 16,
		paddingVertical: 18,
		width: '100%',
		maxWidth: 380,
		alignSelf: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.07,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 2 },
		elevation: 4,
	},
	title: {
		color: '#1a1a1a',
		textAlign: 'center',
		fontSize: 26,
		lineHeight: 31,
		fontWeight: '800',
	},
	subtitle: {
		color: '#5f564d',
		textAlign: 'center',
		fontSize: 15,
		marginTop: 2,
		marginBottom: 12,
	},
	formGroup: {
		marginBottom: 6,
	},
	label: {
		color: '#5f564d',
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 4,
	},
	inputWrap: {
		height: 50,
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
		fontSize: 15,
	},
	disabledText: {
		color: '#8f877d',
		fontSize: 15,
	},
	genderRow: {
		flexDirection: 'row',
		gap: 8,
	},
	genderChip: {
		flex: 1,
		height: 44,
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
		marginTop: 6,
		borderRadius: 16,
		shadowColor: '#d3a100',
		shadowOpacity: 0.4,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
	},
	button: {
		borderRadius: 16,
		height: 54,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '700',
	},
	loginWrap: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	loginText: {
		color: '#8f877d',
		fontSize: 15,
	},
	loginLink: {
		color: '#5f564d',
		fontSize: 15,
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
	calendarOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.45)',
		justifyContent: 'center',
		paddingHorizontal: 18,
	},
	calendarCard: {
		backgroundColor: '#fffdf8',
		borderRadius: 20,
		padding: 16,
		borderWidth: 1,
		borderColor: '#efe4cf',
	},
	calendarTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#5f564d',
		textAlign: 'center',
		marginBottom: 10,
	},
	calendarHeaderText: {
		color: '#5f564d',
		fontWeight: '700',
	},
	calendarWeekText: {
		color: '#8f877d',
		fontWeight: '600',
	},
	calendarTodayText: {
		color: '#99824d',
		fontWeight: '700',
	},
	calendarDayText: {
		color: '#5f564d',
	},
	calendarSelectedText: {
		color: '#ffffff',
		fontWeight: '700',
	},
	calendarActions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 8,
	},
	calendarActionBtn: {
		flex: 1,
		height: 44,
		borderRadius: 12,
		borderWidth: 1.4,
		borderColor: '#b7aea4',
		alignItems: 'center',
		justifyContent: 'center',
	},
	calendarConfirmBtn: {
		backgroundColor: '#ecb607',
		borderColor: '#ecb607',
	},
	calendarCancelText: {
		color: '#5f564d',
		fontWeight: '700',
	},
	calendarConfirmText: {
		color: '#ffffff',
		fontWeight: '700',
	},
});
