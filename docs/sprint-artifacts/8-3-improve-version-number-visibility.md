# Story 8.3: Improve Version Number Visibility

Status: drafted

## Story

As a user,
I want to see the app version clearly,
So that I know which version I'm running.

## Acceptance Criteria

1. **Version location in footer:**
   - Version number displayed in bottom-right corner of footer area
   - Positioned after keyboard shortcut hints
   - Does not overlap or compete with shortcut hints

2. **Version format:**
   - Display format: "v1.2.3" (prefix "v" + semver)
   - Version string sourced from package.json (single source of truth)
   - No additional text (just version number)

3. **Version styling matches terminal aesthetic:**
   - Font: Same as footer hints (Consolas 12px monospace)
   - Color: #008800 (dimmed green, matches footer hints)
   - Readable but not prominent (smaller, de-emphasized)
   - No bold, no hover effects

4. **Version is readable under all conditions:**
   - Sufficient contrast against black background (#000000)
   - Does not compete visually with primary shortcuts hints
   - Clear separation from hints (space or delimiter)

5. **No disruption to existing UI:**
   - Footer layout unchanged (hints on left, version on right)
   - Keyboard shortcuts hints remain fully visible
   - Confirmation prompts can still replace footer content temporarily

6. **Improved todo item hover/selection highlight:**
   - Background color changed from `#001100` to `#002200` for better visibility
   - Both mouse hover and keyboard selection (arrow keys) use same styling
   - Highlight is visible but not distracting (maintains terminal aesthetic)
   - Works on both active and completed todo items

## Tasks / Subtasks

- [ ] Task 1: Create version display utility (AC: #2)
  - [ ] Create `src/utils/version.ts` with `getAppVersion()` function
  - [ ] Read version from package.json via Electron API or import
  - [ ] Return formatted string: `v${version}` (e.g., "v1.1.0")
  - [ ] Add unit test for version formatting

- [ ] Task 2: Update footer rendering to include version (AC: #1, #5)
  - [ ] Modify `src/ui/render.ts` or `src/ui/components.ts` footer rendering
  - [ ] Add version span element positioned at right side of footer
  - [ ] Use CSS flexbox: `justify-content: space-between` for hints left, version right
  - [ ] Verify footer layout with long hints string

- [ ] Task 3: Apply version styling (AC: #3, #4)
  - [ ] Add CSS class `.version-indicator` in `src/ui/styles.css`
  - [ ] Style: `font-size: 12px`, `color: #008800`, `font-family: Consolas, monospace`
  - [ ] Ensure no margin/padding conflicts with existing footer styles
  - [ ] Verify contrast ratio meets accessibility standards (7.2:1 for #008800 on #000000)

- [ ] Task 4: Test version visibility in different states (AC: #4, #5)
  - [ ] Verify version visible in normal footer state (with hints)
  - [ ] Verify version behavior during confirmation prompts
  - [ ] Test with window at minimum width (400px) - no text overlap
  - [ ] Test with long keyboard hints string

- [ ] Task 5: Verify version source is package.json (AC: #2)
  - [ ] Manually update package.json version, rebuild, verify UI shows new version
  - [ ] Verify version matches `npm version` output
  - [ ] Document the version source in code comments

- [ ] Task 6: Run tests and verify no regressions (AC: #5)
  - [ ] Run full test suite: `npm test`
  - [ ] Verify all existing footer tests still pass
  - [ ] Verify keyboard shortcuts still function correctly
  - [ ] No visual regressions in footer area

- [ ] Task 7: Update todo item hover/selection styling (AC: #6)
  - [ ] Change `.todo-item:hover` background from `#001100` to `#002200` in `src/ui/styles.css`
  - [ ] Change `.todo-item.selected` background from `#001100` to `#002200`
  - [ ] Verify highlight is visible on both active and completed todos
  - [ ] Test keyboard navigation (arrow keys) shows visible highlight
  - [ ] Test mouse hover shows same highlight as keyboard selection

## Dev Notes

### Architecture Patterns and Constraints

- **Terminal aesthetic**: Version display must use Matrix Green palette (#008800 dimmed green)
- **Font**: Consolas monospace, 12px (same as footer hints)
- **Layout**: Footer uses flexbox, version goes at flex-end (right side)
- **No animations**: Instant render, no transitions
- **Minimal footprint**: Version is de-emphasized, not a focal point

### Implementation Approach

**Option A: Direct import (Recommended)**
```typescript
// src/utils/version.ts
import { version } from '../../package.json'

export const getAppVersion = (): string => `v${version}`
```

**Option B: Electron API**
```typescript
// If import doesn't work, use Electron's app.getVersion()
// Requires IPC if called from renderer
const version = await window.electronAPI.getAppVersion()
```

**Footer Layout Update:**
```html
<footer class="footer-hints">
  <span class="hints">Enter: Save | Space: Toggle | ...</span>
  <span class="version-indicator">v1.1.0</span>
</footer>
```

```css
.footer-hints {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* existing styles */
}

.version-indicator {
  font-size: 12px;
  color: #008800;
  font-family: 'Consolas', 'Courier New', monospace;
}
```

### Component Integration Map

```
src/utils/version.ts (NEW)
  └── getAppVersion(): string - returns formatted version

src/ui/render.ts
  └── renderFooter() or equivalent
      └── Change: Add version span to footer element

src/ui/styles.css
  └── Add: .version-indicator class
  └── Change: .todo-item:hover background #001100 → #002200
  └── Change: .todo-item.selected background #001100 → #002200

package.json
  └── Source: version field (single source of truth)
```

### Current Footer Implementation Reference

The footer currently displays keyboard hints at the bottom of the window:
- Border-top: 1px solid #004400 (dark green separator)
- Font-size: 12px
- Color: #008800 (dimmed green)
- Content: `Enter: Save | Space: Toggle | Ctrl+D: Delete All | ...`

Version should match this styling but be positioned at the right edge.

### Hover/Selection Highlight Improvement

**Current state** (in `src/ui/styles.css`):
```css
.todo-item:hover {
  background: #001100;  /* Very subtle, hard to see */
}

.todo-item.selected {
  background: #001100;  /* Same as hover */
}
```

**Improved state**:
```css
.todo-item:hover {
  background: #002200;  /* Brighter for better visibility */
}

.todo-item.selected {
  background: #002200;  /* Same as hover (user preference) */
}
```

**Rationale**:
- `#001100` is too subtle against the black background
- `#002200` is brighter but still maintains terminal aesthetic
- Both hover and selection use the same styling (user preference)
- If `#002200` is still too subtle during testing, can increase to `#003300`

### Project Structure Notes

- **New file**: `src/utils/version.ts` - utility function for version string
- **Modified file**: `src/ui/render.ts` - footer rendering
- **Modified file**: `src/ui/styles.css` - version indicator class + hover/selection highlight update
- **No schema changes**: No data model changes required
- **No IPC changes**: If using direct import (Option A)

### Testing Considerations

- **Unit test**: `version.test.ts` - verify getAppVersion() returns correct format
- **Visual verification**: Manual check that version is visible and readable
- **Layout test**: Verify no overlap at minimum window width (400px)
- **Regression test**: Existing footer/keyboard tests should pass
- **Hover highlight test**: Manual verification of highlight visibility during arrow key navigation
- **Selection visibility test**: Verify highlight is visible on both active and completed todos

### References

- [Source: docs/epics.md#Story 8.3] - Original story requirements and acceptance criteria
- [Source: docs/prd.md#FR43] - Version visibility functional requirement
- [Source: docs/architecture.md#Project Structure] - File organization patterns
- [Source: docs/ux-design-specification.md#Component Library: Footer Hints] - Footer styling specifications
- [Source: docs/ux-design-specification.md#Color System] - #008800 dimmed green semantic usage
- [Source: CLAUDE.md] - Function naming conventions

### Learnings from Previous Story

**From Story 8-2 (Status: drafted)**

Story 8-2 is drafted but not yet implemented. Key observations from the drafted story:

- **Simple changes have big UX impact**: Story 8.2 is a single method change (push→unshift), and 8.3 is similarly simple (add version to footer)
- **Test coverage pattern**: 8.2 defines 6 tasks with testing subtasks - follow similar granularity
- **Architecture docs reference**: Both stories reference architecture.md for existing patterns
- **No dependencies between 8.1/8.2/8.3**: These Polish stories are independent of each other

**Implementation note**: This is one of the simpler stories in Epic 8 - adding a small UI element to an existing component.

[Source: docs/sprint-artifacts/8-2-new-todos-appear-at-top-of-list.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-27 | Story drafted from epics.md and PRD (FR43) | SM Agent |
| 2025-11-27 | Added AC #6 and Task 7 for hover/selection highlight improvement | SM Agent |
