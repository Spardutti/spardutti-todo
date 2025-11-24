# spardutti-todo - Epic Breakdown

**Author:** Spardutti
**Date:** 2025-11-21
**Project Level:** Low Complexity
**Target Scale:** Single User Desktop Application

---

## Overview

This document provides the complete epic and story breakdown for spardutti-todo, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This version incorporates all available context: PRD requirements, UX Design interaction patterns, and Architecture technical decisions.

---

## Functional Requirements Inventory

### Task Management
- **FR1:** Users can create a new todo by typing text and pressing Enter
- **FR2:** Users can view a list of all todos (both active and completed)
- **FR3:** Users can mark a todo as complete
- **FR4:** Users can mark a completed todo as incomplete (toggle back to active)
- **FR5:** Users can delete all completed todos with a single action
- **FR6:** Users can see visual distinction between active and completed todos

### Data Persistence
- **FR7:** All todo data is stored locally on the user's Windows PC
- **FR8:** Todo data persists between application sessions (survives app close/reopen)
- **FR9:** Users can access their todos without an internet connection
- **FR10:** The application stores data in a human-readable format (for potential manual editing/backup)

### Keyboard Navigation & Shortcuts
- **FR11:** Users can navigate the todo list using arrow keys
- **FR12:** Users can navigate the todo list using vim-style keys (j/k for up/down)
- **FR13:** Users can toggle todo completion status using keyboard (Space or Enter)
- **FR14:** Users can focus the input field for new todos using keyboard shortcut
- **FR15:** Users can close/minimize the application using keyboard shortcut (Esc or Ctrl+Q)
- **FR16:** Users can delete all completed todos using keyboard shortcut
- **FR17:** Users can view all available keyboard shortcuts (help screen or hints)

### Application Launch & Performance
- **FR18:** The application launches quickly (target: under 2 seconds to usable state)
- **FR19:** The input field has focus immediately on launch (ready to type)
- **FR20:** The application provides immediate visual feedback for all user actions
- **FR21:** The application operates without animations or transition delays

### Auto-Update
- **FR22:** The application checks for software updates automatically
- **FR23:** The application downloads and installs updates without requiring user action
- **FR24:** Users can manually check for updates if auto-update fails
- **FR25:** The application notifies users when updates are available or installed

### User Interface
- **FR26:** The application displays a terminal-style visual interface (monospace font, simple colors)
- **FR27:** The application supports mouse interaction as an optional convenience (all actions keyboard-accessible)
- **FR28:** The application displays completed todos with visual differentiation (strikethrough or color)
- **FR29:** The application provides confirmation prompt before deleting completed todos
- **FR30:** The application window is minimal and distraction-free (no unnecessary UI chrome)

---

## Epic Structure Summary

Based on the functional requirements and natural groupings, I propose **6 epics** that deliver incremental user value:

### Epic 1: Foundation & Project Setup
**Goal:** Establish the development foundation and core application structure
**Value:** Enables all subsequent development work
**Covers:** Infrastructure requirements for all FRs

### Epic 2: Core Task Management
**Goal:** Implement the essential todo CRUD operations
**Value:** Users can create, view, toggle, and bulk-delete todos
**Covers:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 3: Terminal UI & Visual Identity
**Goal:** Implement the Matrix Green terminal aesthetic with dense layout
**Value:** Users get the distinctive, distraction-free interface optimized for speed
**Covers:** FR26, FR28, FR30 (plus UX design specifications)

### Epic 4: Keyboard Navigation System
**Goal:** Implement comprehensive keyboard-first interaction patterns
**Value:** Users can navigate and control the app entirely via keyboard (power user efficiency)
**Covers:** FR11, FR12, FR13, FR14, FR15, FR16, FR17

### Epic 5: Data Persistence (TOON Storage)
**Goal:** Implement reliable local data storage with TOON format
**Value:** Users' todos persist reliably between sessions with human-readable backup
**Covers:** FR7, FR8, FR9, FR10

### Epic 6: Auto-Update System
**Goal:** Implement automatic update checking and installation
**Value:** Users receive software updates seamlessly without manual intervention
**Covers:** FR22, FR23, FR24, FR25

**Rationale for This Structure:**
- Epic 1 is the foundation exception (greenfield project needs project setup)
- Epics 2-6 each deliver distinct, testable user value
- No technical layer breakdown (avoiding "database epic" or "API epic" anti-pattern)
- Logical sequencing: Foundation → Core functionality → Visual polish → Keyboard efficiency → Data reliability → Long-term maintenance
- Performance requirements (FR18-FR21, FR27, FR29) are cross-cutting and will be addressed in acceptance criteria across relevant stories

---

## FR Coverage Map

| Epic | Functional Requirements Covered |
|------|--------------------------------|
| **Epic 1: Foundation** | Infrastructure for all FRs (project init, build system, Electron setup) |
| **Epic 2: Core Task Management** | FR1, FR2, FR3, FR4, FR5, FR6 |
| **Epic 3: Terminal UI** | FR26, FR28, FR30 |
| **Epic 4: Keyboard Navigation** | FR11, FR12, FR13, FR14, FR15, FR16, FR17 |
| **Epic 5: Data Persistence** | FR7, FR8, FR9, FR10 |
| **Epic 6: Auto-Update** | FR22, FR23, FR24, FR25 |
| **Cross-Cutting** | FR18, FR19, FR20, FR21, FR27, FR29 (performance, mouse support, confirmation) |

**Validation:** All 30 functional requirements are covered by epic assignments or cross-cutting concerns.

---

## Epic 1: Foundation & Project Setup

**Goal:** Establish the Electron + Vite + TypeScript development foundation with proper tooling and project structure

**Value:** Enables all subsequent development work with optimized build system, type safety, and rapid iteration capabilities

**Covers:** Infrastructure requirements for all FRs

---

### Story 1.1: Initialize Electron Project with Vite + TypeScript Template

As a developer,
I want to initialize the project using the official Electron Forge Vite + TypeScript template,
So that I have a working foundation with fast build tooling and type safety from day one.

**Acceptance Criteria:**

**Given** I am starting a new project
**When** I execute the project initialization command
**Then** the project structure is created with Electron Forge + Vite + TypeScript configuration

**And** the following are present:
- `package.json` with Electron, Vite, TypeScript, and Electron Forge dependencies
- `tsconfig.json` with strict mode enabled (`noImplicitAny`, `strictNullChecks`)
- `vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`
- `forge.config.ts` for Electron Forge configuration
- `electron/main.ts` (main process entry point)
- `electron/preload.ts` (IPC bridge if needed)
- `src/main.ts` (renderer process entry point)
- `index.html` (app HTML shell)

**And** the development server starts successfully with `npm start`

**And** the application window opens and displays the Vite default content

**Prerequisites:** None (first story)

**Technical Notes:**
- Execute: `npx create-electron-app@latest spardutti-todo --template=vite-typescript`
- Architecture ref: architecture.md section "Project Initialization"
- Node.js 22+ required (for later rollup-plugin-visualizer dependency)
- Verify HMR (Hot Module Replacement) works in dev mode
- Template provides: TypeScript 5.9+, Vite 5+, Electron Forge 7+, ESLint

