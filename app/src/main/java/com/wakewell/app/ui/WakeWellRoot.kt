package com.wakewell.app.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.wakewell.app.data.Alarm
import com.wakewell.app.data.UserProfile
import com.wakewell.app.ui.screens.AlarmEditScreen
import com.wakewell.app.ui.screens.AlarmsScreen
import com.wakewell.app.ui.screens.CalculatorScreen
import com.wakewell.app.ui.screens.OnboardingScreen
import com.wakewell.app.ui.screens.SettingsScreen

// The top of the app. Decides between a loading spinner, onboarding, or the main
// app (with bottom navigation) based on whether a profile has been saved.
@Composable
fun WakeWellRoot() {
    val profileVm: ProfileViewModel = viewModel()
    val state by profileVm.state.collectAsStateWithLifecycle()

    when (val s = state) {
        is OnboardingState.Loading -> LoadingScreen()
        is OnboardingState.NeedsOnboarding -> OnboardingScreen(
            onComplete = profileVm::completeOnboarding,
        )
        is OnboardingState.Ready -> MainApp(profile = s.profile, profileVm = profileVm)
    }
}

@Composable
private fun LoadingScreen() {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator()
        }
    }
}

private sealed class Tab(val route: String, val label: String, val icon: ImageVector) {
    data object Calculator : Tab("calculator", "Calculator", Icons.Filled.Bedtime)
    data object Alarms : Tab("alarms", "Alarms", Icons.Filled.Alarm)
    data object Settings : Tab("settings", "Settings", Icons.Filled.Settings)
}

@Composable
private fun MainApp(profile: UserProfile, profileVm: ProfileViewModel) {
    val navController = rememberNavController()
    val alarmsVm: AlarmsViewModel = viewModel()
    val alarms by alarmsVm.alarms.collectAsStateWithLifecycle()

    val tabs = listOf(Tab.Calculator, Tab.Alarms, Tab.Settings)
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = currentRoute in tabs.map { it.route }

    // Ask for notification permission once on first entry (Android 13+).
    AskNotificationPermissionOnce()

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(Tab.Calculator.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Tab.Calculator.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Tab.Calculator.route) {
                CalculatorScreen(
                    latencyMin = profile.sleepLatencyMin,
                    cycleLengthMin = profile.cycleLengthMin,
                    onUseTime = { time ->
                        navController.navigate("alarmEdit?id=-1&hour=${time.hour}&minute=${time.minute}")
                    },
                )
            }
            composable(Tab.Alarms.route) {
                AlarmsScreen(
                    alarms = alarms,
                    onAddAlarm = { navController.navigate("alarmEdit?id=-1&hour=-1&minute=-1") },
                    onEditAlarm = { id -> navController.navigate("alarmEdit?id=$id&hour=-1&minute=-1") },
                    onToggle = { alarm, enabled -> alarmsVm.setEnabled(alarm, enabled) },
                )
            }
            composable(Tab.Settings.route) {
                SettingsScreen(profile = profile, onSaveProfile = profileVm::saveProfile)
            }
            composable(
                route = "alarmEdit?id={id}&hour={hour}&minute={minute}",
                arguments = listOf(
                    navArgument("id") { type = NavType.LongType; defaultValue = -1L },
                    navArgument("hour") { type = NavType.IntType; defaultValue = -1 },
                    navArgument("minute") { type = NavType.IntType; defaultValue = -1 },
                ),
            ) { entry ->
                val id = entry.arguments?.getLong("id") ?: -1L
                val hour = entry.arguments?.getInt("hour") ?: -1
                val minute = entry.arguments?.getInt("minute") ?: -1

                val isNew = id == -1L
                val initialAlarm: Alarm = if (!isNew) {
                    alarms.find { it.id == id } ?: Alarm(hour = 7, minute = 0)
                } else {
                    Alarm(
                        hour = if (hour in 0..23) hour else 7,
                        minute = if (minute in 0..59) minute else 0,
                    )
                }

                AlarmEditScreen(
                    initialAlarm = initialAlarm,
                    isNew = isNew,
                    onSave = { alarmsVm.saveAlarm(it); navController.popBackStack() },
                    onDelete = { alarmsVm.delete(it); navController.popBackStack() },
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}

// Requests POST_NOTIFICATIONS a single time when the app first opens on Android 13+.
@Composable
private fun AskNotificationPermissionOnce() {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { /* result handled by the Settings screen status */ }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !Permissions.hasNotifications(context)
        ) {
            launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
