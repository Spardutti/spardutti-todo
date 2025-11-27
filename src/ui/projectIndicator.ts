import type { Project } from '@/types/Project'

export const renderProjectIndicator = ({
  project,
  container,
  onDropdownClick
}: {
  project: Project
  container: HTMLElement
  onDropdownClick: () => void
}): void => {
  // Clear container
  container.innerHTML = ''

  // Create indicator element
  const indicator = document.createElement('div')
  indicator.className = 'project-indicator'
  indicator.dataset.projectId = project.id

  // Add project name
  const nameSpan = document.createElement('span')
  nameSpan.className = 'project-indicator-name'
  nameSpan.textContent = project.name

  // Add dropdown arrow
  const arrowSpan = document.createElement('span')
  arrowSpan.className = 'project-indicator-arrow'
  arrowSpan.textContent = ' ▼'

  // Assemble and attach
  indicator.appendChild(nameSpan)
  indicator.appendChild(arrowSpan)
  indicator.addEventListener('click', onDropdownClick)

  container.appendChild(indicator)
}
