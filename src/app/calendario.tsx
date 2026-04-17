import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BottomNav } from '@/components/navigation/bottom-nav';

// Mock data - eventos por fecha
const EVENTOS_MOCK = {
  '2026-04-15': [
    { id: 1, tipo: 'comida', nombre: 'Desayuno', hora: '08:00', emoji: '🥗' },
    { id: 2, tipo: 'ejercicio', nombre: 'Cardio', hora: '10:00', emoji: '💪' },
  ],
  '2026-04-17': [
    { id: 3, tipo: 'comida', nombre: 'Almuerzo', hora: '12:30', emoji: '🍱' },
    { id: 4, tipo: 'recordatorio', nombre: 'Beber agua', hora: '14:00', emoji: '💧' },
  ],
  '2026-04-20': [
    { id: 5, tipo: 'ejercicio', nombre: 'Pesas', hora: '07:00', emoji: '⚽' },
  ],
};

const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

export default function CalendarioScreen() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 17));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 17));

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayPress = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const eventosDelDia = EVENTOS_MOCK[selectedDateKey] || [];

  const renderCalendarDays = () => {
    const days = [];
    const emptyDays = Array(firstDay).fill(null);

    days.push(...emptyDays);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasEvents = EVENTOS_MOCK[dateStr];
      const isSelected = selectedDate.getDate() === i && selectedDate.getMonth() === currentDate.getMonth();

      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[
            styles.dayButton,
            isSelected && styles.dayButtonSelected,
            hasEvents && !isSelected && styles.dayButtonWithEvents,
          ]}
          onPress={() => handleDayPress(i)}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
            {i}
          </Text>
          {hasEvents && (
            <View style={[styles.eventDot, isSelected && styles.eventDotSelected]}>
              <View style={styles.dotSmall} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Calendario</Text>
              <Text style={styles.subtitle}>Organiza tu rutina y recordatorios</Text>
            </View>
          </View>

          {/* Calendario */}
          <View style={styles.calendarCard}>
            {/* Month Navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <MaterialIcons name="chevron-left" size={28} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthName}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <MaterialIcons name="chevron-right" size={28} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayHeaders}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                <Text key={idx} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {renderCalendarDays()}
            </View>
          </View>

          {/* Evento Info */}
          <View style={styles.eventCard}>
            <View style={styles.eventCardHeader}>
              <Text style={styles.eventCardTitle}>
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <Pressable style={styles.addEventButton}>
                <MaterialIcons name="add" size={20} color="white" />
              </Pressable>
            </View>

            {eventosDelDia.length > 0 ? (
              <View style={styles.eventsList}>
                {eventosDelDia.map((evento) => (
                  <View key={evento.id} style={styles.eventItem}>
                    <View style={styles.eventTime}>
                      <Text style={styles.eventEmoji}>{evento.emoji}</Text>
                      <View>
                        <Text style={styles.eventHour}>{evento.hora}</Text>
                        <Text style={styles.eventType}>{evento.tipo}</Text>
                      </View>
                    </View>
                    <Text style={styles.eventName}>{evento.nombre}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsEmoji}>📆</Text>
                <Text style={styles.noEventsText}>Sin eventos programados</Text>
                <Text style={styles.noEventsSubtext}>Agrega un recordatorio para este día</Text>
              </View>
            )}
          </View>

          {/* Recordatorios Rápidos */}
          <View style={styles.quickRemindersCard}>
            <Text style={styles.quickRemindersTitle}>Recordatorios Rápidos</Text>
            <View style={styles.remindersGrid}>
              <QuickReminderButton emoji="🥗" label="Comida" color="#22c55e" />
              <QuickReminderButton emoji="💪" label="Ejercicio" color="#ef4444" />
              <QuickReminderButton emoji="💧" label="Agua" color="#0ea5e9" />
              <QuickReminderButton emoji="😴" label="Descanso" color="#f97316" />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

function QuickReminderButton({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <Pressable style={styles.reminderButton}>
      <View style={[styles.reminderIcon, { backgroundColor: color }]}>
        <Text style={styles.reminderEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.reminderLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdfcf9',
  },
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  contentContainer: {
    paddingBottom: 120,
  },

  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7c7268',
    marginTop: 4,
    fontWeight: '500',
  },

  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
  },

  weekdayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c7268',
    width: '14%',
    textAlign: 'center',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f8f6f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  dayButtonSelected: {
    backgroundColor: '#ecb607',
  },
  dayButtonWithEvents: {
    backgroundColor: '#f0ede7',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5f564d',
  },
  dayTextSelected: {
    color: 'white',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ecb607',
  },
  eventDotSelected: {
    backgroundColor: 'white',
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ecb607',
  },

  eventCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  addEventButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecb607',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventsList: {
    gap: 12,
  },
  eventItem: {
    backgroundColor: '#f8f6f1',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventHour: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c7268',
  },
  eventType: {
    fontSize: 11,
    color: '#b8aca0',
    fontWeight: '600',
    marginTop: 2,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },

  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noEventsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 13,
    color: '#8e8579',
  },

  quickRemindersCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  quickRemindersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  remindersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  reminderButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f6f1',
    borderRadius: 14,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderEmoji: {
    fontSize: 24,
  },
  reminderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },

  bottomSpacer: {
    height: 20,
  },
});
