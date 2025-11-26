# Story 7.10: Implement Project Create, Rename, Delete Operations

Status: ready-for-dev

## Story

As a user,
I want to create, rename, and delete projects,
So that I can manage my project organization and adapt it to my workflow needs.

## Acceptance Criteria

1. Creating a new project:
   - "New Project" option in dropdown triggers project creation flow
   - Prompt appears for project name (inline or modal-less)
   - Entering a name and confirming creates a new project with unique UUID
   - New project becomes active immediately after creation
   - Dropdown closes after project creation
   - Empty name input is rejected (no project created)

2. Renaming a project:
   - User can rename any project including the Default project
   - Rename trigger accessible via dropdown context action or keyboard shortcut
   - Inline edit mode activates for name editing
   - Enter confirms the rename, Escape cancels
   - Name change persists to projects.toon immediately
   - Project indicator and dropdown reflect updated name
   - Empty name input is rejected (rename cancelled)

3. Deleting a project:
   - Delete trigger accessible via dropdown context action
   - Confirmation prompt appears: "Delete 'ProjectName' and X todos inside? [Y/n]"
   - Y/Enter confirms deletion, N/Escape cancels
   - On confirm: Project entry removed from projects.toon
   - On confirm: Associated todos-{projectId}.toon file deleted
   - Automatically switches to another project (first available)
   - Cannot delete the last remaining project (error message shown)
   - Deletion feedback appears briefly in footer

4. Default project handling:
   - Default project can be renamed
   - Default project cannot be deleted if it's the last remaining project
   - All project operations work identically for Default and user-created projects

5. Project creation keyboard flow:
   - Ctrl+Shift+P (or similar) opens direct project creation prompt
   - Or: In project search (Ctrl+P), typing a name that doesn't exist offers "Create new: [name]"
   - Creation from keyboard follows same flow as from dropdown

6. Integration with existing project UI:
   - Dropdown "New Project" calls ProjectStore.create()
   - Rename integrates with projectIndicator or projectDropdown
   - Delete integrates with projectDropdown with confirmation
   - All operations trigger proper store saves and UI re-renders

7. Error handling:
   - File system errors during create/rename/delete show inline error message
   - Delete confirmation prevents accidental data loss
   - Invalid operations (delete last project) show clear error message
   - All errors logged with electron-log

## Tasks / Subtasks

