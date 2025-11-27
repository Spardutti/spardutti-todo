# Story 8.5: Remove ESC Keyboard Shortcut

Status: done

## Story

As a user,
I want the non-functional ESC shortcut removed,
So that I'm not confused by dead keyboard shortcuts.

## Acceptance Criteria

1. **ESC no longer registered for "close app":**
   - ESC keyboard shortcut is unregistered from KeyboardManager
   - ESC no longer appears in footer hints
   - Pressing ESC does not close the app window

2. **Contextual ESC behavior preserved:**
   - ESC still cancels active confirmations (Ctrl+D delete prompt)
   - ESC still cancels project search (Ctrl+P search mode)
   - These contextual handlers remain in respective UI modules

3. **Footer hints updated:**
   - Footer hints no longer show "Esc:Cancel" or similar
   - Only active shortcuts displayed
   - Dynamic hints via `keyboardManager.getHints()` reflect removal

4. **Ctrl+Q remains quit shortcut:**
   - Ctrl+Q continues to work for quitting the app
   - No change to Ctrl+Q behavior
   - User has explicit, intentional quit action

5. **No dead shortcut registration:**
   - KeyboardManager no longer has 'escape' key registered
   - No hint label generated for ESC
   - Clean keyboard handler state

## Tasks / Subtasks

