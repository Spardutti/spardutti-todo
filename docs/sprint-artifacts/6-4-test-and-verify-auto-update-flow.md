# Story 6.4: Test and Verify Auto-Update Flow

Status: ready-for-dev

## Story

As a developer,
I want to verify the complete auto-update flow works end-to-end,
So that users can reliably receive updates.

## Acceptance Criteria

1. **Successful update flow end-to-end (AC10)**
   - GIVEN version 0.1.0 is installed and version 0.2.0 is on GitHub Releases
   - WHEN I launch the app on v0.1.0
   - THEN the update check runs automatically
   - AND the update downloads in the background
   - AND notification appears: "Update available. Restart to install."
   - AND when I close the app, it updates to v0.2.0
   - AND the app relaunches with v0.2.0
   - AND all todos persist correctly (no data loss)

2. **No update available scenario (AC11)**
   - GIVEN I'm on the latest version
   - WHEN I launch the app
   - THEN the update check runs
   - AND no notification appears (silent)
   - AND the app continues normally
   - AND logs show "Update not available" (electron-log)

3. **Offline mode scenario (AC12)**
   - GIVEN I have no internet connection
   - WHEN I launch the app
   - THEN the update check fails silently
   - AND no error notification appears
   - AND the app continues normally (offline-first design)
   - AND the error is logged in electron-log

4. **Manual check verification (AC13)**
   - GIVEN the app is running
   - WHEN I press Ctrl+U
   - THEN the footer shows "Checking for updates..."
   - AND the appropriate result message appears based on availability
   - AND the message auto-hides after 3 seconds (for no-update/error results)

5. **Update events logged correctly (AC14)**
   - GIVEN update operations occur
   - WHEN I check %APPDATA%/spardutti-todo/logs/main.log
   - THEN I see logged events:
     - "Checking for updates..."
     - "Update available: [version]" OR "Update not available"
     - "Update downloaded: [version]"
     - OR "Update error: [error message]" (if failed)
   - AND logs include timestamps and context information

6. **TOON data persistence through update**
   - GIVEN I have 10+ todos (mix of active and completed)
   - WHEN I update from v0.1.0 to v0.2.0
   - THEN all todos remain intact after update
   - AND completion states are preserved
   - AND todo text and timestamps are unchanged
   - AND todos.toon file is not corrupted

7. **Version number updates correctly**
   - GIVEN the update completes successfully
   - WHEN I check the app version (via About or package.json)
   - THEN the version number reflects the new version (0.2.0)
   - AND GitHub Releases page shows the version as downloaded

## Tasks / Subtasks

