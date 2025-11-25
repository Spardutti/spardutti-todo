import { describe, it, expect } from 'vitest'
import type { Project } from '@/types/Project'

describe('Project interface', () => {
  describe('type exports', () => {
    it('should allow creating a valid Project object', () => {
      const project: Project = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'SequenceStack',
        createdAt: '2025-11-25T10:00:00.000Z',
      }

      expect(project.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(project.name).toBe('SequenceStack')
      expect(project.createdAt).toBe('2025-11-25T10:00:00.000Z')
    })

    it('should have all required properties', () => {
      const project: Project = {
        id: 'test-id',
        name: 'Test Project',
        createdAt: new Date().toISOString(),
      }

      // Verify all properties exist
      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('name')
      expect(project).toHaveProperty('createdAt')
    })
  })

  describe('interface shape', () => {
    it('should accept UUID v4 format for id', () => {
      const project: Project = {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        name: 'Test',
        createdAt: '2025-11-25T10:00:00.000Z',
      }

      expect(project.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should accept ISO 8601 format for createdAt', () => {
      const project: Project = {
        id: 'test-id',
        name: 'Test',
        createdAt: '2025-11-25T10:00:00.000Z',
      }

      expect(project.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    it('should accept unicode characters in name', () => {
      const project: Project = {
        id: 'test-id',
        name: 'Proyecto con Eaes',
        createdAt: '2025-11-25T10:00:00.000Z',
      }

      expect(project.name).toBe('Proyecto con Eaes')
    })
  })
})
