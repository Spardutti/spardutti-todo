import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderProjectIndicator } from './projectIndicator'
import type { Project } from '@/types/Project'

describe('renderProjectIndicator', () => {
  let container: HTMLElement
  let mockProject: Project
  let mockCallback: () => void

  beforeEach(() => {
    container = document.createElement('div')
    mockProject = {
      id: 'test-project-id-123',
      name: 'Test Project',
      createdAt: '2025-11-27T10:00:00Z'
    }
    mockCallback = vi.fn()
  })

  it('renders project name correctly', () => {
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    const nameSpan = container.querySelector('.project-indicator-name')
    expect(nameSpan).toBeTruthy()
    expect(nameSpan?.textContent).toBe('Test Project')
  })

  it('renders dropdown arrow', () => {
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    const arrowSpan = container.querySelector('.project-indicator-arrow')
    expect(arrowSpan).toBeTruthy()
    expect(arrowSpan?.textContent).toBe(' ▼')
  })

  it('click triggers callback', () => {
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    const indicator = container.querySelector('.project-indicator') as HTMLElement
    expect(indicator).toBeTruthy()

    indicator.click()
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('updates when called with different project', () => {
    // Render first project
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    const firstNameSpan = container.querySelector('.project-indicator-name')
    expect(firstNameSpan?.textContent).toBe('Test Project')

    // Render different project
    const newProject: Project = {
      id: 'different-project-id-456',
      name: 'Different Project',
      createdAt: '2025-11-27T11:00:00Z'
    }

    renderProjectIndicator({
      project: newProject,
      container,
      onDropdownClick: mockCallback
    })

    const updatedNameSpan = container.querySelector('.project-indicator-name')
    expect(updatedNameSpan?.textContent).toBe('Different Project')

    // Verify data attribute is updated
    const indicator = container.querySelector('.project-indicator') as HTMLElement
    expect(indicator.dataset.projectId).toBe('different-project-id-456')
  })

  it('clears container before rendering', () => {
    // Add some initial content
    container.innerHTML = '<div>Old Content</div>'
    expect(container.children.length).toBe(1)

    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    // Container should only have the indicator element
    expect(container.children.length).toBe(1)
    expect(container.querySelector('.project-indicator')).toBeTruthy()
    expect(container.querySelector('div')?.textContent).not.toBe('Old Content')
  })

  it('sets data-project-id attribute', () => {
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    const indicator = container.querySelector('.project-indicator') as HTMLElement
    expect(indicator.dataset.projectId).toBe('test-project-id-123')
  })

  it('applies correct CSS classes', () => {
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    const indicator = container.querySelector('.project-indicator')
    expect(indicator?.className).toBe('project-indicator')

    const nameSpan = container.querySelector('.project-indicator-name')
    expect(nameSpan?.className).toBe('project-indicator-name')

    const arrowSpan = container.querySelector('.project-indicator-arrow')
    expect(arrowSpan?.className).toBe('project-indicator-arrow')
  })

  it('entire indicator is clickable (covers name and arrow)', () => {
    renderProjectIndicator({
      project: mockProject,
      container,
      onDropdownClick: mockCallback
    })

    // Click on name span
    const nameSpan = container.querySelector('.project-indicator-name') as HTMLElement
    nameSpan.click()
    expect(mockCallback).toHaveBeenCalledTimes(1)

    // Click on arrow span
    const arrowSpan = container.querySelector('.project-indicator-arrow') as HTMLElement
    arrowSpan.click()
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })
})
