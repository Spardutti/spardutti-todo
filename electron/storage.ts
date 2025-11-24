import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'
import type { Todo } from '../src/types/Todo'

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
}
