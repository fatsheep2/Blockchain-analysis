<template>
  <div class="relative mb-8 p-8 rounded-xl shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-emerald-500">
    <div class="relative z-10">
      <h1 class="text-4xl font-bold mb-4 text-center">
        <span class="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] tracking-wide">
          区块链地址分析
        </span>
      </h1>
      <p class="text-xl mb-8 text-center">
        <span class="text-white/90 font-medium tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
          输入区块链地址，获取详细的交易分析和可视化报告
        </span>
      </p>
      
      <div class="flex flex-wrap gap-4 justify-center mb-8">
        <button 
          @click="generateReport" 
          class="bg-white/95 backdrop-blur-sm text-blue-600 px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-50 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px]"
          :disabled="loading"
        >
          <span class="relative z-10">{{ loading ? '分析中...' : '生成报告' }}</span>
        </button>
        <button
          v-if="showScreenshot"
          class="flex items-center gap-2 px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg min-w-[120px] justify-center"
          @click="$emit('screenshot-click')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          分享
        </button>
      </div>

      <div class="max-w-3xl mx-auto">
        <div class="relative">
          <input
            type="text"
            :value="address"
            @input="$emit('update:address', $event.target.value)"
            placeholder="输入区块链地址..."
            class="w-full bg-white/10 backdrop-blur text-white placeholder-white/60 border-2 border-white/20 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-white/40 transition-all mb-6 font-medium tracking-wide shadow-inner"
            @keyup.enter="$emit('search')"
            :disabled="loading"
          />
          <div v-if="addressType" class="absolute -bottom-5 right-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="addressType === 'ETH' ? 'bg-blue-400' : 'bg-emerald-400'"></div>
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-white/20 backdrop-blur text-white/90 border border-white/30 shadow-sm">
                {{ addressType }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 截图选项
    <div v-if="showOptions" class="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-2">
      <button 
        @click="$emit('capture', 'clipboard')" 
        class="block w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
      >
        复制到剪贴板
      </button>
      <button 
        @click="$emit('capture', 'download')" 
        class="block w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
      >
        保存到本地
      </button>
    </div> -->

    <!-- 背景动画效果 -->
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-shimmer"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  address: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  addressType: {
    type: String,
    default: ''
  },
  showScreenshot: {
    type: Boolean,
    default: false
  },
  showOptions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:address', 'search', 'screenshot-click', 'capture'])

const generateReport = () => {
  emit('search')
}
</script>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 3s infinite;
}

/* 添加字体优化 */
:deep(*) {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: 0.025em;
}

/* 移动端适配 */
@media (max-width: 768px) {
  input {
    @apply px-4 py-3 text-base;
  }
  
  h1 {
    @apply text-3xl;
  }
  
  p {
    @apply text-lg;
  }
  
  button {
    @apply px-6 py-2.5 text-sm;
  }
}
</style> 