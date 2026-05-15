import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/navigation/bottom-nav';

const ROUTINES = [
  { id: 1, name: 'Full Body Básico', duration: '45 min', level: 'Principiante', icon: 'weight-lifter', reps: '3 × 12' },
  { id: 2, name: 'Pecho & Tríceps', duration: '50 min', level: 'Intermedio', icon: 'arm-flex', reps: '4 × 10' },
  { id: 3, name: 'Espalda & Bíceps', duration: '55 min', level: 'Intermedio', icon: 'dumbbell', reps: '4 × 10' },
  { id: 4, name: 'Piernas & Glúteos', duration: '60 min', level: 'Avanzado', icon: 'run-fast', reps: '5 × 8' },
  { id: 5, name: 'Hombros & Core', duration: '40 min', level: 'Principiante', icon: 'human-handsup', reps: '3 × 15' },
];

const LEVEL_COLORS: Record<string, string> = {
  Principiante: '#16a34a',
  Intermedio: '#f97316',
  Avanzado: '#dc2626',
};

export default function GimnasioScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#1a6bd8', '#0d4fa8']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>🏋️</Text>
          <Text style={styles.heroTitle}>Gimnasio</Text>
          <Text style={styles.heroSub}>Fuerza & Musculación</Text>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>24 Rutinas</Text></View>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Todos los niveles</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Rutinas disponibles</Text>
          {ROUTINES.map((r) => (
            <TouchableOpacity key={r.id} style={styles.routineCard} activeOpacity={0.8}>
              <View style={[styles.routineIcon, { backgroundColor: '#eef4fd' }]}>
                <MaterialCommunityIcons name={r.icon as any} size={26} color="#1a6bd8" />
              </View>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{r.name}</Text>
                <View style={styles.routineMeta}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#8e8579" />
                  <Text style={styles.routineMetaText}>{r.duration}</Text>
                  <Text style={styles.routineMetaDot}>·</Text>
                  <Text style={styles.routineMetaText}>{r.reps}</Text>
                </View>
              </View>
              <View style={[styles.levelPill, { backgroundColor: LEVEL_COLORS[r.level] + '1A' }]}>
                <Text style={[styles.levelPillText, { color: LEVEL_COLORS[r.level] }]}>{r.level}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f6f1' },
  content: { paddingBottom: 120 },
  hero: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroEmoji: { fontSize: 52, marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', lineHeight: 36 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  heroBadges: { flexDirection: 'row', gap: 10, marginTop: 16 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f1115', marginBottom: 16 },
  routineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#efebe4', padding: 14, marginBottom: 12, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  routineIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 15, fontWeight: '700', color: '#0f1115', marginBottom: 4 },
  routineMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routineMetaText: { fontSize: 12, color: '#8e8579', fontWeight: '500' },
  routineMetaDot: { fontSize: 12, color: '#8e8579' },
  levelPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  levelPillText: { fontSize: 11, fontWeight: '700' },
});
