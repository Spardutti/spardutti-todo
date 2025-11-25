# Epic Technical Specification: Projects System

Date: 2025-11-25
Author: Spardutti
Epic ID: 7
Status: Draft

---

## Overview

Epic 7 implements a Projects System that enables users to organize todos into isolated project containers. This addresses the need for users working on multiple initiatives (e.g., SequenceStack, HomefrontGroup, StealthMetrix) to maintain completely separate todo lists per project. The system introduces multi-file TOON storage, three separate store classes (TodoStore refactored, ProjectStore, SettingsStore), data migration from v1 single-file to v2 multi-file format, and keyboard-first project switching with mouse dropdown as secondary navigation.

This epic transforms spardutti-todo from a single todo list into a multi-project organizational tool while maintaining the core 2-second task capture speed and terminal aesthetic.

## Objectives and Scope

### In Scope

- **FR31:** Create multiple projects to organize todos
- **FR32:** Switch projects via keyboard fuzzy search (Ctrl+P → type partial name → Enter)
- **FR33:** Switch projects via mouse dropdown (click indicator → dropdown → select)
- **FR34:** See active project indicator (minimal, in header/footer area)
- **FR35:** Rename existing projects
- **FR36:** Delete projects with confirmation warning
- **FR37:** Default project on first launch (can be renamed)
- **FR38:** Auto-add todos to active project without prompting
- **FR39:** Complete project isolation (no cross-project visibility)
- **FR40:** Project data persistence between sessions

### Out of Scope

- Project reordering (projects appear in creation order)
- Cross-project search or views
- Project export/import
- Project tags or categories
- More than ~10 active projects (not designed for dozens)
- Cloud sync or remote storage

## System Architecture Alignment

### Architecture References

This epic aligns with Architecture v2.0 decisions:

- **ADR-006:** Multi-file storage for projects (`projects.toon`, `todos-{id}.toon`, `settings.toon`)
- **ADR-007:** Separate store classes (TodoStore, ProjectStore, SettingsStore)
- **ADR-008:** Simple `includes()` for project search (sufficient for 5-10 projects)
- **ADR-010:** Inline footer for project search UI (no modals)

### Components Affected

| Component | Location | Changes |
|-----------|----------|---------|
| **TodoStore** | `src/store/TodoStore.ts` | Refactor to accept projectId, load per-project todos |
| **ProjectStore** (new) | `src/store/ProjectStore.ts` | Project CRUD operations |
| **SettingsStore** (new) | `src/store/SettingsStore.ts` | Active project, window bounds |
| **ToonStorage** | `src/storage/ToonStorage.ts` | Extend for multi-file (projects, settings, per-project todos) |
| **migration** (new) | `src/storage/migration.ts` | v1→v2 automatic migration |
| **projectSearch** (new) | `src/ui/projectSearch.ts` | Inline footer fuzzy search |
| **projectIndicator** (new) | `src/ui/projectIndicator.ts` | Header/footer project name + dropdown |
| **render.ts** | `src/ui/render.ts` | Integrate project indicator, handle project switch |
| **main.ts** | `src/main.ts` | Update startup sequence for multi-project |
| **KeyboardManager** | `src/keyboard/KeyboardManager.ts` | Add Ctrl+P shortcut |

### Constraints

