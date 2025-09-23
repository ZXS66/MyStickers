import React, { useEffect, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Sticker } from '../types/sticker';
import { getStickers, removeSticker, saveStickers, updateStickerAlbum } from '../utils/stickerStorage';

interface Props {
  onAddSticker: () => void;
  onShareSticker: (sticker: Sticker) => void;
  refreshFlag?: number;
}

type ListItem = { type: 'header'; album: string } | { type: 'sticker'; sticker: Sticker };

export default function StickerList({ onAddSticker, onShareSticker, refreshFlag }: Props) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [changingAlbumId, setChangingAlbumId] = useState<string | null>(null);
  const [newAlbum, setNewAlbum] = useState('');

  const refresh = async () => {
    const all = await getStickers();
    setStickers(all);
    setItems(flattenStickers(all));
  };

  useEffect(() => {
    refresh();
    return () => {};
  }, [refreshFlag]);

  function flattenStickers(stickers: Sticker[]): ListItem[] {
    const byAlbum: Record<string, Sticker[]> = {};
    stickers.forEach(s => {
      const album = s.album || 'default';
      if (!byAlbum[album]) byAlbum[album] = [];
      byAlbum[album].push(s);
    });
    const albums = Object.keys(byAlbum).sort();
    let result: ListItem[] = [];
    albums.forEach(album => {
      result.push({ type: 'header', album });
      byAlbum[album].forEach(sticker => result.push({ type: 'sticker', sticker }));
    });
    return result;
  }

  const handleRemove = async (id: string) => {
    await removeSticker(id);
    refresh();
  };

  const handleChangeAlbum = async (id: string, album: string) => {
    await updateStickerAlbum(id, album.trim() || 'default');
    setChangingAlbumId(null);
    setNewAlbum('');
    refresh();
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<ListItem>) => {
    if (item.type === 'header') {
      return (
        <View style={styles.albumSection}>
          <Text style={styles.albumHeader}>{item.album}</Text>
        </View>
      );
    }
    const sticker = item.sticker;
    const scale = new Animated.Value(isActive ? 1.05 : 0.8);
    return (
      <View style={styles.stickerContainer}>
        <Pressable
          onPress={() => onShareSticker(sticker)}
          onLongPress={drag}
          style={({ pressed }) => [styles.stickerWrap, pressed && styles.stickerPressed]}
          android_ripple={{ color: '#ffe082' }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Image source={{ uri: sticker.url }} style={styles.sticker} />
          </Animated.View>
        </Pressable>
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(sticker.id)}>
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changeAlbumButton} onPress={() => setChangingAlbumId(sticker.id)}>
          <Text style={styles.changeAlbumButtonText}>⇄</Text>
        </TouchableOpacity>
        {changingAlbumId === sticker.id && (
          <View style={styles.changeAlbumBox}>
            <TextInput
              style={styles.changeAlbumInput}
              value={newAlbum}
              onChangeText={setNewAlbum}
              placeholder="New album name"
              autoFocus
              onSubmitEditing={() => handleChangeAlbum(sticker.id, newAlbum)}
            />
            <TouchableOpacity onPress={() => handleChangeAlbum(sticker.id, newAlbum)}>
              <Text style={styles.changeAlbumConfirm}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setChangingAlbumId(null)}>
              <Text style={styles.changeAlbumCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const getStickerAlbum = (idx: number, arr: ListItem[]) => {
    // Find the closest header above idx
    for (let i = idx; i >= 0; --i) {
      if (arr[i].type === 'header') {
        return (arr[i] as { type: 'header'; album: string }).album;
      }
    }
    return 'default';
  };

  const onDragEnd = async ({ data, from, to }: { data: ListItem[]; from: number; to: number }) => {
    // If a sticker moved across album header, update its album
    const moved = data[to];
    if (moved.type === 'sticker') {
      const newAlbum = getStickerAlbum(to, data);
      if (moved.sticker.album !== newAlbum) {
        await updateStickerAlbum(moved.sticker.id, newAlbum);
      }
    }
    // Rebuild stickers array (ignore headers)
    const newStickers = data.filter(i => i.type === 'sticker').map(i => (i as any).sticker);
    await saveStickers(newStickers);
    setItems(data);
    setStickers(newStickers);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Stickers</Text>
      <DraggableFlatList
        data={items}
        keyExtractor={(item, idx) => item.type === 'header' ? `header-${item.album}` : (item as any).sticker.id}
        renderItem={renderItem}
        horizontal={false}
        onDragEnd={onDragEnd}
        activationDistance={20}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => { onAddSticker(); setTimeout(refresh, 500); }} activeOpacity={0.7}>
        <Text style={styles.addText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 36 },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  stickerWrap: {
    margin: 8,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fffbe6',
    boxShadow: '0px 2px 8px #ffe08255',
  },
  stickerPressed: {
    opacity: 0.7,
    backgroundColor: '#ffe082',
  },
  sticker: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  albumHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffb300',
    backgroundColor: '#fffbe6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 4,
  },
  stickerContainer: {
    position: 'relative',
    marginRight: 4,
  },
  changeAlbumButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#ffd33d',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  changeAlbumButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  changeAlbumBox: {
    position: 'absolute',
    top: 24,
    right: 0,
    backgroundColor: '#fffbe6',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  changeAlbumInput: {
    borderWidth: 1,
    borderColor: '#ffb300',
    borderRadius: 6,
    padding: 4,
    minWidth: 80,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  changeAlbumConfirm: {
    color: '#ff9800',
    fontWeight: 'bold',
    marginRight: 8,
  },
  changeAlbumCancel: {
    color: '#888',
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff5252',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  albumSection: {
    marginBottom: 12,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#ffb300',
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 16px #ff980055',
  },
  addText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  empty: { textAlign: 'center', color: '#888', fontSize: 16 },
});
