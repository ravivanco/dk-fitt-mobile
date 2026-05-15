import { OnboardingProvider } from '../context/onboarding-context';
import { Href, Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { authStore } from '@/store/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [isReady, setIsReady] = useState(false);
	const [pendingRoute, setPendingRoute] = useState<Href | null>(null);

	useEffect(() => {
		void checkSession();
	}, []);

	useEffect(() => {
		if (!isReady || !pendingRoute) return;
		router.replace(pendingRoute);
	}, [isReady, pendingRoute]);

	const checkSession = async () => {
		try {
			// Politica de seguridad solicitada: siempre pedir login al abrir la app.
			await authStore.clearSession();
			setPendingRoute('/auth/login');
		} catch {
			setPendingRoute('/auth/login');
		} finally {
			setIsReady(true);
			await SplashScreen.hideAsync();
		}
	};

	if (!isReady) return null;

	return (
		<OnboardingProvider>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="auth/login" />
				<Stack.Screen name="auth/register" />
				<Stack.Screen name="home" />
				<Stack.Screen name="mi-plan" />
				<Stack.Screen name="control-calorico" />
				<Stack.Screen name="menus" />
				<Stack.Screen name="ejercicios" />
				<Stack.Screen name="ejercicios/gimnasio" />
				<Stack.Screen name="ejercicios/running" />
				<Stack.Screen name="ejercicios/futbol" />
				<Stack.Screen name="ejercicios/basquet" />
				<Stack.Screen name="ejercicios/ciclismo" />
				<Stack.Screen name="ejercicios/natacion" />
				<Stack.Screen name="progreso" />
				<Stack.Screen name="perfil" />
				<Stack.Screen name="perfil-editar" />
				<Stack.Screen name="biom-editar" />
			<Stack.Screen name="datos-medicos" />
				<Stack.Screen name="formularios/form01" />
				<Stack.Screen name="formularios/form02" />
				<Stack.Screen name="formularios/form03" />
				<Stack.Screen name="formularios/form04" />
				<Stack.Screen name="formularios/form05" />
				<Stack.Screen name="formularios/form06" />
				<Stack.Screen name="formularios/form07" />
				<Stack.Screen name="onboarding/loading" />
			</Stack>
		</OnboardingProvider>
	);
}