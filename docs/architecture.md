# Architecture

## Executive Summary

spardutti-todo uses Electron with Vite + TypeScript for ultra-fast development and optimal startup performance. The architecture prioritizes the 2-second task capture goal through minimal dependencies, local-first data storage, and custom terminal-styled components. All architectural decisions are optimized for speed, keyboard efficiency, and consistency across AI agent implementations.

## Project Initialization

**First implementation story must execute:**

```bash
npx create-electron-app@latest spardutti-todo --template=vite-typescript
```

**Starter Template Provides:**
- **TypeScript**: Full configuration with tsconfig.json (language consistency)
- **Vite**: Fast build tooling with HMR (sub-2s startup optimization)
- **Electron Forge**: Packaging and distribution for Windows
- **Project Structure**: Main process, preload script, renderer separation
- **Build Scripts**: Development and production build commands
- **Linting**: ESLint configuration (code quality)

**What We Add:**
- Custom terminal CSS (Matrix Green theme, no UI framework)
- Local storage management (JSON-based todo persistence)
- Auto-update integration (electron-updater)
- Terminal-styled components (input, list, checkboxes)
- Keyboard shortcut system (j/k navigation, Space toggle, etc.)

## Decision Summary

| Category | Decision | Version | Affects FR Categories | Rationale |
| -------- | -------- | ------- | -------------------- | --------- |
| Framework | Electron + Vite + TypeScript | Forge v7+ / Vite 5+ | All | Fast startup, Windows desktop, TypeScript safety |
| Data Persistence | TOON (Token-Oriented Object Notation) | @toon-format/toon 1.0.0 | Task Management, Data Persistence | Human-readable, compact, future-proof for AI features |
| Auto-Update | electron-updater | 6.7.1 | Auto-Update | Official solution, GitHub Releases hosting, Windows NSIS support |
| Error Handling | Try-catch with inline feedback | Native | All | Terminal aesthetic, immediate feedback, no modals |
| Performance | Multi-pronged optimization | Vite + Terser | All | <2s startup target, bundle analysis, code splitting |
| State Management | Vanilla TypeScript classes | Native | Task Management | Simple CRUD, no framework overhead, direct control |
| Keyboard System | Custom KeyboardManager class | Native | Keyboard Navigation | Centralized shortcuts, conflict detection, help generation |
| File Organization | Hybrid (electron/ + src/) | Native | All | Clear main/renderer separation, feature modules |
| Testing | Unit tests (Vitest) | Vitest latest | Development | Core logic coverage, iteration speed |
| Logging | electron-log | 5.4.1 | All | File-based logs, level control, user support |
| Build Optimization | Custom + Bundle Analysis | visualizer 6.0.5 | Performance | Size targets, vendor chunking, stats monitoring |

## Project Structure

```
spardutti-todo/
├── electron/                       # Main process
│   ├── main.ts                    # Window creation, app lifecycle
│   ├── preload.ts                 # IPC bridge (if needed)
│   └── updater.ts                 # electron-updater configuration
│
├── src/                           # Renderer process (UI)
│   ├── store/
│   │   ├── TodoStore.ts           # Todo state management (add, toggle, delete)
│   │   └── TodoStore.test.ts      # Unit tests
│   │
│   ├── keyboard/
│   │   ├── KeyboardManager.ts     # Shortcut registration and handling
│   │   └── KeyboardManager.test.ts
│   │
│   ├── storage/
│   │   ├── ToonStorage.ts         # TOON encode/decode + file I/O
│   │   └── ToonStorage.test.ts
│   │
│   ├── ui/
│   │   ├── render.ts              # DOM rendering utilities
│   │   ├── components.ts          # Terminal-styled component helpers
│   │   └── styles.css             # Matrix Green theme
│   │
│   ├── types/
│   │   ├── Todo.ts                # Todo interface
│   │   └── Shortcut.ts            # ShortcutHandler types
│   │
│   ├── utils/
│   │   └── errors.ts              # Error handling utilities
│   │
│   └── main.ts                    # Renderer entry point
│
├── index.html                     # App HTML shell
├── package.json
├── tsconfig.json
├── vite.main.config.ts            # Vite config for main process
├── vite.preload.config.ts         # Vite config for preload
├── vite.renderer.config.ts        # Vite config for renderer
└── forge.config.ts                # Electron Forge configuration
```

