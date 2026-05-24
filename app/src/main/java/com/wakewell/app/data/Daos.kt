package com.wakewell.app.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

// DAO = Data Access Object: the functions used to read/write a table.

@Dao
interface UserProfileDao {
    // Flow emits a new value automatically whenever the profile changes.
    @Query("SELECT * FROM user_profile WHERE id = :id LIMIT 1")
    fun observeProfile(id: Int = UserProfile.SINGLETON_ID): Flow<UserProfile?>

    @Query("SELECT * FROM user_profile WHERE id = :id LIMIT 1")
    suspend fun getProfile(id: Int = UserProfile.SINGLETON_ID): UserProfile?

    // Insert or replace the single profile row.
    @Upsert
    suspend fun upsert(profile: UserProfile)
}

@Dao
interface AlarmDao {
    @Query("SELECT * FROM alarms ORDER BY hour, minute")
    fun observeAlarms(): Flow<List<Alarm>>

    @Query("SELECT * FROM alarms WHERE isEnabled = 1")
    suspend fun getEnabledAlarms(): List<Alarm>

    @Query("SELECT * FROM alarms WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): Alarm?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(alarm: Alarm): Long

    @Update
    suspend fun update(alarm: Alarm)

    @Delete
    suspend fun delete(alarm: Alarm)
}
