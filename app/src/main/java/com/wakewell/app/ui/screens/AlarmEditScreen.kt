package com.wakewell.app.ui.screens

import android.app.Activity
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.IntentCompat
import com.wakewell.app.alarm.AlarmScheduler
import com.wakewell.app.data.Alarm
import com.wakewell.app.ui.components.LabeledSlider
import com.wakewell.app.ui.components.SectionCard
import com.wakewell.app.ui.components.rememberTimePicker
import com.wakewell.app.ui.formatClock
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.roundToInt

// Create or edit a single alarm: time, label, repeat days, sound, vibrate, and
// snooze length. Saving arms the alarm; the smart-wake toggle arrives in Phase 3.
@Composable
fun AlarmEditScreen(
    initialAlarm: Alarm,
    isNew: Boolean,
    onSave: (Alarm) -> Unit,
    onDelete: (Alarm) -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    var alarm by remember { mutableStateOf(initialAlarm) }

    val pickTime = rememberTimePicker { alarm = alarm.copy(hour = it.hour, minute = it.minute) }

    val ringtoneLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            val uri = IntentCompat.getParcelableExtra(
                result.data!!,
                RingtoneManager.EXTRA_RINGTONE_PICKED_URI,
                Uri::class.java,
            )
            alarm = alarm.copy(soundUri = uri?.toString())
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
        ) {
            // Header with a back arrow.
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
                Text(
                    text = if (isNew) "New alarm" else "Edit alarm",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Spacer(Modifier.height(8.dp))

            // Big tappable time.
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { pickTime(LocalTime.of(alarm.hour, alarm.minute)) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(24.dp)) {
                    Text(
                        text = LocalTime.of(alarm.hour, alarm.minute).formatClock(),
                        style = MaterialTheme.typography.displayMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "Tap to change · ${nextRingText(alarm)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.height(16.dp))

            // Label.
            OutlinedTextField(
                value = alarm.label,
                onValueChange = { alarm = alarm.copy(label = it) },
                label = { Text("Label") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))

            // Repeat days.
            SectionCard(title = "Repeat") {
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    orderedWeekDays().forEach { day ->
                        DayToggle(
                            day = day,
                            selected = day.value in alarm.repeatDays,
                            onToggle = {
                                val days = alarm.repeatDays.toMutableSet()
                                if (day.value in days) days.remove(day.value) else days.add(day.value)
                                alarm = alarm.copy(repeatDays = days)
                            },
                        )
                    }
                }
                if (alarm.repeatDays.isEmpty()) {
                    Text(
                        text = "Rings once, then turns itself off.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }
            Spacer(Modifier.height(16.dp))

            // Sound + vibrate.
            SectionCard(title = "Sound & vibration") {
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = {
                        val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                            putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
                            putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Choose alarm sound")
                            putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                            putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                            putExtra(
                                RingtoneManager.EXTRA_RINGTONE_EXISTING_URI,
                                alarm.soundUri?.let { Uri.parse(it) },
                            )
                        }
                        ringtoneLauncher.launch(intent)
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Sound: ${soundTitle(context, alarm.soundUri)}")
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Vibrate", style = MaterialTheme.typography.bodyLarge)
                    Switch(
                        checked = alarm.vibrate,
                        onCheckedChange = { alarm = alarm.copy(vibrate = it) },
                    )
                }
            }
            Spacer(Modifier.height(16.dp))

            // Snooze length.
            SectionCard(title = "Snooze") {
                LabeledSlider(
                    label = "Snooze length",
                    valueText = "${alarm.snoozeMinutes} min",
                    value = alarm.snoozeMinutes.toFloat(),
                    valueRange = 1f..30f,
                    steps = 28,
                    onValueChange = { alarm = alarm.copy(snoozeMinutes = it.roundToInt()) },
                )
            }
            Spacer(Modifier.height(16.dp))

            // Smart wake (Phase 3) — visible but disabled for now.
            SectionCard(title = "Smart wake") {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        text = "Wake during light sleep (coming soon)",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Switch(checked = false, onCheckedChange = null, enabled = false)
                }
            }
            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { onSave(alarm) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Text("Save alarm", style = MaterialTheme.typography.titleMedium)
            }
            if (!isNew) {
                Spacer(Modifier.height(8.dp))
                TextButton(
                    onClick = { onDelete(alarm) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Delete alarm", color = MaterialTheme.colorScheme.error)
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

// A round day-of-week toggle (M T W T F S S).
@Composable
private fun DayToggle(day: DayOfWeek, selected: Boolean, onToggle: () -> Unit) {
    val bg = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
    val fg = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(bg)
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = day.getDisplayName(TextStyle.NARROW, Locale.getDefault()),
            style = MaterialTheme.typography.titleMedium,
            color = fg,
        )
    }
}

// Monday-first order for the day toggles.
private fun orderedWeekDays(): List<DayOfWeek> = listOf(
    DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY,
)

private fun soundTitle(context: android.content.Context, soundUri: String?): String {
    if (soundUri == null) return "Default"
    return runCatching {
        RingtoneManager.getRingtone(context, Uri.parse(soundUri))?.getTitle(context)
    }.getOrNull() ?: "Custom"
}

// A short "next ring" preview, e.g. "Rings Tue 7:00 AM".
private fun nextRingText(alarm: Alarm): String {
    val millis = AlarmScheduler.nextTriggerMillis(alarm)
    val dateTime = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault())
    val dayName = dateTime.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault())
    val time = dateTime.toLocalTime().format(DateTimeFormatter.ofPattern("h:mm a"))
    return "Rings $dayName $time"
}
