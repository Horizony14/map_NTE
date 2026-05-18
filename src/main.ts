import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
