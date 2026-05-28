import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/navigation/bottom-nav';
import { BackButton } from '@/components/navigation/back-button';
import { fetchExercisesCatalog, type ExerciseCatalogItem } from '@/services/exercise.service';

type SportKey = 'gimnasio' | 'running' | 'futbol' | 'basquet' | 'ciclismo' | 'natacion';

const SPORT_DEFS: Array<{
  key: SportKey;
  title: string;
  subtitle: string;
  image: any;
  gradient: [string, string];
  keywords: string[];
}> = [
  {
    key: 'gimnasio',
    title: 'Gimnasio',
    subtitle: 'Fuerza & Musculación',
    image: require('@/assets/images/gimnasio.jpg'),
    gradient: ['#1a6bd8', '#0d4fa8'],
    keywords: ['gimnasio', 'fuerza', 'muscul', 'pesas', 'hipertrof', 'gym'],
  },
  {
    key: 'running',
    title: 'Running',
    subtitle: 'Cardio & Resistencia',
    image: require('@/assets/images/run.jpg'),
    gradient: ['#f97316', '#c2410c'],
    keywords: ['running', 'correr', 'trote', 'cardio', 'resistencia', 'hiit', 'interval'],
  },
  {
    key: 'futbol',
    title: 'Fútbol',
    subtitle: 'Técnica & Físico',
    image: require('@/assets/images/futbol.jpg'),
    gradient: ['#22c55e', '#15803d'],
    keywords: ['futbol', 'fútbol', 'soccer', 'técnica', 'tecnica'],
  },
  {
    key: 'basquet',
    title: 'Básquet',
    subtitle: 'Agilidad & Explosividad',
    image: require('@/assets/images/basquet.jpg'),
    gradient: ['#ef4444', '#b91c1c'],
    keywords: ['basquet', 'básquet', 'basket', 'agilidad', 'explosiv'],
  },
  {
    key: 'ciclismo',
    title: 'Ciclismo',
    subtitle: 'Potencia & Endurance',
    image: require('@/assets/images/ciclismo.jpg'),
    gradient: ['#06b6d4', '#0e7490'],
    keywords: ['ciclismo', 'bicic', 'endurance', 'potencia', 'cycling'],
  },
  {
    key: 'natacion',
    title: 'Natación',
    subtitle: 'Cuerpo Completo',
    image: require('@/assets/images/nataci.jpg'),
    gradient: ['#6366f1', '#4338ca'],
    keywords: ['natacion', 'natación', 'swim', 'piscina', 'crol', 'espalda'],
  },
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function normalizeSportKey(input: string): SportKey | null {
  const v = normalizeText(input);
  if (v.includes('gimnasio') || v.includes('gym') || v.includes('fuerza')) return 'gimnasio';
  if (v.includes('running') || v.includes('correr') || v.includes('cardio')) return 'running';
  if (v.includes('futbol') || v.includes('soccer')) return 'futbol';
  if (v.includes('basquet') || v.includes('basket')) return 'basquet';
  if (v.includes('cicl') || v.includes('cycling') || v.includes('bici')) return 'ciclismo';
  if (v.includes('natacion') || v.includes('swim') || v.includes('piscina')) return 'natacion';
  return null;
}

function inferSportKey(exercise: ExerciseCatalogItem): SportKey | null {
  const explicit =
    typeof exercise.deporte === 'string'
      ? normalizeSportKey(exercise.deporte)
      : typeof exercise.categoria === 'string'
        ? normalizeSportKey(exercise.categoria)
        : null;
  if (explicit) return explicit;

  const haystack = normalizeText(`${exercise.deporte ?? ''} ${exercise.categoria ?? ''} ${exercise.nombre ?? ''}`);
  for (const sport of SPORT_DEFS) {
    if (sport.keywords.some((k) => haystack.includes(normalizeText(k)))) return sport.key;
  }
  return null;
}

function formatMinutes(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${Math.round(value)} min`;
}

function inferLevelBadge(items: ExerciseCatalogItem[]) {
  const intensity = items
    .map((it) => (typeof it.intensidad === 'string' ? it.intensidad.toLowerCase() : ''))
    .join(' ');
  if (intensity.includes('alta')) return { label: 'Avanzado', color: '#dc2626', bg: '#fee2e2' };
  if (intensity.includes('media')) return { label: 'Intermedio', color: '#f97316', bg: '#ffedd5' };
  return { label: 'Principiante', color: '#16a34a', bg: '#dcfce7' };
}

export default function EjerciciosCatalogScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExerciseCatalogItem[]>([]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await fetchExercisesCatalog();
        if (active) setItems(result);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const bySport: Record<SportKey, ExerciseCatalogItem[]> = {
      gimnasio: [],
      running: [],
      futbol: [],
      basquet: [],
      ciclismo: [],
      natacion: [],
    };
    const unclassified: ExerciseCatalogItem[] = [];

    for (const item of items) {
      const sportKey = inferSportKey(item);
      if (item.activo === false) continue;
      if (!sportKey) {
        unclassified.push(item);
        continue;
      }
      bySport[sportKey].push(item);
    }

    return { bySport, unclassified };
  }, [items]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#111827', '#0b1220']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.backBtn}>
            <BackButton tone="dark" />
          </View>
          <Text style={styles.heroTitle}>Ejercicios</Text>
          <Text style={styles.heroSub}>Elige tu deporte y encuentra rutinas guiadas.</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Catálogo por deporte</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#1aa44f" />
              <Text style={styles.loadingText}>Cargando ejercicios...</Text>
            </View>
          ) : (
            SPORT_DEFS.map((sport) => {
              const list = grouped.bySport[sport.key];
              const avgDuration =
                list.length === 0
                  ? undefined
                  : list.reduce((acc, it) => acc + (typeof it.duracion_min === 'number' ? it.duracion_min : 0), 0) / list.length;
              const badge = inferLevelBadge(list);

              return (
                <TouchableOpacity
                  key={sport.key}
                  activeOpacity={0.85}
                  style={styles.card}
                  onPress={() => router.push(`/ejercicios/${sport.key}`)}
                >
                  <Image source={sport.image} style={styles.cardImage} />
                  <LinearGradient colors={sport.gradient} style={styles.cardOverlay} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{sport.title}</Text>
                        <Text style={styles.cardSub}>{sport.subtitle}</Text>
                      </View>
                      <View style={[styles.levelBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.levelBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <View style={styles.cardMetaRow}>
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#ffffff" />
                        <Text style={styles.metaText}>{formatMinutes(avgDuration)}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="dumbbell" size={14} color="#ffffff" />
                        <Text style={styles.metaText}>{list.length} rutinas</Text>
                      </View>
                      <View style={styles.metaPillRight}>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {!loading && grouped.unclassified.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.loadingText, { textAlign: 'left' }]}>
                Nota: {grouped.unclassified.length} ejercicios no se pudieron clasificar por deporte (falta campo `deporte/categoria` o no coincide el nombre).
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f6f1' },
  content: { paddingBottom: 120 },
  hero: { paddingTop: 18, paddingBottom: 22, paddingHorizontal: 16, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  backBtn: { marginBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 4, fontWeight: '600' },
  body: { paddingHorizontal: 14, paddingTop: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f1115', marginBottom: 14 },
  loadingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#efebe4', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontWeight: '700' },
  card: { height: 160, borderRadius: 18, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#efebe4' },
  cardImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  cardOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.68 },
  cardContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  cardSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2, fontWeight: '700' },
  levelBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  levelBadgeText: { fontSize: 11, fontWeight: '900' },
  cardMetaRow: { flexDirection: 'row', gap: 10 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  metaPillRight: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' },
});
