import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Intensity, MovementStyle } from '@/content/types';
import { Button, Choice, Subtitle, Title } from '@/design/components';
import { colors, spacing } from '@/design/tokens';

const MINUTES = [5, 10, 15, 20] as const;
const INTENSITIES: Intensity[] = ['gentle', 'balanced', 'energizing'];
const STYLES: MovementStyle[] = ['yoga', 'taichi', 'either'];

const STYLE_LABEL: Record<MovementStyle, string> = {
  yoga: 'Yoga',
  taichi: 'Tai Chi',
  either: 'Either',
};

export default function Onboarding() {
  const router = useRouter();
  const [minutes, setMinutes] = useState<number>(10);
  const [intensity, setIntensity] = useState<Intensity>('balanced');
  const [style, setStyle] = useState<MovementStyle>('yoga');

  function begin() {
    router.push(
      `/journey?minutes=${minutes}&intensity=${intensity}&style=${style}`,
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Title>How much time this morning?</Title>
      <View style={styles.row}>
        {MINUTES.map((m) => (
          <Choice
            key={m}
            label={`${m} min`}
            selected={minutes === m}
            onPress={() => setMinutes(m)}
          />
        ))}
      </View>

      <Title>How do you want to move?</Title>
      <View style={styles.row}>
        {INTENSITIES.map((i) => (
          <Choice
            key={i}
            label={i[0].toUpperCase() + i.slice(1)}
            selected={intensity === i}
            onPress={() => setIntensity(i)}
          />
        ))}
      </View>

      <Title>Preferred practice</Title>
      <Subtitle>We’ll lean into this style — you can change it anytime.</Subtitle>
      <View style={styles.row}>
        {STYLES.map((s) => (
          <Choice
            key={s}
            label={STYLE_LABEL[s]}
            selected={style === s}
            onPress={() => setStyle(s)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button label="Begin your journey" onPress={begin} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
