/**
 * WindowBounds represents the position and size of the application window.
 *
 * Used by the main process to restore window position and size on startup.
 * All values are in screen pixels.
 *
 * @example
 * ```typescript
 * const bounds: WindowBounds = {
 *   x: 100,
 *   y: 100,
 *   width: 600,
 *   height: 400
 * }
 * ```
 */
export interface WindowBounds {
  /** Horizontal position of window's left edge in screen pixels */
  x: number

  /** Vertical position of window's top edge in screen pixels */
  y: number

  /** Window width in screen pixels */
  width: number

  /** Window height in screen pixels */
  height: number
}

/**
 * AppSettings represents global application settings persisted to settings.toon.
 *
 * Tracks the active project (which todo list to display), window bounds for
 * restoring position/size on startup, and a version field for future migrations.
 * Managed by SettingsStore with auto-save on changes.
 *
 * @example
 * ```typescript
 * const settings: AppSettings = {
 *   activeProjectId: "550e8400-e29b-41d4-a716-446655440000",
 *   windowBounds: { x: 100, y: 100, width: 600, height: 400 },
 *   version: "1.0"
 * }
 * ```
 */
export interface AppSettings {
  /**
   * ID of the currently active project.
   *
   * References: Project.id from projects.toon
   * Used by: TodoStore to load correct todos file
   * Updated by: SettingsStore.setActiveProject() on project switch
   */
  activeProjectId: string

  /**
   * Window position and size to restore on app startup.
   *
   * Saved when: Window is moved or resized
   * Restored by: Main process on app launch
   */
  windowBounds: WindowBounds

  /**
   * Settings schema version for future migrations.
   *
   * Format: Semantic version string (e.g., "1.0")
   * Purpose: Allow settings format changes without data loss
   */
  version: string
}
