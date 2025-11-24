import type { Todo } from './Todo'

export interface ElectronAPI {
  getTodosPath: () => Promise<string>
  loadTodos: (filePath: string) => Promise<Todo[]>
  saveTodos: (filePath: string, todos: Todo[]) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