- [ ] Create test GitHub Release for update verification (AC: #1, #2)
  - [ ] Bump version in package.json to test version (e.g., 1.0.1 or 1.0.2)
  - [ ] Build installer with `npm run make`
  - [ ] Create GitHub Release with .exe and latest.yml
  - [ ] Tag release appropriately (v1.0.1 or pre-release for testing)
  - [ ] Verify latest.yml contains correct SHA512 hash and version

- [ ] Test successful update flow (AC: #1, #6)
  - [ ] Install older version (current v1.0.0 or v1.0.1)
  - [ ] Create multiple todos (5+ active, 3+ completed)
  - [ ] Launch app with newer version available on GitHub
  - [ ] Verify "Update available. Downloading..." notification appears
  - [ ] Wait for download to complete
  - [ ] Verify "Update available. Restart to install." appears
  - [ ] Close app and verify update installs
  - [ ] Verify app relaunches with new version
  - [ ] Verify all todos are intact (count, text, completion states)

- [ ] Test no update available scenario (AC: #2)
  - [ ] Ensure app version matches latest GitHub Release
  - [ ] Launch app
  - [ ] Verify no update notification appears in footer
  - [ ] Check logs: Should contain "Update not available" entry
  - [ ] Verify app functions normally (create, toggle, delete todos)

- [ ] Test offline mode scenario (AC: #3)
  - [ ] Disable network connection (WiFi off or network adapter disabled)
  - [ ] Launch app
  - [ ] Verify no error notification appears to user
  - [ ] Verify app launches normally with existing todos
  - [ ] Check logs: Should contain "Update error" with network-related message
  - [ ] Verify all todo operations work offline

- [ ] Test manual update check (AC: #4)
  - [ ] With update available: Press Ctrl+U, verify "Update available" flow
  - [ ] With no update available: Press Ctrl+U, verify "You're on the latest version." (auto-hides)
  - [ ] With network disabled: Press Ctrl+U, verify "Update check failed. Try again later." (auto-hides)
  - [ ] Verify keyboard hints restore after 3 seconds

- [ ] Verify logging output (AC: #5)
  - [ ] Locate log file: %APPDATA%/spardutti-todo/logs/main.log
  - [ ] Trigger update check (launch or Ctrl+U)
  - [ ] Open log file in text editor
  - [ ] Verify presence of:
    - [ ] "Checking for updates..." entry with timestamp
    - [ ] "Update available: [version]" OR "Update not available" entry
    - [ ] "Update downloaded: [version]" (if update was downloaded)
    - [ ] Error entries with stack traces (if errors occurred)
  - [ ] Verify log format is readable and includes context

- [ ] Test TOON data persistence (AC: #6)
  - [ ] Create comprehensive test data:
    - [ ] 5+ active todos with various text lengths
    - [ ] 3+ completed todos
    - [ ] Verify todos.toon exists in %APPDATA%/spardutti-todo/
  - [ ] Trigger update flow
  - [ ] After update completes:
    - [ ] Verify todo count is unchanged
    - [ ] Verify all todo text is unchanged
    - [ ] Verify completion states are correct
    - [ ] Verify timestamps are preserved
    - [ ] Open todos.toon in text editor to verify format

- [ ] Test version number display (AC: #7)
  - [ ] Before update: Note current version number
  - [ ] After update: Verify version reflects new version
  - [ ] Check package.json in installed location matches expected version
  - [ ] Optional: Add version display to app UI (footer or title bar)

- [ ] Document test results
  - [ ] Create test log with pass/fail for each scenario
  - [ ] Screenshot any unexpected behaviors
  - [ ] Document any edge cases discovered
  - [ ] Update story file with completion notes

- [ ] Verify TypeScript and linting passes
  - [ ] Run `npm run lint` - expect 0 errors
  - [ ] Run TypeScript compilation - ensure no type errors
  - [ ] Fix any issues discovered during testing

## Dev Notes

### Requirements from Tech Spec and Epics

**From tech-spec-epic-6.md (Acceptance Criteria AC10-AC14):**

Story 6.4 is the verification and testing story for the complete auto-update system. It validates that all components work together end-to-end:

- **AC10 (Successful Update Flow):** Complete update cycle from check → download → install → relaunch → data persistence
- **AC11 (No Update Available):** Silent operation when already on latest version
- **AC12 (Offline Mode):** Graceful degradation with network unavailable (offline-first design)
- **AC13 (Manual Check):** Ctrl+U works correctly with all result types
- **AC14 (Logging):** electron-log captures all update events for debugging

[Source: docs/sprint-artifacts/tech-spec-epic-6.md#Acceptance-Criteria:553-593]

**From epics.md (Story 6.4:1449-1500):**

This is the final story in Epic 6, focused on end-to-end verification of the auto-update system. The story validates:

- All FRs for Epic 6: FR22 (auto-check), FR23 (auto-download/install), FR24 (manual check), FR25 (notifications)
- Integration with GitHub Releases infrastructure
- Data persistence through update cycles
- Logging and debugging support for user troubleshooting

[Source: docs/epics.md#Story-6.4:1449-1500]

### Architecture Alignment

**From architecture.md (Deployment Architecture → Release Process):**

The release process for testing auto-updates involves:

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Build and package
npm run make

# 3. Create GitHub Release
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes "Release notes..." \
  out/make/squirrel.windows/x64/*.exe \
  out/make/squirrel.windows/x64/latest.yml

# 4. Users auto-update
```

**Key Files for Release:**
- `.exe` installer: Generated by Electron Forge, uploaded to GitHub Release
- `latest.yml`: Metadata file with SHA512 hash, version, and download URL
- Both files must be in the same GitHub Release for electron-updater to work

[Source: docs/architecture.md#Deployment-Architecture:632-652]

### Learnings from Previous Story

**From Story 6.3: Implement Manual Update Check Fallback (Status: done)**

Story 6.3 completed the implementation of the manual update check mechanism. All infrastructure is now in place for Story 6.4 testing:

**Infrastructure Ready:**
- Automatic update check on launch (Story 6.1)
- Background download and notification (Story 6.2)
- Manual check with Ctrl+U (Story 6.3)
- Debouncing and error handling (Story 6.3)
- IPC communication layer (Stories 6.1-6.3)
- Footer notification system (Stories 6.2-6.3)
- Logging via electron-log (Stories 6.1-6.3)

**Story 6.4 Focus:**
- End-to-end testing with real GitHub Releases
- Verification that all components work together
- Data persistence validation through update cycles
- Documentation of test results and edge cases

[Source: docs/sprint-artifacts/6-3-implement-manual-update-check-fallback.md#Completion-Notes:561-594]

### Testing Strategy from Tech Spec

**From tech-spec-epic-6.md (Test Strategy Summary):**

Story 6.4 focuses on end-to-end and manual testing of the complete update system:

**Test Scenarios (from tech spec lines 860-867):**

1. **Successful Update:**
   - Publish new version to GitHub Releases with .exe and latest.yml
   - Launch app on older version
   - Verify: check runs → download completes → notification appears → install on close → relaunch with new version

2. **No Update Available:**
   - Launch app with latest version
   - Verify: check runs → no notification → app continues normally

3. **Offline Mode:**
   - Disable internet connection
   - Launch app
   - Verify: check fails silently → app continues normally

4. **Manual Update Check:**
   - Press Ctrl+U
   - Verify: footer shows status → appropriate result message

**E2E Test Environment:**
- Real GitHub Releases (use pre-release/beta tags for testing)
- Test with actual data (todos.toon with 10+ entries)
- Verify data persistence after update

[Source: docs/sprint-artifacts/tech-spec-epic-6.md#Test-Strategy-Summary:856-875]

### GitHub Release Setup

**Pre-requisites for Testing:**
- GitHub repository must have Releases enabled
- Repository must be public (or use GitHub token for private repos)
- `package.json` must have correct `repository` field:
  ```json
  {
    "repository": {
      "type": "git",
      "url": "https://github.com/[username]/spardutti-todo.git"
    }
  }
  ```

**Release Creation Steps:**
1. Increment version in `package.json` (e.g., from "1.0.0" to "1.0.1")
2. Run `npm run make` to generate installer
3. Locate files in `out/make/squirrel.windows/x64/`:
   - `spardutti-todo-[version] Setup.exe`
   - `RELEASES` file
   - `spardutti-todo-[version]-full.nupkg`
4. Create GitHub Release:
   - Tag: `v1.0.1`
   - Title: `v1.0.1`
   - Upload: Setup.exe and RELEASES file
5. Optionally mark as pre-release for testing

### Data Persistence Verification

**What to Check After Update:**
- Todo count matches pre-update count
- All todo text is preserved exactly
- Completion states (active/completed) are correct
- Timestamps (createdAt) are unchanged
- todos.toon file format is valid (parseable by app)

**Verification Process:**
1. Before update: Screenshot or note todo list contents
2. After update: Compare against pre-update state
3. Open `%APPDATA%/spardutti-todo/todos.toon` in text editor
4. Verify TOON format is valid and data matches UI

### Log File Location and Format

**Log Location:**
- Windows: `%APPDATA%/spardutti-todo/logs/main.log`
- Full path example: `C:\Users\[Username]\AppData\Roaming\spardutti-todo\logs\main.log`

**Expected Log Entries:**
```
[2025-11-25 10:00:00.000] [info] Checking for updates...
[2025-11-25 10:00:01.234] [info] Update available: 1.0.1
[2025-11-25 10:00:30.567] [info] Update downloaded: 1.0.1
```

Or for no update:
```
[2025-11-25 10:00:00.000] [info] Checking for updates...
[2025-11-25 10:00:01.234] [info] Update not available: 1.0.0
```

Or for errors:
```
[2025-11-25 10:00:00.000] [info] Checking for updates...
[2025-11-25 10:00:02.000] [error] Update check failed: Error: net::ERR_INTERNET_DISCONNECTED
```

### Edge Cases to Test

**Edge Case 1: Very Large Todo List**
- Create 100+ todos before update
- Verify all persist after update
- Check update doesn't timeout due to file size

**Edge Case 2: Special Characters in Todos**
- Create todos with Unicode characters (emoji, non-ASCII)
- Verify text is preserved after update

**Edge Case 3: Rapid App Close During Download**
- Start download, immediately close app
- Verify partial download doesn't corrupt state
- Next launch should re-attempt download

**Edge Case 4: Multiple Updates Available**
- Skip several versions (e.g., 1.0.0 → 1.0.3)
- Verify update goes to latest, not intermediate version

### Project Structure Notes

**No Code Changes Required:**
- Story 6.4 is verification/testing only
- All implementation was completed in Stories 6.1, 6.2, and 6.3
- Focus is on validating existing functionality

**Files to Review (not modify):**
- `electron/updater.ts` - Update logic
- `electron/main.ts` - IPC handlers and app lifecycle
- `electron/preload.ts` - IPC bridge
- `src/ui/render.ts` - Update notifications
- `src/renderer.ts` - Ctrl+U shortcut
- `package.json` - Version and repository fields

### References

- [Tech Spec Epic 6](./tech-spec-epic-6.md) - Complete Epic 6 specification
- [Story 6.1](./6-1-configure-electron-updater-and-github-releases.md) - electron-updater configuration
- [Story 6.2](./6-2-implement-automatic-update-download-and-notification.md) - Automatic update system
- [Story 6.3](./6-3-implement-manual-update-check-fallback.md) - Manual update check
- [Architecture](../architecture.md#Deployment-Architecture) - Release process and update mechanism
- [Epics](../epics.md#Story-6.4:1449-1500) - Original story from epics breakdown
- [PRD](../prd.md) - Functional requirements FR22-FR25

## Change Log

### 2025-11-25 - Story Drafted
- Created story file for test and verify auto-update flow (Story 6.4)
- Drafted 7 acceptance criteria based on tech-spec-epic-6.md AC10-AC14 plus data persistence and version verification
- Created 10 implementation tasks covering release creation, all test scenarios, logging verification, and documentation
- Added comprehensive dev notes with testing strategy and edge cases
- Status: drafted (ready for sm approval before testing)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/6-4-test-and-verify-auto-update-flow.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
