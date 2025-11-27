import { describe, it, expect, beforeEach, vi } from 'vitest'
import path from 'path'
import type { Project } from '../src/types/Project'
import type { AppSettings } from '../src/types/Settings'
import type { Todo } from '../src/types/Todo'

// Mock electron-log before importing storage
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock fs module
vi.mock('fs', () => {
  const mockFs = {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
  }
  return {
    default: { promises: mockFs },
    promises: mockFs,
  }
})

// Import after mocks are set up
import { ToonStorage } from './storage'
import { promises as fs } from 'fs'

// Create a typed reference to the mocked fs
const mockFs = vi.mocked(fs)

describe('ToonStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========== Projects Tests ==========
  describe('loadProjects', () => {
    it('should return empty array when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.readFile.mockRejectedValue(error)

      const result = await ToonStorage.loadProjects('/test/projects.toon')
      expect(result).toEqual([])
    })

    it('should decode valid projects.toon file', async () => {
      const toonContent = `projects[2]{id,name,createdAt}:
  550e8400-e29b-41d4-a716-446655440000,Default,2025-11-20T10:00:00Z
  6ba7b810-9dad-11d1-80b4-00c04fd430c8,SequenceStack,2025-11-21T09:30:00Z

version: 2.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.loadProjects('/test/projects.toon')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Default',
        createdAt: '2025-11-20T10:00:00Z',
      })
      expect(result[1]).toEqual({
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        name: 'SequenceStack',
        createdAt: '2025-11-21T09:30:00Z',
      })
    })

    it('should handle empty projects file', async () => {
      const toonContent = `projects[0]{id,name,createdAt}:

version: 2.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.loadProjects('/test/projects.toon')
      expect(result).toEqual([])
    })

    it('should throw error for malformed projects file', async () => {
      const toonContent = 'invalid content'
      mockFs.readFile.mockResolvedValue(toonContent)

      await expect(ToonStorage.loadProjects('/test/projects.toon')).rejects.toThrow(
        'Failed to decode projects TOON format'
      )
    })

    it('should handle project names with commas', async () => {
      const toonContent = `projects[1]{id,name,createdAt}:
  abc123,"Project, with comma",2025-11-20T10:00:00Z

version: 2.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.loadProjects('/test/projects.toon')
      expect(result[0].name).toBe('Project, with comma')
    })
  })

  describe('saveProjects', () => {
    it('should encode and save projects correctly', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const projects: Project[] = [
        { id: 'id1', name: 'Project 1', createdAt: '2025-11-20T10:00:00Z' },
        { id: 'id2', name: 'Project 2', createdAt: '2025-11-21T09:30:00Z' },
      ]

      await ToonStorage.saveProjects('/test/projects.toon', projects)

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test', { recursive: true })
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/projects.toon',
        expect.stringContaining('projects[2]{id,name,createdAt}:'),
        'utf-8'
      )
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/projects.toon',
        expect.stringContaining('version: 2.0'),
        'utf-8'
      )
    })

    it('should save empty projects array', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      await ToonStorage.saveProjects('/test/projects.toon', [])

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/projects.toon',
        expect.stringContaining('projects[0]{id,name,createdAt}:'),
        'utf-8'
      )
    })

    it('should escape project names with special characters', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const projects: Project[] = [
        { id: 'id1', name: 'Project, with "quotes"', createdAt: '2025-11-20T10:00:00Z' },
      ]

      await ToonStorage.saveProjects('/test/projects.toon', projects)

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string
      expect(writtenContent).toContain('"Project, with ""quotes"""')
    })
  })

  describe('encodeProjects / decodeProjects roundtrip', () => {
    it('should encode and decode projects without data loss', () => {
      const projects: Project[] = [
        { id: 'uuid-1', name: 'Test Project', createdAt: '2025-11-20T10:00:00Z' },
        { id: 'uuid-2', name: 'Another Project', createdAt: '2025-11-21T11:00:00Z' },
      ]

      const encoded = ToonStorage.encodeProjects(projects)
      const decoded = ToonStorage.decodeProjects(encoded)

      expect(decoded).toEqual(projects)
    })
  })

  // ========== Settings Tests ==========
  describe('loadSettings', () => {
    it('should return defaults when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.readFile.mockRejectedValue(error)

      const result = await ToonStorage.loadSettings('/test/settings.toon')
      expect(result).toEqual({
        activeProjectId: '',
        windowBounds: { x: 100, y: 100, width: 600, height: 400 },
        version: '1.0',
      })
    })

    it('should decode valid settings.toon file', async () => {
      const toonContent = `activeProjectId: 550e8400-e29b-41d4-a716-446655440000
windowBounds{x,y,width,height}: 200,150,800,600
version: 1.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.loadSettings('/test/settings.toon')
      expect(result).toEqual({
        activeProjectId: '550e8400-e29b-41d4-a716-446655440000',
        windowBounds: { x: 200, y: 150, width: 800, height: 600 },
        version: '1.0',
      })
    })

    it('should handle empty activeProjectId', async () => {
      const toonContent = `activeProjectId:
windowBounds{x,y,width,height}: 100,100,600,400
version: 1.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.loadSettings('/test/settings.toon')
      expect(result.activeProjectId).toBe('')
    })

    it('should throw error for malformed windowBounds', async () => {
      const toonContent = `activeProjectId: test-id
windowBounds{x,y,width,height}: invalid,values
version: 1.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      await expect(ToonStorage.loadSettings('/test/settings.toon')).rejects.toThrow(
        'Failed to decode settings TOON format'
      )
    })
  })

  describe('saveSettings', () => {
    it('should encode and save settings correctly', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const settings: AppSettings = {
        activeProjectId: 'test-project-id',
        windowBounds: { x: 200, y: 150, width: 800, height: 600 },
        version: '1.0',
      }

      await ToonStorage.saveSettings('/test/settings.toon', settings)

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/settings.toon',
        'activeProjectId: test-project-id\nwindowBounds{x,y,width,height}: 200,150,800,600\nversion: 1.0',
        'utf-8'
      )
    })
  })

  describe('encodeSettings / decodeSettings roundtrip', () => {
    it('should encode and decode settings without data loss', () => {
      const settings: AppSettings = {
        activeProjectId: 'test-uuid-123',
        windowBounds: { x: 50, y: 75, width: 1024, height: 768 },
        version: '1.0',
      }

      const encoded = ToonStorage.encodeSettings(settings)
      const decoded = ToonStorage.decodeSettings(encoded)

      expect(decoded).toEqual(settings)
    })
  })

  // ========== loadTodos / saveTodos with projectId Tests ==========
  describe('loadTodos with projectId', () => {
    it('should construct correct file path from projectId', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.readFile.mockRejectedValue(error)

      await ToonStorage.loadTodos('/data', 'project-123')

      expect(mockFs.readFile).toHaveBeenCalledWith(path.join('/data', 'todos-project-123.toon'), 'utf-8')
    })

    it('should return empty array when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.readFile.mockRejectedValue(error)

      const result = await ToonStorage.loadTodos('/data', 'project-123')
      expect(result).toEqual([])
    })

    it('should load todos from project-specific file', async () => {
      const toonContent = `todos[1]{id,text,completed,createdAt}:
  todo-1,Test task,false,2025-11-20T10:00:00Z

version: 1.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.loadTodos('/data', 'project-123')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('Test task')
    })
  })

  describe('saveTodos with projectId', () => {
    it('should construct correct file path from projectId', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const todos: Todo[] = [
        { id: 'todo-1', text: 'Task', completed: false, createdAt: '2025-11-20T10:00:00Z' },
      ]

      await ToonStorage.saveTodos('/data', 'project-123', todos)

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join('/data', 'todos-project-123.toon'),
        expect.any(String),
        'utf-8'
      )
    })
  })

  // ========== deleteTodosFile Tests ==========
  describe('deleteTodosFile', () => {
    it('should delete existing file', async () => {
      mockFs.unlink.mockResolvedValue(undefined)

      await ToonStorage.deleteTodosFile('/data/todos-project-123.toon')

      expect(mockFs.unlink).toHaveBeenCalledWith('/data/todos-project-123.toon')
    })

    it('should handle non-existent file gracefully', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.unlink.mockRejectedValue(error)

      // Should not throw
      await expect(
        ToonStorage.deleteTodosFile('/data/todos-nonexistent.toon')
      ).resolves.toBeUndefined()
    })

    it('should propagate other errors', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockFs.unlink.mockRejectedValue(error)

      await expect(ToonStorage.deleteTodosFile('/data/todos-file.toon')).rejects.toThrow(
        'Permission denied'
      )
    })
  })

  // ========== Existing load/save (generic path) Tests ==========
  describe('load (generic)', () => {
    it('should return empty array for missing file', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.readFile.mockRejectedValue(error)

      const result = await ToonStorage.load('/test/todos.toon')
      expect(result).toEqual([])
    })

    it('should decode valid todos file', async () => {
      const toonContent = `todos[2]{id,text,completed,createdAt}:
  id1,Task 1,false,2025-11-20T10:00:00Z
  id2,Task 2,true,2025-11-21T09:30:00Z

version: 1.0`

      mockFs.readFile.mockResolvedValue(toonContent)

      const result = await ToonStorage.load('/test/todos.toon')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'id1',
        text: 'Task 1',
        completed: false,
        createdAt: '2025-11-20T10:00:00Z',
      })
      expect(result[1]).toEqual({
        id: 'id2',
        text: 'Task 2',
        completed: true,
        createdAt: '2025-11-21T09:30:00Z',
      })
    })

    it('should backup and throw for corrupt file', async () => {
      const corruptContent = 'completely invalid toon'
      vi.mocked(fs.readFile).mockResolvedValue(corruptContent)
      mockFs.rename.mockResolvedValue(undefined)

      await expect(ToonStorage.load('/test/todos.toon')).rejects.toThrow('Corrupt file backed up')
      expect(mockFs.rename).toHaveBeenCalled()
    })
  })

  describe('save (generic)', () => {
    it('should create directory and save file', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const todos: Todo[] = [
        { id: 'id1', text: 'Task 1', completed: false, createdAt: '2025-11-20T10:00:00Z' },
      ]

      await ToonStorage.save('/test/todos.toon', todos)

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test', { recursive: true })
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/todos.toon',
        expect.stringContaining('todos[1]{id,text,completed,createdAt}:'),
        'utf-8'
      )
    })
  })

  describe('encode / decode roundtrip (todos)', () => {
    it('should encode and decode todos without data loss', () => {
      const todos: Todo[] = [
        { id: 'uuid-1', text: 'Test task', completed: false, createdAt: '2025-11-20T10:00:00Z' },
        {
          id: 'uuid-2',
          text: 'Completed task',
          completed: true,
          createdAt: '2025-11-21T11:00:00Z',
        },
      ]

      const encoded = ToonStorage.encode(todos)
      const decoded = ToonStorage.decode(encoded)

      expect(decoded).toEqual(todos)
    })

    it('should handle text with commas', () => {
      const todos: Todo[] = [
        {
          id: 'uuid-1',
          text: 'Task with, comma',
          completed: false,
          createdAt: '2025-11-20T10:00:00Z',
        },
      ]

      const encoded = ToonStorage.encode(todos)
      const decoded = ToonStorage.decode(encoded)

      expect(decoded).toEqual(todos)
    })

    it('should handle text with quotes', () => {
      const todos: Todo[] = [
        {
          id: 'uuid-1',
          text: 'Task with "quotes"',
          completed: false,
          createdAt: '2025-11-20T10:00:00Z',
        },
      ]

      const encoded = ToonStorage.encode(todos)
      const decoded = ToonStorage.decode(encoded)

      expect(decoded).toEqual(todos)
    })
  })
})
