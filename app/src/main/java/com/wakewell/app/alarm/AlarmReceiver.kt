package com.wakewell.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

// Receives the exact-alarm broadcast from AlarmManager (even in Doze) and hands
// off to AlarmService, which actually rings. We keep this tiny and fast.
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != AlarmConstants.ACTION_ALARM_FIRED) return
        val alarmId = intent.getLongExtra(AlarmConstants.EXTRA_ALARM_ID, -1L)
        if (alarmId == -1L) return

        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            action = AlarmConstants.ACTION_START
            putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId)
        }
        // A foreground service is allowed to start from an exact-alarm broadcast,
        // and is the reliable way to keep ringing while the screen is off.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
