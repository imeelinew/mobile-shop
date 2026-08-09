const API_ORIGIN = 'http://shop-api.edu.koobietech.com'
const STATIC_ORIGIN = 'http://shop-static.edu.koobietech.com/'
const STATIC_PROXY_PATH = '/media/'

export async function onRequest({ request, params }) {
  const pathSegments = Array.isArray(params.path) ? params.path : [params.path]
  const path = pathSegments.filter(Boolean).join('/')
  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL(`/${path}`, API_ORIGIN)
  upstreamUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ipcountry')
  headers.delete('cf-ray')

  const upstreamRequest = new Request(upstreamUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual'
  })

  const response = await fetch(upstreamRequest)
  const contentType = response.headers.get('Content-Type') || ''

  if (!contentType.includes('application/json')) {
    return response
  }

  const body = (await response.text()).replaceAll(STATIC_ORIGIN, STATIC_PROXY_PATH)
  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('Content-Length')
  responseHeaders.delete('Content-Encoding')

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  })
}
