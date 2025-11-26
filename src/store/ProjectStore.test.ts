import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectStore } from './ProjectStore'
import type { Project } from '@/types/Project'

// Mock window.electron
global.window = {
  electron: {
    getTodosPath: vi.fn(),
    loadTodos: vi.fn(),
    saveTodos: vi.fn(),
    getAppVersion: vi.fn(),
    loadProjects: vi.fn(),
    saveProjects: vi.fn(),
    deleteTodosFile: vi.fn(),
  },
} as any

describe('ProjectStore', () => {
  let store: ProjectStore
  const mockFilePath = '/mock/projects.toon'

  beforeEach(() => {
    vi.clearAllMocks()
    store = new ProjectStore(mockFilePath)
  })

  describe('constructor', () => {
    it('should store file path', () => {
      const testPath = '/test/path.toon'
      const testStore = new ProjectStore(testPath)
      expect(testStore).toBeDefined()
    })

    it('should initialize with empty projects array', () => {
      expect(store.getAll()).toEqual([])
    })
  })

  describe('load()', () => {
    it('should load projects from window.electron.loadProjects', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Project 1',
          createdAt: '2025-11-25T10:00:00.000Z',
        },
        {
          id: '2',
          name: 'Project 2',
          createdAt: '2025-11-25T11:00:00.000Z',
        },
      ]

      vi.mocked(window.electron.loadProjects).mockResolvedValue(mockProjects)

      await store.load()

      expect(window.electron.loadProjects).toHaveBeenCalledWith(mockFilePath)
      expect(store.getAll()).toEqual(mockProjects)
    })

    it('should handle file-not-found gracefully (empty array)', async () => {
      const mockError = new Error('File not found')
      vi.mocked(window.electron.loadProjects).mockRejectedValue(mockError)

      await store.load()

      expect(store.getAll()).toEqual([])
    })

    it('should populate _projects array from loaded data', async () => {
      const mockProjects: Project[] = [
        { id: 'abc', name: 'Test', createdAt: '2025-11-25T10:00:00.000Z' },
      ]
      vi.mocked(window.electron.loadProjects).mockResolvedValue(mockProjects)

      await store.load()

      expect(store.getAll()).toHaveLength(1)
      expect(store.getAll()[0].name).toBe('Test')
    })
  })

  describe('save()', () => {
    it('should save projects to window.electron.saveProjects', async () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      await store.save()

      expect(window.electron.saveProjects).toHaveBeenCalledWith(mockFilePath, [])
    })

    it('should catch errors without throwing (fire-and-forget)', async () => {
      const mockError = new Error('Disk full')
      vi.mocked(window.electron.saveProjects).mockRejectedValue(mockError)

      await expect(store.save()).resolves.toBeUndefined()
    })

    it('should save current projects array', async () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      store.create('Project 1')
      store.create('Project 2')

      await store.save()

      const savedProjects = vi.mocked(window.electron.saveProjects).mock.calls[2][1]
      expect(savedProjects).toHaveLength(2)
    })
  })

  describe('create()', () => {
    it('should create project with correct shape', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      const project = store.create('My Project')

      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('name')
      expect(project).toHaveProperty('createdAt')
    })

    it('should generate valid UUID v4 format', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      const project = store.create('Test')

      expect(project.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should create ISO 8601 timestamp', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      const project = store.create('Test')

      expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should add project to internal array', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      store.create('First')
      store.create('Second')

      expect(store.getAll()).toHaveLength(2)
      expect(store.getAll()[0].name).toBe('First')
      expect(store.getAll()[1].name).toBe('Second')
    })

    it('should return the created project', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      const project = store.create('Return Test')

      expect(project.name).toBe('Return Test')
    })

    it('should trigger auto-save (verify save() called)', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.create('Auto-save Test')

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should not await save (fire-and-forget pattern)', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      const project = store.create('Fire-and-forget Test')

      expect(project).toBeDefined()
      expect(project.name).toBe('Fire-and-forget Test')
    })
  })

  describe('rename()', () => {
    it('should update project name', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const project = store.create('Original Name')

      store.rename(project.id, 'New Name')

      expect(store.findById(project.id)?.name).toBe('New Name')
    })

    it('should throw Error for invalid ID: "Project not found: {id}"', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()

      expect(() => {
        store.rename('non-existent-id', 'New Name')
      }).toThrow('Project not found: non-existent-id')
    })

    it('should trigger auto-save', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const project = store.create('Test')
      const saveSpy = vi.spyOn(store, 'save')
      saveSpy.mockClear()

      store.rename(project.id, 'Updated')

      expect(saveSpy).toHaveBeenCalled()
    })
  })

  describe('delete()', () => {
    it('should remove project from array', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      vi.mocked(window.electron.deleteTodosFile).mockResolvedValue()
      const project1 = store.create('Project 1')
      store.create('Project 2')

      store.delete(project1.id)

      expect(store.getAll()).toHaveLength(1)
      expect(store.findById(project1.id)).toBeUndefined()
    })

    it('should throw "Cannot delete last project" when only one exists', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const project = store.create('Last Project')

      expect(() => {
        store.delete(project.id)
      }).toThrow('Cannot delete last project')
    })

    it('should throw Error for invalid ID', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      store.create('Project 1')
      store.create('Project 2')

      expect(() => {
        store.delete('non-existent-id')
      }).toThrow('Project not found: non-existent-id')
    })

    it('should call deleteTodosFile with project ID', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      vi.mocked(window.electron.deleteTodosFile).mockResolvedValue()
      const project1 = store.create('Project 1')
      store.create('Project 2')

      store.delete(project1.id)

      expect(window.electron.deleteTodosFile).toHaveBeenCalledWith(project1.id)
    })

    it('should trigger auto-save', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      vi.mocked(window.electron.deleteTodosFile).mockResolvedValue()
      store.create('Project 1')
      store.create('Project 2')
      const saveSpy = vi.spyOn(store, 'save')
      saveSpy.mockClear()

      const projects = store.getAll()
      store.delete(projects[0].id)

      expect(saveSpy).toHaveBeenCalled()
    })
  })

  describe('getAll()', () => {
    it('should return shallow copy (mutating result does not affect internal)', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      store.create('Test')

      const projects = store.getAll()
      projects.push({
        id: 'fake-id',
        name: 'Fake Project',
        createdAt: new Date().toISOString(),
      })

      expect(store.getAll()).toHaveLength(1)
    })

    it('should return all projects', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      store.create('Project 1')
      store.create('Project 2')
      store.create('Project 3')

      const projects = store.getAll()

      expect(projects).toHaveLength(3)
      expect(projects[0].name).toBe('Project 1')
      expect(projects[1].name).toBe('Project 2')
      expect(projects[2].name).toBe('Project 3')
    })

    it('should return empty array for empty store', () => {
      expect(store.getAll()).toEqual([])
    })
  })

  describe('findById()', () => {
    it('should return project when found', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const project = store.create('Find Me')

      const found = store.findById(project.id)

      expect(found).toBeDefined()
      expect(found?.name).toBe('Find Me')
    })

    it('should return undefined when not found', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      store.create('Some Project')

      const found = store.findById('non-existent-id')

      expect(found).toBeUndefined()
    })
  })

  describe('search()', () => {
    beforeEach(() => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      store.create('Work Tasks')
      store.create('Personal')
      store.create('Homework')
    })

    it('should return matching projects with matching query', () => {
      const results = store.search('work')

      expect(results).toHaveLength(2) // "Work Tasks" and "Homework"
      expect(results.map((p) => p.name)).toContain('Work Tasks')
      expect(results.map((p) => p.name)).toContain('Homework')
    })

    it('should be case-insensitive', () => {
      const results1 = store.search('WORK')
      const results2 = store.search('work')
      const results3 = store.search('Work')

      expect(results1).toHaveLength(2)
      expect(results2).toHaveLength(2)
      expect(results3).toHaveLength(2)
    })

    it('should return all projects if query is empty', () => {
      const results = store.search('')

      expect(results).toHaveLength(3)
    })

    it('should return empty array for non-matching query', () => {
      const results = store.search('xyz')

      expect(results).toEqual([])
    })
  })

  describe('auto-save integration', () => {
    it('should call save() after create()', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.create('Test')

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should call save() after rename()', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      const project = store.create('Test')
      const saveSpy = vi.spyOn(store, 'save')
      saveSpy.mockClear()

      store.rename(project.id, 'Updated')

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should call save() after delete()', () => {
      vi.mocked(window.electron.saveProjects).mockResolvedValue()
      vi.mocked(window.electron.deleteTodosFile).mockResolvedValue()
      store.create('Project 1')
      store.create('Project 2')
      const saveSpy = vi.spyOn(store, 'save')
      saveSpy.mockClear()

      const projects = store.getAll()
      store.delete(projects[0].id)

      expect(saveSpy).toHaveBeenCalled()
    })
  })
})
