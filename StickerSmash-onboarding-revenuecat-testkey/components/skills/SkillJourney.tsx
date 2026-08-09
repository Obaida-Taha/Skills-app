import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  AppText,
  Button,
  Card,
} from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FREE_MEDIA_PER_SKILL } from '@/features/premium/config';
import {
  fetchSkillMedia,
  uploadSkillMedia,
} from '@/lib/skill-media';
import {
  SkillMedia,
  UserSkill,
} from '@/types';
import { MediaThumbnail } from './MediaThumbnail';

type Props = {
  skill: UserSkill;
  colors: ReturnType<typeof palette>;
  onOpenMedia: (media: SkillMedia) => void;
  refreshKey: number;
};

export function SkillJourney({
  skill,
  colors,
  onOpenMedia,
  refreshKey,
}: Props) {
  const { isPremium, presentPaywall } = useSubscription();

  const [media, setMedia] = useState<SkillMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void loadMedia();
  }, [skill.userSkillId, refreshKey]);

  async function loadMedia() {
    try {
      setLoading(true);
      const rows = await fetchSkillMedia(skill.userSkillId);
      setMedia(rows);
    } catch (error) {
      console.warn('Failed to load skill media:', error);
      Alert.alert('Could not load media', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function addMedia() {
    let premiumForThisAction = isPremium;

    if (!premiumForThisAction && media.length >= FREE_MEDIA_PER_SKILL) {
      premiumForThisAction = await presentPaywall();
      if (!premiumForThisAction) return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Skill+ needs access to your photo library.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    if (
      !premiumForThisAction &&
      media.length + result.assets.length > FREE_MEDIA_PER_SKILL
    ) {
      premiumForThisAction = await presentPaywall();

      if (!premiumForThisAction) {
        const remaining = Math.max(
          0,
          FREE_MEDIA_PER_SKILL - media.length
        );

        Alert.alert(
          'Free media limit',
          remaining > 0
            ? `You can add ${remaining} more photo or video on the free plan.`
            : 'Upgrade to Skill+ Premium to add more journey photos and videos.'
        );
        return;
      }
    }

    try {
      setUploading(true);

      const uploaded: SkillMedia[] = [];

      for (const asset of result.assets) {
        const type: 'image' | 'video' =
          asset.type === 'video' ? 'video' : 'image';

        const item = await uploadSkillMedia(
          skill.userSkillId,
          asset.uri,
          type
        );

        uploaded.push(item);
      }

      setMedia((current) => [...current, ...uploaded]);
    } catch (error) {
      console.warn('Failed to upload skill media:', error);

      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setUploading(false);
    }
  }

  const freeRemaining = Math.max(
    0,
    FREE_MEDIA_PER_SKILL - media.length
  );

  return (
    <View style={styles.wrap}>
      <View>
        <AppText style={styles.title}>
          Your Journey
        </AppText>

        <AppText muted>
          Document how you learned {skill.name}.
        </AppText>
      </View>

      <Button
        title={
          uploading
            ? 'Uploading...'
            : !isPremium && media.length >= FREE_MEDIA_PER_SKILL
            ? 'Add more with Premium'
            : '+ Add Photos / Videos'
        }
        disabled={uploading}
        onPress={() => void addMedia()}
      />

      {!isPremium && !loading && (
        <AppText muted style={styles.limitText}>
          Free plan: {media.length}/{FREE_MEDIA_PER_SKILL} journey media used
          {freeRemaining > 0 ? ` · ${freeRemaining} remaining` : ''}
        </AppText>
      )}

      {isPremium && (
        <AppText style={[styles.limitText, { color: colors.primary }]}>
          Skill+ Premium · Unlimited journey media
        </AppText>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <AppText muted>Loading journey...</AppText>
        </View>
      ) : media.length === 0 ? (
        <Card>
          <AppText muted>
            Add photos or videos showing your progress and final result.
          </AppText>
        </Card>
      ) : (
        <View style={styles.grid}>
          {media.map((item) => (
            <MediaThumbnail
              key={item.id}
              media={item}
              colors={colors}
              onPress={() => onOpenMedia(item)}
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
  limitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
