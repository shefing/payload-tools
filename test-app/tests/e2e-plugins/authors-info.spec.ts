import { test, expect } from '@playwright/test'
import { getToken, createArticle, deleteArticle, navigateToArticleById, randomSuffix } from './helpers'

test.describe('addAuthorsFields plugin (@shefing/authors-info)', () => {
  test('authors info fields are present on the article edit form', async ({ page, request }) => {
    const token = await getToken(request)
    const suffix = randomSuffix()
    const articleId = await createArticle(request, token, {
      title: `Authors Info UI Test ${suffix}`,
      _status: 'draft',
    })
    await navigateToArticleById(page, articleId)

    // The authors-info plugin places fields in an "Author Data" tab (button.tabs-field__tab-button)
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
    const authorTab = page.locator('button.tabs-field__tab-button').filter({ hasText: /^Author Data$/ })
    await authorTab.waitFor({ state: 'visible', timeout: 10000 })
    await authorTab.click()
    // Wait for the "Created By" label to appear in the panel
    await expect(page.getByText('Created By').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Updated By').first()).toBeVisible({ timeout: 10000 })

    await deleteArticle(request, token, articleId)
  })

  test('creator field is auto-populated on document creation', async ({ request }) => {
    const token = await getToken(request)
    const suffix = randomSuffix()

    const createRes = await request.post('/api/articles', {
      headers: { Authorization: token },
      data: { title: `Authors Creator Test ${suffix}`, _status: 'draft' },
    })
    expect(createRes.ok()).toBeTruthy()
    const doc = await createRes.json()
    expect(doc.doc?.creator).toBeTruthy()

    await request.delete(`/api/articles/${doc.doc.id}`, {
      headers: { Authorization: token },
    })
  })

  test('updator field is updated on document save', async ({ request }) => {
    const token = await getToken(request)
    const suffix = randomSuffix()

    const createRes = await request.post('/api/articles', {
      headers: { Authorization: token },
      data: { title: `Authors Updator Test ${suffix}`, _status: 'draft' },
    })
    const doc = await createRes.json()
    const id = doc.doc.id

    const updateRes = await request.patch(`/api/articles/${id}`, {
      headers: { Authorization: token },
      data: { title: `Authors Updator Test ${suffix} Updated` },
    })
    expect(updateRes.ok()).toBeTruthy()
    const updated = await updateRes.json()
    expect(updated.doc?.updator).toBeTruthy()

    await request.delete(`/api/articles/${id}`, {
      headers: { Authorization: token },
    })
  })
})
