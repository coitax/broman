package com.wakewell.app.ui.components

import android.app.TimePickerDialog
import android.text.format.DateFormat
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import java.time.LocalTime

// Returns a function you can call to pop up Android's built-in time picker,
// seeded with an initial time. When the user confirms, onTimeSelected fires.
// Using the system picker keeps things simple and familiar for the user.
@Composable
fun rememberTimePicker(onTimeSelected: (LocalTime) -> Unit): (LocalTime) -> Unit {
    val context = LocalContext.current
    return { initial ->
        TimePickerDialog(
            context,
            { _, hour, minute -> onTimeSelected(LocalTime.of(hour, minute)) },
            initial.hour,
            initial.minute,
            DateFormat.is24HourFormat(context),
        ).show()
    }
}
