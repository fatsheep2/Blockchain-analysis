<template>
  <div class="transaction-list">               
    <div class="list-header">
      <h3>交易记录</h3>
      <div class="list-stats">
        <span>共 {{ totalTransactions }} 笔交易</span>
        <div class="pagination-controls">
          <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option value="10">10条/页</option>
            <option value="20">20条/页</option>
            <option value="50">50条/页</option>
            <option value="100">100条/页</option>
          </select>
        </div>
      </div>
    </div>
    <div class="list-content">
      <div class="list-columns">
        <div class="col sortable" @click="sort('time')">
          时间 {{ getSortIcon('time') }}
        </div>
        <div class="col sortable" @click="sort('type')">
          类型 {{ getSortIcon('type') }}
        </div>
        <div class="col sortable" @click="sort('address')">
          地址 {{ getSortIcon('address') }}
        </div>
        <div class="col sortable" @click="sort('amount')">
          金额 {{ getSortIcon('amount') }}
        </div>
        <div class="col sortable" @click="sort('status')">
          状态 {{ getSortIcon('status') }}
        </div>
      </div>
      <div v-for="tx in paginatedTransactions" :key="tx.transaction_id" class="transaction-item">
        <div class="col" data-label="时间">{{ formatDate(tx.block_ts / 1000) }}</div>
        <div class="col" data-label="类型">
          <span :class="['tx-type', tx.from_address === userAddress ? 'out' : 'in']">
            {{ tx.from_address === userAddress ? '转出' : '转入' }}
          </span>
        </div>
        <div class="col" data-label="地址">
          <div class="address-container">
            <span class="address-text">
              {{ tx.from_address === userAddress ? formatAddress(tx.to_address) : formatAddress(tx.from_address) }}
            </span>
            <button 
              class="copy-btn"
              @click="copyAddress(tx.from_address === userAddress ? tx.to_address : tx.from_address)"
              title="复制地址"
            >
              <i class="icon-copy"></i>
            </button>
          </div>
        </div>
        <div class="col" data-label="金额">{{ formatAmount(tx.quant / 1e6) }} USDT</div>
        <div class="col" data-label="状态">
          <span :class="['tx-status', tx.contractRet === 'SUCCESS' ? 'success' : 'failed']">
            {{ tx.contractRet === 'SUCCESS' ? '成功' : '失败' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 分页控件 -->
    <div class="pagination-container" v-if="totalPages > 1">
      <div class="pagination-info">
        显示第 {{ startIndex + 1 }} - {{ endIndex }} 条，共 {{ totalTransactions }} 条
      </div>
      <div class="pagination-controls">
        <button 
          @click="goToPage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            :class="['page-btn', { active: page === currentPage }]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="goToPage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatDate, formatAddress, formatAmount } from '../utils/formatter'

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  userAddress: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['copy-address'])

const sortConfig = ref({
  key: 'time',
  direction: 'desc'
})

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(20)

const sort = (key) => {
  if (sortConfig.value.key === key) {
    // 如果点击的是当前排序的列，则切换排序方向
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    // 如果点击的是新列，则设置新的排序键和默认降序
    sortConfig.value.key = key
    sortConfig.value.direction = 'desc'
  }
  // 重置到第一页
  currentPage.value = 1
}

const sortedTransactions = computed(() => {
  const sorted = [...props.transactions]
  
  sorted.sort((a, b) => {
    let valueA, valueB

    switch (sortConfig.value.key) {
      case 'time':
        valueA = a.block_ts
        valueB = b.block_ts
        break
      case 'type':
        valueA = a.from_address === props.userAddress ? 'out' : 'in'
        valueB = b.from_address === props.userAddress ? 'out' : 'in'
        break
      case 'address':
        valueA = a.from_address === props.userAddress ? a.to_address : a.from_address
        valueB = b.from_address === props.userAddress ? b.to_address : b.from_address
        break
      case 'amount':
        valueA = parseFloat(a.quant)
        valueB = parseFloat(b.quant)
        break
      case 'status':
        valueA = a.contractRet
        valueB = b.contractRet
        break
      default:
        return 0
    }

    if (valueA < valueB) {
      return sortConfig.value.direction === 'asc' ? -1 : 1
    }
    if (valueA > valueB) {
      return sortConfig.value.direction === 'asc' ? 1 : -1
    }
    return 0
  })
  
  return sorted
})

// 分页计算
const totalTransactions = computed(() => sortedTransactions.value.length)
const totalPages = computed(() => Math.ceil(totalTransactions.value / pageSize.value))
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, totalTransactions.value))

const paginatedTransactions = computed(() => {
  return sortedTransactions.value.slice(startIndex.value, endIndex.value)
})

// 可见页码计算
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1 // 重置到第一页
}

const getSortIcon = (key) => {
  if (sortConfig.value.key !== key) {
    return '↕️'
  }
  return sortConfig.value.direction === 'asc' ? '↑' : '↓'
}

const copyAddress = (address) => {
  emit('copy-address', address)
}
</script>

<style scoped>
.transaction-list {
  width: 100%;
  padding: 16px;
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.list-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.list-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #64748b;
}

.page-size-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
}

.list-content {
  width: 100%;
  min-width: 800px;
  overflow-x: auto;
}

.list-columns {
  display: grid;
  grid-template-columns: 180px 100px minmax(200px, 1fr) 150px 100px;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.list-columns .col {
  font-weight: 600;
  color: #64748b;
  text-align: left;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.sortable:hover {
  color: #3b82f6;
}

.transaction-item {
  display: grid;
  grid-template-columns: 180px 100px minmax(200px, 1fr) 150px 100px;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background-color: #f8fafc;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item .col {
  font-size: 14px;
  color: #334155;
  word-break: break-all;
}

.tx-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tx-type.in {
  background-color: #dcfce7;
  color: #166534;
}

.tx-type.out {
  background-color: #fef2f2;
  color: #dc2626;
}

.tx-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tx-status.success {
  background-color: #dcfce7;
  color: #166534;
}

.tx-status.failed {
  background-color: #fef2f2;
  color: #dc2626;
}

.address-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background-color: #e2e8f0;
}

.icon-copy {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'/%3E%3C/svg%3E");
  background-size: contain;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  min-width: 40px;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .transaction-item {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .transaction-item .col {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .transaction-item .col::before {
    content: attr(data-label) ": ";
    font-weight: 600;
    color: #64748b;
  }
  
  .list-columns {
    display: none;
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>