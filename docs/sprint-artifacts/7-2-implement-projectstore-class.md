# Story 7.2: Implement ProjectStore Class

Status: done

## Story

As a developer,
I want a ProjectStore class to manage project CRUD operations,
So that I have a single source of truth for all project data with clear mutation methods.

## Acceptance Criteria

1. A `src/store/ProjectStore.ts` file exists with a `ProjectStore` class containing:
   - `private _projects: Project[]` - Internal projects array
   - `private _filePath: string` - Path to projects.toon file

2. The `load()` method:
   - Is async and returns `Promise<void>`
   - Calls ToonStorage to load projects from disk
   - Populates internal `_projects` array
   - Logs success/failure with electron-log

3. The `save()` method:
   - Is async and returns `Promise<void>`
   - Calls ToonStorage to persist projects to disk
   - Logs success/failure with electron-log

4. The `create(name: string)` method:
   - Generates UUID v4 using `crypto.randomUUID()`
   - Creates ISO 8601 timestamp using `new Date().toISOString()`
   - Adds project to internal array
   - Returns the created Project object
   - Triggers auto-save (fire-and-forget pattern)

5. The `rename(id: string, newName: string)` method:
   - Finds project by ID
   - Updates name property
   - Throws error if ID not found
   - Triggers auto-save

6. The `delete(id: string)` method:
   - Removes project from array
   - Also deletes associated `todos-{id}.toon` file
   - Throws error if trying to delete last project
   - Throws error if ID not found
   - Triggers auto-save

7. The `getAll()` method returns a shallow copy of projects array (prevents external mutation)

8. The `findById(id: string)` method returns `Project | undefined`

9. The `search(query: string)` method:
   - Uses `name.toLowerCase().includes(query.toLowerCase())`
   - Returns matching projects
   - Returns all projects if query is empty

10. Unit tests exist in `src/store/ProjectStore.test.ts` covering all public methods

11. All tests pass with `npm test`

## Tasks / Subtasks

