import type { Project } from '@/types/Project'
import type { ProjectStore } from '@/store/ProjectStore'
import type { TodoStore } from '@/store/TodoStore'
import type { SettingsStore } from '@/store/SettingsStore'

interface ProjectSearchState {
  isActive: boolean
  query: string
  selectedIndex: number
  filteredProjects: Project[]
}

const createSearchState = (): ProjectSearchState => ({
  isActive: false,
  query: '',
  selectedIndex: 0,
  filteredProjects: []
})

let searchState: ProjectSearchState = createSearchState()

export const filterProjects = ({
  projects,
  query
}: {
  projects: Project[]
  query: string
}): Project[] => {
  if (!query.trim()) return projects
  const lowerQuery = query.toLowerCase()
  return projects.filter(p => p.name.toLowerCase().includes(lowerQuery))
}

export const renderProjectSearch = ({
  footerContainer,
  filteredProjects,
  selectedIndex,
  query
}: {
  footerContainer: HTMLElement
  filteredProjects: Project[]
  selectedIndex: number
  query: string
}): void => {
  // Clear footer
  footerContainer.innerHTML = ''

  // Create search container
  const searchContainer = document.createElement('div')
  searchContainer.className = 'project-search-active'

  // Create prompt and query display
  const promptSpan = document.createElement('span')
  promptSpan.className = 'project-search-prompt'
  promptSpan.textContent = '> '

  const querySpan = document.createElement('span')
  querySpan.className = 'project-search-input'
  querySpan.textContent = query + '_'

  // Create results container
  const resultsContainer = document.createElement('span')
  resultsContainer.className = 'project-search-results'

  if (filteredProjects.length === 0) {
    const noMatchSpan = document.createElement('span')
    noMatchSpan.className = 'project-search-no-match'
    noMatchSpan.textContent = ' No projects match'
    resultsContainer.appendChild(noMatchSpan)
  } else {
    // Render project chips
    filteredProjects.forEach((project, index) => {
      const matchSpan = document.createElement('span')
      matchSpan.className = index === selectedIndex
        ? 'project-search-match project-search-match--selected'
        : 'project-search-match'
      matchSpan.textContent = ` [${project.name}]`
      matchSpan.dataset.projectId = project.id
      resultsContainer.appendChild(matchSpan)
    })
  }

  // Assemble
  searchContainer.appendChild(promptSpan)
  searchContainer.appendChild(querySpan)
  searchContainer.appendChild(resultsContainer)

  footerContainer.appendChild(searchContainer)
}

export const activateProjectSearch = ({
  footerContainer,
  projectStore,
  todoStore,
  settingsStore,
  onComplete
}: {
  footerContainer: HTMLElement
  projectStore: ProjectStore
  todoStore: TodoStore
  settingsStore: SettingsStore
  onComplete: () => void
}): void => {
  // Initialize search state
  searchState = createSearchState()
  searchState.isActive = true

  const allProjects = projectStore.getAll()
  searchState.filteredProjects = allProjects

  // Initial render
  renderProjectSearch({
    footerContainer,
    filteredProjects: searchState.filteredProjects,
    selectedIndex: searchState.selectedIndex,
    query: searchState.query
  })

  // Keyboard event handler
  const handleKeydown = (event: KeyboardEvent): void => {
    if (!searchState.isActive) return

    // Handle different keys
    if (event.key === 'Escape') {
      // Cancel search
      event.preventDefault()
      event.stopPropagation()
      exitSearchMode()
      onComplete()
      return
    }

    if (event.key === 'Enter') {
      // Select highlighted project
      event.preventDefault()
      event.stopPropagation()

      if (searchState.filteredProjects.length > 0) {
        const selectedProject = searchState.filteredProjects[searchState.selectedIndex]

        // Switch project
        todoStore.load(selectedProject.id)
        settingsStore.setActiveProject(selectedProject.id)

        // Exit search mode
        exitSearchMode()
        onComplete()
      }
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'j') {
      // Navigate down
      event.preventDefault()
      event.stopPropagation()

      if (searchState.filteredProjects.length > 0) {
        searchState.selectedIndex = Math.min(
          searchState.selectedIndex + 1,
          searchState.filteredProjects.length - 1
        )
        renderProjectSearch({
          footerContainer,
          filteredProjects: searchState.filteredProjects,
          selectedIndex: searchState.selectedIndex,
          query: searchState.query
        })
      }
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'k') {
      // Navigate up
      event.preventDefault()
      event.stopPropagation()

      if (searchState.filteredProjects.length > 0) {
        searchState.selectedIndex = Math.max(searchState.selectedIndex - 1, 0)
        renderProjectSearch({
          footerContainer,
          filteredProjects: searchState.filteredProjects,
          selectedIndex: searchState.selectedIndex,
          query: searchState.query
        })
      }
      return
    }

    if (event.key === 'Backspace') {
      // Remove last character
      event.preventDefault()
      event.stopPropagation()

      if (searchState.query.length > 0) {
        searchState.query = searchState.query.slice(0, -1)
        updateFilter(allProjects)
      }
      return
    }

    // Regular character input
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      event.stopPropagation()

      searchState.query += event.key
      updateFilter(allProjects)
      return
    }
  }

  const updateFilter = (allProjects: Project[]): void => {
    searchState.filteredProjects = filterProjects({
      projects: allProjects,
      query: searchState.query
    })

    // Reset selection to first match
    searchState.selectedIndex = 0

    renderProjectSearch({
      footerContainer,
      filteredProjects: searchState.filteredProjects,
      selectedIndex: searchState.selectedIndex,
      query: searchState.query
    })
  }

  const exitSearchMode = (): void => {
    searchState.isActive = false
    document.removeEventListener('keydown', handleKeydown)
  }

  // Attach event listener
  document.addEventListener('keydown', handleKeydown)
}
