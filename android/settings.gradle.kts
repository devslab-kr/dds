pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "dds-android"

// Published: kr.devslab:dds-android-tokens, kr.devslab:dds-compose.
include(":dds-tokens")
include(":dds-compose")
// Not published: every value and helper on screen, for visual checks.
include(":catalog")
