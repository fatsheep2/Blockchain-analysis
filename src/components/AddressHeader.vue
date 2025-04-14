<template>
  <div class="hero-section">
    <h1>波场区块链地址分析</h1>
    <p>输入地址即可查看详细分析报告</p>
    <button v-if="showScreenshot" class="screenshot-btn" @click="$emit('screenshot-click')">
      📸 生成分析报告
    </button>
    <div v-if="showOptions" class="screenshot-options">
      <button @click="$emit('capture', 'clipboard')">复制到剪贴板</button>
      <button @click="$emit('capture', 'download')">保存到本地</button>
    </div>
  </div>

  <div class="search-section">
    <div class="search-container">
      <div class="input-group">
        <input 
          :value="address"
          type="text"
          placeholder="请输入以太坊或波场地址"
          class="address-input"
          @input="$emit('update:address', $event.target.value)"
          @keyup.enter="$emit('search')"
        >
        <button 
          @click="$emit('search')" 
          :disabled="loading"
          class="analyze-btn"
        >
          {{ loading ? '分析中...' : '分析地址' }}
        </button>
      </div>
      <div v-if="addressType" class="address-type">
        当前地址类型：<span :class="['chain-tag', addressType.toLowerCase()]">{{ addressType }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
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

defineEmits(['update:address', 'search', 'screenshot-click', 'capture'])
</script>

<style scoped>
.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 60px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.8s ease-out;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.hero-section h1 {
  font-size: 2.5em;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.hero-section p {
  font-size: 1.2em;
  margin: 10px 0 0;
  opacity: 0.9;
}

.search-section {
  margin-bottom: 30px;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-group {
  display: flex;
  gap: 10px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.address-input {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.analyze-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.analyze-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.analyze-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.address-type {
  margin-top: 15px;
  text-align: right;
  font-size: 14px;
  color: #64748b;
}

.chain-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.chain-tag.eth {
  background: #3b82f6;
  color: white;
}

.chain-tag.trx {
  background: #10b981;
  color: white;
}

.screenshot-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.screenshot-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.screenshot-options {
  position: absolute;
  top: 60px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.screenshot-options button {
  background: none;
  border: none;
  padding: 8px 16px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  color: #1e293b;
  font-size: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.screenshot-options button:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2em;
  }

  .hero-section p {
    font-size: 1em;
  }

  .screenshot-btn {
    position: static;
    margin: 20px auto 0;
    width: fit-content;
  }

  .screenshot-options {
    position: fixed;
    top: auto;
    bottom: 20px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .input-group {
    flex-direction: column;
  }

  .analyze-btn {
    width: 100%;
  }
}
</style> 