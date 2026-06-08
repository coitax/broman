import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { track } from '@/analytics';
import { isLocked } from '@/billing';
import { useEntitlement } from '@/billing/useEntitlement';
import { catalog } from '@/content/manifests/catalog';
import type { JourneyTemplate } from '@/content/types';
import { usePreferences } from '@/data/usePreferences';
import { Subtitle, Title } from '@/design/components';
import { colors, fontSize, radius, spacing } from '@/design/tokens';

export default function Library() {
  const router = useRouter();
  const { tier } = useEntitlement();
  const { preferences } = usePreferences();

  useEffect(() => {
    track({ name: 'library_opened' });
  }, []);

  const minutes = preferences?.totalMinutes ?? 10;
  const intensity = preferences?.intensity ?? 'balanced';

  function open(journey: JourneyTemplate) {
    if (isLocked(journey, tier)) {
      router.push(`/paywall?source=library`);
      return;
    }
    router.push(`/journey?id=${journey.id}&minutes=${minutes}&intensity=${intensity}`);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Title>Journeys</Title>
      <Subtitle>Pick a path for this morning. Premium unlocks the full library.</Subtitle>
      {catalog.map((journey) => {
        const locked = isLocked(journey, tier);
        return (
          <Pressable key={journey.id} style={styles.card} onPress={() => open(journey)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{journey.title}</Text>
              {locked && <Text style={styles.lock}>🔒 Premium</Text>}
            </View>
            <Text style={styles.cardDesc}>{journey.description}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  lock: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '700' },
  cardDesc: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22 },
});
