import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, FlatList, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { adminAPI, bookingsAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

const DEFAULT_SLOTS = [
  '08:00-09:30','09:30-11:00','11:00-12:30','12:30-14:00',
  '14:00-15:30','15:30-17:00','17:00-18:30','18:30-20:00',
  '20:00-21:30','21:30-23:00',
];

type Tab = 'slots' | 'bookings' | 'users' | 'stats';

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ slot: DEFAULT_SLOTS[0], date: '', reason: '' });

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const res = await adminAPI.stats();
        setStats(res.data);
      } else if (tab === 'slots') {
        const res = await adminAPI.slots();
        setBlockedSlots(res.data.blocked);
      } else if (tab === 'bookings') {
        const res = await adminAPI.allBookings();
        setBookings(res.data.bookings);
      } else if (tab === 'users') {
        const res = await adminAPI.users();
        setUsers(res.data.users);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Errore caricamento' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [tab]));

  const blockSlot = async () => {
    try {
      await adminAPI.blockSlot(blockForm.slot, blockForm.date || undefined, blockForm.reason);
      setShowBlockModal(false);
      setBlockForm({ slot: DEFAULT_SLOTS[0], date: '', reason: '' });
      await load();
      Toast.show({ type: 'success', text1: 'Fascia bloccata' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Errore' });
    }
  };

  const unblockSlot = (id: string) => {
    Alert.alert('Sblocca fascia', 'Vuoi sbloccare questa fascia oraria?', [
      { text: 'No' },
      { text: 'Sì', onPress: async () => { await adminAPI.unblockSlot(id); await load(); } },
    ]);
  };

  const completeBooking = async (id: string) => {
    try {
      await bookingsAPI.complete(id);
      await load();
      Toast.show({ type: 'success', text1: 'Partita completata, livello aggiornato!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Errore' });
    }
  };

  const toggleUser = async (id: string) => {
    await adminAPI.toggleUser(id);
    await load();
  };

  const setRole = (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Alert.alert('Cambia ruolo', `Impostare come ${newRole}?`, [
      { text: 'No' },
      { text: 'Sì', onPress: async () => { await adminAPI.setRole(id, newRole); await load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>⚙️ Pannello Admin</Text>
      </View>

      <View style={styles.tabs}>
        {(['stats', 'slots', 'bookings', 'users'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {{ stats: '📊', slots: '🕐', bookings: '📋', users: '👥' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
      >
        {/* STATS */}
        {tab === 'stats' && stats && (
          <View style={styles.statsGrid}>
            <StatCard icon="people-outline" label="Utenti" value={stats.totalUsers} color={Colors.primary} />
            <StatCard icon="calendar-outline" label="Tot. Prenotazioni" value={stats.totalBookings} color={Colors.secondary} />
            <StatCard icon="time-outline" label="Prossime" value={stats.upcomingBookings} color={Colors.accent} />
          </View>
        )}

        {/* SLOTS */}
        {tab === 'slots' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowBlockModal(true)}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.addBtnText}>Blocca Fascia Oraria</Text>
            </TouchableOpacity>

            {blockedSlots.length === 0 ? (
              <Text style={styles.emptyText}>Nessuna fascia bloccata</Text>
            ) : (
              blockedSlots.map((b) => (
                <View key={b._id} style={styles.blockedCard}>
                  <View>
                    <Text style={styles.blockedSlot}>{b.slot}</Text>
                    <Text style={styles.blockedDate}>{b.date || 'Sempre bloccata'}</Text>
                    {b.reason ? <Text style={styles.blockedReason}>{b.reason}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => unblockSlot(b._id)}>
                    <Ionicons name="lock-open-outline" size={22} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          bookings.length === 0 ? <Text style={styles.emptyText}>Nessuna prenotazione</Text> :
          bookings.map((b) => (
            <View key={b._id} style={styles.bookingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingUser}>{b.user?.nome} {b.user?.cognome}</Text>
                <Text style={styles.bookingSlot}>{b.date} — {b.timeSlot}</Text>
                {b.teamName ? <Text style={styles.bookingTeam}>👥 {b.teamName}</Text> : null}
                <Text style={[styles.bookingStatus, { color: b.status === 'confirmed' ? Colors.success : Colors.error }]}>
                  {b.status === 'confirmed' ? '✓ Confermata' : '✗ Cancellata'}
                </Text>
              </View>
              {b.status === 'confirmed' && !b.gameCompleted && (
                <TouchableOpacity style={styles.completeBtn} onPress={() => completeBooking(b._id)}>
                  <Text style={styles.completeBtnText}>Completa</Text>
                </TouchableOpacity>
              )}
              {b.gameCompleted && <Text style={styles.completedTag}>✅ Giocata</Text>}
            </View>
          ))
        )}

        {/* USERS */}
        {tab === 'users' && (
          users.map((u) => (
            <View key={u._id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitials}>{u.nome[0]}{u.cognome[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.nome} {u.cognome}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <Text style={styles.userStats}>{u.gamesPlayed} partite · {u.role === 'admin' ? '👑 Admin' : '👤 Utente'}</Text>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity onPress={() => setRole(u._id, u.role)}>
                  <Ionicons name={u.role === 'admin' ? 'shield' : 'shield-outline'} size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleUser(u._id)}>
                  <Ionicons name={u.isActive ? 'eye-outline' : 'eye-off-outline'} size={22} color={u.isActive ? Colors.success : Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal blocca slot */}
      <Modal visible={showBlockModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Blocca Fascia Oraria</Text>

            <Text style={styles.label}>Fascia oraria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {DEFAULT_SLOTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.slotChip, blockForm.slot === s && styles.slotChipActive]}
                  onPress={() => setBlockForm((f) => ({ ...f, slot: s }))}
                >
                  <Text style={[styles.slotChipText, blockForm.slot === s && { color: Colors.white }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Data (vuoto = blocca sempre)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (es. 2024-12-25)"
              placeholderTextColor={Colors.textSecondary}
              value={blockForm.date}
              onChangeText={(v) => setBlockForm((f) => ({ ...f, date: v }))}
            />

            <Text style={styles.label}>Motivo (opzionale)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es. Manutenzione campo"
              placeholderTextColor={Colors.textSecondary}
              value={blockForm.reason}
              onChangeText={(v) => setBlockForm((f) => ({ ...f, reason: v }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBlockModal(false)}>
                <Text style={styles.cancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={blockSlot}>
                <Text style={styles.confirmText}>Blocca</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.white, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  tabText: { fontSize: 20 },
  tabTextActive: {},
  statsGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '28%', backgroundColor: Colors.white, borderRadius: 16, padding: 16, alignItems: 'center', borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statValue: { fontSize: 32, fontWeight: '800', color: Colors.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  blockedCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: Colors.error },
  blockedSlot: { fontSize: 16, fontWeight: '700', color: Colors.text },
  blockedDate: { fontSize: 13, color: Colors.textSecondary },
  blockedReason: { fontSize: 12, color: Colors.error, marginTop: 2 },
  bookingCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bookingUser: { fontSize: 15, fontWeight: '700', color: Colors.text },
  bookingSlot: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  bookingTeam: { fontSize: 12, color: Colors.textSecondary },
  bookingStatus: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  completeBtn: { backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  completeBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  completedTag: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  userCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  userInitials: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textSecondary },
  userStats: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  userActions: { flexDirection: 'row', gap: 12 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', paddingTop: 30, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.text },
  slotChip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  slotChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotChipText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  cancelText: { fontWeight: '600', color: Colors.text, fontSize: 15 },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.error, alignItems: 'center' },
  confirmText: { fontWeight: '700', color: Colors.white, fontSize: 15 },
});
