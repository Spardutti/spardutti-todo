# Story 7.2: Implement ProjectStore Class

Status: ready-for-dev

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

- [ ] Task 1: Create ProjectStore class file structure (AC: #1)
  - [ ] Create `src/store/ProjectStore.ts` file
  - [ ] Import required dependencies: Project type, electron-log
  - [ ] Define class with private `_projects` array and `_filePath` string
  - [ ] Export the class

- [ ] Task 2: Implement load() method (AC: #2)
  - [ ] Define async load() method signature
  - [ ] Add placeholder call to ToonStorage.loadProjects() (will be implemented in Story 7.4)
  - [ ] Populate _projects array with loaded data
  - [ ] Add logging with electron-log for success/failure
  - [ ] Handle file-not-found gracefully (return empty array)

- [ ] Task 3: Implement save() method (AC: #3)
  - [ ] Define async save() method signature
  - [ ] Add placeholder call to ToonStorage.saveProjects() (will be implemented in Story 7.4)
  - [ ] Add logging with electron-log for success/failure
  - [ ] Use fire-and-forget pattern (don't throw on error, log only)

- [ ] Task 4: Implement create() method (AC: #4)
  - [ ] Define create(name: string): Project signature
  - [ ] Generate UUID using crypto.randomUUID()
  - [ ] Create ISO 8601 timestamp using new Date().toISOString()
  - [ ] Create Project object with id, name, createdAt
  - [ ] Add to _projects array
  - [ ] Call save() without await (fire-and-forget)
  - [ ] Return the created project

- [ ] Task 5: Implement rename() method (AC: #5)
  - [ ] Define rename(id: string, newName: string): void signature
  - [ ] Find project by ID using findById()
  - [ ] Throw error if not found: "Project not found: {id}"
  - [ ] Update name property
  - [ ] Call save() without await

- [ ] Task 6: Implement delete() method (AC: #6)
  - [ ] Define delete(id: string): void signature
  - [ ] Check if last project (throw error: "Cannot delete last project")
  - [ ] Find project by ID
  - [ ] Throw error if not found: "Project not found: {id}"
  - [ ] Remove from _projects array using filter
  - [ ] Add placeholder call to ToonStorage.deleteTodosFile(id) (Story 7.4)
  - [ ] Call save() without await

- [ ] Task 7: Implement getter methods (AC: #7, #8, #9)
  - [ ] getAll(): Project[] - return [...this._projects]
  - [ ] findById(id: string): Project | undefined - use array.find()
  - [ ] search(query: string): Project[] - case-insensitive includes() filter

- [ ] Task 8: Write unit tests (AC: #10, #11)
  - [ ] Create `src/store/ProjectStore.test.ts`
  - [ ] Test create(): verify project created with correct shape
  - [ ] Test create(): verify auto-generated id and createdAt
  - [ ] Test rename(): verify name updated
  - [ ] Test rename(): verify throws on invalid id
  - [ ] Test delete(): verify project removed
  - [ ] Test delete(): verify throws when deleting last project
  - [ ] Test delete(): verify throws on invalid id
  - [ ] Test getAll(): verify returns shallow copy
  - [ ] Test findById(): verify finds project
  - [ ] Test findById(): verify returns undefined for missing id
  - [ ] Test search(): verify case-insensitive matching
  - [ ] Test search(): verify returns all on empty query
  - [ ] Verify all tests pass with npm test

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-25 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
