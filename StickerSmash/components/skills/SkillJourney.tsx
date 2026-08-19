import {
    useEffect,
    useState,
} from 'react';

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

import {
    SkillMedia,
    UserSkill,
} from '@/types';

import {
    fetchSkillMedia,
    uploadSkillMedia,
} from '@/lib/skill-media';

import { MediaThumbnail } from './MediaThumbnail';

type Props = {
    skill: UserSkill;

    colors: ReturnType<
        typeof palette
    >;

    updateSkill: (
        id: string,
        patch: Partial<UserSkill>
    ) => Promise<void>;

    onOpenMedia: (
        media: SkillMedia
    ) => void;

    refreshKey: number;
};

export function SkillJourney({
    skill,
    colors,
    updateSkill,
    onOpenMedia,
    refreshKey,
}: Props) {
    const [media, setMedia] =
        useState<SkillMedia[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

    useEffect(() => {
        loadMedia();
    }, [
        skill.userSkillId,
        refreshKey,
    ]);
    async function loadMedia() {
        try {
            setLoading(true);

            const rows =
                await fetchSkillMedia(
                    skill.userSkillId
                );

            setMedia(rows);

            /*
             * Keep the in-memory UserSkill
             * synchronized too.
             *
             * updateSkill currently writes only
             * permitted skill columns to Supabase,
             * so media won't be written into
             * user_skills.
             */
        } catch (error) {
            console.error(
                'Failed to load skill media:',
                error
            );

            Alert.alert(
                'Could not load media',
                'Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    async function addMedia() {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Permission required',
                'Skill+ needs access to your photo library.'
            );

            return;
        }

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: [
                    'images',
                    'videos',
                ],

                allowsMultipleSelection:
                    true,

                quality: 1,
            });

        if (result.canceled) {
            return;
        }

        try {
            setUploading(true);

            const uploaded: SkillMedia[] =
                [];

            for (
                const asset of
                result.assets
            ) {
                const type:
                    | 'image'
                    | 'video' =
                    asset.type === 'video'
                        ? 'video'
                        : 'image';

                const item =
                    await uploadSkillMedia(
                        skill.userSkillId,
                        asset.uri,
                        type
                    );

                uploaded.push(item);
            }

            const nextMedia = [
                ...media,
                ...uploaded,
            ];

            setMedia(nextMedia);

        } catch (error) {
            console.error(
                'Failed to upload skill media:',
                error
            );

            Alert.alert(
                'Upload failed',
                error instanceof Error
                    ? error.message
                    : 'Please try again.'
            );
        } finally {
            setUploading(false);
        }
    }

    return (
        <View style={styles.wrap}>
            <View>
                <AppText style={styles.title}>
                    Your Journey
                </AppText>

                <AppText muted>
                    Document how you learned{' '}
                    {skill.name}.
                </AppText>
            </View>

            <Button
                title={
                    uploading
                        ? 'Uploading...'
                        : '+ Add Photos / Videos'
                }
                disabled={uploading}
                onPress={addMedia}
            />

            {loading ? (
                <View
                    style={
                        styles.loading
                    }
                >
                    <ActivityIndicator />

                    <AppText muted>
                        Loading journey...
                    </AppText>
                </View>
            ) : media.length === 0 ? (
                <Card>
                    <AppText muted>
                        Add photos or videos
                        showing your progress
                        and final result.
                    </AppText>
                </Card>
            ) : (
                <View style={styles.grid}>
                    {media.map(
                        (item) => (
                            <MediaThumbnail
                                key={item.id}
                                media={item}
                                colors={colors}
                                onPress={() =>
                                    onOpenMedia(
                                        item
                                    )
                                }
                            />
                        )
                    )}
                </View>
            )}
        </View>
    );
}

const styles =
    StyleSheet.create({
        wrap: {
            gap: 16,
        },

        title: {
            fontSize: 25,
            fontWeight: '900',
        },

        loading: {
            alignItems: 'center',
            justifyContent:
                'center',
            gap: 10,
            paddingVertical: 28,
        },

        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
    });