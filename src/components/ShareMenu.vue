<template>
  <div class="relative">
    <!-- 分享按钮 -->
    <button 
      @click="showMenu = !showMenu"
      class="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 active:bg-white/40 border border-white/30 transition-all duration-200 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
      分享
    </button>

    <!-- 分享菜单 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showMenu" class="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50">
        <div class="py-1" role="menu">
          <!-- 系统分享 -->
          <button
            v-if="canShare"
            @click="handleSystemShare"
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            系统分享
          </button>

          <!-- 复制链接 -->
          <button
            @click="handleCopyLink"
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
            </svg>
            复制链接
          </button>

          <!-- 保存图片 -->
          <button
            @click="handleSaveImage"
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            保存图片
          </button>

          <!-- 分享图片 -->
          <button
            @click="handleShareImage"
            class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            role="menuitem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            分享图片
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 提示消息 -->
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="showToast" class="fixed bottom-5 right-5 z-50">
      <div class="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  address: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['save-image', 'share-image'])

const router = useRouter()
const showMenu = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const canShare = ref(!!navigator.share)

// 显示提示消息
const showToastMessage = (message, duration = 2000) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, duration)
}

// 系统分享
const handleSystemShare = async () => {
  try {
    const shareData = {
      title: '区块链地址分析',
      text: `查看地址 ${props.address} 的详细分析报告`,
      url: window.location.href
    }
    await navigator.share(shareData)
    showMenu.value = false
  } catch (err) {
    console.error('分享失败:', err)
    showToastMessage('分享失败，请重试')
  }
}

// 复制链接
const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    showToastMessage('链接已复制到剪贴板')
    showMenu.value = false
  } catch (err) {
    console.error('复制失败:', err)
    showToastMessage('复制失败，请重试')
  }
}

// 保存图片
const handleSaveImage = () => {
  emit('save-image')
  showMenu.value = false
}

// 分享图片
const handleShareImage = () => {
  emit('share-image')
  showMenu.value = false
}

// 点击外部关闭菜单
const closeMenu = (e) => {
  if (!e.target.closest('.share-menu') && showMenu.value) {
    showMenu.value = false
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('mousedown', closeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeMenu)
})
</script>

<style scoped>
.share-menu {
  position: relative;
  display: inline-block;
}
</style> 