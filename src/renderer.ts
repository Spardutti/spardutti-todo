/**
 * Renderer process entry point for spardutti-todo.
 *
 * This file initializes the TodoStore and renders the application UI
 * when the DOM is ready. It serves as the main entry point for the
 * Electron renderer process.
 */

// Removed import './index.css' - using styles.css from index.html instead
import { TodoStore } from '@/store/TodoStore'
import {
  renderApp,
  renderTodoList,
  showConfirmation,
  showFeedback,
  restoreFooterHints,
  setFooterOriginalContent,
  displayError,
  initUpdateNotifications,
} from '@/ui/render'
import KeyboardManager from '@/keyboard/KeyboardManager'

// ===================================
// Navigation State Management
// ===================================

/**
 * Currently selected todo index for keyboard navigation.
 * null = no selection (initial state or cleared)
 */
let selectedTodoIndex: number | null = null

/**
 * Reference to TodoStore instance for navigation helpers
 */
let todoStore: TodoStore

/**
 * Reference to list container for scrolling
 */
let listContainer: HTMLUListElement

/**
 * Reference to input element for focus detection
 */
let inputElement: HTMLInputElement

/**
 * Tracks whether a confirmation dialog is currently showing.
 * Used by Esc handler to determine context-aware behavior.
 */
let isConfirmationShowing = false

// ===================================
// Navigation Helper Functions
// ===================================

/**
 * Selects the next todo in the list with bounds checking.
 * If no todo is selected, selects the first one.
 * If at the last todo, stays at the last todo (no wrap-around).
 *
 * Story 4.6: Auto-blurs input if focused before navigation.
 */
function selectNext(): void {
  // Smart blur: If input focused, blur it first (Story 4.6)
  if (document.activeElement === inputElement) {
    inputElement.blur()
  }

  const todos = todoStore.getAll()

  // Empty list: do nothing
  if (todos.length === 0) return

  // No selection: select first
  if (selectedTodoIndex === null) {
    selectedTodoIndex = 0
  } else {
    // Increment with bounds check
    selectedTodoIndex = Math.min(selectedTodoIndex + 1, todos.length - 1)
  }

  // Re-render with selection and scroll into view
  renderTodoList(todos, listContainer, selectedTodoIndex)
  scrollSelectedIntoView()
}

/**
 * Selects the previous todo in the list with bounds checking.
 * If at the first todo, circular navigation focuses input (Story 4.6).
 * If no selection, wraps to last todo.
 *
 * Story 4.6: Auto-blurs input if focused, implements circular navigation to input.
 */
function selectPrevious(): void {
  // Smart blur: If input focused, blur it first (Story 4.6)
  if (document.activeElement === inputElement) {
    inputElement.blur()
  }

  const todos = todoStore.getAll()

  // Empty list: do nothing
  if (todos.length === 0) return

  // Circular navigation: If at first todo (index 0), focus input (Story 4.6)
  if (selectedTodoIndex === 0) {
    selectedTodoIndex = null // Clear selection
    inputElement.focus()
    renderTodoList(todos, listContainer, selectedTodoIndex)
    return
  }

  // No selection: wrap to last todo
  if (selectedTodoIndex === null) {
    selectedTodoIndex = todos.length - 1
  } else {
    // Decrement with bounds check
    selectedTodoIndex = Math.max(selectedTodoIndex - 1, 0)
  }

  // Re-render with selection and scroll into view
  renderTodoList(todos, listContainer, selectedTodoIndex)
  scrollSelectedIntoView()
}

/**
 * Clears the current selection.
 */
function clearSelection(): void {
  selectedTodoIndex = null
}

/**
 * Scrolls the selected todo into view using instant behavior.
 * Uses scrollIntoView with instant behavior per terminal aesthetic (no smooth scroll).
 */
function scrollSelectedIntoView(): void {
  if (selectedTodoIndex === null) return

  // Find selected todo element in DOM
  const selectedElement = listContainer.querySelector('.todo-item.selected')

  if (selectedElement) {
    selectedElement.scrollIntoView({ behavior: 'instant', block: 'nearest' })
  }
}

// ===================================
// Context Detection Helper
// ===================================

/**
 * Checks if the input field has focus.
 * Used by Space/Enter handlers to determine context-aware behavior.
 * @returns true if input is focused, false otherwise
 */
function isInputFocused(): boolean {
  return document.activeElement === inputElement
}

// ===================================
// Toggle Action Helper
// ===================================

