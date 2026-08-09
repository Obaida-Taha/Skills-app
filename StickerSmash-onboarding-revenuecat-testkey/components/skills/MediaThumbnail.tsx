import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { SkillMedia } from '@/types';

type Props = {
  media: SkillMedia;
  colors: ReturnType<typeof palette>;
  onPress: () => void;
};

export function MediaThumbnail({
  media,
  colors,
  onPress,
}: Props) {
  if (media.type === 'image') {
    return (
      <Pressable style={styles.tile} onPress={onPress}>
        <Image
          source={{ uri: media.uri }}
          style={styles.image}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.tile,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.video}>
        <View
          style={[
            styles.play,
            { backgroundColor: colors.primary },
          ]}
        >
          <AppText style={styles.playText}>▶</AppText>
        </View>

        <AppText style={{ fontWeight: '800' }}>Video</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  video: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playText: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 3,
  },
});