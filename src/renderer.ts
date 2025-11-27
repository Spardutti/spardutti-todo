/**
 * Renderer process entry point for spardutti-todo.
 *
 * This file initializes the stores (Settings, Projects, Todos) and renders
 * the application UI when the DOM is ready. It serves as the main entry point
 * for the Electron renderer process.
 *
 * Story 7.11: Project-aware startup sequence:
 * 1. Migration check (v1→v2)
 * 2. SettingsStore load
 * 3. ProjectStore load
 * 4. ActiveProjectId validation
 * 5. TodoStore load for active project
 * 6. UI render with project indicator
 */

// Removed import './index.css' - using styles.css from index.html instead
import { TodoStore } from '@/store/TodoStore'
import { ProjectStore } from '@/store/ProjectStore'
import { SettingsStore } from '@/store/SettingsStore'
import type { Project } from '@/types/Project'
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
import { renderProjectIndicator } from '@/ui/projectIndicator'
import { showProjectDropdown, hideProjectDropdown } from '@/ui/projectDropdown'
import { activateProjectSearch } from '@/ui/projectSearch'
import { showCreateProjectInput } from '@/ui/projectNameInput'
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
 * Reference to ProjectStore instance for project operations
 */
let projectStore: ProjectStore

/**
 * Reference to SettingsStore instance for settings operations
 */
let settingsStore: SettingsStore

/**
 * Reference to currently active project
 */
let activeProject: Project | null = null

/**
 * Reference to list container for scrolling
 */
let listContainer: HTMLUListElement

/**
 * Reference to input element for focus detection
 */
let inputElement: HTMLInputElement

/**
 * Reference to footer element for project search
 */
let footerElement: HTMLDivElement

/**
 * Reference to project indicator container
 */
let projectIndicatorContainer: HTMLElement | null = null

/**
 * Tracks whether a confirmation dialog is currently showing.
 * Used by Esc handler to determine context-aware behavior.
 */
let isConfirmationShowing = false

/**
 * Tracks whether project search is currently active.
 * Used to coordinate with dropdown and keyboard handling.
 */
let isProjectSearchActive = false

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

// ===================================
// Project UI Helper Functions
// ===================================

/**
 * Handles click on project indicator to show dropdown.
 * Coordinates with project search to prevent conflicts.
 */
function handleProjectDropdownClick(): void {
  if (!projectIndicatorContainer || !projectStore || !todoStore || !settingsStore) return
  if (isProjectSearchActive) return // Don't open dropdown while search is active

  showProjectDropdown({
    anchor: projectIndicatorContainer,
    projectStore,
    todoStore,
    settingsStore,
    onClose: handleProjectUIClose
  })
}

/**
 * Handles closure of any project UI (dropdown or search).
 * Updates project indicator with new active project if changed.
 */
function handleProjectUIClose(): void {
  isProjectSearchActive = false

  // Refresh active project and re-render indicator
  const newActiveProjectId = settingsStore.getActiveProjectId()
  activeProject = projectStore.findById(newActiveProjectId) || null

  if (activeProject && projectIndicatorContainer) {
    renderProjectIndicator({
      project: activeProject,
      container: projectIndicatorContainer,
      onDropdownClick: handleProjectDropdownClick
    })
  }

  // Re-render todo list (in case project switched)
  selectedTodoIndex = null
  renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)

  // Restore footer hints
  restoreFooterHints(footerElement)

  // Focus input
  inputElement.focus()
}

/**
 * Opens project search in footer.
 * Called by Ctrl+P keyboard shortcut.
 */
function openProjectSearch(): void {
  if (!footerElement || !projectStore || !todoStore || !settingsStore) return
  if (isProjectSearchActive) return // Already active

  // Hide dropdown if open
  hideProjectDropdown()

  isProjectSearchActive = true

  activateProjectSearch({
    footerContainer: footerElement,
    projectStore,
    todoStore,
    settingsStore,
    onComplete: handleProjectUIClose
  })
}

/**
 * Creates a new project via inline input prompt.
 * Called by Ctrl+Shift+N keyboard shortcut.
 */
function createNewProject(): void {
  if (!projectStore || !todoStore || !settingsStore) return

  showCreateProjectInput(
    async (name: string) => {
      const newProject = projectStore.create(name)
      settingsStore.setActiveProject(newProject.id)
      await todoStore.load(newProject.id)

      // Update UI
      activeProject = newProject
      selectedTodoIndex = null
      if (projectIndicatorContainer) {
        renderProjectIndicator({
          project: activeProject,
          container: projectIndicatorContainer,
          onDropdownClick: handleProjectDropdownClick
        })
      }
      renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)
      inputElement.focus()
    },
    () => {
      inputElement.focus()
    }
  )
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
 * Story 7.11: Project-aware startup sequence:
 * 1. Migration check (v1→v2)
 * 2. SettingsStore load
 * 3. ProjectStore load
 * 4. ActiveProjectId validation
 * 5. TodoStore load for active project
 * 6. UI render with project indicator
 */
