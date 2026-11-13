package kr.devslab.dds.compose.component

import org.junit.Assert.assertThrows
import org.junit.Test

class SegmentedTest {
    @Test
    fun distinctValuesAreAccepted() {
        checkSegments(listOf(DdsSegment("person", "개인"), DdsSegment("shop", "비즈니스")))
        checkSegments(listOf(DdsSegment(null, "없음"), DdsSegment(1, "하나"))) // null is a value like any other
    }

    @Test
    fun noSegmentsIsAMistake() {
        assertThrows(IllegalArgumentException::class.java) { checkSegments(emptyList()) }
    }

    @Test
    fun twoSegmentsWithOneValueIsAMistake() {
        // Which one would be chosen, and which would onSelect stand for?
        assertThrows(IllegalArgumentException::class.java) {
            checkSegments(listOf(DdsSegment(1, "일"), DdsSegment(1, "하루")))
        }
    }

    @Test
    fun theSameLabelOnTwoValuesIsAllowed() {
        checkSegments(listOf(DdsSegment(1, "A"), DdsSegment(2, "A")))
    }
}
