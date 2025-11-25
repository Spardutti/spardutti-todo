# Architecture

## Executive Summary

spardutti-todo uses Electron with Vite + TypeScript for ultra-fast development and optimal startup performance. The architecture prioritizes the 2-second task capture goal through minimal dependencies, local-first data storage, and custom terminal-styled components. All architectural decisions are optimized for speed, keyboard efficiency, and consistency across AI agent implementations.

**Version 2.0** extends the architecture to support Growth features: a Projects system for organizing todos into isolated containers, cross-platform Linux distribution, and quality-of-life improvements.

## Project Initialization

**First implementation story must execute:**

```bash
npx create-electron-app@latest spardutti-todo --template=vite-typescript
```

**Starter Template Provides:**
- **TypeScript**: Full configuration with tsconfig.json (language consistency)
- **Vite**: Fast build tooling with HMR (sub-2s startup optimization)
- **Electron Forge**: Packaging and distribution for Windows and Linux
- **Project Structure**: Main process, preload script, renderer separation
- **Build Scripts**: Development and production build commands
- **Linting**: ESLint configuration (code quality)

**What We Add:**
- Custom terminal CSS (Matrix Green theme, no UI framework)
- Local storage management (TOON-based multi-file persistence)
- Auto-update integration (electron-updater)
- Terminal-styled components (input, list, checkboxes, project indicator)
- Keyboard shortcut system (j/k navigation, Space toggle, Ctrl+P project switch)
- Projects system with isolated todo containers

## Decision Summary

| Category | Decision | Version | Affects FR Categories | Rationale |
| -------- | -------- | ------- | -------------------- | --------- |
| Framework | Electron + Vite + TypeScript | Forge v7+ / Vite 5+ | All | Fast startup, cross-platform desktop, TypeScript safety |
| Data Persistence | TOON (Token-Oriented Object Notation) | @toon-format/toon 1.0.0 | Task Management, Data Persistence, Projects | Human-readable, compact, future-proof for AI features |
| Data Storage Strategy | Multi-file (projects.toon + todos-{id}.toon + settings.toon) | Native | Projects, Data Persistence | Project isolation, fast per-project loading |
| Auto-Update | electron-updater | 6.7.1 | Auto-Update | Official solution, GitHub Releases hosting, Windows NSIS + Linux AppImage support |
| Error Handling | Try-catch with inline feedback | Native | All | Terminal aesthetic, immediate feedback, no modals |
| Performance | Multi-pronged optimization | Vite + Terser | All | <2s startup target, bundle analysis, code splitting |
| State Management | Separate vanilla TypeScript classes | Native | Task Management, Projects | Single responsibility: TodoStore, ProjectStore, SettingsStore |
| Keyboard System | Custom KeyboardManager class | Native | Keyboard Navigation | Centralized shortcuts, conflict detection, help generation |
| Project Search | Simple includes() matching | Native | Projects | Sufficient for 5-10 projects, zero dependencies |
| Project UI | Inline footer search + header dropdown | Native | Projects | Terminal aesthetic, no modals |
| File Organization | Hybrid (electron/ + src/) | Native | All | Clear main/renderer separation, feature modules |
| Testing | Unit tests (Vitest) | Vitest latest | Development | Core logic coverage, iteration speed |
| Logging | electron-log | 5.4.1 | All | File-based logs, level control, user support |
| Build Optimization | Custom + Bundle Analysis | visualizer 6.0.5 | Performance | Size targets, vendor chunking, stats monitoring |
| Linux Packaging | AppImage | @electron-forge/maker-appimage | Linux Distribution | Auto-update support, portable, all-distro compatible |

## Project Structure

