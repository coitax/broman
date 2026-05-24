package com.wakewell.app.alarm

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.wakewell.app.R
import com.wakewell.app.data.Alarm
import com.wakewell.app.data.WakeWellRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// The foreground service that rings: it plays the alarm sound, vibrates, and
// posts a full-screen notification that opens AlarmActivity over the lock screen.
class AlarmService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null

    // The alarm currently ringing, kept in memory for Snooze/Dismiss actions.
    private var currentAlarm: Alarm? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            AlarmConstants.ACTION_SNOOZE -> {
                handleSnooze()
                return START_NOT_STICKY
            }
            AlarmConstants.ACTION_DISMISS -> {
                stopRingingAndSelf()
                return START_NOT_STICKY
            }
            else -> {
                val alarmId = intent?.getLongExtra(AlarmConstants.EXTRA_ALARM_ID, -1L) ?: -1L
                startRinging(alarmId)
            }
        }
        return START_STICKY
    }

    private fun startRinging(alarmId: Long) {
        // Show the foreground notification right away (required within 5s) using
        // the id we already have; details are filled in once we load the alarm.
        startInForeground(buildNotification(alarmId, label = "Alarm"))

        acquireWakeLock()

        scope.launch {
            val repo = WakeWellRepository.get(applicationContext)
            val alarm = withContext(Dispatchers.IO) { repo.getAlarm(alarmId) }
            currentAlarm = alarm

            // Refresh the notification with the real label.
            startInForeground(buildNotification(alarmId, alarm?.label ?: "Alarm"))

            // Keep the schedule healthy: repeating alarms get their next occurrence
            // armed; a one-time alarm is switched off now that it has fired.
            if (alarm != null) {
                val scheduler = AlarmScheduler(applicationContext)
                if (alarm.repeats) {
                    scheduler.schedule(alarm)
                } else {
                    withContext(Dispatchers.IO) { repo.updateAlarm(alarm.copy(isEnabled = false)) }
                }
            }

            startSound(alarm?.soundUri)
            if (alarm?.vibrate != false) startVibration()
        }
    }

    private fun handleSnooze() {
        val alarm = currentAlarm
        if (alarm != null) {
            AlarmScheduler(applicationContext).scheduleSnooze(alarm.id, alarm.snoozeMinutes)
        }
        stopRingingAndSelf()
    }

    // ---- Sound ----
    private fun startSound(soundUri: String?) {
        val uri: Uri = soundUri?.let { runCatching { Uri.parse(it) }.getOrNull() }
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: return

        try {
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build(),
                )
                setDataSource(applicationContext, uri)
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Could not play alarm sound", e)
        }
    }

    // ---- Vibration ----
    private fun startVibration() {
        val vib = getVibrator() ?: return
        vibrator = vib
        // 0ms wait, 800ms buzz, 600ms pause — repeated from index 0.
        val pattern = longArrayOf(0, 800, 600)
        vib.vibrate(VibrationEffect.createWaveform(pattern, 0))
    }

    private fun getVibrator(): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

    // ---- Wake lock (keeps CPU awake briefly so we reliably start ringing) ----
    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "wakewell:alarm").apply {
            setReferenceCounted(false)
            acquire(5 * 60 * 1000L) // safety timeout: 5 minutes
        }
    }

    private fun stopRingingAndSelf() {
        runCatching { mediaPlayer?.stop() }
        runCatching { mediaPlayer?.release() }
        mediaPlayer = null
        runCatching { vibrator?.cancel() }
        vibrator = null
        runCatching { if (wakeLock?.isHeld == true) wakeLock?.release() }
        wakeLock = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    // ---- Notification ----
    private fun startInForeground(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                AlarmConstants.RINGING_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
            )
        } else {
            startForeground(AlarmConstants.RINGING_NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(alarmId: Long, label: String): Notification {
        // Full-screen intent: launches the alarm screen over the lock screen.
        val fullScreenIntent = Intent(this, AlarmActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmConstants.EXTRA_ALARM_LABEL, label)
        }
        val fullScreenPi = PendingIntent.getActivity(
            this, alarmId.toInt(), fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, AlarmConstants.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_alarm)
            .setContentTitle(label)
            .setContentText("Alarm")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPi, true)
            .addAction(0, "Snooze", serviceActionPi(AlarmConstants.ACTION_SNOOZE, alarmId))
            .addAction(0, "Dismiss", serviceActionPi(AlarmConstants.ACTION_DISMISS, alarmId))
            .build()
    }

    private fun serviceActionPi(action: String, alarmId: Long): PendingIntent {
        val intent = Intent(this, AlarmService::class.java).apply {
            this.action = action
            putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId)
        }
        // Distinct request codes so Snooze/Dismiss don't overwrite each other.
        val requestCode = alarmId.toInt() * 10 + if (action == AlarmConstants.ACTION_SNOOZE) 1 else 2
        return PendingIntent.getService(
            this, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        private const val TAG = "AlarmService"
    }
}
