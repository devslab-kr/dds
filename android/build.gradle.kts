import com.vanniktech.maven.publish.MavenPublishBaseExtension

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.maven.publish) apply false
}

// The web token package these values were generated from. Read at build time
// for the POM only: it changes on every web release, so it is not baked into a
// committed file (the token content hash in DdsTokensInfo identifies the source).
val ddsTokensVersion: String = groovy.json.JsonSlurper()
    .parse(rootDir.resolve("../packages/dds-tokens/package.json"))
    .let { (it as Map<*, *>)["version"] as String }

// Shared by the two published modules (kr.devslab:dds-android-tokens, kr.devslab:dds-compose).
subprojects {
    plugins.withId("com.vanniktech.maven.publish") {
        extensions.configure<MavenPublishBaseExtension> {
            publishToMavenCentral()
            // Sign only where a key is supplied (the release workflow). Local
            // publishToMavenLocal works without one.
            if (providers.gradleProperty("signingInMemoryKey").isPresent) signAllPublications()

            pom {
                description.set(
                    "DDS (DevsLab Design System) for Android. Generated from @devslab/dds-tokens $ddsTokensVersion.",
                )
                url.set("https://github.com/devslab-kr/dds")
                inceptionYear.set("2026")
                licenses {
                    license {
                        name.set("DevsLab Source-Available License 1.0")
                        url.set("https://github.com/devslab-kr/dds/blob/main/LICENSE")
                        distribution.set("repo")
                    }
                }
                developers {
                    developer {
                        id.set("devslab-kr")
                        name.set("DevsLab")
                        url.set("https://devslab.kr")
                    }
                }
                scm {
                    url.set("https://github.com/devslab-kr/dds")
                    connection.set("scm:git:https://github.com/devslab-kr/dds.git")
                    developerConnection.set("scm:git:ssh://git@github.com/devslab-kr/dds.git")
                }
            }
        }
    }
}
