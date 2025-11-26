# Story 7.9: Implement Mouse Dropdown for Project Switch

Status: ready-for-dev

## Story

As a user,
I want to switch projects using a mouse dropdown,
So that I have an alternative to keyboard navigation for project switching.

## Acceptance Criteria

1. Clicking the project indicator opens a dropdown:
   - Dropdown appears below the indicator
   - Dropdown contains a list of all projects
   - Active project has a checkmark (✓) indicator
   - "New Project" option appears at bottom of list
   - Dropdown styled with terminal aesthetic

2. Clicking a project in dropdown switches to that project:
   - TodoStore loads new project's todos
   - SettingsStore updates activeProjectId
   - Project indicator updates to show new project name
   - Dropdown closes immediately after selection
   - Input field regains focus (ready for todo entry)

3. Clicking "New Project" triggers project creation:
   - Opens project creation flow (prompts for name)
   - Creates new project with user-provided name
   - Switches to newly created project
   - Dropdown closes after creation

4. Clicking outside dropdown closes it:
   - Dropdown closes without any project change
   - Previous focus state restored
   - No side effects

5. Dropdown styling matches terminal aesthetic:
   - Background: #000000 (pure black)
   - Border: 1px solid #00FF00 (terminal green)
   - Item text: #00FF00 (bright green)
   - Item hover background: #001100 (subtle dark green tint)
   - Checkmark for active: #00FF00
   - No animations or transitions (instant state changes)

6. Dropdown positioning and behavior:
   - Position: Below the project indicator, left-aligned
   - Width: Auto-sized to content or fixed reasonable width
   - Max height with scroll if many projects
   - Z-index ensures dropdown appears above other content

7. Keyboard accessibility in dropdown (mouse trigger, keyboard nav):
   - Arrow keys navigate items when dropdown is open
   - Enter selects highlighted item
   - Escape closes dropdown
   - Tab cycles through items

## Tasks / Subtasks

