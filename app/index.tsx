import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { initAnalytics, track } from '@/analytics';
import { storage } from '@/data/storage';
import { usePreferences } from '@/data/usePreferences';
import { reminderScheduler, shouldShowMorningPrompt } from '@/reminder';
import { Button, Screen, Subtitle, Title } from '@/design/components';
import { colors, fontSize, radius, spacing } from '@/design/tokens';

const LAST_SHOWN_KEY = 'morning.reminder.lastShown';

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const STYLE_LABEL: Record<string, string> = { yoga: 'Yoga', taichi: 'Tai Chi', either: 'flow' };

export default function Home() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    initAnalytics();
    track({ name: 'app_opened' });
  }, []);

  useEffect(() => {
    (async () => {
      const state = await reminderScheduler.get();
      const last = await storage.getItem(LAST_SHOWN_KEY);
      if (shouldShowMorningPrompt(state, new Date(), last)) {
        setShowPrompt(true);
        await storage.setItem(LAST_SHOWN_KEY, new Date().toISOString());
      }
    })();
  }, []);

  const minutes = preferences?.totalMinutes ?? 10;
  const intensity = preferences?.intensity ?? 'balanced';
  const style = preferences?.movementStyle ?? 'either';
  const quickLabel = preferences
    ? `Continue · ${minutes} min ${STYLE_LABEL[style] ?? ''}`.trim()
    : 'Quick start · 10 min';
  const quickStart = () => router.push(`/journey?minutes=${minutes}&intensity=${intensity}&style=${style}`);

  return (
    <Screen style={styles.container}>
      <View style={styles.top}>
        {showPrompt && (
          <Pressable style={styles.banner} onPress={quickStart}>
            <Text style={styles.bannerTitle}>It’s time for your morning ritual</Text>
            <Text style={styles.bannerHint}>Tap to begin · {minutes} min</Text>
          </Pressable>
        )}
        <View style={styles.hero}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Title>Let’s ease into the day.</Title>
          <Subtitle>
            A short, gentle journey — settle the mind, acknowledge how you feel, then
            move your body. You choose how long.
          </Subtitle>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Set up your morning" onPress={() => router.push('/onboarding')} />
        <Button label={quickLabel} variant="ghost" onPress={quickStart} />
        <Button label="Explore journeys" variant="ghost" onPress={() => router.push('/library')} />
        <Button label="Wake-up reminder" variant="ghost" onPress={() => router.push('/reminder')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'space-between' },
  top: { gap: spacing.lg, marginTop: spacing.xl },
  banner: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  bannerTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  bannerHint: { color: colors.accent, fontSize: fontSize.sm },
  hero: { gap: spacing.sm },
  greeting: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '600' },
  actions: { gap: spacing.sm, marginBottom: spacing.xl },
});
