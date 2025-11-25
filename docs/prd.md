# spardutti-todo - Product Requirements Document

**Author:** Spardutti
**Date:** 2025-11-25
**Version:** 2.0

---

## Executive Summary

A minimal desktop todo application built for speed and simplicity. Targets developers and professionals who need ultra-fast task capture without disrupting flow state. Local-first storage, keyboard-driven interface, and zero configuration overhead. Success metric: alt-tab in, create todo, alt-tab out in under 2 seconds.

### What Makes This Special

**Flow-state optimized task capture.** Every design decision prioritizes speed and minimal context-switching. Unlike bloated todo apps that demand attention, spardutti-todo disappears until needed and captures tasks in under 2 seconds.

---

## Project Classification

**Technical Type:** desktop_app
**Domain:** general
**Complexity:** low

This is a Windows desktop application with a focus on speed, simplicity, and local data control. No specialized domain requirements - standard personal task management with an emphasis on minimal friction and maximum speed.

---

## Success Criteria

**Primary Success Metric:**
- Task capture completes in under 2 seconds from app activation to return to work

**User Experience Success:**
- Users prefer this over their current todo solution due to speed
- Daily active usage by the creator (primary validation)
- Zero friction in workflow - tool becomes invisible habit

**Technical Success:**
- Fast startup time (application launches instantly)
- Minimal resource footprint (doesn't slow down system)
- Reliable local data persistence (no data loss)

---

## Product Scope

### MVP - Minimum Viable Product

**Core Capabilities:**
1. Create todos with fast text entry
2. Mark todos as complete/incomplete
3. Bulk delete all completed items
4. Local storage (all data on user's PC)
5. Minimal, distraction-free UI
6. Keyboard shortcuts for all actions

**Success Criteria:** Can alt-tab in, create a todo, and alt-tab out in under 2 seconds.

### Growth Features (Post-MVP)

#### Major Feature: Projects System

**Purpose:** Organize todos into isolated project containers. Users working on multiple initiatives (e.g., SequenceStack, HomefrontGroup, StealthMetrix) can maintain separate todo lists per project.

**Core Behaviors:**

- **Isolation:** Each project is a completely separate todo list. No cross-project views — ever.
- **Default Project:** App ships with a "Default" project that users can rename or keep as-is.
- **Active Project:** One project is active at a time. All new todos go to the active project without prompting.

**Navigation:**

| Method | Behavior |
|--------|----------|
| **Keyboard (primary)** | Shortcut opens fuzzy search → type partial project name → Enter to switch |
| **Mouse (secondary)** | Click project name indicator → dropdown list appears → click to switch |

**Visual Display:**

- Minimal indicator showing current project name (in header or footer area)
- No tabs, no sidebar — keeps the terminal aesthetic clean
- Indicator doubles as mouse-clickable dropdown trigger

**Project Management:**

| Operation | Supported | Details |
|-----------|-----------|---------|
| Create | Yes | Keyboard shortcut to create new project |
| Rename | Yes | Edit project name |
| Delete | Yes | Warning prompt: "Delete project and all X todos inside?" |
| Reorder | No | Projects appear in creation order |

**Scale:** Designed for ~5-10 active projects. Not intended for dozens of projects.

---

#### Polish & Quality of Life

**P1: Remember Window Size**
- System remembers window dimensions if user resizes
- Restored on next launch
- Default size on first launch remains unchanged

**P2: Todo Ordering — Append to Top**
- New todos appear at the top of the list (most recent first)
- Current behavior: todos pushed to bottom
- Rationale: Recent tasks are usually most relevant

**P3: Version Visibility**
- Current version display in bottom-right is hard to read
- Improve contrast/styling for better visibility
- Keep minimal — don't make it prominent, just readable

**P4: Update Progress Bar**
- Show download progress when updates are being downloaded
- Current: No visual feedback during update download
- Simple progress indicator (percentage or bar)

**P5: Remove ESC Shortcut**
- ESC key currently mapped but does nothing useful
- Remove dead shortcut to avoid confusion
- Clean up keyboard shortcut documentation accordingly

---

#### Distribution: Linux Support

**Linux Installer**
- Package application for Linux distribution
- Target: Debian-based (.deb) and/or AppImage for broad compatibility
- Same feature set as Windows version
- Auto-update mechanism must work on Linux
- Rationale: Share with Linux-using friends/colleagues

### Vision (Future)

[To be defined based on user feedback from Growth features]

---

## desktop_app Specific Requirements

**Platform Support:**
- Primary: Windows 10 and later
- Growth: Linux (Debian-based .deb and/or AppImage)
- Electron-based implementation (enables cross-platform support)

**Update Strategy:**
- Auto-update mechanism required
- Check for updates on launch or background
- Seamless update installation without user intervention
- Fallback to manual update if auto-update fails

**System Integration:**
- Minimal system integration (intentional design choice)
- No system tray icon
- No startup on boot
- No global hotkeys
- Launch via standard Windows application launcher

**Offline Capabilities:**
- Fully offline application (no internet dependency)
- All data stored locally on user's PC
- No cloud sync, no remote services
- Auto-update is the only network-dependent feature

---

## User Experience Principles

**Visual Aesthetic:**
- Old Windows terminal look and feel
- Monospace font (classic terminal typography)
- Simple color palette (terminal-style colors: black background, white/green text, or similar)
- No gradients, shadows, or modern UI flourishes
- Text-based interface optimized for readability and speed

**Interaction Philosophy:**
- Keyboard-first navigation (mouse is optional convenience)
- Every action accessible via keyboard shortcut
- Immediate visual feedback for all actions
- No animations or transitions that slow down workflow
- Terminal-style command efficiency

**Design Goal:**
The UI should feel like a lightning-fast terminal tool, not a "modern app." Form follows function - every pixel serves speed and clarity.

### Key Interactions

**Task Creation:**
- Focus on input field immediately on launch
- Type task, press Enter to save
- Instant return to ready state for next task

**Task Management:**
- Arrow keys or j/k (vim-style) to navigate todo list
- Space or Enter to toggle complete/incomplete
- Visual indicator for completed items (strikethrough or color change)

**Bulk Operations:**
- Single keyboard shortcut to delete all completed items
- Confirmation prompt (minimal, keyboard-navigable)

**Application Control:**
- Esc or Ctrl+Q to close/minimize
- Tab or Ctrl+N to focus input for new task
- All shortcuts visible/discoverable (help screen or footer hints)

**Speed Priority:**
Every interaction optimized to minimize keystrokes and cognitive load. Terminal aesthetic reinforces the "tool for professionals" positioning.

---

## Functional Requirements

These requirements define the complete capability set for spardutti-todo. Every capability listed here must be implemented in the MVP.

### Task Management

**FR1:** Users can create a new todo by typing text and pressing Enter

**FR2:** Users can view a list of all todos (both active and completed)

**FR3:** Users can mark a todo as complete

**FR4:** Users can mark a completed todo as incomplete (toggle back to active)

**FR5:** Users can delete all completed todos with a single action

**FR6:** Users can see visual distinction between active and completed todos

### Data Persistence

**FR7:** All todo data is stored locally on the user's Windows PC

**FR8:** Todo data persists between application sessions (survives app close/reopen)

**FR9:** Users can access their todos without an internet connection

**FR10:** The application stores data in a human-readable format (for potential manual editing/backup)

### Keyboard Navigation & Shortcuts

**FR11:** Users can navigate the todo list using arrow keys

**FR12:** Users can navigate the todo list using vim-style keys (j/k for up/down)

**FR13:** Users can toggle todo completion status using keyboard (Space or Enter)

**FR14:** Users can focus the input field for new todos using keyboard shortcut

**FR15:** Users can close/minimize the application using keyboard shortcut (Esc or Ctrl+Q)

**FR16:** Users can delete all completed todos using keyboard shortcut

**FR17:** Users can view all available keyboard shortcuts (help screen or hints)

### Application Launch & Performance

**FR18:** The application launches quickly (target: under 2 seconds to usable state)

**FR19:** The input field has focus immediately on launch (ready to type)

**FR20:** The application provides immediate visual feedback for all user actions

**FR21:** The application operates without animations or transition delays

### Auto-Update

**FR22:** The application checks for software updates automatically

**FR23:** The application downloads and installs updates without requiring user action

**FR24:** Users can manually check for updates if auto-update fails

**FR25:** The application notifies users when updates are available or installed

### User Interface

**FR26:** The application displays a terminal-style visual interface (monospace font, simple colors)

**FR27:** The application supports mouse interaction as an optional convenience (all actions keyboard-accessible)

**FR28:** The application displays completed todos with visual differentiation (strikethrough or color)

**FR29:** The application provides confirmation prompt before deleting completed todos

**FR30:** The application window is minimal and distraction-free (no unnecessary UI chrome)

---

### Growth Features - Functional Requirements

#### Projects System

**FR31:** Users can create multiple projects to organize todos

**FR32:** Users can switch between projects using keyboard fuzzy search (shortcut → type partial name → Enter)

**FR33:** Users can switch between projects using mouse (click indicator → dropdown → select)

**FR34:** Users can see which project is currently active via a minimal indicator

**FR35:** Users can rename existing projects

**FR36:** Users can delete projects with confirmation warning about deleting contained todos

**FR37:** The application ships with a default project that users can rename

**FR38:** New todos are automatically added to the currently active project without prompting

**FR39:** Each project maintains a completely isolated todo list (no cross-project visibility)

**FR40:** Project data persists between application sessions

#### Polish & Quality of Life

**FR41:** The application remembers and restores window size/dimensions between sessions

**FR42:** New todos appear at the top of the list (most recent first)

**FR43:** Version number display has improved visibility/contrast

**FR44:** The application shows download progress during update downloads

**FR45:** The ESC keyboard shortcut is removed (currently non-functional)

#### Linux Distribution

**FR46:** The application is available as a Linux package (.deb and/or AppImage)

**FR47:** Linux version has feature parity with Windows version

**FR48:** Auto-update mechanism functions on Linux

---

## Non-Functional Requirements

### Performance

Performance is critical to spardutti-todo's value proposition. The entire product is optimized for speed and minimal friction.

**Launch Performance:**
- Application startup to usable state: under 2 seconds (target: under 1 second)
- Input field must be focused and ready to receive text immediately on launch
- Application should launch from cold start without noticeable delay

**Runtime Performance:**
- All user actions provide immediate visual feedback (no perceived lag)
- Todo list rendering handles at least 1000 todos without performance degradation
- Keyboard input has zero perceptible latency
- Application should consume minimal system resources (low CPU and memory footprint)

**Data Operations:**
- Todo creation saves instantly (synchronous or appears synchronous to user)
- Todo list loads instantly on application launch
- Bulk delete operations complete in under 1 second for typical usage (under 100 completed todos)

**Responsiveness:**
- No animations or transitions that slow down interaction
- UI never freezes or becomes unresponsive during any operation
- Update checks and downloads happen in background without blocking UI

**Success Metric:**
The primary performance goal is the 2-second task capture flow: alt-tab to app → type todo → press Enter → alt-tab back to work. This entire sequence must complete smoothly and predictably.

---

**Note on Other NFR Categories:**
- **Security:** Not applicable (local-only data, no authentication, no sensitive information handling)
- **Scalability:** Not applicable (single-user desktop application)
- **Accessibility:** Intentionally minimal (terminal aesthetic targets technical users)
- **Integration:** By design, minimal (standalone application, no third-party integrations)

---

_This PRD captures the essence of spardutti-todo - a ruthlessly minimal desktop todo app that prioritizes speed over features, keyboard efficiency over mouse convenience, and local control over cloud complexity. Built for developers and professionals who need to capture tasks in under 2 seconds without breaking flow state._

_Created through collaborative discovery between Spardutti and AI facilitator._
