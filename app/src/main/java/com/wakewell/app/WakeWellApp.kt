package com.wakewell.app

import android.app.Application
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import com.wakewell.app.alarm.AlarmConstants

// The Application object is created once when the app starts. We use it to set up
// the notification channel that ringing alarms post to.
class WakeWellApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createAlarmChannel()
    }

    private fun createAlarmChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            AlarmConstants.CHANNEL_ID,
            "Alarms",
            // HIGH importance lets the full-screen alarm appear and pop as a
            // heads-up notification when the phone is in use.
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "WakeWell wake-up alarms"
            // The service plays its own sound and vibration, so silence the channel.
            setSound(null, null)
            enableVibration(false)
            // Try to ring through Do Not Disturb (only takes effect if granted).
            setBypassDnd(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        manager.createNotificationChannel(channel)
    }
}
