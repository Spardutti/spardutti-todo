import type { Todo } from './Todo'
import type { Project } from './Project'
import type { UpdateStatus } from './UpdateStatus'
import type { AppSettings } from './Settings'

export interface MigrationResult {
  success: boolean
  projectId?: string
  error?: string
}

export interface ElectronAPI {
  // Path getters
  getTodosPath: () => Promise<string>
  getProjectsPath: () => Promise<string>
  getSettingsPath: () => Promise<string>

  // Todo operations
  loadTodos: (filePath: string) => Promise<Todo[]>
  saveTodos: (filePath: string, todos: Todo[]) => Promise<void>
  deleteTodosFile: (projectId: string) => Promise<void>

  // Project operations
  loadProjects: (filePath: string) => Promise<Project[]>
  saveProjects: (filePath: string, projects: Project[]) => Promise<void>

  // Settings operations
  loadSettings: (filePath: string) => Promise<AppSettings>
  saveSettings: (filePath: string, settings: AppSettings) => Promise<void>

  // Migration operations
  checkMigrationNeeded: () => Promise<boolean>
  runMigration: () => Promise<MigrationResult>

  // App info
  getAppVersion: () => Promise<string>
}

export interface UpdaterAPI {
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void
  checkForUpdates: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    updater: UpdaterAPI
  }
}
