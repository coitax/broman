package com.wakewell.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.DayOfWeek

// One saved alarm. Repeat days are stored as a set of day numbers (Monday = 1 …
// Sunday = 7); an empty set means the alarm is a one-time alarm.
@Entity(tableName = "alarms")
data class Alarm(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,

    val hour: Int,            // 0–23
    val minute: Int,          // 0–59
    val label: String = "Alarm",
    val isEnabled: Boolean = true,

    // Stored via a TypeConverter (see Converters). Empty = fires once.
    val repeatDays: Set<Int> = emptySet(),

    // null = the system default alarm sound; otherwise a ringtone URI string.
    val soundUri: String? = null,
    val vibrate: Boolean = true,

    // Minutes added when the user taps Snooze.
    val snoozeMinutes: Int = 9,

    // Phase 3 (accelerometer "smart" wake). Off by default for now.
    val smartAlarmOn: Boolean = false,
) {
    // Convenience: turn repeat-day numbers into java.time DayOfWeek values.
    val repeatDaysOfWeek: Set<DayOfWeek>
        get() = repeatDays.mapNotNull { runCatching { DayOfWeek.of(it) }.getOrNull() }.toSet()

    val repeats: Boolean get() = repeatDays.isNotEmpty()
}
