import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authAPI } from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', telefono: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = async () => {
    const { nome, cognome, email, telefono, password, confirmPassword } = form;
    if (!nome || !cognome || !email || !telefono || !password) {
      Toast.show({ type: 'error', text1: 'Compila tutti i campi' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Le password non coincidono' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password minimo 6 caratteri' });
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register({ nome, cognome, email: email.trim().toLowerCase(), telefono, password });
      await SecureStore.setItemAsync('token', res.data.token);
      await refreshUser();
      router.replace('/(tabs)/bacheca');
    } catch (err: any) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Errore registrazione';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, ...props }: any) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textSecondary}
        value={form[field as keyof typeof form]}
        onChangeText={(v) => update(field, v)}
        {...props}
      />
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Indietro</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>⚽ Kiricocho</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Crea il tuo account</Text>

          <Field label="Nome *" field="nome" placeholder="Mario" autoCapitalize="words" />
          <Field label="Cognome *" field="cognome" placeholder="Rossi" autoCapitalize="words" />
          <Field label="Email *" field="email" placeholder="mario@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Telefono *" field="telefono" placeholder="+39 333 1234567" keyboardType="phone-pad" />
          <Field label="Password *" field="password" placeholder="Minimo 6 caratteri" secureTextEntry />
          <Field label="Conferma Password *" field="confirmPassword" placeholder="Ripeti la password" secureTextEntry />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Registrazione...' : 'Registrati'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkContainer}>
            <Text style={styles.link}>Hai già un account? <Text style={styles.linkBold}>Accedi</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.primary, padding: 24, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  back: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  form: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  formTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, backgroundColor: Colors.background },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  linkContainer: { alignItems: 'center', marginTop: 16 },
  link: { color: Colors.textSecondary, fontSize: 14 },
  linkBold: { color: Colors.primary, fontWeight: '700' },
});
