import type { Project } from '@/types/Project'

/**
 * ProjectStore manages the in-memory state of projects.
 *
 * This class provides CRUD operations (create, rename, delete) and
 * getter methods (getAll, findById, search) for managing project items.
 * It serves as the single source of truth for all project data.
 *
 * @example
 * ```typescript
 * const store = new ProjectStore('/path/to/projects.toon')
 * await store.load()
 * const project = store.create("My Project")
 * store.rename(project.id, "New Name")
 * const all = store.getAll()
 * ```
 */
export class ProjectStore {
  private _projects: Project[] = []
  private _filePath: string

  /**
   * Creates a new ProjectStore with the specified file path for persistence.
   *
   * @param filePath - Absolute path to the .toon file for loading/saving projects
   */
  constructor(filePath: string) {
    this._projects = []
    this._filePath = filePath
  }

  /**
   * Loads projects from disk using ToonStorage.
   *
   * Populates the internal _projects array with projects from the file.
   * If the file doesn't exist, loads an empty array (no error).
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await projectStore.load()
   * const projects = projectStore.getAll()
   * ```
   */
  async load(): Promise<void> {
    try {
      this._projects = await window.electron.loadProjects(this._filePath)
      console.log('Projects loaded', this._projects.length, this._filePath)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('Projects load: file not found or empty, starting fresh', errorMessage)
      this._projects = []
    }
  }

  /**
   * Saves projects to disk using ToonStorage (fire-and-forget pattern).
   *
   * Catches all errors internally and logs them without throwing.
   * This ensures save failures don't block UI or crash the app.
   * In-memory state is preserved even if save fails.
   *
   * @returns Promise<void> (never throws)
   *
   * @example
   * ```typescript
   * await projectStore.save()
   * ```
   */
  async save(): Promise<void> {
    try {
      await window.electron.saveProjects(this._filePath, this._projects)
      console.log('Projects saved', this._projects.length)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Projects save failed', errorMessage, this._projects.length)
      // No throw - silent failure with logging (fire-and-forget)
    }
  }

  /**
   * Creates a new project with the given name.
   *
   * Generates a UUID v4 for the id and ISO 8601 timestamp for createdAt.
   *
   * @param name - The project name
   * @returns The created Project object
   *
   * @example
   * ```typescript
   * const project = store.create("My Project")
   * console.log(project.id) // UUID v4
   * console.log(project.name) // "My Project"
   * ```
   */
  create = (name: string): Project => {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    const project: Project = {
      id,
      name,
      createdAt,
    }

    this._projects.push(project)

    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()

    return project
  }

  /**
   * Renames a project by ID.
   *
   * @param id - The UUID of the project to rename
   * @param newName - The new name for the project
   * @throws {Error} If the project with the given ID is not found
   *
   * @example
   * ```typescript
   * store.rename("550e8400-...", "New Name")
   * ```
   */
  rename = (id: string, newName: string): void => {
    const project = this.findById(id)

    if (!project) {
      throw new Error(`Project not found: ${id}`)
    }

    project.name = newName

    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()
  }

  /**
   * Deletes a project by ID.
   *
   * Also triggers deletion of associated todos file.
   * Cannot delete the last remaining project.
   *
   * @param id - The UUID of the project to delete
   * @throws {Error} If trying to delete the last project
   * @throws {Error} If the project with the given ID is not found
   *
   * @example
   * ```typescript
   * store.delete("550e8400-...")
   * ```
   */
  delete = (id: string): void => {
    if (this._projects.length <= 1) {
      throw new Error('Cannot delete last project')
    }

    const project = this.findById(id)

    if (!project) {
      throw new Error(`Project not found: ${id}`)
    }

    this._projects = this._projects.filter((p) => p.id !== id)

    // Delete associated todos file (fire-and-forget)
    window.electron.deleteTodosFile(id).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to delete todos file', id, errorMessage)
    })

    // Fire-and-forget auto-save (no await - non-blocking)
    this.save()
  }

  /**
   * Gets all projects as a shallow copy.
   *
   * Returns a new array to prevent external mutation of the internal _projects array.
   *
   * @returns A shallow copy of all projects
   *
   * @example
   * ```typescript
   * const projects = store.getAll()
   * ```
   */
  getAll = (): Project[] => {
    return [...this._projects]
  }

  /**
   * Finds a project by ID.
   *
   * @param id - The UUID of the project to find
   * @returns The project if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const project = store.findById("550e8400-...")
   * if (project) console.log(project.name)
   * ```
   */
  findById = (id: string): Project | undefined => {
    return this._projects.find((p) => p.id === id)
  }

  /**
   * Searches projects by name (case-insensitive).
   *
   * @param query - The search query string
   * @returns Projects whose names contain the query (case-insensitive)
   *
   * @example
   * ```typescript
   * const results = store.search("work")
   * // Returns projects with "Work", "WORK", "homework" etc.
   * ```
   */
  search = (query: string): Project[] => {
    if (!query) {
      return [...this._projects]
    }

    const lowerQuery = query.toLowerCase()
    return this._projects.filter((p) => p.name.toLowerCase().includes(lowerQuery))
  }
}