- [x] Task 1: Create ProjectStore class file structure (AC: #1)
  - [x] Create `src/store/ProjectStore.ts` file
  - [x] Import required dependencies: Project type, electron-log
  - [x] Define class with private `_projects` array and `_filePath` string
  - [x] Export the class

- [x] Task 2: Implement load() method (AC: #2)
  - [x] Define async load() method signature
  - [x] Add placeholder call to ToonStorage.loadProjects() (will be implemented in Story 7.4)
  - [x] Populate _projects array with loaded data
  - [x] Add logging with electron-log for success/failure
  - [x] Handle file-not-found gracefully (return empty array)

- [x] Task 3: Implement save() method (AC: #3)
  - [x] Define async save() method signature
  - [x] Add placeholder call to ToonStorage.saveProjects() (will be implemented in Story 7.4)
  - [x] Add logging with electron-log for success/failure
  - [x] Use fire-and-forget pattern (don't throw on error, log only)

- [x] Task 4: Implement create() method (AC: #4)
  - [x] Define create(name: string): Project signature
  - [x] Generate UUID using crypto.randomUUID()
  - [x] Create ISO 8601 timestamp using new Date().toISOString()
  - [x] Create Project object with id, name, createdAt
  - [x] Add to _projects array
  - [x] Call save() without await (fire-and-forget)
  - [x] Return the created project

- [x] Task 5: Implement rename() method (AC: #5)
  - [x] Define rename(id: string, newName: string): void signature
  - [x] Find project by ID using findById()
  - [x] Throw error if not found: "Project not found: {id}"
  - [x] Update name property
  - [x] Call save() without await

- [x] Task 6: Implement delete() method (AC: #6)
  - [x] Define delete(id: string): void signature
  - [x] Check if last project (throw error: "Cannot delete last project")
  - [x] Find project by ID
  - [x] Throw error if not found: "Project not found: {id}"
  - [x] Remove from _projects array using filter
  - [x] Add placeholder call to ToonStorage.deleteTodosFile(id) (Story 7.4)
  - [x] Call save() without await

- [x] Task 7: Implement getter methods (AC: #7, #8, #9)
  - [x] getAll(): Project[] - return [...this._projects]
  - [x] findById(id: string): Project | undefined - use array.find()
  - [x] search(query: string): Project[] - case-insensitive includes() filter

- [x] Task 8: Write unit tests (AC: #10, #11)
  - [x] Create `src/store/ProjectStore.test.ts`
  - [x] Test create(): verify project created with correct shape
  - [x] Test create(): verify auto-generated id and createdAt
  - [x] Test rename(): verify name updated
  - [x] Test rename(): verify throws on invalid id
  - [x] Test delete(): verify project removed
  - [x] Test delete(): verify throws when deleting last project
  - [x] Test delete(): verify throws on invalid id
  - [x] Test getAll(): verify returns shallow copy
  - [x] Test findById(): verify finds project
  - [x] Test findById(): verify returns undefined for missing id
  - [x] Test search(): verify case-insensitive matching
  - [x] Test search(): verify returns all on empty query
  - [x] Verify all tests pass with npm test

## Dev Notes

### Architecture Patterns and Constraints

- Use vanilla TypeScript class following existing TodoStore pattern [Source: docs/architecture.md#Implementation Patterns]
- Private properties prefixed with `_` (e.g., `_projects`, `_filePath`)
- Auto-save on every mutation using fire-and-forget pattern (call save() without await)
- Return shallow copies from getters to prevent external mutation
- ADR-007: Separate store classes (TodoStore, ProjectStore, SettingsStore)
- ADR-008: Simple includes() for project search (sufficient for 5-10 projects)

### Data Model Relationships

```
Project (1) ←→ (N) Todo
  └── Each project contains isolated todo list
  └── Delete project = delete associated todos file

ProjectStore ←→ ToonStorage
  └── Persistence delegated to ToonStorage
```

### Error Handling

- File-not-found on load → return empty array (not an error)
- Save failures → log error, don't throw (UI continues working)
- Invalid ID → throw descriptive error
- Delete last project → throw "Cannot delete last project"

### ToonStorage Integration Note

This story creates the ProjectStore class with method signatures that will call ToonStorage. The actual ToonStorage methods (`loadProjects`, `saveProjects`, `deleteTodosFile`) will be implemented in **Story 7.4** (Extend ToonStorage for Multi-File Structure). For now, implement with placeholder/mock calls or optional dependency injection for testing.

**Recommended approach:** Use optional constructor parameter for ToonStorage dependency, defaulting to actual implementation, to enable testing without file I/O.

### Project Structure Notes

- Store classes located in `src/store/` directory (existing convention)
- File: `ProjectStore.ts` (alongside existing `TodoStore.ts`)
- Test file: `ProjectStore.test.ts` (co-located per testing convention)
- Path aliases: `@/store/ProjectStore`, `@/types/Project`

### Learnings from Previous Story

**From Story 7-1-define-project-data-model-and-typescript-interfaces (Status: done)**

- **New Types Created**: `Project` interface available at `src/types/Project.ts` - use this for type annotations
- **Pattern Established**: Follow existing Todo.ts JSDoc documentation pattern for consistency
- **WindowBounds Type**: Available at `src/types/Settings.ts` if needed for future settings integration
- **Testing Pattern**: Interface shape tests established in `src/types/Project.test.ts` - follow similar patterns
- **All 88 tests passing**: No regression concerns

[Source: docs/sprint-artifacts/7-1-define-project-data-model-and-typescript-interfaces.md#Dev-Agent-Record]

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#APIs and Interfaces] - ProjectStore API specification
- [Source: docs/architecture.md#API Contracts] - ProjectStore public API definition
- [Source: docs/architecture.md#ADR-007] - Separate store classes decision
- [Source: docs/architecture.md#ADR-008] - Simple includes() search rationale
- [Source: docs/epics.md#Story 7.2] - Story requirements and technical notes
- [Source: src/store/TodoStore.ts] - Existing store pattern to follow

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/7-2-implement-projectstore-class.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented ProjectStore following TodoStore pattern: class with private _projects array and _filePath string
- Added window.electron type definitions for loadProjects, saveProjects, deleteTodosFile in window.d.ts
- All methods use arrow functions per CLAUDE.md guidelines
- Fire-and-forget pattern for auto-save on mutations (create, rename, delete)
- Shallow copy return from getAll() and search() to prevent external mutation

### Completion Notes List

- ✅ Created ProjectStore class with full CRUD operations matching AC #1-9
- ✅ All methods follow existing TodoStore patterns (JSDoc, fire-and-forget, error handling)
- ✅ Added 35 unit tests covering all public methods
- ✅ All 123 tests pass (88 existing + 35 new)
- ✅ TypeScript compilation successful, no lint errors
- ✅ IPC type definitions added for Story 7.4 implementation

### File List

- `src/store/ProjectStore.ts` (new) - ProjectStore class implementation
- `src/store/ProjectStore.test.ts` (new) - Unit tests for ProjectStore
- `src/types/window.d.ts` (modified) - Added Project import and IPC method types

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-25 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
| 2025-11-26 | Implemented ProjectStore class with all CRUD methods and 35 unit tests | Dev Agent |
| 2025-11-26 | Senior Developer Review notes appended | Senior Dev Agent (AI) |

---

## Senior Developer Review (AI)

### Reviewer
Spardutti

### Date
2025-11-26

### Outcome
**✅ APPROVE**

All acceptance criteria implemented with evidence. All tasks verified complete. No issues found.

### Summary
Story 7.2 implements a complete ProjectStore class following the established TodoStore pattern. The implementation includes all CRUD operations (create, rename, delete), getter methods (getAll, findById, search), and persistence methods (load, save). The code follows all project conventions including arrow functions, private field naming, fire-and-forget auto-save pattern, and shallow copy returns. Comprehensive unit tests (35 tests) verify all functionality.

### Key Findings

**HIGH Severity:** None

**MEDIUM Severity:** None

**LOW Severity:**
- `create()` method does not validate empty/whitespace project names (unlike TodoStore.add which trims). This is acceptable since it's a developer-facing API and Story 7.10 (project create UI) will handle user input validation.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | ProjectStore.ts exists with private _projects and _filePath | IMPLEMENTED | src/store/ProjectStore.ts:20-21 |
| 2 | load() async, returns Promise<void>, calls ToonStorage, populates array, logs | IMPLEMENTED | src/store/ProjectStore.ts:47-56 |
| 3 | save() async, returns Promise<void>, calls ToonStorage, logs | IMPLEMENTED | src/store/ProjectStore.ts:72-81 |
| 4 | create() generates UUID v4, ISO 8601, adds to array, returns Project, auto-save | IMPLEMENTED | src/store/ProjectStore.ts:98-114 |
| 5 | rename() finds project, updates name, throws if not found, auto-save | IMPLEMENTED | src/store/ProjectStore.ts:128-139 |
| 6 | delete() removes from array, deletes todos file, throws on last/not found, auto-save | IMPLEMENTED | src/store/ProjectStore.ts:156-177 |
| 7 | getAll() returns shallow copy | IMPLEMENTED | src/store/ProjectStore.ts:191-193 |
| 8 | findById() returns Project or undefined | IMPLEMENTED | src/store/ProjectStore.ts:207-209 |
| 9 | search() case-insensitive includes, returns all if empty | IMPLEMENTED | src/store/ProjectStore.ts:223-230 |
| 10 | Unit tests exist in ProjectStore.test.ts | IMPLEMENTED | src/store/ProjectStore.test.ts (35 tests) |
| 11 | All tests pass with npm test | IMPLEMENTED | 123 tests passed |

**Summary: 11 of 11 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create ProjectStore class file structure | [x] | ✅ VERIFIED | File exists, imports, class with private fields, exported |
| Task 2: Implement load() method | [x] | ✅ VERIFIED | Async, IPC call, populate array, logging, error handling |
| Task 3: Implement save() method | [x] | ✅ VERIFIED | Async, IPC call, logging, fire-and-forget |
| Task 4: Implement create() method | [x] | ✅ VERIFIED | UUID, timestamp, push, save, return |
| Task 5: Implement rename() method | [x] | ✅ VERIFIED | findById, throw, update, save |
| Task 6: Implement delete() method | [x] | ✅ VERIFIED | Last check, findById, filter, deleteTodosFile, save |
| Task 7: Implement getter methods | [x] | ✅ VERIFIED | getAll, findById, search all implemented |
| Task 8: Write unit tests | [x] | ✅ VERIFIED | 35 tests covering all methods |

**Summary: 8 of 8 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- ✅ All public methods have test coverage
- ✅ Error cases tested (invalid ID, last project, file not found)
- ✅ Auto-save behavior verified with spies
- ✅ Edge cases covered (empty search query, case-insensitive matching)
- ✅ Shallow copy behavior tested to prevent mutation

### Architectural Alignment

- ✅ Follows TodoStore pattern exactly (constructor, load, save, mutations, getters)
- ✅ Uses arrow functions per CLAUDE.md
- ✅ Private fields prefixed with `_`
- ✅ Implements ADR-007 (separate store classes)
- ✅ Implements ADR-008 (simple includes() search)
- ✅ IPC type definitions added to window.d.ts for Story 7.4 integration

### Security Notes

No security concerns identified. Implementation:
- Uses delegated file I/O through IPC bridge (no direct fs access)
- No injection vectors (no dynamic queries or unsafe user input processing)
- No authentication/authorization concerns (local desktop app)

### Best-Practices and References

- [Electron IPC Security](https://www.electronjs.org/docs/latest/tutorial/security) - Proper use of contextBridge for IPC
- Fire-and-forget pattern for non-blocking UI updates
- Shallow copy pattern for immutable-style state management

### Action Items

**Code Changes Required:**
(none)

**Advisory Notes:**
- Note: Consider adding name validation in create() if empty project names become an issue (can be deferred to Story 7.10 UI layer)
