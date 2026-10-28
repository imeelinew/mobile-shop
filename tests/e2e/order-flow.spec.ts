import { expect, test, type Page, type Route } from '@playwright/test'

const ok = (data: unknown, msg: string | null = null) => ({
  code: '00000',
  data,
  msg,
  success: true,
  fail: false,
})

const fail = (msg: string, code = 'A00001') => ({
  code,
  data: null,
  msg,
  success: false,
  fail: true,
})

const fulfillJson = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

const prepareAuthenticatedPage = async (page: Page) => {
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.setItem('token', 'e2e-token')
  })
}

const prepareCheckoutPage = async (page: Page) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('confirmOrder', JSON.stringify({ basketIds: [1], addrId: 1 }))
  })

  await page.route('**/api/p/address/list', (route) => fulfillJson(route, ok([{
    addrId: 1,
    receiver: '测试用户',
    mobile: '13800000000',
    province: '北京市',
    city: '北京市',
    area: '朝阳区',
    addr: '测试路 1 号',
    commonAddr: 1,
  }])))
  await page.route('**/api/p/order/confirm', (route) => fulfillJson(route, ok({
    shopCartOrders: [{
      shopId: 1,
      shopName: '轻购自营',
      transfee: 0,
      remarks: '',
      shopCartItemDiscounts: [{
        shopCartItems: [{
          basketId: 1,
          prodId: 1,
          skuId: 11,
          prodName: '幂等测试商品',
          skuName: '标准版',
          prodCount: 1,
          price: 19.9,
          pic: '',
        }],
      }],
    }],
    checkoutItems: [{ basketId: 1, prodId: 1, skuId: 11, prodCount: 1 }],
    total: 19.9,
    orderReduce: 0,
    totalCount: 1,
    actualTotal: 19.9,
  })))
}

test.beforeEach(async ({ page }) => {
  await prepareAuthenticatedPage(page)
})

test('profile uses the current server user and exposes the admin entry', async ({ page }) => {
  await page.route('**/api/me', (route) => fulfillJson(route, ok({
    userId: 7,
    username: 'real-shop-user',
    role: 'admin',
  })))
  await page.route('**/api/p/myOrder/orderCount', (route) => fulfillJson(route, ok({
    unPay: 1,
    payed: 2,
    consignment: 3,
    success: 4,
    canceled: 5,
  })))

  await page.goto('/mine')

  await expect(page.locator('.username')).toHaveText('real-shop-user')
  await expect(page.getByText('张三', { exact: true })).toHaveCount(0)
  await expect(page.getByText('管理员发货', { exact: true })).toBeVisible()
  await expect(page.getByText('5 笔')).toBeVisible()
})

test('pending orders support cancel and simulated payment actions', async ({ page }) => {
  const orders = [
    {
      orderNumber: 'QG00000001',
      productNums: 1,
      actualTotal: 12,
      orderItemDtos: [{ prodName: '测试商品 A', prodCount: 1, price: 12, skuId: 1 }],
    },
    {
      orderNumber: 'QG00000002',
      productNums: 1,
      actualTotal: 18,
      orderItemDtos: [{ prodName: '测试商品 B', prodCount: 1, price: 18, skuId: 2 }],
    },
  ]
  const receiptOrder = {
    orderNumber: 'QG00000005',
    productNums: 1,
    actualTotal: 25,
    orderItemDtos: [{ prodName: '测试商品 C', prodCount: 1, price: 25, skuId: 3 }],
  }

  await page.route('**/api/p/myOrder/myOrder?**', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status')
    const records = status === '1'
      ? orders
      : status === '3'
        ? [receiptOrder]
        : []
    return fulfillJson(route, ok({
      records,
      current: 1,
      size: 10,
      total: records.length,
      pages: records.length ? 1 : 0,
    }))
  })
  await page.route('**/api/p/order/cancel', (route) => fulfillJson(route, ok({
    orderNumber: 'QG00000001',
    status: 6,
    replayed: false,
  })))
  await page.route('**/api/p/order/pay', (route) => fulfillJson(route, ok({
    orderNumber: 'QG00000002',
    provider: 'mock',
    status: 2,
    replayed: false,
  })))
  await page.route('**/api/p/myOrder/receipt/QG00000005', (route) => fulfillJson(route, ok({
    orderNumber: 'QG00000005',
    status: 5,
  })))

  await page.goto('/my-order?active=0')
  const cards = page.locator('.order-card:visible')
  await expect(cards).toHaveCount(2)

  const cancelRequest = page.waitForRequest((request) =>
    request.url().endsWith('/api/p/order/cancel') && request.method() === 'POST')
  await cards.nth(0).getByRole('button', { name: '取消订单' }).click()
  await expect(page.getByText('取消后库存会立即回补')).toBeVisible()
  await page.getByRole('button', { name: '确认取消' }).click()
  expect((await cancelRequest).postDataJSON()).toEqual({ orderNumbers: 'QG00000001' })

  await expect(cards).toHaveCount(2)
  const payRequest = page.waitForRequest((request) =>
    request.url().endsWith('/api/p/order/pay') && request.method() === 'POST')
  await cards.nth(1).getByRole('button', { name: '模拟支付' }).click()
  await expect(page.getByText('不会产生真实扣款')).toBeVisible()
  await page.getByRole('button', { name: '确认' }).click()
  expect((await payRequest).postDataJSON()).toEqual({ orderNumbers: 'QG00000002', payType: 1 })

  await page.getByRole('tab', { name: '待收货' }).click()
  const receiptRequest = page.waitForRequest((request) =>
    request.url().endsWith('/api/p/myOrder/receipt/QG00000005') && request.method() === 'PUT')
  await expect(cards).toHaveCount(1)
  await cards.first().getByRole('button', { name: '确认收货' }).click()
  await page.getByRole('button', { name: '确认', exact: true }).click()
  expect((await receiptRequest).method()).toBe('PUT')

  await expect(page.getByRole('tab', { name: '已取消' })).toBeVisible()
})

