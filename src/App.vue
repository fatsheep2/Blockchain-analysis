<template>
  <div class="app">
        <AddressAnalysis />
  </div>
</template>

<script setup>
import AddressAnalysis from './components/AddressAnalysis.vue'
</script>

<style>
.app {
  min-height: 100vh;
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
