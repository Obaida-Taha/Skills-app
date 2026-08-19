import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { router } from 'expo-router';

import {
  AppText,
  Button,
  Card,
  Input,
  Screen,
} from '@/components/UI';

import { AchievementsCard } from '@/components/achievements/AchievementsCard';

import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FREE_MEDIA_PER_SKILL, FREE_SKILL_LIMIT } from '@/features/premium/config';

import {
  getMyProfile,
  updateMyProfile,
} from '@/lib/profile';

import { UserProfile } from '@/types';

import {
  showSkillPlusPaywall,
} from '@/lib/revenuecat';

export default function Settings() {
  const {
    theme,
    setTheme,
    skills,
  } = useApp();

  const {
    user,
    signOut,
  } = useAuth();

    const {
      isPremium,
      loading: premiumLoading,
      configured: premiumConfigured,
      restorePurchases,
    } = useSubscription();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [editOpen, setEditOpen] =
    useState(false);

  const xp = skills.reduce(
    (total, skill) => total + skill.xp,
    0
  );

  const activeSkills =
    skills.filter(
      (skill) =>
        skill.status === 'in_progress'
    ).length;

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    'Learner';

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      setEditOpen(false);
      return;
    }

    loadProfile();
  }, [user]);

  async function loadProfile() {
    try {
      setLoadingProfile(true);

      const data =
        await getMyProfile();

      setProfile(data);
    } catch (error) {
      console.warn(
        'PROFILE LOAD ERROR:',
        error
      );
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.wrap}
      >
        <AppText style={styles.title}>
          Settings
        </AppText>

        <Pressable
          onPress={() => {
            if (!user) {
              router.replace('/(auth)/login');
              return;
            }
            setEditOpen(true);
          }}
        >
          <Card style={styles.profile}>
            <View style={styles.avatar}>
              <AppText
                style={styles.avatarText}
              >
                {displayName[0]?.toUpperCase()}
              </AppText>
            </View>

            <View style={{ flex: 1 }}>
              <AppText
                style={styles.heading}
              >
                {loadingProfile
                  ? 'Loading...'
                  : displayName}
              </AppText>

              {profile?.username ? (
                <AppText muted>
                  @{profile.username}
                </AppText>
              ) : null}

              <AppText muted>
                {user?.email ||
                  'Not signed in'}
              </AppText>

              <AppText
                style={styles.profileLink}
              >
                Your profile
              </AppText>
            </View>

            <AppText
              style={styles.chevron}
            >
              ›
            </AppText>
          </Card>
        </Pressable>

        <Card style={styles.stats}>
          <Stat
            n={`${Math.floor(
              xp / 1000
            ) + 1}`}
            label="Level"
          />

          <Stat
            n={`${activeSkills}`}
            label="Active"
          />

          <Stat
            n={`${skills.length}`}
            label="Skills"
          />
        </Card>

        <Card>
          <AppText style={styles.heading}>
            Bio
          </AppText>

          <AppText muted>
            {profile?.bio ||
              'Learning something new every day.'}
          </AppText>
        </Card>

        <Card>
          <AppText style={styles.heading}>
            Personal goal
          </AppText>

          <AppText muted>
            Practice consistently and
            master meaningful skills.
          </AppText>
        </Card>

        <Card style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontWeight: '900',
              }}
            >
              Dark mode
            </AppText>

            <AppText muted>
              Apply across the whole app
            </AppText>
          </View>

          <Switch
            value={
              theme === 'dark'
            }
            onValueChange={(value) =>
              setTheme(
                value
                  ? 'dark'
                  : 'light'
              )
            }
          />
        </Card>

        <AchievementsCard />

        <Card style={styles.premiumCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText style={styles.heading}>
              {isPremium ? 'Skill+ Premium' : 'Free plan'}
            </AppText>

            <AppText muted>
              {isPremium
                ? 'Unlimited learning skills and unlimited journey media.'
                : `Up to ${FREE_SKILL_LIMIT} learning skills and ${FREE_MEDIA_PER_SKILL} journey photos/videos per skill.`}
            </AppText>

            {!premiumConfigured && (
              <AppText muted style={{ marginTop: 6, fontSize: 12 }}>
                RevenueCat is not configured in this build yet.
              </AppText>
            )}
          </View>

          <View style={styles.planBadge}>
            <AppText style={{ color: '#FF6A00', fontWeight: '900' }}>
              {isPremium ? 'PREMIUM' : 'FREE'}
            </AppText>
          </View>
        </Card>

          {!isPremium && (
            <Button
              title={
                premiumLoading
                  ? 'Loading Premium…'
                  : 'Upgrade to Skill+ Pro'
              }
              disabled={premiumLoading}
              onPress={async () => {
                const purchased =
                  await showSkillPlusPaywall();

                if (purchased) {
                  Alert.alert(
                    'Skill+ Pro',
                    'Skill+ Pro has been unlocked.'
                  );
                }
              }}
            />
          )}

        <Button
          secondary
          title="Restore purchases"
          disabled={premiumLoading}
          onPress={() => void restorePurchases()}
        />

        <Button
          secondary
          title="Help & Contact"
          onPress={() =>
            Alert.alert(
              'Contact',
              'Email support@skillplus.app'
            )
          }
        />

        <Button
          danger
          title="Log out"
          onPress={async () => {
            await signOut();

            router.replace(
              '/(auth)/login'
            );
          }}
        />
      </ScrollView>

      <EditProfileModal
        visible={editOpen && !!user}
        profile={profile}
        onClose={() =>
          setEditOpen(false)
        }
        onSaved={(updated) => {
          setProfile(updated);
          setEditOpen(false);
        }}
      />
    </Screen>
  );
}

