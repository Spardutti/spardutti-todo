# Story 7.8: Implement Keyboard Project Search (Ctrl+P)

Status: ready-for-dev

## Story

As a user,
I want to switch projects using keyboard fuzzy search,
So that I can quickly navigate between projects without using the mouse.

## Acceptance Criteria

1. Ctrl+P opens inline search mode in footer:
   - Footer transforms to show input prompt: `> _`
   - Normal footer hints are hidden
   - Input is ready to receive keystrokes immediately
   - Focus is captured by the search mode

2. Typing filters projects using includes() matching:
   - Projects filtered using `name.toLowerCase().includes(query.toLowerCase())`
   - Matching projects displayed inline (as chips or list)
   - First match is automatically highlighted
   - Filter updates on each keystroke (instant feedback)

3. Arrow key navigation works in filtered results:
   - ArrowDown/j moves highlight to next match
   - ArrowUp/k moves highlight to previous match
   - Navigation wraps at boundaries (optional) or stops at ends
   - Highlighted project is visually distinct

4. Enter selects the highlighted project:
   - TodoStore loads new project's todos
   - SettingsStore updates activeProjectId
   - Project indicator updates to show new project name
   - Footer returns to normal hints
   - Input field regains focus (ready for todo entry)

5. Escape cancels search mode:
   - Footer restores to normal hints
   - No project change occurs
   - Previous focus state restored
   - Input field focus returned

6. Empty query behavior:
   - Shows all projects in list
   - All projects available for selection

7. No matches behavior:
   - Display: "No projects match" message
   - Enter does nothing when no matches
   - User can continue typing or press Escape to cancel

## Tasks / Subtasks

