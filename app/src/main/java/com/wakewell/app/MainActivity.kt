package com.wakewell.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.wakewell.app.ui.WakeWellRoot
import com.wakewell.app.ui.theme.WakeWellTheme

// MainActivity is the single screen Android launches when you tap the app icon.
// It hands the whole UI over to Compose (WakeWellRoot decides what to show).
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Draw behind the status/navigation bars for a clean full-screen look.
        enableEdgeToEdge()
        setContent {
            WakeWellTheme {
                WakeWellRoot()
            }
        }
    }
}
