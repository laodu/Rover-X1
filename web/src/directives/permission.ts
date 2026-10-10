import type { Directive } from 'vue'
import { useAuth, type Permission } from '../stores/auth'

// v-permission="'task:dispatch'" — 无权限时移除元素
export const vPermission: Directive<HTMLElement, Permission> = {
  mounted(el, binding) {
    const { hasPermission } = useAuth()
    if (!hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
