import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initAnalytics, track } from '@/analytics';
import { usePreferences } from '@/data/usePreferences';
import { Button, Screen, Subtitle, Title } from '@/design/components';
import { colors, fontSize, spacing } from '@/design/tokens';

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

  useEffect(() => {
    initAnalytics();
    track({ name: 'app_opened' });
  }, []);

  const minutes = preferences?.totalMinutes ?? 10;
  const intensity = preferences?.intensity ?? 'balanced';
  const style = preferences?.movementStyle ?? 'either';
  const quickLabel = preferences
    ? `Continue · ${minutes} min ${STYLE_LABEL[style] ?? ''}`.trim()
    : 'Quick start · 10 min';

  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Title>Let’s ease into the day.</Title>
        <Subtitle>
          A short, gentle journey — settle the mind, acknowledge how you feel, then
          move your body. You choose how long.
        </Subtitle>
      </View>
      <View style={styles.actions}>
        <Button label="Set up your morning" onPress={() => router.push('/onboarding')} />
        <Button
          label={quickLabel}
          variant="ghost"
          onPress={() => router.push(`/journey?minutes=${minutes}&intensity=${intensity}&style=${style}`)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'space-between' },
  hero: { gap: spacing.sm, marginTop: spacing.xxl },
  greeting: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '600' },
  actions: { gap: spacing.md, marginBottom: spacing.xl },
});
