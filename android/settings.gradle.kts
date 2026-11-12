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

// Published: kr.devslab:dds-android-tokens, kr.devslab:dds-compose, kr.devslab:dds-compose-testing.
include(":dds-tokens")
include(":dds-compose")
include(":dds-compose-testing")
// Not published: every value and helper on screen, for visual checks.
include(":catalog")
