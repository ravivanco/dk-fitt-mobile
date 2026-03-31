import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  // Router para navegar entre pantallas del flujo auth.
  const router = useRouter();

  // Estado local de los campos del formulario.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Controla si la contrasena se muestra u oculta.
  const [showPassword, setShowPassword] = useState(false);

  // Navegacion temporal al home; aqui luego puedes validar credenciales reales.
  const handleLogin = () => {
    router.replace('/home' as Href);
  };

  return (
    <View style={styles.container}>
      {/* Acentos decorativos del fondo. */}
      <View style={[styles.block, styles.blockTopLeft]} />
      <View style={[styles.block, styles.blockBottomRight]} />
      <View style={[styles.sideBar, styles.sideBarRight]} />
      <View style={[styles.sideBar, styles.sideBarLeft]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Tarjeta principal del login. */}
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            {/* Logo de marca. */}
            <Image
              source={require('../../../assets/images/logo-dk.png')}
              contentFit="contain"
              style={styles.logoImage}
            />
          </View>

          {/* Campos e interacciones del formulario. */}
          <View style={styles.fieldsWrap}>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={22} color="#8f877d" />
              <TextInput
                placeholder="Correo"
                placeholderTextColor="#8f877d"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={22} color="#8f877d" />
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
                  size={22}
                  color="#8f877d"
                />
              </TouchableOpacity>
            </View>

            <Pressable>
              <Text style={styles.forgotText}>Olvido su contrasena?</Text>
            </Pressable>

            {/* Boton principal con degradado y sombra. */}
            <Pressable style={styles.buttonShadow} onPress={handleLogin}>
              <LinearGradient colors={['#ecb607', '#f6c510', '#fbd232']} style={styles.button}>
                <Text style={styles.buttonText}>Ingresar</Text>
              </LinearGradient>
            </Pressable>

            {/* Call to action secundario para registro. */}
            <View style={styles.registerWrap}>
              <Text style={styles.registerText}>No tienes una cuenta?</Text>
              <Pressable onPress={() => router.push('/auth/register' as Href)}>
                <Text style={styles.registerLink}>Registrarte</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fondo general de la pantalla.
  container: {
    flex: 1,
    backgroundColor: '#fdfcf9',
  },
  // Area segura centrada para la tarjeta.
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Superficie principal del formulario.
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
  // Tamano visual del logo cargado desde assets.
  logoImage: {
    width: 300,
    height: 250,
  },
  // Espaciado vertical entre elementos del formulario.
  fieldsWrap: {
    gap: 14,
  },
  // Estilo base compartido por los dos inputs.
  inputWrap: {
    height: 56,
    borderWidth: 1.8,
    borderColor: '#7c7268',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#5f564d',
    fontSize: 18,
  },
  // Texto auxiliar de recuperacion de contrasena.
  forgotText: {
    color: '#8f877d',
    textAlign: 'right',
    fontSize: 16,
  },
  // Capa de sombra del boton para dar profundidad.
  buttonShadow: {
    borderRadius: 16,
    shadowColor: '#d3a100',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // Boton con degradado principal.
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
  // Bloque inferior de texto para registro.
  registerWrap: {
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  registerText: {
    color: '#8f877d',
    fontSize: 16,
  },
  registerLink: {
    color: '#5f564d',
    fontSize: 17,
    fontWeight: '700',
  },
  // Acentos geometricos del fondo.
  block: {
    position: 'absolute',
    width: 62,
    height: 62,
    backgroundColor: '#ecb607',
    transform: [{ rotate: '35deg' }],
  },
  blockTopLeft: {
    top: 58,
    left: 34,
  },
  blockBottomRight: {
    bottom: 64,
    right: 40,
  },
  sideBar: {
    position: 'absolute',
    width: 10,
    height: 58,
    backgroundColor: '#99824d',
    transform: [{ rotate: '42deg' }],
  },
  sideBarRight: {
    right: -2,
    top: 320,
  },
  sideBarLeft: {
    left: -2,
    bottom: 218,
  },
});