- Must maintain <2 second startup time (load only active project's todos)
- Must preserve terminal aesthetic (no modals, green-on-black)
- Must auto-migrate v1 users without data loss
- Must maintain keyboard-first design

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **ProjectStore** | Project CRUD, search | Project data | Project[], Project |
| **SettingsStore** | Active project tracking, window bounds | Settings data | AppSettings |
| **TodoStore** (refactored) | Per-project todo CRUD | projectId, todo data | Todo[] |
| **ToonStorage** (extended) | Multi-file I/O | File paths, data objects | Encoded/decoded data |
| **migration** | v1→v2 format upgrade | Old file structure | New file structure |
| **projectSearch** | Fuzzy search UI | User input | Project selection |
| **projectIndicator** | Active project display | Current project | UI component |

### Data Models and Contracts

```typescript
// src/types/Project.ts
interface Project {
  id: string              // UUID v4
  name: string            // User-defined name (e.g., "SequenceStack")
  createdAt: string       // ISO 8601 timestamp
}

// src/types/Settings.ts
interface AppSettings {
  activeProjectId: string // Currently selected project
  windowBounds: {         // Window position and size
    x: number
    y: number
    width: number
    height: number
  }
  version: string         // Settings schema version for migrations
}

// src/types/Todo.ts (existing, unchanged)
interface Todo {
  id: string              // UUID v4
  text: string            // User-entered task description
  completed: boolean      // Completion status
  createdAt: string       // ISO 8601 timestamp
}
```

### File Format (TOON Multi-File)

**projects.toon:**
```toon
projects[N]{id,name,createdAt}:
  550e8400-e29b-41d4-a716-446655440000,Default,2025-11-20T10:00:00Z
  6ba7b810-9dad-11d1-80b4-00c04fd430c8,SequenceStack,2025-11-21T09:30:00Z
  7c9e6679-7425-40de-944b-e07fc1f90ae7,HomefrontGroup,2025-11-22T14:15:00Z

version: 2.0
```

**todos-{projectId}.toon:**
```toon
todos[N]{id,text,completed,createdAt}:
  a1b2c3d4-e5f6-7890-abcd-ef1234567890,Implement keyboard nav,false,2025-11-20T10:00:00Z
  b2c3d4e5-f6a7-8901-bcde-f12345678901,Add Matrix Green theme,true,2025-11-20T11:30:00Z

version: 1.0
```

**settings.toon:**
```toon
activeProjectId: 550e8400-e29b-41d4-a716-446655440000
windowBounds{x,y,width,height}: 100,100,600,400
version: 1.0
```

### APIs and Interfaces

**ProjectStore Public API:**
```typescript
class ProjectStore {
  private _projects: Project[]
  private _filePath: string

  async load(): Promise<void>
  async save(): Promise<void>
  create(name: string): Project           // Returns new project
  rename(id: string, newName: string): void
  delete(id: string): void                // Also deletes todos-{id}.toon
  getAll(): Project[]                     // Returns shallow copy
  findById(id: string): Project | undefined
  search(query: string): Project[]        // Simple includes() filter
}
```

**SettingsStore Public API:**
```typescript
class SettingsStore {
  private _settings: AppSettings
  private _filePath: string

  async load(): Promise<void>
  async save(): Promise<void>
  getActiveProjectId(): string
  setActiveProject(projectId: string): void  // Auto-saves
  getWindowBounds(): WindowBounds
  setWindowBounds(bounds: WindowBounds): void  // Auto-saves
}
```

**TodoStore Refactored API:**
```typescript
class TodoStore {
  private _projectId: string
  private _todos: Todo[]

  constructor()
  async load(projectId: string): Promise<void>  // Load specific project's todos
  async save(): Promise<void>                    // Save to todos-{projectId}.toon
  add(text: string): Todo                        // Now uses unshift (top)
  toggle(id: string): void
  deleteCompleted(): number
  getAll(): Todo[]
  getActive(): Todo[]
  getCompleted(): Todo[]
}
```

**ToonStorage Extended API:**
```typescript
class ToonStorage {
  // Existing (refactored)
  static async loadTodos(projectId: string): Promise<Todo[]>
  static async saveTodos(projectId: string, todos: Todo[]): Promise<void>

  // New
  static async loadProjects(): Promise<Project[]>
  static async saveProjects(projects: Project[]): Promise<void>
  static async loadSettings(): Promise<AppSettings>
  static async saveSettings(settings: AppSettings): Promise<void>
  static async deleteTodosFile(projectId: string): Promise<void>

  // Generic (existing)
  static encode<T>(data: T, schema: string): string
  static decode<T>(toonString: string): T
}
```

### Workflows and Sequencing

**App Startup Sequence:**
```
1. App Launch
2. migration.migrateIfNeeded()     // Check for v1→v2 migration
3. SettingsStore.load()            // Get activeProjectId, windowBounds
4. ProjectStore.load()             // Load project index
5. Validate activeProjectId        // Fallback to first project if invalid
6. TodoStore.load(activeProjectId) // Load active project's todos
7. render()                        // Display UI with project indicator
```

**Project Switch Flow (Keyboard - Ctrl+P):**
```
1. User presses Ctrl+P
2. Footer transforms to search input: "> _"
3. User types partial name (e.g., "seq")
4. projectSearch.filter("seq") → matches "SequenceStack"
5. Arrow keys navigate filtered results
6. User presses Enter
7. switchProject(matchedProjectId)
8. TodoStore.load(newProjectId)
9. SettingsStore.setActiveProject(newProjectId)
10. render() updates UI
11. Footer returns to normal hints
```

**Project Switch Flow (Mouse - Dropdown):**
```
1. User clicks project indicator
2. Dropdown appears with all projects + "New Project"
3. User clicks target project
4. switchProject(selectedProjectId)
5. Same steps 8-11 as keyboard flow
6. Dropdown closes
```

**Data Migration Flow (v1→v2):**
```
1. Check: todos.toon exists AND projects.toon does NOT exist
2. If false: Skip migration (already v2 or fresh install)
3. Create backup: todos.toon → todos.toon.backup
4. Generate default project UUID
5. Rename: todos.toon → todos-{defaultProjectId}.toon
6. Create projects.toon with Default project entry
7. Create settings.toon with activeProjectId = defaultProjectId
8. Log migration success
```

## Non-Functional Requirements

### Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Project switch | <100ms | Only load active project's todos |
| Project search filter | <10ms | O(n) where n ≤ 10 projects |
| Startup overhead | <50ms additional | Three small file reads |
| Total startup | <2 seconds | Unchanged from MVP |

**Implementation:**
- Only active project's todos loaded in memory
- Project index is small (5-10 entries, ~1KB)
- Settings file is tiny (~200 bytes)
- No eager loading of inactive project todos

### Security

**Threat Model: Low Risk** (unchanged from MVP)

- All data local, no network (except auto-update)
- No authentication or sensitive data
- Standard user file permissions

**Project-Specific Security:**
- Project isolation enforced at file level
- Delete project = delete associated todos file
- No cross-project data leakage possible

### Reliability/Availability

**Error Scenarios:**

| Scenario | Behavior |
|----------|----------|
| Corrupt project file | Skip project, log error, continue with others |
| Corrupt settings | Reset to defaults, select first project |
| Missing active project | Auto-select first available project |
| Migration failure | Preserve original file, show error, allow manual recovery |
| Storage full | Show error, data remains in memory (session continues) |

**Recovery:**
- v1→v2 migration creates backup before any changes
- Each project's data in separate file (corruption isolated)
- Settings corruption doesn't affect todo data

### Observability

**Logging (electron-log):**

```typescript
// Project operations
log.info('Project created', { id, name })
log.info('Project renamed', { id, oldName, newName })
log.info('Project deleted', { id, name, todoCount })
log.info('Project switched', { from: oldId, to: newId })

// Migration
log.info('Migration started', { hasOldFormat: true })
log.warn('Migration completed', { backupPath, newProjectId })
log.error('Migration failed', { error: e.message })

// Errors
log.error('Failed to load projects', { error: e.message })
log.error('Failed to save settings', { error: e.message })
log.error('Failed to load project todos', { projectId, error: e.message })
```

## Dependencies and Integrations

### Existing Dependencies (no changes)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@toon-format/toon` | 1.0.0 | TOON encode/decode |
| `electron-updater` | 6.7.1 | Auto-update (unchanged) |
| `electron-log` | 5.4.1 | File logging |

### New Dependencies

None required. All functionality uses existing libraries and native APIs.

### Internal Dependencies

| Component | Depends On |
|-----------|-----------|
| ProjectStore | ToonStorage, electron-log |
| SettingsStore | ToonStorage, electron-log |
| TodoStore (refactored) | ToonStorage (per-project files) |
| migration | ToonStorage, fs, electron-log |
| projectSearch | ProjectStore, KeyboardManager |
| projectIndicator | ProjectStore, SettingsStore |
| main.ts | All stores, migration |

## Acceptance Criteria (Authoritative)

### FR31: Create Multiple Projects
1. User can create new project via "New Project" option
2. Project name prompt accepts any non-empty string
3. New project created with unique UUID
4. New project becomes active immediately
5. New project appears in project list

### FR32: Keyboard Project Search
1. Ctrl+P opens inline search in footer
2. Typing filters projects using includes() matching
3. Arrow keys navigate filtered results
4. Enter selects highlighted project
5. Escape cancels and restores footer hints
6. Selected project becomes active
7. Active project's todos load immediately

### FR33: Mouse Dropdown Switch
1. Clicking project indicator opens dropdown
2. Dropdown shows all projects with active checkmark
3. Dropdown shows "New Project" option at bottom
4. Clicking project switches to it
5. Clicking outside closes dropdown
6. Dropdown styled with terminal aesthetic

### FR34: Active Project Indicator
1. Current project name visible in header/footer area
2. Dropdown arrow (▼) indicates clickable
3. Updates immediately on project switch
4. Styled with terminal green on black

### FR35: Rename Projects
1. User can rename any project including Default
2. Name change persists to projects.toon
3. Name updates in indicator and dropdown

### FR36: Delete Projects
1. Confirmation prompt: "Delete 'X' and N todos inside? [Y/n]"
2. On confirm: Project and todos-{id}.toon deleted
3. Switches to another project (first available)
4. Cannot delete last remaining project

### FR37: Default Project
1. Fresh install creates "Default" project
2. v1 users get todos migrated to "Default" project
3. Default project can be renamed
4. Default project cannot be deleted (if last)

### FR38: Auto-Add to Active Project
1. New todos automatically added to active project
2. No project selection prompt
3. Data saved to active project's todos file

### FR39: Project Isolation
1. Each project has completely separate todo list
2. No cross-project search or views
3. Switching project = full todo list swap
4. Only active project's todos in memory

### FR40: Project Data Persistence
1. Projects persist between sessions
2. Active project remembered on restart
3. Project order preserved (creation order)
4. All project operations auto-save

### Migration Acceptance Criteria
1. v1 users (todos.toon exists, no projects.toon) auto-migrate
2. Original todos.toon backed up to todos.toon.backup
3. Todos migrated to Default project
4. Fresh installs skip migration
5. Migration runs only once (idempotent)

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| FR31-1..5 | APIs - ProjectStore | ProjectStore.create() | Create project, verify in list |
| FR32-1..7 | Workflows - Keyboard | projectSearch.ts, KeyboardManager | Ctrl+P flow, filter, select |
| FR33-1..6 | Workflows - Mouse | projectIndicator.ts | Click indicator, verify dropdown |
| FR34-1..4 | APIs - projectIndicator | projectIndicator.ts | Render indicator, verify updates |
| FR35-1..3 | APIs - ProjectStore | ProjectStore.rename() | Rename, verify persistence |
| FR36-1..4 | APIs - ProjectStore | ProjectStore.delete() | Delete with confirm, verify cleanup |
| FR37-1..4 | Workflows - Migration | migration.ts, ProjectStore | Fresh install, v1 migration |
| FR38-1..3 | APIs - TodoStore | TodoStore.add() | Add todo, verify in active project |
| FR39-1..4 | Data Models | TodoStore scoping | Switch projects, verify isolation |
| FR40-1..4 | Data Models - TOON | ToonStorage | Restart app, verify persistence |
| Migration-1..5 | Workflows - Migration | migration.ts | v1 file → migrate → verify |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **R1:** Migration corrupts existing data | High | Create backup before any changes; test with real v1 files |
| **R2:** Project switch feels slow | Medium | Load only active todos; keep index in memory |
| **R3:** Users confused by project concept | Low | Default project works like v1; projects optional |
| **R4:** File system errors on project delete | Medium | Graceful degradation; log errors; continue operation |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| **A1:** Users have <10 active projects | PRD specifies 5-10 scale; simple includes() sufficient |
| **A2:** v1 users have single todos.toon file | MVP created single file; migration targets this |
| **A3:** File operations are fast | Local SSD; <50ms per file expected |
| **A4:** Unicode project names supported | TOON format handles Unicode; no restrictions needed |

### Open Questions

| Question | Status | Decision |
|----------|--------|----------|
| **Q1:** Project indicator location? | Architecture: header OR footer | Implement in footer area initially |
| **Q2:** Keyboard shortcut for new project? | Not specified in PRD | Ctrl+Shift+P or prompt after search |
| **Q3:** Confirm rename operations? | Not in PRD | No - rename is non-destructive |

## Test Strategy Summary

### Unit Tests (Vitest)

| Component | Test Coverage |
|-----------|---------------|
| **ProjectStore** | create, rename, delete, search, getAll, findById |
| **SettingsStore** | load, save, get/set activeProject, get/set windowBounds |
| **TodoStore** | load with projectId, save to correct file |
| **ToonStorage** | Multi-file encode/decode, file I/O |
| **migration** | Detect v1, migrate, backup, idempotent |

### Integration Tests

| Scenario | Components |
|----------|------------|
| Fresh install startup | migration, all stores, render |
| v1 migration flow | migration, ToonStorage, ProjectStore |
| Project switch | ProjectStore, TodoStore, SettingsStore, render |
| Project CRUD | ProjectStore, ToonStorage, UI |

### Manual Testing

| Scenario | Steps |
|----------|-------|
| Keyboard flow | Ctrl+P → type "seq" → Enter → verify switch |
| Mouse flow | Click indicator → click project → verify switch |
| Create project | New Project → name → verify created |
| Delete project | Delete → confirm → verify removed |
| Migration | Place v1 todos.toon → launch → verify migrated |

### Edge Cases

- Empty project name (reject)
- Delete last project (prevent)
- Switch to deleted project (fallback)
- Corrupt project file (skip, log)
- Very long project name (allow, wrap in UI)
- Unicode project name (allow)
- 1000 todos in project (performance test)
