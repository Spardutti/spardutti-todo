import type { Todo } from '@/types/Todo'
import type { TodoStore } from '@/store/TodoStore'

/**
 * Renders the input field for creating new todos.
 *
 * Creates an input element with autofocus, placeholder text, and accessibility attributes.
 * The input field is ready to receive text immediately on app launch (FR19).
 *
 * @returns HTMLInputElement reference for event handler attachment
 *
 * @example
 * ```typescript
 * const input = renderInput()
 * input.addEventListener('keydown', handleEnter)
 * ```
 */
export function renderInput(): HTMLInputElement {
  const input = document.createElement('input')
  input.id = 'todo-input'
  input.type = 'text'
  input.placeholder = 'Type todo and press Enter...'
  input.autofocus = true
  input.setAttribute('aria-label', 'New todo')

  return input
}

/**
 * Renders a single todo item as a list element.
 *
 * Creates a list item with unicode checkbox (☐/☑), todo text, and accessibility attributes.
 * Uses direct DOM manipulation per ADR-005 (no UI framework).
 *
 * @param todo - The todo object to render
 * @param isSelected - Whether this todo is currently selected (for navigation)
 * @returns HTMLLIElement with checkbox, text, and accessibility attributes
 *
 * @example
 * ```typescript
 * const todoItem = renderTodoItem(todo, true)
 * listElement.appendChild(todoItem)
 * ```
 */
export function renderTodoItem(todo: Todo, isSelected = false): HTMLLIElement {
  const li = document.createElement('li')
  li.className = isSelected ? 'todo-item selected' : 'todo-item'
  li.setAttribute('role', 'listitem')
  li.setAttribute('aria-label', `Todo: ${todo.text}`)
  li.setAttribute('aria-checked', String(todo.completed))
  li.setAttribute('data-id', todo.id)
  li.setAttribute('data-completed', String(todo.completed))

  // Checkbox span with unicode symbol
  const checkbox = document.createElement('span')
  checkbox.className = 'checkbox'
  checkbox.textContent = todo.completed ? '☑' : '☐'
  checkbox.setAttribute('aria-hidden', 'true') // Decorative only

  // Text span
  const text = document.createElement('span')
  text.className = 'todo-text'
  text.textContent = todo.text

  // Assemble
  li.appendChild(checkbox)
  li.appendChild(text)

  return li
}

/**
 * Renders the complete todo list using DocumentFragment for performance.
 *
 * Clears the container and renders all todos in a single DOM operation (batch update).
 * Uses DocumentFragment to minimize reflows per architecture Performance Discipline.
 *
 * @param todos - Array of todos to render
 * @param container - The UL element to render todos into
 * @param selectedIndex - Index of the currently selected todo (optional)
 *
 * @example
 * ```typescript
 * const todos = store.getAll()
 * renderTodoList(todos, listContainer, 2) // Third todo selected
 * ```
 */
export function renderTodoList(todos: Todo[], container: HTMLElement, selectedIndex?: number | null): void {
  // Clear container
  container.innerHTML = ''

  // Set accessibility attributes
  container.setAttribute('role', 'list')
  container.setAttribute('aria-label', 'Todo list')

  // Create DocumentFragment for batch updates
  const fragment = document.createDocumentFragment()

  // Add all items to fragment
  todos.forEach((todo, index) => {
    const isSelected = selectedIndex !== null && selectedIndex !== undefined && index === selectedIndex
    const item = renderTodoItem(todo, isSelected)
    fragment.appendChild(item)
  })

  // Single DOM reflow
  container.appendChild(fragment)
}

/**
 * Renders the complete application UI.
 *
 * Creates the main app structure: input field at top, todo list container below,
 * footer hints at bottom, and temporary delete button. This is the main initialization
 * function called from main.ts.
 *
 * @param store - The TodoStore instance for retrieving todos
 * @param container - The root DOM element to render into (#app)
 * @returns Object with references to input, listContainer, footer, and deleteButton for event handler setup
 *
 * @example
 * ```typescript
 * const store = new TodoStore()
 * const app = document.querySelector('#app')
 * const { input, listContainer, footer, deleteButton } = renderApp(store, app)
 * // Use input and listContainer for event handlers
 * ```
 */
