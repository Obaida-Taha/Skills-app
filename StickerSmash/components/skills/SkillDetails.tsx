import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { SkillStatus, UserSkill } from '@/types';

type Props = {
  skill: UserSkill;
  colors: ReturnType<typeof palette>;
  updateSkill: (id: string, patch: Partial<UserSkill>) => void;
  removeSkill: (id: string) => void;
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

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      updateSkill(skill.userSkillId, {
        seconds: skill.seconds + 1,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, skill.seconds, skill.userSkillId, updateSkill]);

  const time = `${Math.floor(skill.seconds / 3600)}h ${Math.floor(
    (skill.seconds % 3600) / 60
  )}m ${skill.seconds % 60}s`;

  function changeStatus(status: SkillStatus) {
    setRunning(false);
    updateSkill(skill.userSkillId, { status });
  }

  return (
    <View style={styles.wrap}>
      <View>
        <AppText style={styles.title}>{skill.name}</AppText>
        <AppText muted>
          {skill.category} › {skill.subCategory}
        </AppText>
      </View>

      <View style={styles.statuses}>
        {(['in_progress', 'paused', 'finished'] as SkillStatus[]).map(
          (status) => {
            const active = skill.status === status;

            return (
              <Pressable
                key={status}
                onPress={() => changeStatus(status)}
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
                    color: active ? '#fff' : colors.text,
                    fontWeight: '800',
                  }}
                >
                  {status.replace('_', ' ')}
                </AppText>
              </Pressable>
            );
          }
        )}
      </View>

      <Card style={styles.stats}>
        <View>
          <AppText muted>REPS</AppText>
          <AppText style={styles.value}>{skill.repetitions}</AppText>
        </View>

        <View>
          <AppText muted>TIME</AppText>
          <AppText style={styles.value}>{time}</AppText>
        </View>

        <View>
          <AppText muted>XP</AppText>
          <AppText style={[styles.value, { color: colors.primary }]}>
            {skill.xp}
          </AppText>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <AppText style={styles.heading}>Repetitions</AppText>

        <View style={styles.counter}>
          <Button
            secondary
            title="−"
            onPress={() =>
              updateSkill(skill.userSkillId, {
                repetitions: Math.max(0, skill.repetitions - 1),
              })
            }
          />

          <AppText style={styles.counterValue}>
            {skill.repetitions}
          </AppText>

          <Button
            secondary
            title="+"
            onPress={() =>
              updateSkill(skill.userSkillId, {
                repetitions: skill.repetitions + 1,
                xp: skill.xp + 10,
              })
            }
          />
        </View>

        <Button
          title={running ? 'Stop timer' : 'Start timer'}
          onPress={() => setRunning(!running)}
        />
      </Card>

      {skill.status === 'finished' && (
        <Pressable onPress={onOpenJourney}>
          <Card style={styles.journey}>
            <View style={{ flex: 1 }}>
              <AppText style={styles.heading}>Your Journey</AppText>
              <AppText muted>
                Photos and videos documenting your progress and result.
              </AppText>

              <AppText
                style={{
                  color: colors.primary,
                  fontWeight: '900',
                  marginTop: 8,
                }}
              >
                {skill.media?.length ?? 0} media items
              </AppText>
            </View>

            <AppText style={styles.chevron}>›</AppText>
          </Card>
        </Pressable>
      )}

      <Pressable
        onPress={() =>
          Alert.alert('Remove skill', `Remove ${skill.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                removeSkill(skill.userSkillId);
                onRemoved();
              },
            },
          ])
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

  chevron: {
    fontSize: 28,
    opacity: 0.5,
  },
});