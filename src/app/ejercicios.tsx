import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';

export default function EjerciciosScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#0f1115" />
            </TouchableOpacity>
            <Text style={styles.title}>Ejercicios</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.mainCard}>
              <View style={styles.imageContainer}>
                <View style={styles.iconLarge}>
                  <MaterialCommunityIcons name="dumbbell" size={60} color="#1a6bd8" />
                </View>
              </View>

              <Text style={styles.cardTitle}>Ejercicios</Text>
              <Text style={styles.cardDescription}>
                Rutinas guiadas para entrenar mejor y mantener constancia.
              </Text>

              <TouchableOpacity style={styles.button} activeOpacity={0.7}>
                <Text style={styles.buttonText}>Empezar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f1',
  },
  wrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8f6f1',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 112,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f1115',
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    gap: 16,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#efebe4',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    backgroundColor: '#f0f6fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#b3d9f2',
  },
  iconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#b3d9f2',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f1115',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#8e8579',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#f0f6fb',
    borderWidth: 1.5,
    borderColor: '#b3d9f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101318',
  },
});
