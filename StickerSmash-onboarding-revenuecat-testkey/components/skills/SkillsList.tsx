import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/UI';
import { palette } from '@/contexts/AppContext';
import { SkillStatus, UserSkill } from '@/types';

type Props = {
  skills: UserSkill[];
  filter: 'all' | SkillStatus;
  setFilter: (value: 'all' | SkillStatus) => void;
  onOpenSkill: (skill: UserSkill) => void;
  colors: ReturnType<typeof palette>;
};

export function SkillsList({
  skills,
  filter,
  setFilter,
  onOpenSkill,
  colors,
}: Props) {
  const filters = [
    'all',
    'in_progress',
    'paused',
    'finished',
  ] as const;

  return (
    <>
      <View style={styles.filters}>
        {filters.map((value) => {
          const active = filter === value;

          return (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filter,
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
                  fontSize: 12,
                }}
              >
                {value.replace('_', ' ')}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {skills.map((skill) => (
        <Pressable
          key={skill.userSkillId}
          onPress={() => onOpenSkill(skill)}
        >
          <Card style={styles.card}>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText style={styles.name}>{skill.name}</AppText>

              <AppText muted>
                {skill.category} · {skill.repetitions} reps · {skill.xp} XP
              </AppText>

              {skill.status === 'finished' && (
                <AppText style={{ color: colors.primary, fontWeight: '800' }}>
                  Finished
                </AppText>
              )}
            </View>

            <AppText style={styles.chevron}>›</AppText>
          </Card>
        </Pressable>
      ))}

      {skills.length === 0 && (
        <Card>
          <AppText muted>No skills here yet.</AppText>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  filter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  name: {
    fontSize: 17,
    fontWeight: '900',
  },

  chevron: {
    fontSize: 28,
    opacity: 0.5,
  },
});