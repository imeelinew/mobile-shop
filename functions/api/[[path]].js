const API_ORIGIN = 'http://shop-api.edu.koobietech.com'

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

  return fetch(upstreamRequest)
}
