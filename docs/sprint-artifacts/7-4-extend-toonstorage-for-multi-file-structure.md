# Story 7.4: Extend ToonStorage for Multi-File Structure

Status: ready-for-dev

## Story

As a developer,
I want ToonStorage extended to handle projects and settings files,
So that I can persist the multi-file data structure for the Projects System.

## Acceptance Criteria

1. ToonStorage class has new static methods added:
   - `loadProjects(): Promise<Project[]>` - Load from `projects.toon`
   - `saveProjects(projects: Project[]): Promise<void>` - Save to `projects.toon`
   - `loadSettings(): Promise<AppSettings>` - Load from `settings.toon`
   - `saveSettings(settings: AppSettings): Promise<void>` - Save to `settings.toon`
   - `deleteTodosFile(projectId: string): Promise<void>` - Delete `todos-{projectId}.toon`

2. Existing `loadTodos()` method refactored to accept projectId parameter:
   - Signature: `loadTodos(projectId: string): Promise<Todo[]>`
   - Loads from `todos-{projectId}.toon` instead of `todos.toon`
   - Returns empty array if file doesn't exist

3. Existing `saveTodos()` method refactored to accept projectId parameter:
   - Signature: `saveTodos(projectId: string, todos: Todo[]): Promise<void>`
   - Saves to `todos-{projectId}.toon`

4. File formats match architecture specification:
   - `projects.toon`: `projects[N]{id,name,createdAt}: ...` with `version: 2.0`
   - `todos-{projectId}.toon`: `todos[N]{id,text,completed,createdAt}: ...` with `version: 1.0`
   - `settings.toon`: `activeProjectId: ...` and `windowBounds{x,y,width,height}: ...` with `version: 1.0`

5. All new methods handle error cases gracefully:
   - Missing files return defaults (empty array for projects/todos, default settings)
   - Malformed files throw descriptive errors
   - File write errors are propagated for caller handling

6. Unit tests exist in `src/storage/ToonStorage.test.ts` covering all new and modified methods

7. All tests pass with `npm test`

## Tasks / Subtasks

- [ ] Task 1: Add Project-related storage methods (AC: #1, #4)
  - [ ] Implement `loadProjects(): Promise<Project[]>`
  - [ ] Implement `saveProjects(projects: Project[]): Promise<void>`
  - [ ] Define TOON schema for projects with version header
  - [ ] Handle empty/missing projects.toon (return empty array)

- [ ] Task 2: Add Settings storage methods (AC: #1, #4)
  - [ ] Implement `loadSettings(): Promise<AppSettings>`
  - [ ] Implement `saveSettings(settings: AppSettings): Promise<void>`
  - [ ] Define TOON schema for settings including windowBounds
  - [ ] Handle empty/missing settings.toon (return defaults)
  - [ ] Define default AppSettings values

- [ ] Task 3: Refactor existing todos methods for projectId (AC: #2, #3, #4)
  - [ ] Update `loadTodos(projectId: string)` signature
  - [ ] Update file path to `todos-{projectId}.toon`
  - [ ] Update `saveTodos(projectId: string, todos: Todo[])` signature
  - [ ] Maintain backwards compatibility pattern for existing code

- [ ] Task 4: Implement deleteTodosFile method (AC: #1)
  - [ ] Implement `deleteTodosFile(projectId: string): Promise<void>`
  - [ ] Handle non-existent file gracefully (no error)
  - [ ] Log deletion with electron-log

- [ ] Task 5: Implement error handling (AC: #5)
  - [ ] Add try-catch blocks to all file operations
  - [ ] Log errors with electron-log
  - [ ] Throw descriptive errors for malformed files
  - [ ] Return defaults for missing files (not errors)

- [ ] Task 6: Write unit tests for all new methods (AC: #6, #7)
  - [ ] Test loadProjects (success, empty file, missing file, malformed)
  - [ ] Test saveProjects (success, various project counts)
  - [ ] Test loadSettings (success, missing file, malformed)
  - [ ] Test saveSettings (success, various bounds values)
  - [ ] Test loadTodos with projectId (verify file path pattern)
  - [ ] Test saveTodos with projectId (verify file path pattern)
  - [ ] Test deleteTodosFile (existing file, missing file)
  - [ ] Run `npm test` and verify all pass

## Dev Notes

### Architecture Patterns and Constraints

- Extend existing ToonStorage class with static methods (no class instantiation)
- Use @toon-format/toon library for encode/decode operations
- File path base: `app.getPath('userData')` via Electron IPC
- All file operations are async (Node.js fs promises)
- Follow existing ToonStorage patterns for encode/decode

### File Storage Structure

```
{userData}/
├── projects.toon           # Project index (all projects)
├── settings.toon           # App settings (active project, window bounds)
├── todos-{uuid1}.toon      # Todos for project 1
├── todos-{uuid2}.toon      # Todos for project 2
└── todos-{uuid3}.toon      # Todos for project 3
```

### TOON File Format Examples

**projects.toon:**
```toon
projects[N]{id,name,createdAt}:
  550e8400-e29b-41d4-a716-446655440000,Default,2025-11-20T10:00:00Z
  6ba7b810-9dad-11d1-80b4-00c04fd430c8,SequenceStack,2025-11-21T09:30:00Z

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

### Default Values

When files don't exist:
- `loadProjects()`: Return empty array `[]`
- `loadSettings()`: Return defaults `{ activeProjectId: '', windowBounds: { x: 100, y: 100, width: 600, height: 400 }, version: '1.0' }`
- `loadTodos(projectId)`: Return empty array `[]`

### Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| File doesn't exist | Return default value (not error) |
| File is empty | Return default value |
| File is malformed TOON | Throw Error with descriptive message |
| Write permission denied | Propagate Error to caller |
| Directory doesn't exist | Create directory, then write |

### Project Structure Notes

- File location: `src/storage/ToonStorage.ts` (existing)
- Test location: `src/storage/ToonStorage.test.ts` (existing, extend)
- Import types from `@/types/Project`, `@/types/Settings`, `@/types/Todo`
- No changes to external APIs except method signatures

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#APIs and Interfaces] - ToonStorage extended API specification
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#File Format (TOON Multi-File)] - TOON format examples
- [Source: docs/architecture.md#Data Architecture] - File structure and format
- [Source: docs/architecture.md#API Contracts] - ToonStorage public API
- [Source: docs/epics.md#Story 7.4] - Story requirements and technical notes

### Learnings from Previous Story

**From Story 7.1 (Status: done)**

- **New Types Available**: `Project` interface at `src/types/Project.ts` with id, name, createdAt properties
- **New Types Available**: `AppSettings` interface at `src/types/Settings.ts` with activeProjectId, windowBounds, version
- **New Types Available**: `WindowBounds` interface at `src/types/Settings.ts` for window bounds object
- **Pattern Reference**: Follow existing JSDoc documentation pattern from Todo.ts and new type files
- **Import Pattern**: Use `@/types/Project`, `@/types/Settings` path aliases (verified working)

[Source: docs/sprint-artifacts/7-1-define-project-data-model-and-typescript-interfaces.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-4-extend-toonstorage-for-multi-file-structure.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
