export interface Sticker {
  id: string; // uuid
  url: string; // image url (local or remote)
  type: 'gif' | 'png' | 'jpg';
  addedAt: number;
  album: string; // album name
}
