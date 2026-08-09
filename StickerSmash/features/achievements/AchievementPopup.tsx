import { Modal, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

import { AppText, Button, Card } from '@/components/UI';
import { Achievement } from './types';

type Props = {
  achievement: Achievement | null;
  onClose: () => void;
};

export function AchievementPopup({
  achievement,
  onClose,
}: Props) {
  if (!achievement) {
    return null;
  }

  return (
    <Modal transparent animationType="fade">
      <View style={styles.backdrop}>
        <ConfettiCannon
          count={120}
          origin={{ x: 0, y: 0 }}
          fadeOut
          autoStart
        />

        <Card style={styles.card}>
          <AppText style={styles.icon}>
            {achievement.icon}
          </AppText>

          <AppText style={styles.small}>
            ACHIEVEMENT UNLOCKED
          </AppText>

          <AppText style={styles.title}>
            {achievement.title}
          </AppText>

          <AppText muted>
            {achievement.description}
          </AppText>

          <Button
            title="Nice!"
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
    backgroundColor: '#0009',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 28,
  },

  icon: {
    fontSize: 52,
  },

  small: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
  },
});