---

### Story 1.2: Configure Project Structure and Import Aliases

As a developer,
I want a well-organized project structure with TypeScript import aliases,
So that I can navigate the codebase efficiently and maintain consistent import patterns.

**Acceptance Criteria:**

**Given** the base Electron project is initialized
**When** I configure the project structure and TypeScript paths
**Then** the following directory structure exists:

```
spardutti-todo/
├── electron/                   # Main process
│   ├── main.ts
│   ├── preload.ts
│   └── updater.ts (placeholder)
├── src/                        # Renderer process
│   ├── store/
│   ├── keyboard/
│   ├── storage/
│   ├── ui/
│   ├── types/
│   ├── utils/
│   └── main.ts
├── index.html
└── (config files)
```

**And** `tsconfig.json` includes path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@electron/*": ["./electron/*"]
    }
  }
}
```

**And** Vite configs are updated to resolve aliases in development and production

**And** I can import using aliases: `import { TodoStore } from '@/store/TodoStore'`

**Prerequisites:** Story 1.1 (project initialized)

**Technical Notes:**
- Architecture ref: architecture.md section "Project Structure"
- Update `vite.renderer.config.ts` with `resolve.alias` configuration
- Create placeholder directories (empty folders with `.gitkeep` if needed)
- Verify alias resolution works in both dev and build modes
- Follow naming conventions: PascalCase for class files, camelCase for utilities

---

### Story 1.3: Install Core Dependencies and Configure Tooling

As a developer,
I want all required dependencies installed and development tooling configured,
So that I can implement features with the correct libraries and maintain code quality.

**Acceptance Criteria:**

**Given** the project structure is configured
**When** I install the required dependencies and configure tooling
**Then** the following production dependencies are installed:
- `@toon-format/toon` (1.0.0) - TOON data format encoding/decoding
- `electron-updater` (6.7.1) - Auto-update system
- `electron-log` (5.4.1) - File-based logging

**And** the following dev dependencies are installed:
- `vitest` (latest) - Unit testing framework
- `@types/node` (latest) - Node.js type definitions
- `rollup-plugin-visualizer` (6.0.5) - Bundle analysis

**And** `package.json` includes test script: `"test": "vitest"`

**And** `package.json` includes build analysis script: `"build:analyze": "vite build --mode analyze"`

**And** `vitest.config.ts` is created with basic configuration

**And** `npm test` runs successfully (even with zero tests initially)

**And** `npm install` completes without errors or warnings

**Prerequisites:** Story 1.2 (project structure configured)

**Technical Notes:**
- Architecture ref: architecture.md section "Technology Stack Details"
- Install command: `npm install @toon-format/toon electron-updater electron-log rollup-plugin-visualizer --save`
- Install command: `npm install vitest @types/node --save-dev`
- Vitest config should target Node environment for unit tests
- Verify all dependencies resolve correctly (no peer dependency warnings)
- ESLint should be pre-configured from template

---

### Story 1.4: Configure Electron Window and Application Lifecycle

As a developer,
I want the Electron main window configured with proper size, behavior, and lifecycle management,
So that the app launches with the correct appearance and handles close/quit properly.

**Acceptance Criteria:**

**Given** the project dependencies are installed
**When** I configure the Electron main process in `electron/main.ts`
**Then** the application window is created with these specifications:
- Width: 600px (default, user-resizable)
- Height: 400px (default, user-resizable)
- Minimum width: 400px
- Minimum height: 300px
- Background color: `#000000` (black)
- Title: "spardutti-todo"
- Frame: Standard OS window frame
- Resizable: true
- Show: false initially (show after ready-to-show event)

**And** context isolation is enabled (security best practice)

**And** node integration is disabled in renderer (security best practice)

**And** the window shows immediately when ready (no white flash on launch)

**And** the app lifecycle is handled:
- `app.on('ready')` creates the window
- `app.on('window-all-closed')` quits the app on Windows
- `app.on('activate')` recreates window on macOS (though Windows-only target)

**And** startup time is logged with `electron-log`

**And** the development server auto-reloads when main process code changes

**Prerequisites:** Story 1.3 (dependencies installed)

**Technical Notes:**
- Architecture ref: architecture.md section "Deployment Architecture" and "Performance Considerations"
- Use `BrowserWindow` with proper security settings
- Log startup time: `const startTime = Date.now()` → log in 'ready' handler
- Configure `webPreferences`: `contextIsolation: true`, `nodeIntegration: false`, `preload: path.join(__dirname, 'preload.js')`
- Show window only on 'ready-to-show' event to prevent white flash
- Target startup time: <2 seconds (measure and log for optimization tracking)
- Window icon not required for MVP (can add later)

---

## Epic 2: Core Task Management

**Goal:** Implement the essential todo CRUD operations with in-memory state management and basic UI rendering

**Value:** Users can create todos, view their list, toggle completion status, and bulk-delete completed items

**Covers:** FR1 (create), FR2 (view), FR3 (mark complete), FR4 (mark incomplete), FR5 (delete completed), FR6 (visual distinction)

---

### Story 2.1: Define Todo Data Model and TypeScript Interfaces

As a developer,
I want the Todo data model and TypeScript interfaces defined,
So that I have type safety and consistent data structures across the application.

**Acceptance Criteria:**

**Given** the project foundation is established
**When** I create the Todo type definitions
**Then** a `src/types/Todo.ts` file exists with the following interface:

```typescript
interface Todo {
  id: string              // UUID v4
  text: string            // User-entered task description
  completed: boolean      // Completion status
  createdAt: string       // ISO 8601 timestamp
}
```

**And** the file exports the Todo interface

**And** TypeScript compilation succeeds with strict mode

**And** I can import the type: `import type { Todo } from '@/types/Todo'`

**Prerequisites:** Story 1.4 (project foundation complete)

**Technical Notes:**
- Architecture ref: architecture.md section "Data Architecture" → "Data Models"
- Use `interface` (not `type`) for public API consistency
- ISO 8601 format: `2025-11-21T10:00:00Z`
- UUID v4 will be generated using `crypto.randomUUID()` (Node.js built-in)
- No validation logic in type definition (validation happens in TodoStore)
- Keep types simple and focused (KISS principle)

---

### Story 2.2: Implement TodoStore Class for State Management

As a developer,
I want a TodoStore class to manage todo state and operations,
So that I have a single source of truth for all todo data with clear mutation methods.

**Acceptance Criteria:**

**Given** the Todo type is defined
**When** I implement the TodoStore class in `src/store/TodoStore.ts`
**Then** the class has the following structure:

```typescript
class TodoStore {
  private _todos: Todo[]

  constructor()
  add(text: string): Todo
  toggle(id: string): void
  deleteCompleted(): number
  getAll(): Todo[]
  getActive(): Todo[]
  getCompleted(): Todo[]
}
```

**And** the `add()` method:
- Generates UUID v4 for new todo
- Creates ISO 8601 timestamp
- Sets `completed: false`
- Adds todo to internal array
- Returns the created todo

**And** the `toggle()` method:
- Finds todo by ID
- Flips `completed` boolean
- Throws error if ID not found

**And** the `deleteCompleted()` method:
- Removes all todos where `completed: true`
- Returns count of deleted todos

**And** the `getAll()` method returns a shallow copy of todos array (prevent external mutation)

**And** unit tests exist in `src/store/TodoStore.test.ts` covering all methods

**And** all tests pass with `npm test`

**Prerequisites:** Story 2.1 (Todo type defined)

**Technical Notes:**
- Architecture ref: architecture.md section "Data Architecture" → "Data Flow" and ADR-002
- Use vanilla TypeScript class (no state management library)
- Private properties prefixed with `_` (e.g., `_todos`)
- No async operations yet (add in Epic 5 for persistence)
- Generate UUID: `crypto.randomUUID()` (Node.js 14.17+)
- Generate timestamp: `new Date().toISOString()`
- Return shallow copy from getters: `return [...this._todos]`
- Co-locate tests: TodoStore.test.ts in same directory
- Test coverage: add, toggle, delete, edge cases (empty list, invalid ID)

---

### Story 2.3: Implement Basic UI Rendering System

As a developer,
I want a rendering system that displays the input field and todo list in the DOM,
So that users can see the UI and interact with todos.

**Acceptance Criteria:**

**Given** the TodoStore is implemented
**When** I create the rendering utilities in `src/ui/render.ts`
**Then** the following functions exist:

```typescript
function renderApp(store: TodoStore, container: HTMLElement): void
function renderInput(container: HTMLElement): HTMLInputElement
function renderTodoList(todos: Todo[], container: HTMLElement): void
function renderTodoItem(todo: Todo): HTMLLIElement
```

**And** `renderApp()` creates the basic DOM structure:
- Input field at top (with placeholder: "Type todo and press Enter...")
- Todo list container below
- Footer hints at bottom (placeholder for now)

**And** `renderTodoList()` uses DocumentFragment for batched DOM updates (performance)

**And** `renderTodoItem()` creates a list item with:
- Unicode checkbox: `☐` (unchecked) or `☑` (checked)
- Todo text (wraps if long)
- Flex layout (checkbox + text side-by-side)
- Click handler on entire item (toggle functionality)

**And** the main entry point (`src/main.ts`) calls `renderApp()` on DOM ready

**And** the app displays an input field and empty list on launch

**Prerequisites:** Story 2.2 (TodoStore implemented)

**Technical Notes:**
- UX ref: ux-design-specification.md section "Component Library" → Input Field, Todo List, Todo Item
- Direct DOM manipulation (no virtual DOM framework)
- Use `DocumentFragment` for list rendering (single reflow)
- Event delegation for todo item clicks (performance with many todos)
- Input field gets `autofocus` attribute (FR19)
- Unicode checkboxes: U+2610 (☐) and U+2611 (☑)
- List container gets `role="list"`, items get `role="listitem"` (accessibility)
- No styling yet (Epic 3) - focus on structure only
- Unidirectional data flow: Store → render() → DOM

---

### Story 2.4: Implement Todo Creation Flow

As a user,
I want to create a new todo by typing text and pressing Enter,
So that I can quickly capture tasks without breaking my workflow.

**Acceptance Criteria:**

**Given** the app is launched and the input field is focused
**When** I type "Buy groceries" and press Enter
**Then** a new todo appears in the list below with text "Buy groceries"

**And** the input field clears immediately and stays focused

**And** the todo has:
- Empty checkbox (☐)
- Text: "Buy groceries"
- Unique ID (UUID)
- Current timestamp
- `completed: false`

**And** pressing Enter with empty input does nothing (no error shown)

**And** I can immediately type another todo and press Enter to add it

**And** multiple todos appear in the list in creation order (newest at bottom)

**And** the list auto-scrolls to show the newly added todo

**Prerequisites:** Story 2.3 (basic UI rendering implemented)

**Technical Notes:**
- Covers FR1 (create todo) and FR19 (input focused on launch)
- UX ref: ux-design-specification.md section "User Journey Flows" → Journey 1 (Task Capture)
- Add keydown event listener to input field for Enter key
- Prevent default Enter behavior (no form submission)
- Call `store.add(text)` then `renderTodoList()` for immediate feedback
- Clear input: `inputElement.value = ''`
- Keep focus: `inputElement.focus()` (should stay focused naturally)
- Auto-scroll: `todoListContainer.scrollTop = todoListContainer.scrollHeight`
- Empty input check: `if (!text.trim()) return`
- Target: Under 2 seconds for full flow (alt-tab → type → Enter → alt-tab)
- No save to storage yet (Epic 5)

---

### Story 2.5: Implement Todo Toggle (Complete/Incomplete)

As a user,
I want to toggle a todo between complete and incomplete by clicking it,
So that I can mark tasks as done or undo completion if needed.

**Acceptance Criteria:**

**Given** I have todos in the list (both active and completed)
**When** I click on an active todo
**Then** the todo is marked as complete:
- Checkbox changes from ☐ to ☑
- Text style changes (will be styled in Epic 3, structure only for now)
- The `completed` property is set to `true`

**And** when I click on a completed todo
**Then** the todo is marked as incomplete:
- Checkbox changes from ☑ to ☐
- Text style reverts to normal
- The `completed` property is set to `false`

**And** I can toggle the same todo multiple times (reversible action)

**And** clicking different todos toggles each independently

**And** the change happens instantly (no animation or delay)

**Prerequisites:** Story 2.4 (todo creation implemented)

**Technical Notes:**
- Covers FR3 (mark complete), FR4 (mark incomplete), FR6 (visual distinction - partial)
- UX ref: ux-design-specification.md section "User Journey Flows" → Journey 2 (Toggle Complete/Incomplete)
- Add click event listener to todo item (use event delegation on list for performance)
- Call `store.toggle(id)` then re-render affected item
- Visual update: Change checkbox unicode and add data attribute for styling hook
- No full list re-render needed (optimize by updating single item)
- State change is synchronous (no loading state)
- FR6 visual distinction will be fully implemented in Epic 3 (strikethrough, color)
- No save to storage yet (Epic 5)

---

### Story 2.6: Implement Bulk Delete Completed Todos with Confirmation

As a user,
I want to delete all completed todos with a single action,
So that I can quickly clear my list of finished tasks.

**Acceptance Criteria:**

**Given** I have multiple completed todos in the list
**When** I trigger the bulk delete action (temporary button for now, keyboard shortcut in Epic 4)
**Then** a confirmation prompt appears: "Delete X completed todos? [Y/n]"

**And** when I confirm (click Yes or press Y/Enter):
- All completed todos are removed from the list
- Active todos remain unchanged
- The list re-renders to show only active todos
- A brief message appears: "X todos deleted" (2 seconds)

**And** when I cancel (click No or press N/Esc):
- No todos are deleted
- The confirmation closes
- The list remains unchanged

**And** when no completed todos exist:
- The action shows a message: "No completed todos"
- No confirmation prompt appears

**And** the deletion happens instantly (no animation)

**Prerequisites:** Story 2.5 (todo toggle implemented)

**Technical Notes:**
- Covers FR5 (delete all completed) and FR29 (confirmation prompt)
- UX ref: ux-design-specification.md section "User Journey Flows" → Journey 3 (Bulk Delete) and section "UX Pattern Decisions" → Confirmation Patterns
- Add temporary button in UI: "Delete Completed" (will be replaced by Ctrl+D in Epic 4)
- Confirmation is inline (footer area), not a modal dialog
- Use `store.deleteCompleted()` which returns count
- Store count to show in feedback message
- Re-render entire list after deletion (simpler for now, optimize later if needed)
- Feedback message: Add to footer area, auto-hide after 2 seconds using setTimeout
- Confirmation keyboard support: Y/Enter confirms, N/Esc cancels
- Only destructive bulk action requires confirmation (per UX pattern decision)

---

## Epic 3: Terminal UI & Visual Identity

**Goal:** Implement the Matrix Green terminal aesthetic with dense layout, proper typography, and complete visual styling

**Value:** Users get the distinctive, distraction-free interface optimized for speed and professional terminal look

**Covers:** FR26 (terminal-style interface), FR28 (visual differentiation), FR30 (minimal UI)

---

### Story 3.1: Implement Matrix Green Color System and CSS Variables

As a developer,
I want the Matrix Green color palette defined as CSS custom properties,
So that I have consistent colors throughout the application.

**Acceptance Criteria:**

**Given** the basic UI structure is rendered
**When** I create `src/ui/styles.css` with CSS variables
**Then** the following color variables are defined:

```css
:root {
  --color-bg-primary: #000000;      /* Pure black background */
  --color-text-primary: #00FF00;    /* Bright terminal green */
  --color-text-secondary: #008800;  /* Dimmed green */
  --color-text-completed: #004400;  /* Dark green completed */
  --color-border-default: #00FF00;  /* Green borders */
  --color-error: #FF0000;           /* Red errors */
}
```

**And** global styles are applied:
- Body background: `var(--color-bg-primary)`
- Body color: `var(--color-text-primary)`
- Font family: `'Consolas', 'Courier New', monospace`
- Font size: `14px`
- Margin/padding reset for body

**And** the CSS file is imported in `index.html`

**And** the app displays with black background and green text

**Prerequisites:** Story 2.6 (core functionality complete)

**Technical Notes:**
- UX ref: ux-design-specification.md section "Visual Foundation" → "Color System"
- Architecture ref: architecture.md section "Implementation Patterns" → "Terminal Aesthetic Enforcement"
- Use CSS custom properties for easy theming (future-proofing)
- Pure CSS, no preprocessor (SASS/LESS)
- Global reset: `* { box-sizing: border-box; }`
- No CSS-in-JS (keep styles separate)

---

### Story 3.2: Style Input Field with Terminal Aesthetic

As a user,
I want the input field to have terminal styling with green glow on focus,
So that it feels like a professional command-line tool.

**Acceptance Criteria:**

**Given** the CSS variables are defined
**When** I add input field styles to `styles.css`
**Then** the input field has:
- Background: `#000000` (black)
- Color: `#00FF00` (bright green)
- Font: Consolas 14px monospace
- Border: `1px solid #00FF00`
- Padding: `0.35rem` (dense layout)
- Width: 100% (full-width)
- Border-radius: `0` (sharp corners, terminal style)

