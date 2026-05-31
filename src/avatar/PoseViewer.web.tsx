import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Choice } from '@/design/components';
import { colors, fontSize, radius, spacing } from '@/design/tokens';
import { advancePlayhead, findSequence, interpolateSequence } from './poses';
import { Figure } from './Figure';

const SEQUENCE_SECONDS = 12;
const SCRUB_STOPS = [0, 0.25, 0.5, 0.75, 1];

// Web 3D pose studio: orbit/zoom the figure (drei OrbitControls), scrub the
// timeline, and toggle slow-motion. Drives the procedural Figure from the pure
// pose math. preserveDrawingBuffer is on so headless verification can read pixels.
export function PoseViewer({ sequenceId }: { sequenceId: string }) {
  const seq = findSequence(sequenceId) ?? findSequence('yoga-sun')!;
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  const pose = useMemo(() => interpolateSequence(seq, playhead), [seq, playhead]);

  // RAF playhead loop (lives outside the Canvas so the scrub UI stays in sync).
  const raf = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) {
      lastTs.current = null;
      return;
    }
    const tick = (ts: number) => {
      const last = lastTs.current ?? ts;
      const dt = (ts - last) / 1000;
      lastTs.current = ts;
      setPlayhead((q) => advancePlayhead(q, dt, SEQUENCE_SECONDS, speed, true));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      lastTs.current = null;
    };
  }, [playing, speed]);

  // Debug hook for verification (dev only).
  useEffect(() => {
    (globalThis as Record<string, unknown>).__MORNING_3D__ = {
      ready: true,
      sequenceId: seq.id,
      playhead,
      playing,
      speed,
    };
  }, [seq.id, playhead, playing, speed]);

  return (
    <View style={styles.root}>
      <View style={styles.canvasWrap}>
        <Canvas
          style={{ flex: 1 }}
          camera={{ position: [0, 0, 3.2], fov: 45 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          onCreated={() => {
            (globalThis as Record<string, unknown>).__MORNING_3D__ = { ready: true, sequenceId: seq.id };
          }}
        >
          <color attach="background" args={[colors.bg]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 4, 3]} intensity={1.1} />
          <Figure pose={pose} />
          <OrbitControls enablePan={false} minDistance={1.8} maxDistance={6} target={[0, 0, 0]} />
        </Canvas>
        <Text style={styles.hint}>Drag to rotate · scroll to zoom</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(playhead * 100)}%` }]} />
        </View>

        <View style={styles.row}>
          {SCRUB_STOPS.map((stop) => (
            <Choice
              key={stop}
              label={`${Math.round(stop * 100)}%`}
              selected={Math.abs(playhead - stop) < 0.06}
              onPress={() => {
                setPlaying(false);
                setPlayhead(stop);
              }}
            />
          ))}
        </View>

        <View style={styles.row}>
          <Button label={playing ? 'Pause' : 'Play'} onPress={() => setPlaying((p) => !p)} />
          <Choice label="Slow-mo" selected={speed < 1} onPress={() => setSpeed((s) => (s < 1 ? 1 : 0.35))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  canvasWrap: { flex: 1, position: 'relative' },
  hint: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  controls: { padding: spacing.lg, gap: spacing.md },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
});
