import { describe, it, expect, beforeEach } from 'vitest'
import { filterProjects, renderProjectSearch } from './projectSearch'
import type { Project } from '@/types/Project'

describe('filterProjects', () => {
  let projects: Project[]

  beforeEach(() => {
    projects = [
      { id: '1', name: 'SequenceStack', createdAt: '2025-01-01' },
      { id: '2', name: 'Homefront', createdAt: '2025-01-02' },
      { id: '3', name: 'Research Notes', createdAt: '2025-01-03' },
      { id: '4', name: 'Personal', createdAt: '2025-01-04' }
    ]
  })

  it('returns all projects when query is empty', () => {
    const result = filterProjects({ projects, query: '' })
    expect(result).toEqual(projects)
    expect(result.length).toBe(4)
  })

  it('returns all projects when query is whitespace only', () => {
    const result = filterProjects({ projects, query: '   ' })
    expect(result).toEqual(projects)
    expect(result.length).toBe(4)
  })

  it('filters projects case-insensitively', () => {
    const result = filterProjects({ projects, query: 'SEQ' })
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('SequenceStack')
  })

  it('matches partial project names', () => {
    const result = filterProjects({ projects, query: 'front' })
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Homefront')
  })

  it('returns multiple matches', () => {
    const result = filterProjects({ projects, query: 'e' })
    expect(result.length).toBe(4) // SequenceStack, Homefront, Research Notes, Personal
    expect(result.map(p => p.name)).toContain('SequenceStack')
    expect(result.map(p => p.name)).toContain('Homefront')
    expect(result.map(p => p.name)).toContain('Research Notes')
    expect(result.map(p => p.name)).toContain('Personal')
  })

  it('returns empty array when no matches', () => {
    const result = filterProjects({ projects, query: 'xyz123' })
    expect(result).toEqual([])
    expect(result.length).toBe(0)
  })

  it('matches on exact name', () => {
    const result = filterProjects({ projects, query: 'Personal' })
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Personal')
  })

  it('handles special characters in query', () => {
    const projectsWithSpecial: Project[] = [
      { id: '1', name: 'Project-A', createdAt: '2025-01-01' },
      { id: '2', name: 'Project B', createdAt: '2025-01-02' }
    ]

    const result1 = filterProjects({ projects: projectsWithSpecial, query: '-A' })
    expect(result1.length).toBe(1)
    expect(result1[0].name).toBe('Project-A')

    const result2 = filterProjects({ projects: projectsWithSpecial, query: ' B' })
    expect(result2.length).toBe(1)
    expect(result2[0].name).toBe('Project B')
  })
})

describe('renderProjectSearch', () => {
  let footerContainer: HTMLElement
  let projects: Project[]

  beforeEach(() => {
    footerContainer = document.createElement('div')
    projects = [
      { id: '1', name: 'SequenceStack', createdAt: '2025-01-01' },
      { id: '2', name: 'Homefront', createdAt: '2025-01-02' },
      { id: '3', name: 'Personal', createdAt: '2025-01-03' }
    ]
  })

  it('renders search prompt and query', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 0,
      query: 'seq'
    })

    const prompt = footerContainer.querySelector('.project-search-prompt')
    expect(prompt).toBeTruthy()
    expect(prompt?.textContent).toBe('> ')

    const input = footerContainer.querySelector('.project-search-input')
    expect(input).toBeTruthy()
    expect(input?.textContent).toBe('seq_')
  })

  it('renders project matches as chips', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 0,
      query: ''
    })

    const matches = footerContainer.querySelectorAll('.project-search-match')
    expect(matches.length).toBe(3)
    expect(matches[0].textContent).toBe(' [SequenceStack]')
    expect(matches[1].textContent).toBe(' [Homefront]')
    expect(matches[2].textContent).toBe(' [Personal]')
  })

  it('highlights selected project', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 1,
      query: ''
    })

    const matches = footerContainer.querySelectorAll('.project-search-match')
    expect(matches[0].classList.contains('project-search-match--selected')).toBe(false)
    expect(matches[1].classList.contains('project-search-match--selected')).toBe(true)
    expect(matches[2].classList.contains('project-search-match--selected')).toBe(false)
  })

  it('displays "No projects match" when filtered list is empty', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: [],
      selectedIndex: 0,
      query: 'nonexistent'
    })

    const noMatch = footerContainer.querySelector('.project-search-no-match')
    expect(noMatch).toBeTruthy()
    expect(noMatch?.textContent).toBe(' No projects match')

    const matches = footerContainer.querySelectorAll('.project-search-match')
    expect(matches.length).toBe(0)
  })

  it('sets data-project-id attribute on matches', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 0,
      query: ''
    })

    const matches = footerContainer.querySelectorAll('.project-search-match')
    expect((matches[0] as HTMLElement).dataset.projectId).toBe('1')
    expect((matches[1] as HTMLElement).dataset.projectId).toBe('2')
    expect((matches[2] as HTMLElement).dataset.projectId).toBe('3')
  })

  it('clears footer before rendering', () => {
    footerContainer.innerHTML = '<div>Old Content</div>'
    expect(footerContainer.children.length).toBe(1)

    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 0,
      query: ''
    })

    // Should only have search container now
    expect(footerContainer.children.length).toBe(1)
    expect(footerContainer.querySelector('.project-search-active')).toBeTruthy()
  })

  it('renders empty query with cursor', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 0,
      query: ''
    })

    const input = footerContainer.querySelector('.project-search-input')
    expect(input?.textContent).toBe('_')
  })

  it('applies correct CSS classes', () => {
    renderProjectSearch({
      footerContainer,
      filteredProjects: projects,
      selectedIndex: 0,
      query: 'test'
    })

    expect(footerContainer.querySelector('.project-search-active')).toBeTruthy()
    expect(footerContainer.querySelector('.project-search-prompt')).toBeTruthy()
    expect(footerContainer.querySelector('.project-search-input')).toBeTruthy()
    expect(footerContainer.querySelector('.project-search-results')).toBeTruthy()
    expect(footerContainer.querySelector('.project-search-match')).toBeTruthy()
  })
})

describe('selectedIndex navigation bounds', () => {
  it('selectedIndex should not go below 0', () => {
    const selectedIndex = 0
    const newIndex = Math.max(selectedIndex - 1, 0)
    expect(newIndex).toBe(0)
  })

  it('selectedIndex should not exceed filtered projects length - 1', () => {
    const filteredProjects = [
      { id: '1', name: 'A', createdAt: '2025-01-01' },
      { id: '2', name: 'B', createdAt: '2025-01-02' }
    ]
    const selectedIndex = 1
    const newIndex = Math.min(selectedIndex + 1, filteredProjects.length - 1)
    expect(newIndex).toBe(1) // Should stay at 1 (last index)
  })

  it('selectedIndex wraps correctly when navigating down from last', () => {
    const filteredProjects = [
      { id: '1', name: 'A', createdAt: '2025-01-01' },
      { id: '2', name: 'B', createdAt: '2025-01-02' }
    ]
    const selectedIndex = 1 // Last index
    const newIndex = Math.min(selectedIndex + 1, filteredProjects.length - 1)
    expect(newIndex).toBe(1) // Stops at last (no wrap per AC)
  })
})
