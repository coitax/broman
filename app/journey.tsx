import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { track } from '@/analytics';
import { findJourney } from '@/content/manifests/catalog';
import { sunriseFlow } from '@/content/manifests/sunriseFlow';
import type { Intensity } from '@/content/types';
import { getRepository } from '@/data/repository';
import { getAudioEngine } from '@/engine/audioEngine';
import { buildJourney } from '@/engine/JourneyEngine';
import {
  currentSegment,
  initialPlayerState,
  journeyProgress,
  playerReducer,
  type PlayerEvent,
  type PlayerState,
} from '@/engine/player';
import { Button } from '@/design/components';
import { colors, fontSize, radius, segmentMeta, spacing } from '@/design/tokens';

function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function parseIntensity(value: string | string[] | undefined): Intensity {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'gentle' || v === 'energizing' ? v : 'balanced';
}

export default function JourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; minutes?: string; intensity?: string }>();

  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? sunriseFlow.id;
  const minutes = Number(params.minutes) || 10;
  const intensity = parseIntensity(params.intensity);

  const template = findJourney(id) ?? sunriseFlow;
  const journey = useMemo(
    () => buildJourney(template, { totalMinutes: minutes, intensity }),
    [template, minutes, intensity],
  );

  const [state, setState] = useState<PlayerState>(initialPlayerState);
  const dispatch = useCallback(
    (event: PlayerEvent) => setState((s) => playerReducer(journey, s, event)),
    [journey],
  );

  // Auto-start on mount.
  useEffect(() => {
    dispatch({ type: 'START' });
    track({ name: 'journey_started', journeyId: journey.id, minutes, intensity });
  }, [dispatch, journey.id, minutes, intensity]);

  // 1Hz timer while playing.
  useEffect(() => {
    if (state.status !== 'playing') return;
    const id = setInterval(() => dispatch({ type: 'TICK', deltaSec: 1 }), 1000);
    return () => clearInterval(id);
  }, [state.status, dispatch]);

  // Drive the audio engine when the active segment changes.
  const lastIndex = useRef<number>(-1);
  useEffect(() => {
    if (state.index === lastIndex.current) return;
    lastIndex.current = state.index;
    const seg = currentSegment(journey, state);
    if (!seg) return;
    const audio = getAudioEngine();
    void audio.playAmbient(seg.ambientTrack);
    void audio.playCue('cue/segment');
    if (seg.voiceTrack) {
      void audio.duckAmbient(0.4);
      void audio.playVoice(seg.voiceTrack);
    }
  }, [state, journey]);

  // Navigate to the post-session check-in when finished.
  useEffect(() => {
    if (state.status !== 'completed') return;
    void getAudioEngine().unloadAll();
    void getRepository().recordCompletion({ journeyId: journey.id, totalSec: journey.totalSec });
    track({ name: 'journey_completed', journeyId: journey.id, totalSec: journey.totalSec });
    router.replace('/checkin');
  }, [state.status, router, journey.id, journey.totalSec]);

  const seg = currentSegment(journey, state);
  const meta = seg ? segmentMeta[seg.type] : undefined;
  const segElapsed = state.elapsedInSegmentSec;
  const segRemaining = seg ? seg.durationSec - segElapsed : 0;
  const progress = journeyProgress(journey, state);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.stage}>
          Step {Math.min(state.index + 1, journey.segments.length)} of{' '}
          {journey.segments.length}
        </Text>
        <Button label="End" variant="ghost" onPress={() => dispatch({ type: 'RESET' })} />
      </View>

      <View style={styles.center}>
        {meta && <Text style={[styles.kicker, { color: meta.tint }]}>{meta.label}</Text>}
        <Text style={styles.segmentTitle}>{seg?.title ?? 'Preparing…'}</Text>
        <Text style={styles.timer}>{formatTime(segRemaining)}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.controls}>
          {state.status === 'paused' ? (
            <Button label="Resume" onPress={() => dispatch({ type: 'RESUME' })} />
          ) : (
            <Button label="Pause" variant="ghost" onPress={() => dispatch({ type: 'PAUSE' })} />
          )}
          <Button label="Skip" variant="ghost" onPress={() => dispatch({ type: 'NEXT' })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl },
  stage: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  kicker: { fontSize: fontSize.md, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  segmentTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  timer: { color: colors.textMuted, fontSize: fontSize.display, fontWeight: '300', marginTop: spacing.md },
  footer: { gap: spacing.lg, marginBottom: spacing.xl },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary },
  controls: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
});