**And** on focus, the input has:
- Box-shadow: `0 0 8px #00FF00` (green glow)
- Outline: `none` (remove default browser outline)

**And** placeholder text is:
- Color: `#00FF00` with 50% opacity
- Text: "Type todo and press Enter..."

**And** the cursor blinks in bright green

**And** there are no animations or transitions

**Prerequisites:** Story 3.1 (color system defined)

**Technical Notes:**
- UX ref: ux-design-specification.md section "Component Library" → "Input Field (Terminal Text Input)"
- No border-radius (terminal constraint)
- No box-shadow except focus glow
- Autofocus should work immediately on launch (HTML attribute)
- Dense padding per UX design direction (0.35rem, not standard 0.5rem)

---

### Story 3.3: Style Todo List and Items with Dense Layout

As a user,
I want todos displayed in a compact, scannable list with clear visual hierarchy,
So that I can see many todos without scrolling and quickly identify what needs attention.

**Acceptance Criteria:**

**Given** the input field is styled
**When** I add todo list styles to `styles.css`
**Then** the todo list container has:
- Background: transparent (inherit black)
- Overflow-y: auto (scrollable if needed)
- Flex-grow: 1 (fills available space)
- Margin-top: `0.75rem` (spacing from input)
- No border or visual container

**And** each todo item (`<li>`) has:
- Display: flex
- Align-items: flex-start (top-align checkbox)
- Gap: `0.5rem` (space between checkbox and text)
- Padding: `0.35rem 0` (vertical spacing, dense)
- Color: `#00FF00` (active todos)
- Font: Consolas 14px monospace
- Cursor: pointer
- List-style: none (no bullets)

