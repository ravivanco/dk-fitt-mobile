import { Redirect, type Href } from 'expo-router';

// Pantalla raiz de la app.
// Este archivo decide a que ruta enviar al usuario cuando abre la aplicacion.
export default function Index() {
  // Redireccion inicial al login.
  return <Redirect href={'/auth/login' as Href} />;
}