test('checkout reuses an idempotency key after failure and clears it after success', async ({ page }) => {
  await prepareCheckoutPage(page)

  const keys: string[] = []
  let submitAttempt = 0
  await page.route('**/api/p/order/submit', (route) => {
    submitAttempt += 1
    keys.push(route.request().headers()['idempotency-key'] || '')
    if (submitAttempt === 1) {
      return fulfillJson(route, fail('临时网络错误'), 500)
    }
    return fulfillJson(route, ok({
      orderNumber: 'QG00000003',
      orderNumbers: 'QG00000003',
      status: 1,
      replayed: false,
    }))
  })

  await page.goto('/order-confirm')
  const submitButton = page.getByRole('button', { name: '提交订单' })
  await expect(submitButton).toBeVisible()

  const firstResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/p/order/submit') && response.status() === 500)
  await submitButton.click()
  await firstResponse
  await expect(submitButton).toBeEnabled()

  const secondResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/p/order/submit') && response.status() === 200)
  await submitButton.click()
  await secondResponse

  expect(keys).toHaveLength(2)
  expect(keys[0]).toMatch(/^checkout-/)
  expect(keys[1]).toBe(keys[0])
  await expect(page.getByText('模拟支付', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('mobile-shop:checkout-idempotency'))).toBeNull()
})

test('a created order cannot submit again when simulated payment fails', async ({ page }) => {
  await prepareCheckoutPage(page)

  let submitAttempts = 0
  await page.route('**/api/p/order/submit', (route) => {
    submitAttempts += 1
    return fulfillJson(route, ok({
      orderNumber: 'QG00000006',
      orderNumbers: 'QG00000006',
      status: 1,
      replayed: false,
    }))
  })
  await page.route('**/api/p/order/pay', (route) => fulfillJson(route, fail('模拟支付服务异常'), 500))
  await page.route('**/api/p/myOrder/myOrder?**', (route) => fulfillJson(route, ok({
    records: [],
    current: 1,
    size: 10,
    total: 0,
    pages: 0,
  })))

  await page.goto('/order-confirm')
  await page.getByRole('button', { name: '提交订单' }).click()
  await expect(page.getByText('这是演示环境，不会产生真实扣款')).toBeVisible()

  const paymentResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/p/order/pay') && response.status() === 500)
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await paymentResponse

  await expect(page).toHaveURL(/\/my-order\?active=0/)
  expect(submitAttempts).toBe(1)
  await expect(page.getByRole('button', { name: '提交订单' })).toHaveCount(0)
})

test('idempotency key stays stable in memory when storage throws', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const modulePath = '/src/utils/checkoutIdempotency.ts'
    const idempotency = await import(modulePath)
    const throwStorageError = () => {
      throw new DOMException('Storage disabled', 'SecurityError')
    }
    const brokenStorage = {
      length: 0,
      clear: throwStorageError,
      getItem: throwStorageError,
      key: () => null,
      removeItem: throwStorageError,
      setItem: throwStorageError,
    }
    const payload = { basketIds: [1], addrId: 1 }

    idempotency.clearCheckoutIdempotencyKey(brokenStorage)
    return [
      idempotency.getCheckoutIdempotencyKey(payload, brokenStorage),
      idempotency.getCheckoutIdempotencyKey(payload, brokenStorage),
    ]
  })

  expect(result[0]).toMatch(/^checkout-/)
  expect(result[1]).toBe(result[0])
  expect(await page.evaluate(async () => {
    const apiConfig = await import('/src/config/api.ts')
    return apiConfig.API_BASE_URL
  })).toBe('/api')
})

test('admin page sends shipping through the protected server endpoint', async ({ page }) => {
  await page.route('**/api/me', (route) => fulfillJson(route, ok({
    userId: 7,
    username: 'shop-admin',
    role: 'admin',
  })))
  const shipRequest = page.waitForRequest((request) =>
    request.url().endsWith('/api/admin/orders/QG00000004/ship') && request.method() === 'POST')
  await page.route('**/api/admin/orders/QG00000004/ship', (route) => fulfillJson(route, ok({
    orderNumber: 'QG00000004',
    status: 3,
  })))

  await page.goto('/admin/orders')
  await page.getByPlaceholder('输入待发货订单号').fill('QG00000004')
  await page.getByRole('button', { name: '确认发货' }).click()
  await page.getByRole('button', { name: '确认', exact: true }).click()

  expect((await shipRequest).headers().authorization).toBe('Bearer e2e-token')
})

test('an AI 401 removes the token and returns to login', async ({ page }) => {
  await page.route('**/api/search/hotSearch?**', (route) => fulfillJson(route, ok([])))
  await page.route('**/api/ai/chat', (route) => fulfillJson(route, fail('登录已失效', 'A00004'), 401))

  await page.goto('/search')
  await page.getByPlaceholder('请输入搜索关键词').fill('蓝牙耳机')

  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
})