export function renderApp(
  store: TodoStore,
  container: HTMLElement,
): {
  input: HTMLInputElement
  listContainer: HTMLUListElement
  footer: HTMLDivElement
  deleteButton: HTMLButtonElement
} {
  // Clear container
  container.innerHTML = ''

  // Create input element
  const input = renderInput()

  // Create todo list container
  const ul = document.createElement('ul')
  ul.id = 'todo-list'

  // Create footer with keyboard hints
  const footer = document.createElement('div')
  footer.id = 'footer'

  // Create hints text element
  const hintsText = document.createElement('div')
  hintsText.className = 'footer-hints'
  hintsText.textContent = 'Enter: Save | Space: Toggle | Esc: Close'
  footer.appendChild(hintsText)

  // Create temporary delete button (will be replaced by Ctrl+D in Epic 4)
  const deleteButton = document.createElement('button')
  deleteButton.id = 'delete-completed-btn'
  deleteButton.textContent = 'Delete Completed'
  deleteButton.setAttribute('aria-label', 'Delete all completed todos')
  footer.appendChild(deleteButton)

  footer.setAttribute('role', 'status')
  footer.setAttribute('aria-live', 'polite')

  // Append all elements to container
  container.appendChild(input)
  container.appendChild(ul)
  container.appendChild(footer)

  // Initial render of todos
  renderTodoList(store.getAll(), ul)

  // Explicitly focus the input (backup for autofocus attribute)
  input.focus()

  // Return element references for event handler setup
  return {
    input,
    listContainer: ul,
    footer,
    deleteButton,
  }
}

// Footer state management
let footerOriginalContent = 'Enter: Save | Space: Toggle | Esc: Close' // Default fallback
let feedbackTimeout: number | null = null

// Error display state management
let errorTimeout: number | null = null
let errorElement: HTMLDivElement | null = null

/**
 * Sets the original footer content to be restored after feedback/confirmation.
 * Should be called after KeyboardManager shortcuts are registered.
 *
 * @param content - The hints string from KeyboardManager.getHints()
 *
 * @example
 * ```typescript
 * const hints = keyboardManager.getHints()
 * setFooterOriginalContent(hints)
 * ```
 */
export function setFooterOriginalContent(content: string): void {
  footerOriginalContent = content
}

/**
 * Gets the footer hints text element
 * @param footer - The footer DOM element
 * @returns The hints text element or null if not found
 */
function getFooterHintsElement(footer: HTMLDivElement): HTMLElement | null {
  return footer.querySelector('.footer-hints')
}

/**
 * Shows a confirmation prompt in the footer with keyboard handlers.
 *
 * Replaces footer content with confirmation message and listens for Y/N/Enter/Esc keys.
 * Executes onConfirm callback if user presses Y or Enter.
 * Executes onCancel callback if user presses N or Esc.
 * Cleans up keyboard listener after user responds.
 *
 * @param footer - The footer DOM element to display confirmation in
 * @param message - The confirmation message to display
 * @param onConfirm - Callback to execute if user confirms (Y/Enter)
 * @param onCancel - Callback to execute if user cancels (N/Esc)
 *
 * @example
 * ```typescript
 * showConfirmation(
 *   footer,
 *   'Delete 3 completed todos? [Y/n]',
 *   () => { console.log('confirmed') },
 *   () => { console.log('cancelled') }
 * )
 * ```
 */
export function showConfirmation(
  footer: HTMLDivElement,
  message: string,
  onConfirm: () => void,
  onCancel: () => void,
): void {
  const hintsElement = getFooterHintsElement(footer)
  if (!hintsElement) return

  // Store original footer content if not already stored
  if (!footerOriginalContent) {
    footerOriginalContent = hintsElement.textContent || ''
  }

  // Display confirmation message
  hintsElement.textContent = message

  // Keyboard handler for confirmation
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
      window.removeEventListener('keydown', handleKey)
    } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      window.removeEventListener('keydown', handleKey)
    }
  }

  // Add keyboard listener
  window.addEventListener('keydown', handleKey)
}

/**
 * Shows a feedback message in the footer with auto-hide.
 *
 * Displays a temporary message in the footer area and automatically restores
 * the original footer content after the specified duration.
 * Clears any previous feedback timeout to prevent overlapping messages.
 *
 * @param footer - The footer DOM element to display message in
 * @param message - The feedback message to display
 * @param duration - Duration in milliseconds before auto-hide (default: 2000ms)
 *
 * @example
 * ```typescript
 * showFeedback(footer, '3 todos deleted', 2000)
 * ```
 */
