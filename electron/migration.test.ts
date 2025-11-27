import { describe, it, expect, beforeEach, vi } from 'vitest'
import path from 'path'

// Mock electron-log before importing migration
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock fs module
vi.mock('fs', () => {
  const mockFs = {
    access: vi.fn(),
    copyFile: vi.fn(),
    rename: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  }
  return {
    default: { promises: mockFs },
    promises: mockFs,
  }
})

// Mock crypto.randomUUID
const mockUUID = '550e8400-e29b-41d4-a716-446655440000'
vi.stubGlobal('crypto', { randomUUID: () => mockUUID })

// Import after mocks are set up
import { migrateIfNeeded, needsMigration } from './migration'
import { promises as fs } from 'fs'
import log from 'electron-log'

// Create typed reference to mocked fs
const mockFs = vi.mocked(fs)
const mockLog = vi.mocked(log)

describe('migration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Date mock
    vi.useRealTimers()
  })

  describe('needsMigration', () => {
    it('should return true when todos.toon exists and projects.toon does not', async () => {
      mockFs.access
        .mockResolvedValueOnce(undefined) // todos.toon exists
        .mockRejectedValueOnce(new Error('ENOENT')) // projects.toon doesn't exist

      const result = await needsMigration('/test/data')

      expect(result).toBe(true)
      expect(mockLog.info).toHaveBeenCalledWith('Migration check', {
        hasTodos: true,
        hasProjects: false,
        migrationNeeded: true,
      })
    })

    it('should return false when projects.toon exists (already migrated)', async () => {
      mockFs.access
        .mockResolvedValueOnce(undefined) // todos.toon exists
        .mockResolvedValueOnce(undefined) // projects.toon exists

      const result = await needsMigration('/test/data')

      expect(result).toBe(false)
      expect(mockLog.info).toHaveBeenCalledWith('Migration check', {
        hasTodos: true,
        hasProjects: true,
        migrationNeeded: false,
      })
    })

    it('should return false when no files exist (fresh install)', async () => {
      mockFs.access
        .mockRejectedValueOnce(new Error('ENOENT')) // todos.toon doesn't exist
        .mockRejectedValueOnce(new Error('ENOENT')) // projects.toon doesn't exist

      const result = await needsMigration('/test/data')

      expect(result).toBe(false)
      expect(mockLog.info).toHaveBeenCalledWith('Migration check', {
        hasTodos: false,
        hasProjects: false,
        migrationNeeded: false,
      })
    })
  })

  describe('migrateIfNeeded', () => {
    describe('when migration is not needed', () => {
      it('should return skipped:fresh-install when no files exist', async () => {
        mockFs.access.mockRejectedValue(new Error('ENOENT'))

        const result = await migrateIfNeeded('/test/data')

        expect(result).toEqual({ status: 'skipped', reason: 'fresh-install' })
        expect(mockLog.info).toHaveBeenCalledWith(
          'Migration skipped: fresh install (no todos.toon)'
        )
        expect(mockFs.copyFile).not.toHaveBeenCalled()
      })

      it('should return skipped:already-migrated when projects.toon exists', async () => {
        mockFs.access
          .mockResolvedValueOnce(undefined) // todos.toon exists
          .mockResolvedValueOnce(undefined) // projects.toon exists

        const result = await migrateIfNeeded('/test/data')

        expect(result).toEqual({ status: 'skipped', reason: 'already-migrated' })
        expect(mockLog.info).toHaveBeenCalledWith(
          'Migration skipped: already migrated (projects.toon exists)'
        )
        expect(mockFs.copyFile).not.toHaveBeenCalled()
      })
    })

    describe('when migration is needed', () => {
      beforeEach(() => {
        // todos.toon exists, projects.toon doesn't
        mockFs.access
          .mockResolvedValueOnce(undefined) // todos.toon exists
          .mockRejectedValueOnce(new Error('ENOENT')) // projects.toon doesn't exist

        // All file operations succeed by default
        mockFs.copyFile.mockResolvedValue(undefined)
        mockFs.rename.mockResolvedValue(undefined)
        mockFs.mkdir.mockResolvedValue(undefined)
        mockFs.writeFile.mockResolvedValue(undefined)

        // Mock timestamp
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-11-25T10:00:00.000Z'))
      })

      it('should create backup before any changes', async () => {
        const result = await migrateIfNeeded('/test/data')

        expect(result.status).toBe('success')
        expect(mockFs.copyFile).toHaveBeenCalledWith(
          path.join('/test/data', 'todos.toon'),
          path.join('/test/data', 'todos.toon.backup')
        )
        // Verify backup is created before other operations
        const copyCallOrder = mockFs.copyFile.mock.invocationCallOrder[0]
        const renameCallOrder = mockFs.rename.mock.invocationCallOrder[0]
        expect(copyCallOrder).toBeLessThan(renameCallOrder)
      })

      it('should create correct file structure after migration', async () => {
        const result = await migrateIfNeeded('/test/data')

        expect(result).toEqual({ status: 'success', projectId: mockUUID })

        // Verify rename of todos.toon to todos-{projectId}.toon
        expect(mockFs.rename).toHaveBeenCalledWith(
          path.join('/test/data', 'todos.toon'),
          path.join('/test/data', `todos-${mockUUID}.toon`)
        )

        // Verify projects.toon created with Default project
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          path.join('/test/data', 'projects.toon'),
          expect.stringContaining('projects[1]{id,name,createdAt}:'),
          'utf-8'
        )
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          path.join('/test/data', 'projects.toon'),
          expect.stringContaining(mockUUID),
          'utf-8'
        )
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          path.join('/test/data', 'projects.toon'),
          expect.stringContaining('Default'),
          'utf-8'
        )

        // Verify settings.toon created with activeProjectId
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          path.join('/test/data', 'settings.toon'),
          expect.stringContaining(`activeProjectId: ${mockUUID}`),
          'utf-8'
        )
      })

      it('should be idempotent - second call is no-op', async () => {
        // First call - migration happens
        const result1 = await migrateIfNeeded('/test/data')
        expect(result1.status).toBe('success')

        vi.clearAllMocks()

        // After first migration, projects.toon now exists
        mockFs.access
          .mockResolvedValueOnce(undefined) // todos.toon - doesn't exist after rename
          .mockResolvedValueOnce(undefined) // projects.toon - now exists

        // Second call - should skip
        const result2 = await migrateIfNeeded('/test/data')
        expect(result2).toEqual({ status: 'skipped', reason: 'already-migrated' })
        expect(mockFs.copyFile).not.toHaveBeenCalled()
      })

      it('should log all steps with electron-log', async () => {
        await migrateIfNeeded('/test/data')

        // Verify logging
        expect(mockLog.info).toHaveBeenCalledWith('Migration started', expect.any(Object))
        expect(mockLog.info).toHaveBeenCalledWith('Backup created', expect.any(Object))
        expect(mockLog.info).toHaveBeenCalledWith('Default project created', expect.any(Object))
        expect(mockLog.info).toHaveBeenCalledWith('Todos file renamed', expect.any(Object))
        expect(mockLog.info).toHaveBeenCalledWith('Projects file created', expect.any(Object))
        expect(mockLog.info).toHaveBeenCalledWith('Settings file created', expect.any(Object))
        expect(mockLog.warn).toHaveBeenCalledWith(
          'Migration completed successfully',
          expect.objectContaining({
            backupPath: path.join('/test/data', 'todos.toon.backup'),
            projectId: mockUUID,
          })
        )
      })
    })

    describe('error handling', () => {
      beforeEach(() => {
        // todos.toon exists, projects.toon doesn't
        mockFs.access
          .mockResolvedValueOnce(undefined) // todos.toon exists
          .mockRejectedValueOnce(new Error('ENOENT')) // projects.toon doesn't exist
      })

      it('should preserve original on backup failure', async () => {
        const backupError = new Error('Disk full')
        mockFs.copyFile.mockRejectedValue(backupError)

        const result = await migrateIfNeeded('/test/data')

        expect(result).toEqual({ status: 'error', error: backupError })
        expect(mockLog.error).toHaveBeenCalledWith(
          'Migration failed',
          expect.objectContaining({ error: 'Disk full' })
        )
        // Should not attempt rename or file creation
        expect(mockFs.rename).not.toHaveBeenCalled()
        expect(mockFs.writeFile).not.toHaveBeenCalled()
      })

      it('should preserve original on rename failure', async () => {
        mockFs.copyFile.mockResolvedValue(undefined)
        const renameError = new Error('Permission denied')
        mockFs.rename.mockRejectedValue(renameError)

        const result = await migrateIfNeeded('/test/data')

        expect(result).toEqual({ status: 'error', error: renameError })
        expect(mockLog.error).toHaveBeenCalledWith(
          'Migration failed',
          expect.objectContaining({ error: 'Permission denied' })
        )
        // Backup should have been created
        expect(mockFs.copyFile).toHaveBeenCalled()
        // Should not create new files
        expect(mockFs.writeFile).not.toHaveBeenCalled()
      })

      it('should preserve original on projects.toon save failure', async () => {
        mockFs.copyFile.mockResolvedValue(undefined)
        mockFs.rename.mockResolvedValue(undefined)
        mockFs.mkdir.mockResolvedValue(undefined)
        const saveError = new Error('Write failed')
        mockFs.writeFile.mockRejectedValue(saveError)

        const result = await migrateIfNeeded('/test/data')

        expect(result).toEqual({ status: 'error', error: saveError })
        expect(mockLog.error).toHaveBeenCalledWith(
          'Migration failed',
          expect.objectContaining({ error: 'Write failed' })
        )
      })
    })
  })
})