- [ ] Task 1: Create projectSearch.ts file structure (AC: #1, #7)
  - [ ] Create new file at `src/ui/projectSearch.ts`
  - [ ] Import Project type from `@/types/Project`
  - [ ] Import ProjectStore for search functionality
  - [ ] Define state management for search mode (query, selectedIndex, isActive)
  - [ ] Export functions for search mode operations

- [ ] Task 2: Register Ctrl+P shortcut in KeyboardManager (AC: #1)
  - [ ] Add Ctrl+P to KeyboardManager shortcuts
  - [ ] Handler activates project search mode
  - [ ] Ensure shortcut works regardless of current focus
  - [ ] Description: "Switch Project" for hints

- [ ] Task 3: Implement footer transformation for search mode (AC: #1, #6)
  - [ ] Create function to render search input in footer
  - [ ] Display prompt: `> ` with cursor indicator
  - [ ] Hide normal footer hints during search
  - [ ] Capture keystrokes for search input
  - [ ] Style matching terminal aesthetic (#00FF00 text, #000000 bg)

- [ ] Task 4: Implement project filtering logic (AC: #2, #6, #7)
  - [ ] Create filter function using includes() matching
  - [ ] Case-insensitive comparison
  - [ ] Return all projects when query is empty
  - [ ] Return empty array when no matches
  - [ ] Update filtered list on each keystroke

- [ ] Task 5: Implement filtered results display (AC: #2, #7)
  - [ ] Render matching projects inline in footer area
  - [ ] Display as horizontal chips: `[ProjectA] [ProjectB]`
  - [ ] Limit display width (truncate list with "..." if many matches)
  - [ ] Show "No projects match" when filter returns empty
  - [ ] Style with terminal green aesthetic

- [ ] Task 6: Implement arrow key navigation (AC: #3)
  - [ ] Track selectedIndex in search state
  - [ ] ArrowDown/j increments selectedIndex (bound to matches length)
  - [ ] ArrowUp/k decrements selectedIndex (bound to 0)
  - [ ] Update visual highlight on index change
  - [ ] Highlight first match automatically when filter changes

- [ ] Task 7: Implement Enter key selection (AC: #4)
  - [ ] Get highlighted project from filtered results
  - [ ] Call TodoStore.load(selectedProjectId)
  - [ ] Call SettingsStore.setActiveProject(selectedProjectId)
  - [ ] Trigger project indicator update
  - [ ] Exit search mode and restore footer
  - [ ] Return focus to input field

- [ ] Task 8: Implement Escape key cancellation (AC: #5)
  - [ ] Reset search state (query, selectedIndex)
  - [ ] Restore normal footer hints
  - [ ] Return focus to input field
  - [ ] No project change occurs

- [ ] Task 9: Add CSS styles for search mode (AC: #1, #2, #3)
  - [ ] Add `.project-search-active` class for footer
  - [ ] Add `.project-search-input` for input display
  - [ ] Add `.project-search-results` for results list
  - [ ] Add `.project-search-match` for each project chip
  - [ ] Add `.project-search-match--selected` for highlighted state
  - [ ] Follow terminal aesthetic (no transitions, green on black)

- [ ] Task 10: Unit tests for projectSearch (AC: all)
  - [ ] Create `src/ui/projectSearch.test.ts`
  - [ ] Test: filter function returns correct matches
  - [ ] Test: case-insensitive matching works
  - [ ] Test: empty query returns all projects
  - [ ] Test: no matches returns empty array
  - [ ] Test: selectedIndex navigation bounds
  - [ ] Test: Enter triggers project selection
  - [ ] Test: Escape resets state

## Dev Notes

### Architecture Patterns and Constraints

- Create new file at `src/ui/projectSearch.ts`
- Follow direct DOM manipulation pattern (no virtual DOM)
- Use inline footer for search UI per ADR-010 (no modals, no overlays)
- Simple includes() search per ADR-008 (sufficient for 5-10 projects)
- Terminal aesthetic: green-on-black, monospace, no animations
- Keyboard-first design: all functionality must work via keyboard

### Component API Design

```typescript
// src/ui/projectSearch.ts
import type { Project } from '@/types/Project'

interface ProjectSearchState {
  isActive: boolean
  query: string
  selectedIndex: number
  filteredProjects: Project[]
}

// State management
const createSearchState = (): ProjectSearchState => ({
  isActive: false,
  query: '',
  selectedIndex: 0,
  filteredProjects: []
})

// Filter function
const filterProjects = ({
  projects,
  query
}: {
  projects: Project[]
  query: string
}): Project[] => {
  if (!query.trim()) return projects
  const lowerQuery = query.toLowerCase()
  return projects.filter(p => p.name.toLowerCase().includes(lowerQuery))
}

// Main render function
export const renderProjectSearch = ({
  projects,
  container,
  onSelect,
  onCancel
}: {
  projects: Project[]
  container: HTMLElement
  onSelect: (project: Project) => void
  onCancel: () => void
}): void => {
  // Implementation
}

// Activate search mode
export const activateProjectSearch = ({
  footerContainer,
  projectStore,
  todoStore,
  settingsStore,
  onComplete
}: {
  footerContainer: HTMLElement
  projectStore: ProjectStore
  todoStore: TodoStore
  settingsStore: SettingsStore
  onComplete: () => void
}): void => {
  // Implementation
}
```

### Keyboard Handling in Search Mode

When search mode is active, the component must capture keyboard events:
- Regular keys: Append to query, update filter
- Backspace: Remove last character from query
- ArrowDown/j: Navigate down in results
- ArrowUp/k: Navigate up in results
- Enter: Select highlighted project
- Escape: Cancel and exit search mode

Use event.preventDefault() and event.stopPropagation() to prevent normal key handlers from firing during search mode.

### Footer Layout During Search

```
Normal footer:
"Enter: Save | Space: Toggle | Ctrl+D: Delete | Ctrl+P: Projects"

Search mode footer:
"> seq_ [SequenceStack] [Homefront]"
   ^     ^               ^
   |     |               +-- Other matches (dimmed or highlighted)
   |     +-- First/selected match (highlighted #00FF00)
   +-- Input prompt with cursor
```

### Integration Points

- **KeyboardManager**: Register Ctrl+P shortcut, handler calls activateProjectSearch
- **ProjectStore**: Call search() method to filter projects
- **TodoStore**: Call load(projectId) when project selected
- **SettingsStore**: Call setActiveProject(projectId) to persist selection
- **projectIndicator**: Must update after project switch
- **render.ts**: Footer restoration after search mode exits

### Project Structure Notes

- File location: `src/ui/projectSearch.ts` (new file)
- Test location: `src/ui/projectSearch.test.ts` (new file)
- CSS additions: `src/ui/styles.css` (add search mode classes)
- Dependencies: ProjectStore, TodoStore, SettingsStore, KeyboardManager
- Integration: Called from KeyboardManager when Ctrl+P pressed

### Testing Standards

Per testing strategy, include:
- Unit tests for filter logic (pure function, easy to test)
- Unit tests for state management (selectedIndex bounds)
- Unit tests for keyboard event handling
- Integration consideration: Manual testing for full flow (keyboard → switch → UI update)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR32: Keyboard Project Search] - Acceptance criteria definition
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Workflows and Sequencing] - Project Switch Flow (Keyboard - Ctrl+P)
- [Source: docs/architecture.md#Project Search UI Pattern] - Footer-based inline search design
- [Source: docs/architecture.md#Keyboard Shortcuts] - Ctrl+P shortcut registration
- [Source: docs/architecture.md#ADR-008] - Simple includes() matching decision
- [Source: docs/architecture.md#ADR-010] - Inline footer for project search UI decision
- [Source: docs/architecture.md#Implementation Patterns] - Terminal aesthetic enforcement
- [Source: docs/epics.md#Story 7.8] - Original story requirements

### Learnings from Previous Story

**From Story 7-7 (Status: ready-for-dev)**

Previous story 7-7 is not yet implemented (status: ready-for-dev), so no completion notes or file list available. However, the story draft provides useful context:

- **Component Pattern**: renderProjectIndicator uses object parameter pattern per CLAUDE.md
- **DOM Manipulation**: Direct DOM manipulation, clear container before render
- **CSS Classes**: .project-indicator, .project-indicator-name, .project-indicator-arrow patterns
- **Terminal Aesthetic**: #00FF00 text, #001100 hover, transparent background
- **Type Imports**: Use `@/types/Project` path alias
- **Arrow Functions**: Export functions following arrow function pattern

**Dependencies from Story 7-7:**
- projectIndicator.ts will exist (this story depends on 7-7)
- .project-indicator CSS classes will be defined
- renderProjectIndicator function available for updating indicator

[Source: docs/sprint-artifacts/7-7-implement-project-indicator-ui-component.md#Dev-Notes]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-8-implement-keyboard-project-search-ctrl-p.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
