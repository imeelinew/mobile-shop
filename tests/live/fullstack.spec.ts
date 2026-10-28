import { test, expect, type Page } from '@playwright/test'

const api = process.env.E2E_API_URL || 'http://127.0.0.1:3000'

async function buy(page: Page, productId: number) {
  await page.goto(`/product-detail?prodId=${productId}`)
  await page.locator('.van-action-bar').getByRole('button', { name: '立即购买', exact: true }).click()
  await page.locator('.buy-sheet').getByRole('button', { name: '立即购买', exact: true }).click()
  await expect(page).toHaveURL(/order-confirm/)
  const submitted = page.waitForResponse((r) => r.url().endsWith('/p/order/submit') && r.request().method() === 'POST')
  await page.getByRole('button', { name: '提交订单', exact: true }).click()
  const response = await submitted
  const result = await response.json()
  expect(result.success, JSON.stringify(result)).toBe(true)
  expect(response.request().headers()['idempotency-key']).toBeTruthy()
  return result.data.orderNumbers as string
}

test('real API: login → buy → cancel and pay → admin ship → receive', async ({ page, request, browser }) => {
  const username = `live${Date.now()}`.slice(-16)
  const password = 'LocalTest-Password-2026'
  const registered = await request.post(`${api}/user/register`, { data: { userName: username, passWord: password } })
  expect(registered.ok()).toBeTruthy()
  await page.goto('/login')
  await page.getByPlaceholder('用户名', { exact: true }).fill(username)
  await page.getByPlaceholder('密码', { exact: true }).fill(password)
  const loggedIn = page.waitForResponse((r) => r.url().endsWith('/login') && r.request().method() === 'POST')
  await page.getByRole('button', { name: /^登\s*录$/ }).click()
  const token = (await (await loggedIn).json()).data.accessToken as string
  await expect(page).toHaveURL(/\/home$/)
  const headers = { Authorization: `Bearer ${token}` }
  const added = await request.post(`${api}/p/address/addAddr`, { headers, data: {
    receiver: '联调测试', mobile: '13800138000', province: '北京市', provinceId: 110000,
    city: '北京市', cityId: 110100, area: '朝阳区', areaId: 110101, addr: '全栈联调路1号',
  } })
  expect(added.ok()).toBeTruthy()
  const products = await (await request.get(`${api}/search/searchProdPage?size=50`)).json()
  const product = products.data.records.find((item: { totalStocks: number }) => item.totalStocks >= 2)
  expect(product).toBeTruthy()
  const cancelled = await buy(page, product.prodId)
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page).toHaveURL(/my-order/)
  const cancelCard = page.locator('.order-card:visible').filter({ hasText: cancelled })
  await cancelCard.getByRole('button', { name: '取消订单', exact: true }).click()
  await page.getByRole('button', { name: '确认取消', exact: true }).click()
  await expect(cancelCard).toHaveCount(0)
  await page.getByRole('tab', { name: '已取消', exact: true }).click()
  await expect(page.locator('.order-card:visible').filter({ hasText: cancelled })).toBeVisible()

  const order = await buy(page, product.prodId)
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page).toHaveURL(/active=1/)
  await expect(page.locator('.order-card:visible').filter({ hasText: order })).toBeVisible()

  const adminLogin = await request.post(`${api}/login`, { data: {
    userName: process.env.E2E_ADMIN_USERNAME || 'zhangsan123',
    passWord: process.env.E2E_ADMIN_PASSWORD || '46584769479467',
  } })
  const adminToken = (await adminLogin.json()).data.accessToken as string
  const adminContext = await browser.newContext()
  try {
    const adminPage = await adminContext.newPage()
    await adminPage.goto('http://127.0.0.1:4173/login')
    await adminPage.evaluate((value) => localStorage.setItem('token', value), adminToken)
    await adminPage.goto('http://127.0.0.1:4173/admin/orders')
    await adminPage.getByPlaceholder('输入待发货订单号').fill(order)
    await adminPage.getByRole('button', { name: '确认发货', exact: true }).click()
    const shipped = adminPage.waitForResponse((r) => r.url().endsWith(`/admin/orders/${order}/ship`))
    await adminPage.getByRole('button', { name: '确认', exact: true }).click()
    expect((await (await shipped).json()).success).toBe(true)
  } finally {
    await adminContext.close()
  }

  await page.goto('/my-order?active=2')
  const shippedCard = page.locator('.order-card:visible').filter({ hasText: order })
  await shippedCard.getByRole('button', { name: '确认收货', exact: true }).click()
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(shippedCard).toHaveCount(0)
  await page.getByRole('tab', { name: '已完成', exact: true }).click()
  await expect(page.locator('.order-card:visible').filter({ hasText: order })).toBeVisible()
  const completed = await (await request.get(`${api}/p/myOrder/myOrder?status=5&current=1`, { headers })).json()
  expect(completed.data.records.some((row: { orderNumber: string }) => row.orderNumber === order)).toBe(true)
  await page.screenshot({ path: 'test-results/real-order-completed.png', fullPage: true })
})
