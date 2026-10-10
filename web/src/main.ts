import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { vPermission } from './directives/permission'
import './styles/main.css'

createApp(App).use(router).directive('permission', vPermission).mount('#app')
