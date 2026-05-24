package com.wakewell.app.ui

import java.time.LocalTime
import java.time.format.DateTimeFormatter

// Small shared helpers for showing times and durations the way people read them.

private val TIME_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("h:mm a")

fun LocalTime.formatClock(): String = this.format(TIME_FORMAT)

// 450 -> "7h 30m"; 540 -> "9h".
fun formatDuration(totalMinutes: Int): String {
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60
    return if (minutes == 0) "${hours}h" else "${hours}h ${minutes}m"
}
