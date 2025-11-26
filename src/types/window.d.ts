import type { Todo } from './Todo'
import type { Project } from './Project'
import type { UpdateStatus } from './UpdateStatus'

export interface ElectronAPI {
  getTodosPath: () => Promise<string>
  loadTodos: (filePath: string) => Promise<Todo[]>
  saveTodos: (filePath: string, todos: Todo[]) => Promise<void>
  getAppVersion: () => Promise<string>
  // Project-related methods (Story 7.2) - will be implemented in Story 7.4
  loadProjects: (filePath: string) => Promise<Project[]>
  saveProjects: (filePath: string, projects: Project[]) => Promise<void>
  deleteTodosFile: (projectId: string) => Promise<void>
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
