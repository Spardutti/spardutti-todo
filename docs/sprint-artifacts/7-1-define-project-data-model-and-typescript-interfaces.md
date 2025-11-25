# Story 7.1: Define Project Data Model and TypeScript Interfaces

Status: done

## Story

As a developer,
I want the Project data model and Settings interfaces defined,
So that I have type safety and consistent data structures for the projects system.

## Acceptance Criteria

1. A `src/types/Project.ts` file exists with a `Project` interface containing:
   - `id: string` (UUID v4)
   - `name: string` (user-defined name)
   - `createdAt: string` (ISO 8601 timestamp)

2. A `src/types/Settings.ts` file exists with an `AppSettings` interface containing:
   - `activeProjectId: string`
   - `windowBounds: { x: number, y: number, width: number, height: number }`
   - `version: string`

3. TypeScript compilation succeeds with strict mode enabled

4. Types can be imported using path aliases: `import type { Project } from '@/types/Project'`

5. Both interfaces are exported and documented with JSDoc comments

## Tasks / Subtasks

- [x] Task 1: Create Project interface (AC: #1)
  - [x] Create `src/types/Project.ts` file
  - [x] Define `Project` interface with id, name, createdAt properties
  - [x] Add JSDoc documentation for interface and each property
  - [x] Export the interface

- [x] Task 2: Create AppSettings interface (AC: #2)
  - [x] Create `src/types/Settings.ts` file
  - [x] Define `WindowBounds` type for the nested bounds object
  - [x] Define `AppSettings` interface with activeProjectId, windowBounds, version
  - [x] Add JSDoc documentation for interface and each property
  - [x] Export both types

- [x] Task 3: Verify TypeScript compilation (AC: #3)
  - [x] Run `npm run build` or TypeScript compiler
  - [x] Verify no type errors with strict mode
  - [x] Ensure interfaces work with existing tsconfig.json strict settings

- [x] Task 4: Verify import aliases work (AC: #4)
  - [x] Test import in a temporary file or existing file
  - [x] Verify `@/types/Project` and `@/types/Settings` resolve correctly
  - [x] Test both `import type` and regular imports

- [x] Task 5: Write unit tests (AC: #1, #2, #5)
  - [x] Create test file to verify type exports
  - [x] Test that interface shape matches expected structure
  - [x] Verify TypeScript catches type violations (compile-time tests)

## Dev Notes

### Architecture Patterns and Constraints

- Use `interface` (not `type`) for public API consistency per architecture naming conventions
- Follow existing Todo.ts pattern in `src/types/` directory
- UUID v4 format for id fields (generated using `crypto.randomUUID()`)
- ISO 8601 format for timestamps: `2025-11-25T10:00:00Z`
- Private class members in stores will use `_` prefix (e.g., `_projects`)
- Keep types simple and focused - validation logic belongs in stores, not type definitions

### Data Model Relationships

```
Project (1) ←→ (N) Todo
  └── Each project contains isolated todo list
  └── No cross-project visibility

Settings (1) ←→ (1) Active Project
  └── Settings.activeProjectId references Project.id
```

### WindowBounds Support

The `windowBounds` property in AppSettings supports FR41 (remember window size). This is stored in settings.toon and loaded by the main process to restore window position/size on startup.

### Project Structure Notes

- Type files located in `src/types/` directory (existing convention)
- Files: `Project.ts`, `Settings.ts` (alongside existing `Todo.ts`, `Shortcut.ts`)
- No changes to existing types required - these are additive

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-7.md#Data Models and Contracts] - Interface specifications
- [Source: docs/architecture.md#Data Models] - Data model definitions
- [Source: docs/architecture.md#Naming Conventions] - File and code naming patterns
- [Source: docs/epics.md#Story 7.1] - Story requirements and technical notes

### First Story in Epic

This is the first story in Epic 7 (Projects System). No previous story learnings to incorporate as Epic 6 (Auto-Update) is a separate feature area.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/7-1-define-project-data-model-and-typescript-interfaces.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Task 1: Created Project interface following Todo.ts JSDoc pattern
- Task 2: Created Settings.ts with WindowBounds and AppSettings interfaces
- Task 3: TypeScript compilation verified with `npx tsc --noEmit` (strict mode)
- Task 4: Import aliases verified within project src directory
- Task 5: Created comprehensive tests (14 tests) for type exports and interface shapes

### Completion Notes List

- Implemented Project interface (id, name, createdAt) with comprehensive JSDoc
- Implemented WindowBounds interface (x, y, width, height) for window restoration
- Implemented AppSettings interface (activeProjectId, windowBounds, version)
- All interfaces follow existing Todo.ts documentation pattern
- Path aliases work correctly: `@/types/Project`, `@/types/Settings`
- All 88 tests pass (including 14 new type tests)

### File List

**New Files:**
- src/types/Project.ts - Project interface definition
- src/types/Settings.ts - WindowBounds and AppSettings interface definitions
- src/types/Project.test.ts - Unit tests for Project interface
- src/types/Settings.test.ts - Unit tests for Settings interfaces

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-25 | Story drafted from tech-spec-epic-7 and epics.md | SM Agent |
| 2025-11-25 | Implemented all tasks - Project, WindowBounds, AppSettings interfaces created with JSDoc and tests | Dev Agent |
| 2025-11-25 | Senior Developer Review notes appended - APPROVED | SM Agent |

## Senior Developer Review (AI)

### Reviewer
Spardutti

### Date
2025-11-25

### Outcome
**APPROVE** - All acceptance criteria implemented, all tasks verified, excellent code quality

### Summary
Story 7.1 successfully defines the Project data model and TypeScript interfaces required for the Projects System. The implementation follows existing patterns (Todo.ts) precisely, includes comprehensive JSDoc documentation, and passes all strict TypeScript checks. All 5 ACs are fully implemented with 14 new tests verifying the interface shapes.

### Key Findings

**No issues found.** This is a clean, well-executed story.

### Acceptance Criteria Coverage

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| 1 | `src/types/Project.ts` with Project interface | IMPLEMENTED | `src/types/Project.ts:18-46` |
| 2 | `src/types/Settings.ts` with AppSettings interface | IMPLEMENTED | `src/types/Settings.ts:47-72` + WindowBounds:17-29 |
| 3 | TypeScript compilation succeeds with strict mode | IMPLEMENTED | `npx tsc --noEmit` passes; tsconfig has strict options |
| 4 | Path aliases work (@/types/Project, @/types/Settings) | IMPLEMENTED | Test files use aliases and pass |
| 5 | Both interfaces exported with JSDoc comments | IMPLEMENTED | Full JSDoc with @example blocks on all interfaces |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Task 1: Create Project interface | [x] | VERIFIED | `src/types/Project.ts` exists with interface |
| Task 1.1-1.4: Subtasks | [x] | VERIFIED | File created, interface defined, JSDoc added, exported |
| Task 2: Create AppSettings interface | [x] | VERIFIED | `src/types/Settings.ts` exists with both interfaces |
| Task 2.1-2.5: Subtasks | [x] | VERIFIED | File created, WindowBounds defined, AppSettings defined, JSDoc added, both exported |
| Task 3: Verify TypeScript compilation | [x] | VERIFIED | `npx tsc --noEmit` passes with no errors |
| Task 3.1-3.3: Subtasks | [x] | VERIFIED | tsc ran, no errors, strict mode works |
| Task 4: Verify import aliases | [x] | VERIFIED | Test imports use `@/types/*` and pass |
| Task 4.1-4.3: Subtasks | [x] | VERIFIED | Tested in files, aliases resolve, import type works |
| Task 5: Write unit tests | [x] | VERIFIED | `src/types/Project.test.ts`, `src/types/Settings.test.ts` |
| Task 5.1-5.3: Subtasks | [x] | VERIFIED | Files created, shapes tested, TypeScript validation implicit |

**Summary: 22 of 22 completed tasks verified, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- **Project.test.ts:** 5 tests covering type exports and interface shape
- **Settings.test.ts:** 9 tests covering WindowBounds and AppSettings
- **Total:** 14 new tests, 88 tests pass overall
- **Gaps:** None - interface testing is inherently limited to shape verification

### Architectural Alignment

- ✅ Uses `interface` (not `type`) per architecture naming conventions
- ✅ Follows existing Todo.ts pattern in `src/types/` directory
- ✅ Matches tech-spec-epic-7.md interface specifications exactly
- ✅ Path aliases configured correctly in tsconfig.json

### Security Notes

No security concerns - pure TypeScript interfaces with no runtime logic.

### Best-Practices and References

- [TypeScript Handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [JSDoc Reference](https://jsdoc.app/)
- Project patterns: `src/types/Todo.ts` (54 lines, same JSDoc style)

### Action Items

**None required** - Story approved as-is.
