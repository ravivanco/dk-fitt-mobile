import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';

type Sport = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  image: ImageSourcePropType;
  accentColor: string;
  accentLight: string;
  sessions: number;
  level: string;
  duration: string;
  tag: string;
};

const SPORTS: Sport[] = [
  {
    id: 'gimnasio',
    name: 'Gimnasio',
    subtitle: 'Fuerza & Musculación',
    icon: 'dumbbell',
    image: require('@/assets/images/gimnasio.jpg'),
    accentColor: '#1a6bd8',
    accentLight: '#eef4fd',
    sessions: 24,
    level: 'Todos los niveles',
    duration: '45 min',
    tag: 'Fuerza Total',
  },
  {
    id: 'running',
    name: 'Running',
    subtitle: 'Cardio & Resistencia',
    icon: 'run',
    image: require('@/assets/images/run.jpg'),
    accentColor: '#f97316',
    accentLight: '#fff7ed',
    sessions: 18,
    level: 'Principiante a Avanzado',
    duration: '40 min',
    tag: 'Cardio',
  },
  {
    id: 'futbol',
    name: 'Fútbol',
    subtitle: 'Técnica & Físico',
    icon: 'soccer',
    image: require('@/assets/images/futbol.jpg'),
    accentColor: '#16a34a',
    accentLight: '#f0fdf4',
    sessions: 15,
    level: 'Amateur & Profesional',
    duration: '60 min',
    tag: 'Técnica',
  },
  {
    id: 'basquet',
    name: 'Básquet',
    subtitle: 'Agilidad & Explosividad',
    icon: 'basketball',
    image: require('@/assets/images/basquet.jpg'),
    accentColor: '#dc6120',
    accentLight: '#fff7ed',
    sessions: 12,
    level: 'Recreativo a Competitivo',
    duration: '50 min',
    tag: 'Explosividad',
  },
  {
    id: 'ciclismo',
    name: 'Ciclismo',
    subtitle: 'Potencia & Endurance',
    icon: 'bike',
    image: require('@/assets/images/ciclismo.jpg'),
    accentColor: '#7c3aed',
    accentLight: '#f5f3ff',
    sessions: 20,
    level: 'Todos los niveles',
    duration: '55 min',
    tag: 'Resistencia',
  },
  {
    id: 'natacion',
    name: 'Natación',
    subtitle: 'Cuerpo Completo',
    icon: 'swim',
    image: require('@/assets/images/nataci.jpg'),
    accentColor: '#0891b2',
    accentLight: '#ecfeff',
    sessions: 16,
    level: 'Principiante a Avanzado',
    duration: '45 min',
    tag: 'Full Body',
  },
];

function SportCard({ sport }: { sport: Sport }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={() => router.push(`/ejercicios/${sport.id}` as any)}
    >
      {/* Circular image */}
      <View style={[styles.imageRing, { borderColor: sport.accentColor + '40' }]}>
        <Image source={sport.image} style={styles.circularImage} resizeMode="cover" />
      </View>

      {/* Info column */}
      <View style={styles.infoCol}>
        {/* Top: name + sessions badge */}
        <View style={styles.cardTopRow}>
          <Text style={styles.sportName}>{sport.name}</Text>
          <View style={[styles.sessionsBadge, { backgroundColor: sport.accentLight }]}>
            <Text style={[styles.sessionsBadgeText, { color: sport.accentColor }]}>
              {sport.sessions} rutinas
            </Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.sportSubtitle}>{sport.subtitle}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom chips row */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="clock-outline" size={11} color="#8e8579" />
            <Text style={styles.chipText}>{sport.duration}</Text>
          </View>
          <View style={styles.chipDot} />
          <View style={styles.chip}>
            <MaterialCommunityIcons name="dumbbell" size={11} color="#8e8579" />
            <Text style={styles.chipText}>{sport.tag}</Text>
          </View>
          <View style={[styles.levelChip, { backgroundColor: sport.accentLight }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={10} color={sport.accentColor} />
            <Text style={[styles.levelChipText, { color: sport.accentColor }]}>
              {sport.level}
            </Text>
          </View>
        </View>
      </View>

    </TouchableOpacity>
  );
}

export default function EjerciciosScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#0f1115" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>Ejercicios</Text>
              <Text style={styles.subtitle}>Elige tu disciplina favorita</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>6</Text>
              <Text style={styles.statLabel}>Disciplinas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>105</Text>
              <Text style={styles.statLabel}>Rutinas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>Niveles</Text>
            </View>
          </View>

          {/* Cards */}
          <View style={styles.cardsList}>
            {SPORTS.map((sport) => (
              <SportCard key={sport.id} sport={sport} />
            ))}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#efebe4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f1115',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: '#8e8579',
    fontWeight: '500',
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 22,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f1115',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 11,
    color: '#8e8579',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#efebe4',
    marginVertical: 4,
  },

  // Cards list
  cardsList: {
    gap: 14,
  },

  // Sport card — Mi Plan style
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    padding: 14,
    gap: 14,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Circular image
  imageRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    padding: 3,
    overflow: 'hidden',
    backgroundColor: '#f8f6f1',
    flexShrink: 0,
  },
  circularImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },

  // Info column
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  sportName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f1115',
    flexShrink: 1,
  },
  sessionsBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 0,
  },
  sessionsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sportSubtitle: {
    fontSize: 12,
    color: '#8e8579',
    fontWeight: '500',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0ede7',
    marginBottom: 8,
  },

  // Chips row
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    color: '#8e8579',
    fontWeight: '600',
  },
  chipDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d9d4cc',
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  levelChipText: {
    fontSize: 10,
    fontWeight: '700',
  },


});
