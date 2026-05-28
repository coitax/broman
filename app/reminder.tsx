import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useReminder } from '@/reminder/useReminder';
import type { ReminderTime } from '@/reminder/types';
import { Button, Choice, Subtitle, Title } from '@/design/components';
import { colors, fontSize, spacing } from '@/design/tokens';

const PRESETS: ReminderTime[] = [
  { hour: 6, minute: 0 },
  { hour: 6, minute: 30 },
  { hour: 7, minute: 0 },
  { hour: 7, minute: 30 },
];

function label(t: ReminderTime): string {
  return `${t.hour}:${t.minute.toString().padStart(2, '0')}`;
}

function sameTime(a: ReminderTime | null, b: ReminderTime): boolean {
  return !!a && a.hour === b.hour && a.minute === b.minute;
}

export default function ReminderScreen() {
  const router = useRouter();
  const { state, save } = useReminder();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState<ReminderTime>(PRESETS[2]);

  useEffect(() => {
    setEnabled(state.enabled);
    if (state.time) setTime(state.time);
  }, [state]);

  async function onSave() {
    await save({ enabled, time });
    router.back();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Title>Wake gently</Title>
        <Subtitle>
          We’ll nudge you when it’s time for your morning ritual.
          {Platform.OS === 'web' ? ' On the web this shows an in-app reminder.' : ''}
        </Subtitle>

        <View style={styles.row}>
          <Choice label="On" selected={enabled} onPress={() => setEnabled(true)} />
          <Choice label="Off" selected={!enabled} onPress={() => setEnabled(false)} />
        </View>

        <Text style={styles.heading}>Wake-up time</Text>
        <View style={styles.row}>
          {PRESETS.map((t) => (
            <Choice
              key={label(t)}
              label={label(t)}
              selected={sameTime(time, t)}
              onPress={() => setTime(t)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Save reminder" onPress={onSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'space-between' },
  body: { gap: spacing.md, marginTop: spacing.xl },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  heading: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.md },
  footer: { marginBottom: spacing.xl },
});
