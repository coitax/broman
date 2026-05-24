package com.wakewell.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.wakewell.app.calc.CycleSuggestion
import com.wakewell.app.calc.SleepCalculator
import com.wakewell.app.ui.components.HonestyNote
import com.wakewell.app.ui.components.rememberTimePicker
import com.wakewell.app.ui.formatClock
import com.wakewell.app.ui.formatDuration
import java.time.LocalTime

private enum class CalcMode { WAKE_AT, BED_NOW, BED_AT }

// The sleep-cycle calculator. Three modes:
//  A (WAKE_AT)  — choose a wake time, see suggested bedtimes.
//  B (BED_NOW)  — sleeping now, see suggested wake times.
//  C (BED_AT)   — choose a bedtime, see suggested wake times.
// Tapping a suggested time opens the alarm editor pre-filled with it.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalculatorScreen(
    latencyMin: Int,
    cycleLengthMin: Int,
    onUseTime: (LocalTime) -> Unit,
) {
    var mode by remember { mutableStateOf(CalcMode.WAKE_AT) }
    var wakeAtTime by remember { mutableStateOf(LocalTime.of(7, 0)) }
    var bedAtTime by remember { mutableStateOf(LocalTime.of(23, 0)) }

    val pickWake = rememberTimePicker { wakeAtTime = it }
    val pickBed = rememberTimePicker { bedAtTime = it }

    val results: List<CycleSuggestion> = when (mode) {
        CalcMode.WAKE_AT -> SleepCalculator.bedtimesForWakeTime(wakeAtTime, latencyMin, cycleLengthMin)
        CalcMode.BED_NOW -> SleepCalculator.wakeTimesFromNow(LocalTime.now(), latencyMin, cycleLengthMin)
        CalcMode.BED_AT -> SleepCalculator.wakeTimesForBedtime(bedAtTime, latencyMin, cycleLengthMin)
    }

    val heading = when (mode) {
        CalcMode.WAKE_AT -> "To wake at ${wakeAtTime.formatClock()}, head to bed at:"
        CalcMode.BED_NOW -> "If you fall asleep now, good times to wake up:"
        CalcMode.BED_AT -> "If you go to bed at ${bedAtTime.formatClock()}, good times to wake up:"
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
        ) {
            Text(
                text = "Sleep calculator",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(12.dp))

            // Mode picker.
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(mode == CalcMode.WAKE_AT, { mode = CalcMode.WAKE_AT }, { Text("Wake at…") })
                FilterChip(mode == CalcMode.BED_NOW, { mode = CalcMode.BED_NOW }, { Text("Bed now") })
                FilterChip(mode == CalcMode.BED_AT, { mode = CalcMode.BED_AT }, { Text("Bed at…") })
            }
            Spacer(Modifier.height(12.dp))

            // Time input for modes that need one.
            when (mode) {
                CalcMode.WAKE_AT -> TimeField("Wake-up time", wakeAtTime) { pickWake(wakeAtTime) }
                CalcMode.BED_AT -> TimeField("Bedtime", bedAtTime) { pickBed(bedAtTime) }
                CalcMode.BED_NOW -> { /* uses the current time */ }
            }

            Spacer(Modifier.height(16.dp))
            Text(text = heading, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Tap a time to set an alarm for it.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(8.dp))

            results.forEach { suggestion ->
                SuggestionCard(suggestion) { onUseTime(suggestion.time) }
                Spacer(Modifier.height(10.dp))
            }

            Spacer(Modifier.height(8.dp))
            HonestyNote(
                text = "Times include your ${latencyMin}-minute fall-asleep estimate. They're a " +
                    "guide, not a promise — a consistent schedule and enough total sleep matter most.",
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun TimeField(label: String, time: LocalTime, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = Modifier.fillMaxWidth().height(56.dp)) {
        Icon(Icons.Filled.Schedule, contentDescription = null)
        Spacer(Modifier.height(0.dp))
        Text(
            text = "  $label: ${time.formatClock()}",
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SuggestionCard(suggestion: CycleSuggestion, onClick: () -> Unit) {
    val border = if (suggestion.recommended) {
        BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
    } else null

    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = border,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column {
                Text(
                    text = suggestion.time.formatClock(),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = "${suggestion.cycles} cycles · ${formatDuration(suggestion.totalSleepMinutes)} of sleep",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (suggestion.recommended) {
                AssistChip(onClick = onClick, label = { Text("Recommended") })
            }
        }
    }
}
