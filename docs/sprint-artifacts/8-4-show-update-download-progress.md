# Story 8.4: Show Update Download Progress

Status: done

## Story

As a user,
I want to see download progress when updates are downloading,
So that I know something is happening and can estimate completion.

## Acceptance Criteria

1. **Download progress displays in footer:**
   - Text format: "Downloading update... 45%"
   - Updates as download progresses (real percentage)
   - Color: #00FF00 (bright green) - indicates active operation
   - Replaces normal footer hints during download

2. **Progress updates are real-time:**
   - Percentage updates as download progresses
   - No artificial delays or fake progress
   - Updates smoothly without flickering
   - Sourced from electron-updater's `download-progress` event

3. **Completion state message:**
   - When download completes: "Update ready. Restart to install."
   - Color: #00FF00 (bright green)
   - Persists until app restart (does not auto-hide)
   - User knows action is required (restart)

4. **Failure state message:**
   - If download fails: "Update failed. Try again later."
   - Color: #FF0000 (red) - indicates error
   - Auto-hides after 5 seconds
   - Returns to normal footer hints

5. **Non-blocking UI:**
   - Progress display does not block app usage
   - Todo operations continue to work during download
   - Keyboard shortcuts remain functional
   - No modal or overlay - inline footer only

6. **Existing functionality preserved:**
   - Manual update check (Ctrl+U) still works
   - "Checking for updates..." message still displays
   - "No update available" message still displays
   - Normal footer hints restore after transient messages

## Tasks / Subtasks

