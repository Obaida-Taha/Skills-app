import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Button, Card } from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { SkillStatus, UserSkill } from '@/types';

type Props = {
  skill: UserSkill;
  colors: ReturnType<typeof palette>;
  updateSkill: (
    id: string,
    patch: Partial<UserSkill>
  ) => Promise<void>;
  removeSkill: (id: string) => Promise<void>;
  onOpenJourney: () => void;
  onRemoved: () => void;
};

export function SkillDetails({
  skill,
  colors,
  updateSkill,
  removeSkill,
  onOpenJourney,
  onRemoved,
}: Props) {
  const [running, setRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(
    skill.seconds
  );

  const startedAtRef = useRef<number | null>(null);
  const baseSecondsRef = useRef(skill.seconds);
  const latestSecondsRef = useRef(skill.seconds);
  const updateSkillRef = useRef(updateSkill);

  updateSkillRef.current = updateSkill;
  latestSecondsRef.current = displaySeconds;

  useEffect(() => {
    if (!running) {
      setDisplaySeconds(skill.seconds);
      baseSecondsRef.current = skill.seconds;
    }
  }, [skill.seconds, running]);

  useEffect(() => {
    if (!running) return;

    startedAtRef.current = Date.now();
    baseSecondsRef.current = skill.seconds;

    const timer = setInterval(() => {
      const startedAt = startedAtRef.current;

      if (!startedAt) return;

      const elapsed = Math.floor(
        (Date.now() - startedAt) / 1000
      );

      setDisplaySeconds(
        baseSecondsRef.current + elapsed
      );
    }, 250);

    return () => clearInterval(timer);
  }, [running, skill.seconds]);

  useEffect(() => {
    return () => {
      if (startedAtRef.current !== null) {
        void updateSkillRef
          .current(skill.userSkillId, {
            seconds: latestSecondsRef.current,
          })
          .catch((error) =>
            console.warn(
              'Failed to save timer:',
              error
            )
          );
      }
    };
  }, [skill.userSkillId]);

  async function stopTimer() {
    if (!running) {
      return displaySeconds;
    }

    setRunning(false);
    startedAtRef.current = null;

    await updateSkill(skill.userSkillId, {
      seconds: displaySeconds,
    });

    return displaySeconds;
  }

  async function changeStatus(
    status: SkillStatus
  ) {
    try {
      const seconds = running
        ? await stopTimer()
        : displaySeconds;

      await updateSkill(skill.userSkillId, {
        status,
        seconds,
      });
    } catch {
      Alert.alert(
        'Could not update skill',
        'Please try again.'
      );
    }
  }

  async function openTutorial() {
    if (!skill.tutorialUrl) return;

    try {
      const supported = await Linking.canOpenURL(
        skill.tutorialUrl
      );

      if (!supported) {
        Alert.alert(
          'Could not open tutorial',
          'This tutorial link could not be opened.'
        );

        return;
      }

      await Linking.openURL(skill.tutorialUrl);
    } catch (error) {
      console.warn(
        'Failed to open tutorial:',
        error
      );

      Alert.alert(
        'Could not open tutorial',
        'Please try again.'
      );
    }
  }

  const time =
    `${Math.floor(displaySeconds / 3600)}h ` +
    `${Math.floor(
      (displaySeconds % 3600) / 60
    )}m ` +
    `${displaySeconds % 60}s`;

  return (
    <View style={styles.wrap}>
      <View>
        <AppText style={styles.title}>
          {skill.name}
        </AppText>

        <AppText muted>
          {skill.category} › {skill.subCategory}
        </AppText>
      </View>

      <Card style={styles.aboutCard}>
        <AppText style={styles.heading}>
          About this skill
        </AppText>

        <AppText muted>
          {skill.description}
        </AppText>

        {skill.tutorialUrl && (
          <View style={styles.tutorialSection}>
            <View>
              <AppText style={styles.tutorialLabel}>
                LEARN
              </AppText>

              <AppText
                style={styles.tutorialTitle}
              >
                {skill.tutorialTitle ??
                  'YouTube Tutorial'}
              </AppText>
            </View>

            <Pressable
              onPress={() => void openTutorial()}
              style={({ pressed }) => [
                styles.tutorialButton,
                {
                  backgroundColor:
                    colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <AppText
                style={styles.tutorialButtonText}
              >
                ▶ Watch YouTube Tutorial
              </AppText>
            </Pressable>
          </View>
        )}
      </Card>

      <View style={styles.statuses}>
        {(
          [
            'in_progress',
            'paused',
            'finished',
          ] as SkillStatus[]
        ).map((status) => {
          const active =
            skill.status === status;

          return (
            <Pressable
              key={status}
              onPress={() =>
                void changeStatus(status)
              }
              style={[
                styles.status,
                {
                  backgroundColor: active
                    ? colors.primary
                    : colors.card,

                  borderColor: active
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              <AppText
                style={{
                  color: active
                    ? '#fff'
                    : colors.text,

                  fontWeight: '800',
                }}
              >
                {status.replace('_', ' ')}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.stats}>
        <View>
          <AppText muted>REPS</AppText>

          <AppText style={styles.value}>
            {skill.repetitions}
          </AppText>
        </View>

        <View>
          <AppText muted>TIME</AppText>

          <AppText style={styles.value}>
            {time}
          </AppText>
        </View>

        <View>
          <AppText muted>XP</AppText>

          <AppText
            style={[
              styles.value,
              {
                color: colors.primary,
              },
            ]}
          >
            {skill.xp}
          </AppText>
        </View>
      </Card>

      <Card style={styles.repetitionCard}>
        <AppText style={styles.heading}>
          Repetitions
        </AppText>

        <View style={styles.counter}>
          <Button
            secondary
            title="−"
            onPress={() =>
              void updateSkill(
                skill.userSkillId,
                {
                  repetitions: Math.max(
                    0,
                    skill.repetitions - 1
                  ),
                }
              )
            }
          />

          <AppText style={styles.counterValue}>
            {skill.repetitions}
          </AppText>

          <Button
            secondary
            title="+"
            onPress={() =>
              void updateSkill(
                skill.userSkillId,
                {
                  repetitions:
                    skill.repetitions + 1,

                  xp:
                    skill.xp + 10,
                }
              )
            }
          />
        </View>

        <Button
          title={
            running
              ? 'Stop timer'
              : 'Start timer'
          }
          onPress={() => {
            if (running) {
              void stopTimer().catch(() =>
                Alert.alert(
                  'Could not save timer',
                  'Please try again.'
                )
              );
            } else {
              setRunning(true);
            }
          }}
        />
      </Card>

      {skill.status === 'finished' && (
        <Pressable onPress={onOpenJourney}>
          <Card style={styles.journey}>
            <View style={styles.journeyContent}>
              <AppText style={styles.heading}>
                Your Journey
              </AppText>

              <AppText muted>
                Photos and videos documenting
                your progress and result.
              </AppText>

              <AppText
                style={[
                  styles.openJourneyText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Open journey
              </AppText>
            </View>

            <AppText style={styles.chevron}>
              ›
            </AppText>
          </Card>
        </Pressable>
      )}

      <Pressable
        onPress={() =>
          Alert.alert(
            'Remove skill',
            `Remove ${skill.name}?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  try {
                    if (running) {
                      await stopTimer();
                    }

                    await removeSkill(
                      skill.userSkillId
                    );

                    onRemoved();
                  } catch {
                    Alert.alert(
                      'Could not remove skill',
                      'Please try again.'
                    );
                  }
                },
              },
            ]
          )
        }
      >
        <AppText
          style={{
            color: colors.danger,
            textAlign: 'center',
            fontWeight: '800',
          }}
        >
          Remove skill
        </AppText>
      </Pressable>
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

  heading: {
    fontSize: 19,
    fontWeight: '900',
  },

  aboutCard: {
    gap: 12,
  },

  tutorialSection: {
    gap: 10,
    marginTop: 4,
  },

  tutorialLabel: {
    fontSize: 11,
    fontWeight: '900',
    opacity: 0.6,
    letterSpacing: 1,
  },

  tutorialTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  tutorialButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tutorialButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },

  statuses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  status: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  value: {
    fontSize: 17,
    fontWeight: '900',
  },

  repetitionCard: {
    gap: 12,
  },

  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  counterValue: {
    fontSize: 24,
    fontWeight: '900',
    minWidth: 60,
    textAlign: 'center',
  },

  journey: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  journeyContent: {
    flex: 1,
  },

  openJourneyText: {
    fontWeight: '900',
    marginTop: 8,
  },

  chevron: {
    fontSize: 28,
    opacity: 0.5,
  },
});