```
spardutti-todo/
├── electron/                       # Main process
│   ├── main.ts                    # Window creation, app lifecycle, window bounds persistence
│   ├── preload.ts                 # IPC bridge
│   └── updater.ts                 # electron-updater configuration
│
├── src/                           # Renderer process (UI)
│   ├── store/
│   │   ├── TodoStore.ts           # Todo CRUD (scoped to active project)
│   │   ├── TodoStore.test.ts
│   │   ├── ProjectStore.ts        # Project CRUD (create, rename, delete, list)
│   │   ├── ProjectStore.test.ts
│   │   ├── SettingsStore.ts       # App state (active project, window bounds)
│   │   └── SettingsStore.test.ts
│   │
│   ├── keyboard/
│   │   ├── KeyboardManager.ts     # Shortcut registration and handling
│   │   └── KeyboardManager.test.ts
│   │
│   ├── storage/
│   │   ├── ToonStorage.ts         # TOON encode/decode + file I/O
│   │   ├── ToonStorage.test.ts
│   │   ├── migration.ts           # v1→v2 data migration (single file → multi-file)
│   │   └── migration.test.ts
│   │
│   ├── ui/
│   │   ├── render.ts              # DOM rendering utilities
│   │   ├── components.ts          # Terminal-styled component helpers
│   │   ├── projectSearch.ts       # Inline footer fuzzy search for projects
│   │   ├── projectIndicator.ts    # Header/footer project name + dropdown
│   │   └── styles.css             # Matrix Green theme
│   │
│   ├── types/
│   │   ├── Todo.ts                # Todo interface
│   │   ├── Project.ts             # Project interface
│   │   ├── Settings.ts            # AppSettings interface
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
└── forge.config.ts                # Electron Forge configuration (NSIS + AppImage)
```

## FR Category to Architecture Mapping

### MVP Features (FR1-FR30)

| FR Category | FRs | Architecture Components | Location |
| ----------- | --- | ---------------------- | -------- |
| **Task Management** | FR1-FR6 | TodoStore, render.ts, components.ts | src/store/, src/ui/ |
| **Data Persistence** | FR7-FR10 | ToonStorage, TodoStore | src/storage/, src/store/ |
| **Keyboard Navigation** | FR11-FR17 | KeyboardManager, event handlers | src/keyboard/ |
| **App Launch & Performance** | FR18-FR21 | main.ts (Electron), Vite optimization | electron/, vite configs |
| **Auto-Update** | FR22-FR25 | updater.ts, electron-updater | electron/updater.ts |
| **User Interface** | FR26-FR30 | styles.css, components.ts, render.ts | src/ui/ |

### Growth Features (FR31-FR48)

| FR Category | FRs | Architecture Components | Location |
| ----------- | --- | ---------------------- | -------- |
| **Projects System** | FR31-FR40 | ProjectStore, SettingsStore, projectSearch.ts, projectIndicator.ts, migration.ts | src/store/, src/ui/, src/storage/ |
| **Polish & QoL** | FR41-FR45 | SettingsStore (window bounds), TodoStore (ordering), styles.css (version), updater.ts (progress), KeyboardManager (remove ESC) | Various |
| **Linux Distribution** | FR46-FR48 | forge.config.ts (AppImage maker), electron-updater (AppImage support) | config, electron/ |

**Detailed Growth FR Mapping:**

| FR | Description | Architecture Components | Location |
|----|-------------|------------------------|----------|
| **FR31** | Create multiple projects | ProjectStore, Project type | src/store/, src/types/ |
| **FR32** | Switch projects via keyboard fuzzy search | KeyboardManager (Ctrl+P), projectSearch.ts | src/keyboard/, src/ui/ |
| **FR33** | Switch projects via mouse dropdown | projectIndicator.ts | src/ui/ |
| **FR34** | See active project indicator | projectIndicator.ts, render.ts | src/ui/ |
| **FR35** | Rename projects | ProjectStore, projectIndicator.ts | src/store/, src/ui/ |
| **FR36** | Delete projects with confirmation | ProjectStore, render.ts (confirm) | src/store/, src/ui/ |
| **FR37** | Default project on first launch | migration.ts, ProjectStore | src/storage/, src/store/ |
| **FR38** | Auto-add todos to active project | TodoStore (scoped), SettingsStore | src/store/ |
| **FR39** | Project isolation (no cross-view) | Multi-file storage, TodoStore scoping | src/storage/, src/store/ |
| **FR40** | Project data persistence | ToonStorage (projects.toon) | src/storage/ |
| **FR41** | Remember window size | SettingsStore, electron/main.ts | src/store/, electron/ |
| **FR42** | Todos append to top | TodoStore.add() uses unshift | src/store/ |
| **FR43** | Version visibility | styles.css (improved contrast) | src/ui/ |
| **FR44** | Update progress display | updater.ts, footer UI | electron/, src/ui/ |
| **FR45** | Remove ESC shortcut | KeyboardManager (unregister ESC) | src/keyboard/ |
| **FR46** | Linux package (AppImage) | forge.config.ts | config |
| **FR47** | Linux feature parity | Cross-platform paths (app.getPath) | N/A (already compatible) |
| **FR48** | Linux auto-update | electron-updater (AppImage native) | electron/ |

