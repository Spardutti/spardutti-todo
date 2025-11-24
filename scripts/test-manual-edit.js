#!/usr/bin/env node

/**
 * Test script to verify manual TOON file editing works correctly
 */

const { ToonStorage } = require('../electron/storage')
const path = require('path')

async function testManualEdit() {
  const testFile = path.join(__dirname, '..', 'test-data', 'manual-edit-test.toon')

  console.log('Testing manual file editing...')
  console.log('File:', testFile)
  console.log('')

  try {
    const todos = await ToonStorage.load(testFile)

    console.log('✓ Successfully loaded manually edited TOON file')
    console.log(`  Count: ${todos.length} todos`)
    console.log('')

    todos.forEach((todo, index) => {
      console.log(`Todo ${index + 1}:`)
      console.log(`  ID: ${todo.id}`)
      console.log(`  Text: ${todo.text}`)
      console.log(`  Completed: ${todo.completed}`)
      console.log(`  Created: ${todo.createdAt}`)
      console.log('')
    })

    // Verify the manually added todo is present
    const manualTodo = todos.find(t => t.text.includes('Manually added'))
    if (manualTodo) {
      console.log('✓ Manual edit verification passed!')
      console.log('  Manually added todo is present and functional')
    } else {
      console.error('✗ Manual edit verification failed!')
      console.error('  Manually added todo not found')
      process.exit(1)
    }

  } catch (error) {
    console.error('✗ Failed to load manually edited file')
    console.error('  Error:', error.message)
    process.exit(1)
  }
}

testManualEdit()
