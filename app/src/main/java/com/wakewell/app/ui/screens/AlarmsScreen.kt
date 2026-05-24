package com.wakewell.app.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.wakewell.app.data.Alarm
import com.wakewell.app.ui.formatClock
import java.time.DayOfWeek
import java.time.LocalTime
import java.time.format.TextStyle
import java.util.Locale

// Lists saved alarms with an on/off switch each, plus a + button to add one.
@Composable
fun AlarmsScreen(
    alarms: List<Alarm>,
    onAddAlarm: () -> Unit,
    onEditAlarm: (Long) -> Unit,
    onToggle: (Alarm, Boolean) -> Unit,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
                Text(
                    text = "Alarms",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.height(12.dp))

                if (alarms.isEmpty()) {
                    Text(
                        text = "No alarms yet. Tap + to add one, or pick a time on the calculator.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(alarms, key = { it.id }) { alarm ->
                            AlarmRow(
                                alarm = alarm,
                                onClick = { onEditAlarm(alarm.id) },
                                onToggle = { onToggle(alarm, it) },
                            )
                        }
                    }
                }
            }

            FloatingActionButton(
                onClick = onAddAlarm,
                modifier = Modifier.align(Alignment.BottomEnd).padding(24.dp),
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Add alarm")
            }
        }
    }
}

@Composable
private fun AlarmRow(alarm: Alarm, onClick: () -> Unit, onToggle: (Boolean) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column {
                Text(
                    text = LocalTime.of(alarm.hour, alarm.minute).formatClock(),
                    style = MaterialTheme.typography.headlineMedium,
                    color = if (alarm.isEnabled) {
                        MaterialTheme.colorScheme.onSurface
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                )
                Text(
                    text = "${alarm.label} · ${repeatSummary(alarm)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(checked = alarm.isEnabled, onCheckedChange = onToggle)
        }
    }
}

// Turns repeat days into a short human label.
private fun repeatSummary(alarm: Alarm): String {
    val days = alarm.repeatDaysOfWeek
    return when {
        days.isEmpty() -> "Once"
        days.size == 7 -> "Every day"
        days == setOf(
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY,
        ) -> "Weekdays"
        days == setOf(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY) -> "Weekends"
        else -> DayOfWeek.values()
            .filter { it in days }
            .joinToString(" ") { it.getDisplayName(TextStyle.SHORT, Locale.getDefault()) }
    }
}