async function initApp(): Promise<void> {
  // Capture startup time for performance measurement
  const startTime = Date.now()

  // Check if electron API is available
  if (!window.electron) {
    throw new Error('window.electron is not defined. Preload script may not have loaded.')
  }

  console.log('Initializing app...')

  // ===================================
  // Step 1: Migration Check (v1→v2)
  // ===================================
  try {
    const needsMigration = await window.electron.checkMigrationNeeded()
    console.log('Migration check complete', { elapsed: Date.now() - startTime, needsMigration })

    if (needsMigration) {
      console.log('Starting v1→v2 migration...')
      const result = await window.electron.runMigration()
      if (!result.success) {
        console.error('Migration failed', result.error)
        displayError('Data migration failed. Check logs.')
      } else {
        console.log('Migration successful', { projectId: result.projectId })
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Migration check error', errorMessage)
    // Continue - fresh install will create defaults
  }

  // ===================================
  // Step 2: Load Settings
  // ===================================
  const settingsPath = await window.electron.getSettingsPath()
  settingsStore = new SettingsStore(settingsPath)
  await settingsStore.load()
  console.log('Settings loaded', { elapsed: Date.now() - startTime })

  // ===================================
  // Step 3: Load Projects
  // ===================================
  const projectsPath = await window.electron.getProjectsPath()
  projectStore = new ProjectStore(projectsPath)
  await projectStore.load()
  console.log('Projects loaded', { elapsed: Date.now() - startTime, count: projectStore.getAll().length })

  // ===================================
  // Step 4: Validate activeProjectId / Fresh Install
  // ===================================
  let activeProjectId = settingsStore.getActiveProjectId()
  const allProjects = projectStore.getAll()

  // Fresh install: No projects exist yet
  if (allProjects.length === 0) {
    console.log('Fresh install detected, creating Default project')
    const defaultProject = projectStore.create('Default')
    activeProjectId = defaultProject.id
    settingsStore.setActiveProject(activeProjectId)
    console.log('Default project created', { id: activeProjectId })
  } else if (!activeProjectId || !projectStore.findById(activeProjectId)) {
    // ActiveProjectId missing or references non-existent project
    console.warn('Active project not found, falling back', { activeProjectId })
    const fallbackProject = projectStore.getAll()[0]
    activeProjectId = fallbackProject.id
    settingsStore.setActiveProject(activeProjectId)
    console.log('Fallback project selected', { id: activeProjectId, name: fallbackProject.name })
  }

  // Store reference to active project
  activeProject = projectStore.findById(activeProjectId) || null

  // ===================================
  // Step 5: Load Todos for Active Project
  // ===================================
  todoStore = new TodoStore()
  try {
    await todoStore.load(activeProjectId)
    console.log('Todos loaded', { elapsed: Date.now() - startTime, count: todoStore.getAll().length })
  } catch (error) {
    // Corrupt file error - log and display error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to load todos', errorMessage, activeProjectId)
    displayError('Data file corrupted. Starting fresh.')
    // Continue with empty list (already initialized in TodoStore)
  }

  // ===================================
  // Step 6: Render UI with Project Indicator
  // ===================================
  // Get root container
  const appContainer = document.querySelector('#app')

  // Defensive check
  if (!appContainer) {
    console.error('Error: #app container not found in DOM')
    return
  }

  // Render the application first to create error display element
  const { input, listContainer: list, footer } = renderApp(
    todoStore,
    appContainer as HTMLElement,
  )

  // Store element references (module-scoped for helper functions)
  listContainer = list
  inputElement = input
  footerElement = footer

  // Initialize navigation state
  selectedTodoIndex = null

  // Create project indicator container
  projectIndicatorContainer = document.createElement('div')
  projectIndicatorContainer.id = 'project-indicator-container'

  // Insert project indicator before the input element
  appContainer.insertBefore(projectIndicatorContainer, input)

  // Render project indicator
  if (activeProject) {
    renderProjectIndicator({
      project: activeProject,
      container: projectIndicatorContainer,
      onDropdownClick: handleProjectDropdownClick
    })
  }

  // Re-render todo list with loaded todos
  renderTodoList(todoStore.getAll(), listContainer, selectedTodoIndex)

  // Log startup time
  const totalStartupTime = Date.now() - startTime
  console.log('Startup complete', { totalTime: totalStartupTime })

  // Warn if startup exceeds 2-second target
  if (totalStartupTime > 2000) {
    console.warn('Startup time exceeds 2s target', { totalTime: totalStartupTime })
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

  // ===================================
  // Story 7.8: Project Search Shortcut
  // ===================================
  // Ctrl+P opens project search in footer
  keyboardManager.register('ctrl+p', () => {
    // Don't open if confirmation is showing
    if (isConfirmationShowing) return true

    openProjectSearch()
    return true
  }, 'Projects')

  // ===================================
  // Story 7.11: New Project Shortcut
  // ===================================
  // Ctrl+Shift+N creates a new project
  keyboardManager.register('ctrl+shift+n', () => {
    // Don't open if confirmation or search is active
    if (isConfirmationShowing || isProjectSearchActive) return true

    createNewProject()
    return true
  }, 'New project')

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

  // ===================================
  // Story 8.1: Window Bounds Persistence
  // ===================================
  // Listen for bounds-changed events from main process (debounced 500ms)
  // and save to SettingsStore for persistence
  window.electron.onBoundsChanged((bounds) => {
    console.log('Window bounds changed, saving to settings', bounds)
    settingsStore.setWindowBounds(bounds)
  })

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

      // Auto-scroll to top (FR42: new todos appear at top)
      listContainer.scrollTop = 0
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

  // Add click event listener for delete completed button (using event delegation for footer recreation)
  footer.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.id !== 'delete-completed-btn') return

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
