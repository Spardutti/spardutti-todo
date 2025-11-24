import type { ShortcutHandler } from '@/types/Shortcut'

/**
 * Centralized keyboard shortcut manager with conflict detection and help generation.
 *
 * Provides O(1) shortcut lookup, key normalization (lowercase, modifiers),
 * and automatic help text generation for footer hints.
 *
 * @example
 * ```typescript
 * const km = new KeyboardManager()
 * km.register('enter', () => console.log('Enter pressed'), 'Save todo')
 * km.register('ctrl+d', () => console.log('Ctrl+D pressed'), 'Delete all')
 *
 * window.addEventListener('keydown', (e) => km.handle(e))
 * console.log(km.getHints()) // "Save todo: enter | Delete all: ctrl+d"
 * ```
 */
export default class KeyboardManager {
  private _shortcuts: Map<string, ShortcutHandler>

  constructor() {
    this._shortcuts = new Map()
  }

  /**
   * Register a keyboard shortcut with conflict detection.
   *
   * Keys are automatically normalized to lowercase with modifiers (e.g., "ctrl+d").
   * Attempting to register the same key twice will throw an error.
   *
   * @param key - Key string (e.g., "Enter", "j", "Ctrl+D")
   * @param handler - Function to execute when key is pressed. Returns false to allow default browser behavior.
   * @param description - Human-readable description for help generation
   * @throws {Error} If key is already registered (conflict detection)
   *
   * @example
   * ```typescript
   * km.register('enter', () => saveTodo(), 'Save todo')
   * km.register('ctrl+d', () => deleteAll(), 'Delete all completed')
   * // Context-aware handler
   * km.register('space', () => {
   *   if (inputFocused) return false  // Allow default space typing
   *   toggleTodo()
   *   return true  // Prevent default
   * }, 'Toggle todo')
   * ```
   */
  register(key: string, handler: () => void | boolean, description: string): void {
    const normalizedKey = this._normalizeKeyString(key)

    if (this._shortcuts.has(normalizedKey)) {
      throw new Error(`Shortcut '${normalizedKey}' already registered`)
    }

    this._shortcuts.set(normalizedKey, {
      key: normalizedKey,
      handler,
      description
    })
  }

  /**
   * Unregister a keyboard shortcut.
   *
   * Idempotent operation - no error if key doesn't exist.
   *
   * @param key - Key string to unregister
   *
   * @example
   * ```typescript
   * km.unregister('enter')
   * km.unregister('nonexistent') // No error
   * ```
   */
  unregister(key: string): void {
    const normalizedKey = this._normalizeKeyString(key)
    this._shortcuts.delete(normalizedKey)
  }

  /**
   * Handle keyboard event and execute registered shortcut if matched.
   *
   * Returns true if event was handled (shortcut matched), false otherwise.
   * For handled events, preventDefault() and stopPropagation() are called,
   * UNLESS the handler returns false (which allows default browser behavior).
   *
   * @param event - Browser KeyboardEvent
   * @returns true if event was handled, false if no matching shortcut
   *
   * @example
   * ```typescript
   * window.addEventListener('keydown', (e) => {
   *   const handled = km.handle(e)
   *   if (handled) console.log('Shortcut executed')
   * })
   * ```
   */
  handle(event: KeyboardEvent): boolean {
    const normalizedKey = this._normalizeKey(event)

    if (!normalizedKey) {
      return false // Modifier-only keys ignored
    }

    const shortcut = this._shortcuts.get(normalizedKey)

    if (shortcut) {
      const handlerResult = shortcut.handler()

      // Only prevent default if handler returns true or void (undefined)
      // If handler returns false, allow default browser behavior
      if (handlerResult !== false) {
        event.preventDefault()
        event.stopPropagation()
      }

      return true
    }

    return false
  }

  /**
   * Get formatted keyboard hints string for footer display.
   *
   * Format: "Key: Description | Key: Description"
   * Example: "Enter: Save | Space: Toggle | Ctrl+D: Delete All"
   *
   * Note: Returns shortcuts in registration order. Only includes persistent shortcuts
   * (temporary handlers like y/n during confirmation are not stored in _shortcuts Map).
   *
   * @returns Formatted hints string with pipe separator
   *
   * @example
   * ```typescript
   * const hints = km.getHints()
   * footerElement.textContent = hints
   * ```
   */
  getHints(): string {
    if (this._shortcuts.size === 0) {
      return ''
    }

    const hints: string[] = []

    for (const shortcut of this._shortcuts.values()) {
      // Format key with proper capitalization
      const formattedKey = this._formatKeyForDisplay(shortcut.key)
      hints.push(`${formattedKey}: ${shortcut.description}`)
    }

    return hints.join(' | ')
  }

  /**
   * Format a normalized key string for display in hints.
   * Converts: "enter" → "Enter", "space" → "Space", "ctrl+d" → "Ctrl+D"
   *
   * @param key - Normalized key string
   * @returns Formatted key string for display
   *
   * @private
   */
  private _formatKeyForDisplay(key: string): string {
    // Special handling for arrow keys - use Unicode symbols
    if (key === 'arrowdown') return '↓'
    if (key === 'arrowup') return '↑'
    if (key === 'arrowleft') return '←'
    if (key === 'arrowright') return '→'

    // Handle modifier keys (ctrl+d, alt+f, etc.)
    if (key.includes('+')) {
      return key.split('+').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('+')
    }

    // Single key: capitalize first letter
    return key.charAt(0).toUpperCase() + key.slice(1)
  }

  /**
   * Normalize KeyboardEvent to lowercase key string with modifiers.
   *
   * Rules:
   * - Convert to lowercase: "Enter" → "enter", "KeyJ" → "j"
   * - Handle modifiers: ctrlKey + "d" → "ctrl+d"
   * - Special keys: " " → "space", "ArrowDown" → "arrowdown"
   * - Ignore modifier-only keys (Shift, Ctrl, Alt alone) → returns empty string
   *
   * @param event - KeyboardEvent from browser
   * @returns Normalized key string or empty string for modifier-only
   *
   * @private
   */
  private _normalizeKey(event: KeyboardEvent): string {
    let key = event.key.toLowerCase()

    // Ignore modifier-only keys
    if (['control', 'shift', 'alt', 'meta'].includes(key)) {
      return ''
    }

    // Handle special key names
    if (key === ' ') {
      key = 'space'
    } else if (key.startsWith('arrow')) {
      // ArrowDown → arrowdown (already lowercase, no transformation needed)
    } else if (key.startsWith('key')) {
      // KeyJ → j
      key = key.substring(3)
    }

    // Build modifier prefix (alphabetical order for consistency)
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')

    if (modifiers.length > 0) {
      return `${modifiers.join('+')}+${key}`
    }

    return key
  }

  /**
   * Normalize string key representation (for register/unregister).
   *
   * Converts user-provided key strings to consistent format.
   *
   * @param key - Key string like "Enter", "ctrl+d", "Space"
   * @returns Normalized key string
   *
   * @private
   */
  private _normalizeKeyString(key: string): string {
    return key.toLowerCase().trim()
  }
}
