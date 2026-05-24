package com.wakewell.app.data

import androidx.room.TypeConverter

// Room can only store simple types, so we convert the set of repeat-day numbers
// to/from a comma-separated string (e.g. "1,2,5") when reading/writing the DB.
class Converters {
    @TypeConverter
    fun fromDaySet(days: Set<Int>): String = days.sorted().joinToString(",")

    @TypeConverter
    fun toDaySet(value: String): Set<Int> =
        if (value.isBlank()) emptySet()
        else value.split(",").mapNotNull { it.trim().toIntOrNull() }.toSet()
}
