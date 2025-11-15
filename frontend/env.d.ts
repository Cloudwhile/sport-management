/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const locale: any
  export default locale
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // 在这里添加更多环境变量类型...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