## FR Category to Architecture Mapping

| FR Category | FRs | Architecture Components | Location |
| ----------- | --- | ---------------------- | -------- |
| **Task Management** | FR1-FR6 | TodoStore, render.ts, components.ts | src/store/, src/ui/ |
| **Data Persistence** | FR7-FR10 | ToonStorage, TodoStore | src/storage/, src/store/ |
| **Keyboard Navigation** | FR11-FR17 | KeyboardManager, event handlers | src/keyboard/ |
| **App Launch & Performance** | FR18-FR21 | main.ts (Electron), Vite optimization | electron/, vite configs |
| **Auto-Update** | FR22-FR25 | updater.ts, electron-updater | electron/updater.ts |
| **User Interface** | FR26-FR30 | styles.css, components.ts, render.ts | src/ui/ |

**All FRs have architectural support. No gaps.**

## Technology Stack Details

### Core Technologies

**Runtime:**
- Electron 33+ (Chromium + Node.js for Windows desktop)
- Node.js 22+ (required for rollup-plugin-visualizer)
- TypeScript 5.9+ (strict mode, type safety)

**Build & Bundling:**
- Vite 5+ (fast dev server, HMR, production bundling)
- Electron Forge 7+ (packaging, distribution, auto-update integration)
- Terser (minification, console.log removal)
- rollup-plugin-visualizer 6.0.5 (bundle analysis)

**Data & Persistence:**
- @toon-format/toon 1.0.0 (TOON encode/decode)
- Node.js fs module (file system access)
- Storage location: %APPDATA%/spardutti-todo/

**Auto-Update:**
- electron-updater 6.7.1 (Windows NSIS updates)
- GitHub Releases (update hosting)

**Logging:**
- electron-log 5.4.1 (file + console logging)
- Log location: %APPDATA%/spardutti-todo/logs/

**Testing:**
- Vitest (unit tests for core logic)
- Co-located test files (*.test.ts)

