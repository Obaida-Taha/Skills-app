import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { deleteSkillMedia } from '@/lib/skill-media';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FREE_SKILL_LIMIT } from '@/features/premium/config';

import {
  AppText,
  Button,
  Screen,
} from '@/components/UI';

import { CustomSkillModal } from '@/components/skills/CustomSkillModal';
import { MediaViewer } from '@/components/skills/MediaViewer';
import { SkillDetails } from '@/components/skills/SkillDetails';
import { SkillJourney } from '@/components/skills/SkillJourney';
import { SkillsList } from '@/components/skills/SkillsList';

import {
  palette,
  useApp,
} from '@/contexts/AppContext';

import {
  SkillMedia,
  SkillStatus,
  UserSkill,
} from '@/types';

type SkillsLevel =
  | 'list'
  | 'details'
  | 'journey';

export default function Skills() {
  const {
    skills,
    addCustomSkill,
    updateSkill,
    removeSkill,
    theme,
  } = useApp();

  const { isPremium, presentPaywall } = useSubscription();

  const colors = palette(
    theme === 'dark'
  );

  const [level, setLevel] =
    useState<SkillsLevel>('list');

  const [
    selectedSkillId,
    setSelectedSkillId,
  ] = useState<string | null>(null);

  const [
    selectedMedia,
    setSelectedMedia,
  ] = useState<SkillMedia | null>(
    null
  );

  const [filter, setFilter] =
    useState<'all' | SkillStatus>(
      'all'
    );

  const [
    customModalOpen,
    setCustomModalOpen,
  ] = useState(false);

  /*
   * When this number changes,
   * SkillJourney reloads its media
   * from Supabase.
   */
  const [
    mediaRefreshKey,
    setMediaRefreshKey,
  ] = useState(0);

  const selectedSkill =
    useMemo(() => {
      return (
        skills.find(
          (skill) =>
            skill.userSkillId ===
            selectedSkillId
        ) ?? null
      );
    }, [
      skills,
      selectedSkillId,
    ]);

  const shownSkills =
    useMemo(() => {
      return skills.filter(
        (skill) =>
          filter === 'all' ||
          skill.status === filter
      );
    }, [
      skills,
      filter,
    ]);

  function openSkill(
    skill: UserSkill
  ) {
    setSelectedSkillId(
      skill.userSkillId
    );

    setSelectedMedia(null);

    setLevel('details');
  }

  function goToList() {
    setSelectedSkillId(null);

    setSelectedMedia(null);

    setLevel('list');
  }

  function goBack() {
    if (level === 'journey') {
      setSelectedMedia(null);

      setLevel('details');

      return;
    }

    goToList();
  }

  async function handleOpenCustomSkill() {
    if (!isPremium && skills.length >= FREE_SKILL_LIMIT) {
      const unlocked = await presentPaywall();
      if (!unlocked) return;
    }

    setCustomModalOpen(true);
  }

  async function handleAddCustomSkill(name: string, category: string) {
    // AppContext performs the final entitlement check as a safeguard.
    await addCustomSkill(name, category);
  }

  async function handleDeleteMedia() {
    if (!selectedMedia) {
      return;
    }

    Alert.alert(
      'Delete media',
      'Remove this photo or video from your journey?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {
              const mediaId =
                selectedMedia.id;

              /*
               * Deletes:
               *
               * 1. file from Supabase Storage
               * 2. metadata row from skill_media
               */
              await deleteSkillMedia(
                mediaId
              );

              /*
               * Close viewer.
               */
              setSelectedMedia(null);

              /*
               * Tell Journey to fetch
               * its media again.
               */
              setMediaRefreshKey(
                (current) =>
                  current + 1
              );
            } catch (error) {
              console.error(
                'Failed to delete media:',
                error
              );

              Alert.alert(
                'Could not delete media',
                error instanceof Error
                  ? error.message
                  : 'Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={
          styles.wrap
        }
      >
        <View
          style={styles.header}
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <AppText
              style={styles.title}
            >
              My Skills
            </AppText>

            <AppText muted>
              Track your learning
              journey.
            </AppText>
          </View>

          {level === 'list' && (
            <Button
              title={
                !isPremium && skills.length >= FREE_SKILL_LIMIT
                  ? 'Add · Premium'
                  : '+ Add'
              }
              onPress={() => void handleOpenCustomSkill()}
            />
          )}
        </View>

        {level !== 'list' && (
          <Pressable
            onPress={goBack}
          >
            <AppText
              style={[
                styles.back,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              ‹ Back
            </AppText>
          </Pressable>
        )}

        <View
          style={
            styles.breadcrumb
          }
        >
          <Pressable
            onPress={goToList}
          >
            <AppText
              style={{
                color:
                  colors.primary,
                fontWeight: '800',
              }}
            >
              My Skills
            </AppText>
          </Pressable>

          {selectedSkill && (
            <>
              <AppText muted>
                ›
              </AppText>

              <Pressable
                onPress={() =>
                  setLevel(
                    'details'
                  )
                }
              >
                <AppText
                  style={{
                    color:
                      colors.primary,
                    fontWeight:
                      '800',
                  }}
                >
                  {
                    selectedSkill.name
                  }
                </AppText>
              </Pressable>
            </>
          )}

          {level ===
            'journey' && (
            <>
              <AppText muted>
                ›
              </AppText>

              <AppText
                style={{
                  fontWeight:
                    '900',
                }}
              >
                Journey
              </AppText>
            </>
          )}
        </View>

        {level === 'list' && (
          <SkillsList
            skills={
              shownSkills
            }
            filter={filter}
            setFilter={
              setFilter
            }
            onOpenSkill={
              openSkill
            }
            colors={colors}
          />
        )}

        {level ===
          'details' &&
          selectedSkill && (
            <SkillDetails
              skill={
                selectedSkill
              }
              colors={colors}
              updateSkill={
                updateSkill
              }
              removeSkill={
                removeSkill
              }
              onOpenJourney={() => {
                setSelectedMedia(
                  null
                );

                setLevel(
                  'journey'
                );
              }}
              onRemoved={
                goToList
              }
            />
          )}

        {level ===
          'journey' &&
          selectedSkill && (
            <SkillJourney
              skill={
                selectedSkill
              }
              colors={colors}
              onOpenMedia={
                setSelectedMedia
              }
              refreshKey={
                mediaRefreshKey
              }
            />
          )}
      </ScrollView>

      <CustomSkillModal
        visible={
          customModalOpen
        }
        onClose={() =>
          setCustomModalOpen(
            false
          )
        }
        onAdd={
          handleAddCustomSkill
        }
      />

      <MediaViewer
        media={
          selectedMedia
        }
        colors={colors}
        onClose={() =>
          setSelectedMedia(
            null
          )
        }
        onDelete={
          handleDeleteMedia
        }
      />
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    wrap: {
      padding: 22,
      paddingTop: 60,
      paddingBottom: 40,
      gap: 15,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 12,
    },

    title: {
      fontSize: 29,
      fontWeight: '900',
    },

    back: {
      fontSize: 16,
      fontWeight: '900',
    },

    breadcrumb: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
  });