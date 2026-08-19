import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useState } from 'react';

import {
  AppText,
  Card,
} from '@/components/UI';

import {
  palette,
  useApp,
} from '@/contexts/AppContext';

import { ACHIEVEMENTS } from '@/features/achievements/achievements';

export function AchievementsCard() {
  const {
    unlockedAchievementIds,
    theme,
  } = useApp();

  const colors = palette(
    theme === 'dark'
  );

  const [expanded, setExpanded] =
    useState(false);

  const unlockedCount =
    unlockedAchievementIds.length;

  const totalCount =
    ACHIEVEMENTS.length;

  const progress =
    totalCount === 0
      ? 0
      : unlockedCount / totalCount;

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() =>
          setExpanded(
            (current) => !current
          )
        }
        style={styles.header}
      >
        <View style={{ flex: 1 }}>
          <AppText
            style={styles.heading}
          >
            Achievements
          </AppText>

          <AppText muted>
            {unlockedCount} of{' '}
            {totalCount} unlocked
          </AppText>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.countBadge,
              {
                borderColor:
                  colors.primary,
              },
            ]}
          >
            <AppText
              style={{
                color:
                  colors.primary,
                fontWeight: '900',
              }}
            >
              {unlockedCount}/
              {totalCount}
            </AppText>
          </View>

          <AppText
            style={[
              styles.arrow,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {expanded ? '▲' : '▼'}
          </AppText>
        </View>
      </Pressable>

      {expanded && (
        <>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    colors.primary,

                  width: `${
                    progress * 100
                  }%`,
                },
              ]}
            />
          </View>

          <View style={styles.list}>
            {ACHIEVEMENTS.map(
              (achievement) => {
                const unlocked =
                  unlockedAchievementIds.includes(
                    achievement.id
                  );

                return (
                  <View
                    key={
                      achievement.id
                    }
                    style={[
                      styles.achievement,
                      {
                        backgroundColor:
                          unlocked
                            ? `${colors.primary}12`
                            : colors.bg,

                        borderColor:
                          unlocked
                            ? colors.primary
                            : colors.border,

                        opacity:
                          unlocked
                            ? 1
                            : 0.55,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor:
                            unlocked
                              ? `${colors.primary}20`
                              : colors.card,
                        },
                      ]}
                    >
                      <AppText
                        style={
                          styles.icon
                        }
                      >
                        {
                          achievement.icon
                        }
                      </AppText>
                    </View>

                    <View
                      style={
                        styles.info
                      }
                    >
                      <AppText
                        style={
                          styles.title
                        }
                      >
                        {
                          achievement.title
                        }
                      </AppText>

                      <AppText
                        muted
                        style={
                          styles.description
                        }
                      >
                        {
                          achievement.description
                        }
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.status,
                        {
                          borderColor:
                            unlocked
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        style={{
                          fontSize: 10,
                          fontWeight:
                            '900',

                          color:
                            unlocked
                              ? colors.primary
                              : colors.muted,
                        }}
                      >
                        {unlocked
                          ? 'UNLOCKED'
                          : 'LOCKED'}
                      </AppText>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        </>
      )}
    </Card>
  );
}

const styles =
  StyleSheet.create({
    card: {
      gap: 14,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 12,
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    heading: {
      fontSize: 18,
      fontWeight: '900',
    },

    countBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    arrow: {
      fontSize: 14,
      fontWeight: '900',
    },

    progressTrack: {
      height: 8,
      borderRadius: 999,
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      borderRadius: 999,
    },

    list: {
      gap: 10,
    },

    achievement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,

      borderWidth: 1,
      borderRadius: 14,

      padding: 12,
    },

    iconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    icon: {
      fontSize: 23,
    },

    info: {
      flex: 1,
      gap: 3,
    },

    title: {
      fontSize: 15,
      fontWeight: '900',
    },

    description: {
      fontSize: 12,
      lineHeight: 17,
    },

    status: {
      borderWidth: 1,
      borderRadius: 999,

      paddingHorizontal: 7,
      paddingVertical: 4,
    },
  });