**All 48 FRs have architectural support. No gaps.**

## Technology Stack Details

### Core Technologies

**Runtime:**
- Electron 33+ (Chromium + Node.js for Windows/Linux desktop)
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
- Storage location:
  - Windows: `%APPDATA%/spardutti-todo/`
  - Linux: `~/.config/spardutti-todo/`

**Auto-Update:**
- electron-updater 6.7.1 (Windows NSIS + Linux AppImage updates)
- GitHub Releases (update hosting)

**Logging:**
- electron-log 5.4.1 (file + console logging)
- Log location: `{userData}/logs/main.log`

**Testing:**
- Vitest (unit tests for core logic)
- Co-located test files (*.test.ts)

**Styling:**
- Pure CSS (no preprocessor, no CSS-in-JS)
- Matrix Green theme (#00FF00, #004400, #008800, #000000, #FF0000)
- Consolas monospace font, 14px

### Integration Points

**Main ↔ Renderer Communication:**
- IPC for file system access and window bounds
- Preload script exposes safe APIs to renderer

**Renderer ↔ File System:**
- ToonStorage handles all file I/O
- Multi-file structure:
  - `{userData}/projects.toon` - Project index
  - `{userData}/todos-{projectId}.toon` - Per-project todos
  - `{userData}/settings.toon` - App state

**Renderer ↔ DOM:**
- Direct DOM manipulation (no virtual DOM)
- Unidirectional data flow: Store → render() → DOM

**App ↔ Update Server:**
- electron-updater checks GitHub Releases
- Background download, auto-install on restart
- Progress feedback in footer

**No External APIs:** Fully offline, local-only application

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

// Project.ts
interface Project {
  id: string              // UUID v4
  name: string            // User-defined name (e.g., "SequenceStack")
  createdAt: string       // ISO 8601 timestamp
}

// Settings.ts
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

// ShortcutHandler (Keyboard system)
interface ShortcutHandler {
  key: string             // Normalized key (e.g., "ctrl+d", "j")
  handler: () => void     // Action to execute
  description: string     // Human-readable description for help
}
```

### Data Relationships

```
Project (1) ←→ (N) Todo
  └── Each project contains isolated todo list
  └── No cross-project visibility

Settings (1) ←→ (1) Active Project
  └── Settings.activeProjectId references Project.id
```

### Data Flow

**MVP Flow (unchanged for todos within active project):**
```
File System (todos-{projectId}.toon)
    ↓ load
ToonStorage.decode()
    ↓
TodoStore._todos[] (in-memory array)
    ↓ CRUD operations
TodoStore methods (add, toggle, deleteCompleted)
    ↓
ToonStorage.encode()
    ↓ save
File System (todos-{projectId}.toon)
```

**Projects Flow:**
```
App Launch
    ↓
migration.migrateIfNeeded()  // v1→v2 auto-migration
    ↓
SettingsStore.load()         // Get activeProjectId, windowBounds
    ↓
ProjectStore.load()          // Load project index
    ↓
TodoStore.load(activeProjectId)  // Load active project's todos
    ↓
render()
```

**Project Switch Flow:**
```
User: Ctrl+P → type "seq" → Enter
    ↓
projectSearch.filter("seq")  // includes() match
    ↓
switchProject(matchedProjectId)
    ↓
TodoStore.load(newProjectId)  // Load new project's todos
    ↓
SettingsStore.setActiveProject(newProjectId)  // Persist selection
    ↓
render()
```

### File Format (TOON)

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

### Data Migration (v1 → v2)

**Trigger:** App detects `todos.toon` exists but no `projects.toon`

**Migration steps:**
1. Create Default project with new UUID
2. Rename `todos.toon` → `todos-{defaultProjectId}.toon`
3. Create `projects.toon` with Default project entry
4. Create `settings.toon` with `activeProjectId: defaultProjectId`
5. Backup original: `todos.toon.backup`
6. Log migration success

**Code:**
```typescript
async function migrateIfNeeded(): Promise<void> {
  const hasOldFormat = await exists('todos.toon') && !await exists('projects.toon')
  if (!hasOldFormat) return

  // Backup original
  await fs.copyFile('todos.toon', 'todos.toon.backup')

  // Create default project
  const defaultProject: Project = {
    id: crypto.randomUUID(),
    name: 'Default',
    createdAt: new Date().toISOString()
  }

  // Rename todos file
  await fs.rename('todos.toon', `todos-${defaultProject.id}.toon`)

  // Create project index
  await ToonStorage.saveProjects([defaultProject])

  // Create settings
  await ToonStorage.saveSettings({
    activeProjectId: defaultProject.id,
    windowBounds: { x: 100, y: 100, width: 600, height: 400 },
    version: '1.0'
  })

  log.info('Migrated to multi-project format', { projectId: defaultProject.id })
}
```

### Backup Strategy

- **Automatic:** User can copy `{userData}/*.toon` files manually
- **Version control:** TOON is human-readable, can be git-tracked
- **Recovery:**
  - Corrupt project file: Skip project, log error, continue with others
  - Corrupt settings: Reset to defaults, select first project
  - Migration backup: `todos.toon.backup` preserved
- **No cloud sync:** Intentional design decision (local-only)

## API Contracts

**No REST/GraphQL APIs.** This is a local-only desktop application.

### Internal APIs (TypeScript Interfaces)

**TodoStore Public API:**
```typescript
class TodoStore {
  constructor(projectId: string)

  async load(projectId: string): Promise<void>
  async save(): Promise<void>
  add(text: string): Todo          // Now prepends to top (unshift)
  toggle(id: string): void
  deleteCompleted(): number
  getAll(): Todo[]
  getActive(): Todo[]
  getCompleted(): Todo[]
}
```

**ProjectStore Public API:**
```typescript
class ProjectStore {
  async load(): Promise<void>
  async save(): Promise<void>
  create(name: string): Project
  rename(id: string, newName: string): void
  delete(id: string): void         // Also deletes todos-{id}.toon
  getAll(): Project[]
  findById(id: string): Project | undefined
  search(query: string): Project[] // Simple includes() filter
}
```

**SettingsStore Public API:**
```typescript
class SettingsStore {
  async load(): Promise<void>
  async save(): Promise<void>
  getActiveProjectId(): string
  setActiveProject(projectId: string): void
  getWindowBounds(): WindowBounds
  setWindowBounds(bounds: WindowBounds): void
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
  // Todos (per-project)
  static async loadTodos(projectId: string): Promise<Todo[]>
  static async saveTodos(projectId: string, todos: Todo[]): Promise<void>

  // Projects (index)
  static async loadProjects(): Promise<Project[]>
  static async saveProjects(projects: Project[]): Promise<void>

  // Settings
  static async loadSettings(): Promise<AppSettings>
  static async saveSettings(settings: AppSettings): Promise<void>

  // Generic encode/decode
  static encode<T>(data: T, schema: string): string
  static decode<T>(toonString: string): T
}
```

### IPC Communication

```typescript
// Main process exposes via preload
contextBridge.exposeInMainWorld('electronAPI', {
  // File system
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('write-file', path, data),

  // Window bounds
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setWindowBounds: (bounds: WindowBounds) => ipcRenderer.invoke('set-window-bounds', bounds),

  // App lifecycle
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-updates'),
  onUpdateProgress: (callback: (percent: number) => void) =>
    ipcRenderer.on('update-progress', (_, percent) => callback(percent))
})
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

**Files:**
- Classes: PascalCase (TodoStore.ts, ProjectStore.ts, KeyboardManager.ts)
- Utilities: camelCase (render.ts, errors.ts, migration.ts)
- Types: PascalCase (Todo.ts, Project.ts, Settings.ts)
- Tests: *.test.ts (TodoStore.test.ts)

**Code:**
- Classes: PascalCase (TodoStore, ProjectStore, SettingsStore)
- Functions: camelCase (saveTodos, handleKeyPress, switchProject)
- Variables: camelCase (todoList, activeProject, isCompleted)
- Constants: UPPER_SNAKE (MAX_TODOS, DEFAULT_PROJECT_NAME)
- Types/Interfaces: PascalCase (Todo, Project, AppSettings)
- Private class members: _prefixed (_todos, _projects, _settings)

### Keyboard Shortcuts (Complete Map)

**MVP Shortcuts:**
| Shortcut | Action | Context |
|----------|--------|---------|
| Enter | Create todo / Confirm | Input focused / Confirmation |
| Space | Toggle selected todo | Todo selected |
| j / ArrowDown | Navigate down | Todo list |
| k / ArrowUp | Navigate up | Todo list |
| Ctrl+N / Home | Focus input | Global |
| Ctrl+D | Delete completed (confirm) | Global |
| Ctrl+Q | Quit app | Global |
| Ctrl+U | Manual update check | Global |

**Growth Shortcuts:**
| Shortcut | Action | Context |
|----------|--------|---------|
| Ctrl+P | Open project search | Global |
| Enter | Select project | Project search |
| Escape | Cancel project search | Project search |

**Removed (FR45):**
| Shortcut | Previous Action | Status |
|----------|-----------------|--------|
| Esc | Close app | REMOVED |

### Project Search UI Pattern

**Keyboard (Ctrl+P):**
```
┌─────────────────────────────────────┐
│ [Type todo and press Enter...]     │
│ ☐ Task one                         │
│ ☑ Task two (done)                  │
│                                    │
│ > seq_ [SequenceStack] [Homefront] │  ← Footer becomes search
└─────────────────────────────────────┘

Flow:
1. Ctrl+P → Footer transforms to search mode
2. Type partial name → Filter projects with includes()
3. Arrow keys → Navigate filtered results
4. Enter → Switch to selected project
5. Esc → Cancel, restore normal footer
```

**Mouse (Click indicator):**
```
┌─────────────────────────────────────┐
│ [Type todo and press Enter...]     │
│ ☐ Task one                         │
│                                    │
│ [SequenceStack ▼]  Enter: Save |...│  ← Click to open dropdown
└─────────────────────────────────────┘

       ┌──────────────────┐
       │ SequenceStack  ✓ │
       │ HomefrontGroup   │
       │ Default          │
       │ + New Project    │
       └──────────────────┘
```

### Format Patterns

**Error Messages:**
- Format: "Action failed. Suggestion." (2 sentences max, actionable)
- Project errors:
  - "Failed to switch project. Try again."
  - "Project not found. Select another."
  - "Delete 'Work' and 12 todos inside? [Y/n]"
- Color: Red (#FF0000), inline placement

**Update Progress (FR44):**
```typescript
// Footer displays progress as text
"Downloading update... 45%"
```

**Log Messages:**
```typescript
log.info('Project switched', { from: oldId, to: newId })
log.info('Project created', { id, name })
log.warn('Project migration completed', { backupPath })
log.error('Failed to load project todos', { projectId, error: e.message })
```

### Consistency Rules (Cross-Cutting)

**Terminal Aesthetic Enforcement:**
- Font: Consolas monospace, 14px (no exceptions)
- Colors: Matrix Green palette ONLY (#00FF00, #004400, #008800, #000000, #FF0000)
- No animations or transitions (instant state changes)
- No modals or overlays (inline UI only)
- Borders: 1px solid green (#00FF00)
- Background: Pure black (#000000)

**Keyboard-First Discipline:**
- Every action MUST have keyboard shortcut
- Project switching: Ctrl+P (keyboard primary), click dropdown (mouse secondary)
- Focus indicators always visible
- Mouse is convenience, keyboard is primary interface

**Project Isolation Enforcement:**
- TodoStore MUST be scoped to single project at a time
- No API to query todos across projects
- Project switch = full TodoStore reload
- Each project's todos in separate file

**AI Agent Enforcement:**
All agents MUST follow these patterns exactly. Deviations cause runtime conflicts.

## Deployment Architecture

**Platforms:**
- Windows 10+ (64-bit) - NSIS installer
- Linux (all distros) - AppImage

### Build Pipeline

```
1. Development → git push → GitHub
2. GitHub Actions CI
   ├─ npm install
   ├─ npm test (Vitest unit tests)
   ├─ npm run lint
   ├─ npm run build
   ├─ Electron Forge package (Windows NSIS)
   └─ Electron Forge package (Linux AppImage)
3. GitHub Release
   ├─ Upload spardutti-todo-{version}-setup.exe (Windows)
   ├─ Upload spardutti-todo-{version}.AppImage (Linux)
   ├─ Upload latest.yml (Windows electron-updater metadata)
   ├─ Upload latest-linux.yml (Linux electron-updater metadata)
   └─ Tag version (e.g., v2.0.0)
4. Users download from GitHub Releases
5. Auto-update checks GitHub Releases for new versions
```

### Distribution

**Windows - NSIS Installer:**
- Generated by Electron Forge
- Single .exe file (~50-80MB)
- Installs to: `C:\Users\{User}\AppData\Local\Programs\spardutti-todo\`
- Creates Start Menu shortcut
- Adds uninstaller

**Linux - AppImage:**
- Generated by @electron-forge/maker-appimage
- Single .AppImage file (~80-100MB)
- No installation needed (download and run)
- Auto-update supported by electron-updater
- Works on all Linux distributions

**Forge Configuration:**
```javascript
// forge.config.ts
makers: [
  // Windows
  {
    name: '@electron-forge/maker-squirrel',
    config: {
      name: 'spardutti-todo'
    }
  },
  // Linux
  {
    name: '@electron-forge/maker-appimage',
    config: {
      options: {
        categories: ['Utility'],
        icon: './assets/icon.png'
      }
    }
  }
]
```

### Update Mechanism

**Windows:**
- NSIS installer with electron-updater
- Downloads update in background
- Installs on app restart

**Linux:**
- AppImage with electron-updater (native support)
- Downloads new AppImage in background
- Replaces current AppImage on restart

**Progress Feedback:**
```typescript
autoUpdater.on('download-progress', (progress) => {
  updateFooter(`Downloading update... ${Math.floor(progress.percent)}%`)
})
```

### Release Process

```bash
# 1. Update version in package.json
npm version minor  # e.g., 1.0.0 → 1.1.0

# 2. Build and package for all platforms
npm run make -- --platform=win32
npm run make -- --platform=linux

# 3. Create GitHub Release
gh release create v2.0.0 \
  --title "v2.0.0 - Projects System" \
  --notes "Release notes..." \
  out/make/squirrel.windows/x64/*.exe \
  out/make/squirrel.windows/x64/latest.yml \
  out/make/appimage/x64/*.AppImage \
  out/make/appimage/x64/latest-linux.yml

# 4. Users auto-update on both platforms
```

## Development Environment

### Prerequisites

**Required:**
- Node.js 22+ (for rollup-plugin-visualizer)
- npm 10+ (package manager)
- Git (version control)
- Windows 10+ or Linux (development platforms)

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
npm install vitest @types/node @electron-forge/maker-appimage --save-dev

# 4. Run development server
npm start

# 5. Run tests
npm test

# 6. Build for Windows
npm run make -- --platform=win32

# 7. Build for Linux
npm run make -- --platform=linux
```

## Security Architecture

**Threat Model: Low Risk**

spardutti-todo is a local-only, single-user desktop application with no network communication (except auto-updates), no authentication, and no sensitive data.

### Security Measures

**1. Data Protection:**
- Data stored locally in user-specific directory
- No encryption at rest (todos are not sensitive)
- No network transmission (offline-only)
- File permissions: Standard user file permissions

**2. Project Isolation:**
- Each project's data in separate file
- No cross-project data leakage
- Delete project = delete all associated data

**3. Update Security:**
- electron-updater validates signatures (if configured)
- Updates from trusted source (GitHub Releases)
- HTTPS-only download

**4. Input Validation:**
- Project names: Unicode supported, reasonable length
- Todo text: No length limit, Unicode supported
- File path validation: Use Node.js path.join

## Performance Considerations

**Primary Goal:** <2 second task capture (unchanged)

### Projects Performance

**Project Switch:** <100ms
- Only load active project's todos into memory
- Project index (5-10 projects) loads instantly
- Simple includes() search = O(n) where n ≤ 10

**Startup with Projects:**
1. Load settings.toon (~1ms)
2. Load projects.toon (~1ms)
3. Load active project's todos (~10-50ms depending on count)
4. Total additional overhead: <50ms

### Memory Management

- **Todos in memory:** Only active project's todos
- **Projects in memory:** Full list (5-10 items, negligible)
- **Settings in memory:** Single object

## Architecture Decision Records (ADRs)

### ADR-001 through ADR-005

(Unchanged from v1.0 - see original architecture document)

---

### ADR-006: Multi-File Storage for Projects

**Decision:** Use separate files for projects index, per-project todos, and settings

**Context:** Need to support multiple isolated projects without loading all data at once

**Alternatives Considered:**
- Single file with nested structure: Simple but loads everything
- SQLite database: Fast queries but binary format
- Directory per project: Clean but more file system overhead

**Decision:** Multi-file TOON storage
- `projects.toon` - Project index
- `todos-{projectId}.toon` - Per-project todos
- `settings.toon` - App state

**Rationale:**
- Only load active project's todos (performance)
- Project isolation is file-level (clean separation)
- Human-readable (TOON format maintained)
- Simple migration path from v1

**Consequences:**
- Multiple file I/O operations on startup
- Need migration code for v1 users
- File naming convention must be consistent

---

### ADR-007: Separate Store Classes

**Decision:** Create ProjectStore and SettingsStore alongside TodoStore

**Context:** Need state management for projects and app settings

**Alternatives Considered:**
- Single AppStore: Centralized but violates SRP
- Extend TodoStore: Quick but messy

**Decision:** Three separate stores (TodoStore, ProjectStore, SettingsStore)

**Rationale:**
- Single responsibility principle
- Each store testable in isolation
- Clear ownership of data
- Matches file structure (each store owns its file)

**Consequences:**
- Coordination code in app initialization
- Need to ensure stores stay in sync

---

### ADR-008: Simple includes() for Project Search

**Decision:** Use basic string includes() instead of fuzzy search library

**Context:** Need to search projects by partial name (FR32)

**Alternatives Considered:**
- Fuse.js: Full fuzzy search with typo tolerance
- Custom subsequence matching: More sophisticated
- Simple includes(): Basic partial matching

**Decision:** Simple `name.toLowerCase().includes(query.toLowerCase())`

**Rationale:**
- PRD specifies 5-10 projects max
- includes() is sufficient for small lists
- Zero dependencies
- Users type partial exact matches anyway

**Consequences:**
- No typo tolerance ("Sequnce" won't match "Sequence")
- Acceptable trade-off for simplicity

---

### ADR-009: AppImage for Linux Distribution

**Decision:** Use AppImage format exclusively for Linux

**Context:** Need Linux distribution with auto-update support (FR46-FR48)

**Alternatives Considered:**
- .deb package: Debian/Ubuntu native but no auto-update
- Both .deb and AppImage: More compatibility but maintenance overhead
- Snap/Flatpak: Sandboxed but more complex

**Decision:** AppImage only

**Rationale:**
- electron-updater supports AppImage auto-update natively
- Single file, no installation (download and run)
- Works on all Linux distributions
- Matches "share with friends" use case (low friction)

**Consequences:**
- No apt/dpkg integration
- Larger file size than .deb
- Acceptable for personal tool distribution

---

### ADR-010: Inline Footer for Project Search UI

**Decision:** Use footer-based inline search instead of modal overlay

**Context:** Need UI for keyboard-driven project search (FR32)

**Alternatives Considered:**
- Modal overlay: Clear focus but breaks terminal aesthetic
- Replace input area: Confusing dual-purpose
- Inline footer: Stays in terminal style

**Decision:** Footer transforms into search input with filtered results

**Rationale:**
- Terminal aesthetic: no modals, no overlays
- Footer already used for contextual UI (confirmations)
- Minimal UI disruption
- Quick dismiss with Escape

**Consequences:**
- Limited vertical space for results
- Need careful keyboard focus management
- Footer has multiple modes (hints, confirm, search)

---

_Generated by BMAD Decision Architecture Workflow v2.0_
_Date: 2025-11-25_
_For: Spardutti_
_Project: spardutti-todo - Minimal Desktop Todo App with Projects_
