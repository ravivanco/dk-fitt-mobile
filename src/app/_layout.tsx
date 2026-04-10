import { OnboardingProvider } from '../context/onboarding-context';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { authStore } from '@/store/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		void checkSession();
	}, []);

	const checkSession = async () => {
		try {
			const session = await authStore.loadSession();

			if (session) {
				const { user } = session;

				if (!user.formulario_completado) {
					router.replace('/formularios/form01');
				} else if (user.modulo_habilitado) {
					router.replace('/mi-plan');
				} else {
					router.replace('/home');
				}
			} else {
				router.replace('/auth/login');
			}
		} catch {
			router.replace('/auth/login');
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
				<Stack.Screen name="perfil" />
				<Stack.Screen name="calendario" />
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