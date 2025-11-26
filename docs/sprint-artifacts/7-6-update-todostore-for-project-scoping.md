# Story 7.6: Update TodoStore for Project Scoping

Status: drafted

## Story

As a developer,
I want TodoStore to work with the active project only,
So that todos are properly isolated between projects.

## Acceptance Criteria

1. TodoStore accepts projectId parameter in load method:
   - `async load(projectId: string): Promise<void>` signature
   - Stores projectId internally for subsequent save operations
   - Replaces previous filePath-based approach

2. Load method clears existing todos before loading new project:
   - Any existing todos in memory are cleared
   - New project's todos loaded from `todos-{projectId}.toon`
   - Empty array if no todos file exists for project

3. Save method uses stored projectId:
   - Saves to `todos-{projectId}.toon` using ToonStorage
   - Uses fire-and-forget pattern (don't await save)
   - Logs errors but doesn't throw (no UI disruption)

4. Add method prepends new todos to top (unshift):
   - New todos appear at top of list (FR42)
   - Change from push to unshift in internal implementation
   - Returns created todo for immediate UI feedback

5. Project switching works correctly:
   - Calling `todoStore.load(newProjectId)` switches context
   - Previous project's todos cleared from memory
   - New project's todos loaded
   - Only one project's todos in memory at any time

6. All CRUD methods remain functional:
   - `add(text: string): Todo` - creates and saves
   - `toggle(id: string): void` - toggles and saves
   - `deleteCompleted(): number` - deletes and saves
   - `getAll(): Todo[]` - returns shallow copy
   - `getActive(): Todo[]` - filters completed=false
   - `getCompleted(): Todo[]` - filters completed=true

7. Auto-save behavior maintained:
   - `add()`, `toggle()`, `deleteCompleted()` all call `save()`
   - Save is fire-and-forget (non-blocking)
   - UI updates immediately without waiting for save

8. Existing tests updated to reflect new API:
   - Constructor no longer takes filePath
   - Load method requires projectId parameter
   - Add tests for project switching scenario

9. All tests pass with `npm test`

## Tasks / Subtasks

- [ ] Task 1: Update TodoStore constructor and properties (AC: #1, #3)
  - [ ] Remove filePath from constructor parameters
  - [ ] Add private `_projectId: string` property
  - [ ] Initialize `_projectId` to empty string in constructor
  - [ ] Keep `_todos: Todo[]` array initialization

- [ ] Task 2: Refactor load method for project scoping (AC: #1, #2)
  - [ ] Change signature to `async load(projectId: string): Promise<void>`
  - [ ] Store projectId in `this._projectId`
  - [ ] Clear existing todos: `this._todos = []`
  - [ ] Call `ToonStorage.loadTodos(projectId)` (from Story 7.4)
  - [ ] Assign loaded todos to `this._todos`
  - [ ] Log load operation with electron-log

- [ ] Task 3: Update save method for project-scoped saving (AC: #3, #7)
  - [ ] Update to use `this._projectId` for file path
  - [ ] Call `ToonStorage.saveTodos(this._projectId, this._todos)`
  - [ ] Ensure fire-and-forget pattern (no await in mutation methods)
  - [ ] Log errors but don't throw

- [ ] Task 4: Modify add method for top-of-list insertion (AC: #4, #6, #7)
  - [ ] Change `this._todos.push(newTodo)` to `this._todos.unshift(newTodo)`
  - [ ] Verify UUID and timestamp generation still correct
  - [ ] Call `this.save()` after unshift (fire-and-forget)
  - [ ] Return created todo

- [ ] Task 5: Verify toggle and deleteCompleted methods (AC: #6, #7)
  - [ ] Ensure toggle calls `this.save()` after mutation
  - [ ] Ensure deleteCompleted calls `this.save()` after mutation
  - [ ] No changes needed to core logic

- [ ] Task 6: Add project switching support (AC: #5)
  - [ ] Verify load() clears previous todos before loading new
  - [ ] Test that calling load() with different projectId switches context
  - [ ] Verify memory only holds one project's todos

- [ ] Task 7: Update existing tests (AC: #8, #9)
  - [ ] Remove filePath from constructor calls in tests
  - [ ] Add projectId to load() calls in tests
  - [ ] Add test: load with new projectId clears previous todos
  - [ ] Add test: add() prepends to top (unshift behavior)
  - [ ] Add test: project switching scenario
  - [ ] Mock ToonStorage.loadTodos and saveTodos appropriately
  - [ ] Run `npm test` and verify all pass

- [ ] Task 8: Integration verification (AC: #9)
  - [ ] Verify TodoStore works with ToonStorage from Story 7.4
  - [ ] Test complete flow: load project → add todo → switch project → verify isolation
  - [ ] Run `npm test` final verification

## Dev Notes

### Architecture Patterns and Constraints

- Modify existing `src/store/TodoStore.ts` (not creating new file)
- Use ToonStorage methods from Story 7.4 for file I/O
- Follow single responsibility: TodoStore manages todos for ONE active project
- Project switching = full reload, not merge
- Only one project's todos in memory at any time (performance optimization)

### TodoStore Refactored API

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

### Key Changes Summary

| Method | Before | After |
|--------|--------|-------|
| `constructor` | `constructor(filePath: string)` | `constructor()` |
| `load` | `async load(): Promise<void>` | `async load(projectId: string): Promise<void>` |
| `save` | Saves to fixed path | Saves to `todos-{projectId}.toon` |
| `add` | Uses `push` (bottom) | Uses `unshift` (top) - FR42 |

### Fire-and-Forget Pattern

```typescript
// In add(), toggle(), deleteCompleted():
add(text: string): Todo {
  const newTodo = { ... }
  this._todos.unshift(newTodo)  // Changed from push
  this.save()  // No await - fire-and-forget
  return newTodo
}
```

### Project Switching Flow

```typescript
// Example usage in main.ts or project switch handler:
async function switchProject(newProjectId: string) {
  await todoStore.load(newProjectId)  // Clears old, loads new
  settingsStore.setActiveProject(newProjectId)  // Update settings
  render()  // Re-render UI with new todos
}
```

### Project Structure Notes

- File location: `src/store/TodoStore.ts` (existing file, modify in place)
- Test location: `src/store/TodoStore.test.ts` (update existing tests)
- No new files created - refactoring existing code
- Imports should already exist for ToonStorage, Todo type

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#APIs and Interfaces] - TodoStore refactored API specification
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Data Flow] - Project switch flow diagram
- [Source: docs/architecture.md#API Contracts] - TodoStore public API contract
- [Source: docs/architecture.md#Data Architecture] - Data flow and file format
- [Source: docs/epics.md#Story 7.6] - Story requirements and acceptance criteria

### Learnings from Previous Story

**From Story 7.5 (Status: ready-for-dev)**

- **ToonStorage Methods Available**: Following methods will be available after 7.4 and used by 7.5:
  - `ToonStorage.loadTodos(projectId: string): Promise<Todo[]>` - Load project-specific todos
  - `ToonStorage.saveTodos(projectId: string, todos: Todo[]): Promise<void>` - Save project-specific todos
- **Type Imports**: Use `@/types/Todo` path alias (from Story 7.1)
- **File Format**: Todos saved to `todos-{projectId}.toon` with TOON format
- **Migration Dependency**: Story 7.5 migration will create initial project structure; this story assumes projects.toon exists

[Source: docs/sprint-artifacts/7-5-implement-data-migration-v1-to-v2.md#Dev-Notes]

**From Story 7.1 (Status: done)**

- **Types Available**: Todo interface defined at `src/types/Todo.ts`
- **UUID Generation**: Use `crypto.randomUUID()` (Node.js built-in)
- **Timestamp Format**: ISO 8601 via `new Date().toISOString()`

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
| 2025-11-26 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
