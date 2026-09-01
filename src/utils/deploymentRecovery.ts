import type { Router } from 'vue-router'

const staleModulePattern = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i
const recoveryKey = 'mobile-shop:route-recovery'

const reloadPage = (target: string) => {
  const reloadUrl = new URL(target, window.location.origin)
  reloadUrl.searchParams.set('_app_reload', Date.now().toString())
  window.location.replace(reloadUrl)
}

export const setupDeploymentRecovery = (router: Router) => {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadPage(window.location.href)
  })

  router.onError((error, to) => {
    if (!staleModulePattern.test(String(error))) return

    const target = to.fullPath || `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (sessionStorage.getItem(recoveryKey) === target) {
      sessionStorage.removeItem(recoveryKey)
      return
    }

    sessionStorage.setItem(recoveryKey, target)
    reloadPage(target)
  })

  router.afterEach(() => {
    sessionStorage.removeItem(recoveryKey)
  })
}
