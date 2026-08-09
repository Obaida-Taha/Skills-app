import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/UI';
import { CustomSkillModal } from '@/components/skills/CustomSkillModal';
import { MediaViewer } from '@/components/skills/MediaViewer';
import { SkillDetails } from '@/components/skills/SkillDetails';
import { SkillJourney } from '@/components/skills/SkillJourney';
import { SkillsList } from '@/components/skills/SkillsList';
import { palette, useApp } from '@/contexts/AppContext';
import { SkillMedia, SkillStatus, UserSkill } from '@/types';

type SkillsLevel = 'list' | 'details' | 'journey';

export default function Skills() {
  const {
    skills,
    addCustomSkill,
    updateSkill,
    removeSkill,
    theme,
  } = useApp();

  const colors = palette(theme === 'dark');

  const [level, setLevel] = useState<SkillsLevel>('list');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SkillMedia | null>(null);
  const [filter, setFilter] = useState<'all' | SkillStatus>('all');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const selectedSkill = useMemo(
    () =>
      skills.find(
        (skill) => skill.userSkillId === selectedSkillId
      ) ?? null,
    [skills, selectedSkillId]
  );

  const shownSkills = useMemo(
    () =>
      skills.filter(
        (skill) =>
          filter === 'all' || skill.status === filter
      ),
    [skills, filter]
  );

  function openSkill(skill: UserSkill) {
    setSelectedSkillId(skill.userSkillId);
    setLevel('details');
  }

  function goToList() {
    setSelectedSkillId(null);
    setSelectedMedia(null);
    setLevel('list');
  }

  function goBack() {
    if (level === 'journey') {
      setLevel('details');
    } else {
      goToList();
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.title}>My Skills</AppText>
            <AppText muted>Track your learning journey.</AppText>
          </View>

          {level === 'list' && (
            <Button
              title="+ Add"
              onPress={() => setCustomModalOpen(true)}
            />
          )}
        </View>

        {level !== 'list' && (
          <Pressable onPress={goBack}>
            <AppText
              style={[styles.back, { color: colors.primary }]}
            >
              ‹ Back
            </AppText>
          </Pressable>
        )}

        <View style={styles.breadcrumb}>
          <Pressable onPress={goToList}>
            <AppText style={{ color: colors.primary, fontWeight: '800' }}>
              My Skills
            </AppText>
          </Pressable>

          {selectedSkill && (
            <>
              <AppText muted>›</AppText>

              <Pressable onPress={() => setLevel('details')}>
                <AppText style={{ color: colors.primary, fontWeight: '800' }}>
                  {selectedSkill.name}
                </AppText>
              </Pressable>
            </>
          )}

          {level === 'journey' && (
            <>
              <AppText muted>›</AppText>
              <AppText style={{ fontWeight: '900' }}>Journey</AppText>
            </>
          )}
        </View>

        {level === 'list' && (
          <SkillsList
            skills={shownSkills}
            filter={filter}
            setFilter={setFilter}
            onOpenSkill={openSkill}
            colors={colors}
          />
        )}

        {level === 'details' && selectedSkill && (
          <SkillDetails
            skill={selectedSkill}
            colors={colors}
            updateSkill={updateSkill}
            removeSkill={removeSkill}
            onOpenJourney={() => setLevel('journey')}
            onRemoved={goToList}
          />
        )}

        {level === 'journey' && selectedSkill && (
          <SkillJourney
            skill={selectedSkill}
            updateSkill={updateSkill}
            colors={colors}
            onOpenMedia={setSelectedMedia}
          />
        )}
      </ScrollView>

      <CustomSkillModal
        visible={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onAdd={addCustomSkill}
      />

      <MediaViewer
        media={selectedMedia}
        colors={colors}
        onClose={() => setSelectedMedia(null)}
        onDelete={() => {
          if (!selectedSkill || !selectedMedia) return;

          updateSkill(selectedSkill.userSkillId, {
            media: selectedSkill.media.filter(
              (item) => item.id !== selectedMedia.id
            ),
          });

          setSelectedMedia(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 22,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 15,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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