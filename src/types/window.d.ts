import type { Todo } from './Todo'
import type { UpdateStatus } from './UpdateStatus'

export interface ElectronAPI {
  getTodosPath: () => Promise<string>
  loadTodos: (filePath: string) => Promise<Todo[]>
  saveTodos: (filePath: string, todos: Todo[]) => Promise<void>
}

export interface UpdaterAPI {
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    updater: UpdaterAPI
  }
}
