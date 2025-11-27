import type { Project } from '@/types/Project'
import type { ProjectStore } from '@/store/ProjectStore'
import type { TodoStore } from '@/store/TodoStore'
import type { SettingsStore } from '@/store/SettingsStore'
import { showCreateProjectInput, showRenameProjectInput } from './projectNameInput'

interface ProjectDropdownState {
  isOpen: boolean
  highlightedIndex: number
}

const createDropdownState = (): ProjectDropdownState => ({
  isOpen: false,
  highlightedIndex: 0
})

let dropdownState: ProjectDropdownState = createDropdownState()
let clickOutsideHandler: ((event: MouseEvent) => void) | null = null

export const renderDropdownItems = ({
  dropdownContainer,
  projects,
  activeProjectId,
  highlightedIndex,
  onProjectSelect,
  onNewProject
}: {
  dropdownContainer: HTMLElement
  projects: Project[]
  activeProjectId: string
  highlightedIndex: number
  onProjectSelect: (project: Project) => void
  onNewProject: () => void
}): void => {
  dropdownContainer.innerHTML = ''

  // Render project items
  projects.forEach((project, index) => {
    const item = document.createElement('div')
    item.className = 'project-dropdown-item'

    if (index === highlightedIndex) {
      item.classList.add('project-dropdown-item--highlighted')
    }

    if (project.id === activeProjectId) {
      item.classList.add('project-dropdown-item--active')
    }

    // Checkmark (visible only for active project)
    const checkmark = document.createElement('span')
    checkmark.className = 'project-dropdown-checkmark'
    checkmark.textContent = project.id === activeProjectId ? '✓' : ''

    // Project name
    const name = document.createElement('span')
    name.className = 'project-dropdown-name'
    name.textContent = project.name

    item.appendChild(checkmark)
    item.appendChild(name)

    // Action hints (visible only when highlighted)
    if (index === highlightedIndex) {
      const actions = document.createElement('span')
      actions.className = 'project-dropdown-actions'
      actions.textContent = 'r d'
      item.appendChild(actions)
    }

    item.dataset.projectId = project.id
    item.dataset.index = index.toString()

    // Click handler
    item.addEventListener('click', () => onProjectSelect(project))

    dropdownContainer.appendChild(item)
  })

  // Separator
  const separator = document.createElement('div')
  separator.className = 'project-dropdown-separator'
  dropdownContainer.appendChild(separator)

  // New Project item
  const newProjectItem = document.createElement('div')
  newProjectItem.className = 'project-dropdown-item project-dropdown-item--new'

  if (highlightedIndex === projects.length) {
    newProjectItem.classList.add('project-dropdown-item--highlighted')
  }

  const icon = document.createElement('span')
  icon.className = 'project-dropdown-icon'
  icon.textContent = '+'

  const newText = document.createElement('span')
  newText.className = 'project-dropdown-name'
  newText.textContent = 'New Project'

  newProjectItem.appendChild(icon)
  newProjectItem.appendChild(newText)
  newProjectItem.dataset.index = projects.length.toString()

  newProjectItem.addEventListener('click', onNewProject)

  dropdownContainer.appendChild(newProjectItem)
}

export const showProjectDropdown = ({
  anchor,
  projectStore,
  todoStore,
  settingsStore,
  onClose
}: {
  anchor: HTMLElement
  projectStore: ProjectStore
  todoStore: TodoStore
  settingsStore: SettingsStore
  onClose: () => void
}): void => {
  // Close search if open (coordination)
  const footerSearch = document.querySelector('.project-search-active')
  if (footerSearch) {
    // Search is active, don't open dropdown
    return
  }

  // Prevent reopening if already open - toggle behavior
  if (dropdownState.isOpen) {
    return
  }

  dropdownState.isOpen = true
  dropdownState.highlightedIndex = 0

  const allProjects = projectStore.getAll()
  const activeProjectId = settingsStore.getActiveProjectId()

  // Create dropdown container
  const dropdown = document.createElement('div')
  dropdown.className = 'project-dropdown'

  // Position dropdown below anchor
  const rect = anchor.getBoundingClientRect()
  dropdown.style.position = 'absolute'
  dropdown.style.left = `${rect.left}px`
  dropdown.style.top = `${rect.bottom}px`

  // Render items
  renderDropdownItems({
    dropdownContainer: dropdown,
    projects: allProjects,
    activeProjectId,
    highlightedIndex: dropdownState.highlightedIndex,
    onProjectSelect: (project: Project) => selectProject({ project, projectStore, todoStore, settingsStore, onClose }),
    onNewProject: () => createNewProject({ projectStore, todoStore, settingsStore, onClose })
  })

  // Attach to body
  document.body.appendChild(dropdown)

  // Setup click-outside detection
  setupClickOutside({ dropdown, anchor, onClose })

  // Setup keyboard navigation
  setupKeyboardNav({ dropdown, allProjects, activeProjectId, projectStore, todoStore, settingsStore, onClose })
}

