package com.wakewell.app.ui.screens

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import com.wakewell.app.data.Chronotype
import com.wakewell.app.data.UserProfile
import com.wakewell.app.ui.Permissions
import com.wakewell.app.ui.components.LabeledSlider
import com.wakewell.app.ui.components.SectionCard
import kotlin.math.roundToInt

// Lets the user revisit their sleep settings and fix the permissions that keep
// alarms firing reliably.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    profile: UserProfile,
    onSaveProfile: (UserProfile) -> Unit,
) {
    val context = LocalContext.current

    var latency by remember { mutableFloatStateOf(profile.sleepLatencyMin.toFloat()) }
    var targetCycles by remember { mutableIntStateOf(profile.targetCycles) }
    var cycleLength by remember { mutableFloatStateOf(profile.cycleLengthMin.toFloat()) }
    var chronotype by remember {
        mutableStateOf(runCatching { Chronotype.valueOf(profile.chronotype) }.getOrDefault(Chronotype.NEITHER))
    }

    // Re-check permission statuses whenever we return to this screen.
    var refreshTick by remember { mutableIntStateOf(0) }
    LifecycleResumeEffect(Unit) {
        refreshTick++
        onPauseOrDispose { }
    }
    val hasNotifications = remember(refreshTick) { Permissions.hasNotifications(context) }
    val canExact = remember(refreshTick) { Permissions.canScheduleExactAlarms(context) }
    val ignoringBattery = remember(refreshTick) { Permissions.isIgnoringBatteryOptimizations(context) }
    val canFullScreen = remember(refreshTick) { Permissions.canUseFullScreenIntent(context) }

    val notifLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { refreshTick++ }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
        ) {
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(16.dp))

            SectionCard(title = "Your sleep settings") {
                LabeledSlider(
                    label = "Time to fall asleep",
                    valueText = "${latency.roundToInt()} min",
                    value = latency,
                    valueRange = 0f..45f,
                    steps = 44,
                    onValueChange = { latency = it },
                )
                Spacer(Modifier.height(8.dp))
                Text("Sleep target", style = MaterialTheme.typography.bodyLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.padding(top = 4.dp)) {
                    FilterChip(targetCycles == 5, { targetCycles = 5 }, { Text("5 · 7.5h") })
                    FilterChip(targetCycles == 6, { targetCycles = 6 }, { Text("6 · 9h") })
                }
                LabeledSlider(
                    label = "Cycle length",
                    valueText = "${cycleLength.roundToInt()} min",
                    value = cycleLength,
                    valueRange = 80f..110f,
                    steps = 29,
                    onValueChange = { cycleLength = it },
                )
                Spacer(Modifier.height(8.dp))
                Text("I'm more of a…", style = MaterialTheme.typography.bodyLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                    FilterChip(chronotype == Chronotype.MORNING, { chronotype = Chronotype.MORNING }, { Text("Morning") })
                    FilterChip(chronotype == Chronotype.NIGHT, { chronotype = Chronotype.NIGHT }, { Text("Night owl") })
                    FilterChip(chronotype == Chronotype.NEITHER, { chronotype = Chronotype.NEITHER }, { Text("Neither") })
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        onSaveProfile(
                            profile.copy(
                                sleepLatencyMin = latency.roundToInt(),
                                targetCycles = targetCycles,
                                cycleLengthMin = cycleLength.roundToInt(),
                                chronotype = chronotype.name,
                            ),
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Save settings")
                }
            }
            Spacer(Modifier.height(16.dp))

            SectionCard(title = "Alarm reliability") {
                Text(
                    text = "Android can silence or delay alarms to save battery. Grant these so " +
                        "WakeWell rings on time, even when your phone is locked.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 8.dp),
                )

                PermissionRow(
                    title = "Notifications",
                    description = "Needed to show the alarm and its controls.",
                    granted = hasNotifications,
                    onFix = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            notifLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    },
                )
                PermissionRow(
                    title = "Exact alarms",
                    description = "Lets alarms fire to the exact minute.",
                    granted = canExact,
                    onFix = { Permissions.openExactAlarmSettings(context) },
                )
                PermissionRow(
                    title = "Ignore battery optimization",
                    description = "Stops the system from delaying alarms in deep sleep mode.",
                    granted = ignoringBattery,
                    onFix = { Permissions.requestIgnoreBatteryOptimizations(context) },
                )
                PermissionRow(
                    title = "Full-screen alarm",
                    description = "Lets the alarm screen appear over the lock screen.",
                    granted = canFullScreen,
                    onFix = { Permissions.openFullScreenIntentSettings(context) },
                )
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PermissionRow(
    title: String,
    description: String,
    granted: Boolean,
    onFix: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            Text(
                description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (granted) {
            Icon(
                Icons.Filled.CheckCircle,
                contentDescription = "Granted",
                tint = MaterialTheme.colorScheme.primary,
            )
        } else {
            OutlinedButton(onClick = onFix) { Text("Fix") }
        }
    }
}
