import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Auto Import Components
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = process.env.VITE_API_PROXY_TARGET
    || environment.VITE_API_PROXY_TARGET
    || 'http://127.0.0.1:3000'

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [VantResolver()],
      }),

      Components({
        resolvers: [VantResolver()],
      }),
      // vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // 开发时浏览器请求同源 /api，由 vite 转发到后端，绕开 CORS 端口白名单
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
