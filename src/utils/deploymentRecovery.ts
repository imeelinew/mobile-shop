import type { Router } from 'vue-router'

const staleModulePattern = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i
const recoveryKey = 'mobile-shop:route-recovery'

const normalizeTarget = (target: string) => {
  const url = new URL(target, window.location.origin)
  url.searchParams.delete('_app_reload')
  return `${url.pathname}${url.search}${url.hash}`
}

const reloadPage = (target: string) => {
  const reloadUrl = new URL(target, window.location.origin)
  reloadUrl.searchParams.set('_app_reload', Date.now().toString())
  window.location.replace(reloadUrl)
}

const recoverOnce = (target: string) => {
  const normalizedTarget = normalizeTarget(target)
  if (sessionStorage.getItem(recoveryKey) === normalizedTarget) return

  sessionStorage.setItem(recoveryKey, normalizedTarget)
  reloadPage(normalizedTarget)
}

export const setupDeploymentRecovery = (router: Router) => {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    recoverOnce(window.location.href)
  })

  router.onError((error, to) => {
    if (!staleModulePattern.test(String(error))) return

    const target = to.fullPath || `${window.location.pathname}${window.location.search}${window.location.hash}`
    recoverOnce(target)
  })

  router.afterEach((to) => {
    if (sessionStorage.getItem(recoveryKey) === normalizeTarget(to.fullPath)) {
      sessionStorage.removeItem(recoveryKey)
    }
  })
}
