package com.wakewell.app.alarm

// Shared names used across the alarm pieces (scheduler, receiver, service,
// screen). Keeping them in one place avoids typos in string keys.
object AlarmConstants {
    // Notification channel for ringing alarms (created in WakeWellApp).
    const val CHANNEL_ID = "wakewell_alarms"

    // Broadcast/service actions.
    const val ACTION_ALARM_FIRED = "com.wakewell.app.ACTION_ALARM_FIRED"
    const val ACTION_START = "com.wakewell.app.ACTION_START"
    const val ACTION_SNOOZE = "com.wakewell.app.ACTION_SNOOZE"
    const val ACTION_DISMISS = "com.wakewell.app.ACTION_DISMISS"

    // Intent extras.
    const val EXTRA_ALARM_ID = "extra_alarm_id"
    const val EXTRA_ALARM_LABEL = "extra_alarm_label"
    const val EXTRA_ALARM_HOUR = "extra_alarm_hour"
    const val EXTRA_ALARM_MINUTE = "extra_alarm_minute"
    const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"

    // The single foreground-service notification id for a ringing alarm.
    const val RINGING_NOTIFICATION_ID = 1001
}
