<template>
  <div class="flex justify-center items-center min-h-[200px]">
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center">
      <div class="spinner mb-4"></div>
      <p class="text-gray-600">正在分析中，请稍候...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center">
      <div class="error-icon mb-4">❌</div>
      <p class="text-red-500">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: String
})
</script>

<style scoped>
.spinner {
  @apply w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto;
  animation: spin 1s linear infinite;
}

.error-icon {
  @apply text-4xl;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>