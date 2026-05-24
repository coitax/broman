package com.wakewell.app.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

// The Room database that holds everything locally on the phone.
// SleepLog (Phase 2) will be added here later.
@Database(
    entities = [UserProfile::class, Alarm::class],
    version = 1,
    exportSchema = false,
)
@TypeConverters(Converters::class)
abstract class WakeWellDatabase : RoomDatabase() {
    abstract fun userProfileDao(): UserProfileDao
    abstract fun alarmDao(): AlarmDao

    companion object {
        @Volatile
        private var instance: WakeWellDatabase? = null

        // Returns one shared database for the whole app (created on first use).
        fun get(context: Context): WakeWellDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    WakeWellDatabase::class.java,
                    "wakewell.db",
                ).build().also { instance = it }
            }
    }
}
