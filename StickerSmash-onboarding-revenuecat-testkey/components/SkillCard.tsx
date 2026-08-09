import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  AppText,
  Button,
  Card,
} from './UI';

import {
  palette,
  useApp,
} from '@/contexts/AppContext';

import {
  SkillStatus,
  UserSkill,
} from '@/types';

export function SkillCard({
  skill,
}: {
  skill: UserSkill;
}) {
  const {
    updateSkill,
    removeSkill,
    theme,
  } = useApp();

  const c = palette(
    theme === 'dark'
  );

  const [running, setRunning] =
    useState(false);

  /*
   * This is only local UI state.
   *
   * It DOES NOT write to Supabase
   * every second.
   */
  const [
    localSeconds,
    setLocalSeconds,
  ] = useState(skill.seconds);

  const [
    localXp,
    setLocalXp,
  ] = useState(skill.xp);

  /*
   * Timestamp for when the current
   * practice session started.
   */
  const startedAt =
    useRef<number | null>(null);

  /*
   * Saved values from when Start
   * was pressed.
   */
  const startingSeconds =
    useRef(skill.seconds);

  const startingXp =
    useRef(skill.xp);

  /*
   * Keep local values synchronized
   * with Supabase/app state while
   * timer is not running.
   */
  useEffect(() => {
    if (running) {
      return;
    }

    setLocalSeconds(
      skill.seconds
    );

    setLocalXp(
      skill.xp
    );
  }, [
    skill.seconds,
    skill.xp,
    running,
  ]);

  /*
   * Local display timer.
   *
   * This only updates React state.
   * No Supabase call happens here.
   */
  useEffect(() => {
    if (!running) {
      return;
    }

    const interval =
      setInterval(() => {
        if (
          startedAt.current === null
        ) {
          return;
        }

        const elapsed =
          Math.floor(
            (
              Date.now() -
              startedAt.current
            ) / 1000
          );

        setLocalSeconds(
          startingSeconds.current +
            elapsed
        );

        /*
         * Preserves your existing rule:
         * 1 XP for every second practiced.
         */
        setLocalXp(
          startingXp.current +
            elapsed
        );
      }, 1000);

    return () =>
      clearInterval(interval);
  }, [running]);

  function startTimer() {
    startingSeconds.current =
      skill.seconds;

    startingXp.current =
      skill.xp;

    startedAt.current =
      Date.now();

    setLocalSeconds(
      skill.seconds
    );

    setLocalXp(
      skill.xp
    );

    setRunning(true);
  }

  async function stopTimer() {
    if (
      startedAt.current === null
    ) {
      setRunning(false);
      return;
    }

    /*
     * Calculate from the actual clock
     * instead of trusting setInterval.
     *
     * This means backgrounding the app
     * doesn't break the elapsed time.
     */
    const elapsed =
      Math.floor(
        (
          Date.now() -
          startedAt.current
        ) / 1000
      );

    const finalSeconds =
      startingSeconds.current +
      elapsed;

    const finalXp =
      startingXp.current +
      elapsed;

    setRunning(false);

    setLocalSeconds(
      finalSeconds
    );

    setLocalXp(
      finalXp
    );

    startedAt.current =
      null;

    /*
     * ONE Supabase update when Stop
     * is pressed.
     */
    try {
      await updateSkill(
        skill.userSkillId,
        {
          seconds:
            finalSeconds,
          xp: finalXp,
        }
      );
    } catch (error) {
      console.error(
        'Failed to save timer:',
        error
      );

      Alert.alert(
        'Could not save practice time',
        'Please try again.'
      );
    }
  }

  async function setStatus(
    status: SkillStatus
  ) {
    /*
     * If the user pauses/finishes while
     * the timer is running, save the
     * timer first.
     */
    if (running) {
      await stopTimer();
    }

    try {
      await updateSkill(
        skill.userSkillId,
        {
          status,
        }
      );
    } catch (error) {
      console.error(
        'Failed to change skill status:',
        error
      );
    }
  }

  const hours =
    Math.floor(
      localSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        localSeconds %
        3600
      ) / 60
    );

  const seconds =
    localSeconds % 60;

  const time =
    `${hours}h ` +
    `${minutes}m ` +
    `${seconds}s`;

  return (
    <Card>
      <View style={s.row}>
        <View>
          <AppText
            style={s.name}
          >
            {skill.name}
          </AppText>

          <AppText muted>
            {skill.category} ·{' '}
            {skill.difficulty}
          </AppText>
        </View>

        <AppText
          style={{
            color: c.primary,
            fontWeight: '900',
          }}
        >
          {localXp} XP
        </AppText>
      </View>

      <View style={s.status}>
        {(
          [
            'in_progress',
            'paused',
            'finished',
          ] as SkillStatus[]
        ).map((status) => {
          const active =
            skill.status ===
            status;

          return (
            <Pressable
              key={status}
              onPress={() =>
                setStatus(status)
              }
              style={[
                s.pill,
                {
                  backgroundColor:
                    active
                      ? c.primary
                      : c.bg,
                },
              ]}
            >
              <AppText
                style={{
                  fontSize: 12,
                  color: active
                    ? '#FFFFFF'
                    : c.text,
                }}
              >
                {status.replace(
                  '_',
                  ' '
                )}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={s.row}>
        <View>
          <AppText muted>
            REPS COMPLETED
          </AppText>

          <View style={s.counter}>
            <Button
              secondary
              title="−"
              onPress={() =>
                updateSkill(
                  skill.userSkillId,
                  {
                    repetitions:
                      Math.max(
                        0,
                        skill.repetitions -
                          1
                      ),
                  }
                )
              }
            />

            <AppText
              style={s.value}
            >
              {
                skill.repetitions
              }
            </AppText>

            <Button
              secondary
              title="+"
              onPress={() =>
                updateSkill(
                  skill.userSkillId,
                  {
                    repetitions:
                      skill.repetitions +
                      1,

                    xp:
                      skill.xp +
                      10,
                  }
                )
              }
            />
          </View>
        </View>

        <View
          style={{
            alignItems:
              'flex-end',
          }}
        >
          <AppText muted>
            TIME PRACTICED
          </AppText>

          <AppText
            style={s.value}
          >
            {time}
          </AppText>
        </View>
      </View>

      <Button
        title={
          running
            ? 'Stop timer'
            : 'Start timer'
        }
        onPress={
          running
            ? stopTimer
            : startTimer
        }
      />

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
                style:
                  'destructive',
                onPress:
                  async () => {
                    await removeSkill(
                      skill.userSkillId
                    );
                  },
              },
            ]
          )
        }
      >
        <AppText
          style={{
            color: c.danger,
            textAlign: 'center',
            fontWeight: '700',
          }}
        >
          Remove skill
        </AppText>
      </Pressable>
    </Card>
  );
}

const s =
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 12,
    },

    name: {
      fontSize: 18,
      fontWeight: '900',
    },

    status: {
      flexDirection: 'row',
      gap: 7,
    },

    pill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },

    counter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 7,
    },

    value: {
      fontSize: 18,
      fontWeight: '900',
    },
  });