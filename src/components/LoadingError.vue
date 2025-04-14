<template>
  <div v-if="loading" class="loading">
    <div class="spinner"></div>
    <p>{{ loadingText || '正在分析中...' }}</p>
  </div>

  <div v-if="error" class="error">
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
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  animation: loadingPulse 1.5s infinite;
  margin: 20px 0;
}

@keyframes loadingPulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #3b82f6;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading p {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
}

.error {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  margin: 20px 0;
  color: #ef4444;
  font-size: 16px;
  border-left: 4px solid #ef4444;
}
</style>