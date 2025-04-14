<template>
  <div class="transaction-list">               
    <div class="list-header">
      <h3>交易记录</h3>
      <div class="list-stats">
        <span>共 {{ transactions.length }} 笔交易</span>
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
      <div v-for="tx in sortedTransactions" :key="tx.transaction_id" class="transaction-item">
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

const sort = (key) => {
  if (sortConfig.value.key === key) {
    // 如果点击的是当前排序的列，则切换排序方向
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    // 如果点击的是新列，则设置新的排序键和默认降序
    sortConfig.value.key = key
    sortConfig.value.direction = 'desc'
  }
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
  font-size: 14px;
  color: #64748b;
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
  transition: all 0.2s ease;
}

.sortable:hover {
  color: #3b82f6;
}

.list-columns .col:nth-child(4) {
  text-align: right;
}

.list-columns .col:last-child {
  text-align: center;
}

.transaction-item {
  display: grid;
  grid-template-columns: 180px 100px minmax(200px, 1fr) 150px 100px;
  gap: 12px;
  padding: 12px;
  align-items: center;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f1f5f9;
}

.transaction-item:hover {
  background: #f8fafc;
}

.transaction-item .col {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-item .col:nth-child(4) {
  text-align: right;
}

.transaction-item .col:last-child {
  text-align: center;
}

.tx-type, .tx-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 60px;
}

.tx-type.in {
  background: #dcfce7;
  color: #16a34a;
}

.tx-type.out {
  background: #fee2e2;
  color: #dc2626;
}

.tx-status.success {
  background: #dcfce7;
  color: #16a34a;
}

.tx-status.failed {
  background: #fee2e2;
  color: #dc2626;
}

.address-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.address-text {
  font-family: monospace;
  font-size: 13px;
  color: #1e293b;
  word-break: break-all;
}

.copy-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.copy-btn:hover {
  background: #e2e8f0;
  color: #3b82f6;
}

.icon-copy:before {
  content: "📋";
}

@media (max-width: 1200px) {
  .list-content {
    min-width: 700px;
  }
  
  .list-columns {
    grid-template-columns: 140px 80px minmax(180px, 1fr) 120px 80px;
  }
  
  .transaction-item {
    grid-template-columns: 140px 80px minmax(180px, 1fr) 120px 80px;
  }
}

@media (max-width: 768px) {
  .transaction-list {
    padding: 12px;
    margin-top: 15px;
    overflow-x: hidden;
  }

  .list-content {
    min-width: auto;
    width: 100%;
  }

  .list-columns {
    display: none;
  }

  .transaction-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 16px;
    border-bottom: none;
  }

  .transaction-item .col {
    width: 100%;
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: right;
    border-bottom: 1px solid #f1f5f9;
    white-space: normal;
  }

  .transaction-item .col:last-child {
    border-bottom: none;
    text-align: right;
  }

  .transaction-item .col::before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    flex-shrink: 0;
    margin-right: 12px;
  }

  .address-container {
    flex: 1;
    justify-content: flex-end;
    background: transparent;
    padding: 0;
  }

  .address-text {
    font-size: 13px;
    text-align: right;
    word-break: break-all;
  }

  .tx-type, .tx-status {
    margin-left: auto;
  }
}
</style>