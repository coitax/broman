package com.wakewell.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.wakewell.app.MainActivity
import com.wakewell.app.data.Alarm
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

// Talks to Android's AlarmManager to arm/cancel alarms at exact times.
// We use setAlarmClock(), which is the most reliable scheduling method: it
// survives Doze and battery saver and shows the system "alarm set" indicator.
class AlarmScheduler(private val context: Context) {

    private val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    // Arm an alarm for its next occurrence.
    fun schedule(alarm: Alarm) {
        if (!alarm.isEnabled) return
        val triggerAt = nextTriggerMillis(alarm)
        scheduleAt(alarm.id, triggerAt)
    }

    // Re-arm the same alarm a few minutes later (Snooze).
    fun scheduleSnooze(alarmId: Long, minutes: Int) {
        val triggerAt = System.currentTimeMillis() + minutes * 60_000L
        scheduleAt(alarmId, triggerAt)
    }

    private fun scheduleAt(alarmId: Long, triggerAtMillis: Long) {
        val info = AlarmManager.AlarmClockInfo(triggerAtMillis, showIntent())
        try {
            alarmManager.setAlarmClock(info, firePendingIntent(alarmId))
        } catch (e: SecurityException) {
            // Exact-alarm permission missing: fall back to an inexact alarm that
            // still fires during Doze, just not to-the-minute precise.
            Log.w(TAG, "Exact alarm not permitted, using inexact fallback", e)
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                firePendingIntent(alarmId),
            )
        }
    }

    // Cancel a scheduled alarm (e.g. when toggled off or deleted).
    fun cancel(alarmId: Long) {
        alarmManager.cancel(firePendingIntent(alarmId))
    }

    // The broadcast that fires when the alarm goes off.
    private fun firePendingIntent(alarmId: Long): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmConstants.ACTION_ALARM_FIRED
            putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId)
        }
        return PendingIntent.getBroadcast(
            context,
            alarmId.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    // Tapping the system "alarm set" indicator opens the app.
    private fun showIntent(): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        private const val TAG = "AlarmScheduler"

        // The next moment this alarm should fire, as epoch milliseconds.
        fun nextTriggerMillis(alarm: Alarm, from: LocalDateTime = LocalDateTime.now()): Long {
            val time = LocalTime.of(alarm.hour, alarm.minute)
            val zone = ZoneId.systemDefault()

            if (!alarm.repeats) {
                var dateTime = from.toLocalDate().atTime(time)
                if (!dateTime.isAfter(from)) dateTime = dateTime.plusDays(1)
                return dateTime.atZone(zone).toInstant().toEpochMilli()
            }

            // Repeating alarm: find the soonest selected weekday at this time.
            for (offset in 0..7) {
                val date = from.toLocalDate().plusDays(offset.toLong())
                if (date.dayOfWeek in alarm.repeatDaysOfWeek) {
                    val dateTime = date.atTime(time)
                    if (dateTime.isAfter(from)) {
                        return dateTime.atZone(zone).toInstant().toEpochMilli()
                    }
                }
            }
            // Should not happen, but never return a past time.
            return from.plusDays(1).toLocalDate().atTime(time)
                .atZone(zone).toInstant().toEpochMilli()
        }
    }
}
