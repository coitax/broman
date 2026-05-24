package com.wakewell.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wakewell.app.data.Chronotype
import com.wakewell.app.data.UserProfile
import com.wakewell.app.data.WakeWellRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// Three possible states when the app starts: still reading the DB, no profile
// yet (show onboarding), or a saved profile (show the app).
sealed interface OnboardingState {
    data object Loading : OnboardingState
    data object NeedsOnboarding : OnboardingState
    data class Ready(val profile: UserProfile) : OnboardingState
}

// Owns the user's profile: exposes it to the UI and saves changes.
class ProfileViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = WakeWellRepository.get(app)

    val state: StateFlow<OnboardingState> = repo.profile
        .map { profile ->
            if (profile == null) OnboardingState.NeedsOnboarding
            else OnboardingState.Ready(profile)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), OnboardingState.Loading)

    fun completeOnboarding(
        latencyMin: Int,
        targetCycles: Int,
        cycleLengthMin: Int,
        chronotype: Chronotype,
    ) {
        viewModelScope.launch {
            repo.saveProfile(
                UserProfile(
                    sleepLatencyMin = latencyMin,
                    targetCycles = targetCycles,
                    cycleLengthMin = cycleLengthMin,
                    chronotype = chronotype.name,
                ),
            )
        }
    }

    fun saveProfile(profile: UserProfile) {
        viewModelScope.launch { repo.saveProfile(profile) }
    }
}
