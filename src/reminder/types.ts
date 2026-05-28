export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface ReminderState {
  enabled: boolean;
  time: ReminderTime | null;
}

// One interface, two implementations: native schedules a real daily local
// notification (expo-notifications); web persists the preference and surfaces an
// in-app prompt instead, since browsers can't wake a sleeping device.
export interface ReminderScheduler {
  init(): Promise<void>;
  requestPermission(): Promise<boolean>;
  get(): Promise<ReminderState>;
  set(state: ReminderState): Promise<void>;
}
