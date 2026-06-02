import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, TextInput, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';

const POST_TYPES = [
  { value: 'news', label: '📰 Notizia' },
  { value: 'photo', label: '📷 Foto' },
  { value: 'announcement', label: '📢 Annuncio' },
  { value: 'result', label: '⚽ Risultato' },
];

const TYPE_LABELS: Record<string, string> = {
  news: '📰', photo: '📷', announcement: '📢', result: '⚽',
};

export default function BachecaScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newPost, setNewPost] = useState({ type: 'news', title: '', content: '', image: null as string | null });
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComment, setShowComment] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await postsAPI.list();
      setPosts(res.data.posts);
    } catch {
      Toast.show({ type: 'error', text1: 'Errore caricamento bacheca' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setNewPost((p) => ({ ...p, image: res.assets[0].uri }));
  };

  const submitPost = async () => {
    if (!newPost.content) { Toast.show({ type: 'error', text1: 'Scrivi qualcosa!' }); return; }
    const fd = new FormData();
    fd.append('type', newPost.type);
    fd.append('title', newPost.title);
    fd.append('content', newPost.content);
    if (newPost.image) {
      const filename = newPost.image.split('/').pop()!;
      fd.append('image', { uri: newPost.image, name: filename, type: 'image/jpeg' } as any);
    }
    try {
      await postsAPI.create(fd);
      setNewPost({ type: 'news', title: '', content: '', image: null });
      setShowNew(false);
      await load();
      Toast.show({ type: 'success', text1: 'Post pubblicato!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Errore pubblicazione' });
    }
  };

  const toggleLike = async (id: string) => {
    try {
      const res = await postsAPI.like(id);
      setPosts((prev) =>
        prev.map((p) => p._id === id ? { ...p, likes: res.data.liked ? [...p.likes, user?._id] : p.likes.filter((l: string) => l !== user?._id) } : p)
      );
    } catch {}
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text) return;
    try {
      await postsAPI.comment(postId, text);
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      await load();
    } catch {}
  };

  const deletePost = async (id: string) => {
    try {
      await postsAPI.delete(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      Toast.show({ type: 'success', text1: 'Post eliminato' });
    } catch {}
  };

  const renderPost = ({ item }: { item: any }) => {
    const liked = item.likes?.includes(user?._id);
    const canDelete = user?.role === 'admin' || item.author?._id === user?._id;

    return (
      <View style={[styles.card, item.pinned && styles.pinnedCard]}>
        {item.pinned && <Text style={styles.pinnedBadge}>📌 In evidenza</Text>}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.author?.nome?.[0]}{item.author?.cognome?.[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{item.author?.nome} {item.author?.cognome}</Text>
            <Text style={styles.postDate}>{TYPE_LABELS[item.type]} {new Date(item.createdAt).toLocaleDateString('it-IT')}</Text>
          </View>
          {canDelete && (
            <TouchableOpacity onPress={() => deletePost(item._id)}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {item.title ? <Text style={styles.postTitle}>{item.title}</Text> : null}
        <Text style={styles.postContent}>{item.content}</Text>
        {item.image && <Image source={{ uri: `https://kiricocho-production.up.railway.app${item.image}` }} style={styles.postImage} />}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item._id)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? Colors.error : Colors.textSecondary} />
            <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComment(showComment === item._id ? null : item._id)}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>

        {showComment === item._id && (
          <View>
            {item.comments?.map((c: any) => (
              <View key={c._id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{c.user?.nome}: </Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))}
            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentBox}
                placeholder="Scrivi un commento..."
                placeholderTextColor={Colors.textSecondary}
                value={commentText[item._id] || ''}
                onChangeText={(v) => setCommentText((prev) => ({ ...prev, [item._id]: v }))}
              />
              <TouchableOpacity onPress={() => submitComment(item._id)}>
                <Ionicons name="send" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>⚽ Bacheca</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nessun post ancora. Sii il primo! 🎉</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      />

      <Modal visible={showNew} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuovo Post</Text>
            <TouchableOpacity onPress={() => setShowNew(false)}>
              <Ionicons name="close" size={26} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeRow}>
            {POST_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeChip, newPost.type === t.value && styles.typeChipActive]}
                onPress={() => setNewPost((p) => ({ ...p, type: t.value }))}
              >
                <Text style={[styles.typeChipText, newPost.type === t.value && styles.typeChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Titolo (opzionale)</Text>
          <TextInput style={styles.input} placeholder="Titolo del post" placeholderTextColor={Colors.textSecondary} value={newPost.title} onChangeText={(v) => setNewPost((p) => ({ ...p, title: v }))} />

          <Text style={styles.label}>Testo *</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Scrivi qui..." placeholderTextColor={Colors.textSecondary} value={newPost.content} onChangeText={(v) => setNewPost((p) => ({ ...p, content: v }))} multiline />

          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color={Colors.primary} />
            <Text style={styles.imageBtnText}>{newPost.image ? '✓ Immagine selezionata' : 'Aggiungi immagine'}</Text>
          </TouchableOpacity>

          {newPost.image && <Image source={{ uri: newPost.image }} style={styles.previewImage} />}

          <TouchableOpacity style={styles.submitBtn} onPress={submitPost}>
            <Text style={styles.submitBtnText}>Pubblica</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  newBtn: { backgroundColor: Colors.primaryDark, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  pinnedCard: { borderLeftWidth: 4, borderLeftColor: Colors.accent },
  pinnedBadge: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  authorName: { fontWeight: '700', color: Colors.text, fontSize: 14 },
  postDate: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  postTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  postContent: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 12, resizeMode: 'cover' },
  actions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: Colors.textSecondary, fontSize: 13 },
  comment: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  commentAuthor: { fontWeight: '700', fontSize: 13, color: Colors.text },
  commentText: { fontSize: 13, color: Colors.text },
  commentInput: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  commentBox: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  modal: { flex: 1, backgroundColor: Colors.white, padding: 20, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, color: Colors.text },
  typeChipTextActive: { color: Colors.white, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.background },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 14, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, borderStyle: 'dashed' },
  imageBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  previewImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 12, resizeMode: 'cover' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
