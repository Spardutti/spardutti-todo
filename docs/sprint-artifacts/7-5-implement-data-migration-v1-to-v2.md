# Story 7.5: Implement Data Migration (v1 to v2)

Status: ready-for-dev

## Story

As a user upgrading from MVP,
I want my existing todos automatically migrated to the projects system,
So that I don't lose any data when updating the app.

## Acceptance Criteria

1. App detects v1 format on launch:
   - Detection condition: `todos.toon` exists AND `projects.toon` does NOT exist
   - Fresh installs (no files) skip migration entirely
   - Already-migrated installs (projects.toon exists) skip migration

2. Backup created before any changes:
   - Original `todos.toon` copied to `todos.toon.backup`
   - Backup preserved even after successful migration
   - If backup creation fails, migration aborts with error

3. Default project created with proper structure:
   - New UUID v4 generated for default project
   - Project name: "Default"
   - createdAt: ISO 8601 timestamp of migration time

4. Original todos file migrated to new format:
   - `todos.toon` renamed to `todos-{defaultProjectId}.toon`
   - Todos content unchanged (same format, just different filename)

5. Projects index file created:
   - `projects.toon` created with Default project entry
   - Format matches architecture spec: `projects[N]{id,name,createdAt}: ...`
   - Version header: `version: 2.0`

6. Settings file created:
   - `settings.toon` created with activeProjectId pointing to Default project
   - Default window bounds: `{ x: 100, y: 100, width: 600, height: 400 }`
   - Version header: `version: 1.0`

7. Migration is idempotent:
   - Runs only once (subsequent launches skip)
   - Detection check prevents re-migration

8. Migration is logged with electron-log:
   - Log migration start with context
   - Log each step (backup, create project, rename, save files)
   - Log migration success with new projectId
   - Log any errors with full context

9. Migration failure handling:
   - On any error: Original `todos.toon` preserved unchanged
   - On any error: Backup file preserved if created
   - On any error: App shows inline error message
   - Error message: "Migration failed. Contact support."
   - App does NOT start fresh (preserves v1 data for manual recovery)

10. Unit tests exist in `src/storage/migration.test.ts` covering all scenarios

11. All tests pass with `npm test`

## Tasks / Subtasks