const setupClickOutside = ({
  dropdown,
  anchor,
  onClose
}: {
  dropdown: HTMLElement
  anchor: HTMLElement
  onClose: () => void
}): void => {
  clickOutsideHandler = (event: MouseEvent): void => {
    const target = event.target as Node
    const isInsideDropdown = dropdown.contains(target)
    const isInsideIndicator = anchor.contains(target)

    if (!isInsideDropdown && !isInsideIndicator) {
      hideProjectDropdown()
      onClose()
    }
  }

  // Add listener on next tick to avoid immediate trigger
  setTimeout(() => {
    if (clickOutsideHandler) {
      document.addEventListener('click', clickOutsideHandler)
    }
  }, 0)
}

const setupKeyboardNav = ({
  dropdown,
  allProjects,
  activeProjectId,
  projectStore,
  todoStore,
  settingsStore,
  onClose
}: {
  dropdown: HTMLElement
  allProjects: Project[]
  activeProjectId: string
  projectStore: ProjectStore
  todoStore: TodoStore
  settingsStore: SettingsStore
  onClose: () => void
}): void => {
  const maxIndex = allProjects.length // includes "New Project" at end

  const handleKeydown = (event: KeyboardEvent): void => {
    if (!dropdownState.isOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      hideProjectDropdown()
      onClose()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()

      if (dropdownState.highlightedIndex < allProjects.length) {
        // Select project
        const selectedProject = allProjects[dropdownState.highlightedIndex]
        selectProject({ project: selectedProject, projectStore, todoStore, settingsStore, onClose })
      } else {
        // New Project
        createNewProject({ projectStore, todoStore, settingsStore, onClose })
      }
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'j') {
      event.preventDefault()
      event.stopPropagation()
      dropdownState.highlightedIndex = Math.min(dropdownState.highlightedIndex + 1, maxIndex)
      renderDropdownItems({
        dropdownContainer: dropdown,
        projects: allProjects,
        activeProjectId,
        highlightedIndex: dropdownState.highlightedIndex,
        onProjectSelect: (project: Project) => selectProject({ project, projectStore, todoStore, settingsStore, onClose }),
        onNewProject: () => createNewProject({ projectStore, todoStore, settingsStore, onClose })
      })
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'k') {
      event.preventDefault()
      event.stopPropagation()
      dropdownState.highlightedIndex = Math.max(dropdownState.highlightedIndex - 1, 0)
      renderDropdownItems({
        dropdownContainer: dropdown,
        projects: allProjects,
        activeProjectId,
        highlightedIndex: dropdownState.highlightedIndex,
        onProjectSelect: (project: Project) => selectProject({ project, projectStore, todoStore, settingsStore, onClose }),
        onNewProject: () => createNewProject({ projectStore, todoStore, settingsStore, onClose })
      })
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      dropdownState.highlightedIndex = (dropdownState.highlightedIndex + 1) % (maxIndex + 1)
      renderDropdownItems({
        dropdownContainer: dropdown,
        projects: allProjects,
        activeProjectId,
        highlightedIndex: dropdownState.highlightedIndex,
        onProjectSelect: (project: Project) => selectProject({ project, projectStore, todoStore, settingsStore, onClose }),
        onNewProject: () => createNewProject({ projectStore, todoStore, settingsStore, onClose })
      })
      return
    }

    // Rename project (r key)
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      event.stopPropagation()

      // Only allow rename on actual projects, not "New Project" item
      if (dropdownState.highlightedIndex < allProjects.length) {
        const project = allProjects[dropdownState.highlightedIndex]
        renameProject({ project, projectStore, onClose })
      }
      return
    }

    // Delete project (d key)
    if (event.key === 'd' || event.key === 'D') {
      event.preventDefault()
      event.stopPropagation()

      // Only allow delete on actual projects, not "New Project" item
      if (dropdownState.highlightedIndex < allProjects.length) {
        const project = allProjects[dropdownState.highlightedIndex]
        deleteProject({ project, projectStore, todoStore, settingsStore, onClose })
      }
      return
    }
  }

  document.addEventListener('keydown', handleKeydown)

  // Store cleanup function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-extra-semi
  ;(dropdownState as any).cleanup = () => {
    document.removeEventListener('keydown', handleKeydown)
  }
}

const selectProject = async ({
  project,
  todoStore,
  settingsStore,
  onClose
}: {
  project: Project
  todoStore: TodoStore
  settingsStore: SettingsStore
  onClose: () => void
}): Promise<void> => {
  // Switch project - await async load before closing
  await todoStore.load(project.id)
  settingsStore.setActiveProject(project.id)

  // Close dropdown
  hideProjectDropdown()
  onClose()

  // Return focus to input
  const inputField = document.querySelector('#todo-input') as HTMLInputElement
  if (inputField) {
    inputField.focus()
  }
}

