import { Alert, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { AppText, Button, Card } from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { SkillMedia, UserSkill } from '@/types';
import { MediaThumbnail } from './MediaThumbnail';

type Props = {
  skill: UserSkill;
  colors: ReturnType<typeof palette>;
  updateSkill: (id: string, patch: Partial<UserSkill>) => void;
  onOpenMedia: (media: SkillMedia) => void;
};

export function SkillJourney({
  skill,
  colors,
  updateSkill,
  onOpenMedia,
}: Props) {
  async function addMedia() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Skill+ needs photo library access.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled) return;

    const added: SkillMedia[] = result.assets.map((asset, index) => ({
      id: `${Date.now()}-${index}`,
      type: asset.type === 'video' ? 'video' : 'image',
      uri: asset.uri,
      createdAt: new Date().toISOString(),
    }));

    updateSkill(skill.userSkillId, {
      media: [...(skill.media ?? []), ...added],
    });
  }

  return (
    <View style={styles.wrap}>
      <View>
        <AppText style={styles.title}>Your Journey</AppText>
        <AppText muted>
          Document how you learned {skill.name}.
        </AppText>
      </View>

      <Button title="+ Add Photos / Videos" onPress={addMedia} />

      {(skill.media ?? []).length === 0 ? (
        <Card>
          <AppText muted>
            Add photos or videos showing your progress and final result.
          </AppText>
        </Card>
      ) : (
        <View style={styles.grid}>
          {skill.media.map((media) => (
            <MediaThumbnail
              key={media.id}
              media={media}
              colors={colors}
              onPress={() => onOpenMedia(media)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});