/**
 * Shortcut handler registration for KeyboardManager
 */
export interface ShortcutHandler {
  /** Normalized key string (e.g., "enter", "ctrl+d", "j") */
  key: string
  /**
   * Action function to execute when shortcut is triggered.
   * Returns false to allow default browser behavior (e.g., Space typing in input).
   * Returns true or void to prevent default and handle the shortcut.
   */
  handler: () => void | boolean
  /** Human-readable description for help/hints display */
  description: string
}