- [ ] Task 1: Create migration module structure (AC: #1, #7)
  - [ ] Create `src/storage/migration.ts` file
  - [ ] Implement `migrateIfNeeded(): Promise<MigrationResult>` main entry point
  - [ ] Implement `needsMigration(): Promise<boolean>` detection function
  - [ ] Define MigrationResult type (success, skipped, error + details)

- [ ] Task 2: Implement v1 format detection (AC: #1)
  - [ ] Check if `todos.toon` exists using ToonStorage or fs
  - [ ] Check if `projects.toon` does NOT exist
  - [ ] Return true only if both conditions met
  - [ ] Log detection result with electron-log

- [ ] Task 3: Implement backup creation (AC: #2)
  - [ ] Copy `todos.toon` to `todos.toon.backup`
  - [ ] Use fs.copyFile for atomic copy
  - [ ] Verify backup exists before proceeding
  - [ ] If backup fails, abort migration immediately

- [ ] Task 4: Implement Default project creation (AC: #3)
  - [ ] Generate UUID v4 using crypto.randomUUID()
  - [ ] Create Project object with name "Default"
  - [ ] Set createdAt to current ISO 8601 timestamp
  - [ ] Return project object for subsequent steps

- [ ] Task 5: Implement file migration (AC: #4, #5, #6)
  - [ ] Rename `todos.toon` to `todos-{projectId}.toon` using fs.rename
  - [ ] Create `projects.toon` using ToonStorage.saveProjects([defaultProject])
  - [ ] Create `settings.toon` using ToonStorage.saveSettings(defaultSettings)
  - [ ] Verify all files exist after creation

- [ ] Task 6: Implement logging (AC: #8)
  - [ ] Import electron-log
  - [ ] Log 'Migration started' with hasOldFormat: true
  - [ ] Log each step: backup, project create, file rename, save
  - [ ] Log 'Migration completed' with backupPath and newProjectId
  - [ ] Log errors with full Error object and context

- [ ] Task 7: Implement error handling and rollback (AC: #9)
  - [ ] Wrap migration in try-catch
  - [ ] On error: Do NOT delete or modify original todos.toon
  - [ ] On error: Return MigrationResult with error details
  - [ ] On error: Log error with full context
  - [ ] Define error display mechanism for main.ts caller

- [ ] Task 8: Write unit tests (AC: #10, #11)
  - [ ] Test needsMigration: returns true when todos.toon exists, projects.toon doesn't
  - [ ] Test needsMigration: returns false when projects.toon exists
  - [ ] Test needsMigration: returns false when no files exist (fresh install)
  - [ ] Test migrateIfNeeded: creates backup before any changes
  - [ ] Test migrateIfNeeded: creates correct file structure after migration
  - [ ] Test migrateIfNeeded: migration is idempotent (second call is no-op)
  - [ ] Test migrateIfNeeded: preserves original on error
  - [ ] Test migrateIfNeeded: logs all steps with electron-log
  - [ ] Run `npm test` and verify all pass

## Dev Notes

### Architecture Patterns and Constraints

- Create new module at `src/storage/migration.ts`
- Use ToonStorage methods from Story 7.4 for save operations
- Use Node.js fs promises API via Electron IPC for file operations
- Follow single responsibility: migration module only handles v1→v2 migration
- Migration runs synchronously during app startup (blocking acceptable for one-time operation)

### Migration Algorithm

```typescript
async function migrateIfNeeded(): Promise<MigrationResult> {
  // 1. Check if migration needed
  const hasOldFormat = await exists('todos.toon') && !await exists('projects.toon')
  if (!hasOldFormat) {
    return { status: 'skipped', reason: 'not-needed' }
  }

  log.info('Migration started', { hasOldFormat: true })

  try {
    // 2. Create backup FIRST
    await fs.copyFile('todos.toon', 'todos.toon.backup')
    log.info('Backup created', { path: 'todos.toon.backup' })

    // 3. Create default project
    const defaultProject: Project = {
      id: crypto.randomUUID(),
      name: 'Default',
      createdAt: new Date().toISOString()
    }
    log.info('Default project created', { id: defaultProject.id })

    // 4. Rename todos file to project-specific name
    const newTodosPath = `todos-${defaultProject.id}.toon`
    await fs.rename('todos.toon', newTodosPath)
    log.info('Todos file renamed', { from: 'todos.toon', to: newTodosPath })

    // 5. Create projects index
    await ToonStorage.saveProjects([defaultProject])
    log.info('Projects file created')

    // 6. Create settings
    const defaultSettings: AppSettings = {
      activeProjectId: defaultProject.id,
      windowBounds: { x: 100, y: 100, width: 600, height: 400 },
      version: '1.0'
    }
    await ToonStorage.saveSettings(defaultSettings)
    log.info('Settings file created')

    log.warn('Migration completed', {
      backupPath: 'todos.toon.backup',
      projectId: defaultProject.id
    })

    return { status: 'success', projectId: defaultProject.id }
  } catch (error) {
    log.error('Migration failed', { error: (error as Error).message })
    return { status: 'error', error: error as Error }
  }
}
```

### File Path Resolution

- Use `app.getPath('userData')` base path (via Electron IPC)
- All file paths relative to userData directory
- Windows: `%APPDATA%/spardutti-todo/`
- Linux: `~/.config/spardutti-todo/`

### MigrationResult Type

```typescript
type MigrationResult =
  | { status: 'success'; projectId: string }
  | { status: 'skipped'; reason: 'not-needed' | 'already-migrated' }
  | { status: 'error'; error: Error }
```

### Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| todos.toon doesn't exist | Skip migration (fresh install) |
| projects.toon already exists | Skip migration (already migrated) |
| Backup copy fails | Abort, return error, preserve original |
| Rename fails | Abort, return error, preserve original + backup |
| Save projects.toon fails | Abort, return error, preserve original + backup |
| Save settings.toon fails | Abort, return error, preserve original + backup |

### Integration with App Startup

Main.ts should call migration at startup:
```typescript
// In src/main.ts or app initialization
const migrationResult = await migrateIfNeeded()
if (migrationResult.status === 'error') {
  showError('Migration failed. Contact support.')
  // App continues with v1 format (graceful degradation)
}
```

### Project Structure Notes

- File location: `src/storage/migration.ts` (new file)
- Test location: `src/storage/migration.test.ts` (new file)
- Import ToonStorage from `@/storage/ToonStorage`
- Import types from `@/types/Project`, `@/types/Settings`
- Export `migrateIfNeeded()` as main entry point

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Data Migration Flow] - Migration algorithm specification
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Migration Acceptance Criteria] - Acceptance criteria details
- [Source: docs/architecture.md#Data Migration (v1 to v2)] - Migration code example
- [Source: docs/architecture.md#Data Architecture] - File format specifications
- [Source: docs/epics.md#Story 7.5] - Story requirements and technical notes

### Learnings from Previous Story

**From Story 7.4 (Status: ready-for-dev)**

- **ToonStorage Methods Available**: Following methods will be available after 7.4:
  - `ToonStorage.saveProjects(projects: Project[]): Promise<void>` - Save projects index
  - `ToonStorage.saveSettings(settings: AppSettings): Promise<void>` - Save app settings
  - `ToonStorage.loadTodos(projectId: string): Promise<Todo[]>` - Load project-specific todos
  - `ToonStorage.saveTodos(projectId: string, todos: Todo[]): Promise<void>` - Save project-specific todos
- **File Format Reference**: TOON schemas defined in 7.4 story for projects.toon, settings.toon, todos-{id}.toon
- **Type Imports**: Use `@/types/Project`, `@/types/Settings` path aliases (from Story 7.1)
- **Default Values**: AppSettings defaults: `{ activeProjectId: '', windowBounds: { x: 100, y: 100, width: 600, height: 400 }, version: '1.0' }`

[Source: docs/sprint-artifacts/7-4-extend-toonstorage-for-multi-file-structure.md#Dev-Notes]

**From Story 7.1 (Status: done)**

- **Types Available**: Project, AppSettings, WindowBounds interfaces defined at `src/types/`
- **UUID Generation**: Use `crypto.randomUUID()` (Node.js built-in)
- **Timestamp Format**: ISO 8601 via `new Date().toISOString()`

[Source: docs/sprint-artifacts/7-4-extend-toonstorage-for-multi-file-structure.md#Learnings from Previous Story]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-5-implement-data-migration-v1-to-v2.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
