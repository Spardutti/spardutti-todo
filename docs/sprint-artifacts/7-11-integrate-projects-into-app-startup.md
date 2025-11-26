# Story 7.11: Integrate Projects into App Startup

Status: drafted

## Story

As a user,
I want the app to load my last active project on startup,
So that I can continue where I left off.

## Acceptance Criteria

1. Startup sequence executes in correct order:
   - Migration check runs first (migrateIfNeeded())
   - SettingsStore loads (activeProjectId, windowBounds)
   - ProjectStore loads (project index)
   - ActiveProjectId validated against loaded projects
   - TodoStore loads active project's todos
   - UI renders with project indicator visible

2. New installation behavior:
   - When no settings.toon exists (fresh install), create Default project with new UUID
   - Create settings.toon with Default as activeProjectId
   - Create empty projects.toon with Default project entry
   - App starts with empty todo list for Default project
   - Project indicator shows "Default"

3. Corrupt or missing activeProjectId handling:
   - If activeProjectId references non-existent project, log warning with electron-log
   - Auto-select first available project as fallback
   - Update settings.toon with new activeProjectId
   - Continue startup without error to user

4. Performance requirements:
   - Total startup time remains <2 seconds
   - Only active project's todos loaded into memory
   - Projects index and settings load adds <50ms overhead
   - Measure and log startup timing with electron-log

