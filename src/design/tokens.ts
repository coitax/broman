// Calm, low-stimulation palette suited to a pre-dawn wake-up experience.
export const colors = {
  bg: '#0E1530',
  bgRaised: '#172041',
  surface: '#1F2A52',
  primary: '#8FB7FF',
  accent: '#F4C9A6',
  text: '#EAF0FF',
  textMuted: '#A6B0D4',
  success: '#7FD1A6',
  border: '#2B3868',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const fontSize = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  display: 40,
} as const;

// Maps segment type -> short human label + accent, used by the player UI.
export const segmentMeta: Record<string, { label: string; tint: string }> = {
  breath: { label: 'Breathe', tint: colors.primary },
  meditation: { label: 'Meditate', tint: colors.primary },
  affirmation: { label: 'Affirm', tint: colors.accent },
  movement: { label: 'Move', tint: colors.success },
  transition: { label: 'Close', tint: colors.textMuted },
};