- [x] Task 1: Remove ESC shortcut registration from renderer.ts (AC: #1, #5)
  - [x] Delete `keyboardManager.register('escape', ...)` call
  - [x] Verify ESC no longer handled by KeyboardManager
  - [x] Confirm contextual ESC (confirmations) still works via showConfirmation()

- [x] Task 2: Verify contextual ESC handlers remain (AC: #2)
  - [x] Test: Ctrl+D shows confirmation, ESC cancels it
  - [x] Test: Ctrl+P opens project search, ESC cancels it
  - [x] Confirm handlers in showConfirmation() and projectSearch.ts unchanged

- [x] Task 3: Verify footer hints update automatically (AC: #3)
  - [x] Check `keyboardManager.getHints()` no longer includes ESC
  - [x] Verify footer displays without ESC hint
  - [x] Confirm dynamic hint generation reflects removal

- [x] Task 4: Verify Ctrl+Q still works (AC: #4)
  - [x] Test Ctrl+Q closes the app
  - [x] No change to quit behavior

- [x] Task 5: Run existing tests (AC: all)
  - [x] Run `npm test` to verify no regressions
  - [x] All 306 existing tests pass
  - [x] No keyboard-related test failures

## Dev Notes

### Architecture Patterns and Constraints

- **KeyboardManager Pattern**: Remove registration, hints auto-update
- **Contextual Handlers**: showConfirmation() has its own ESC listener
- **Fire-and-Forget**: No cascading changes needed
- **Terminal Aesthetic**: Clean, minimal footer hints

### Component Integration Map

```
src/renderer.ts
  └── Remove: keyboardManager.register('escape', ..., 'Cancel')

src/keyboard/KeyboardManager.ts
  └── No changes needed (registration just removed)

src/ui/render.ts → showConfirmation()
  └── Has own ESC handler for canceling confirmations (unchanged)

src/ui/projectSearch.ts
  └── Has own ESC handler for canceling search (unchanged)
```

### Current ESC Handler (to be removed)

```typescript
// Lines 605-614 in src/renderer.ts - DELETE THIS
keyboardManager.register('escape', () => {
  // Only priority: Cancel confirmation if showing
  if (isConfirmationShowing) {
    // Cancel confirmation - state will be cleared by cancel callback
    return false // Allow showConfirmation's Esc handler to run
  }

  // No other actions (no input blur, no window close)
  return true // Event handled (do nothing)
}, 'Cancel')
```

### Why Remove ESC?

From Story 4.6, ESC was already simplified to only cancel confirmations. The global ESC registration is now redundant because:
1. `showConfirmation()` has its own ESC listener that handles cancellation
2. `projectSearch.ts` has its own ESC listener for search cancellation
3. The global registration just passes through to these handlers
4. The "Cancel" hint in footer is confusing when ESC does nothing in normal state

### References

- [Source: docs/architecture.md#Keyboard Shortcuts] - Removed shortcuts section
- [Source: docs/epics.md#Story 8.5] - Original story requirements
- [Source: docs/epics.md#Story 4.6] - ESC simplification (prerequisite context)
- [Source: src/renderer.ts#605-614] - Current ESC handler to remove

### Learnings from Previous Story

**From Story 4.6 (Status: done)**

Story 4.6 simplified the ESC handler to only cancel confirmations. This story completes that cleanup by removing the registration entirely since contextual handlers already exist.

Key notes:
- ESC handler was simplified per Story 4.6 AC #5
- Current code returns `false` to let showConfirmation's handler run
- This is redundant - just remove the global registration

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

- Removed ESC shortcut registration from renderer.ts lines 602-614
- Verified showConfirmation() in render.ts:275-288 has its own ESC handler
- Verified projectSearch.ts:120-130 has its own ESC handler
- KeyboardManager.getHints() dynamically generates hints from _shortcuts Map
- Ctrl+Q registration unchanged at renderer.ts:556-559

### Completion Notes List

- ✅ Removed global ESC shortcut registration (`keyboardManager.register('escape', ...)`) from renderer.ts
- ✅ Contextual ESC handlers remain functional: showConfirmation() and projectSearch.ts have independent keyboard listeners
- ✅ Footer hints automatically exclude ESC since getHints() iterates over registered shortcuts only
- ✅ Ctrl+Q quit shortcut unchanged and operational
- ✅ All 306 tests pass with no regressions

### File List

- `src/renderer.ts` - Removed ESC shortcut registration (lines 602-614 deleted)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-27 | Story drafted from epics.md (FR45) | SM Agent |
| 2025-11-27 | Implementation complete - removed ESC global registration | Dev Agent |
| 2025-11-27 | Senior Developer Review notes appended | SM Agent |

---

## Senior Developer Review (AI)

### Reviewer
Spardutti

### Date
2025-11-27

### Outcome
**✅ APPROVE**

All acceptance criteria implemented, all tasks verified, no issues found.

### Summary

Clean, minimal implementation that removes the redundant global ESC shortcut registration from `renderer.ts`. The contextual ESC handlers in `showConfirmation()`, `projectSearch.ts`, `projectDropdown.ts`, and `projectNameInput.ts` remain functional as independent keyboard listeners. Footer hints automatically exclude ESC since `getHints()` generates hints dynamically from registered shortcuts only.

### Key Findings

**No findings.** Implementation is correct and complete.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | ESC no longer registered for "close app" | ✅ IMPLEMENTED | `src/renderer.ts` - No `keyboardManager.register('escape', ...)` found |
| AC2 | Contextual ESC behavior preserved | ✅ IMPLEMENTED | `src/ui/render.ts:280`, `src/ui/projectSearch.ts:124`, `src/ui/projectDropdown.ts:221`, `src/ui/projectNameInput.ts:103` |
| AC3 | Footer hints updated | ✅ IMPLEMENTED | `src/renderer.ts:631-638` - dynamic hints from `getHints()` |
| AC4 | Ctrl+Q remains quit shortcut | ✅ IMPLEMENTED | `src/renderer.ts:556-559` - unchanged |
| AC5 | No dead shortcut registration | ✅ IMPLEMENTED | No 'escape' registration in renderer.ts |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Remove ESC shortcut registration | Complete | ✅ VERIFIED | No 'escape' in renderer.ts |
| Task 2: Verify contextual ESC handlers remain | Complete | ✅ VERIFIED | Multiple files have independent handlers |
| Task 3: Verify footer hints update automatically | Complete | ✅ VERIFIED | `getHints()` generates from registered shortcuts |
| Task 4: Verify Ctrl+Q still works | Complete | ✅ VERIFIED | `src/renderer.ts:556-559` unchanged |
| Task 5: Run existing tests | Complete | ✅ VERIFIED | 306 tests pass |

**Summary: 19 of 19 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- ✅ Existing tests cover contextual ESC handlers (projectNameInput.test.ts, projectDropdown.test.ts)
- ✅ KeyboardManager tests don't depend on ESC registration
- ✅ All 306 tests pass with no regressions

### Architectural Alignment

- ✅ Follows KeyboardManager pattern (remove registration, hints auto-update)
- ✅ Aligned with FR45 requirements in architecture.md
- ✅ No architecture violations

### Security Notes

No security concerns - this is a removal of functionality, no new attack surface.

### Best-Practices and References

- [Electron Keyboard Shortcuts](https://www.electronjs.org/docs/latest/tutorial/keyboard-shortcuts)
- Terminal aesthetic: minimal, purposeful keyboard shortcuts only

### Action Items

**No action items required.** Story approved for completion.
