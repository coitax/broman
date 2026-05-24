package com.wakewell.app.alarm

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.wakewell.app.ui.theme.WakeWellTheme
import kotlinx.coroutines.delay
import java.time.LocalTime
import java.time.format.DateTimeFormatter

// The screen shown when an alarm rings. It appears over the lock screen and
// turns the display on, then offers Snooze and Dismiss.
class AlarmActivity : ComponentActivity() {

    private var alarmId: Long = -1L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showOverLockScreen()

        alarmId = intent.getLongExtra(AlarmConstants.EXTRA_ALARM_ID, -1L)
        val label = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_LABEL) ?: "Alarm"

        setContent {
            WakeWellTheme {
                AlarmRingingScreen(
                    label = label,
                    onSnooze = { sendServiceAction(AlarmConstants.ACTION_SNOOZE); finish() },
                    onDismiss = { sendServiceAction(AlarmConstants.ACTION_DISMISS); finish() },
                )
            }
        }
    }

    // If a second alarm reuses this single-instance activity, refresh the label.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        alarmId = intent.getLongExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId)
    }

    private fun showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        // Window flags cover older versions and keep the screen on while ringing.
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
        )
    }

    private fun sendServiceAction(action: String) {
        val intent = Intent(this, AlarmService::class.java).apply {
            this.action = action
            putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId)
        }
        startService(intent)
    }
}

@Composable
private fun AlarmRingingScreen(
    label: String,
    onSnooze: () -> Unit,
    onDismiss: () -> Unit,
) {
    // A live clock so the screen feels alive while ringing.
    var now by remember { mutableStateOf(LocalTime.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            now = LocalTime.now()
            delay(1000)
        }
    }
    val timeText = now.format(DateTimeFormatter.ofPattern("h:mm a"))

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = timeText,
                style = MaterialTheme.typography.displayLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(64.dp))
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth().height(64.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                ),
            ) {
                Text("Dismiss", style = MaterialTheme.typography.titleLarge)
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = onSnooze,
                modifier = Modifier.fillMaxWidth().height(64.dp),
            ) {
                Text("Snooze", style = MaterialTheme.typography.titleLarge)
            }
        }
    }
}
