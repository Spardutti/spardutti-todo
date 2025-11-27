import type { Todo } from '@/types/Todo'
import { displayError } from '@/ui/render'

/**
 * TodoStore manages the in-memory state of todos.
 *
 * This class provides CRUD operations (add, toggle, deleteCompleted) and
 * getter methods (getAll, getActive, getCompleted) for managing todo items.
 * It serves as the single source of truth for all todo data.
 *
 * @example
 * ```typescript
 * const store = new TodoStore()
 * const todo = store.add("Buy groceries")
 * store.toggle(todo.id)
 * const allTodos = store.getAll()
 * ```
 */
export class TodoStore {
  private _todos: Todo[] = []
  private _projectId: string

  /**
   * Creates a new TodoStore for managing todos scoped to a specific project.
   *
   * The store starts empty - call load(projectId) to load a project's todos.
   */
  constructor() {
    this._todos = []
    this._projectId = ''
  }

  /**
   * Loads todos for a specific project from disk.
   *
   * Clears any existing todos in memory before loading.
   * Stores the projectId for subsequent save operations.
   * If the file doesn't exist, loads an empty array (no error).
   * If the file is corrupt, throws error to caller for handling.
   *
   * @param projectId - The UUID of the project to load todos for
   * @returns Promise<void>
   * @throws Error if file is corrupt or unreadable
   *
   * @example
   * ```typescript
   * await todoStore.load('550e8400-e29b-41d4-a716-446655440000')
   * const todos = todoStore.getAll() // Todos loaded from disk for this project
   * ```
   */
  async load(projectId: string): Promise<void> {
    // Clear existing todos before loading new project
    this._todos = []
    this._projectId = projectId

    const basePath = await window.electron.getTodosPath()
    const filePath = basePath.replace('todos.toon', `todos-${projectId}.toon`)

    this._todos = await window.electron.loadTodos(filePath)
    console.log('Todos loaded for project', this._todos.length, projectId)
  }

  /**
   * Saves todos to disk using ToonStorage (fire-and-forget pattern).
   *
   * Saves to the file for the currently loaded project (todos-{projectId}.toon).
   * Catches all errors internally and logs them without throwing.
   * This ensures save failures don't block UI or crash the app.
   * In-memory state is preserved even if save fails.
   *
   * @returns Promise<void> (never throws)
   *
   * @example
   * ```typescript
   * await todoStore.save() // Saves to disk, logs errors if any
   * ```
   */
  async save(): Promise<void> {
    try {
      const basePath = await window.electron.getTodosPath()
      const filePath = basePath.replace('todos.toon', `todos-${this._projectId}.toon`)

      await window.electron.saveTodos(filePath, this._todos)
      console.log('Todos saved for project', this._todos.length, this._projectId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Save failed', errorMessage, this._todos.length, this._projectId)
      displayError('Failed to save. Try again.', 5000)
      // No throw - silent failure with logging and user feedback
    }
  }

  /**
   * Adds a new todo with the given text.
   *
   * Generates a UUID v4 for the id and ISO 8601 timestamp for createdAt.
   * Sets completed to false by default.
   *
   * @param text - The todo description text
   * @returns The created Todo object, or null if text is empty/whitespace
   *
   * @example
   * ```typescript
   * const todo = store.add("Buy groceries")
   * console.log(todo.id) // "550e8400-e29b-41d4-a716-446655440000"
   * console.log(todo.completed) // false
   * ```
   */
  add(text: string): Todo | null {
    const trimmedText = text.trim()
    if (!trimmedText) {
      return null
    }

    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    const todo: Todo = {
      id,
      text: trimmedText,
      completed: false,
      createdAt,
    }

    // Add to top of list (unshift) - FR42: New todos appear at top
    this._todos.unshift(todo)

    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()

    return todo
  }

  /**
   * Toggles the completion status of a todo by ID.
   *
   * Flips the completed boolean from false to true or true to false.
   *
   * @param id - The UUID of the todo to toggle
   * @throws {Error} If the todo with the given ID is not found
   *
   * @example
   * ```typescript
   * store.toggle("550e8400-e29b-41d4-a716-446655440000")
   * ```
   */
  toggle(id: string): void {
    const todo = this._todos.find((t) => t.id === id)

    if (!todo) {
      throw new Error(`Todo not found: ${id}`)
    }

    todo.completed = !todo.completed

    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()
  }

  /**
   * Deletes all completed todos.
   *
   * Removes todos where completed === true and preserves active todos.
   *
   * @returns The number of todos deleted
   *
   * @example
   * ```typescript
   * const deletedCount = store.deleteCompleted()
   * console.log(`Deleted ${deletedCount} todos`)
   * ```
   */
  deleteCompleted(): number {
    const beforeCount = this._todos.length
    this._todos = this._todos.filter((t) => !t.completed)
    const afterCount = this._todos.length

    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()

    return beforeCount - afterCount
  }

  /**
   * Gets all todos as a shallow copy.
   *
   * Returns a new array to prevent external mutation of the internal _todos array.
   *
   * @returns A shallow copy of all todos
   *
   * @example
   * ```typescript
   * const todos = store.getAll()
   * console.log(todos.length) // 5
   * ```
   */
  getAll(): Todo[] {
    return [...this._todos]
  }

  /**
   * Gets only active (incomplete) todos.
   *
   * @returns Array of todos where completed === false
   *
   * @example
   * ```typescript
   * const activeTodos = store.getActive()
   * ```
   */
  getActive(): Todo[] {
    return this._todos.filter((t) => !t.completed)
  }

  /**
   * Gets only completed todos.
   *
   * @returns Array of todos where completed === true
   *
   * @example
   * ```typescript
   * const completedTodos = store.getCompleted()
   * ```
   */
  getCompleted(): Todo[] {
    return this._todos.filter((t) => t.completed)
  }
}