**And** on hover, todo items have:
- Background: `#001100` (subtle dark green tint)
- No transition (instant change)

**And** completed todos have:
- Color: `#004400` (dark green)
- Text-decoration: line-through (strikethrough)
- Checkbox: ☑ (checked symbol)

**And** active todos have:
- Color: `#00FF00` (bright green)
- Text-decoration: none
- Checkbox: ☐ (empty symbol)

**And** todo text wraps if long (no truncation, full text visible)

**Prerequisites:** Story 3.2 (input styled)

**Technical Notes:**
- UX ref: ux-design-specification.md section "Component Library" → "Todo Item" and section "Design Direction" → "Dense Information Layout"
- Covers FR28 (visual differentiation of completed todos)
- Dense padding: 0.35rem (not standard 0.5rem)
- Checkbox unicode: Use `<span>` with ☐ or ☑
- Flex-start alignment ensures checkbox stays at top for multi-line todos
- Gap: 0.5rem (about 8px) between checkbox and text
- No animations or transitions (terminal constraint)
- Line-through for completed todos (CSS: `text-decoration: line-through`)

---

### Story 3.4: Style Footer Hints with Keyboard Shortcut Display

As a user,
I want to see keyboard shortcuts displayed in the footer,
So that I can discover available actions without memorization.

**Acceptance Criteria:**

**Given** the todo list is styled
**When** I add footer styles to `styles.css`
**Then** the footer has:
- Position: Fixed at bottom or margin-top auto
- Border-top: `1px solid #004400` (dark green separator)
- Padding-top: `0.5rem`
- Margin-top: `0.75rem`
- Font-size: `12px` (smaller than body)
- Color: `#008800` (dimmed green)
- Font: Consolas monospace

**And** the footer displays placeholder text:
- "Enter: Save | Space: Toggle | Esc: Close"
- (Full shortcuts will be implemented in Epic 4)

**And** the footer is always visible (not hidden)

