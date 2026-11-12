package kr.devslab.dds.compose.layout

/** Test tags on the parts of the screen frame, so device tests can find and measure them. */
public object DdsTestTags {
    /** The scrolling body column of a screen. */
    public const val Body: String = "dds-body"

    /** The title text in the top bar. */
    public const val TopBarTitle: String = "dds-top-bar-title"

    /** The navigation rail. */
    public const val Rail: String = "dds-rail"

    /** The pinned list pane. */
    public const val ListPane: String = "dds-list-pane"

    /** The bottom tabs. */
    public const val BottomTabs: String = "dds-bottom-tabs"

    /** The centered column used by sign-in style screens. */
    public const val Centered: String = "dds-centered"

    /** The area the centered column is centered in. */
    public const val CenteredArea: String = "dds-centered-area"
}
