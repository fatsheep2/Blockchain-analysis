<template>
  <div class="summary-section">
    <h2 class="section-title">地址总结</h2>
    <div v-if="!data" class="no-data">
      <p class="text-gray-500 text-center py-8">暂无数据</p>
    </div>
    <div v-else class="result-grid">
      <div class="result-card animate-fade-in-up [animation-delay:100ms]">
        <div class="card-icon">📊</div>
        <h3>交易总数</h3>
        <p>{{ data.totalTransactions || 0 }}</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:200ms]">
        <div class="card-icon">💰</div>
        <h3>转入金额</h3>
        <p>{{ data.totalInValue || '0' }} USDT</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:300ms]">
        <div class="card-icon">💸</div>
        <h3>转出金额</h3>
        <p>{{ data.totalOutValue || '0' }} USDT</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:400ms]">
        <div class="card-icon">⏰</div>
        <h3>首次交易时间</h3>
        <p>{{ data.firstTransactionTime || '暂无' }}</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:500ms]">
        <div class="card-icon">📈</div>
        <h3>交易频率</h3>
        <p>{{ data.transactionFrequency || '暂无' }}</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:600ms]">
        <div class="card-icon">💎</div>
        <h3>TRX余额</h3>
        <p>{{ data.trxBalance || '0' }} TRX</p>
        <div class="sub-info">
          <span>钱包: {{ data.balancePercentage || '0' }}%</span>
          <span>质押: {{ data.stakedPercentage || '0' }}%</span>
        </div>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:700ms]">
        <div class="card-icon">🔒</div>
        <h3>TRX质押</h3>
        <p>{{ data.trxStaked || '0' }} TRX</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:800ms]">
        <div class="card-icon">⚡</div>
        <h3>能量</h3>
        <p>{{ data.energy?.available === '--' ? '暂无数据' : `${data.energy?.available || 0} / ${data.energy?.total || 0}` }}</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:900ms]">
        <div class="card-icon">🌐</div>
        <h3>带宽</h3>
        <p>{{ data.bandwidth?.available === '--' ? '暂无数据' : `${data.bandwidth?.available || 0} / ${data.bandwidth?.total || 0}` }}</p>
      </div>
      <div class="result-card animate-fade-in-up [animation-delay:1000ms]">
        <div class="card-icon">🗳️</div>
        <h3>投票</h3>
        <p>{{ data.votes?.voted === '- -' ? '- -' : `${data.votes?.voted || 0} / ${data.votes?.total || 0}` }}</p>
        <div class="sub-info">
          <span>未领取奖励: {{ data.votes?.rewards === '- -' ? '- -' : `${data.votes?.rewards || 0} TRX` }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.summary-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 24px;
  margin-top: 20px;
}

.section-title {
  font-size: 20px;
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  min-width: 240px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 16px;
  background: #fff;
  width: 64px;
  height: 64px;
  line-height: 64px;
  border-radius: 50%;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.result-card h3 {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 12px;
  text-align: center;
}

.result-card p {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  word-break: break-word;
}

.sub-info {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  justify-content: space-around;
  gap: 8px;
  width: 100%;
}

@media (max-width: 1200px) {
  .result-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .result-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-card {
    min-width: 0;
  }

  .result-card p {
    font-size: 18px;
  }
}

.no-data {
  @apply bg-gray-50 rounded-lg border border-gray-200;
}
</style> 