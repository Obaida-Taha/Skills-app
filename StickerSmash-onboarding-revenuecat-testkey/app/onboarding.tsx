import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Button, Screen } from '@/components/UI';
import { palette, useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { FREE_MEDIA_PER_SKILL, FREE_SKILL_LIMIT } from '@/features/premium/config';
import { completeOnboarding } from '@/lib/onboarding';

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: 'flash-outline' as const,
    title: 'Turn practice into progress',
    body: 'Choose skills you want to learn, track repetitions and practice time, and watch your XP grow.',
  },
  {
    icon: 'images-outline' as const,
    title: 'Document your journey',
    body: 'When you finish a skill, keep photos and videos of the process and the result so you can look back on how far you came.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Start free. Go further with Premium.',
    body: `The free plan lets you learn up to ${FREE_SKILL_LIMIT} skills and add up to ${FREE_MEDIA_PER_SKILL} journey photos/videos per skill. Premium removes those limits.`,
  },
];

export default function Onboarding() {
  const { theme } = useApp();
  const { user } = useAuth();
  const colors = palette(theme === 'dark');

  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [finishing, setFinishing] = useState(false);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  }

  async function finish() {
    if (finishing) return;

    try {
      setFinishing(true);
      await completeOnboarding();
      router.replace(user ? '/(tabs)/home' : '/(auth)/login');
    } finally {
      setFinishing(false);
    }
  }

  function next() {
    if (page === pages.length - 1) {
      void finish();
      return;
    }

    scrollRef.current?.scrollTo({
      x: width * (page + 1),
      animated: true,
    });
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <AppText style={styles.brand}>Skill+</AppText>
        <Pressable onPress={() => void finish()} disabled={finishing}>
          <AppText style={{ color: colors.primary, fontWeight: '800' }}>Skip</AppText>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {pages.map((item) => (
          <View key={item.title} style={[styles.page, { width }]}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: `${colors.primary}18`,
                  borderColor: `${colors.primary}55`,
                },
              ]}
            >
              <Ionicons name={item.icon} size={62} color={colors.primary} />
            </View>

            <AppText style={styles.title}>{item.title}</AppText>
            <AppText muted style={styles.body}>{item.body}</AppText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: page === index ? 24 : 8,
                  backgroundColor: page === index ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={
            finishing
              ? 'Please wait…'
              : page === pages.length - 1
              ? 'Get started'
              : 'Continue'
          }
          disabled={finishing}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 58,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
  },
  page: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  iconWrap: {
    width: 138,
    height: 138,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
});
