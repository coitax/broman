import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { track } from '@/analytics';
import { getRepository } from '@/data/repository';
import { Button, Choice, Subtitle, Title } from '@/design/components';
import { colors, fontSize, radius, spacing } from '@/design/tokens';

// Phase 0: the mood is held locally and not yet persisted. Phase 1 writes this to
// Supabase (mood_checkins) and uses history to personalize future journeys.
const MOODS = ['Calm', 'Tired', 'Anxious', 'Hopeful', 'Heavy', 'Energized'] as const;

const ENCOURAGEMENT =
  'Whatever you’re feeling is allowed. You showed up for yourself today — that counts.';

export default function CheckIn() {
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);

  async function done() {
    if (mood) {
      await getRepository().saveCheckin({ mood, phase: 'post' });
      track({ name: 'checkin_saved', mood, phase: 'post' });
    }
    router.replace('/');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Title>How are you arriving?</Title>
        <Subtitle>Name it gently — there’s no wrong answer.</Subtitle>
        <View style={styles.grid}>
          {MOODS.map((m) => (
            <Choice key={m} label={m} selected={mood === m} onPress={() => setMood(m)} />
          ))}
        </View>

        {mood && (
          <View style={styles.card}>
            <Text style={styles.cardText}>{ENCOURAGEMENT}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button label="Done" onPress={done} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'space-between' },
  body: { gap: spacing.md, marginTop: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  cardText: { color: colors.text, fontSize: fontSize.md, lineHeight: 24 },
  footer: { marginBottom: spacing.xl },
});