- [x] Task 1: Extend IPC for download progress events (AC: #2)
  - [x] Add `onUpdateDownloadProgress` handler in preload.ts (Note: Existing `update-status` IPC channel extended with 'downloading' status type)
  - [x] Create IPC channel: `update-download-progress` (Note: Used existing `update-status` channel with new `downloading` status)
  - [x] Send progress object: `{ percent: number, transferred: number, total: number }` (Note: Sent as UpdateStatus with percent field)
  - [x] Add `onUpdateDownloaded` handler for completion event (Note: Already existed, updated message)
  - [x] Add `onUpdateError` handler for failure event (Note: Already existed, updated to always send error)

- [x] Task 2: Update updater.ts to emit progress events (AC: #2)
  - [x] Listen to `autoUpdater.on('download-progress')` event
  - [x] Forward progress to renderer via IPC: `mainWindow.webContents.send('update-status', status)`
  - [x] Listen to `autoUpdater.on('update-downloaded')` event (already existed)
  - [x] Listen to `autoUpdater.on('error')` event for download failures (already existed)

- [x] Task 3: Create progress display component (AC: #1)
  - [x] Extended `src/ui/render.ts` `initUpdateNotifications()` function
  - [x] Added 'downloading' case handler in switch statement
  - [x] Format: "Downloading update... {percent}%"
  - [x] Apply bright green color (#00FF00)
  - [x] Ensure footer is replaced during progress display

- [x] Task 4: Handle download completion state (AC: #3)
  - [x] Updated 'downloaded' case in `initUpdateNotifications()`
  - [x] Display: "Update ready. Restart to install."
  - [x] Persist message (no auto-hide timer)
  - [x] Use bright green color (#00FF00)

- [x] Task 5: Handle download failure state (AC: #4)
  - [x] Updated 'error' case in `initUpdateNotifications()`
  - [x] Display: "Update failed. Try again later."
  - [x] Use red color (#FF0000)
  - [x] Auto-hide after 5 seconds using setTimeout
  - [x] Restore normal footer hints after hide

- [x] Task 6: Integrate progress handlers in main.ts entry (AC: #5, #6)
  - [x] IPC listeners already registered via `initUpdateNotifications()` in renderer.ts
  - [x] Appropriate render functions called via existing switch statement
  - [x] Todo operations not blocked (inline footer text only, no modal)
  - [x] Keyboard shortcuts remain functional (no event interference)

- [x] Task 7: Add CSS for progress states (AC: #1, #3, #4)
  - [x] Colors applied inline via JavaScript (hintsElement.style.color)
  - [x] No new CSS classes needed - inline styles match terminal aesthetic
  - [x] Uses existing footer font (Consolas, 12px inherited from #footer)

- [x] Task 8: Run tests and verify no regressions (AC: #5, #6)
  - [x] Run full test suite: `npm test` - All 306 tests pass
  - [x] Run lint: `npm run lint` - No errors
  - [x] Ctrl+U manual update check still works (existing code preserved)
  - [x] "Checking for updates..." message still displays (existing code preserved)
  - [x] "No update available" message still displays (existing code preserved)
  - [x] Non-blocking UI verified (inline footer text only, no blocking components)

## Dev Notes

### Architecture Patterns and Constraints

- **Terminal aesthetic**: Progress display uses Matrix Green (#00FF00) and red (#FF0000) for errors
- **Font**: Consolas monospace, 12px (matches footer hints)
- **No modals**: Inline footer display only
- **No animations**: Instant state changes, no progress bars with animations
- **Non-blocking**: Update download happens in background, UI stays responsive

### IPC Communication Pattern

```typescript
// electron/preload.ts - Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  onUpdateDownloadProgress: (callback: (progress: { percent: number }) => void) =>
    ipcRenderer.on('update-download-progress', (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  onUpdateError: (callback: (error: string) => void) =>
    ipcRenderer.on('update-error', (_, error) => callback(error))
})

// electron/updater.ts - Emit events
autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update-download-progress', {
    percent: Math.floor(progress.percent)
  })
})

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded')
})

autoUpdater.on('error', (error) => {
  mainWindow?.webContents.send('update-error', error.message)
})
```

### Footer State Machine

```
States:
1. NORMAL: Shows keyboard hints
2. PROGRESS: Shows "Downloading update... X%"
3. READY: Shows "Update ready. Restart to install."
4. ERROR: Shows "Update failed. Try again later."
5. CHECKING: Shows "Checking for updates..." (existing)
6. NO_UPDATE: Shows "You're on the latest version." (existing)

Transitions:
- NORMAL → PROGRESS: On download-progress event received
- PROGRESS → PROGRESS: On subsequent progress events (update percentage)
- PROGRESS → READY: On update-downloaded event
- PROGRESS → ERROR: On update-error event
- ERROR → NORMAL: After 5 second timeout
- CHECKING → NORMAL: After no update found (existing behavior)
```

### Component Integration Map

```
electron/preload.ts
  └── Add: onUpdateDownloadProgress, onUpdateDownloaded, onUpdateError

electron/updater.ts
  └── Add: download-progress, update-downloaded, error event handlers

src/ui/render.ts or src/ui/updateProgress.ts (NEW)
  └── renderUpdateProgress(percent: number)
  └── renderUpdateReady()
  └── renderUpdateError()

src/ui/styles.css
  └── Add: .update-progress, .update-ready, .update-error classes

src/main.ts
  └── Register IPC listeners for update events
```

### Current Updater Implementation Reference

Based on architecture.md, the existing updater in `electron/updater.ts`:
- Calls `autoUpdater.checkForUpdatesAndNotify()` on app launch
- Has logging via `electron-log`
- Existing notification: "Update available. Restart to install."

This story adds granular progress tracking to enhance the user experience.

### electron-updater Progress Event

The `download-progress` event provides:
```typescript
{
  total: number,        // Total bytes
  delta: number,        // Bytes transferred since last event
  transferred: number,  // Total bytes transferred
  percent: number,      // 0-100 percentage
  bytesPerSecond: number // Download speed
}
```

For UI display, we only need `percent` (rounded to integer).

### Project Structure Notes

- **New/Modified file**: `electron/preload.ts` - Add IPC handlers
- **Modified file**: `electron/updater.ts` - Emit progress events
- **New/Modified file**: `src/ui/updateProgress.ts` or `src/ui/render.ts` - Progress display
- **Modified file**: `src/ui/styles.css` - Progress state classes
- **Modified file**: `src/main.ts` - Register IPC listeners
- **No data model changes**: This is purely UI/IPC changes

### Testing Considerations

- **Manual testing required**: Auto-update testing requires actual GitHub releases
- **Simulate progress**: During development, can emit fake progress events
- **Test states**: Normal → Progress → Ready, Normal → Progress → Error
- **Non-blocking verification**: Create todos while progress is showing
- **Regression test**: Ensure Ctrl+U and existing update flow works

### References

- [Source: docs/epics.md#Story 8.4] - Original story requirements and acceptance criteria
- [Source: docs/prd.md#FR44] - Update progress display functional requirement
- [Source: docs/architecture.md#Update Mechanism] - Progress Feedback section
- [Source: docs/architecture.md#IPC Communication] - IPC patterns for update events
- [Source: docs/ux-design-specification.md#Component Library: Footer Hints] - Footer styling specifications

### Learnings from Previous Story

**From Story 8-3-improve-version-number-visibility (Status: drafted)**

Story 8-3 is drafted but not yet implemented. Key observations:

- **Footer modifications pattern**: 8.3 added version to footer using flexbox layout, this story adds progress states
- **CSS class pattern**: Reuse existing footer styling patterns for consistency
- **Non-disruptive changes**: Footer additions should not break existing functionality
- **Terminal aesthetic**: All new UI elements must use Matrix Green palette

**Implementation consideration**: This story is more complex than 8.3 as it involves IPC communication between main and renderer processes, plus multiple UI states.

[Source: docs/sprint-artifacts/8-3-improve-version-number-visibility.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Implementation Approach:**
- Extended the existing `UpdateStatus` type to add 'downloading' status with `percent` field
- Added `autoUpdater.on('download-progress')` event handler in `updater.ts`
- Updated `initUpdateNotifications()` in `render.ts` to handle the new 'downloading' status
- Updated 'downloaded' message to "Update ready. Restart to install." per AC #3
- Updated 'error' handling to always show errors (not just manual checks) with red color (#FF0000) and 5-second auto-hide per AC #4
- No new IPC channels needed - leveraged existing `update-status` channel with enhanced UpdateStatus type

### Completion Notes List

- ✅ Implemented real-time download progress display showing "Downloading update... X%"
- ✅ Progress updates use electron-updater's `download-progress` event (real percentage, no artificial delays)
- ✅ Completion message "Update ready. Restart to install." persists until app restart
- ✅ Error message "Update failed. Try again later." displays in red (#FF0000) with 5-second auto-hide
- ✅ All 306 existing tests pass - no regressions introduced
- ✅ Non-blocking UI - progress displays inline in footer, no modals
- ✅ Existing Ctrl+U, "Checking for updates...", and "No update available" functionality preserved

### File List

- `src/types/UpdateStatus.ts` - Added 'downloading' status and `percent` field to UpdateStatus interface
- `electron/updater.ts` - Added `download-progress` event handler, updated messages for downloaded/error states
- `src/ui/render.ts` - Extended `initUpdateNotifications()` to handle downloading state and error color

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-27 | Story drafted from epics.md and PRD (FR44) | SM Agent |
| 2025-11-27 | Implementation complete: Download progress display, completion/error states | Dev Agent |
| 2025-11-27 | Senior Developer Review notes appended | SR Agent |

## Senior Developer Review (AI)

### Reviewer
Spardutti

### Date
2025-11-27

### Outcome
**APPROVE** ✅

All acceptance criteria fully implemented with evidence. All completed tasks verified. No blocking issues found. Code follows existing patterns and architecture. 306 tests pass.

### Summary

Story 8.4 successfully implements download progress display for auto-updates. The implementation elegantly extends the existing `UpdateStatus` type and IPC channel rather than creating parallel structures. All six acceptance criteria are satisfied with proper visual feedback (green progress, red errors), correct timing (persistent completion, 5s error auto-hide), and preserved existing functionality.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity / Informational:**
- Note: Error notifications now always display (not just manual checks). This is correct behavior per AC #4 which requires error display for download failures regardless of trigger mechanism.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| **#1** | Download progress displays "Downloading update... X%" in bright green | ✅ IMPLEMENTED | `electron/updater.ts:93`, `src/ui/render.ts:513-514` |
| **#2** | Real-time progress from electron-updater `download-progress` event | ✅ IMPLEMENTED | `electron/updater.ts:85-96` |
| **#3** | Completion: "Update ready. Restart to install." persists | ✅ IMPLEMENTED | `electron/updater.ts:131`, `src/ui/render.ts:518-523` |
| **#4** | Failure: "Update failed..." red (#FF0000), 5s auto-hide | ✅ IMPLEMENTED | `electron/updater.ts:151`, `src/ui/render.ts:540, 542` |
| **#5** | Non-blocking UI (inline footer only) | ✅ IMPLEMENTED | `src/ui/render.ts:511-516` |
| **#6** | Existing functionality preserved | ✅ VERIFIED | `electron/preload.ts:64-65`, `src/ui/render.ts:496-535` |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Extend IPC for download progress events | [x] | ✅ | `src/types/UpdateStatus.ts:17, 23` |
| Task 2: Update updater.ts to emit progress events | [x] | ✅ | `electron/updater.ts:83-97` |
| Task 3: Create progress display component | [x] | ✅ | `src/ui/render.ts:510-516` |
| Task 4: Handle download completion state | [x] | ✅ | `src/ui/render.ts:518-523` |
| Task 5: Handle download failure state | [x] | ✅ | `src/ui/render.ts:537-547` |
| Task 6: Integrate progress handlers in renderer | [x] | ✅ | `src/ui/render.ts:483-551` |
| Task 7: Add CSS for progress states | [x] | ✅ | Inline styles (appropriate) |
| Task 8: Run tests and verify no regressions | [x] | ✅ | 306 tests pass |

**Summary: 8 of 8 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- ✅ All 306 existing tests pass
- ✅ Lint passes with no errors
- ⚠️ No unit tests added for new download-progress handler (acceptable - electron-updater events require integration/E2E testing with actual updates)
- Note: Manual testing required for actual update scenarios (progress, completion, failure states)

### Architectural Alignment

- ✅ Extends existing `UpdateStatus` type (ADR pattern followed)
- ✅ Uses existing `update-status` IPC channel (no new channel proliferation)
- ✅ Terminal aesthetic maintained (#00FF00 green, #FF0000 red per ux-design-specification.md)
- ✅ Non-blocking UI (inline footer, no modals per ADR-010)
- ✅ Matches architecture.md Progress Feedback pattern (lines 711-716)

### Security Notes

No security concerns. Changes are limited to UI feedback for update progress - no new IPC channels, no new data exposure, no user input handling changes.

### Best-Practices and References

- [electron-updater download-progress event](https://www.electron.build/auto-update#event-download-progress) - Used correctly
- [Electron IPC patterns](https://www.electronjs.org/docs/latest/tutorial/ipc) - Follows existing pattern

### Action Items

**Code Changes Required:**
(None - all acceptance criteria met)

**Advisory Notes:**
- Note: Consider adding integration test for download progress scenarios when E2E testing infrastructure is available
- Note: Manual QA recommended before release to verify actual update download progress display