/**
 * Toggles the completion status of the currently selected todo.
 * Preserves selection after toggle for bulk toggling workflow.
 * No-op if no todo is selected (selectedTodoIndex is null).
 */
function toggleSelectedTodo(): void {
  // No selection: do nothing (graceful no-op)
  if (selectedTodoIndex === null) return

  const todos = todoStore.getAll()

  // Bounds check: ensure index is valid
  if (selectedTodoIndex >= todos.length) return

  const selectedTodo = todos[selectedTodoIndex]

  // Toggle completion status
  todoStore.toggle(selectedTodo.id)

  // Re-render with preserved selection
  renderTodoList(todos, listContainer, selectedTodoIndex)
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp().catch(error => {
      console.error('Fatal error during app initialization:', error)
      document.body.innerHTML = `<div style="color: red; padding: 20px;">
        <h1>Error</h1>
        <p>${error.message || 'Unknown error'}</p>
        <p>Check the console for more details.</p>
      </div>`
    })
  })
} else {
  // DOM is already ready (Vite module load)
  initApp().catch(error => {
    console.error('Fatal error during app initialization:', error)
    document.body.innerHTML = `<div style="color: red; padding: 20px;">
      <h1>Error</h1>
      <p>${error.message || 'Unknown error'}</p>
      <p>Check the console for more details.</p>
    </div>`
  })
}

/**
 * Initialize the application.
 *
 * Creates TodoStore instance, loads todos from disk, and renders the UI.
 */
