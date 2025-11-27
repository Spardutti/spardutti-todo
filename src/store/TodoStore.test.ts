import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TodoStore } from './TodoStore'
import * as render from '@/ui/render'

// Mock displayError and hideError functions
vi.mock('@/ui/render', () => ({
  displayError: vi.fn(),
  hideError: vi.fn(),
}))

// Mock window.electron
global.window = {
  electron: {
    getTodosPath: vi.fn(),
    loadTodos: vi.fn(),
    saveTodos: vi.fn(),
  },
} as any

describe('TodoStore', () => {
  let store: TodoStore
  const mockBasePath = '/mock/todos.toon'
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Setup default mock return values
    vi.mocked(window.electron.getTodosPath).mockResolvedValue(mockBasePath)
    vi.mocked(window.electron.loadTodos).mockResolvedValue([])
    vi.mocked(window.electron.saveTodos).mockResolvedValue()

    // Create store (no constructor parameters needed)
    store = new TodoStore()
  })

  describe('constructor', () => {
    it('should create store without parameters', () => {
      const testStore = new TodoStore()
      expect(testStore).toBeDefined()
      expect(testStore.getAll()).toEqual([])
    })
  })

  describe('load()', () => {
    it('should load todos for a specific project', async () => {
      const mockTodos = [
        {
          id: '1',
          text: 'Test todo 1',
          completed: false,
          createdAt: '2025-11-24T10:00:00Z',
        },
        {
          id: '2',
          text: 'Test todo 2',
          completed: true,
          createdAt: '2025-11-24T11:00:00Z',
        },
      ]

      vi.mocked(window.electron.loadTodos).mockResolvedValue(mockTodos)

      await store.load(mockProjectId)

      expect(window.electron.getTodosPath).toHaveBeenCalled()
      expect(window.electron.loadTodos).toHaveBeenCalledWith(
        `/mock/todos-${mockProjectId}.toon`
      )
      expect(store.getAll()).toEqual(mockTodos)
    })

    it('should clear existing todos before loading new project', async () => {
      const project1Todos = [{ id: '1', text: 'Todo 1', completed: false, createdAt: '2025-11-24T10:00:00Z' }]
      const project2Todos = [{ id: '2', text: 'Todo 2', completed: false, createdAt: '2025-11-24T11:00:00Z' }]

      // Load first project
      vi.mocked(window.electron.loadTodos).mockResolvedValue(project1Todos)
      await store.load('project-1')
      expect(store.getAll()).toEqual(project1Todos)

      // Load second project - should clear previous
      vi.mocked(window.electron.loadTodos).mockResolvedValue(project2Todos)
      await store.load('project-2')
      expect(store.getAll()).toEqual(project2Todos)
      expect(store.getAll()).toHaveLength(1)
    })

    it('should propagate errors from loadTodos (corrupt file)', async () => {
      const mockError = new Error('Invalid TOON format')
      vi.mocked(window.electron.loadTodos).mockRejectedValue(mockError)

      await expect(store.load(mockProjectId)).rejects.toThrow('Invalid TOON format')
    })
  })

  describe('save()', () => {
    it('should save todos to project-scoped file', async () => {
      await store.load(mockProjectId)
      await store.save()

      expect(window.electron.getTodosPath).toHaveBeenCalled()
      expect(window.electron.saveTodos).toHaveBeenCalledWith(
        `/mock/todos-${mockProjectId}.toon`,
        []
      )
    })

    it('should catch and log save errors without throwing', async () => {
      const mockError = new Error('Disk full')
      vi.mocked(window.electron.saveTodos).mockRejectedValue(mockError)

      // Should not throw
      await expect(store.save()).resolves.toBeUndefined()
    })

    it('should call displayError when save fails (Story 5.3)', async () => {
      const mockError = new Error('Disk full')
      vi.mocked(window.electron.saveTodos).mockRejectedValue(mockError)

      await store.save()

      // Verify displayError was called with correct message and duration
      expect(render.displayError).toHaveBeenCalledWith('Failed to save. Try again.', 5000)
    })
  })

  describe('auto-save integration', () => {
    it('should call save() after add()', async () => {
      await store.load(mockProjectId)
      vi.mocked(window.electron.saveTodos).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')

      store.add('Buy milk')

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should not await save in add() (fire-and-forget)', async () => {
      await store.load(mockProjectId)
      vi.mocked(window.electron.saveTodos).mockResolvedValue()

      const todo = store.add('Buy milk')

      // add() returns immediately without waiting for save
      expect(todo).toBeDefined()
      expect(todo?.text).toBe('Buy milk')
    })

    it('should call save() after toggle()', async () => {
      await store.load(mockProjectId)
      vi.mocked(window.electron.saveTodos).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')
      const todo = store.add('Test')

      // Clear the save call from add()
      saveSpy.mockClear()

      store.toggle(todo!.id)

      expect(saveSpy).toHaveBeenCalled()
    })

    it('should call save() after deleteCompleted()', async () => {
      await store.load(mockProjectId)
      vi.mocked(window.electron.saveTodos).mockResolvedValue()
      const saveSpy = vi.spyOn(store, 'save')
      const todo = store.add('Test')
      store.toggle(todo!.id)

      // Clear the save calls from add() and toggle()
      saveSpy.mockClear()

      store.deleteCompleted()

      expect(saveSpy).toHaveBeenCalled()
    })
  })

  describe('add()', () => {
    it('should create todo with correct text', () => {
      const todo = store.add('Buy groceries')
      expect(todo).not.toBeNull()
      expect(todo?.text).toBe('Buy groceries')
    })

    it('should generate valid UUID v4 format', () => {
      const todo = store.add('Test task')
      expect(todo).not.toBeNull()
      // UUID v4 regex: 8-4-4-4-12 hex characters with version 4 in the third section
      expect(todo?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should set completed to false for new todos', () => {
      const todo = store.add('New task')
      expect(todo).not.toBeNull()
      expect(todo?.completed).toBe(false)
    })

    it('should create ISO 8601 timestamp', () => {
      const todo = store.add('Another task')
      expect(todo).not.toBeNull()
      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(todo?.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    it('should return created Todo object', () => {
      const todo = store.add('Return test')
      expect(todo).not.toBeNull()
      expect(todo).toHaveProperty('id')
      expect(todo).toHaveProperty('text')
      expect(todo).toHaveProperty('completed')
      expect(todo).toHaveProperty('createdAt')
    })

    it('should prepend todo to top of list (unshift)', () => {
      store.add('First task')
      store.add('Second task')
      store.add('Third task')
      const allTodos = store.getAll()
      expect(allTodos).toHaveLength(3)
      // Newest first (unshift behavior - FR42)
      expect(allTodos[0].text).toBe('Third task')
      expect(allTodos[1].text).toBe('Second task')
      expect(allTodos[2].text).toBe('First task')
    })

    it('should return null for empty string', () => {
      const todo = store.add('')
      expect(todo).toBeNull()
      expect(store.getAll()).toHaveLength(0)
    })

    it('should return null for whitespace-only string', () => {
      const todo = store.add('   \t\n  ')
      expect(todo).toBeNull()
      expect(store.getAll()).toHaveLength(0)
    })

    it('should trim whitespace from text', () => {
      const todo = store.add('  Trimmed task  ')
      expect(todo).not.toBeNull()
      expect(todo?.text).toBe('Trimmed task')
    })
  })

  describe('toggle()', () => {
    it('should toggle completed from false to true', () => {
      const todo = store.add('Toggle test')
      expect(todo).not.toBeNull()
      expect(todo?.completed).toBe(false)

      store.toggle(todo!.id)
      const todos = store.getAll()
      expect(todos[0].completed).toBe(true)
    })

    it('should toggle completed from true to false', () => {
      const todo = store.add('Toggle test 2')
      expect(todo).not.toBeNull()

      // Toggle to true first
      store.toggle(todo!.id)
      expect(store.getAll()[0].completed).toBe(true)

      // Toggle back to false
      store.toggle(todo!.id)
      expect(store.getAll()[0].completed).toBe(false)
    })

    it('should throw Error for invalid ID', () => {
      expect(() => {
        store.toggle('non-existent-id')
      }).toThrow('Todo not found: non-existent-id')
    })

    it('should mutate internal state correctly', () => {
      const todo1 = store.add('Task 1')
      const todo2 = store.add('Task 2')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()

      store.toggle(todo1!.id)
      const todos = store.getAll()
      // todo2 is first (unshift), todo1 is second
      expect(todos[0].completed).toBe(false) // todo2
      expect(todos[1].completed).toBe(true) // todo1
    })
  })

  describe('deleteCompleted()', () => {
    it('should remove all completed todos', () => {
      const todo1 = store.add('Task 1')
      const todo2 = store.add('Task 2')
      const todo3 = store.add('Task 3')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()
      expect(todo3).not.toBeNull()

      // Mark todo1 and todo3 as completed
      store.toggle(todo1!.id)
      store.toggle(todo3!.id)

      store.deleteCompleted()
      const remainingTodos = store.getAll()
      expect(remainingTodos).toHaveLength(1)
      expect(remainingTodos[0].text).toBe('Task 2')
    })

    it('should preserve active todos unchanged', () => {
      const todo1 = store.add('Active 1')
      const todo2 = store.add('Active 2')
      const todo3 = store.add('Completed')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()
      expect(todo3).not.toBeNull()

      store.toggle(todo3!.id)
      store.deleteCompleted()

      const remainingTodos = store.getAll()
      expect(remainingTodos).toHaveLength(2)
      // Reversed order due to unshift: newest first
      expect(remainingTodos[0].text).toBe('Active 2')
      expect(remainingTodos[1].text).toBe('Active 1')
      expect(remainingTodos[0].completed).toBe(false)
      expect(remainingTodos[1].completed).toBe(false)
    })

    it('should return correct count of deleted todos', () => {
      const todo1 = store.add('Task 1')
      const todo2 = store.add('Task 2')
      const todo3 = store.add('Task 3')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()
      expect(todo3).not.toBeNull()

      store.toggle(todo1!.id)
      store.toggle(todo2!.id)

      const deletedCount = store.deleteCompleted()
      expect(deletedCount).toBe(2)
    })

    it('should return 0 for empty list', () => {
      const deletedCount = store.deleteCompleted()
      expect(deletedCount).toBe(0)
    })

    it('should return 0 when no completed todos exist', () => {
      store.add('Active 1')
      store.add('Active 2')
      const deletedCount = store.deleteCompleted()
      expect(deletedCount).toBe(0)
    })
  })

  describe('getAll()', () => {
    it('should return shallow copy preventing external mutation', () => {
      const todo = store.add('Test task')
      expect(todo).not.toBeNull()

      const todos = store.getAll()
      todos.push({
        id: 'fake-id',
        text: 'Fake todo',
        completed: false,
        createdAt: new Date().toISOString(),
      })

      // Internal array should not be affected
      const internalTodos = store.getAll()
      expect(internalTodos).toHaveLength(1)
      expect(internalTodos[0].text).toBe('Test task')
    })

    it('should return all todos in reverse order (newest first)', () => {
      store.add('First')
      store.add('Second')
      store.add('Third')

      const todos = store.getAll()
      expect(todos).toHaveLength(3)
      // Newest first due to unshift (FR42)
      expect(todos[0].text).toBe('Third')
      expect(todos[1].text).toBe('Second')
      expect(todos[2].text).toBe('First')
    })

    it('should return empty array for empty store', () => {
      const todos = store.getAll()
      expect(todos).toEqual([])
    })
  })

  describe('getActive()', () => {
    it('should filter only incomplete todos', () => {
      const todo1 = store.add('Active 1')
      const todo2 = store.add('Completed')
      const todo3 = store.add('Active 2')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()
      expect(todo3).not.toBeNull()

      store.toggle(todo2!.id)

      const activeTodos = store.getActive()
      expect(activeTodos).toHaveLength(2)
      // Newest first due to unshift
      expect(activeTodos[0].text).toBe('Active 2')
      expect(activeTodos[1].text).toBe('Active 1')
    })

    it('should return empty array if no active todos', () => {
      const todo1 = store.add('Completed 1')
      const todo2 = store.add('Completed 2')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()

      store.toggle(todo1!.id)
      store.toggle(todo2!.id)

      const activeTodos = store.getActive()
      expect(activeTodos).toEqual([])
    })
  })

  describe('getCompleted()', () => {
    it('should filter only completed todos', () => {
      const todo1 = store.add('Active')
      const todo2 = store.add('Completed 1')
      const todo3 = store.add('Completed 2')
      expect(todo1).not.toBeNull()
      expect(todo2).not.toBeNull()
      expect(todo3).not.toBeNull()

      store.toggle(todo2!.id)
      store.toggle(todo3!.id)

      const completedTodos = store.getCompleted()
      expect(completedTodos).toHaveLength(2)
      // Newest first due to unshift
      expect(completedTodos[0].text).toBe('Completed 2')
      expect(completedTodos[1].text).toBe('Completed 1')
    })

    it('should return empty array if no completed todos', () => {
      store.add('Active 1')
      store.add('Active 2')

      const completedTodos = store.getCompleted()
      expect(completedTodos).toEqual([])
    })
  })
})
