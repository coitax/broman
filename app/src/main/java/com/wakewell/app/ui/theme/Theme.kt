package com.wakewell.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

// WakeWell always uses a single, calm dark color scheme. A sleep app is used in
// dim rooms at night, so we deliberately skip light mode and dynamic colors to
// keep the look consistent and gentle on the eyes.
private val WakeWellColors = darkColorScheme(
    primary = MoonGold,
    onPrimary = DeepNavy,
    secondary = SoftLavender,
    onSecondary = DeepNavy,
    background = DeepNavy,
    onBackground = TextPrimary,
    surface = NavySurface,
    onSurface = TextPrimary,
    surfaceVariant = NavySurfaceVariant,
    onSurfaceVariant = TextSecondary,
)

@Composable
fun WakeWellTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = WakeWellColors,
        typography = Typography(),
        content = content,
    )
}