export function showFeedback(
  footer: HTMLDivElement,
  message: string,
  duration = 2000,
): void {
  const hintsElement = getFooterHintsElement(footer)
  if (!hintsElement) return

  // Clear previous timeout if exists
  if (feedbackTimeout !== null) {
    clearTimeout(feedbackTimeout)
  }

  // Display feedback message
  hintsElement.textContent = message

  // Auto-hide after duration
  feedbackTimeout = window.setTimeout(() => {
    restoreFooterHints(footer)
    feedbackTimeout = null
  }, duration)
}

/**
 * Restores the original footer hints content.
 *
 * Returns the footer to its default state showing keyboard hints.
 * Used after confirmation prompts or feedback messages.
 *
 * @param footer - The footer DOM element to restore
 *
 * @example
 * ```typescript
 * restoreFooterHints(footer)
 * ```
 */
export function restoreFooterHints(footer: HTMLDivElement): void {
  const hintsElement = getFooterHintsElement(footer)
  if (!hintsElement) return
  hintsElement.textContent = footerOriginalContent
}

/**
 * Displays an inline error message below the input field.
 *
 * Creates or updates a red error message element below the input field.
 * Auto-hides after the specified duration. Multiple calls replace the previous
 * error message and reset the auto-hide timer.
 *
 * @param message - The error message to display
 * @param duration - Duration in milliseconds before auto-hide (default: 5000ms)
 *
 * @example
 * ```typescript
 * displayError('Failed to save. Try again.', 5000)
 * ```
 */
export function displayError(message: string, duration = 5000): void {
  // Clear previous timeout if exists
  if (errorTimeout !== null) {
    clearTimeout(errorTimeout)
    errorTimeout = null
  }

  // Get or create error element
  if (!errorElement) {
    errorElement = document.createElement('div')
    errorElement.className = 'error-message'
    errorElement.setAttribute('role', 'alert')
    errorElement.setAttribute('aria-live', 'assertive')

    // Insert after input field
    const input = document.getElementById('todo-input')
    if (input && input.parentNode) {
      input.parentNode.insertBefore(errorElement, input.nextSibling)
    }
  }

  // Set error message
  errorElement.textContent = message
  errorElement.style.display = 'block'

  // Auto-hide after duration
  errorTimeout = window.setTimeout(() => {
    hideError()
  }, duration)
}

/**
 * Hides the error message element.
 *
 * Removes the error message from display and clears any pending auto-hide timer.
 * Safe to call even if no error is currently displayed.
 *
 * @example
 * ```typescript
 * hideError()
 * ```
 */
export function hideError(): void {
  if (errorElement) {
    errorElement.style.display = 'none'
    errorElement.textContent = ''
  }

  if (errorTimeout !== null) {
    clearTimeout(errorTimeout)
    errorTimeout = null
  }
}

/**
 * Initializes update notification system by listening to IPC messages from main process.
 *
 * Registers a callback with the updater API to receive update status changes.
 * Updates the footer to show update notifications based on the status received.
 *
 * Update notification states:
 * - 'available': Shows "Update available. Downloading..." (persistent while downloading)
 * - 'downloaded': Shows "Update available. Restart to install." (persistent until app close)
 * - 'not-available': No change to footer (keep keyboard hints)
 * - 'error': No change for automatic checks (silent, logged only)
 *
 * @example
 * ```typescript
 * // Called during app initialization in renderer.ts
 * initUpdateNotifications()
 * ```
 */
export function initUpdateNotifications(): void {
  // Get footer element
  const footer = document.getElementById('footer') as HTMLDivElement
  if (!footer) {
    console.warn('Footer element not found, update notifications will not be displayed')
    return
  }

  // Check if updater API is available
  if (!window.updater) {
    console.warn('window.updater is not defined. Update notifications will not work.')
    return
  }

  // Register callback for update status changes
  window.updater.onUpdateStatus((status) => {
    const hintsElement = getFooterHintsElement(footer)
    if (!hintsElement) return

    // Handle different update statuses
    switch (status.status) {
      case 'available':
        // Show "Downloading..." message (persistent while downloading)
        hintsElement.textContent = status.message
        hintsElement.style.color = '#00FF00' // Bright green per terminal aesthetic
        break

      case 'downloaded':
        // Show "Restart to install" message (persistent until app close)
        hintsElement.textContent = status.message
        hintsElement.style.color = '#00FF00' // Bright green per terminal aesthetic
        break

      case 'not-available':
        // Silent for automatic checks - no footer change
        // Keep existing keyboard hints
        break

      case 'error':
        // Silent for automatic checks - no footer change
        // Manual checks in Story 6.3 will handle error display
        break

      default:
        console.warn('Unknown update status:', status.status)
    }
  })
}
