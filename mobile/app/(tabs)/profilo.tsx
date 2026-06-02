import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { bookingsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';

const LEVEL_ICONS = ['🌱', '⭐', '🌟', '🏅', '🏆'];
const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success,
  cancelled: Colors.error,
  pending: Colors.warning,
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confermata',
  cancelled: 'Cancellata',
  pending: 'In attesa',
};

export default function ProfiloScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const [bookRes] = await Promise.all([bookingsAPI.myBookings(), refreshUser()]);
      setBookings(bookRes.data.bookings);
    } catch {
      Toast.show({ type: 'error', text1: 'Errore caricamento dati' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const cancelBooking = (id: string) => {
    Alert.alert('Cancella prenotazione', 'Sei sicuro di voler cancellare questa prenotazione?', [
      { text: 'No' },
      {
        text: 'Sì, cancella',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingsAPI.cancel(id);
            await load();
            Toast.show({ type: 'success', text1: 'Prenotazione cancellata' });
          } catch {
            Toast.show({ type: 'error', text1: 'Errore cancellazione' });
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Vuoi uscire dall\'app?', [
      { text: 'No' },
      { text: 'Sì', onPress: logout },
    ]);
  };

  if (!user) return null;
  const level = user.level;
  const upcoming = bookings.filter((b) => b.date >= new Date().toISOString().slice(0, 10) && b.status === 'confirmed');
  const past = bookings.filter((b) => b.date < new Date().toISOString().slice(0, 10) || b.status === 'cancelled');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: `https://kiricocho-production.up.railway.app${user.avatar}` }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{user.nome[0]}{user.cognome[0]}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user.nome} {user.cognome}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.role === 'admin' && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>👑 Amministratore</Text></View>}
      </View>

      {/* Livello */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelIcon}>{LEVEL_ICONS[(level.number - 1) % LEVEL_ICONS.length]}</Text>
          <View>
            <Text style={styles.levelName}>{level.name}</Text>
            <Text style={styles.levelSub}>Livello {level.number}</Text>
          </View>
          <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
            <Text style={styles.gamesCount}>{level.gamesPlayed} partite</Text>
            {level.gamesForNext && (
              <Text style={styles.gamesNext}>Prossimo: {level.gamesForNext}</Text>
            )}
          </View>
        </View>
        {level.gamesForNext && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${level.progress}%` }]} />
          </View>
        )}
        {level.gamesForNext && (
          <Text style={styles.progressText}>{level.progress}% verso "{(level.number < 5 ? ['Amatore','Semiprofessionista','Professionista','Campione'][level.number - 1] : 'MAX')}"</Text>
        )}
      </View>

      {/* Dati personali */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dati Personali</Text>
          <TouchableOpacity onPress={() => router.push('/edit-profile')}>
            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <InfoRow icon="call-outline" label="Telefono" value={user.telefono} />
        <InfoRow icon="mail-outline" label="Email" value={user.email} />
      </View>

      {/* Prenotazioni future */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prossime Partite ({upcoming.length})</Text>
        {upcoming.length === 0 ? (
          <Text style={styles.emptyText}>Nessuna prenotazione futura. <Text style={{ color: Colors.primary }}>Prenota ora!</Text></Text>
        ) : (
          upcoming.map((b) => <BookingCard key={b._id} booking={b} onCancel={cancelBooking} />)
        )}
      </View>

      {/* Storico */}
      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storico Partite ({past.length})</Text>
          {past.slice(0, 5).map((b) => <BookingCard key={b._id} booking={b} />)}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Esci dall'account</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={Colors.primary} />
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function BookingCard({ booking, onCancel }: { booking: any; onCancel?: (id: string) => void }) {
  const isPast = booking.date < new Date().toISOString().slice(0, 10);
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingDate}>
          {new Date(booking.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
        <Text style={styles.bookingSlot}>⏰ {booking.timeSlot}</Text>
        {booking.teamName ? <Text style={styles.bookingTeam}>👥 {booking.teamName}</Text> : null}
      </View>
      <View style={styles.bookingRight}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>{STATUS_LABELS[booking.status]}</Text>
        </View>
        {!isPast && booking.status === 'confirmed' && onCancel && (
          <TouchableOpacity onPress={() => onCancel(booking._id)} style={styles.cancelIcon}>
            <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 30, alignItems: 'center' },
  avatarContainer: { marginBottom: 12 },
  avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.white },
  avatarInitials: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  name: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  email: { color: Colors.primaryLight, fontSize: 13, marginTop: 2 },
  adminBadge: { backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  adminBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  levelCard: { backgroundColor: Colors.white, margin: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  levelIcon: { fontSize: 36 },
  levelName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  levelSub: { fontSize: 13, color: Colors.textSecondary },
  gamesCount: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  gamesNext: { fontSize: 11, color: Colors.textSecondary },
  progressBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
  section: { backgroundColor: Colors.white, margin: 16, marginTop: 0, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 11, color: Colors.textSecondary },
  infoValue: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bookingInfo: {},
  bookingDate: { fontSize: 15, fontWeight: '700', color: Colors.text, textTransform: 'capitalize' },
  bookingSlot: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  bookingTeam: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cancelIcon: { padding: 2 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.error, borderRadius: 12 },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: '700' },
});
