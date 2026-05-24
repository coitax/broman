import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Screen, Subtitle, Title } from '@/design/components';
import { colors, fontSize, spacing } from '@/design/tokens';

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
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
          label="Quick start · 10 min"
          variant="ghost"
          onPress={() => router.push('/journey?minutes=10&intensity=balanced')}
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
