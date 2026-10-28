const configuredBaseUrl = import.meta.env.VITE_APP_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || '/api').replace(/\/+$/, '')

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
