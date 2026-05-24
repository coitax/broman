// Root build file. These plugins are declared here (apply false) so the
// versions are shared, then actually applied in the app module's build file.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
