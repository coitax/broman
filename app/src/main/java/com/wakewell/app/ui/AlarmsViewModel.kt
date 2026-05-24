package com.wakewell.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wakewell.app.alarm.AlarmScheduler
import com.wakewell.app.data.Alarm
import com.wakewell.app.data.WakeWellRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// Owns the list of alarms and keeps the Android alarm schedule in sync with the
// database whenever an alarm is added, edited, toggled, or deleted.
class AlarmsViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = WakeWellRepository.get(app)
    private val scheduler = AlarmScheduler(app)

    val alarms: StateFlow<List<Alarm>> = repo.alarms
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun setEnabled(alarm: Alarm, enabled: Boolean) {
        viewModelScope.launch {
            val updated = alarm.copy(isEnabled = enabled)
            repo.updateAlarm(updated)
            scheduler.cancel(updated.id)
            if (enabled) scheduler.schedule(updated)
        }
    }

    // Insert (id == 0) or update an alarm, then (re)arm it if it's enabled.
    fun saveAlarm(alarm: Alarm) {
        viewModelScope.launch {
            val id = if (alarm.id == 0L) {
                repo.insertAlarm(alarm)
            } else {
                repo.updateAlarm(alarm)
                alarm.id
            }
            val saved = alarm.copy(id = id)
            scheduler.cancel(saved.id)
            if (saved.isEnabled) scheduler.schedule(saved)
        }
    }

    fun delete(alarm: Alarm) {
        viewModelScope.launch {
            scheduler.cancel(alarm.id)
            repo.deleteAlarm(alarm)
        }
    }
}
