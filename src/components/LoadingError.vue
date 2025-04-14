<template>
  <div v-if="loading" class="loading animate-fade-in">
    <div class="spinner"></div>
    <p>{{ loadingText || '正在分析中...' }}</p>
  </div>

  <div v-if="error" class="error animate-fade-in">
    {{ error }}
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  loadingText: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.loading {
  @apply fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center;
}

.spinner {
  @apply w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin;
}

.error {
  @apply fixed top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg;
}
</style>