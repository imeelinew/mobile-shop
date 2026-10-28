import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from '../functions/api/[[path]].js'

test('Pages forwards the order idempotency key, token and API path to the fixed origin', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url.href, 'https://api.qg.elinew.tech/p/order/submit?test=1')
      assert.equal(init.headers.get('authorization'), 'Bearer test-token')
      assert.equal(init.headers.get('idempotency-key'), 'order-test-123')
      assert.equal(init.headers.get('x-forwarded-for'), null)
      return Response.json({ success: true })
    }
    const request = new Request('https://qg.elinew.tech/api/p/order/submit?test=1', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'idempotency-key': 'order-test-123', 'x-forwarded-for': 'untrusted' },
      body: '{}',
    })
    const response = await onRequest({ request })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Pages returns a controlled error when the API origin is unavailable', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => { throw new Error('upstream unavailable') }
    const response = await onRequest({ request: new Request('https://qg.elinew.tech/api/me') })
    assert.equal(response.status, 502)
    assert.equal((await response.json()).success, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
