const API_ORIGIN = 'https://api.qg.elinew.tech'

export async function onRequest({ request }) {
  const incoming = new URL(request.url)
  const target = new URL(API_ORIGIN)
  target.pathname = incoming.pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  target.search = incoming.search

  const headers = new Headers()
  for (const name of ['accept', 'authorization', 'content-type', 'idempotency-key']) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    })
    const resultHeaders = new Headers(response.headers)
    resultHeaders.delete('server')
    resultHeaders.set('cache-control', 'no-store')
    return new Response(response.body, { status: response.status, headers: resultHeaders })
  } catch {
    return Response.json({ success: false, code: 'A00001', msg: '服务暂时不可用', data: null }, { status: 502 })
  }
}
