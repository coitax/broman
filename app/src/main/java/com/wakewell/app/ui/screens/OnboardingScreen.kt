package com.wakewell.app.ui.screens

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
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.wakewell.app.data.Chronotype
import com.wakewell.app.ui.components.HonestyNote
import com.wakewell.app.ui.components.LabeledSlider
import com.wakewell.app.ui.components.SectionCard
import kotlin.math.roundToInt

// First-launch screen. Collects the inputs the calculator needs and saves them
// as the user's profile. Everything has a sensible default so the user can just
// tap "Get started" if they like.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    onComplete: (latencyMin: Int, targetCycles: Int, cycleLengthMin: Int, chronotype: Chronotype) -> Unit,
) {
    var latency by remember { mutableFloatStateOf(15f) }
    var targetCycles by remember { mutableIntStateOf(5) }
    var cycleLength by remember { mutableFloatStateOf(90f) }
    var chronotype by remember { mutableStateOf(Chronotype.NEITHER) }
    var showAdvanced by remember { mutableStateOf(false) }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
        ) {
            Text(
                text = "Welcome to WakeWell",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "A few quick questions so we can suggest good bed and wake times. " +
                    "You can change these any time in Settings.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.height(20.dp))

            SectionCard(title = "How long does it take you to fall asleep?") {
                LabeledSlider(
                    label = "On average",
                    valueText = "${latency.roundToInt()} min",
                    value = latency,
                    valueRange = 0f..45f,
                    steps = 44,
                    onValueChange = { latency = it },
                )
                Text(
                    text = "Most adults take about 15 minutes.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(16.dp))

            SectionCard(title = "How much sleep do you want to aim for?") {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    FilterChip(
                        selected = targetCycles == 5,
                        onClick = { targetCycles = 5 },
                        label = { Text("5 cycles · 7.5h") },
                    )
                    FilterChip(
                        selected = targetCycles == 6,
                        onClick = { targetCycles = 6 },
                        label = { Text("6 cycles · 9h") },
                    )
                }
                Text(
                    text = "Adults need roughly 7–9 hours. Five or six full cycles is the sweet spot.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
            Spacer(Modifier.height(16.dp))

            SectionCard(title = "Are you a morning or night person? (optional)") {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ChronotypeChip("Morning", chronotype == Chronotype.MORNING) {
                        chronotype = Chronotype.MORNING
                    }
                    ChronotypeChip("Night owl", chronotype == Chronotype.NIGHT) {
                        chronotype = Chronotype.NIGHT
                    }
                    ChronotypeChip("Neither", chronotype == Chronotype.NEITHER) {
                        chronotype = Chronotype.NEITHER
                    }
                }
            }
            Spacer(Modifier.height(12.dp))

            TextButton(onClick = { showAdvanced = !showAdvanced }) {
                Text(if (showAdvanced) "Hide advanced setting" else "Advanced setting")
            }
            if (showAdvanced) {
                SectionCard(title = "Sleep cycle length") {
                    LabeledSlider(
                        label = "Minutes per cycle",
                        valueText = "${cycleLength.roundToInt()} min",
                        value = cycleLength,
                        valueRange = 80f..110f,
                        steps = 29,
                        onValueChange = { cycleLength = it },
                    )
                    Text(
                        text = "The average is 90 minutes; the natural range is 80–110.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(Modifier.height(16.dp))
            }

            HonestyNote(
                text = "These are suggestions, not a guarantee. The science on timing a wake-up " +
                    "to a cycle is mixed — what helps most is a consistent schedule and enough total sleep.",
            )
            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    onComplete(
                        latency.roundToInt(),
                        targetCycles,
                        cycleLength.roundToInt(),
                        chronotype,
                    )
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Text("Get started", style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ChronotypeChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(selected = selected, onClick = onClick, label = { Text(label) })
}
