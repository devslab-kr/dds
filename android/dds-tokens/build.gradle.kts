plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.maven.publish)
}

// Values only — no Compose. The splash theme is drawn from XML before Compose
// exists, so the colors it needs must not sit behind a Compose dependency.
// Everything under src/main is written by scripts/generate-android-tokens.mjs.
android {
    namespace = "kr.devslab.dds.tokens"
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
}

dependencies {
    testImplementation(libs.junit)
}

mavenPublishing {
    coordinates(artifactId = "dds-android-tokens")
    pom {
        name.set("DDS Android Tokens")
    }
}
