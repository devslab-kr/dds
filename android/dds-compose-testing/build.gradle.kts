plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.maven.publish)
}

// What an app's device tests use to check its own screens against the screen frame
// (androidTestImplementation). Published with the other two, at the same version.
// It measures the parts :dds-compose tags (DdsTestTags); it draws nothing itself.
android {
    namespace = "kr.devslab.dds.compose.testing"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        minSdk = libs.versions.minSdk.get().toInt()
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
    explicitApi()
}

dependencies {
    api(project(":dds-compose"))
    // Named here too, so this artifact's own POM carries the version of the test rule below.
    api(platform(libs.compose.bom))
    api(libs.compose.ui.test.junit4)
    // The test rule above brings Espresso 3.5.0 through the BOM, which does not run on Android 17.
    // An app that adds this artifact gets 3.7.0 from it, as this repo's own device tests do.
    api(libs.androidx.test.espresso.core)
}

mavenPublishing {
    coordinates(artifactId = "dds-compose-testing")
    pom {
        name.set("DDS Compose Testing")
    }
}
