import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Input } from '@/components/UI';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string) => void;
};

export function CustomSkillModal({
  visible,
  onClose,
  onAdd,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');

  function submit() {
    if (!name.trim()) return;

    onAdd(
      name.trim(),
      category.trim() || 'Custom'
    );

    setName('');
    setCategory('Custom');
    onClose();
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

          <Button title="Add skill" onPress={submit} />

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