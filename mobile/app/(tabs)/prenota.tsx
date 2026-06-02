import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { bookingsAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
};
LocaleConfig.defaultLocale = 'it';

const today = new Date().toISOString().slice(0, 10);

export default function PrenotaScreen() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState(false);

  const loadSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const res = await bookingsAPI.availability(date);
      setSlots(res.data.slots);
    } catch {
      Toast.show({ type: 'error', text1: 'Errore caricamento disponibilità' });
    } finally {
      setLoadingSlots(false);
    }
  };

  useFocusEffect(useCallback(() => { loadSlots(selectedDate); }, [selectedDate]));

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedSlot(null);
  };

  const openModal = (slot: string) => {
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await bookingsAPI.create({ date: selectedDate, timeSlot: selectedSlot, teamName, notes });
      setShowModal(false);
      setTeamName('');
      setNotes('');
      await loadSlots(selectedDate);
      Toast.show({ type: 'success', text1: '🎉 Prenotazione confermata!', text2: `${selectedDate} - ${selectedSlot}` });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Errore prenotazione' });
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>📅 Prenota il Campo</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: Colors.primary } }}
          minDate={today}
          theme={{
            selectedDayBackgroundColor: Colors.primary,
            todayTextColor: Colors.primary,
            arrowColor: Colors.primary,
            textMonthFontWeight: '700',
          }}
        />

        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>Disponibilità {formatDate(selectedDate)}</Text>

          {loadingSlots ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : slots.length === 0 ? (
            <Text style={styles.emptyText}>Nessuna fascia disponibile</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((s) => (
                <TouchableOpacity
                  key={s.slot}
                  style={[
                    styles.slotCard,
                    s.available && styles.slotAvailable,
                    s.blocked && styles.slotBlocked,
                    !s.available && !s.blocked && styles.slotBooked,
                  ]}
                  onPress={() => s.available && openModal(s.slot)}
                  disabled={!s.available}
                >
                  <Text style={[styles.slotTime, !s.available && { color: Colors.textSecondary }]}>{s.slot}</Text>
                  {s.available && <Text style={styles.slotStatus}>✓ Disponibile</Text>}
                  {s.blocked && <Text style={styles.slotBlockedText}>🚫 {s.blockReason || 'Non disponibile'}</Text>}
                  {!s.available && !s.blocked && s.bookedBy && (
                    <Text style={styles.slotBookedText}>👥 {s.bookedBy.nome} {s.bookedBy.cognome}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Conferma Prenotazione</Text>
            <Text style={styles.modalInfo}>📅 {formatDate(selectedDate)}</Text>
            <Text style={styles.modalInfo}>⏰ {selectedSlot}</Text>

            <Text style={styles.label}>Nome squadra (opzionale)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es. FC Kiricocho"
              placeholderTextColor={Colors.textSecondary}
              value={teamName}
              onChangeText={setTeamName}
            />

            <Text style={styles.label}>Note (opzionale)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Eventuali note..."
              placeholderTextColor={Colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, booking && { opacity: 0.6 }]} onPress={handleBook} disabled={booking}>
                <Text style={styles.confirmBtnText}>{booking ? 'Prenotando...' : 'Conferma'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  slotsContainer: { padding: 16 },
  slotsTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14, textTransform: 'capitalize' },
  slotsGrid: { gap: 10 },
  slotCard: { borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.border },
  slotAvailable: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  slotBlocked: { backgroundColor: '#fef2f2', borderColor: Colors.error },
  slotBooked: { backgroundColor: Colors.background },
  slotTime: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  slotStatus: { fontSize: 12, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  slotBlockedText: { fontSize: 12, color: Colors.error, marginTop: 2 },
  slotBookedText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', paddingTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  modalInfo: { fontSize: 15, color: Colors.text, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.background },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
