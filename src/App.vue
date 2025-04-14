<template>
  <div class="app">
    <AddressAnalysis :start-address-analysis="routeAddress" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AddressAnalysis from './components/AddressAnalysis.vue'

const route = useRoute()
const routeAddress = computed(() => {
  // 确保正确处理路由参数
  const address = route.params.address
  return address ? decodeURIComponent(address) : ''
})

// 监听路由变化
watch(routeAddress, (newAddress) => {
  if (newAddress) {
    console.log('检测到新地址:', newAddress)
  }
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden; /* 防止水平滚动 */
  -webkit-overflow-scrolling: touch; /* 优化移动端滚动 */
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  #app {
    width: 100vw;
    overflow-x: hidden;
  }

  .container {
    width: 100%;
    padding: 0 16px;
    box-sizing: border-box;
  }

  .chart-container {
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .echarts {
    width: 100% !important;
    height: 300px !important;
  }

  /* 防止图表溢出 */
  .echarts-container {
    width: 100%;
    overflow: hidden;
  }

  /* 优化表格显示 */
  .transaction-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
  }

  .address-container {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 优化按钮和输入框 */
  button, input {
    -webkit-appearance: none;
    appearance: none;
  }

  /* 优化滚动条 */
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.el-header {
  background-color: #409EFF;
  color: white;
  text-align: center;
  line-height: 60px;
}

.el-main {
  background-color: #f5f7fa;
}
</style>
