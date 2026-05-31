import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/design/tokens';

// Native placeholder. The web build ships the full WebGL pose studio; the native
// 3D viewer (react-three-fiber via expo-gl) is wired in the native build pass, so
// three.js never enters the native bundle here.
export function PoseViewer({ sequenceId }: { sequenceId: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>3D movement preview</Text>
      <Text style={styles.body}>
        The interactive 3D figure is available on the web app today and is coming to
        the mobile app in a native build.
      </Text>
      <Text style={styles.meta}>Sequence: {sequenceId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  meta: { color: colors.accent, fontSize: fontSize.sm },
});
