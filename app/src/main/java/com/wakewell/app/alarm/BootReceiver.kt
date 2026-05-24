package com.wakewell.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.wakewell.app.data.WakeWellRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Alarms set with AlarmManager are cleared when the phone reboots. This receiver
// fires on boot and re-arms every enabled alarm so nothing is silently lost.
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED
        ) return

        // DB work must finish before the receiver returns, so we use goAsync().
        val pending = goAsync()
        val appContext = context.applicationContext
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val repo = WakeWellRepository.get(appContext)
                val scheduler = AlarmScheduler(appContext)
                repo.getEnabledAlarms().forEach { scheduler.schedule(it) }
            } finally {
                pending.finish()
            }
        }
    }
}