**Styling:**
- Pure CSS (no preprocessor, no CSS-in-JS)
- Matrix Green theme (#00FF00, #004400, #008800, #000000, #FF0000)
- Consolas monospace font, 14px

### Integration Points

**Main ↔ Renderer Communication:**
- IPC (if needed for file system access beyond renderer capabilities)
- Preload script exposes safe APIs to renderer

**Renderer ↔ File System:**
- ToonStorage handles all file I/O
- Path: `app.getPath('userData')/todos.toon`

**Renderer ↔ DOM:**
- Direct DOM manipulation (no virtual DOM)
- Unidirectional data flow: Store → render() → DOM

**App ↔ Update Server:**
- electron-updater checks GitHub Releases
- Background download, auto-install on restart

**No External APIs:** Fully offline, local-only application

## Novel Pattern Designs

**No novel patterns required.** spardutti-todo uses established desktop application patterns:
- Todo list CRUD (standard state management)
- Keyboard shortcut system (common pattern)
- Local file persistence (standard approach)
- Terminal aesthetic (CSS styling)

All patterns have existing solutions. No architectural innovation needed.

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

**Files:**
- Classes: PascalCase (TodoStore.ts, KeyboardManager.ts)
- Utilities: camelCase (render.ts, errors.ts)
- Types: PascalCase (Todo.ts, types.d.ts)
- Tests: *.test.ts (TodoStore.test.ts)

**Code:**
- Classes: PascalCase (TodoStore, KeyboardManager)
- Functions: camelCase (saveTodos, handleKeyPress)
- Variables: camelCase (todoList, isCompleted)
- Constants: UPPER_SNAKE (MAX_TODOS, APP_NAME)
- Types/Interfaces: PascalCase (Todo, ShortcutHandler)
- Private class members: _prefixed (_todos, _filePath)

### Structure Patterns

**Test Location:** Co-located with source (TodoStore.test.ts next to TodoStore.ts)

**Import Order:**
1. External dependencies (electron, @toon-format/toon)
2. Internal modules (@/store, @/keyboard)
3. Types (@/types)
4. Relative imports (./utils)

**Class Structure:**
```typescript
class TodoStore {
  // 1. Private properties
  private _todos: Todo[]
  private _filePath: string

  // 2. Constructor
  constructor(filePath: string) { }

  // 3. Public methods (alphabetical)
  add() { }
  async load() { }
  async save() { }
  toggle() { }

  // 4. Private methods (alphabetical)
  private _encode() { }
  private _validate() { }
}
```

**Function Organization:** Public methods first, then private methods, alphabetical within each group

### Format Patterns

**TOON Structure (todos.toon):**
```toon
todos[N]{id,text,completed,createdAt}:
  uuid-1,Task text,false,2025-11-20T10:00:00Z
  uuid-2,Task text,true,2025-11-20T11:00:00Z

version: 1.0
```

**Error Messages:**
- Format: "Action failed. Suggestion." (2 sentences max, actionable)
- Examples:
  - "Failed to save. Try again."
  - "Data file corrupted. Backup and reset?"
- Never: "An error occurred" (too vague)
- Color: Red (#FF0000), inline placement

**Log Messages:**
```typescript
log.error('Failed to save todos', { error: e.message, count })
log.info('App started', { version, todos: count })
log.debug('Shortcut fired', { key, handler: name })
```
- Pattern: `log.level('Action description', { context })`
- No PII in logs (redact todo text if logging operations)

**Date Format:** ISO 8601 strings only (2025-11-20T10:00:00Z)

### Communication Patterns

**Component Interaction Flow:**
```
User Input → KeyboardManager → TodoStore → ToonStorage → File System
                                    ↓
                              render() → DOM
```

**State Updates (Unidirectional):**
- TodoStore is single source of truth
- All mutations through TodoStore methods (add, toggle, deleteCompleted)
- UI re-renders after each mutation
- No direct DOM → Store updates

**Event Handling:**
```typescript
// KeyboardManager captures all keyboard events
window.addEventListener('keydown', (e) => keyboardManager.handle(e))

// Handlers call TodoStore methods
keyboardManager.register('enter', () => {
  const text = inputElement.value
  todoStore.add(text)
  renderTodos()
})
```

**No Global State:** All state flows through TodoStore instance

### Lifecycle Patterns

**Loading States:**
- No spinners or loading UI (everything instant or appears instant)
- File load failure: Show error inline, offer "Start fresh" button
- All async operations: await in try-catch, no loading indicators

**Error Recovery:**
```typescript
try {
  await todoStore.save()
} catch (error) {
  showError('Failed to save. Try again.')
  log.error('Save failed', error)
  // State remains in memory, retry available
}
```

**App Lifecycle:**
```
1. Launch → Load TOON file → Render todos → Focus input (immediate)
2. User actions → Update store → Save TOON → Re-render (immediate)
3. Close → Auto-save complete (already saved on each change, no prompt)
```

**No Confirmations:** All actions auto-save immediately (EXCEPT bulk delete with Y/n prompt)

### Location Patterns

**Config/Data Paths:**
- User data directory: `app.getPath('userData')` → `%APPDATA%/spardutti-todo/`
- Todos file: `%APPDATA%/spardutti-todo/todos.toon`
- Logs: `%APPDATA%/spardutti-todo/logs/main.log`
- Never use relative paths in production code

**Import Aliases:**
```typescript
import { TodoStore } from '@/store/TodoStore'
import { KeyboardManager } from '@/keyboard/KeyboardManager'
import type { Todo } from '@/types/Todo'
```

**Asset Paths:** Relative to index.html (./assets/)

### Consistency Rules (Cross-Cutting)

**Terminal Aesthetic Enforcement:**
- Font: Consolas monospace, 14px (no exceptions, no font size variations)
- Colors: Matrix Green palette ONLY (#00FF00, #004400, #008800, #000000, #FF0000)
- No animations or transitions (instant state changes)
- No box shadows (except input focus glow: `0 0 8px #00FF00`)
- Borders: 1px solid green (#00FF00)
- Background: Pure black (#000000)

**Keyboard-First Discipline:**
- Every action MUST have keyboard shortcut
- Tab order: Input → Todos (top to bottom) → Input (cycle)
- Focus indicators always visible (green glow or background tint)
- Mouse is convenience, keyboard is primary interface

**Performance Discipline:**
- No setTimeout/setInterval for UI updates (use RAF if needed)
- Batch DOM updates (DocumentFragment for list rendering)
- No premature optimization (measure first with DevTools)
- All operations appear instant (<16ms target)

**Type Safety Requirements:**
- Strict TypeScript enabled (noImplicitAny, strictNullChecks)
- No `any` types (use `unknown` + type guards if needed)
- Export types for cross-module use
- Interface for public APIs, type for internal structures

**AI Agent Enforcement:**
All agents MUST follow these patterns exactly. Deviations cause runtime conflicts.

## Data Architecture

### Data Models

```typescript
// Todo.ts
interface Todo {
  id: string              // UUID v4
  text: string            // User-entered task description
  completed: boolean      // Completion status
  createdAt: string       // ISO 8601 timestamp
}

// ShortcutHandler (Keyboard system)
interface ShortcutHandler {
  key: string             // Normalized key (e.g., "ctrl+d", "j")
  handler: () => void     // Action to execute
  description: string     // Human-readable description for help
}
```

### Data Relationships

**No relational data.** Simple flat list of todos. No foreign keys, no joins, no relations.

### Data Flow

```
File System (todos.toon)
    ↓ load
ToonStorage.decode()
    ↓
TodoStore._todos[] (in-memory array)
    ↓ CRUD operations
TodoStore methods (add, toggle, deleteCompleted)
    ↓
ToonStorage.encode()
    ↓ save
File System (todos.toon)
```

### File Format (TOON)

```toon
todos[N]{id,text,completed,createdAt}:
  550e8400-e29b-41d4-a716-446655440000,Implement keyboard nav,false,2025-11-20T10:00:00Z
  6ba7b810-9dad-11d1-80b4-00c04fd430c8,Add Matrix Green theme,true,2025-11-20T11:30:00Z

version: 1.0
```

### Backup Strategy

- **Automatic:** User can copy %APPDATA%/spardutti-todo/todos.toon manually
- **Version control:** TOON is human-readable, can be git-tracked
- **Recovery:** If file corrupted, offer "Start fresh" with empty list
- **No cloud sync:** Intentional design decision (local-only)

## API Contracts

**No REST/GraphQL APIs.** This is a local-only desktop application.

### Internal APIs (TypeScript Interfaces)

**TodoStore Public API:**
```typescript
class TodoStore {
  async load(): Promise<void>
  async save(): Promise<void>
  add(text: string): Todo
  toggle(id: string): void
  deleteCompleted(): number
  getAll(): Todo[]
}
```

**KeyboardManager Public API:**
```typescript
class KeyboardManager {
  register(key: string, handler: () => void, description: string): void
  unregister(key: string): void
  handle(event: KeyboardEvent): boolean
  getHints(): string
}
```

**ToonStorage Public API:**
```typescript
class ToonStorage {
  static async load(filePath: string): Promise<Todo[]>
  static async save(filePath: string, todos: Todo[]): Promise<void>
  static encode(todos: Todo[]): string
  static decode(toonString: string): Todo[]
}
```

### IPC Communication (if needed)

If renderer can't access file system directly, use IPC:
```typescript
// Main process exposes via preload
contextBridge.exposeInMainWorld('fileSystem', {
  readTodos: () => ipcRenderer.invoke('read-todos'),
  writeTodos: (todos: Todo[]) => ipcRenderer.invoke('write-todos', todos)
})
```

## Security Architecture

**Threat Model: Low Risk**

spardutti-todo is a local-only, single-user desktop application with no network communication (except auto-updates), no authentication, and no sensitive data.

### Security Measures

**1. Data Protection:**
- Data stored locally in %APPDATA% (user-specific directory)
- No encryption at rest (todos are not sensitive)
- No network transmission (offline-only)
- File permissions: Standard user file permissions (Windows NTFS)

**2. Code Integrity:**
- TypeScript strict mode (type safety)
- No eval() or dynamic code execution
- No user-provided code execution
- Dependencies: Minimal, audited (npm audit in CI)

**3. Update Security:**
- electron-updater validates signatures (if configured)
- Updates from trusted source (GitHub Releases)
- HTTPS-only download
- **Production:** Code signing recommended for Windows (prevents SmartScreen warnings)

**4. Input Validation:**
- Todo text: No length limit, supports Unicode
- No SQL injection risk (no database)
- No XSS risk (direct DOM manipulation, no innerHTML with user data)
- File path validation: Use Node.js path.join, never concatenate user input

**5. Electron Security:**
- Context isolation enabled (preload script boundary)
- Node integration disabled in renderer (if possible)
- CSP headers (Content Security Policy) in HTML

### Non-Applicable Security Concerns

- Authentication: N/A (single-user local app)
- Authorization: N/A (no multi-user)
- HTTPS/TLS: N/A (no network communication except updates)
- GDPR/HIPAA: N/A (no PII, no sensitive data)
- Rate limiting: N/A (no API)

## Performance Considerations

**Primary Goal:** <2 second task capture (alt-tab in → type → Enter → alt-tab out)

### Startup Performance

**Target:** <2s cold start, <1s warm start

**Optimizations:**
1. **Minimal dependencies:** TOON + electron-updater only
2. **Code splitting:** No lazy loading needed (app is small)
3. **Vite pre-bundling:** Dependency optimization enabled
4. **Bundle size target:** <500KB renderer bundle (gzipped <200KB)
5. **Main process:** Minimal work before window.show()

**Measurement:**
```typescript
// Log startup time
const startTime = Date.now()
app.on('ready', async () => {
  // ... initialization
  log.info('App ready', { startupMs: Date.now() - startTime })
})
```

### Runtime Performance

**Input Latency:** Zero perceived lag (<16ms response)
```typescript
// Immediate feedback
inputElement.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    const todo = todoStore.add(inputElement.value)
    renderTodoItem(todo)  // Immediate DOM update
    inputElement.value = '' // Instant clear
  }
})
```

**Rendering 1000+ todos:** <100ms initial render
```typescript
// Batch DOM updates
const fragment = document.createDocumentFragment()
todos.forEach(todo => {
  fragment.appendChild(createTodoElement(todo))
})
listElement.appendChild(fragment) // Single reflow
```

**File I/O:** Async, non-blocking
```typescript
// Save doesn't block UI
async save() {
  try {
    await fs.writeFile(this._filePath, ToonStorage.encode(this._todos))
  } catch (error) {
    log.error('Save failed', error)
  }
}
```

### Memory Management

- **Todos in memory:** Array of objects (minimal overhead)
- **No memory leaks:** Event listeners cleaned up on app quit
- **No caching:** File read on launch, write on change (simple)

### Performance Monitoring

- **Development:** Chrome DevTools Performance tab
- **Production:** electron-log tracks startup time
- **CI/CD:** Bundle size tracked in PR comments

## Deployment Architecture

**Platform:** Windows 10+ (64-bit)

### Build Pipeline

```
1. Development → git push → GitHub
2. GitHub Actions CI
   ├─ npm install
   ├─ npm test (Vitest unit tests)
   ├─ npm run lint
   ├─ npm run build
   └─ Electron Forge package (Windows NSIS installer)
3. GitHub Release
   ├─ Upload .exe installer
   ├─ Upload latest.yml (electron-updater metadata)
   └─ Tag version (e.g., v1.0.0)
4. Users download from GitHub Releases
5. Auto-update checks GitHub Releases for new versions
```

### Distribution

**Installer Format:** NSIS (Nullsoft Scriptable Install System)
- Generated by Electron Forge
- Single .exe file (~50-80MB)
- Installs to: C:\Users\{User}\AppData\Local\Programs\spardutti-todo\
- Creates Start Menu shortcut
- Adds uninstaller

**Update Mechanism:**
- electron-updater checks GitHub Releases on app launch
- Downloads update in background
- Notifies user: "Update available. Restart to install?"
- Installs on next restart

### Hosting

- **Code:** GitHub repository (public or private)
- **Releases:** GitHub Releases (free hosting)
- **No server required:** Static file hosting via GitHub

### Versioning

- Semantic versioning: vMAJOR.MINOR.PATCH (e.g., v1.0.0)
- Version in package.json
- electron-updater reads version from package.json

### Release Process

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Build and package
npm run make

# 3. Create GitHub Release
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes "Release notes..." \
  out/make/nsis/x64/*.exe \
  out/make/nsis/x64/latest.yml

# 4. Users auto-update
```

## Development Environment

### Prerequisites

**Required:**
- Node.js 22+ (for rollup-plugin-visualizer)
- npm 10+ (package manager)
- Git (version control)
- Windows 10+ (development and testing platform)

**Recommended:**
- VS Code (TypeScript IntelliSense)
- VS Code extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### Setup Commands

```bash
# 1. Initialize project with Electron Forge
npx create-electron-app@latest spardutti-todo --template=vite-typescript

# 2. Navigate to project
cd spardutti-todo

# 3. Install dependencies
npm install @toon-format/toon electron-updater electron-log rollup-plugin-visualizer --save
npm install vitest @types/node --save-dev

# 4. Configure Vite import aliases (tsconfig.json)
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# 5. Run development server
npm start

# 6. Run tests
npm test

# 7. Build for production
npm run make

# 8. Analyze bundle
npm run build:analyze
```

### Development Workflow

```bash
# Start dev server with HMR
npm start

# Run unit tests (watch mode)
npm test -- --watch

# Lint code
npm run lint

# Format code (if Prettier configured)
npm run format

# Build production bundle
npm run build

# Package for Windows
npm run make

# Analyze bundle size
npm run build:analyze
```

### Environment Variables

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

### Debugging

**Renderer Process:**
- Chrome DevTools (F12 in app)
- React DevTools: N/A (no React)
- Console logging: Available in DevTools

**Main Process:**
- VS Code debugger (attach to main process)
- electron-log writes to file
- console.log appears in terminal

**Configuration (.vscode/launch.json):**
```json
{
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."]
    }
  ]
}
```

## Architecture Decision Records (ADRs)

### ADR-001: TOON Format for Data Persistence

**Decision:** Use TOON (Token-Oriented Object Notation) instead of JSON

**Context:** Need human-readable local storage format (FR10) that supports manual editing and backup

**Alternatives Considered:**
- JSON: Standard, universal, but verbose
- SQLite: Fast queries, but binary format (not human-readable)
- LocalStorage/IndexedDB: Browser APIs, but quota limits and harder to backup

**Decision:** TOON format with @toon-format/toon v1.0.0

**Rationale:**
- Human-readable (YAML-style + CSV-style)
- 30-60% more compact than JSON (smaller file size)
- TypeScript SDK available
- Future-proof for AI features (LLM-optimized)
- Meets FR10 requirement exactly

**Consequences:**
- Newer format (less ecosystem support than JSON)
- Dependency on @toon-format/toon package
- Need encode/decode layer in ToonStorage
- Trade-off accepted: Innovation over safety for personal tool

---

### ADR-002: Vanilla TypeScript Classes for State Management

**Decision:** Use vanilla TypeScript classes (TodoStore) instead of state management library

**Context:** Need state management for simple todo CRUD operations

**Alternatives Considered:**
- React Context: Requires React framework
- Zustand/Jotai: External dependency, overkill for simple state
- RxJS Observables: Complexity overhead

**Decision:** Vanilla TypeScript class (TodoStore)

**Rationale:**
- No framework needed (custom terminal UI)
- Simple CRUD fits class model naturally
- TypeScript provides type safety
- Direct control for performance optimization
- Zero dependencies beyond language

**Consequences:**
- No reactive bindings (manual re-render after mutations)
- Simple unidirectional flow (Store → render() → DOM)
- Easy to test (pure TypeScript, no framework mocking)

---

### ADR-003: Custom KeyboardManager Over External Library

**Decision:** Build custom KeyboardManager class instead of using Mousetrap or similar

**Context:** Need centralized keyboard shortcut system for 15+ shortcuts (j/k, Space, Ctrl+D, etc.)

**Alternatives Considered:**
- Native addEventListener for each shortcut: Too scattered, no conflict detection
- Mousetrap library: External dependency, more than needed
- Electron globalShortcut API: System-wide shortcuts (not needed)

**Decision:** Custom KeyboardManager class

**Rationale:**
- Full control over normalization logic
- Built-in conflict detection (throw on duplicate registration)
- Help screen generation from registered shortcuts
- Zero dependencies
- Terminal-specific needs (j/k vim-style navigation)

**Consequences:**
- Need to implement key normalization (ctrl+d, j, space)
- Maintain our own shortcut registry
- Custom testing needed
- Trade-off: Control and simplicity over external package

---

### ADR-004: Electron Forge with Vite Over electron-builder

**Decision:** Use Electron Forge (with Vite plugin) as build toolchain

**Context:** Need to package Electron app for Windows distribution with auto-update support

**Alternatives Considered:**
- electron-builder: Popular, feature-rich
- Electron Forge: Official tooling, Vite integration

**Decision:** Electron Forge with vite-typescript template

**Rationale:**
- Official Electron tooling (maintained by Electron team)
- Vite plugin provides fast HMR and build
- TypeScript template includes tsconfig + ESLint
- electron-updater integrates seamlessly
- Simpler configuration than electron-builder

**Consequences:**
- Slightly less flexibility than electron-builder
- Fewer third-party plugins
- Trade-off: Official support and simplicity over feature breadth

---

### ADR-005: No UI Framework (Custom Terminal Components)

**Decision:** Build custom terminal-styled components without React/Vue/Svelte

**Context:** Need Matrix Green terminal aesthetic with minimal bundle size for <2s startup

**Alternatives Considered:**
- React: Popular, but adds ~45KB + overhead
- Vue: Lighter than React, but still adds framework weight
- Svelte: Compiles away, but adds build complexity

**Decision:** Pure TypeScript + direct DOM manipulation

**Rationale:**
- Terminal aesthetic requires custom styling anyway (no component library fits)
- Direct DOM manipulation = zero framework overhead
- Simple UI (input + list) doesn't need virtual DOM
- Performance: No reconciliation, instant updates
- Bundle size: Smallest possible

**Consequences:**
- Manual DOM updates (no reactive bindings)
- More imperative code (less declarative)
- Testing requires DOM mocking
- Trade-off: Maximum performance and control over developer convenience

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-20_
_For: Spardutti_
_Project: spardutti-todo - Minimal Windows Desktop Todo App_
