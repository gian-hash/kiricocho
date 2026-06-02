import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ nome: user?.nome || '', cognome: user?.cognome || '', telefono: user?.telefono || '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  };

  const save = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append('nome', form.nome);
    fd.append('cognome', form.cognome);
    fd.append('telefono', form.telefono);
    if (avatar) {
      const filename = avatar.split('/').pop()!;
      fd.append('avatar', { uri: avatar, name: filename, type: 'image/jpeg' } as any);
    }
    try {
      await usersAPI.updateProfile(fd);
      await refreshUser();
      Toast.show({ type: 'success', text1: 'Profilo aggiornato!' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Errore aggiornamento' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifica Profilo</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar}>
            {avatar || user?.avatar ? (
              <Image source={{ uri: avatar || `http://192.168.1.100:5000${user?.avatar}` }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{user?.nome[0]}{user?.cognome[0]}</Text>
              </View>
            )}
            <View style={styles.avatarEdit}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {(['nome', 'cognome', 'telefono'] as const).map((field) => (
            <View key={field}>
              <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
              <TextInput
                style={styles.input}
                value={form[field]}
                onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize={field === 'telefono' ? 'none' : 'words'}
                keyboardType={field === 'telefono' ? 'phone-pad' : 'default'}
              />
            </View>
          ))}

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={save} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Salvataggio...' : 'Salva modifiche'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  avatarSection: { alignItems: 'center', padding: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: Colors.white, fontSize: 32, fontWeight: '700' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primaryDark, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
  form: { backgroundColor: Colors.white, margin: 16, borderRadius: 16, padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, backgroundColor: Colors.background },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
