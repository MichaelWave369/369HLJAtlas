# HLJ-009A: Navigation cleanup

Eleven former top-bar links are reorganized as Explore (direct), Discover (Constellation, Crossroads, Shasta Institute), Research (Research Library, Verify Claims, Source Audit, Living Lab), Labs (Lab Bridge, Laboratories), and Our Promise (direct). GitHub Source remains available outside the group or inside the narrow-mobile menu.

Native details/summary groups work with keyboard and pointer. JavaScript closes other open groups, handles Escape and outside clicks, and synchronizes the mobile Menu button's aria-expanded state at <=960px. All eleven anchor IDs are preserved.

Node checks verify anchor and group coverage, while the existing Chrome interaction harness now tests desktop dropdown navigation plus narrow-mobile Menu, nested Labs, Escape dismissal, and link dismissal. Manual review is still needed for touch and assistive-technology behavior on physical devices.
