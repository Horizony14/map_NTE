/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'leaflet.markercluster' {
  import * as L from 'leaflet'
  export = L
}