const createNewProject = ({
  projectStore,
  todoStore,
  settingsStore,
  onClose
}: {
  projectStore: ProjectStore
  todoStore: TodoStore
  settingsStore: SettingsStore
  onClose: () => void
}): void => {
  // Close dropdown first
  hideProjectDropdown()
  onClose()

  // Show terminal-styled input prompt
  showCreateProjectInput(
    async (projectName: string) => {
      try {
        // Create project (validation happens in ProjectStore.create)
        const newProject = projectStore.create(projectName)

        // Switch to new project - await async load before UI focus
        await todoStore.load(newProject.id)
        settingsStore.setActiveProject(newProject.id)

        // Return focus to input
        const inputField = document.querySelector('#todo-input') as HTMLInputElement
        if (inputField) {
          inputField.focus()
        }
      } catch (error) {
        // Log error (validation failures from ProjectStore.create)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to create project:', errorMessage)

        // Return focus to input
        const inputField = document.querySelector('#todo-input') as HTMLInputElement
        if (inputField) {
          inputField.focus()
        }
      }
    },
    () => {
      // User cancelled - return focus to input
      const inputField = document.querySelector('#todo-input') as HTMLInputElement
      if (inputField) {
        inputField.focus()
      }
    }
  )
}

const renameProject = ({
  project,
  projectStore,
  onClose
}: {
  project: Project
  projectStore: ProjectStore
  onClose: () => void
}): void => {
  // Close dropdown first (but don't call onClose yet - wait for rename to complete)
  hideProjectDropdown()

  // Show rename input with current name pre-filled
  showRenameProjectInput(
    project.name,
    (newName: string) => {
      try {
        // Rename project (validation happens in ProjectStore.rename)
        projectStore.rename(project.id, newName)

        // Refresh project indicator after rename
        onClose()

        // Return focus to input
        const inputField = document.querySelector('#todo-input') as HTMLInputElement
        if (inputField) {
          inputField.focus()
        }
      } catch (error) {
        // On error, still call onClose to restore UI state
        onClose()

        // Log error (validation failures from ProjectStore.rename)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to rename project:', errorMessage)

        // Return focus to input
        const inputField = document.querySelector('#todo-input') as HTMLInputElement
        if (inputField) {
          inputField.focus()
        }
      }
    },
    () => {
      // User cancelled - call onClose to restore UI state
      onClose()

      // Return focus to input
      const inputField = document.querySelector('#todo-input') as HTMLInputElement
      if (inputField) {
        inputField.focus()
      }
    }
  )
}

const deleteProject = ({
  project,
  projectStore,
  todoStore,
  settingsStore,
  onClose
}: {
  project: Project
  projectStore: ProjectStore
  todoStore: TodoStore
  settingsStore: SettingsStore
  onClose: () => void
}): void => {
  // Close dropdown first
  hideProjectDropdown()
  onClose()

  // Get footer element for confirmation
  const footer = document.querySelector('#footer') as HTMLDivElement
  if (!footer) {
    console.error('Footer element not found')
    return
  }

  // Count todos in project
  const todoCount = todoStore.getAll().length

  // Show confirmation prompt
  const message = `Delete '${project.name}' and ${todoCount} todos inside? [Y/n]`

  const confirmDelete = async (): Promise<void> => {
    try {
      // Delete project (will throw if last project)
      projectStore.delete(project.id)

      // Find next project to switch to (first available after deletion)
      const remainingProjects = projectStore.getAll()
      if (remainingProjects.length === 0) {
        console.error('No projects remaining after deletion')
        return
      }

      const nextProject = remainingProjects[0]

      // Switch to next project
      await todoStore.load(nextProject.id)
      settingsStore.setActiveProject(nextProject.id)

      // Show feedback
      const { showFeedback } = await import('./render')
      showFeedback(footer, `Project '${project.name}' deleted`, 2000)

      // Return focus to input
      const inputField = document.querySelector('#todo-input') as HTMLInputElement
      if (inputField) {
        inputField.focus()
      }
    } catch (error) {
      // Handle errors (e.g., "Cannot delete last project")
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to delete project:', errorMessage)

      // Show error feedback
      const { showFeedback } = await import('./render')
      showFeedback(footer, `Error: ${errorMessage}`, 3000)

      // Return focus to input
      const inputField = document.querySelector('#todo-input') as HTMLInputElement
      if (inputField) {
        inputField.focus()
      }
    }
  }

  const cancelDelete = async (): Promise<void> => {
    // Restore footer hints and return focus
    const { restoreFooterHints } = await import('./render')
    restoreFooterHints(footer)

    const inputField = document.querySelector('#todo-input') as HTMLInputElement
    if (inputField) {
      inputField.focus()
    }
  }

  // Import and show confirmation
  import('./render').then(({ showConfirmation }) => {
    showConfirmation(footer, message, confirmDelete, cancelDelete)
  })
}

export const hideProjectDropdown = (): void => {
  if (!dropdownState.isOpen) return

  // Remove dropdown from DOM
  const dropdown = document.querySelector('.project-dropdown')
  if (dropdown) {
    dropdown.remove()
  }

  // Remove click-outside listener
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler)
    clickOutsideHandler = null
  }

  // Remove keyboard listener (stored in state)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((dropdownState as any).cleanup) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dropdownState as any).cleanup()
  }

  // Reset state
  dropdownState = createDropdownState()
}
