package com.wakewell.app.data

import android.content.Context
import kotlinx.coroutines.flow.Flow

// A thin layer over the DAOs. Screens talk to the repository, not Room directly,
// so storage details stay in one place.
class WakeWellRepository(
    private val profileDao: UserProfileDao,
    private val alarmDao: AlarmDao,
) {
    // ---- Profile ----
    val profile: Flow<UserProfile?> = profileDao.observeProfile()
    suspend fun getProfile(): UserProfile? = profileDao.getProfile()
    suspend fun saveProfile(profile: UserProfile) = profileDao.upsert(profile)

    // ---- Alarms ----
    val alarms: Flow<List<Alarm>> = alarmDao.observeAlarms()
    suspend fun getEnabledAlarms(): List<Alarm> = alarmDao.getEnabledAlarms()
    suspend fun getAlarm(id: Long): Alarm? = alarmDao.getById(id)
    suspend fun insertAlarm(alarm: Alarm): Long = alarmDao.insert(alarm)
    suspend fun updateAlarm(alarm: Alarm) = alarmDao.update(alarm)
    suspend fun deleteAlarm(alarm: Alarm) = alarmDao.delete(alarm)

    companion object {
        @Volatile
        private var instance: WakeWellRepository? = null

        fun get(context: Context): WakeWellRepository =
            instance ?: synchronized(this) {
                instance ?: run {
                    val db = WakeWellDatabase.get(context)
                    WakeWellRepository(db.userProfileDao(), db.alarmDao())
                        .also { instance = it }
                }
            }
    }
}