function EditProfileModal({
  visible,
  profile,
  onClose,
  onSaved,
}: {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSaved: (
    profile: UserProfile
  ) => void;
}) {
  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    bio,
    setBio,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDisplayName(
      profile?.display_name ?? ''
    );

    setUsername(
      profile?.username ?? ''
    );

    setBio(
      profile?.bio ?? ''
    );
  }, [
    visible,
    profile,
  ]);

  async function save() {
    try {
      setSaving(true);

      const updated =
        await updateMyProfile({
          display_name:
            displayName.trim() ||
            null,

          username:
            username.trim() ||
            null,

          bio:
            bio.trim() ||
            null,
        });

      onSaved(updated);
    } catch (error) {
      console.error(
        'PROFILE UPDATE ERROR:',
        error
      );

      Alert.alert(
        'Could not save profile',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={styles.modalBackdrop}
      >
        <Card
          style={styles.modalCard}
        >
          <AppText
            style={styles.modalTitle}
          >
            Edit Profile
          </AppText>

          <Input
            placeholder="Display name"
            value={displayName}
            onChangeText={
              setDisplayName
            }
          />

          <Input
            placeholder="Username"
            value={username}
            onChangeText={
              setUsername
            }
          />

          <Input
            placeholder="Bio"
            value={bio}
            onChangeText={
              setBio
            }
          />

          <Button
            title={
              saving
                ? 'Saving...'
                : 'Save Profile'
            }
            disabled={saving}
            onPress={save}
          />

          <Button
            secondary
            title="Cancel"
            onPress={onClose}
          />
        </Card>
      </View>
    </Modal>
  );
}

function Stat({
  n,
  label,
}: {
  n: string;
  label: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
      }}
    >
      <AppText
        style={{
          fontSize: 22,
          fontWeight: '900',
        }}
      >
        {n}
      </AppText>

      <AppText muted>
        {label}
      </AppText>
    </View>
  );
}

const styles =
  StyleSheet.create({
    wrap: {
      padding: 22,
      paddingTop: 60,
      paddingBottom: 36,
      gap: 14,
    },

    title: {
      fontSize: 29,
      fontWeight: '900',
    },

    heading: {
      fontSize: 18,
      fontWeight: '900',
    },

    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor:
        '#FF6A00',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    avatarText: {
      color: '#FFFFFF',
      fontSize: 23,
      fontWeight: '900',
    },

    profileLink: {
      marginTop: 6,
      fontWeight: '800',
    },

    chevron: {
      fontSize: 26,
      opacity: 0.5,
    },

    stats: {
      flexDirection: 'row',
      justifyContent:
        'space-around',
      paddingVertical: 12,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 12,
    },

    premiumCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    planBadge: {
      borderWidth: 1,
      borderColor: '#FF6A00',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        'flex-end',
      backgroundColor:
        '#0008',
      padding: 18,
      paddingBottom: 35,
    },

    modalCard: {
      gap: 12,
    },

    modalTitle: {
      fontSize: 22,
      fontWeight: '900',
    },
  });
