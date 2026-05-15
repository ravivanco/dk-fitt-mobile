import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/navigation/bottom-nav';

const ROUTINES = [
  { id: 1, name: 'Rodada de Bienvenida', duration: '60 min', level: 'Principiante', icon: 'bike', reps: '20 km' },
  { id: 2, name: 'Intervalos en Bici', duration: '45 min', level: 'Intermedio', icon: 'timer-outline', reps: '8 series' },
  { id: 3, name: 'Potencia en Watt', duration: '50 min', level: 'Avanzado', icon: 'lightning-bolt', reps: '5 × 5 min' },
  { id: 4, name: 'Gran Fondo', duration: '180 min', level: 'Avanzado', icon: 'map-marker-distance', reps: '80 km' },
];

const LEVEL_COLORS: Record<string, string> = { Principiante: '#16a34a', Intermedio: '#f97316', Avanzado: '#dc2626' };

export default function CiclismoScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#7c3aed', '#4c1d95']} style={s.hero}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.emoji}>🚴</Text>
          <Text style={s.htitle}>Ciclismo</Text>
          <Text style={s.hsub}>Potencia & Endurance</Text>
          <View style={s.badges}>
            <View style={s.badge}><Text style={s.badgeT}>20 Rutinas</Text></View>
            <View style={s.badge}><Text style={s.badgeT}>Todos los niveles</Text></View>
          </View>
        </LinearGradient>
        <View style={s.body}>
          <Text style={s.sec}>Rutinas disponibles</Text>
          {ROUTINES.map((r) => (
            <TouchableOpacity key={r.id} style={s.card} activeOpacity={0.8}>
              <View style={[s.icon, { backgroundColor: '#f5f3ff' }]}>
                <MaterialCommunityIcons name={r.icon as any} size={26} color="#7c3aed" />
              </View>
              <View style={s.info}>
                <Text style={s.name}>{r.name}</Text>
                <View style={s.meta}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#8e8579" />
                  <Text style={s.mt}>{r.duration}</Text>
                  <Text style={s.mt}>·</Text>
                  <Text style={s.mt}>{r.reps}</Text>
                </View>
              </View>
              <View style={[s.pill, { backgroundColor: LEVEL_COLORS[r.level] + '1A' }]}>
                <Text style={[s.pillT, { color: LEVEL_COLORS[r.level] }]}>{r.level}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f6f1' },
  content: { paddingBottom: 120 },
  hero: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emoji: { fontSize: 52, marginBottom: 8 },
  htitle: { fontSize: 32, fontWeight: '900', color: '#fff' },
  hsub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  badges: { flexDirection: 'row', gap: 10, marginTop: 16 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  badgeT: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingTop: 24 },
  sec: { fontSize: 18, fontWeight: '800', color: '#0f1115', marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#efebe4', padding: 14, marginBottom: 12, gap: 14 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f1115', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mt: { fontSize: 12, color: '#8e8579', fontWeight: '500' },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillT: { fontSize: 11, fontWeight: '700' },
});
