const STATIC_ORIGIN = 'http://shop-static.edu.koobietech.com'

export async function onRequest({ request, params }) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const pathSegments = Array.isArray(params.path) ? params.path : [params.path]
  const path = pathSegments.filter(Boolean).join('/')
  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL(`/${path}`, STATIC_ORIGIN)
  upstreamUrl.search = incomingUrl.search

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      Accept: request.headers.get('Accept') || '*/*'
    }
  })

  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=86400')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
