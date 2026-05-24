package com.wakewell.app.calc

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalTime

// Verifies the sleep-cycle math. These are the exact numbers the app shows, so
// getting them right matters more than anything else in the calculator.
class SleepCalculatorTest {

    @Test
    fun modeA_bedtimesForWakeTime() {
        // Wake at 7:00, 15 min to fall asleep, 90-min cycles.
        val results = SleepCalculator.bedtimesForWakeTime(LocalTime.of(7, 0), 15, 90)

        // Order is 6, 5, 4 cycles.
        assertEquals(listOf(6, 5, 4), results.map { it.cycles })

        // 6 cycles = 540 min sleep + 15 latency = 555 min before 7:00 -> 21:45.
        assertEquals(LocalTime.of(21, 45), results[0].time)
        assertEquals(540, results[0].totalSleepMinutes)
        // 5 cycles = 450 + 15 = 465 min before 7:00 -> 23:15.
        assertEquals(LocalTime.of(23, 15), results[1].time)
        // 4 cycles = 360 + 15 = 375 min before 7:00 -> 00:45.
        assertEquals(LocalTime.of(0, 45), results[2].time)
    }

    @Test
    fun modeC_wakeTimesForBedtime() {
        // Bed at 23:00, 15 min latency, 90-min cycles.
        val results = SleepCalculator.wakeTimesForBedtime(LocalTime.of(23, 0), 15, 90)

        // 6 cycles: 23:00 + 15 + 540 = 23:00 + 555 = 08:15 next day.
        assertEquals(LocalTime.of(8, 15), results[0].time)
        // 5 cycles: 23:00 + 15 + 450 = 06:45.
        assertEquals(LocalTime.of(6, 45), results[1].time)
        // 4 cycles: 23:00 + 15 + 360 = 05:15.
        assertEquals(LocalTime.of(5, 15), results[2].time)
    }

    @Test
    fun fiveAndSixCyclesAreRecommended() {
        val results = SleepCalculator.bedtimesForWakeTime(LocalTime.of(6, 30), 20, 90)
        assertTrue(results.first { it.cycles == 6 }.recommended)
        assertTrue(results.first { it.cycles == 5 }.recommended)
        assertTrue(!results.first { it.cycles == 4 }.recommended)
    }

    @Test
    fun customCycleLengthIsRespected() {
        // 100-min cycles, no latency.
        val results = SleepCalculator.wakeTimesFromNow(LocalTime.of(22, 0), 0, 100)
        // 5 cycles = 500 min = 8h20m -> 06:20.
        assertEquals(LocalTime.of(6, 20), results[1].time)
        assertEquals(500, results[1].totalSleepMinutes)
    }
}
