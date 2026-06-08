import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { track } from '@/analytics';
import { PoseViewer, sequences } from '@/avatar';
import { useEntitlement } from '@/billing/useEntitlement';
import { Choice } from '@/design/components';
import { colors, spacing } from '@/design/tokens';

// Premium-gated 3D movement studio. Locked users are redirected to the paywall.
export default function PoseStudio() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sequence?: string }>();
  const { isPremium, loading } = useEntitlement();

  const initial = (Array.isArray(params.sequence) ? params.sequence[0] : params.sequence) ?? sequences[0].id;
  const [sequenceId, setSequenceId] = useState(initial);

  useEffect(() => {
    if (!loading && !isPremium) router.replace('/paywall?source=pose');
  }, [loading, isPremium, router]);

  useEffect(() => {
    if (isPremium) track({ name: 'pose_studio_opened', sequenceId });
  }, [isPremium, sequenceId]);

  if (loading || !isPremium) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <View style={styles.switcher}>
        {sequences.map((s) => (
          <Choice
            key={s.id}
            label={s.title}
            selected={s.id === sequenceId}
            onPress={() => setSequenceId(s.id)}
          />
        ))}
      </View>
      <PoseViewer sequenceId={sequenceId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg },
});