async function initApp(): Promise<void> {
  // Check if electron API is available
  if (!window.electron) {
    throw new Error('window.electron is not defined. Preload script may not have loaded.')
  }

  console.log('Initializing app...')

  // Get todos file path from main process
  const filePath = await window.electron.getTodosPath()
  console.log('File path:', filePath)

  // Create TodoStore instance with file path (module-scoped for navigation helpers)
  todoStore = new TodoStore(filePath)

  // Get root container
  const appContainer = document.querySelector('#app')

  // Defensive check
  if (!appContainer) {
    console.error('Error: #app container not found in DOM')
    return
  }

  // Render the application first to create error display element
  const { input, listContainer: list, footer, deleteButton } = renderApp(
    todoStore,
    appContainer as HTMLElement,
  )

  // Store element references (module-scoped for helper functions)
  listContainer = list
  inputElement = input

  // Initialize navigation state
  selectedTodoIndex = null

  // Load todos from disk after rendering
  try {
    await todoStore.load()
    // Re-render with loaded todos
    renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)
  } catch (error) {
    // Corrupt file error - log and display error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to load todos', errorMessage, filePath)

    // Display inline error message to user
    displayError('Data file corrupted. Starting fresh.')

    // Continue with empty list (already initialized in TodoStore)
  }

  // ===================================
  // KeyboardManager Setup
  // ===================================

  const keyboardManager = new KeyboardManager()

  // Register navigation shortcuts (Story 4.2, updated Story 4.6 AC #5)
  keyboardManager.register('arrowdown', () => selectNext(), 'Next')
  keyboardManager.register('arrowup', () => selectPrevious(), 'Prev')

  // Register toggle shortcuts with context awareness (Story 4.3)
  keyboardManager.register('space', () => {
    // Context check: If input focused, allow default (type space)
    if (isInputFocused()) return false

    // Otherwise, toggle selected todo
    toggleSelectedTodo()
    return true // Prevent default
  }, 'Toggle todo')

  // Enter key is only for creating todos (handled by input listener)
  // No global Enter shortcut needed - removed toggle functionality per Story 4.6

  // ===================================
  // App Control Shortcuts (Story 4.4)
  // ===================================

  // Focus input shortcuts
  keyboardManager.register('ctrl+n', () => {
    inputElement.focus()
    return true
  }, 'Focus input')

  // Home shortcut removed per Story 4.6 AC #5 (redundant with Ctrl+N)

  // Quit app shortcut
  keyboardManager.register('ctrl+q', () => {
    window.close()
    return true
  }, 'Quit app')

  // Bulk delete shortcut with confirmation
  keyboardManager.register('ctrl+d', () => {
    // Get completed count
    const completedCount = todoStore.getCompleted().length

    // If no completed todos, show message and return
    if (completedCount === 0) {
      showFeedback(footer, 'No completed todos', 2000)
      return true
    }

    // Show confirmation prompt and track state
    isConfirmationShowing = true
    showConfirmation(
      footer,
      `Delete ${completedCount} completed todo${completedCount === 1 ? '' : 's'}? [Y/n]`,
      () => {
        // Confirm callback: delete completed todos
        const deletedCount = todoStore.deleteCompleted()

        // Clear selection after bulk delete to avoid invalid index
        clearSelection()

        renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)
        showFeedback(footer, `${deletedCount} todo${deletedCount === 1 ? '' : 's'} deleted`, 2000)

        // Clear confirmation state
        isConfirmationShowing = false
      },
      () => {
        // Cancel callback: just restore hints
        restoreFooterHints(footer)

        // Clear confirmation state
        isConfirmationShowing = false
      },
    )

    return true
  }, 'Delete completed')

  // Simplified Esc shortcut (Story 4.6 AC #5)
  // Esc ONLY cancels confirmations - no input blur, no window close
  // Use Ctrl+Q to quit the app explicitly (safer UX)
  keyboardManager.register('escape', () => {
    // Only priority: Cancel confirmation if showing
    if (isConfirmationShowing) {
      // Cancel confirmation - state will be cleared by cancel callback
      return false // Allow showConfirmation's Esc handler to run
    }

    // No other actions (no input blur, no window close)
    return true // Event handled (do nothing)
  }, 'Cancel')

  // ===================================
  // Story 6.3: Manual Update Check Shortcut
  // ===================================
  // Ctrl+U triggers manual update check (works in all contexts)
  keyboardManager.register('ctrl+u', () => {
    if (window.updater && window.updater.checkForUpdates) {
      window.updater.checkForUpdates()
    }
    return true
  }, 'Check updates')

  // ===================================
  // Story 4.5: Initialize Footer Hints
  // ===================================
  // After all shortcuts are registered, get formatted hints string
  // and initialize footer with dynamic content from KeyboardManager
  const dynamicHints = keyboardManager.getHints()
  setFooterOriginalContent(dynamicHints)

  // Update footer display with dynamic hints
  const hintsElement = footer.querySelector('.footer-hints')
  if (hintsElement) {
    hintsElement.textContent = dynamicHints
  }

  // ===================================
  // Story 6.2: Initialize Update Notifications
  // ===================================
  // Initialize update notification system to listen for IPC messages from main process
  // This must be called after DOM is ready (footer exists) but before user interaction
  initUpdateNotifications()

  // Global keyboard event handler
  window.addEventListener('keydown', (event) => {
    keyboardManager.handle(event)
  })

  // Add Enter key event listener for todo creation
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()

      // Get and validate input text
      const text = input.value.trim()
      if (!text) return

      // Create new todo
      todoStore.add(text)

      // Re-render todo list with current selection
      renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)

      // Clear input and maintain focus
      input.value = ''
      input.focus()

      // Auto-scroll to bottom
      listContainer.scrollTop = listContainer.scrollHeight
    }
  })

  // Add click event listener for todo toggle (event delegation)
  listContainer.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const listItem = target.closest('[data-id]') as HTMLLIElement

    // Guard: ignore clicks outside todo items
    if (!listItem) return

    // Extract todo id from data attribute
    const id = listItem.dataset.id
    if (!id) return // Defensive check

    // Toggle and re-render
    todoStore.toggle(id)
    renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)
  })

  // Add click event listener for delete completed button
  deleteButton.addEventListener('click', () => {
    // Get completed count
    const completedCount = todoStore.getCompleted().length

    // If no completed todos, show message and return early
    if (completedCount === 0) {
      showFeedback(footer, 'No completed todos', 2000)
      return
    }

    // Show confirmation prompt and track state
    isConfirmationShowing = true
    showConfirmation(
      footer,
      `Delete ${completedCount} completed todo${completedCount === 1 ? '' : 's'}? [Y/n]`,
      () => {
        // Confirm callback: delete completed todos
        const deletedCount = todoStore.deleteCompleted()

        // Clear selection after bulk delete to avoid invalid index
        clearSelection()

        renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)
        showFeedback(footer, `${deletedCount} todo${deletedCount === 1 ? '' : 's'} deleted`, 2000)

        // Clear confirmation state
        isConfirmationShowing = false
      },
      () => {
        // Cancel callback: just restore hints
        restoreFooterHints(footer)

        // Clear confirmation state
        isConfirmationShowing = false
      },
    )
  })

  console.log('✅ spardutti-todo initialized')
}
