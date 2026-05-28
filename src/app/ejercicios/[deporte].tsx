import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
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

const SPORT_META: Record<SportKey, { title: string; subtitle: string; image: any; gradient: [string, string] }> = {
  gimnasio: { title: 'Gimnasio', subtitle: 'Fuerza & Musculación', image: require('@/assets/images/gimnasio.jpg'), gradient: ['#1a6bd8', '#0d4fa8'] },
  running: { title: 'Running', subtitle: 'Cardio & Resistencia', image: require('@/assets/images/run.jpg'), gradient: ['#f97316', '#c2410c'] },
  futbol: { title: 'Fútbol', subtitle: 'Técnica & Físico', image: require('@/assets/images/futbol.jpg'), gradient: ['#22c55e', '#15803d'] },
  basquet: { title: 'Básquet', subtitle: 'Agilidad & Explosividad', image: require('@/assets/images/basquet.jpg'), gradient: ['#ef4444', '#b91c1c'] },
  ciclismo: { title: 'Ciclismo', subtitle: 'Potencia & Endurance', image: require('@/assets/images/ciclismo.jpg'), gradient: ['#06b6d4', '#0e7490'] },
  natacion: { title: 'Natación', subtitle: 'Cuerpo Completo', image: require('@/assets/images/nataci.jpg'), gradient: ['#6366f1', '#4338ca'] },
};

function normalizeSportKey(input: string): SportKey | null {
  const lowered = input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (lowered === 'gimnasio') return 'gimnasio';
  if (lowered === 'running') return 'running';
  if (lowered === 'futbol' || lowered === 'fútbol') return 'futbol';
  if (lowered === 'basquet' || lowered === 'básquet') return 'basquet';
  if (lowered === 'ciclismo') return 'ciclismo';
  if (lowered === 'natacion' || lowered === 'natación') return 'natacion';
  return null;
}

function intensityBadge(intensity?: string) {
  const normalized = (intensity ?? '').toLowerCase();
  if (normalized.includes('alta')) return { label: 'Alta', color: '#dc2626', bg: '#fee2e2' };
  if (normalized.includes('media')) return { label: 'Media', color: '#f97316', bg: '#ffedd5' };
  return { label: 'Baja', color: '#16a34a', bg: '#dcfce7' };
}

function sportIcon(key: SportKey) {
  if (key === 'gimnasio') return 'dumbbell';
  if (key === 'running') return 'run';
  if (key === 'futbol') return 'soccer';
  if (key === 'basquet') return 'basketball';
  if (key === 'ciclismo') return 'bike';
  return 'swim';
}

function sportAccent(key: SportKey) {
  if (key === 'gimnasio') return '#1a6bd8';
  if (key === 'running') return '#f97316';
  if (key === 'futbol') return '#16a34a';
  if (key === 'basquet') return '#ef4444';
  if (key === 'ciclismo') return '#06b6d4';
  return '#6366f1';
}