- [ ] Task 1: Implement ProjectStore.create() enhancement (AC: #1)
  - [ ] Add validation for non-empty project name
  - [ ] Generate UUID and ISO timestamp for new project
  - [ ] Add project to _projects array
  - [ ] Trigger auto-save to projects.toon
  - [ ] Return created project for immediate use
  - [ ] Write unit tests for create with valid/invalid names

- [ ] Task 2: Implement ProjectStore.rename() method (AC: #2)
  - [ ] Find project by ID, throw error if not found
  - [ ] Validate new name is non-empty
  - [ ] Update project name property
  - [ ] Trigger auto-save to projects.toon
  - [ ] Write unit tests for rename scenarios

- [ ] Task 3: Implement ProjectStore.delete() with cascade (AC: #3, #4)
  - [ ] Check if project is last remaining, throw error if so
  - [ ] Find project by ID, throw error if not found
  - [ ] Remove project from _projects array
  - [ ] Call ToonStorage.deleteTodosFile(projectId) for cascade delete
  - [ ] Trigger auto-save to projects.toon
  - [ ] Return next available project ID for auto-switch
  - [ ] Write unit tests for delete including cascade and last-project guard

- [ ] Task 4: Implement project name input component (AC: #1, #2, #5)
  - [ ] Create reusable prompt component for name input
  - [ ] Terminal-styled input: black bg, green border, green text
  - [ ] Support Enter to confirm, Escape to cancel
  - [ ] Validate non-empty before confirming
  - [ ] Add to src/ui/projectNameInput.ts or integrate with existing component

- [ ] Task 5: Integrate "New Project" in projectDropdown (AC: #1, #6)
  - [ ] Update projectDropdown to handle "New Project" click
  - [ ] Show name input prompt when "New Project" selected
  - [ ] Call ProjectStore.create() on confirm
  - [ ] Switch to new project (TodoStore.load, SettingsStore.setActiveProject)
  - [ ] Close dropdown and update UI
  - [ ] Handle empty name rejection

- [ ] Task 6: Implement rename UI flow (AC: #2, #6)
  - [ ] Add rename trigger to dropdown (right-click or icon button)
  - [ ] Transform project name into editable input inline
  - [ ] Handle Enter/Escape for confirm/cancel
  - [ ] Call ProjectStore.rename() on confirm
  - [ ] Update projectIndicator with new name
  - [ ] Re-render dropdown if open

- [ ] Task 7: Implement delete UI flow with confirmation (AC: #3, #4, #6)
  - [ ] Add delete trigger to dropdown (icon or context menu)
  - [ ] Count todos in project for confirmation message
  - [ ] Show confirmation: "Delete 'X' and N todos inside? [Y/n]"
  - [ ] Handle Y/Enter and N/Escape
  - [ ] Call ProjectStore.delete() on confirm
  - [ ] Switch to next available project
  - [ ] Show "Project deleted" feedback in footer (2 seconds)

- [ ] Task 8: Implement keyboard shortcut for project creation (AC: #5)
  - [ ] Register Ctrl+Shift+P in KeyboardManager
  - [ ] Show name input prompt on shortcut trigger
  - [ ] Follow same creation flow as dropdown
  - [ ] Alternative: Extend project search to offer creation for new names

- [ ] Task 9: Add error handling and logging (AC: #7)
  - [ ] Wrap create/rename/delete in try-catch
  - [ ] Log operations with electron-log
  - [ ] Show inline error messages on failure
  - [ ] Style error messages: red (#FF0000), inline placement
  - [ ] Auto-hide error after 5 seconds

- [ ] Task 10: Integration tests for project operations (AC: all)
  - [ ] Create src/store/ProjectStore.test.ts enhancements
  - [ ] Test: create → verify in list → save persistence
  - [ ] Test: rename → verify update → save persistence
  - [ ] Test: delete → verify removed → cascade delete todos file
  - [ ] Test: delete last project → error thrown
  - [ ] Test: empty name → rejection
  - [ ] Test: UI integration flows (manual or integration test)

## Dev Notes

### Architecture Patterns and Constraints

- **Store Pattern**: ProjectStore follows the same patterns as TodoStore - single responsibility, private _projects array, auto-save on mutations
- **Terminal Aesthetic**: All UI components must follow green-on-black styling, no modals, inline confirmations
- **Keyboard-First**: All operations should be keyboard-accessible, mouse is secondary
- **File Structure**: Projects stored in `{userData}/projects.toon`, per-project todos in `todos-{projectId}.toon`
- **Cascade Delete**: Deleting a project must also delete associated todos file

### Component API Patterns

```typescript
// ProjectStore operations
ProjectStore.create(name: string): Project     // Creates and returns new project
ProjectStore.rename(id: string, newName: string): void  // Updates project name
ProjectStore.delete(id: string): void          // Removes project + todos file

// ToonStorage cascade
ToonStorage.deleteTodosFile(projectId: string): Promise<void>  // Removes todos-{id}.toon
```

### Confirmation Pattern (Reuse from Bulk Delete)

The delete confirmation follows the same inline pattern used for bulk todo delete:
- Replace footer hints with confirmation prompt
- Keyboard-navigable: Y/Enter confirms, N/Escape cancels
- Brief feedback message after action
- Return to normal footer state

### Project Structure Notes

- File location: `src/store/ProjectStore.ts` (extend existing)
- New UI: `src/ui/projectNameInput.ts` or integrate with dropdown
- Integration: `src/ui/projectDropdown.ts` calls ProjectStore methods
- CSS: Add styles for inline name editing mode
- Tests: Co-located in `src/store/ProjectStore.test.ts`

### Testing Standards

Per architecture testing strategy:
- Unit tests for all ProjectStore methods
- Edge cases: empty name, delete last, invalid ID
- Mock ToonStorage for unit tests
- Integration tests for UI flows (manual testing acceptable)

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR31: Create Multiple Projects] - Create functionality
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR35: Rename Projects] - Rename functionality
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR36: Delete Projects] - Delete with confirmation
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#FR37: Default Project] - Default project handling
- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#APIs and Interfaces] - ProjectStore API contract
- [Source: docs/architecture.md#API Contracts] - ProjectStore Public API specification
- [Source: docs/architecture.md#Implementation Patterns] - Naming conventions and patterns
- [Source: docs/architecture.md#Format Patterns] - Error message format
- [Source: docs/epics.md#Story 7.10] - Original story requirements and acceptance criteria
- [Source: docs/ux-design-specification.md#7.1 Consistency Rules] - Confirmation patterns
- [Source: docs/ux-design-specification.md#Component 6] - Confirmation Prompt component spec
- [Source: docs/prd.md#FR31-FR37] - Functional requirements for projects

### Learnings from Previous Story

**From Story 7-9 (Status: ready-for-dev)**

Previous story 7-9 is not yet implemented (status: ready-for-dev), so no completion notes or implementation details available. However, key patterns from the drafted story:

- **Dropdown Component**: `projectDropdown.ts` will provide the container for create/rename/delete actions
- **Click Outside Detection**: Pattern established for closing dropdown (document click listener)
- **State Management**: isOpen, highlightedIndex patterns for keyboard navigation in dropdown
- **CSS Classes**: `.project-dropdown-*` naming convention for styling
- **Integration**: Dropdown calls TodoStore.load(), SettingsStore.setActiveProject() on selection

**Dependencies on Story 7-9:**
- "New Project" option will be rendered by projectDropdown
- Delete and rename triggers integrate into dropdown item rendering
- Confirmation pattern may share footer space with dropdown

[Source: docs/sprint-artifacts/7-9-implement-mouse-dropdown-for-project-switch.md#Dev-Notes]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-10-implement-project-create-rename-delete-operations.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-26 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
