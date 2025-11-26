# Story 7.7: Implement Project Indicator UI Component

Status: ready-for-dev

## Story

As a user,
I want to see which project is currently active,
So that I know where my todos are being added.

## Acceptance Criteria

1. Project indicator component displays current project name:
   - Shows the active project's name
   - Displays dropdown arrow (▼) to indicate clickable
   - Location: Header/footer area of the app

2. Visual styling matches terminal aesthetic:
   - Color: #00FF00 (bright terminal green)
   - Font: Consolas 14px monospace (matching app font)
   - Background: transparent (inherit black)
   - Hover state: subtle #001100 tint (dark green)
   - No animations or transitions (instant state changes)

3. Project indicator is clickable:
   - Click triggers onDropdownClick callback
   - Cursor changes to pointer on hover
   - Click area covers entire indicator (name + arrow)

4. Component updates when project changes:
   - Indicator re-renders when active project switches
   - Name updates immediately after project selection
   - No stale data displayed

5. Dropdown arrow provides visual affordance:
   - Unicode character: ▼ (U+25BC BLACK DOWN-POINTING TRIANGLE)
   - Small gap between name and arrow
   - Arrow is same color as name (#00FF00)

6. Indicator has minimal footprint:
   - Doesn't dominate the UI
   - Compact display that fits in header/footer
   - Truncation if project name is very long (with ellipsis)

7. Component exports function:
   - `renderProjectIndicator(project: Project, container: HTMLElement, onDropdownClick: () => void): void`
   - Clears container before rendering (idempotent)
   - Attaches click handler to indicator element

## Tasks / Subtasks

- [ ] Task 1: Create projectIndicator.ts file structure (AC: #7)
  - [ ] Create new file at `src/ui/projectIndicator.ts`
  - [ ] Import Project type from `@/types/Project`
  - [ ] Define function signature for `renderProjectIndicator`
  - [ ] Export the function

- [ ] Task 2: Implement DOM structure for indicator (AC: #1, #5)
  - [ ] Create container element (div or span)
  - [ ] Add project name text node
  - [ ] Add dropdown arrow span with ▼ character
  - [ ] Set data attribute for project id (data-project-id)

- [ ] Task 3: Apply terminal styling (AC: #2, #6)
  - [ ] Set inline styles or CSS class for green text (#00FF00)
  - [ ] Set font: Consolas, monospace at 14px
  - [ ] Set background: transparent
  - [ ] Set cursor: pointer
  - [ ] Add hover state styling (#001100 background)
  - [ ] Handle long project names with text-overflow: ellipsis
  - [ ] Set max-width for truncation

- [ ] Task 4: Implement click handling (AC: #3)
  - [ ] Add click event listener to indicator element
  - [ ] Call onDropdownClick callback when clicked
  - [ ] Prevent event propagation if needed
  - [ ] Ensure entire indicator (name + arrow) is clickable

- [ ] Task 5: Implement container clearing (AC: #7)
  - [ ] Clear container innerHTML before rendering
  - [ ] Append new indicator element to container
  - [ ] Ensure idempotent behavior (can call repeatedly)

- [ ] Task 6: Add CSS styles to styles.css (AC: #2)
  - [ ] Add `.project-indicator` class styles
  - [ ] Add `.project-indicator:hover` state
  - [ ] Add `.project-indicator-name` for name span
  - [ ] Add `.project-indicator-arrow` for dropdown arrow
  - [ ] Follow terminal aesthetic constraints (no transitions)

- [ ] Task 7: Implement update mechanism (AC: #4)
  - [ ] Ensure renderProjectIndicator can be called with new project
  - [ ] Test that calling with different project updates display
  - [ ] Verify no stale data after project switch

- [ ] Task 8: Unit tests (AC: #7)
  - [ ] Create `src/ui/projectIndicator.test.ts`
  - [ ] Test: renders project name correctly
  - [ ] Test: renders dropdown arrow
  - [ ] Test: click triggers callback
  - [ ] Test: updates when called with different project
  - [ ] Test: clears container before rendering

## Dev Notes

### Architecture Patterns and Constraints

- Create new file at `src/ui/projectIndicator.ts`
- Follow direct DOM manipulation pattern (no virtual DOM)
- Pure function with no side effects beyond DOM manipulation
- Terminal aesthetic: no modals, no overlays, green-on-black only
- Dropdown functionality will be implemented in Story 7.9

### Component API

```typescript
// src/ui/projectIndicator.ts
import type { Project } from '@/types/Project'

export const renderProjectIndicator = ({
  project,
  container,
  onDropdownClick
}: {
  project: Project
  container: HTMLElement
  onDropdownClick: () => void
}): void => {
  // Clear container
  container.innerHTML = ''

  // Create indicator element
  const indicator = document.createElement('div')
  indicator.className = 'project-indicator'
  indicator.dataset.projectId = project.id

  // Add project name
  const nameSpan = document.createElement('span')
  nameSpan.className = 'project-indicator-name'
  nameSpan.textContent = project.name

  // Add dropdown arrow
  const arrowSpan = document.createElement('span')
  arrowSpan.className = 'project-indicator-arrow'
  arrowSpan.textContent = ' ▼'

  // Assemble and attach
  indicator.appendChild(nameSpan)
  indicator.appendChild(arrowSpan)
  indicator.addEventListener('click', onDropdownClick)

  container.appendChild(indicator)
}
```

### CSS Styles

```css
/* In src/ui/styles.css */
.project-indicator {
  display: inline-flex;
  align-items: center;
  color: #00FF00;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  cursor: pointer;
  background: transparent;
  padding: 0.25rem 0.5rem;
  max-width: 200px;
}

.project-indicator:hover {
  background: #001100;
}

.project-indicator-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-indicator-arrow {
  margin-left: 0.25rem;
  flex-shrink: 0;
}
```

### Project Structure Notes

- File location: `src/ui/projectIndicator.ts` (new file)
- Test location: `src/ui/projectIndicator.test.ts` (new file)
- CSS additions: `src/ui/styles.css` (add to existing file)
- Integration point: Will be called from `render.ts` in Story 7.11

### Detected Conflicts or Variances

- None detected. Project types and patterns are consistent with architecture.

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Components Affected] - projectIndicator.ts location and purpose
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR34: Active Project Indicator] - Acceptance criteria
- [Source: docs/architecture.md#Project Search UI Pattern] - Visual design for indicator
- [Source: docs/architecture.md#Implementation Patterns] - Terminal aesthetic enforcement
- [Source: docs/architecture.md#Implementation Patterns] - Naming conventions (camelCase functions)
- [Source: docs/epics.md#Story 7.7] - Original story requirements

### Learnings from Previous Story

**From Story 7.6 (Status: ready-for-dev)**

- **Type Imports**: Use `@/types/Project` path alias for Project interface
- **Direct DOM Pattern**: Follow same pattern as other UI components - direct DOM manipulation
- **No Framework**: Pure vanilla TypeScript, no React/Vue/etc.
- **Function Exports**: Export functions following arrow function pattern per CLAUDE.md
- **Fire-and-Forget**: Callback execution should be synchronous
- **Terminal Aesthetic**: All UI must follow Matrix Green palette (#00FF00, #004400, #008800, #000000)

**From Story 7.1 (Status: done)**

- **Project Interface Available**: Project type at `src/types/Project.ts` with { id, name, createdAt }
- **UUID Format**: Project.id is UUID v4 format string

[Source: docs/sprint-artifacts/7-6-update-todostore-for-project-scoping.md#Dev-Notes]

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
