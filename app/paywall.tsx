import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { track } from '@/analytics';
import { useEntitlement } from '@/billing/useEntitlement';
import { Button, Subtitle, Title } from '@/design/components';
import { colors, fontSize, radius, spacing } from '@/design/tokens';

const BENEFITS = [
  'Every journey in the library',
  'Build-your-own morning & full customization',
  'All ambient soundscapes',
  'Offline downloads',
];

export default function Paywall() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { isPremium, upgrade, restore } = useEntitlement();

  useEffect(() => {
    const source = Array.isArray(params.source) ? params.source[0] : params.source;
    track({ name: 'paywall_viewed', source: source ?? 'unknown' });
  }, [params.source]);

  async function unlock() {
    await upgrade();
    router.back();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Title>Go Premium</Title>
        <Subtitle>Unlock the full morning practice — cancel anytime.</Subtitle>

        <View style={styles.card}>
          {BENEFITS.map((b) => (
            <Text key={b} style={styles.benefit}>
              ✓ {b}
            </Text>
          ))}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>$8.99</Text>
          <Text style={styles.priceUnit}>/ month · 7-day free trial</Text>
        </View>

        {isPremium && <Text style={styles.active}>You’re Premium — thank you!</Text>}
      </View>

      <View style={styles.footer}>
        <Button label={isPremium ? 'Premium active' : 'Start free trial'} onPress={unlock} />
        <Button label="Restore purchase" variant="ghost" onPress={() => void restore()} />
        <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'space-between' },
  body: { gap: spacing.md, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  benefit: { color: colors.text, fontSize: fontSize.md },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  price: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  priceUnit: { color: colors.textMuted, fontSize: fontSize.sm },
  active: { color: colors.success, fontSize: fontSize.md, fontWeight: '700' },
  footer: { gap: spacing.sm, marginBottom: spacing.xl },
});
