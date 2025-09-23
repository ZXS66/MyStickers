export async function getAllAlbums(): Promise<string[]> {
  const stickers = await getStickers();
  const albumSet = new Set<string>();
  stickers.forEach(s => albumSet.add(s.album || 'default'));
  return Array.from(albumSet).sort();
}
export async function updateStickerAlbum(id: string, newAlbum: string): Promise<void> {
  const stickers = await getStickers();
  const idx = stickers.findIndex(s => s.id === id);
  if (idx !== -1) {
    stickers[idx].album = newAlbum;
    await saveStickers(stickers);
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sticker } from '../types/sticker';

const STICKERS_KEY = 'MY_STICKERS';

export async function getStickers(): Promise<Sticker[]> {
  const json = await AsyncStorage.getItem(STICKERS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveStickers(stickers: Sticker[]): Promise<void> {
  await AsyncStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
}

export async function addSticker(sticker: Sticker): Promise<void> {
  const stickers = await getStickers();
  stickers.unshift(sticker);
  await saveStickers(stickers);
}

export async function removeSticker(id: string): Promise<void> {
  const stickers = await getStickers();
  const filtered = stickers.filter(s => s.id !== id);
  await saveStickers(filtered);
}
