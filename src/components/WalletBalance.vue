<template>
  <div class="wallet-balance">
    <div class="section-header">
      <h3>钱包余额</h3>
      <div class="total-value">
        <span class="label">总价值</span>
        <span class="amount">{{ formatAmount(totalValue) }} USDT</span>
      </div>
    </div>
    <div class="token-list">
      <div class="token-item" v-for="token in tokens" :key="token.symbol">
        <div class="token-info">
          <div class="token-icon" :style="{ backgroundImage: token.logo ? `url(${token.logo})` : 'none' }">
            <span v-if="!token.logo">{{ getTokenIcon(token.symbol) }}</span>
          </div>
          <div class="token-details">
            <div class="token-name">{{ token.name }}</div>
            <div class="token-symbol">{{ token.symbol }}</div>
          </div>
        </div>
        <div class="token-balance">
          <div class="amount">{{ formatAmount(token.balance) }}</div>
          <div class="usdt-value" v-if="token.usdtValue">
            <span class="label">≈</span>
            <span class="amount">{{ formatAmount(token.usdtValue) }} USDT</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatAmount } from '../utils/formatter'
import { getTokenIcon } from '../utils/formatter'

defineProps({
  tokens: {
    type: Array,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.wallet-balance {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  animation: slideUp 0.5s ease-out forwards;
  overflow-x: auto;
  max-width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
  font-weight: 600;
}

.total-value {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 20px;
}

.total-value .label {
  color: #64748b;
  font-size: 14px;
}

.total-value .amount {
  color: #1e293b;
  font-weight: 600;
  font-size: 16px;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 600px;
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  min-width: 550px;
}

.token-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 250px;
  max-width: 300px;
}

.token-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-size: 24px;
  flex-shrink: 0;
}

.token-details {
  display: flex;
  flex-direction: column;
  max-width: 200px;
  overflow: hidden;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-symbol {
  font-size: 14px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.token-balance {
  text-align: right;
  min-width: 200px;
  max-width: 250px;
}

.token-balance .amount {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-balance .usdt-value {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .wallet-balance {
    padding: 12px;
    margin-bottom: 15px;
  }

  .token-list {
    min-width: auto;
    width: 100%;
  }

  .token-item {
    padding: 12px;
    gap: 12px;
    min-width: auto;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .token-info {
    min-width: 0;
    max-width: 100%;
    width: 100%;
  }

  .token-details {
    max-width: calc(100% - 48px);
  }

  .token-name {
    font-size: 14px;
    white-space: normal;
    word-break: break-word;
  }

  .token-balance {
    min-width: 0;
    max-width: 100%;
    width: 100%;
    text-align: left;
    margin-top: 8px;
    padding-left: 48px;
  }

  .token-balance .amount {
    font-size: 16px;
    white-space: normal;
    word-break: break-word;
  }

  .token-balance .usdt-value {
    font-size: 13px;
    justify-content: flex-start;
  }
}
</style> 