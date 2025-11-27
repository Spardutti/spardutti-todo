import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'
import type { Todo } from '../src/types/Todo'
import type { Project } from '../src/types/Project'
import type { AppSettings, WindowBounds } from '../src/types/Settings'

/** Default window bounds used when settings file doesn't exist */
const DEFAULT_WINDOW_BOUNDS: WindowBounds = { x: 100, y: 100, width: 600, height: 400 }

/** Default app settings used when settings file doesn't exist */
const DEFAULT_SETTINGS: AppSettings = {
  activeProjectId: '',
  windowBounds: DEFAULT_WINDOW_BOUNDS,
  version: '1.0'
}

/**
 * ToonStorage for main process - handles file I/O operations
 */
export class ToonStorage {
  static async load(filePath: string): Promise<Todo[]> {
    try {
      const toonString = await fs.readFile(filePath, 'utf-8')

      // Try to decode the TOON content
      try {
        return ToonStorage.decode(toonString)
      } catch (decodeError) {
        // Corrupt file detected - backup and throw
        const backupPath = `${filePath}.corrupt.${Date.now()}`

        try {
          await fs.rename(filePath, backupPath)
          log.error('Corrupt file', {
            error: decodeError instanceof Error ? decodeError.message : 'Unknown error',
            path: filePath,
            backupPath
          })
        } catch (backupError) {
          // If backup fails, log it but still throw decode error
          log.error('Failed to backup corrupt file', {
            error: backupError instanceof Error ? backupError.message : 'Unknown error',
            path: filePath
          })
        }

        throw new Error(`Corrupt file backed up to ${backupPath}`)
      }
    } catch (error) {
      // Handle missing file (ENOENT) - return empty array
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        log.info('No todos file found, starting fresh', { path: filePath })
        return []
      }

      // Re-throw all other errors (including corrupt file errors)
      throw error
    }
  }

  static async save(filePath: string, todos: Todo[]): Promise<void> {
    const toonString = ToonStorage.encode(todos)
    const dirPath = path.dirname(filePath)
    await fs.mkdir(dirPath, { recursive: true })
    await fs.writeFile(filePath, toonString, 'utf-8')
  }

  static encode(todos: Todo[]): string {
    const count = todos.length
    const fields = 'id,text,completed,createdAt'
    const header = `todos[${count}]{${fields}}:`

    const rows = todos.map(todo => {
      const textEscaped = todo.text.includes(',') || todo.text.includes('"') || todo.text.includes('\n')
        ? `"${todo.text.replace(/"/g, '""')}"`
        : todo.text

      return `  ${todo.id},${textEscaped},${String(todo.completed)},${todo.createdAt}`
    }).join('\n')

    return rows.length > 0
      ? `${header}\n${rows}\n\nversion: 1.0`
      : `${header}\n\nversion: 1.0`
  }

  static decode(toonString: string): Todo[] {
    try {
      const contentWithoutVersion = toonString.split('\n\nversion:')[0].trim()
      const lines = contentWithoutVersion.split('\n')

      if (lines.length === 0) {
        throw new Error('Empty TOON content')
      }

      const headerLine = lines[0]
      if (!headerLine.includes('todos[') || !headerLine.includes('{id,text,completed,createdAt}:')) {
        throw new Error('Invalid TOON header format')
      }

      const dataLines = lines.slice(1).filter(line => line.trim().length > 0)

      if (dataLines.length === 0) {
        return []
      }

      const todos: Todo[] = dataLines.map((line, index) => {
        const trimmedLine = line.trim()
        const fields = ToonStorage.parseCSVRow(trimmedLine)

        if (fields.length !== 4) {
          throw new Error(`Invalid TOON row ${index}: expected 4 fields, got ${fields.length}`)
        }

        const [id, text, completedStr, createdAt] = fields

        if (!id || !text || !completedStr || !createdAt) {
          throw new Error(`Invalid TOON row ${index}: missing required field`)
        }

        const completed = completedStr === 'true'

        return { id, text, completed, createdAt }
      })

      return todos
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode TOON format: ${error.message}`)
      }
      throw new Error('Failed to decode TOON format: Unknown error')
    }
  }

  private static parseCSVRow(row: string): string[] {
    const fields: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      const nextChar = row[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField)
        currentField = ''
      } else {
        currentField += char
      }
    }

    fields.push(currentField)
    return fields
  }

  // ========== Todo Methods with projectId ==========

  /**
   * Load todos for a specific project
   * @param basePath - The userData directory path
   * @param projectId - The project ID (used in filename)
   */
  static async loadTodos(basePath: string, projectId: string): Promise<Todo[]> {
    const filePath = path.join(basePath, `todos-${projectId}.toon`)
    return ToonStorage.load(filePath)
  }

  /**
   * Save todos for a specific project
   * @param basePath - The userData directory path
   * @param projectId - The project ID (used in filename)
   * @param todos - The todos array to save
   */
  static async saveTodos(basePath: string, projectId: string, todos: Todo[]): Promise<void> {
    const filePath = path.join(basePath, `todos-${projectId}.toon`)
    return ToonStorage.save(filePath, todos)
  }

  // ========== Project Methods ==========

  static async loadProjects(filePath: string): Promise<Project[]> {
    try {
      const toonString = await fs.readFile(filePath, 'utf-8')
      return ToonStorage.decodeProjects(toonString)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        log.info('No projects file found, starting fresh', { path: filePath })
        return []
      }
      throw error
    }
  }

  static async saveProjects(filePath: string, projects: Project[]): Promise<void> {
    const toonString = ToonStorage.encodeProjects(projects)
    const dirPath = path.dirname(filePath)
    await fs.mkdir(dirPath, { recursive: true })
    await fs.writeFile(filePath, toonString, 'utf-8')
  }

  static encodeProjects(projects: Project[]): string {
    const count = projects.length
    const fields = 'id,name,createdAt'
    const header = `projects[${count}]{${fields}}:`

    const rows = projects.map(project => {
      const nameEscaped = project.name.includes(',') || project.name.includes('"') || project.name.includes('\n')
        ? `"${project.name.replace(/"/g, '""')}"`
        : project.name
      return `  ${project.id},${nameEscaped},${project.createdAt}`
    }).join('\n')

    return rows.length > 0
      ? `${header}\n${rows}\n\nversion: 2.0`
      : `${header}\n\nversion: 2.0`
  }

  static decodeProjects(toonString: string): Project[] {
    try {
      const contentWithoutVersion = toonString.split('\n\nversion:')[0].trim()
      const lines = contentWithoutVersion.split('\n')

      if (lines.length === 0) {
        throw new Error('Empty TOON content')
      }

      const headerLine = lines[0]
      if (!headerLine.includes('projects[') || !headerLine.includes('{id,name,createdAt}:')) {
        throw new Error('Invalid TOON header format for projects')
      }

      const dataLines = lines.slice(1).filter(line => line.trim().length > 0)
      if (dataLines.length === 0) return []

      return dataLines.map((line, index) => {
        const fields = ToonStorage.parseCSVRow(line.trim())
        if (fields.length !== 3) {
          throw new Error(`Invalid TOON row ${index}: expected 3 fields, got ${fields.length}`)
        }
        const [id, name, createdAt] = fields
        if (!id || !name || !createdAt) {
          throw new Error(`Invalid TOON row ${index}: missing required field`)
        }
        return { id, name, createdAt }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode projects TOON format: ${error.message}`)
      }
      throw new Error('Failed to decode projects TOON format: Unknown error')
    }
  }

  // ========== Settings Methods ==========

  static async loadSettings(filePath: string): Promise<AppSettings> {
    try {
      const toonString = await fs.readFile(filePath, 'utf-8')
      return ToonStorage.decodeSettings(toonString)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        log.info('No settings file found, using defaults', { path: filePath })
        return { ...DEFAULT_SETTINGS }
      }
      throw error
    }
  }

  static async saveSettings(filePath: string, settings: AppSettings): Promise<void> {
    const toonString = ToonStorage.encodeSettings(settings)
    const dirPath = path.dirname(filePath)
    await fs.mkdir(dirPath, { recursive: true })
    await fs.writeFile(filePath, toonString, 'utf-8')
  }

  static encodeSettings(settings: AppSettings): string {
    const { activeProjectId, windowBounds, version } = settings
    const { x, y, width, height } = windowBounds
    return `activeProjectId: ${activeProjectId}\nwindowBounds{x,y,width,height}: ${x},${y},${width},${height}\nversion: ${version}`
  }

  static decodeSettings(toonString: string): AppSettings {
    try {
      const lines = toonString.trim().split('\n')
      let activeProjectId = ''
      let windowBounds: WindowBounds = { ...DEFAULT_WINDOW_BOUNDS }
      let version = '1.0'

      for (const line of lines) {
        if (line.startsWith('activeProjectId:')) {
          activeProjectId = line.split(':').slice(1).join(':').trim()
        } else if (line.startsWith('windowBounds{x,y,width,height}:')) {
          const boundsStr = line.split(':').slice(1).join(':').trim()
          const [x, y, w, h] = boundsStr.split(',').map(Number)
          if ([x, y, w, h].some(isNaN)) {
            throw new Error('Invalid windowBounds values')
          }
          windowBounds = { x, y, width: w, height: h }
        } else if (line.startsWith('version:')) {
          version = line.split(':').slice(1).join(':').trim()
        }
      }

      return { activeProjectId, windowBounds, version }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode settings TOON format: ${error.message}`)
      }
      throw new Error('Failed to decode settings TOON format: Unknown error')
    }
  }

  // ========== Todo File Delete Method ==========

  static async deleteTodosFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
      log.info('Deleted todos file', { path: filePath })
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        log.info('Todos file does not exist, nothing to delete', { path: filePath })
        return
      }
      throw error
    }
  }
}
