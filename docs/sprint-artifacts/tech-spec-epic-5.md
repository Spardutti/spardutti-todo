# Epic Technical Specification: Data Persistence (TOON Storage)

Date: 2025-11-24
Author: Spardutti
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 implements reliable local data persistence for spardutti-todo using the TOON (Token-Oriented Object Notation) format. This epic enables todos to survive application restarts by automatically saving to a human-readable local file after every state change. The TOON format provides 30-60% more compact storage than JSON while maintaining readability for manual editing and backup. This implementation fulfills the PRD's requirement for local-first storage (FR7-FR10) and ensures zero-friction workflows where users never need to manually save their data.

## Objectives and Scope

**In Scope:**
- Implement ToonStorage class for TOON encode/decode and file I/O operations
- Integrate auto-save into TodoStore after every mutation (add, toggle, deleteCompleted)
- Store todos in `%APPDATA%/spardutti-todo/todos.toon` with automatic directory creation
- Load todos from disk on application launch with graceful handling of missing/corrupt files
- Implement error recovery for file system failures (disk full, permissions issues)
- Provide inline error feedback without disrupting user workflow
- Verify performance with 1000+ todos (load <100ms, save <50ms async)
- Ensure TOON format is human-readable and manually editable

**Out of Scope:**
- Cloud sync or remote backup (intentionally local-only per PRD)
- Data migration from other todo formats (new application)
- Encryption at rest (todos are not sensitive data per security analysis)
- Automatic backups or versioning (user's responsibility via manual file copy)
- Real-time collaboration or multi-device sync
- Import/export to other formats (future enhancement)

## System Architecture Alignment

This epic aligns with the architecture's data persistence decisions:

**ADR-001 (TOON Format):** Implements the architectural decision to use TOON over JSON for human-readable local storage. Uses the `@toon-format/toon` (v1.0.0) TypeScript SDK for encode/decode operations.

**Data Architecture Alignment:** Implements the unidirectional data flow: `File System → ToonStorage.decode() → TodoStore._todos[] → CRUD operations → ToonStorage.encode() → File System`. The TodoStore remains the single source of truth with ToonStorage as the persistence layer.

**Component Structure:** Creates `src/storage/ToonStorage.ts` as specified in the project structure, maintaining clear separation between state management (TodoStore) and persistence (ToonStorage).

**Performance Constraints:** Implements async file operations (non-blocking) with fire-and-forget auto-save pattern to meet the <2 second task capture requirement. Save operations don't block UI updates.

**Error Handling Pattern:** Follows architecture's inline error feedback pattern (red text, actionable messages) without modal dialogs or blocking prompts.

**File Path:** Uses Electron's `app.getPath('userData')` API to resolve to `%APPDATA%/spardutti-todo/` on Windows, with automatic directory creation via `fs.mkdir({ recursive: true })`.

## Detailed Design

### Services and Modules

| Module | Responsibilities | Inputs | Outputs | Owner |
|--------|------------------|--------|---------|-------|
| **ToonStorage** | TOON format encoding/decoding, file I/O operations | Todo[] array, file path string | TOON string, Todo[] array | Persistence layer |
| **TodoStore (Enhanced)** | State management + persistence integration, auto-save coordination | User actions (add/toggle/delete), file path | Todo mutations, save triggers | State layer |
| **Error Display Component** | Inline error message rendering, auto-hide timing | Error message string, severity level | DOM updates (red text) | UI layer |
| **Main Entry Point** | Initialization coordination, file path resolution | Electron userData path | Initialized TodoStore | Application bootstrap |

**Module Interactions:**
- ToonStorage is a **static utility class** (no instances) - all methods are pure functions
- TodoStore **owns** the file path and **delegates** encoding/decoding to ToonStorage
- Error Display Component is **invoked** by TodoStore on save/load failures
- Main entry point **resolves** userData path via Electron API before instantiating TodoStore

### Data Models and Contracts

**Todo Interface (Existing - No Changes):**
```typescript
interface Todo {
  id: string              // UUID v4 format
  text: string            // User-entered task description (no length limit)
  completed: boolean      // Completion status (true = completed, false = active)
  createdAt: string       // ISO 8601 timestamp (e.g., "2025-11-24T10:00:00Z")
}
```

**TOON File Format Schema:**
```toon
todos[N]{id,text,completed,createdAt}:
  550e8400-e29b-41d4-a716-446655440000,Implement TOON storage,false,2025-11-24T10:00:00Z
  6ba7b810-9dad-11d1-80b4-00c04fd430c8,Add error handling,true,2025-11-24T11:30:00Z

version: 1.0
```

**Field Constraints:**
- `id`: Must be valid UUID v4 (36 characters with hyphens)
- `text`: Any Unicode string, commas escaped by TOON encoder (handled automatically)
- `completed`: Boolean (stored as "true" or "false" strings in TOON)
- `createdAt`: Must be valid ISO 8601 timestamp with Z suffix
- `version`: Metadata field for future format migrations (currently "1.0")

**Relationships:**
- No relational data - flat list of independent todos
- File contains complete state snapshot (no incremental updates)

### APIs and Interfaces

**ToonStorage Static Class:**
```typescript
class ToonStorage {
  /**
   * Loads todos from TOON file
   * @param filePath - Absolute path to .toon file
   * @returns Promise<Todo[]> - Array of todos (empty if file doesn't exist)
   * @throws Error if file is corrupt or unreadable
   */
  static async load(filePath: string): Promise<Todo[]>

  /**
   * Saves todos to TOON file
   * @param filePath - Absolute path to .toon file
   * @param todos - Array of todos to save
   * @returns Promise<void>
   * @throws Error if file system error (disk full, permissions)
   */
  static async save(filePath: string, todos: Todo[]): Promise<void>

  /**
   * Encodes todos to TOON format string
   * @param todos - Array of todos to encode
   * @returns string - TOON formatted string
   */
  static encode(todos: Todo[]): string

  /**
   * Decodes TOON string to todos array
   * @param toonString - TOON formatted string
   * @returns Todo[] - Parsed array of todos
   * @throws Error if TOON format is invalid
   */
  static decode(toonString: string): Todo[]
}
```

**TodoStore Enhanced API:**
```typescript
class TodoStore {
  // New constructor signature
  constructor(filePath: string)

  // New async methods
  async load(): Promise<void>  // Loads todos from disk on startup
  async save(): Promise<void>  // Saves todos to disk (called internally)

  // Existing methods (now trigger auto-save)
  add(text: string): Todo      // Creates todo, triggers save()
  toggle(id: string): void     // Toggles status, triggers save()
  deleteCompleted(): number    // Deletes completed, triggers save()

  // Existing getters (unchanged)
  getAll(): Todo[]
  getActive(): Todo[]
  getCompleted(): Todo[]
}
```

**Error Handling Signatures:**
```typescript
interface SaveError {
  type: 'save' | 'load'
  message: string           // User-friendly message (e.g., "Failed to save. Try again.")
  originalError: Error      // Original error for logging
}

function displayError(message: string, duration?: number): void
function hideError(): void
```

### Workflows and Sequencing

**Sequence 1: Application Launch (Load Todos)**
```
Actor: User
1. User launches spardutti-todo
2. Main process creates BrowserWindow
3. Renderer loads, executes main.ts
4. main.ts resolves userData path: app.getPath('userData')
5. main.ts instantiates TodoStore(filePath)
6. main.ts calls await todoStore.load()
   6a. TodoStore calls ToonStorage.load(filePath)
   6b. ToonStorage checks if file exists
       - If not exists: return []
       - If exists: read file, decode to Todo[]
   6c. TodoStore populates _todos array
7. main.ts calls renderApp(todoStore)
8. UI displays todos, input focused
Success: User sees their previous todos
Failure: Error message "Data file corrupted. Starting fresh." + empty list
```

**Sequence 2: Create Todo (Auto-Save)**
```
Actor: User
1. User types "Buy groceries" and presses Enter
2. Input event handler calls todoStore.add("Buy groceries")
3. TodoStore.add():
   3a. Creates new Todo with UUID and timestamp
   3b. Pushes to _todos array
   3c. Calls this.save() (fire-and-forget, no await)
   3d. Returns new Todo immediately
4. Render function updates DOM with new todo
5. Input clears and stays focused
6. (Background) TodoStore.save():
   6a. Calls ToonStorage.save(filePath, _todos)
   6b. ToonStorage.encode(_todos) to TOON string
   6c. fs.writeFile(filePath, toonString)
   6d. Success: Silent (no notification)
   6e. Failure: Log error, display inline error message
Success: User sees new todo instantly, data persists in background
Failure: User sees todo in UI, inline error appears if save fails
```

**Sequence 3: Toggle Todo (Auto-Save)**
```
Actor: User
1. User clicks todo or presses Space on selected todo
2. Event handler calls todoStore.toggle(id)
3. TodoStore.toggle(id):
   3a. Finds todo by ID, flips completed boolean
   3b. Calls this.save() (fire-and-forget)
4. Render function updates todo styling (checkbox, strikethrough)
5. (Background) Save completes as in Sequence 2
Success: Instant visual update, background save
Failure: Visual update succeeds, error message if save fails
```

**Sequence 4: Bulk Delete (Auto-Save)**
```
Actor: User
1. User presses Ctrl+D, confirms deletion
2. Event handler calls todoStore.deleteCompleted()
3. TodoStore.deleteCompleted():
   3a. Filters _todos to remove completed
   3b. Stores count of deleted todos
   3c. Calls this.save() (fire-and-forget)
   3d. Returns count
4. Render function removes completed todos from DOM
5. Footer shows "X todos deleted" (2 seconds)
6. (Background) Save completes as in Sequence 2
Success: Instant UI update, background save
```

**Sequence 5: Save Failure Recovery**
```
Trigger: File system error during save
1. TodoStore.save() catches error
2. Logs error: log.error('Save failed', { error: e.message, todoCount })
3. Calls displayError("Failed to save. Try again.")
4. Error message appears below input (red text)
5. Auto-hides after 5 seconds
6. Todos remain in memory (no data loss in session)
7. Next mutation retries save automatically
Recovery: User can continue working, next save attempt may succeed
```

**Sequence 6: Corrupt File Recovery (Startup)**
```
Trigger: TOON decode fails on load
1. ToonStorage.load() catches decode error
2. Backs up corrupt file: fs.rename(todos.toon, todos.toon.corrupt.TIMESTAMP)
3. Throws error to TodoStore
4. TodoStore.load() catches error
5. Logs: log.error('Corrupt file', { path: filePath })
6. Displays error: "Data file corrupted. Starting fresh."
7. TodoStore starts with empty _todos array
8. App continues with fresh list
Recovery: User starts with empty list, corrupt file preserved for manual inspection
```

## Non-Functional Requirements

### Performance

**Load Performance (Startup):**
- **Target:** Load 100 todos in <50ms, 1000 todos in <100ms
- **Measurement:** Time from `ToonStorage.load()` start to `_todos` array populated
- **Rationale:** Supports <2 second app launch target (FR18) with typical usage (10-100 todos)
- **Implementation:** Async file read via Node.js `fs.promises.readFile`, TOON decode is synchronous but fast
- **Edge case:** 10,000 todos should load in <500ms (extreme scenario, unlikely in practice)

**Save Performance (Background):**
- **Target:** Save 100 todos in <30ms, 1000 todos in <50ms (async, non-blocking)
- **Measurement:** Time from `ToonStorage.save()` start to file write complete
- **Rationale:** Fire-and-forget save pattern ensures UI stays responsive (FR20, FR21)
- **Implementation:** Async file write via `fs.promises.writeFile`, TOON encode is synchronous
- **Non-blocking:** Save happens in background, never blocks user input or UI updates

**Memory Usage:**
- **Target:** <1MB RAM for 1000 todos (including TOON encoding overhead)
- **Measurement:** Process memory delta after loading 1000 todos
- **Rationale:** Minimal resource footprint aligns with desktop app efficiency goals

**Startup Impact:**
- **Target:** File load + decode adds <100ms to total app launch time
- **Measurement:** Compare launch time with empty file vs 100 todos
- **Rationale:** Preserves <2 second launch target even with data

### Security

**Data Protection:**
- **No encryption at rest:** Todos stored in plain TOON format (human-readable requirement per FR10)
- **Rationale:** Todos are not sensitive data (per security analysis in PRD), encryption adds complexity
- **File permissions:** Standard Windows NTFS user permissions (only app user can read/write)
- **Location:** `%APPDATA%/spardutti-todo/` (user-specific, not shared across Windows users)

**Input Validation:**
- **TOON decode validation:** @toon-format/toon library handles malformed data, throws errors
- **Todo text:** No sanitization needed (no XSS risk - direct DOM manipulation, no innerHTML)
- **File path:** Uses Electron's `app.getPath('userData')` - trusted system path (no user input)

**Threat Model:**
- **Local-only application:** No network attack surface (offline by design)
- **No authentication:** Single-user Windows desktop app (no auth needed)
- **File system attacks:** Relies on Windows NTFS permissions, app doesn't run elevated

**Non-Applicable:**
- SQL injection (no database)
- CSRF/XSS (no web server, no innerHTML with user data)
- HTTPS/TLS (no network communication)

### Reliability/Availability

**Data Integrity:**
- **ACID guarantees:** None (single-file replace on save, not transactional)
- **Corruption risk:** Minimal (atomic file write via Node.js, OS-level guarantees)
- **Recovery mechanism:** Backup corrupt files to `.corrupt.TIMESTAMP` on load failure
- **Validation:** TOON library validates format on decode, throws on malformed data

**Failure Scenarios:**
1. **Disk full during save:**
   - Behavior: Save fails, error logged, inline error shown
   - Recovery: Data remains in memory, retry on next mutation
   - User impact: Can continue working, may lose changes on app crash before retry

2. **Permissions denied:**
   - Behavior: Save/load fails, error logged and displayed
   - Recovery: User must fix permissions (run as admin, check folder access)
   - User impact: App starts with empty list (load fail) or data not saved

3. **Corrupt file on load:**
   - Behavior: File backed up to `.corrupt.TIMESTAMP`, app starts fresh
   - Recovery: User can manually inspect/repair corrupt file
   - User impact: Previous todos lost until file repaired

4. **App crash during save:**
   - Behavior: File may be incomplete (partial write)
   - Recovery: Next load detects corruption, backs up file, starts fresh
   - User impact: May lose last few mutations (since last successful save)

**Availability Target:**
- **Uptime:** Not applicable (local desktop app, no server)
- **Graceful degradation:** App continues working even if saves fail (in-memory state preserved)
- **No offline mode needed:** App is always offline (intentional design)

**Backup Strategy:**
- **Automatic:** None (user's responsibility per design)
- **Manual:** User can copy `%APPDATA%/spardutti-todo/todos.toon` file
- **Version control:** TOON format is human-readable, can be git-tracked
- **Future enhancement:** Auto-backup on corruption (already implemented), periodic snapshots (not in scope)

### Observability

**Logging (electron-log):**
- **Save success:** `log.info('Todos saved', { count: todos.length, path: filePath })`
- **Save failure:** `log.error('Save failed', { error: e.message, count: todos.length, path: filePath })`
- **Load success:** `log.info('Todos loaded', { count: todos.length, path: filePath })`
- **Load failure (missing):** `log.info('No todos file found, starting fresh', { path: filePath })`
- **Load failure (corrupt):** `log.error('Corrupt todos file', { error: e.message, path: filePath, backupPath: backupPath })`
- **Startup timing:** `log.info('Load completed', { durationMs: Date.now() - startTime })`

**Log Location:**
- **Path:** `%APPDATA%/spardutti-todo/logs/main.log` (electron-log default)
- **Retention:** Automatic rotation by electron-log (configurable, default 1MB per file)
- **Log levels:** info (normal operations), error (failures), debug (development only)

**Metrics (Development Only):**
- **Load time:** Measure `ToonStorage.load()` duration, log as metric
- **Save time:** Measure `ToonStorage.save()` duration (async), log completion time
- **File size:** Log file size on save for monitoring growth trends
- **Todo count:** Log todo array length on save/load for context

**User-Facing Signals:**
- **Save success:** Silent (no notification) - success is implicit per UX pattern
- **Save failure:** Inline red error text "Failed to save. Try again." (5 second auto-hide)
- **Load failure:** Inline red error text "Data file corrupted. Starting fresh." (persistent until dismissed)
- **No spinners or loading indicators:** All operations appear instant to user

**Debugging:**
- **Logs available for support:** User can share `main.log` for troubleshooting
- **File inspection:** User can open `todos.toon` in text editor for manual verification
- **Error context:** All errors logged with full context (count, path, error message)

## Dependencies and Integrations

**External Dependencies:**

| Dependency | Version | Purpose | Installation | Critical? |
|------------|---------|---------|--------------|-----------|
| `@toon-format/toon` | 1.0.0 | TOON encode/decode library | `npm install @toon-format/toon --save` | **Yes** - Core persistence |
| `electron-log` | 5.4.1 | File-based logging for errors/metrics | Already installed (Story 1.3) | **Yes** - Error tracking |
| Node.js `fs.promises` | Built-in | Async file system operations | Native module (no install) | **Yes** - File I/O |
| Node.js `path` | Built-in | File path resolution and joining | Native module (no install) | **Yes** - Path safety |
| Electron `app` API | Built-in | Get userData path | Native Electron API | **Yes** - Path resolution |

**Internal Module Dependencies:**

| This Module | Depends On | Interface Used | Direction |
|-------------|------------|----------------|-----------|
| ToonStorage | `@toon-format/toon` | `encode()`, `decode()` methods | Import |
| ToonStorage | `fs.promises` | `readFile()`, `writeFile()`, `mkdir()` | Import |
| ToonStorage | `path` | `join()`, `dirname()` | Import |
| TodoStore | ToonStorage | `load()`, `save()` static methods | Import |
| TodoStore | `electron-log` | `log.info()`, `log.error()` | Import |
| Main entry point | Electron `app` | `app.getPath('userData')` | IPC/Import |
| Main entry point | TodoStore | Constructor, `load()`, CRUD methods | Import |

**Integration Points:**

**1. TodoStore ↔ ToonStorage:**
- **Call pattern:** TodoStore calls ToonStorage static methods (no instances)
- **Data flow:** `TodoStore._todos[]` → `ToonStorage.encode()` → TOON string → file
- **Error handling:** ToonStorage throws errors, TodoStore catches and logs
- **Threading:** All I/O is async (Node.js event loop), no worker threads needed

**2. TodoStore ↔ File System:**
- **File path:** `${userData}/todos.toon` where `userData = app.getPath('userData')`
- **Write strategy:** Atomic replace (write to file, no temp file needed for small data)
- **Read strategy:** Full file read on startup (no streaming for small files)
- **Directory creation:** `fs.mkdir(dirname(filePath), { recursive: true })` before first save

**3. Main Process ↔ Renderer:**
- **Path resolution:** Main process resolves userData path, passes to renderer via preload script (if needed)
- **Current approach:** Renderer can access Node.js APIs directly (no IPC needed for file ops)
- **Security note:** Context isolation enabled, but renderer has fs access (acceptable for desktop app)

**4. Error Display ↔ UI:**
- **Trigger:** TodoStore catch blocks call `displayError(message)`
- **Implementation:** Error display component renders red text below input field
- **Cleanup:** Auto-hide timer removes error after 5 seconds (setTimeout)

**Integration Constraints:**

- **No cloud APIs:** Intentionally local-only, no network dependencies
- **No database:** File-based storage only, no SQLite or embedded DB
- **No third-party sync:** No Dropbox/OneDrive integration
- **Electron version:** Requires Electron 22+ for `app.getPath('userData')` API stability
- **Node.js version:** Requires Node.js 14.17+ for `crypto.randomUUID()` (used in TodoStore)
- **Windows-only:** File paths use `%APPDATA%`, not cross-platform compatible (per PRD scope)

## Acceptance Criteria (Authoritative)

**AC1: ToonStorage Encoding/Decoding**
- Given a Todo array with 3 items (mix of completed and active)
- When I call `ToonStorage.encode(todos)`
- Then I receive a valid TOON format string with structure: `todos[3]{id,text,completed,createdAt}: ...`
- And when I call `ToonStorage.decode(toonString)`
- Then I receive an identical Todo array (deep equality)

**AC2: File Save Operation**
- Given I have a TodoStore with 5 todos
- When I call `todoStore.save()`
- Then a file is created at `%APPDATA%/spardutti-todo/todos.toon`
- And the file contains valid TOON format
- And the file is human-readable in a text editor
- And the operation completes asynchronously without blocking the UI

**AC3: File Load Operation**
- Given I have saved 10 todos to disk
- When I close and reopen the app
- Then the TodoStore loads all 10 todos from disk
- And they appear in the UI with correct text, status, and IDs
- And completed todos are visually distinct (strikethrough, dark green)

**AC4: Auto-Save on Mutations**
- Given the app is running with 3 todos
- When I add a new todo "Buy milk"
- Then the todo appears in the UI instantly
- And the file is saved automatically in the background
- And I can close the app immediately (no "save changes?" prompt)
- When I reopen the app
- Then "Buy milk" is in the list

**AC5: Missing File Handling**
- Given this is the first app launch (no todos.toon file exists)
- When the app starts
- Then no error message is shown
- And the app displays an empty todo list
- And the input field is focused and ready to use

**AC6: Corrupt File Recovery**
- Given the todos.toon file is corrupted (invalid TOON format)
- When the app starts
- Then an error message appears: "Data file corrupted. Starting fresh."
- And the corrupt file is backed up to `todos.toon.corrupt.TIMESTAMP`
- And the app starts with an empty todo list
- And I can create new todos normally

**AC7: Save Failure Handling**
- Given the disk is full or I have no write permissions
- When a todo mutation triggers auto-save
- Then the todo still appears in the UI (in-memory state preserved)
- And an inline error appears: "Failed to save. Try again." (red text)
- And the error auto-hides after 5 seconds
- And the next mutation retries the save operation

**AC8: Performance - Large Lists**
- Given I have 1000 todos in the file
- When I launch the app
- Then the app launches in under 2 seconds (including file load)
- And all 1000 todos are visible in the scrollable list
- And I can create a new todo with instant feedback (<16ms perceived latency)
- And save operations complete in <50ms (async, non-blocking)

**AC9: Manual File Editing**
- Given I close the app
- When I manually edit `todos.toon` in a text editor (add a new todo)
- And save the file with valid TOON format
- And reopen the app
- Then the manually added todo appears in the list
- And the app loads successfully without errors

**AC10: Persistence Across Mutations**
- Given I have 5 todos
- When I toggle 2 todos to completed, add 1 new todo, and delete all completed todos
- Then I have 4 todos (3 original active + 1 new)
- When I close and reopen the app
- Then exactly 4 todos are present with the correct states

## Traceability Mapping

| Acceptance Criteria | Spec Section | Components | Test Strategy |
|---------------------|--------------|------------|---------------|
| **AC1: Encoding/Decoding** | APIs & Interfaces → ToonStorage | ToonStorage.encode(), ToonStorage.decode() | Unit test with fixtures (3 todos, edge cases: empty array, special chars) |
| **AC2: File Save** | Workflows → Sequence 2 (Auto-Save) | ToonStorage.save(), fs.writeFile(), path resolution | Integration test: save to temp file, verify TOON format, check file exists |
| **AC3: File Load** | Workflows → Sequence 1 (Launch) | ToonStorage.load(), TodoStore.load(), renderApp() | E2E test: save fixtures, restart app, verify UI rendering |
| **AC4: Auto-Save** | Services → TodoStore.add(), Detailed Design | TodoStore.add/toggle/deleteCompleted, auto-save pattern | E2E test: create todo, kill app (no graceful close), restart, verify persistence |
| **AC5: Missing File** | Workflows → Sequence 1 (file not exists branch) | ToonStorage.load() edge case, error handling | Unit test: mock fs.readFile ENOENT error, verify empty array returned |
| **AC6: Corrupt File** | Workflows → Sequence 6 (Corrupt Recovery) | ToonStorage.decode() error, backup logic, error display | Integration test: create corrupt .toon file, verify backup + error message |
| **AC7: Save Failure** | Workflows → Sequence 5 (Failure Recovery) | TodoStore.save() catch block, displayError(), logging | Integration test: mock fs.writeFile error, verify error display + in-memory state |
| **AC8: Performance** | NFR → Performance (load <100ms, save <50ms) | Full stack (load + decode + render pipeline) | Performance test: generate 1000 todos, measure load time, profile with DevTools |
| **AC9: Manual Editing** | Data Models → TOON format, human-readable requirement | ToonStorage.load(), TOON decode validation | Manual test: edit file, add valid todo, verify app loads correctly |
| **AC10: Persistence** | Workflows → All mutation sequences | TodoStore CRUD + auto-save, file persistence | E2E test: complex workflow (multiple mutations), restart, verify final state |

**Functional Requirements Coverage:**

| FR | Description | AC Mapping | Implementation Status |
|----|-------------|------------|----------------------|
| **FR7** | Local storage on Windows PC | AC2, AC3, AC4 | ToonStorage + file path resolution |
| **FR8** | Persist between sessions | AC3, AC4, AC10 | Auto-save + load on startup |
| **FR9** | Offline access | AC5 (implicit) | No network dependencies, local-only |
| **FR10** | Human-readable format | AC2, AC9 | TOON format, text editor compatible |

**Story Coverage:**

| Story | AC Mapping | Test Type |
|-------|------------|-----------|
| **5.1: ToonStorage Class** | AC1, AC2, AC3, AC6 | Unit + Integration |
| **5.2: Auto-Save Integration** | AC4, AC7, AC10 | Integration + E2E |
| **5.3: Error Handling** | AC6, AC7 | Integration |
| **5.4: Performance Verification** | AC8, AC9, AC10 | Performance + E2E |

## Risks, Assumptions, Open Questions

**RISKS:**

**R1: TOON Library Maturity**
- **Type:** Technical Risk - Medium Severity
- **Description:** @toon-format/toon is a newer format (less ecosystem support than JSON)
- **Impact:** Potential bugs in encode/decode, lack of community solutions for edge cases
- **Mitigation:** Extensive unit tests for edge cases (special characters, large arrays, unicode), fallback to JSON if critical issues arise (architecture allows swap)
- **Status:** Accepted - Trade-off for innovation and compactness

**R2: Data Loss on Concurrent Write**
- **Type:** Technical Risk - Low Severity
- **Description:** If multiple app instances write to same todos.toon, last write wins (no locking)
- **Impact:** Data loss if user runs multiple app instances simultaneously
- **Mitigation:** Single-instance lock via Electron `app.requestSingleInstanceLock()`, warn user if second instance detected
- **Status:** Mitigated in main process (Epic 1 architecture)

**R3: File System Errors Not User-Recoverable**
- **Type:** UX Risk - Medium Severity
- **Description:** Disk full or permissions errors require user to fix OS-level issues
- **Impact:** User sees error message but can't fix within app (needs admin/disk cleanup)
- **Mitigation:** Clear error messages with actionable guidance ("Check disk space", "Verify folder permissions"), detailed logging for support
- **Status:** Accepted - OS-level issues outside app control

**R4: Corrupt File Recovery Loses Data**
- **Type:** Data Loss Risk - Medium Severity
- **Description:** If file is corrupt on load, user loses all todos (starts fresh)
- **Impact:** Permanent data loss unless user manually repairs .corrupt backup file
- **Mitigation:** Backup corrupt file to `.corrupt.TIMESTAMP` for manual inspection, consider periodic auto-backups (future enhancement)
- **Status:** Mitigated with backup, future enhancement for versioning

**R5: No Undo for Bulk Delete**
- **Type:** UX Risk - Low Severity
- **Description:** Once confirmed, bulk delete is permanent (no undo mechanism)
- **Impact:** Accidental deletion requires manual restoration from backup (if exists)
- **Mitigation:** Confirmation prompt before delete, future enhancement: trash/archive instead of delete
- **Status:** Mitigated with confirmation, accepted for MVP

**ASSUMPTIONS:**

**A1:** Users have write permissions to `%APPDATA%` (standard Windows user folder)
- **Validation:** Test on restricted Windows accounts (corporate environments)
- **Impact if false:** App cannot save, shows persistent error message

**A2:** Todo text length is reasonable (<10KB per todo)
- **Validation:** No enforced limit, but large text may impact performance
- **Impact if false:** Slow encoding/rendering, but still functional

**A3:** File system operations complete within 100ms (typical SSD/HDD performance)
- **Validation:** Performance tests on slow HDD (5400 RPM minimum)
- **Impact if false:** Startup time may exceed 2 second target

**A4:** User runs single app instance (not multiple windows simultaneously)
- **Validation:** Electron single-instance lock enforced in main process
- **Impact if false:** Data loss from concurrent writes (R2)

**A5:** TOON library is stable and compatible with TypeScript strict mode
- **Validation:** Integration tests with actual @toon-format/toon v1.0.0
- **Impact if false:** Need to wrap library or patch types

**OPEN QUESTIONS:**

**Q1:** Should we implement periodic auto-backups (e.g., daily snapshots)?
- **Context:** Currently only backs up on corruption detection
- **Decision needed:** Epic 5 scope or future enhancement?
- **Recommendation:** Future enhancement - keep Epic 5 minimal, add in Epic 7 (post-MVP)

**Q2:** Should we add a "Restore from backup" UI feature?
- **Context:** User must manually restore .corrupt files via file system
- **Decision needed:** In-app restore vs manual process?
- **Recommendation:** Manual for MVP (keeps UI minimal), consider for future

**Q3:** Should we log save timing metrics in production (telemetry)?
- **Context:** Useful for monitoring performance, but adds overhead
- **Decision needed:** Enable logging by default or development-only?
- **Recommendation:** Development-only for MVP, opt-in telemetry post-MVP

**Q4:** Should we validate todo text length to prevent huge files?
- **Context:** No limit currently, user could create 1MB todo text
- **Decision needed:** Enforce limit (e.g., 5000 chars) or trust user?
- **Recommendation:** No limit for MVP (trust user), add UI warning if file size exceeds 1MB

**Q5:** Should we support importing from other todo apps (JSON, CSV)?
- **Context:** New app, no migration needed, but users may want to import
- **Decision needed:** Epic 5 scope or future feature?
- **Recommendation:** Out of scope for Epic 5, add as Epic 7+ feature if requested

## Test Strategy Summary

**Unit Tests (Vitest - Co-located):**

**ToonStorage.test.ts:**
- Test `encode()` with various Todo arrays (empty, single, multiple, special characters, unicode)
- Test `decode()` with valid and invalid TOON strings
- Test round-trip: `encode(decode(original))` === `original`
- Mock file system for `save()` and `load()` tests (verify fs calls, handle errors)
- Edge cases: Empty array, very large arrays (1000+ todos), todos with commas/newlines

**TodoStore.test.ts (Enhanced):**
- Test `load()` success (mock ToonStorage.load)
- Test `load()` failure (missing file, corrupt file)
- Test `save()` triggered after `add()`, `toggle()`, `deleteCompleted()`
- Test save errors are caught and logged (mock ToonStorage.save throwing error)
- Verify auto-save is fire-and-forget (doesn't block CRUD operations)

**Integration Tests (Vitest + Temporary File System):**

**File Persistence Integration:**
- Create temp directory, instantiate TodoStore with temp path
- Add 5 todos, verify file created with correct TOON content
- Load from file, verify todos restored correctly
- Corrupt file manually, verify backup + error handling
- Test save failure by making temp directory read-only

**E2E Tests (Manual + Automated with Electron):**

**E2E-1: Fresh Install:**
- Launch app with no todos.toon file
- Create 3 todos
- Close app
- Reopen app, verify all 3 todos present

**E2E-2: Persistence Across Sessions:**
- Create 5 todos, complete 2
- Close app, reopen
- Verify correct count and statuses
- Add 1 more todo, close
- Reopen, verify 6 total

**E2E-3: Bulk Delete Persistence:**
- Create 10 todos, complete 5
- Bulk delete completed
- Close app immediately (test auto-save timing)
- Reopen, verify only 5 active todos remain

**E2E-4: Corrupt File Recovery:**
- Create valid todos.toon
- Manually corrupt file (invalid TOON syntax)
- Launch app, verify error message + backup file created
- Verify app starts with empty list

**Performance Tests:**

**Load Performance:**
- Generate 100, 500, 1000, 5000 todo fixtures
- Measure `ToonStorage.load()` time (target: <100ms for 1000)
- Profile with Chrome DevTools (check TOON decode bottlenecks)

**Save Performance:**
- Measure `ToonStorage.save()` async completion (target: <50ms for 1000)
- Verify UI remains responsive during save (no frame drops)

**Startup Performance:**
- Measure full app launch with 0, 100, 1000 todos
- Target: <2 seconds total (Epic 1 requirement still met)

**Error Scenario Tests:**

**Disk Full Simulation:**
- Mock `fs.writeFile` to throw ENOSPC error
- Verify error message displayed, in-memory state preserved
- Verify next mutation retries save

**Permissions Denied:**
- Make todos.toon read-only
- Attempt save, verify error handling
- Verify app doesn't crash

**Test Coverage Goals:**
- **Unit tests:** 90%+ coverage for ToonStorage and TodoStore
- **Integration tests:** All file I/O scenarios (save, load, error handling)
- **E2E tests:** All user workflows involving persistence
- **Performance tests:** Verify targets met (<100ms load, <50ms save, <2s startup)

**Test Execution:**
- **Local:** `npm test` runs all unit + integration tests (Vitest)
- **CI:** GitHub Actions runs tests on every commit
- **Manual:** E2E tests run manually before release (future: automate with Spectron/Playwright)

**Test Data:**
- **Fixtures:** Pre-generated TOON files with 10, 100, 1000 todos
- **Edge cases:** Todos with special characters, unicode, very long text
- **Corrupt files:** Invalid TOON syntax for error testing
