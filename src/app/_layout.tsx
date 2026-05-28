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
			const session = await authStore.loadSession();
			if (!session) {
				setPendingRoute('/auth/login');
				return;
			}

			// Mantener la misma regla de enrutado que en `use-auth.ts` para evitar
			// inconsistencias al reabrir la app con sesión activa.
			const user = (session as any).user ?? {};
			if (!user.formulario_completado) {
				setPendingRoute('/formularios/form01');
				return;
			}

			if (user.modulo_habilitado) {
				setPendingRoute('/mi-plan');
				return;
			}

			setPendingRoute('/home');
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
				<Stack.Screen name="ejercicios/index" />
				<Stack.Screen name="ejercicios/[deporte]" />
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
