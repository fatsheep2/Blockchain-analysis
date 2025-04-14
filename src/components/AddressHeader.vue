<template>
  <div class="relative mb-8 p-8 rounded-xl shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-emerald-500">
    <div class="relative z-10">
      <h1 class="text-4xl font-bold text-white mb-4">区块链地址分析</h1>
      <p class="text-xl text-white/90 mb-8">
        输入区块链地址，获取详细的交易分析和可视化报告
      </p>
      
      <div class="flex flex-wrap gap-4 justify-center mb-8">
        <button 
          @click="generateReport" 
          class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-50 active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          :disabled="loading"
        >
          {{ loading ? '分析中...' : '生成报告' }}
        </button>
        <button 
          v-if="showScreenshot"
          @click="saveReport" 
          class="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 active:bg-white/40 border border-white/30 transition-all duration-200"
        >
          保存报告
        </button>
      </div>

      <div class="max-w-3xl mx-auto">
        <div class="relative">
          <input
            type="text"
            :value="address"
            @input="$emit('update:address', $event.target.value)"
            placeholder="输入区块链地址..."
            class="w-full bg-white/10 backdrop-blur text-white placeholder-white/60 border-2 border-white/20 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-white/40 transition-all mb-6"
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

    <!-- 截图选项 -->
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
    </div>

    <!-- 背景动画效果 -->
    <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-shimmer"></div>
  </div>
</template>

<script setup>
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

const saveReport = () => {
  emit('screenshot-click')
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

@media (max-width: 768px) {
  input {
    @apply px-4 py-3 text-base;
  }
}
</style> 