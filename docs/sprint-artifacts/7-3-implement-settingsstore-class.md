# Story 7.3: Implement SettingsStore Class

Status: ready-for-dev

## Story

As a developer,
I want a SettingsStore class to manage app state including active project and window bounds,
So that I can persist user preferences between sessions.

## Acceptance Criteria

1. A `src/store/SettingsStore.ts` file exists with a `SettingsStore` class containing:
   - `private _settings: AppSettings` - Internal settings object
   - `private _filePath: string` - Path to settings.toon file

2. The `load()` method:
   - Is async and returns `Promise<void>`
   - Calls ToonStorage to load settings from disk
   - Populates internal `_settings` object
   - Returns default settings if file doesn't exist:
     - `activeProjectId: ''` (will be set by app initialization)
     - `windowBounds: { x: 100, y: 100, width: 600, height: 400 }`
     - `version: '1.0'`
   - Logs success/failure with electron-log

3. The `save()` method:
   - Is async and returns `Promise<void>`
   - Calls ToonStorage to persist settings to disk
   - Logs success/failure with electron-log
   - Uses fire-and-forget pattern (don't throw on error, log only)

4. The `getActiveProjectId()` method:
   - Returns `string` (the current active project ID)
   - Returns empty string if no active project set

5. The `setActiveProject(projectId: string)` method:
   - Updates `activeProjectId` in internal settings
   - Triggers auto-save (fire-and-forget pattern)
   - Does NOT reload TodoStore (caller responsibility)

6. The `getWindowBounds()` method:
   - Returns `WindowBounds` object with `{ x, y, width, height }`

7. The `setWindowBounds(bounds: WindowBounds)` method:
   - Updates `windowBounds` in internal settings
   - Triggers auto-save (fire-and-forget pattern)

8. Unit tests exist in `src/store/SettingsStore.test.ts` covering all public methods

9. All tests pass with `npm test`

## Tasks / Subtasks

- [ ] Task 1: Create SettingsStore class file structure (AC: #1)
  - [ ] Create `src/store/SettingsStore.ts` file
  - [ ] Import required dependencies: AppSettings type, WindowBounds type, electron-log
  - [ ] Define class with private `_settings: AppSettings` and `_filePath: string`
  - [ ] Define DEFAULT_SETTINGS constant with sensible defaults
  - [ ] Export the class

- [ ] Task 2: Implement load() method (AC: #2)
  - [ ] Define async load() method signature returning `Promise<void>`
  - [ ] Add placeholder call to ToonStorage.loadSettings() (will be implemented in Story 7.4)
  - [ ] Populate _settings object with loaded data
  - [ ] Handle file-not-found gracefully: return default settings
  - [ ] Add logging with electron-log for success/failure

- [ ] Task 3: Implement save() method (AC: #3)
  - [ ] Define async save() method signature returning `Promise<void>`
  - [ ] Add placeholder call to ToonStorage.saveSettings() (will be implemented in Story 7.4)
  - [ ] Add logging with electron-log for success/failure
  - [ ] Use fire-and-forget pattern (don't throw on error, log only)

- [ ] Task 4: Implement getActiveProjectId() method (AC: #4)
  - [ ] Define getActiveProjectId(): string signature
  - [ ] Return `this._settings.activeProjectId`
  - [ ] Return empty string if undefined/null

- [ ] Task 5: Implement setActiveProject() method (AC: #5)
  - [ ] Define setActiveProject(projectId: string): void signature
  - [ ] Update `this._settings.activeProjectId = projectId`
  - [ ] Call save() without await (fire-and-forget)

- [ ] Task 6: Implement getWindowBounds() method (AC: #6)
  - [ ] Define getWindowBounds(): WindowBounds signature
  - [ ] Return `this._settings.windowBounds`

- [ ] Task 7: Implement setWindowBounds() method (AC: #7)
  - [ ] Define setWindowBounds(bounds: WindowBounds): void signature
  - [ ] Update `this._settings.windowBounds = bounds`
  - [ ] Call save() without await (fire-and-forget)

- [ ] Task 8: Write unit tests (AC: #8, #9)
  - [ ] Create `src/store/SettingsStore.test.ts`
  - [ ] Test load(): verify returns default settings when file doesn't exist
  - [ ] Test load(): verify populates settings from loaded data
  - [ ] Test save(): verify doesn't throw on error (fire-and-forget)
  - [ ] Test getActiveProjectId(): verify returns correct project ID
  - [ ] Test getActiveProjectId(): verify returns empty string when not set
  - [ ] Test setActiveProject(): verify updates activeProjectId
  - [ ] Test setActiveProject(): verify triggers save
  - [ ] Test getWindowBounds(): verify returns current bounds
  - [ ] Test setWindowBounds(): verify updates bounds
  - [ ] Test setWindowBounds(): verify triggers save
  - [ ] Test default settings values match specification
  - [ ] Verify all tests pass with npm test

## Dev Notes

### Architecture Patterns and Constraints

- Use vanilla TypeScript class following existing TodoStore pattern [Source: docs/architecture.md#Implementation Patterns]
- Private properties prefixed with `_` (e.g., `_settings`, `_filePath`)
- Auto-save on every mutation using fire-and-forget pattern (call save() without await)
- ADR-007: Separate store classes (TodoStore, ProjectStore, SettingsStore)
- SettingsStore does NOT validate activeProjectId (caller responsibility)

### Data Model

```typescript
interface AppSettings {
  activeProjectId: string   // Currently selected project
  windowBounds: {           // Window position and size
    x: number
    y: number
    width: number
    height: number
  }
  version: string           // Settings schema version for migrations
}
```

### Data Flow

```
App Launch
    |
migration.migrateIfNeeded()  // v1->v2 auto-migration
    |
SettingsStore.load()         // Get activeProjectId, windowBounds
    |
ProjectStore.load()          // Load project index
    |
Validate activeProjectId     // Fallback to first project if invalid
    |
TodoStore.load(activeProjectId)  // Load active project's todos
    |
render()
```

### Error Handling

- File-not-found on load -> return default settings (not an error)
- Save failures -> log error, don't throw (UI continues working)
- Invalid activeProjectId handling is caller responsibility (app initialization)

### ToonStorage Integration Note

This story creates the SettingsStore class with method signatures that will call ToonStorage. The actual ToonStorage methods (`loadSettings`, `saveSettings`) will be implemented in **Story 7.4** (Extend ToonStorage for Multi-File Structure). For now, implement with placeholder/mock calls or optional dependency injection for testing.

**Recommended approach:** Use optional constructor parameter for ToonStorage dependency, defaulting to actual implementation, to enable testing without file I/O.

### Window Bounds Purpose

- Main process tracks window bounds via 'resize' and 'move' events
- IPC communication: `get-window-bounds`, `set-window-bounds`
- Debouncing (500ms) prevents excessive saves during resize
- Bounds validation done in main process (off-screen, larger than screen)

### Project Structure Notes

- Store classes located in `src/store/` directory (existing convention)
- File: `SettingsStore.ts` (alongside existing `TodoStore.ts` and `ProjectStore.ts`)
- Test file: `SettingsStore.test.ts` (co-located per testing convention)
- Path aliases: `@/store/SettingsStore`, `@/types/Settings`

### Previous Story Status

**Story 7-2-implement-projectstore-class** has status `ready-for-dev` (not yet implemented). This means:
- ProjectStore class will be created in parallel or before this story
- SettingsStore does not directly depend on ProjectStore
- Both stores depend on ToonStorage methods from Story 7.4

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#APIs and Interfaces] - SettingsStore API specification
- [Source: docs/architecture.md#API Contracts] - SettingsStore public API definition
- [Source: docs/architecture.md#ADR-007] - Separate store classes decision
- [Source: docs/architecture.md#Data Models] - AppSettings interface definition
- [Source: docs/epics.md#Story 7.3] - Story requirements and technical notes
- [Source: src/store/TodoStore.ts] - Existing store pattern to follow

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-3-implement-settingsstore-class.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-25 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
