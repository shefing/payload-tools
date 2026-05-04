import { test, expect } from '@playwright/test'
import { login } from './helpers'

// CrossCollectionConfig is a utility plugin that applies customOverrides to collection
// component paths. The test-app initialises it with {} (no overrides configured),
// so there is no dedicated UI to exercise in E2E tests.
test.describe.skip('CrossCollectionConfig plugin (@shefing/cross-collection)', () => {
  test('cross-collection relationship field renders on the edit form', async ({ page }) => {})
  test('can search and select a document from another collection', async ({ page }) => {})
  test('selected cross-collection reference is saved and reloaded correctly', async ({ page }) => {})
  test('cross-collection field respects configured collection filters', async ({ page }) => {})
})
