import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
	const colorScheme = useColorScheme();

	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="auth/login" />
				<Stack.Screen name="auth/register" />
				<Stack.Screen name="formularios/form01" />
				<Stack.Screen name="formularios/form02" />
				<Stack.Screen name="formularios/form03" />
				<Stack.Screen name="formularios/form04" />
				<Stack.Screen name="formularios/form05" />
				<Stack.Screen name="formularios/form06" />
				<Stack.Screen name="formularios/form07" />
				<Stack.Screen name="onboarding/loading" />
				<Stack.Screen name="home" />
			</Stack>
		</ThemeProvider>
	);
}