import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Appointment } from '@/services/appointments.service';

function formatAppointmentDateTime(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return { date: 'Fecha inválida', time: '' };

  const dateText = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const timeText = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return { date: dateText, time: timeText };
}

function normalizeStateLabel(state?: string) {
  const raw = (state ?? '').toString().trim().toLowerCase();
  if (!raw) return 'Programada';
  if (raw.includes('program')) return 'Programada';
  if (raw.includes('reprogram')) return 'Reprogramada';
  if (raw.includes('cancel')) return 'Cancelada';
  if (raw.includes('final') || raw.includes('complet')) return 'Completada';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function AppointmentsNotificationsModal({
  visible,
  onClose,
  loading,
  error,
  appointments,
}: {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  appointments: Appointment[];
}) {
  const insets = useSafeAreaInsets();

  const sorted = useMemo(() => {
    const items = Array.isArray(appointments) ? appointments : [];
    return [...items].sort((a, b) => {
      const timeA = new Date(a.fecha_hora).getTime();
      const timeB = new Date(b.fecha_hora).getTime();
      return (Number.isFinite(timeA) ? timeA : 0) - (Number.isFinite(timeB) ? timeB : 0);
    });
  }, [appointments]);

  const nowTime = Date.now();
  const upcoming = useMemo(() => {
    return sorted.filter((appt) => {
      const t = new Date(appt.fecha_hora).getTime();
      if (!Number.isFinite(t)) return false;
      return t >= nowTime;
    });
  }, [sorted, nowTime]);

  const changes = useMemo(() => {
    // "Cambios" = citas con estado que indica modificación (reprogramada/cancelada)
    return sorted.filter((appt) => {
      const state = (appt.estado ?? '').toString().toLowerCase();
      return state.includes('reprogram') || state.includes('cancel');
    });
  }, [sorted]);

  // Mostrar UNA sola notificación (la más relevante):
  // 1) Próxima cita futura
  // 2) Si no hay próximas, la última actualización relevante
  const primaryAppointment = upcoming[0] ?? changes[changes.length - 1] ?? null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.bellIconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={18} color="#1aa44f" />
            </View>
            <Text style={styles.headerTitle}>Notificaciones</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={20} color="#6f675b" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Cita</Text>

          {loading ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Cargando...</Text>
              <Text style={styles.stateText}>Consultando tus citas.</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>No se pudo cargar</Text>
              <Text style={styles.stateText}>{error}</Text>
            </View>
          ) : primaryAppointment ? (
            <AppointmentCard appointment={primaryAppointment} prominent />
          ) : (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Sin próximas citas</Text>
              <Text style={styles.stateText}>Cuando tu nutricionista programe una cita, aparecerá aquí.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AppointmentCard({ appointment, prominent }: { appointment: Appointment; prominent?: boolean }) {
  const { date, time } = formatAppointmentDateTime(appointment.fecha_hora);
  const stateLabel = normalizeStateLabel(appointment.estado as any);
  const nutritionist = typeof appointment.nombre_nutricionista === 'string' ? appointment.nombre_nutricionista.trim() : '';
  const notes = typeof appointment.notas === 'string' ? appointment.notas.trim() : '';

  return (
    <View style={[styles.card, prominent && styles.cardProminent]}>
      <View style={styles.cardTopRow}>
        <View style={styles.dateWrap}>
          <Text style={styles.dateText}>{date}</Text>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#6f675b" />
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{stateLabel}</Text>
        </View>
      </View>

      {(nutritionist || notes) && <View style={styles.divider} />}

      {nutritionist ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-heart-outline" size={16} color="#1aa44f" />
          <Text style={styles.metaText}>{nutritionist}</Text>
        </View>
      ) : null}

      {notes ? (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="note-text-outline" size={16} color="#6f675b" />
          <Text style={styles.metaText}>{notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 17, 21, 0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 74,
    maxHeight: '78%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#eee7db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1ede6',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f8f3',
    borderWidth: 1,
    borderColor: '#c3e8ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1115',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#faf8f4',
    borderWidth: 1,
    borderColor: '#eee7db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 22,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a7f3e',
    marginBottom: 2,
  },
  stateBox: {
    backgroundColor: '#faf8f4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eee7db',
    padding: 14,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f1115',
    marginBottom: 4,
  },
  stateText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7d756a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee7db',
    padding: 14,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardProminent: {
    borderColor: '#c3e8ca',
    backgroundColor: '#f7fdf9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateWrap: {
    flex: 1,
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f1115',
    textTransform: 'capitalize',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: '#6f675b',
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f8f3',
    borderWidth: 1,
    borderColor: '#c3e8ca',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a7f3e',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1ede6',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#5f584e',
    fontWeight: '600',
  },
});
