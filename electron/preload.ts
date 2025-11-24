// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'
import type { Todo } from '../src/types/Todo'

// Expose safe API to renderer process
contextBridge.exposeInMainWorld('electron', {
  getTodosPath: () => ipcRenderer.invoke('get-todos-path'),
  loadTodos: (filePath: string) => ipcRenderer.invoke('load-todos', filePath),
  saveTodos: (filePath: string, todos: Todo[]) => ipcRenderer.invoke('save-todos', filePath, todos)
})
