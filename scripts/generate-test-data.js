#!/usr/bin/env node

/**
 * Test Data Generator for spardutti-todo
 *
 * Usage:
 *   node scripts/generate-test-data.js <count> [output-path]
 *
 * Examples:
 *   node scripts/generate-test-data.js 100
 *   node scripts/generate-test-data.js 1000 ./test-data/todos-1000.toon
 *
 * Generates TOON format files with specified number of todos.
 * Default output: ./test-data/todos-<count>.toon
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

/**
 * Generates an array of test todos
 * @param {number} count - Number of todos to generate
 * @returns {Array<{id: string, text: string, completed: boolean, createdAt: string}>}
 */
function generateTodos(count) {
  const todos = []
  const baseTimestamp = Date.now()

  // Mix of todo text patterns for variety
  const textPatterns = [
    'Buy groceries',
    'Complete project documentation',
    'Review pull requests',
    'Schedule team meeting',
    'Update dependencies',
    'Fix keyboard navigation bug',
    'Implement new feature',
    'Write unit tests',
    'Deploy to production',
    'Refactor legacy code',
    'Design new UI component',
    'Optimize database queries',
    'Set up CI/CD pipeline',
    'Investigate performance issue',
    'Update README documentation',
    'Backup production database',
    'Code review session',
    'Sprint planning meeting',
    'Update architecture diagrams',
    'Research new technologies'
  ]

  for (let i = 0; i < count; i++) {
    // Every 3rd todo is completed for testing
    const completed = i % 3 === 0

    // Use patterns for first 20, then add index
    const textIndex = i % textPatterns.length
    const text = i < textPatterns.length
      ? textPatterns[textIndex]
      : `${textPatterns[textIndex]} ${Math.floor(i / textPatterns.length) + 1}`

    // Distribute timestamps backwards (newest first in list)
    const createdAt = new Date(baseTimestamp - i * 1000).toISOString()

    todos.push({
      id: crypto.randomUUID(),
      text,
      completed,
      createdAt
    })
  }

  return todos
}

/**
 * Encodes todos to TOON format string
 * (Matches electron/storage.ts ToonStorage.encode implementation)
 * @param {Array} todos - Array of todo objects
 * @returns {string} TOON formatted string
 */
function encodeToon(todos) {
  const count = todos.length
  const fields = 'id,text,completed,createdAt'
  const header = `todos[${count}]{${fields}}:`

  const rows = todos.map(todo => {
    // Escape text field if it contains commas, quotes, or newlines
    const textEscaped = todo.text.includes(',') || todo.text.includes('"') || todo.text.includes('\n')
      ? `"${todo.text.replace(/"/g, '""')}"`
      : todo.text

    return `  ${todo.id},${textEscaped},${String(todo.completed)},${todo.createdAt}`
  }).join('\n')

  return rows.length > 0
    ? `${header}\n${rows}\n\nversion: 1.0`
    : `${header}\n\nversion: 1.0`
}

/**
 * Writes TOON string to file
 * @param {string} filePath - Target file path
 * @param {string} toonString - TOON formatted content
 */
function writeToonFile(filePath, toonString) {
  const dirPath = path.dirname(filePath)

  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  fs.writeFileSync(filePath, toonString, 'utf-8')
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: node scripts/generate-test-data.js <count> [output-path]')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/generate-test-data.js 100')
    console.log('  node scripts/generate-test-data.js 1000 ./custom-path/todos.toon')
    console.log('')
    console.log('Generates TOON format files with specified number of todos.')
    console.log('Default output: ./test-data/todos-<count>.toon')
    process.exit(0)
  }

  const count = parseInt(args[0], 10)

  if (isNaN(count) || count < 0) {
    console.error('Error: Count must be a positive number')
    process.exit(1)
  }

  // Determine output path
  const outputPath = args[1] || path.join(__dirname, '..', 'test-data', `todos-${count}.toon`)

  console.log(`Generating ${count} todos...`)
  const startTime = Date.now()

  // Generate todos
  const todos = generateTodos(count)

  // Encode to TOON format
  const toonString = encodeToon(todos)

  // Write to file
  writeToonFile(outputPath, toonString)

  const duration = Date.now() - startTime
  const fileSize = fs.statSync(outputPath).size
  const fileSizeKB = (fileSize / 1024).toFixed(2)

  console.log('✓ Generation complete!')
  console.log(`  Todos: ${count}`)
  console.log(`  Completed: ${todos.filter(t => t.completed).length} (every 3rd todo)`)
  console.log(`  File: ${outputPath}`)
  console.log(`  Size: ${fileSizeKB} KB`)
  console.log(`  Duration: ${duration}ms`)
  console.log('')
  console.log('To use this file, copy it to:')
  console.log('  %APPDATA%/spardutti-todo/todos.toon (Windows)')
}

// Run if executed directly
if (require.main === module) {
  main()
}

// Export functions for testing
module.exports = {
  generateTodos,
  encodeToon,
  writeToonFile
}