5. Project indicator integration:
   - Project indicator displays after render()
   - Shows active project name with dropdown arrow (▼)
   - Styled with terminal green (#00FF00)
   - Clicking indicator triggers dropdown (from Story 7.9)

6. Window bounds restoration:
   - Load windowBounds from settings.toon
   - Apply bounds to main window via IPC
   - Handle off-screen or invalid bounds gracefully (reset to defaults)
   - Debounced save on window resize/move (for Story 8.1 preparation)

7. Existing MVP functionality preserved:
   - Input field focused on launch
   - Keyboard shortcuts work (j/k navigation, Space toggle, etc.)
   - Footer hints display correctly
   - Auto-update check runs as before
   - All 88 existing tests continue to pass

## Tasks / Subtasks

- [ ] Task 1: Update src/main.ts with project-aware startup sequence (AC: #1)
  - [ ] Import ProjectStore, SettingsStore, migration module
  - [ ] Call migrateIfNeeded() first before any store loads
  - [ ] Initialize SettingsStore and call load()
  - [ ] Initialize ProjectStore and call load()
  - [ ] Validate activeProjectId exists in ProjectStore
  - [ ] Update TodoStore initialization to use projectId parameter
  - [ ] Call TodoStore.load(activeProjectId)
  - [ ] Update renderApp() call to include project context
  - [ ] Add startup timing logs with electron-log

- [ ] Task 2: Implement fresh installation logic (AC: #2)
  - [ ] Add SettingsStore.load() handling for missing settings.toon
  - [ ] Create Default project in ProjectStore if projects.toon missing
  - [ ] Generate UUID for Default project using crypto.randomUUID()
  - [ ] Set Default as activeProjectId in settings
  - [ ] Ensure empty todo list renders correctly
  - [ ] Write test for fresh install scenario

- [ ] Task 3: Implement activeProjectId validation and fallback (AC: #3)
  - [ ] After loading both stores, check if activeProjectId exists in projects
  - [ ] If not found: log.warn('Active project not found, falling back')
  - [ ] Select first project from ProjectStore.getAll() as fallback
  - [ ] Call SettingsStore.setActiveProject(fallbackId)
  - [ ] Continue startup with fallback project
  - [ ] Write test for corrupt activeProjectId scenario

- [ ] Task 4: Add startup performance measurement (AC: #4)
  - [ ] Record start time at beginning of startup
  - [ ] Log timing after migration check
  - [ ] Log timing after settings load
  - [ ] Log timing after projects load
  - [ ] Log timing after todos load
  - [ ] Log total startup time
  - [ ] Verify total <2000ms, overhead <50ms
  - [ ] Add performance assertions in tests

- [ ] Task 5: Integrate project indicator into render (AC: #5)
  - [ ] Import renderProjectIndicator from projectIndicator.ts
  - [ ] Call renderProjectIndicator(activeProject, container, onDropdownClick)
  - [ ] Pass callback for dropdown trigger
  - [ ] Verify indicator updates on project switch
  - [ ] Verify terminal styling applied

- [ ] Task 6: Implement window bounds restoration (AC: #6)
  - [ ] Load windowBounds from SettingsStore.getWindowBounds()
  - [ ] Send bounds to main process via IPC
  - [ ] In electron/main.ts, apply bounds to BrowserWindow
  - [ ] Validate bounds are on-screen (multi-monitor safe)
  - [ ] Reset to defaults if invalid (centered, 600x400)
  - [ ] Add resize/move event listeners (preparation for Story 8.1)

- [ ] Task 7: Ensure backward compatibility and existing tests pass (AC: #7)
  - [ ] Run npm test - verify all 88 tests pass
  - [ ] Test MVP features work: todo creation, toggle, delete
  - [ ] Test keyboard navigation works
  - [ ] Test auto-update check still runs
  - [ ] Verify input focused on launch
  - [ ] No regressions in existing functionality

- [ ] Task 8: Integration testing for startup scenarios (AC: all)
  - [ ] Test: Fresh install → Default project created
  - [ ] Test: Existing v1 data → Migration + Default project
  - [ ] Test: Normal v2 startup → Last project restored
  - [ ] Test: Corrupt activeProjectId → Fallback works
  - [ ] Test: Performance within limits
  - [ ] Manual test: Full startup flow

## Dev Notes

### Architecture Patterns and Constraints

- **Startup Sequence Order**: Migration → Settings → Projects → Validation → Todos → Render (must be this order)
- **Fire-and-Forget Pattern**: Auto-save operations don't block startup
- **Single Project in Memory**: Only active project's todos loaded, per ADR-006/ADR-007
- **IPC for Window Bounds**: Main process owns window, renderer sends bounds via IPC
- **Terminal Aesthetic**: Project indicator must follow green-on-black, no animations
- **Keyboard-First**: Input field must have focus after startup completes

### Component Integration Map

```
src/main.ts (renderer entry point)
  ├── import migration from '@/storage/migration'
  ├── import SettingsStore from '@/store/SettingsStore'
  ├── import ProjectStore from '@/store/ProjectStore'
  ├── import TodoStore from '@/store/TodoStore' (existing)
  ├── import renderProjectIndicator from '@/ui/projectIndicator'
  └── modified renderApp() to include project context

electron/main.ts (main process)
  └── IPC handlers for window bounds
```

### Startup Flow Pseudocode

```typescript
async function initApp() {
  const startTime = Date.now()

  // Step 1: Migration (v1→v2 if needed)
  await migrateIfNeeded()
  log.info('Migration check complete', { elapsed: Date.now() - startTime })

  // Step 2: Load settings
  const settings = new SettingsStore()
  await settings.load()
  log.info('Settings loaded', { elapsed: Date.now() - startTime })

  // Step 3: Load projects
  const projects = new ProjectStore()
  await projects.load()
  log.info('Projects loaded', { elapsed: Date.now() - startTime })

  // Step 4: Validate activeProjectId
  let activeProjectId = settings.getActiveProjectId()
  if (!projects.findById(activeProjectId)) {
    log.warn('Active project not found, falling back', { activeProjectId })
    const fallback = projects.getAll()[0]
    activeProjectId = fallback.id
    settings.setActiveProject(activeProjectId)
  }

  // Step 5: Load todos for active project
  const todos = new TodoStore()
  await todos.load(activeProjectId)
  log.info('Todos loaded', { elapsed: Date.now() - startTime })

  // Step 6: Render
  const activeProject = projects.findById(activeProjectId)
  renderApp(todos, projects, settings, activeProject)

  log.info('Startup complete', { totalTime: Date.now() - startTime })
}
```

### Fresh Install Detection

Fresh install detected by either:
1. `settings.toon` does not exist, OR
2. `projects.toon` does not exist

In either case, create Default project and settings with defaults.

### Window Bounds IPC Pattern

```typescript
// renderer: request bounds restoration
const bounds = settings.getWindowBounds()
window.electronAPI.setWindowBounds(bounds)

// main process: apply bounds
ipcMain.handle('set-window-bounds', (_, bounds) => {
  if (isValidBounds(bounds)) {
    mainWindow.setBounds(bounds)
  }
})
```

### Project Structure Notes

- Entry point: `src/main.ts` (primary changes)
- Main process: `electron/main.ts` (IPC handler addition)
- Stores: Already implemented in Stories 7-2, 7-3, 7-4, 7-5, 7-6
- UI: projectIndicator from Story 7-7, dropdown from Story 7-9
- This story integrates all Epic 7 components into working startup

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Workflows and Sequencing] - App Startup Sequence spec
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Non-Functional Requirements] - Performance targets (<50ms overhead, <2s total)
- [Source: docs/architecture.md#Data Flow] - Projects Flow diagram
- [Source: docs/architecture.md#IPC Communication] - Window bounds IPC pattern
- [Source: docs/architecture.md#Performance Considerations] - Startup performance budgets
- [Source: docs/epics.md#Story 7.11] - Original story requirements
- [Source: docs/epics.md#Story 7.5] - Migration implementation (prerequisite)
- [Source: docs/epics.md#Story 7.6] - TodoStore project scoping (prerequisite)

### Learnings from Previous Story

**From Story 7-1 (Status: done)**

Story 7-1 implemented the core type definitions needed for this story:

- **New Interfaces Available**:
  - `Project { id, name, createdAt }` at `src/types/Project.ts`
  - `AppSettings { activeProjectId, windowBounds, version }` at `src/types/Settings.ts`
  - `WindowBounds { x, y, width, height }` at `src/types/Settings.ts`
- **Path Aliases**: Use `@/types/Project`, `@/types/Settings` for imports
- **JSDoc Pattern**: Follow existing documentation style with @example blocks
- **Test Coverage**: 88 tests pass, including 14 type tests

Note: Stories 7-2 through 7-10 are not yet implemented (status: ready-for-dev or drafted). This story depends on their completion. Ensure those stories implement:
- ProjectStore with load(), save(), create(), findById(), getAll() methods
- SettingsStore with load(), save(), getActiveProjectId(), setActiveProject(), getWindowBounds(), setWindowBounds()
- ToonStorage multi-file support for projects.toon, settings.toon, todos-{id}.toon
- migration.ts with migrateIfNeeded() function
- projectIndicator.ts with renderProjectIndicator() function

[Source: docs/sprint-artifacts/7-1-define-project-data-model-and-typescript-interfaces.md#Dev-Agent-Record]

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
| 2025-11-26 | Story drafted from tech-spec-epic-7, epics.md, and architecture.md | SM Agent |
