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
  private _filePath: string

  /**
   * Creates a new TodoStore with the specified file path for persistence.
   *
   * @param filePath - Absolute path to the .toon file for loading/saving todos
   */
  constructor(filePath: string) {
    this._todos = []
    this._filePath = filePath
  }

  /**
   * Loads todos from disk using ToonStorage.
   *
   * Populates the internal _todos array with todos from the file.
   * If the file doesn't exist, loads an empty array (no error).
   * If the file is corrupt, throws error to caller for handling.
   *
   * @returns Promise<void>
   * @throws Error if file is corrupt or unreadable
   *
   * @example
   * ```typescript
   * await todoStore.load()
   * const todos = todoStore.getAll() // Todos loaded from disk
   * ```
   */
  async load(): Promise<void> {
    this._todos = await window.electron.loadTodos(this._filePath)
    console.log('Todos loaded', this._todos.length, this._filePath)
  }

  /**
   * Saves todos to disk using ToonStorage (fire-and-forget pattern).
   *
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
      await window.electron.saveTodos(this._filePath, this._todos)
      console.log('Todos saved', this._todos.length)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Save failed', errorMessage, this._todos.length)
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

    this._todos.push(todo)

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
