package com.wakewell.app.calc

import java.time.LocalTime

// One suggested time, with how many ~90-min cycles it represents and the total
// sleep that adds up to. "recommended" marks the 5- and 6-cycle sweet spot.
data class CycleSuggestion(
    val time: LocalTime,
    val cycles: Int,
    val totalSleepMinutes: Int,
    val recommended: Boolean,
)

// Pure sleep-cycle math, kept separate from any UI so it's easy to reason about.
//
// The science (Sleep Foundation, Cleveland Clinic, NIH): sleep runs in cycles
// averaging ~90 minutes; waking between cycles (light sleep) tends to feel less
// groggy than waking mid-cycle. We also add the time it takes to fall asleep
// ("sleep latency"). These are SUGGESTIONS — consistent timing and enough total
// sleep matter more than hitting an exact cycle boundary.
object SleepCalculator {

    // We always show 6, 5, and 4 cycles. 5 (~7.5h) and 6 (~9h) are the targets.
    private val CYCLE_OPTIONS = listOf(6, 5, 4)

    private fun recommended(cycles: Int) = cycles == 5 || cycles == 6

    // Mode A — "I want to WAKE UP at wakeTime." Suggest when to go to bed.
    // bedtime = wakeTime - latency - (cycles * cycleLength)
    fun bedtimesForWakeTime(
        wakeTime: LocalTime,
        latencyMin: Int,
        cycleLengthMin: Int,
    ): List<CycleSuggestion> = CYCLE_OPTIONS.map { cycles ->
        val sleepMinutes = cycles * cycleLengthMin
        val bedtime = wakeTime.minusMinutes((latencyMin + sleepMinutes).toLong())
        CycleSuggestion(bedtime, cycles, sleepMinutes, recommended(cycles))
    }

    // Mode B — "I'm going to BED now." Suggest good times to wake up.
    // wakeTime = now + latency + (cycles * cycleLength)
    fun wakeTimesFromNow(
        now: LocalTime,
        latencyMin: Int,
        cycleLengthMin: Int,
    ): List<CycleSuggestion> = wakeTimesForBedtime(now, latencyMin, cycleLengthMin)

    // Mode C — "I'll go to BED at bedtime." Suggest good times to wake up.
    // wakeTime = bedtime + latency + (cycles * cycleLength)
    fun wakeTimesForBedtime(
        bedtime: LocalTime,
        latencyMin: Int,
        cycleLengthMin: Int,
    ): List<CycleSuggestion> = CYCLE_OPTIONS.map { cycles ->
        val sleepMinutes = cycles * cycleLengthMin
        val wakeTime = bedtime.plusMinutes((latencyMin + sleepMinutes).toLong())
        CycleSuggestion(wakeTime, cycles, sleepMinutes, recommended(cycles))
    }
}
