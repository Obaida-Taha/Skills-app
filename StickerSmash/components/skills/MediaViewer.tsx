import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { AppText } from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { SkillMedia } from '@/types';

type Props = {
  media: SkillMedia | null;
  colors: ReturnType<typeof palette>;
  onClose: () => void;
  onDelete: () => void;
};

export function MediaViewer({
  media,
  colors,
  onClose,
  onDelete,
}: Props) {
  return (
    <Modal
      visible={!!media}
      animationType="fade"
      onRequestClose={onClose}
    >
      {media && (
        <View style={styles.viewer}>
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <AppText style={styles.close}>✕</AppText>
            </Pressable>

            <Pressable onPress={onDelete}>
              <AppText
                style={{
                  color: colors.danger,
                  fontWeight: '900',
                }}
              >
                Delete
              </AppText>
            </Pressable>
          </View>

          {media.type === 'image' ? (
            <Image
              source={{ uri: media.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <VideoPlayer uri={media.uri} />
          )}
        </View>
      )}
    </Modal>
  );
}

function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return (
    <View style={styles.videoWrap}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  close: {
    color: '#fff',
    fontSize: 28,
  },

  image: {
    flex: 1,
    width: '100%',
  },

  videoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});