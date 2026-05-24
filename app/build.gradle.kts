// Build configuration for the app module.
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    // KSP generates code for Room (our local database) at build time.
    alias(libs.plugins.ksp)
}

android {
    // Unique identifier for the app's package/namespace.
    namespace = "com.wakewell.app"
    // The Android API level the app is compiled against (Android 15 = API 35).
    compileSdk = 35

    defaultConfig {
        applicationId = "com.wakewell.app"
        // Oldest Android version we support: Android 8.0 (API 26).
        minSdk = 26
        // The Android version we target/test against: latest stable (API 35).
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            // No code shrinking for now to keep things simple and debuggable.
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        // Turn on Jetpack Compose (our UI toolkit).
        compose = true
    }
}

dependencies {
    // Core Android + lifecycle helpers.
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Jetpack Compose, version-aligned via the BOM (Bill of Materials).
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)

    // Moving between screens.
    implementation(libs.androidx.navigation.compose)

    // Room: the on-device database for the user's profile and alarms.
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Tooling for Compose previews inside Android Studio (debug builds only).
    debugImplementation(libs.androidx.ui.tooling)

    // Plain JVM unit tests (e.g. the sleep-cycle math).
    testImplementation("junit:junit:4.13.2")
}