function formatMinutes(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${Math.round(value)} min`;
}

export default function EjerciciosPorDeporteScreen() {
  const params = useLocalSearchParams<{ deporte?: string }>();
  const sportKey = normalizeSportKey(params.deporte ?? '');
  const meta = sportKey ? SPORT_META[sportKey] : null;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExerciseCatalogItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await fetchExercisesCatalog();
        if (!active) return;
        setItems(all);
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

  const filtered = useMemo(() => {
    if (!sportKey) return [];
    const keywords = {
      gimnasio: ['gimnasio', 'fuerza', 'muscul', 'pesas', 'hipertrof', 'gym'],
      running: ['running', 'correr', 'trote', 'cardio', 'resistencia', 'hiit', 'interval'],
      futbol: ['futbol', 'fútbol', 'soccer', 'técnica', 'tecnica'],
      basquet: ['basquet', 'básquet', 'basket', 'agilidad', 'explosiv'],
      ciclismo: ['ciclismo', 'bicic', 'endurance', 'potencia', 'cycling'],
      natacion: ['natacion', 'natación', 'swim', 'piscina', 'crol', 'espalda'],
    }[sportKey];

    return items
      .filter((it) => it.activo !== false)
      .filter((it) => {
        const haystack = `${it.deporte ?? ''} ${it.categoria ?? ''} ${it.nombre ?? ''}`.toLowerCase();
        return keywords.some((k) => haystack.includes(k));
      })
      .slice(0, 25);
  }, [items, sportKey]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  if (!sportKey || !meta) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.invalidWrap}>
          <Text style={styles.invalidTitle}>Deporte no válido</Text>
          <TouchableOpacity style={styles.invalidBtn} onPress={() => router.back()}>
            <Text style={styles.invalidBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={meta.image} style={styles.heroImage} />
          <LinearGradient colors={meta.gradient} style={styles.heroOverlay} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.backBtn}>
            <BackButton tone="dark" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{meta.title}</Text>
            <Text style={styles.heroSub}>{meta.subtitle}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rutinas</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{filtered.length}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#1aa44f" />
              <Text style={styles.loadingText}>Cargando rutinas...</Text>
            </View>
          ) : (
            filtered.map((it) => {
              const badge = intensityBadge(typeof it.intensidad === 'string' ? it.intensidad : undefined);
              const accent = sportAccent(sportKey);
              const expanded = expandedIds.includes(it.id);
              return (
                <TouchableOpacity
                  key={it.id}
                  activeOpacity={0.9}
                  onPress={() => toggleExpanded(it.id)}
                  style={styles.exerciseCard}
                >
                  <View style={styles.exerciseTopRow}>
                    <View style={[styles.exerciseIcon, { backgroundColor: `${accent}14` }]}>
                      <MaterialCommunityIcons name={sportIcon(sportKey) as any} size={20} color={accent} />
                    </View>
                    <View style={styles.exerciseTitleWrap}>
                      <Text style={styles.exerciseTitle} numberOfLines={2}>
                        {it.nombre}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={styles.exerciseMetaRow}>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color="#8e8579" />
                      <Text style={styles.metaChipText}>{formatMinutes(it.duracion_min)}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="calendar-week-outline" size={13} color="#8e8579" />
                      <Text style={styles.metaChipText}>
                        {typeof it.frecuencia_semanal === 'number' ? `${it.frecuencia_semanal}x/sem` : '—'}
                      </Text>
                    </View>
                    <View style={styles.metaChipRight}>
                      <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#c8c2ba" />
                    </View>
                  </View>

                  {expanded && (
                    <View style={styles.expandBox}>
                      <Text style={styles.expandTitle}>Descripción</Text>
                      <Text style={styles.expandText}>{it.descripcion ?? 'Sin descripción disponible.'}</Text>
                      <View style={styles.expandDivider} />
                      <View style={styles.expandGrid}>
                        <View style={styles.expandItem}>
                          <Text style={styles.expandLabel}>Duración</Text>
                          <Text style={styles.expandValue}>{formatMinutes(it.duracion_min)}</Text>
                        </View>
                        <View style={styles.expandItem}>
                          <Text style={styles.expandLabel}>Frecuencia</Text>
                          <Text style={styles.expandValue}>
                            {typeof it.frecuencia_semanal === 'number' ? `${it.frecuencia_semanal} veces/sem` : '—'}
                          </Text>
                        </View>
                        <View style={styles.expandItem}>
                          <Text style={styles.expandLabel}>Intensidad</Text>
                          <Text style={styles.expandValue}>{badge.label}</Text>
                        </View>
                        <View style={styles.expandItem}>
                          <Text style={styles.expandLabel}>Categoría</Text>
                          <Text style={styles.expandValue}>{it.categoria ?? '—'}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
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
  hero: { height: 190, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  heroOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.7 },
  backBtn: { position: 'absolute', top: 14, left: 14 },
  heroText: { position: 'absolute', left: 14, bottom: 16, right: 14 },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 2, fontWeight: '700' },
  body: { paddingHorizontal: 14, paddingTop: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f1115' },
  countPill: { backgroundColor: '#111827', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  countPillText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  loadingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#efebe4', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontWeight: '700' },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exerciseIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exerciseTitleWrap: { flex: 1 },
  exerciseTitle: { fontSize: 15, fontWeight: '900', color: '#0f1115', lineHeight: 19 },
  exerciseDesc: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginTop: 4, lineHeight: 16 },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f7f4ee', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#efe9e1' },
  metaChipText: { fontSize: 12, color: '#7c7268', fontWeight: '800' },
  metaChipRight: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: '#efebe4', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '900' },
  expandBox: { marginTop: 12, backgroundColor: '#fbfaf7', borderRadius: 16, borderWidth: 1, borderColor: '#efe9e1', padding: 12 },
  expandTitle: { fontSize: 12, fontWeight: '900', color: '#0f1115' },
  expandText: { marginTop: 6, fontSize: 12, lineHeight: 17, color: '#6b7280', fontWeight: '600' },
  expandDivider: { height: 1, backgroundColor: '#efe9e1', marginTop: 12, marginBottom: 12 },
  expandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  expandItem: { width: '48%', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#efebe4', paddingHorizontal: 10, paddingVertical: 10 },
  expandLabel: { fontSize: 11, fontWeight: '900', color: '#8e8579' },
  expandValue: { marginTop: 4, fontSize: 12, fontWeight: '900', color: '#0f1115' },
  invalidWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  invalidTitle: { fontSize: 18, fontWeight: '900', color: '#0f1115', marginBottom: 10 },
  invalidBtn: { backgroundColor: '#111827', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  invalidBtnText: { color: '#fff', fontWeight: '900' },
});