**And** the footer text is readable but de-emphasized compared to main content

**Prerequisites:** Story 3.3 (todo list styled)

**Technical Notes:**
- UX ref: ux-design-specification.md section "Component Library" → "Footer Hints"
- Covers FR17 (partial - view shortcuts, full implementation in Epic 4)
- Use dimmed green (#008800) to de-emphasize hints
- Smaller font (12px vs 14px) for less prominence
- Border-top provides visual separation from main content
- Footer content will be dynamic in Epic 4 (confirmation prompts, etc.)
- Keyboard: `|` character used as separator between shortcuts

---

### Story 3.5: Implement Window Chrome and Final Polish

As a user,
I want the application window to have minimal chrome with proper spacing,
So that the interface is distraction-free and professional.

**Acceptance Criteria:**

**Given** all components are styled
**When** I finalize the layout and spacing
**Then** the main app container has:
- Padding: `16px` (breathing room from edges)
- Display: flex
- Flex-direction: column
- Height: 100vh (full viewport height)
- Background: `#000000` (black)

**And** vertical spacing creates clear hierarchy:
- Input at top (full-width)
- Small gap (0.75rem)
- Todo list (flex-grow fills space, scrollable)
- Small gap (0.75rem)
- Footer at bottom (fixed position)

**And** the window has no unnecessary UI chrome:
- No decorative borders (only functional borders on input)
- No shadows (except input focus glow)
- No gradients or textures
- No colored backgrounds (pure black only)

**And** scrollbar styling uses OS defaults (no custom styling)

**And** the entire UI follows the terminal constraint:
- Monospace font throughout
- Green-on-black color scheme only
- No animations or transitions
- Sharp corners (no border-radius)
- Minimal padding and spacing (dense layout)

**And** the app looks professional and focused

**Prerequisites:** Story 3.4 (footer styled)

**Technical Notes:**
- UX ref: ux-design-specification.md section "Design Direction" → "Dense Information Layout" and "Visual Style Decisions"
- Covers FR30 (minimal, distraction-free UI)
- Use flexbox for vertical layout (input, flex-grow list, footer)
- 16px window padding per UX spec
- No custom scrollbar (use OS default for consistency)
- Remove any remaining default browser styles (focus outlines except input, margins, etc.)
- Test with many todos to verify scrolling works correctly
- Verify responsive behavior when window resized

---

## Epic 4: Keyboard Navigation System

**Goal:** Implement comprehensive keyboard-first interaction patterns with vim-style navigation and shortcut management

**Value:** Users can navigate and control the app entirely via keyboard (power user efficiency)

**Covers:** FR11 (arrow keys), FR12 (vim j/k), FR13 (Space/Enter toggle), FR14 (focus input), FR15 (close app), FR16 (delete shortcut), FR17 (view shortcuts)

---

### Story 4.1: Implement KeyboardManager Class

As a developer,
I want a centralized KeyboardManager class to register and handle keyboard shortcuts,
So that I have conflict detection, consistent key handling, and automatic help generation.

**Acceptance Criteria:**

**Given** the UI is fully styled
**When** I create `src/keyboard/KeyboardManager.ts`
**Then** the class has the following structure:

```typescript
class KeyboardManager {
  private _shortcuts: Map<string, ShortcutHandler>

  register(key: string, handler: () => void, description: string): void
  unregister(key: string): void
  handle(event: KeyboardEvent): boolean
  getHints(): string
}
```

**And** the `register()` method:
- Normalizes keys to lowercase (e.g., "Enter", "ctrl+d", "j")
- Throws error if key already registered (conflict detection)
- Stores handler with description for help generation

**And** the `handle()` method:
- Receives KeyboardEvent
- Normalizes event to key string
- Calls registered handler if match found
- Returns true if handled, false if not
- Prevents default and stops propagation for handled keys

**And** the `getHints()` method:
- Returns formatted string: "Enter: Save | Space: Toggle | ..."
- Uses descriptions from registered shortcuts

**And** unit tests exist in `src/keyboard/KeyboardManager.test.ts`

**And** all tests pass

**Prerequisites:** Story 3.5 (UI complete)

**Technical Notes:**
- Architecture ref: architecture.md section "Technology Stack Details" and ADR-003
- Custom implementation (no Mousetrap library)
- Key normalization: lowercase, handle modifiers (ctrl+, shift+, alt+)
- ShortcutHandler type: `{ key: string; handler: () => void; description: string }`
- Conflict detection prevents accidental duplicate bindings
- Help generation enables dynamic footer updates

---

### Story 4.2: Implement Arrow Key and Vim-Style Navigation

As a user,
I want to navigate todos using arrow keys or vim-style j/k keys,
So that I can efficiently move through my list without a mouse.

**Acceptance Criteria:**

**Given** the KeyboardManager is implemented and I have multiple todos in the list
**When** I press the Down arrow or "j" key
**Then** the next todo in the list is selected (highlighted)

**And** when I press the Up arrow or "k" key
**Then** the previous todo in the list is selected

**And** the selected todo has a visual indicator:
- Background: `#001100` (subtle dark green tint)
- Or border/outline to show selection

**And** pressing Down/j at the last todo does nothing (no wrap)

**And** pressing Up/k at the first todo does nothing (no wrap)

**And** the selected todo scrolls into view automatically if offscreen

**And** navigation state persists (selection remembered until changed)

**Prerequisites:** Story 4.1 (KeyboardManager implemented)

**Technical Notes:**
- Covers FR11 (arrow keys) and FR12 (vim j/k navigation)
- UX ref: ux-design-specification.md section "UX Pattern Decisions" → "Keyboard Patterns" → "Navigation Keys"
- Track selected index in application state
- Register shortcuts: "ArrowDown", "j", "ArrowUp", "k"
- Update selected index on navigation
- Add CSS class or data attribute to selected todo for styling
- Use `scrollIntoView({ behavior: 'instant', block: 'nearest' })` for auto-scroll
- Selection visual: reuse hover state style (#001100 background)

---

### Story 4.3: Implement Space and Enter for Todo Toggle

As a user,
I want to press Space or Enter on a selected todo to toggle its completion,
So that I can mark todos complete without using the mouse.

**Acceptance Criteria:**

**Given** I have navigated to a todo using arrow keys/j/k
**When** I press Space or Enter
**Then** the selected todo toggles between complete and incomplete

**And** the checkbox updates (☐ ↔ ☑)

**And** the todo style updates (green ↔ dark green strikethrough)

**And** I can press Space repeatedly to toggle multiple times

**And** the selection stays on the same todo after toggling

**And** when no todo is selected, Space in the input field types a space character (normal behavior)

**And** when no todo is selected, pressing Space or Enter does nothing to the list

**Prerequisites:** Story 4.2 (navigation implemented)

**Technical Notes:**
- Covers FR13 (keyboard toggle)
- UX ref: ux-design-specification.md section "UX Pattern Decisions" → "Keyboard Patterns" → "Action Keys"
- Register shortcuts: "Space" (context-aware), "Enter" (context-aware)
- Context detection: Only trigger toggle if todo is selected (not input focused)
- Bulk toggling workflow: j, Space, j, Space, j, Space (efficient for multiple todos)
- Reuse existing toggle logic from click handler (Story 2.5)
- No animation on toggle (instant state change)

---

### Story 4.4: Implement Keyboard Shortcuts for App Control

As a user,
I want keyboard shortcuts to focus the input, close the app, and trigger bulk delete,
So that I can control the application entirely from the keyboard.

**Acceptance Criteria:**

**Given** the KeyboardManager is configured
**When** I press **Ctrl+N** or **Home**
**Then** the input field receives focus (ready to type new todo)

**And** when I press **Esc**
**Then** the application closes/minimizes (Electron window closes)

**And** when I press **Ctrl+Q**
**Then** the application quits completely

**And** when I press **Ctrl+D**
**Then** the bulk delete confirmation prompt appears (if completed todos exist)

**And** pressing Ctrl+D with no completed todos shows: "No completed todos"

**And** all shortcuts work regardless of current focus (global within app)

**Prerequisites:** Story 4.3 (Space/Enter toggle implemented)

**Technical Notes:**
- Covers FR14 (focus input), FR15 (close app), FR16 (delete shortcut)
- UX ref: ux-design-specification.md section "UX Pattern Decisions" → "Keyboard Patterns" → "Command Keys"
- Register shortcuts: "ctrl+n", "Home", "Escape", "ctrl+q", "ctrl+d"
- Focus input: `inputElement.focus()`
- Close window: Use Electron IPC or window.close() if accessible from renderer
- Quit app: Use Electron IPC to call `app.quit()` in main process
- Ctrl+D triggers existing bulk delete flow from Story 2.6
- Handle Escape contextually: Close confirmation if open, otherwise close app
- Tab and Shift+Tab for standard focus navigation (browser default, no custom handling needed)

---

### Story 4.5: Update Footer with Dynamic Keyboard Hints

As a user,
I want the footer to display current keyboard shortcuts dynamically,
So that I always see relevant actions for my current context.

**Acceptance Criteria:**

**Given** the KeyboardManager can generate hints
**When** the app is in normal mode (no confirmation)
**Then** the footer displays: "Enter: Save | Space: Toggle | Ctrl+D: Delete All | Esc: Close"

**And** when the bulk delete confirmation is showing
**Then** the footer displays: "Delete X completed todos? [Y/n]"

**And** the footer updates immediately when context changes (no delay)

**And** keyboard hints use the pipe character "|" as separator

**And** hints are concise (action verb + key, e.g., "Save" not "Save todo")

**And** the footer text color remains dimmed green (#008800)

**Prerequisites:** Story 4.4 (app control shortcuts implemented)

**Technical Notes:**
- Covers FR17 (view shortcuts - complete)
- UX ref: ux-design-specification.md section "Component Library" → "Footer Hints" and "UX Pattern Decisions" → "Feedback Patterns"
- Use `keyboardManager.getHints()` to generate default hints
- Replace footer content during confirmation prompts
- Restore default hints after confirmation closes
- Format: `${description}: ${key}` with " | " separator
- Keep hints minimal (show most common actions only, not every shortcut)
- Future enhancement: Context-aware hints (different hints when todo selected vs input focused)

---

## Epic 5: Data Persistence (TOON Storage)

**Goal:** Implement reliable local data storage using TOON format with automatic save on every change

**Value:** Users' todos persist reliably between sessions with human-readable backup capability

**Covers:** FR7 (local storage), FR8 (persist between sessions), FR9 (offline access), FR10 (human-readable format)

---

### Story 5.1: Implement ToonStorage Class for File I/O

As a developer,
I want a ToonStorage class to encode/decode todos to TOON format and handle file I/O,
So that I can persist todos to disk in a human-readable format.

**Acceptance Criteria:**

**Given** the @toon-format/toon library is installed
**When** I create `src/storage/ToonStorage.ts`
**Then** the class has the following static methods:

```typescript
class ToonStorage {
  static async load(filePath: string): Promise<Todo[]>
  static async save(filePath: string, todos: Todo[]): Promise<void>
  static encode(todos: Todo[]): string
  static decode(toonString: string): Todo[]
}
```

**And** the `encode()` method:
- Converts Todo[] to TOON format string
- Structure: `todos[N]{id,text,completed,createdAt}: ...`
- Includes version metadata: `version: 1.0`

**And** the `decode()` method:
- Parses TOON string to Todo[]
- Validates structure
- Throws error on malformed data

**And** the `save()` method:
- Writes TOON string to file path asynchronously
- Creates directory if doesn't exist
- Uses Node.js fs module (via Electron)

**And** the `load()` method:
- Reads file from path
- Returns empty array if file doesn't exist
- Decodes TOON to Todo[]
- Throws error on corrupt file

**And** unit tests exist in `src/storage/ToonStorage.test.ts`

**And** all tests pass

**Prerequisites:** Story 4.5 (keyboard system complete)

**Technical Notes:**
- Architecture ref: architecture.md section "Data Architecture" → "File Format (TOON)" and "API Contracts" → ToonStorage
- Use @toon-format/toon library for encode/decode
- File path: `app.getPath('userData')/todos.toon` (Electron API)
- Location: `%APPDATA%/spardutti-todo/todos.toon` on Windows
- Create directory with `fs.mkdir(path, { recursive: true })`
- Handle file not found gracefully (return empty array)
- Async file operations (non-blocking)
- TOON format example in architecture.md section "Data Architecture"

---

### Story 5.2: Integrate ToonStorage with TodoStore for Auto-Save

As a developer,
I want TodoStore to automatically save todos to disk after every change,
So that data persists without requiring explicit user action.

**Acceptance Criteria:**

**Given** ToonStorage is implemented
**When** I update TodoStore to integrate persistence
**Then** TodoStore has these new/modified methods:

```typescript
class TodoStore {
  private _filePath: string

  constructor(filePath: string)
  async load(): Promise<void>
  async save(): Promise<void>
  // ... existing methods
}
```

**And** the constructor accepts filePath parameter

**And** the `load()` method:
- Calls `ToonStorage.load(filePath)`
- Populates internal `_todos` array
- Logs success/failure with electron-log

**And** the `save()` method:
- Calls `ToonStorage.save(filePath, todos)`
- Logs success/failure with electron-log
- Does not throw on error (logs only, no UI disruption)

**And** `add()`, `toggle()`, and `deleteCompleted()` methods:
- Call `this.save()` after mutation (auto-save)
- Use fire-and-forget pattern (don't await save)
- UI updates immediately (don't block on I/O)

**And** the main entry point loads todos on app start:
- `await todoStore.load()` before rendering
- Show error message if load fails (inline red text)

**And** todos persist between app restarts

**Prerequisites:** Story 5.1 (ToonStorage implemented)

**Technical Notes:**
- Architecture ref: architecture.md section "Data Architecture" → "Data Flow" and "UX Pattern Decisions" → "Persistence Patterns"
- Covers FR7 (local storage), FR8 (persist between sessions), FR9 (offline)
- Auto-save on every change (no "Save" button)
- Fire-and-forget save: Call save() but don't await (UI stays responsive)
- Load is awaited on startup (acceptable one-time cost)
- Error handling: Log errors, show inline message if critical (file system issues rare)
- File path from Electron: `app.getPath('userData')`
- Test with manual file corruption to verify error handling

---

### Story 5.3: Implement Error Handling and Recovery

As a user,
I want graceful error handling if file operations fail,
So that I don't lose my current session data and understand what went wrong.

**Acceptance Criteria:**

**Given** the app is running with auto-save enabled
**When** a save operation fails (e.g., disk full, permissions issue)
**Then** an inline error message appears below the input:
- Text: "Failed to save. Try again." (red color #FF0000)
- Auto-hides after 5 seconds

**And** the todos remain in memory (no data loss in current session)

**And** the error is logged to electron-log for debugging

**And** the user can continue working (app doesn't freeze or crash)

**And** when the app fails to load todos on startup due to corrupt file
**Then** an error message appears:
- Text: "Data file corrupted. Starting fresh." (red color)
- The app starts with an empty todo list
- The corrupt file is backed up: `todos.toon.corrupt.TIMESTAMP`

**And** when the app fails to load due to missing file
**Then** no error is shown (this is normal first launch)

**And** the app starts with an empty list

**Prerequisites:** Story 5.2 (auto-save integrated)

**Technical Notes:**
- Covers FR8 (data persists) with error recovery
- UX ref: ux-design-specification.md section "UX Pattern Decisions" → "Feedback Patterns" → "Error Feedback"
- Error display: Inline below input, red text, auto-hide
- Error component in `src/ui/components.ts` or `render.ts`
- Backup corrupt files: `fs.rename(original, original + '.corrupt.' + Date.now())`
- Log all errors with context: `log.error('Save failed', { error: e.message, todoCount })`
- Data stays in memory even if save fails (retry on next mutation)
- Show "Start fresh" option if repeated save failures (future enhancement)

---

### Story 5.4: Verify Data Persistence and Performance

As a developer,
I want to verify that data persists correctly and performance meets requirements,
So that users have a reliable and fast experience.

**Acceptance Criteria:**

**Given** the persistence system is fully integrated
**When** I test the application
**Then** the following scenarios work correctly:

**Scenario 1: Basic Persistence**
- Create 3 todos
- Close app
- Reopen app
- All 3 todos are present with correct text and status

**Scenario 2: Toggle Persistence**
- Create 2 todos
- Toggle first todo to complete
- Close app
- Reopen app
- First todo is still completed, second is active

**Scenario 3: Delete Persistence**
- Create 5 todos
- Complete 3 todos
- Bulk delete completed
- Close app
- Reopen app
- Only 2 active todos remain

**Scenario 4: Large List Performance**
- Create 1000 todos (via script or rapid entry)
- App launches in under 2 seconds
- All operations remain instant (<16ms perceived)
- File save completes without blocking UI

**And** the TOON file is human-readable when opened in text editor

**And** manual edits to TOON file load correctly (if valid format)

**Prerequisites:** Story 5.3 (error handling implemented)

**Technical Notes:**
- Covers FR10 (human-readable format)
- Architecture ref: architecture.md section "Performance Considerations"
- Test with realistic data sizes (10, 100, 1000 todos)
- Verify file location: `%APPDATA%/spardutti-todo/todos.toon`
- Check TOON format matches specification in architecture.md
- Performance target: 1000 todos renders in <100ms, saves in <50ms (async)
- Manual TOON edit test: Add todo directly in file, verify it loads
- Use electron-log to track save timing (measure actual performance)

---

## Epic 6: Auto-Update System

**Goal:** Implement automatic update checking and installation using electron-updater with GitHub Releases

**Value:** Users receive software updates seamlessly without manual intervention

**Covers:** FR22 (check updates), FR23 (auto-install), FR24 (manual check), FR25 (update notifications)

---

### Story 6.1: Configure electron-updater and GitHub Releases

As a developer,
I want electron-updater configured to check GitHub Releases for updates,
So that the update system has the infrastructure to distribute new versions.

**Acceptance Criteria:**

**Given** electron-updater is installed
**When** I create `electron/updater.ts`
**Then** the file configures electron-updater:

```typescript
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

export function initUpdater() {
  autoUpdater.logger = log
  autoUpdater.checkForUpdatesAndNotify()
}
```

**And** the main process calls `initUpdater()` after app ready

**And** `forge.config.ts` is configured for NSIS installer (Windows)

**And** `package.json` includes:
- `repository` field with GitHub repo URL
- `version` field (e.g., "0.1.0")

**And** update check logs appear in electron-log

**And** the app doesn't crash if update check fails (offline mode works)

**Prerequisites:** Story 5.4 (persistence verified)

**Technical Notes:**
- Architecture ref: architecture.md section "Deployment Architecture" → "Update Mechanism" and "Technology Stack Details"
- Covers FR22 (check updates automatically)
- electron-updater checks for updates on launch
- Update source: GitHub Releases (free hosting)
- NSIS installer generates `latest.yml` metadata file
- Update check happens in background (non-blocking)
- Offline-first: Update check fails gracefully if no internet
- Logging: `autoUpdater.logger = log` enables debug tracking

---

### Story 6.2: Implement Automatic Update Download and Notification

As a user,
I want to be notified when an update is available and have it download automatically,
So that I can stay up-to-date without manual effort.

**Acceptance Criteria:**

**Given** electron-updater is configured
**When** a new version is available on GitHub Releases
**Then** the update downloads automatically in the background

**And** a notification appears in the app:
- Location: Footer area (replaces hints temporarily)
- Text: "Update available. Restart to install."
- Color: Bright green (#00FF00)
- Duration: Persistent until app restart

**And** the notification does not block app usage

**And** clicking the notification (future enhancement) or closing the app triggers installation

**And** when no update is available, no notification appears

**And** update checks happen on app launch only (not periodic during session)

**Prerequisites:** Story 6.1 (updater configured)

**Technical Notes:**
- Covers FR23 (auto-download), FR25 (notifications)
- UX ref: ux-design-specification.md section "UX Pattern Decisions" → "Feedback Patterns"
- Listen to events: `autoUpdater.on('update-available')`, `autoUpdater.on('update-downloaded')`
- Update notification: Send IPC message to renderer, update footer
- Non-blocking download (background, no progress bar needed for MVP)
- Install on quit: `autoUpdater.quitAndInstall()` called when app closes
- Test with beta releases on GitHub to verify update flow

---

### Story 6.3: Implement Manual Update Check (Fallback)

As a user,
I want a way to manually check for updates if auto-update fails,
So that I can still get new versions if the automatic system has issues.

**Acceptance Criteria:**

**Given** the app is running
**When** I press **Ctrl+U** (update shortcut)
**Then** a manual update check is triggered

**And** the footer shows: "Checking for updates..."

**And** after check completes:
- If update available: "Update available. Restart to install."
- If no update: "You're on the latest version." (auto-hide after 3 seconds)
- If check fails: "Update check failed. Try again later." (auto-hide after 3 seconds)

**And** the manual check does not interfere with automatic checks

**And** multiple manual checks can be triggered (debounced to prevent spam)

**Prerequisites:** Story 6.2 (automatic updates working)

**Technical Notes:**
- Covers FR24 (manual update check)
- Register keyboard shortcut: "ctrl+u"
- Call `autoUpdater.checkForUpdates()` manually
- Listen to same events as automatic check
- Debounce: Prevent repeated checks within 10 seconds
- Feedback messages in footer (temporary, auto-hide)
- Manual check useful for debugging and user confidence

---

### Story 6.4: Test and Verify Auto-Update Flow

As a developer,
I want to verify the complete auto-update flow works end-to-end,
So that users can reliably receive updates.

**Acceptance Criteria:**

**Given** the auto-update system is fully implemented
**When** I test the update flow
**Then** the following scenarios work:

**Scenario 1: Successful Update**
- Publish new version (e.g., v0.2.0) to GitHub Releases with .exe and latest.yml
- Launch app on v0.1.0
- Update check runs automatically
- Update downloads in background
- Notification appears: "Update available. Restart to install."
- Close app
- App updates to v0.2.0 on next launch

**Scenario 2: No Update Available**
- Launch app with latest version
- Update check runs
- No notification appears
- App continues normally

**Scenario 3: Offline Mode**
- Disable internet connection
- Launch app
- Update check fails silently
- App continues normally (offline-first design)

**Scenario 4: Manual Update Check**
- Press Ctrl+U
- Footer shows "Checking for updates..."
- Result message appears based on availability

**And** the update process is logged in electron-log for debugging

**And** updates are verified (code signed in production - future)

**Prerequisites:** Story 6.3 (manual check implemented)

**Technical Notes:**
- Covers FR23, FR24, FR25 (complete auto-update system)
- Test with actual GitHub Releases (use pre-release/beta tags for testing)
- NSIS installer: Generated by `npm run make`, includes latest.yml
- Upload to GitHub: `.exe` file and `latest.yml` to same release
- Version bumping: `npm version patch/minor/major` updates package.json
- Code signing: Recommended for production (prevents Windows SmartScreen warnings)
- Test in VM or separate machine for clean update testing
- Verify logs show update check, download progress, installation trigger

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| **FR1** | Create todo by typing and pressing Enter | Epic 2 | Story 2.4 |
| **FR2** | View list of all todos | Epic 2 | Story 2.3, 2.4 |
| **FR3** | Mark todo as complete | Epic 2 | Story 2.5 |
| **FR4** | Mark completed todo as incomplete (toggle) | Epic 2 | Story 2.5 |
| **FR5** | Delete all completed todos | Epic 2 | Story 2.6 |
| **FR6** | Visual distinction between active and completed | Epic 2, Epic 3 | Story 2.5, 3.3 |
| **FR7** | Local storage on Windows PC | Epic 5 | Story 5.1, 5.2 |
| **FR8** | Persist between sessions | Epic 5 | Story 5.2, 5.4 |
| **FR9** | Offline access | Epic 5 | Story 5.2 |
| **FR10** | Human-readable format | Epic 5 | Story 5.1, 5.4 |
| **FR11** | Navigate with arrow keys | Epic 4 | Story 4.2 |
| **FR12** | Navigate with vim-style j/k | Epic 4 | Story 4.2 |
| **FR13** | Toggle with Space/Enter | Epic 4 | Story 4.3 |
| **FR14** | Focus input with shortcut | Epic 4 | Story 4.4 |
| **FR15** | Close app with shortcut | Epic 4 | Story 4.4 |
| **FR16** | Delete completed shortcut | Epic 4 | Story 4.4 |
| **FR17** | View keyboard shortcuts | Epic 3, Epic 4 | Story 3.4, 4.5 |
| **FR18** | Fast launch (<2s) | Epic 1 | Story 1.4 (cross-cutting) |
| **FR19** | Input focused on launch | Epic 2 | Story 2.4 |
| **FR20** | Immediate visual feedback | Epic 2, Epic 3 | Cross-cutting all stories |
| **FR21** | No animations/delays | Epic 3 | Story 3.2, 3.3, 3.5 |
| **FR22** | Check for updates automatically | Epic 6 | Story 6.1 |
| **FR23** | Auto-download and install updates | Epic 6 | Story 6.2, 6.4 |
| **FR24** | Manual update check | Epic 6 | Story 6.3 |
| **FR25** | Update notifications | Epic 6 | Story 6.2 |
| **FR26** | Terminal-style interface | Epic 3 | Story 3.1, 3.2, 3.3, 3.5 |
| **FR27** | Mouse interaction (optional) | Epic 2, Epic 4 | Cross-cutting (mouse + keyboard both work) |
| **FR28** | Visual differentiation of completed | Epic 3 | Story 3.3 |
| **FR29** | Confirmation before delete | Epic 2 | Story 2.6 |
| **FR30** | Minimal, distraction-free UI | Epic 3 | Story 3.5 |

**Validation:** All 30 functional requirements are covered by specific stories.

---

## Summary

**✅ Epic Breakdown Complete**

**Created:** epics.md with complete epic and story breakdown

**FR Coverage:** All 30 functional requirements from PRD mapped to stories

**Context Incorporated:**
- ✅ PRD requirements (all FRs and NFRs)
- ✅ UX interaction patterns (Matrix Green theme, dense layout, keyboard-first)
- ✅ Architecture technical decisions (Electron + Vite + TypeScript, TOON storage, custom components)

**Status:** COMPLETE - Ready for Phase 4 Implementation!

**Total Structure:**
- 6 Epics
- 25 Stories total
- All stories have:
  - User story statement (As a... I want... So that...)
  - Detailed BDD acceptance criteria (Given/When/Then/And)
  - Prerequisites (backward dependencies only)
  - Technical notes with architecture/UX references

**Epic Breakdown:**
1. **Epic 1: Foundation & Project Setup** (4 stories)
   - Project initialization, structure, dependencies, window config
2. **Epic 2: Core Task Management** (6 stories)
   - Data model, TodoStore, UI rendering, CRUD operations
3. **Epic 3: Terminal UI & Visual Identity** (5 stories)
   - Matrix Green colors, terminal styling, dense layout, polish
4. **Epic 4: Keyboard Navigation System** (5 stories)
   - KeyboardManager, vim navigation, shortcuts, dynamic hints
5. **Epic 5: Data Persistence (TOON Storage)** (4 stories)
   - TOON encode/decode, auto-save, error handling, verification
6. **Epic 6: Auto-Update System** (4 stories)
   - electron-updater config, auto-download, manual check, testing

**Next Steps:**
Run UX Design (if UI) or Architecture workflow (if not already complete)

**Note:** Epics will be further enhanced during Phase 4 implementation as new technical details emerge.

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document was created with full context from PRD, UX Design, and Architecture specifications._

