import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'
import { ToonStorage } from './storage'
import type { Project } from '../src/types/Project'
import type { AppSettings, WindowBounds } from '../src/types/Settings'

/**
 * MigrationResult represents the outcome of a migration attempt.
 */
export type MigrationResult =
  | { status: 'success'; projectId: string }
  | { status: 'skipped'; reason: 'not-needed' | 'already-migrated' | 'fresh-install' }
  | { status: 'error'; error: Error }

/** Default window bounds for new installations */
const DEFAULT_WINDOW_BOUNDS: WindowBounds = {
  x: 100,
  y: 100,
  width: 600,
  height: 400,
}

/**
 * Checks if a file exists at the given path.
 */
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if migration from v1 to v2 format is needed.
 *
 * Migration is needed when:
 * - todos.toon exists (v1 format present)
 * - projects.toon does NOT exist (v2 format not present)
 *
 * @param basePath - The userData directory path
 * @returns true if migration is needed, false otherwise
 */
export const needsMigration = async (basePath: string): Promise<boolean> => {
  const todosPath = path.join(basePath, 'todos.toon')
  const projectsPath = path.join(basePath, 'projects.toon')

  const hasTodos = await fileExists(todosPath)
  const hasProjects = await fileExists(projectsPath)

  const migrationNeeded = hasTodos && !hasProjects

  log.info('Migration check', {
    hasTodos,
    hasProjects,
    migrationNeeded,
  })

  return migrationNeeded
}

/**
 * Migrates data from v1 (single todos.toon file) to v2 (multi-file structure).
 *
 * Migration steps:
 * 1. Detect v1 format (todos.toon exists, projects.toon doesn't)
 * 2. Create backup of todos.toon
 * 3. Create Default project with new UUID
 * 4. Rename todos.toon to todos-{projectId}.toon
 * 5. Create projects.toon with Default project
 * 6. Create settings.toon with activeProjectId
 *
 * @param basePath - The userData directory path
 * @returns MigrationResult indicating success, skip, or error
 */
export const migrateIfNeeded = async (basePath: string): Promise<MigrationResult> => {
  const todosPath = path.join(basePath, 'todos.toon')
  const projectsPath = path.join(basePath, 'projects.toon')
  const settingsPath = path.join(basePath, 'settings.toon')
  const backupPath = path.join(basePath, 'todos.toon.backup')

  // Step 1: Check if migration is needed
  const hasTodos = await fileExists(todosPath)
  const hasProjects = await fileExists(projectsPath)

  // Fresh install - no files exist
  if (!hasTodos && !hasProjects) {
    log.info('Migration skipped: fresh install (no todos.toon)')
    return { status: 'skipped', reason: 'fresh-install' }
  }

  // Already migrated - projects.toon exists
  if (hasProjects) {
    log.info('Migration skipped: already migrated (projects.toon exists)')
    return { status: 'skipped', reason: 'already-migrated' }
  }

  // Migration not needed - no old format
  if (!hasTodos) {
    log.info('Migration skipped: not needed (no todos.toon)')
    return { status: 'skipped', reason: 'not-needed' }
  }

  // Migration is needed
  log.info('Migration started', { basePath, hasTodos, hasProjects })

  try {
    // Step 2: Create backup FIRST (before any changes)
    await fs.copyFile(todosPath, backupPath)
    log.info('Backup created', { from: todosPath, to: backupPath })

    // Step 3: Create Default project
    const defaultProject: Project = {
      id: crypto.randomUUID(),
      name: 'Default',
      createdAt: new Date().toISOString(),
    }
    log.info('Default project created', { id: defaultProject.id, name: defaultProject.name })

    // Step 4: Rename todos.toon to todos-{projectId}.toon
    const newTodosPath = path.join(basePath, `todos-${defaultProject.id}.toon`)
    await fs.rename(todosPath, newTodosPath)
    log.info('Todos file renamed', { from: 'todos.toon', to: `todos-${defaultProject.id}.toon` })

    // Step 5: Create projects.toon with Default project
    await ToonStorage.saveProjects(projectsPath, [defaultProject])
    log.info('Projects file created', { path: projectsPath })

    // Step 6: Create settings.toon with activeProjectId
    const defaultSettings: AppSettings = {
      activeProjectId: defaultProject.id,
      windowBounds: DEFAULT_WINDOW_BOUNDS,
      version: '1.0',
    }
    await ToonStorage.saveSettings(settingsPath, defaultSettings)
    log.info('Settings file created', { path: settingsPath, activeProjectId: defaultProject.id })

    // Migration completed successfully
    log.warn('Migration completed successfully', {
      backupPath,
      projectId: defaultProject.id,
      projectName: defaultProject.name,
    })

    return { status: 'success', projectId: defaultProject.id }
  } catch (error) {
    // On any error: preserve original todos.toon (do NOT delete or modify it further)
    // Backup file is preserved if it was created
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    log.error('Migration failed', {
      error: errorMessage,
      basePath,
      stack: error instanceof Error ? error.stack : undefined,
    })

    return { status: 'error', error: error instanceof Error ? error : new Error(errorMessage) }
  }
}
