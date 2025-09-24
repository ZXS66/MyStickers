import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import AddSticker from '../../components/AddSticker';
import StickerList from '../../components/StickerList';
import { Sticker } from '../../types/sticker';

export default function StickersScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const handleAddSticker = () => setModalVisible(true);
  const handleDone = () => setModalVisible(false);
  const handleStickerAdded = () => {
    setModalVisible(false);
    setRefreshFlag(f => f + 1);
  };

  const handleShareSticker = async (sticker: Sticker) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(sticker.url);
    } else {
      alert('Sharing is not available on this device.');
    }
  };

  return (
    <View style={styles.container}>
      <StickerList onAddSticker={handleAddSticker} onShareSticker={handleShareSticker} refreshFlag={refreshFlag} />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleDone}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <AddSticker onDone={handleStickerAdded} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: '0px 4px 24px #ff980055',
  },
});
