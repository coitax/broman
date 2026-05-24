package com.wakewell.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

// The user's sleep settings. There is only ever ONE profile, stored at id = 1.
// If no row exists yet, the app knows onboarding hasn't been completed.
@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: Int = SINGLETON_ID,

    // Average minutes to fall asleep ("sleep latency"). Adjustable 0–45.
    val sleepLatencyMin: Int = 15,

    // Target number of full sleep cycles to aim for: 5 (~7.5h) or 6 (~9h).
    val targetCycles: Int = 5,

    // Length of one sleep cycle in minutes. Default 90, advanced range 80–110.
    val cycleLengthMin: Int = 90,

    // For Phase 3's smart alarm: how many minutes before the set time the alarm
    // may wake you during light sleep. Default 30.
    val wakeWindowMin: Int = 30,

    // Optional self-description: MORNING, NIGHT, or NEITHER.
    val chronotype: String = Chronotype.NEITHER.name,
) {
    companion object {
        // We always use the same row id so there is exactly one profile.
        const val SINGLETON_ID = 1
    }
}

// A simple list of chronotype options (morning person / night owl / neither).
enum class Chronotype { MORNING, NIGHT, NEITHER }
