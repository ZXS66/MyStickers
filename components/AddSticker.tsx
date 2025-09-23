import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import { Sticker } from '../types/sticker';
import { addSticker, getAllAlbums } from '../utils/stickerStorage';

interface Props {
  onDone: () => void;
}

export default function AddSticker({ onDone }: Props) {
  const [url, setUrl] = useState('');
  const [album, setAlbum] = useState('default');
  const [albums, setAlbums] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllAlbums().then(setAlbums);
  }, []);

  const handleAdd = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!url) {
        Toast.show({ type: 'error', text1: 'Please enter a sticker image URL' });
        setLoading(false);
        return;
      }
      const sticker: Sticker = {
        id: uuidv4(),
        url,
        type: 'png', // default type, not used for validation
        addedAt: Date.now(),
        album: album.trim() || 'default',
      };
      await addSticker(sticker);
      setUrl('');
      Toast.show({ type: 'success', text1: 'Sticker added!' });
      onDone();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.label}>Paste sticker image URL:</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://..."
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor="#ffb300"
      />
      <Text style={styles.label}>Album:</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDropdown(!showDropdown)}
        activeOpacity={0.7}
      >
        <Text style={{ color: album ? '#222' : '#aaa' }}>{album || 'Select or create album'}</Text>
      </TouchableOpacity>
      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={albums}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { setAlbum(item); setShowDropdown(false); }} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.dropdownText}>No albums</Text>}
          />
          <View style={styles.dropdownDivider} />
          <TextInput
            style={styles.dropdownInput}
            value={album}
            onChangeText={setAlbum}
            placeholder="New album name"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#ffb300"
            onFocus={() => setShowDropdown(true)}
          />
        </View>
      )}
      <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8} disabled={loading}>
        <Text style={styles.addButtonText}>{loading ? 'Adding...' : 'Add Sticker'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={onDone} activeOpacity={0.7}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flex: 1, justifyContent: 'center' },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  label: { fontSize: 18, marginBottom: 8, textAlign: 'center', color: '#ff9800', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ffb300',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#fffbe6',
  },
  addButton: {
    backgroundColor: '#ffb300',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: { color: '#888', fontSize: 16 },
  dropdown: {
    backgroundColor: '#fffbe6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffb300',
    marginBottom: 8,
    maxHeight: 120,
    marginHorizontal: 8,
    padding: 4,
    zIndex: 10,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#222',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#ffb30033',
    marginVertical: 4,
  },
  dropdownInput: {
    borderWidth: 1,
    borderColor: '#ffb300',
    borderRadius: 6,
    padding: 6,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 4,
  },
});
