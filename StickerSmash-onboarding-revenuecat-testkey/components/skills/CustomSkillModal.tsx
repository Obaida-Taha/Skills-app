import { useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Input } from '@/components/UI';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string) => Promise<void>;
};

export function CustomSkillModal({
  visible,
  onClose,
  onAdd,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      await onAdd(
        name.trim(),
        category.trim() || 'Custom'
      );

      setName('');
      setCategory('Custom');
      onClose();
    } catch (error) {
      console.warn('Could not add custom skill:', error);
      Alert.alert('Could not add skill', 'Please try again.');
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
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <AppText style={styles.title}>
            Add a custom skill
          </AppText>

          <Input
            placeholder="Skill name"
            value={name}
            onChangeText={setName}
          />

          <Input
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />

          <Button
            title={saving ? 'Adding…' : 'Add skill'}
            disabled={saving}
            onPress={() => void submit()}
          />

          <Button
            secondary
            title="Cancel"
            disabled={saving}
            onPress={onClose}
          />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#0008',
    padding: 18,
    paddingBottom: 35,
  },

  card: {
    gap: 12,
  },

  title: {
    fontSize: 19,
    fontWeight: '900',
  },
});
