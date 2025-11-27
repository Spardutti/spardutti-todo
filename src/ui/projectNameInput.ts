/**
 * projectNameInput.ts
 *
 * Terminal-styled inline project name input component.
 * Replaces browser prompt() with custom terminal aesthetic.
 */

interface ProjectNameInputOptions {
  placeholder?: string
  initialValue?: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

let activeInput: HTMLElement | null = null

/**
 * Shows an inline project name input prompt with terminal styling.
 *
 * Enter confirms, Escape cancels.
 * Empty names are rejected (onConfirm not called).
 *
 * @param options - Configuration for the input prompt
 *
 * @example
 * ```typescript
 * showProjectNameInput({
 *   placeholder: 'Enter project name...',
 *   onConfirm: (name) => projectStore.create(name),
 *   onCancel: () => console.log('Cancelled')
 * })
 * ```
 */
export const showProjectNameInput = (options: ProjectNameInputOptions): void => {
  const { placeholder = 'Enter project name...', initialValue = '', onConfirm, onCancel } = options

  // Prevent multiple inputs at once
  if (activeInput) {
    hideProjectNameInput()
  }

  // Create container
  const container = document.createElement('div')
  container.className = 'project-name-input-overlay'

  // Create input box
  const inputBox = document.createElement('div')
  inputBox.className = 'project-name-input-box'

  // Create label
  const label = document.createElement('div')
  label.className = 'project-name-input-label'
  label.textContent = placeholder

  // Create input field
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'project-name-input-field'
  input.value = initialValue
  input.placeholder = placeholder
  input.maxLength = 50 // Reasonable project name limit

  // Create hint text
  const hint = document.createElement('div')
  hint.className = 'project-name-input-hint'
  hint.textContent = 'Enter: Confirm | Esc: Cancel'

  // Assemble
  inputBox.appendChild(label)
  inputBox.appendChild(input)
  inputBox.appendChild(hint)
  container.appendChild(inputBox)

  // Handle Enter (confirm)
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()

      const trimmedValue = input.value.trim()

      if (!trimmedValue) {
        // Empty name - show error feedback
        input.classList.add('project-name-input-field--error')
        label.textContent = 'Name cannot be empty'
        label.classList.add('project-name-input-label--error')

        // Reset after 2 seconds
        setTimeout(() => {
          input.classList.remove('project-name-input-field--error')
          label.textContent = placeholder
          label.classList.remove('project-name-input-label--error')
        }, 2000)

        return
      }

      hideProjectNameInput()
      onConfirm(trimmedValue)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      hideProjectNameInput()
      onCancel()
      return
    }
  }

  input.addEventListener('keydown', handleKeydown)

  // Click outside to cancel
  const handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as Node
    if (!inputBox.contains(target)) {
      hideProjectNameInput()
      onCancel()
    }
  }

  // Add click listener on next tick to avoid immediate trigger
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)

  // Store cleanup function
  ;(container as any).__cleanup = (): void => {
    input.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('click', handleClickOutside)
  }

  // Attach to body
  document.body.appendChild(container)
  activeInput = container

  // Focus input field
  input.focus()
  input.select() // Select initial value if present (for rename)
}

/**
 * Hides the active project name input if present.
 */
export const hideProjectNameInput = (): void => {
  if (!activeInput) return

  // Cleanup listeners
  if ((activeInput as any).__cleanup) {
    ;(activeInput as any).__cleanup()
  }

  // Remove from DOM
  activeInput.remove()
  activeInput = null
}

/**
 * Shows a project name input for creating a new project.
 *
 * @param onConfirm - Called with the entered project name
 * @param onCancel - Called when input is cancelled
 */
export const showCreateProjectInput = (onConfirm: (name: string) => void, onCancel: () => void): void => {
  showProjectNameInput({
    placeholder: 'New project name',
    onConfirm,
    onCancel
  })
}

/**
 * Shows a project name input for renaming an existing project.
 *
 * @param currentName - The current project name (pre-filled)
 * @param onConfirm - Called with the new project name
 * @param onCancel - Called when input is cancelled
 */
export const showRenameProjectInput = (
  currentName: string,
  onConfirm: (name: string) => void,
  onCancel: () => void
): void => {
  showProjectNameInput({
    placeholder: 'Rename project',
    initialValue: currentName,
    onConfirm,
    onCancel
  })
}