- [ ] Task 1: Create projectDropdown.ts file structure (AC: #1, #5)
  - [ ] Create new file at `src/ui/projectDropdown.ts`
  - [ ] Import Project type from `@/types/Project`
  - [ ] Import ProjectStore, TodoStore, SettingsStore for operations
  - [ ] Define state management for dropdown (isOpen, highlightedIndex)
  - [ ] Export functions for dropdown operations

- [ ] Task 2: Update projectIndicator to trigger dropdown (AC: #1)
  - [ ] Modify projectIndicator.ts click handler
  - [ ] Call showDropdown() on indicator click
  - [ ] Pass project list and callbacks to dropdown
  - [ ] Ensure indicator remains visible when dropdown open

- [ ] Task 3: Implement dropdown rendering (AC: #1, #5, #6)
  - [ ] Create function to render dropdown container
  - [ ] Position dropdown below project indicator
  - [ ] Apply terminal styling (black bg, green border)
  - [ ] Set appropriate z-index for layering
  - [ ] Handle overflow with scroll for many projects

- [ ] Task 4: Implement project list items in dropdown (AC: #1, #5)
  - [ ] Render each project as clickable item
  - [ ] Display project name
  - [ ] Add checkmark (✓) for active project
  - [ ] Apply hover state (#001100 background)
  - [ ] Style with monospace font, green text

- [ ] Task 5: Implement "New Project" option (AC: #3)
  - [ ] Add separator or visual distinction before "New Project"
  - [ ] Render "New Project" as special item (+ icon or text)
  - [ ] Handle click to open project creation flow
  - [ ] Integrate with ProjectStore.create()
  - [ ] Close dropdown after project creation

- [ ] Task 6: Implement project selection logic (AC: #2)
  - [ ] Handle click on project item
  - [ ] Call TodoStore.load(selectedProjectId)
  - [ ] Call SettingsStore.setActiveProject(selectedProjectId)
  - [ ] Trigger project indicator update
  - [ ] Close dropdown after selection
  - [ ] Return focus to input field

- [ ] Task 7: Implement click-outside detection (AC: #4)
  - [ ] Add document-level click listener when dropdown open
  - [ ] Check if click target is inside dropdown
  - [ ] Close dropdown if click is outside
  - [ ] Remove listener when dropdown closes
  - [ ] Handle edge cases (clicking indicator while open)

- [ ] Task 8: Implement keyboard navigation in dropdown (AC: #7)
  - [ ] Track highlightedIndex for keyboard nav
  - [ ] ArrowDown/j moves highlight down
  - [ ] ArrowUp/k moves highlight up
  - [ ] Enter selects highlighted item
  - [ ] Escape closes dropdown
  - [ ] Tab cycles through items

- [ ] Task 9: Add CSS styles for dropdown (AC: #5, #6)
  - [ ] Add `.project-dropdown` class for container
  - [ ] Add `.project-dropdown-item` for each item
  - [ ] Add `.project-dropdown-item--active` for current project
  - [ ] Add `.project-dropdown-item--highlighted` for keyboard nav
  - [ ] Add `.project-dropdown-item--new` for "New Project"
  - [ ] Add `.project-dropdown-separator` if using visual separator
  - [ ] Follow terminal aesthetic (no transitions, green on black)

- [ ] Task 10: Unit tests for projectDropdown (AC: all)
  - [ ] Create `src/ui/projectDropdown.test.ts`
  - [ ] Test: dropdown renders with all projects
  - [ ] Test: active project shows checkmark
  - [ ] Test: clicking project triggers selection
  - [ ] Test: clicking "New Project" triggers creation flow
  - [ ] Test: clicking outside closes dropdown
  - [ ] Test: keyboard navigation works
  - [ ] Test: Escape closes dropdown

## Dev Notes

### Architecture Patterns and Constraints

- Create new file at `src/ui/projectDropdown.ts`
- Follow direct DOM manipulation pattern (no virtual DOM)
- Dropdown is part of projectIndicator component interaction
- Terminal aesthetic: green-on-black, monospace, no animations
- Mouse-triggered but supports keyboard navigation once open
- Mouse is secondary to keyboard per keyboard-first design philosophy

### Component API Design

```typescript
// src/ui/projectDropdown.ts
import type { Project } from '@/types/Project'

interface ProjectDropdownState {
  isOpen: boolean
  highlightedIndex: number
}

// State management
const createDropdownState = (): ProjectDropdownState => ({
  isOpen: false,
  highlightedIndex: 0
})

// Show dropdown
export const showProjectDropdown = ({
  anchor,
  projects,
  activeProjectId,
  onSelect,
  onNewProject,
  onClose
}: {
  anchor: HTMLElement
  projects: Project[]
  activeProjectId: string
  onSelect: (project: Project) => void
  onNewProject: () => void
  onClose: () => void
}): void => {
  // Implementation
}

// Hide dropdown
export const hideProjectDropdown = (): void => {
  // Implementation
}
```

### Dropdown HTML Structure

```html
<div class="project-dropdown">
  <div class="project-dropdown-item project-dropdown-item--active">
    <span class="project-dropdown-checkmark">✓</span>
    <span class="project-dropdown-name">SequenceStack</span>
  </div>
  <div class="project-dropdown-item">
    <span class="project-dropdown-checkmark"></span>
    <span class="project-dropdown-name">HomefrontGroup</span>
  </div>
  <div class="project-dropdown-item">
    <span class="project-dropdown-checkmark"></span>
    <span class="project-dropdown-name">Default</span>
  </div>
  <div class="project-dropdown-separator"></div>
  <div class="project-dropdown-item project-dropdown-item--new">
    <span class="project-dropdown-icon">+</span>
    <span class="project-dropdown-name">New Project</span>
  </div>
</div>
```

### CSS Styling Pattern

```css
.project-dropdown {
  position: absolute;
  background: #000000;
  border: 1px solid #00FF00;
  z-index: 100;
  min-width: 150px;
  max-height: 200px;
  overflow-y: auto;
}

.project-dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  color: #00FF00;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
}

.project-dropdown-item:hover,
.project-dropdown-item--highlighted {
  background: #001100;
}

.project-dropdown-checkmark {
  width: 1rem;
  margin-right: 0.5rem;
}

.project-dropdown-separator {
  height: 1px;
  background: #004400;
  margin: 0.25rem 0;
}
```

### Click Outside Detection Pattern

```typescript
const handleClickOutside = (event: MouseEvent): void => {
  const dropdown = document.querySelector('.project-dropdown')
  const indicator = document.querySelector('.project-indicator')

  if (!dropdown || !indicator) return

  const target = event.target as Node
  const isInsideDropdown = dropdown.contains(target)
  const isInsideIndicator = indicator.contains(target)

  if (!isInsideDropdown && !isInsideIndicator) {
    hideProjectDropdown()
  }
}

// Add listener when dropdown opens
document.addEventListener('click', handleClickOutside)

// Remove listener when dropdown closes
document.removeEventListener('click', handleClickOutside)
```

### Integration Points

- **projectIndicator.ts**: Calls showProjectDropdown on click
- **ProjectStore**: Provides projects list and activeProjectId
- **TodoStore**: Call load(projectId) when project selected
- **SettingsStore**: Call setActiveProject(projectId) to persist
- **render.ts**: May need to manage dropdown lifecycle
- **Project creation**: May need to integrate with existing or new creation flow

### Project Structure Notes

- File location: `src/ui/projectDropdown.ts` (new file)
- Test location: `src/ui/projectDropdown.test.ts` (new file)
- CSS additions: `src/ui/styles.css` (add dropdown classes)
- Dependencies: ProjectStore, TodoStore, SettingsStore, projectIndicator
- Integration: Called from projectIndicator when clicked

### Testing Standards

Per testing strategy, include:
- Unit tests for dropdown rendering
- Unit tests for click-outside detection
- Unit tests for keyboard navigation
- Unit tests for selection logic
- Integration consideration: Manual testing for full flow (click indicator → select → verify switch)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR33: Mouse Dropdown Switch] - Acceptance criteria definition
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Workflows and Sequencing] - Project Switch Flow (Mouse - Dropdown)
- [Source: docs/architecture.md#Project Search UI Pattern] - Mouse dropdown design
- [Source: docs/architecture.md#Implementation Patterns] - Terminal aesthetic enforcement
- [Source: docs/epics.md#Story 7.9] - Original story requirements
- [Source: docs/ux-design-specification.md#Section 2.3] - Keyboard-first with mouse convenience principle
- [Source: docs/prd.md#FR33] - Users can switch between projects using mouse

### Learnings from Previous Story

**From Story 7-8 (Status: ready-for-dev)**

Previous story 7-8 is not yet implemented (status: ready-for-dev), so no completion notes or file list available. However, the story draft provides useful context:

- **Component Pattern**: projectSearch.ts uses object parameter pattern per CLAUDE.md
- **CSS Classes**: .project-search-*, .project-search-match patterns for items
- **Terminal Aesthetic**: #00FF00 text, #001100 hover, #000000 background
- **Keyboard Handling**: capture events, preventDefault for handled keys
- **State Management**: isActive, selectedIndex tracking

**Dependencies from Story 7-8:**
- projectSearch.ts will exist and may share patterns
- Similar CSS class naming conventions
- May share project selection callback patterns
- Both components need to coordinate (search vs dropdown, don't conflict)

[Source: docs/sprint-artifacts/7-8-implement-keyboard-project-search-ctrl-p.md#Dev-Notes]

### Coordination with Keyboard Search (Story 7-8)

Both projectDropdown (mouse) and projectSearch (keyboard) allow project switching:
- They should not be open simultaneously
- Opening dropdown should close search (if open)
- Opening search should close dropdown (if open)
- Both trigger same selection callback pattern
- Both update TodoStore, SettingsStore, and indicator

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-9-implement-mouse-dropdown-for-project-switch.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
