plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.maven.publish)
}

// Theme and motion on top of Material3. Every color, size and duration comes
// from :dds-tokens; nothing here may carry a literal of its own
// (scripts/check-android-sources.mjs).
android {
    namespace = "kr.devslab.dds.compose"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        minSdk = libs.versions.minSdk.get().toInt()
        // Device tests read what a screen reader is given (src/androidTest). They need an
        // emulator or a phone, so CI does not run them: ./gradlew :dds-compose:connectedDebugAndroidTest
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
    }
    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
    explicitApi()
}

dependencies {
    api(project(":dds-tokens"))
    api(platform(libs.compose.bom))
    api(libs.compose.ui)
    api(libs.compose.foundation)
    api(libs.compose.animation)
    api(libs.compose.material3)
    implementation(libs.lifecycle.runtime.compose)
    api(libs.activity.compose)

    testImplementation(libs.junit)

    androidTestImplementation(libs.compose.ui.test.junit4)
    androidTestImplementation(libs.compose.ui.test.junit4.accessibility)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.ext.junit)
    // The apps change screens with Navigation 3; the screen change is measured inside it.
    androidTestImplementation(libs.navigation3.runtime)
    androidTestImplementation(libs.navigation3.ui)
    debugImplementation(libs.compose.ui.test.manifest)
}

mavenPublishing {
    coordinates(artifactId = "dds-compose")
    pom {
        name.set("DDS Compose")
    }
}
