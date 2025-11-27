/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderDropdownItems, showProjectDropdown, hideProjectDropdown } from './projectDropdown'
import type { Project } from '@/types/Project'
import { ProjectStore } from '@/store/ProjectStore'
import { TodoStore } from '@/store/TodoStore'
import { SettingsStore } from '@/store/SettingsStore'

describe('projectDropdown', () => {
  let container: HTMLElement
  let mockProjects: Project[]
  let mockProjectStore: ProjectStore
  let mockTodoStore: TodoStore
  let mockSettingsStore: SettingsStore

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)

    // Force close any open dropdown from previous tests
    hideProjectDropdown()

    // Create mock projects
    mockProjects = [
      { id: '1', name: 'SequenceStack', createdAt: '2025-11-20T10:00:00Z' },
      { id: '2', name: 'HomefrontGroup', createdAt: '2025-11-21T09:30:00Z' },
      { id: '3', name: 'Default', createdAt: '2025-11-22T14:15:00Z' }
    ]

    // Create mock stores
    mockProjectStore = {
      getAll: vi.fn(() => mockProjects),
      create: vi.fn((name: string) => ({
        id: 'new-id',
        name,
        createdAt: new Date().toISOString()
      }))
    } as any

    mockTodoStore = {
      load: vi.fn().mockResolvedValue(undefined)
    } as any

    mockSettingsStore = {
      getActiveProjectId: vi.fn(() => '1'),
      setActiveProject: vi.fn()
    } as any
  })

  describe('renderDropdownItems', () => {
    it('should render all projects as dropdown items', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      // 3 projects + 1 "New Project" = 4 items
      expect(items.length).toBe(4)
    })

    it('should display project names correctly', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const names = Array.from(container.querySelectorAll('.project-dropdown-name'))
        .map(el => el.textContent)

      expect(names).toContain('SequenceStack')
      expect(names).toContain('HomefrontGroup')
      expect(names).toContain('Default')
      expect(names).toContain('New Project')
    })

    it('should show checkmark for active project only', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      const firstItem = items[0]
      const secondItem = items[1]

      const firstCheckmark = firstItem.querySelector('.project-dropdown-checkmark')
      const secondCheckmark = secondItem.querySelector('.project-dropdown-checkmark')

      expect(firstCheckmark?.textContent).toBe('✓')
      expect(secondCheckmark?.textContent).toBe('')
    })

    it('should add active class to active project item', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      expect(items[0].classList.contains('project-dropdown-item--active')).toBe(true)
      expect(items[1].classList.contains('project-dropdown-item--active')).toBe(false)
    })

    it('should add highlighted class to highlighted item', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 1,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      expect(items[0].classList.contains('project-dropdown-item--highlighted')).toBe(false)
      expect(items[1].classList.contains('project-dropdown-item--highlighted')).toBe(true)
    })

    it('should render separator before "New Project"', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const separator = container.querySelector('.project-dropdown-separator')
      expect(separator).toBeTruthy()
    })

    it('should render "New Project" item with + icon', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const newProjectItem = container.querySelector('.project-dropdown-item--new')
      expect(newProjectItem).toBeTruthy()

      const icon = newProjectItem?.querySelector('.project-dropdown-icon')
      expect(icon?.textContent).toBe('+')

      const name = newProjectItem?.querySelector('.project-dropdown-name')
      expect(name?.textContent).toBe('New Project')
    })

    it('should call onProjectSelect when project item is clicked', () => {
      const onProjectSelect = vi.fn()

      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect,
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      const secondItem = items[1] as HTMLElement
      secondItem.click()

      expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[1])
    })

    it('should call onNewProject when "New Project" is clicked', () => {
      const onNewProject = vi.fn()

      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject
      })

      const newProjectItem = container.querySelector('.project-dropdown-item--new') as HTMLElement
      newProjectItem.click()

      expect(onNewProject).toHaveBeenCalled()
    })

    it('should highlight "New Project" when index equals project count', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 3, // mockProjects.length = 3
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const newProjectItem = container.querySelector('.project-dropdown-item--new')
      expect(newProjectItem?.classList.contains('project-dropdown-item--highlighted')).toBe(true)
    })

    it('should store project ID in data attribute', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      const firstItem = items[0] as HTMLElement
      expect(firstItem.dataset.projectId).toBe('1')
    })

    it('should store index in data attribute', () => {
      renderDropdownItems({
        dropdownContainer: container,
        projects: mockProjects,
        activeProjectId: '1',
        highlightedIndex: 0,
        onProjectSelect: vi.fn(),
        onNewProject: vi.fn()
      })

      const items = container.querySelectorAll('.project-dropdown-item')
      const firstItem = items[0] as HTMLElement
      const newProjectItem = items[3] as HTMLElement

      expect(firstItem.dataset.index).toBe('0')
      expect(newProjectItem.dataset.index).toBe('3')
    })
  })

  describe('showProjectDropdown', () => {
    let anchor: HTMLElement

    beforeEach(() => {
      anchor = document.createElement('div')
      anchor.className = 'project-indicator'
      anchor.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        bottom: 40,
        right: 150,
        width: 140,
        height: 20,
        x: 10,
        y: 20,
        toJSON: () => ({})
      }))
      document.body.appendChild(anchor)
    })

    it('should create dropdown element in DOM', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const dropdown = document.querySelector('.project-dropdown')
      expect(dropdown).toBeTruthy()
    })

    it('should position dropdown below anchor', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const dropdown = document.querySelector('.project-dropdown') as HTMLElement
      expect(dropdown).toBeTruthy()
      expect(dropdown.style.position).toBe('absolute')
      expect(dropdown.style.left).toBe('10px')
      expect(dropdown.style.top).toBe('40px')
    })

    it('should render all projects in dropdown', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const items = document.querySelectorAll('.project-dropdown-item')
      expect(items.length).toBe(4) // 3 projects + "New Project"
    })

    it('should not open dropdown if already open', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const firstDropdown = document.querySelector('.project-dropdown')
      expect(firstDropdown).toBeTruthy()

      // Try to open again - should do nothing (dropdown stays open)
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const dropdowns = document.querySelectorAll('.project-dropdown')
      expect(dropdowns.length).toBe(1) // Should still be open
    })

    it('should focus input after project selection', async () => {
      const inputField = document.createElement('input')
      inputField.id = 'todo-input'
      document.body.appendChild(inputField)

      const focusSpy = vi.spyOn(inputField, 'focus')

      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const items = document.querySelectorAll('.project-dropdown-item')
      const firstItem = items[0] as HTMLElement
      firstItem.click()

      // Wait for async selectProject to complete
      await vi.waitFor(() => expect(focusSpy).toHaveBeenCalled())
    })

    it('should call TodoStore.load with selected project ID', async () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const items = document.querySelectorAll('.project-dropdown-item')
      const secondItem = items[1] as HTMLElement
      secondItem.click()

      // Wait for async selectProject to complete
      await vi.waitFor(() => expect(mockTodoStore.load).toHaveBeenCalledWith('2'))
    })

    it('should call SettingsStore.setActiveProject with selected project ID', async () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const items = document.querySelectorAll('.project-dropdown-item')
      const secondItem = items[1] as HTMLElement
      secondItem.click()

      // Wait for async selectProject to complete
      await vi.waitFor(() => expect(mockSettingsStore.setActiveProject).toHaveBeenCalledWith('2'))
    })

    it('should call onClose after project selection', async () => {
      const onClose = vi.fn()

      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose
      })

      const items = document.querySelectorAll('.project-dropdown-item')
      const firstItem = items[0] as HTMLElement
      firstItem.click()

      // Wait for async selectProject to complete
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    })

    it('should show project name input when "New Project" is clicked', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const newProjectItem = document.querySelector('.project-dropdown-item--new') as HTMLElement
      newProjectItem.click()

      // Verify the terminal-styled input component is shown
      const inputOverlay = document.querySelector('.project-name-input-overlay')
      const inputField = document.querySelector('.project-name-input-field')
      expect(inputOverlay).toBeTruthy()
      expect(inputField).toBeTruthy()
    })

    it('should create new project via ProjectStore when name provided', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const newProjectItem = document.querySelector('.project-dropdown-item--new') as HTMLElement
      newProjectItem.click()

      // Now the input should be visible
      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      expect(input).toBeTruthy()

      // Simulate user entering project name and pressing Enter
      input.value = 'TestProject'
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(mockProjectStore.create).toHaveBeenCalledWith('TestProject')
    })

    it('should switch to new project after creation', async () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const newProjectItem = document.querySelector('.project-dropdown-item--new') as HTMLElement
      newProjectItem.click()

      // Simulate user entering project name and pressing Enter
      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = 'TestProject'
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      // Wait for async createNewProject callback to complete
      await vi.waitFor(() => expect(mockTodoStore.load).toHaveBeenCalledWith('new-id'))
      expect(mockSettingsStore.setActiveProject).toHaveBeenCalledWith('new-id')
    })

    it('should not create project if user cancels prompt', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const newProjectItem = document.querySelector('.project-dropdown-item--new') as HTMLElement
      newProjectItem.click()

      // Simulate user pressing Escape to cancel
      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      input.dispatchEvent(escEvent)

      expect(mockProjectStore.create).not.toHaveBeenCalled()
    })

    it('should trim whitespace from project name', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const newProjectItem = document.querySelector('.project-dropdown-item--new') as HTMLElement
      newProjectItem.click()

      // Simulate user entering project name with whitespace and pressing Enter
      // The trimming is handled by projectNameInput component
      const input = document.querySelector('.project-name-input-field') as HTMLInputElement
      input.value = '  TestProject  '
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      input.dispatchEvent(enterEvent)

      expect(mockProjectStore.create).toHaveBeenCalledWith('TestProject')
    })
  })

  describe('hideProjectDropdown', () => {
    let anchor: HTMLElement

    beforeEach(() => {
      anchor = document.createElement('div')
      anchor.className = 'project-indicator'
      anchor.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        bottom: 40,
        right: 150,
        width: 140,
        height: 20,
        x: 10,
        y: 20,
        toJSON: () => ({})
      }))
      document.body.appendChild(anchor)
    })

    it('should remove dropdown from DOM', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      expect(document.querySelector('.project-dropdown')).toBeTruthy()

      hideProjectDropdown()

      expect(document.querySelector('.project-dropdown')).toBeNull()
    })

    it('should be safe to call when dropdown is not open', () => {
      expect(() => hideProjectDropdown()).not.toThrow()
    })
  })

  describe('keyboard navigation', () => {
    let anchor: HTMLElement

    beforeEach(() => {
      anchor = document.createElement('div')
      anchor.className = 'project-indicator'
      anchor.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        bottom: 40,
        right: 150,
        width: 140,
        height: 20,
        x: 10,
        y: 20,
        toJSON: () => ({})
      }))
      document.body.appendChild(anchor)
    })

    it('should close dropdown when Escape is pressed', () => {
      const onClose = vi.fn()

      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose
      })

      expect(document.querySelector('.project-dropdown')).toBeTruthy()

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escapeEvent)

      expect(document.querySelector('.project-dropdown')).toBeNull()
      expect(onClose).toHaveBeenCalled()
    })

    it('should select project when Enter is pressed', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      document.dispatchEvent(enterEvent)

      expect(mockTodoStore.load).toHaveBeenCalledWith('1') // First project (index 0)
    })

    it('should navigate down with ArrowDown', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Initial highlighted index is 0
      let dropdown = document.querySelector('.project-dropdown')
      let highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted?.textContent).toContain('SequenceStack')

      // Press ArrowDown
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(arrowDownEvent)

      dropdown = document.querySelector('.project-dropdown')
      highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted?.textContent).toContain('HomefrontGroup')
    })

    it('should navigate up with ArrowUp', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Navigate down first
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(arrowDownEvent)

      // Navigate back up
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      document.dispatchEvent(arrowUpEvent)

      const dropdown = document.querySelector('.project-dropdown')
      expect(dropdown).toBeTruthy()
      const highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted).toBeTruthy()
      expect(highlighted?.textContent).toContain('SequenceStack')
    })

    it('should support vim-style j for down navigation', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      const jEvent = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(jEvent)

      const dropdown = document.querySelector('.project-dropdown')
      const highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted?.textContent).toContain('HomefrontGroup')
    })

    it('should support vim-style k for up navigation', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Navigate down first
      const jEvent = new KeyboardEvent('keydown', { key: 'j' })
      document.dispatchEvent(jEvent)

      // Navigate back up
      const kEvent = new KeyboardEvent('keydown', { key: 'k' })
      document.dispatchEvent(kEvent)

      const dropdown = document.querySelector('.project-dropdown')
      expect(dropdown).toBeTruthy()
      const highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted).toBeTruthy()
      expect(highlighted?.textContent).toContain('SequenceStack')
    })

    it('should cycle through items with Tab', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Press Tab 4 times to cycle through all items
      for (let i = 0; i < 4; i++) {
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' })
        document.dispatchEvent(tabEvent)
      }

      // Should cycle back to first item
      const dropdown = document.querySelector('.project-dropdown')
      const highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted?.textContent).toContain('SequenceStack')
    })

    it('should not navigate beyond last item', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Navigate to last item (New Project)
      for (let i = 0; i < 5; i++) {
        const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
        document.dispatchEvent(arrowDownEvent)
      }

      const dropdown = document.querySelector('.project-dropdown')
      expect(dropdown).toBeTruthy()
      const highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted).toBeTruthy()
      expect(highlighted?.textContent).toContain('New Project')
    })

    it('should not navigate above first item', () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Try to navigate up from first item
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      document.dispatchEvent(arrowUpEvent)

      const dropdown = document.querySelector('.project-dropdown')
      const highlighted = dropdown?.querySelector('.project-dropdown-item--highlighted')
      expect(highlighted?.textContent).toContain('SequenceStack')
    })
  })

  describe('click-outside detection', () => {
    let anchor: HTMLElement

    beforeEach(() => {
      anchor = document.createElement('div')
      anchor.className = 'project-indicator'
      anchor.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        bottom: 40,
        right: 150,
        width: 140,
        height: 20,
        x: 10,
        y: 20,
        toJSON: () => ({})
      }))
      document.body.appendChild(anchor)
    })

    it('should close dropdown when clicking outside', async () => {
      const onClose = vi.fn()

      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose
      })

      // Wait for click handler to be registered
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(document.querySelector('.project-dropdown')).toBeTruthy()

      // Click outside using dispatchEvent to ensure proper event bubbling
      const outsideElement = document.createElement('div')
      document.body.appendChild(outsideElement)

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      outsideElement.dispatchEvent(clickEvent)

      expect(document.querySelector('.project-dropdown')).toBeNull()
      expect(onClose).toHaveBeenCalled()
    })

    it('should not close dropdown when clicking inside dropdown', async () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Wait for click handler to be registered
      await new Promise(resolve => setTimeout(resolve, 10))

      const dropdown = document.querySelector('.project-dropdown') as HTMLElement

      // Click inside dropdown (but not on an item)
      const clickEvent = new MouseEvent('click', { bubbles: true })
      dropdown.dispatchEvent(clickEvent)

      // Dropdown should still be open
      expect(document.querySelector('.project-dropdown')).toBeTruthy()
    })

    it('should not close dropdown when clicking indicator', async () => {
      showProjectDropdown({
        anchor,
        projectStore: mockProjectStore,
        todoStore: mockTodoStore,
        settingsStore: mockSettingsStore,
        onClose: vi.fn()
      })

      // Wait for click handler to be registered
      await new Promise(resolve => setTimeout(resolve, 10))

      const dropdownBefore = document.querySelector('.project-dropdown')
      expect(dropdownBefore).toBeTruthy()

      // Click on indicator
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      anchor.dispatchEvent(clickEvent)

      // Dropdown should still be open (click-outside handler ignores indicator clicks)
      const dropdownAfter = document.querySelector('.project-dropdown')
      expect(dropdownAfter).toBeTruthy()
    })
  })
})
