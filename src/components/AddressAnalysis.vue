<template>
  <div class="address-analysis">
    <div class="hero-section">
      <h1>区块链地址分析</h1>
      <p>输入地址即可查看详细分析报告</p>
    </div>

    <div class="search-section">
      <div class="search-container">
        <div class="input-group">
          <input 
            v-model="address"
            type="text"
            placeholder="请输入以太坊或波场地址"
            class="address-input"
            @keyup.enter="analyzeAddress"
          >
          <button 
            @click="analyzeAddress" 
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

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在分析中...</p>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="analysisResult" class="analysis-result">
      <div class="result-grid">
        <div class="result-card">
          <h3>交易总数</h3>
          <p>{{ analysisResult.totalTransactions }}</p>
        </div>
        <div class="result-card">
          <h3>总交易金额</h3>
          <p>{{ analysisResult.totalValue }} USDT</p>
        </div>
        <div class="result-card">
          <h3>首次交易时间</h3>
          <p>{{ analysisResult.firstTransactionTime }}</p>
        </div>
        <div class="result-card">
          <h3>交易频率</h3>
          <p>{{ analysisResult.transactionFrequency }}</p>
        </div>
      </div>

      <div class="chart-container">
        <canvas ref="transactionChart"></canvas>
      </div>

      <div class="transaction-list">
        <h3>交易记录</h3>
        <div class="list-header">
          <div class="col">时间</div>
          <div class="col">类型</div>
          <div class="col">金额</div>
          <div class="col">状态</div>
        </div>
        <div class="list-content">
          <div v-for="tx in transactions" :key="tx.transaction_id" class="transaction-item">
            <div class="col">{{ formatDate(tx.block_ts) }}</div>
            <div class="col">
              <span :class="tx.from_address === address ? 'out' : 'in'">
                {{ tx.from_address === address ? '转出' : '转入' }}
              </span>
            </div>
            <div class="col">{{ formatAmount(tx.quant) }} USDT</div>
            <div class="col">
              <span :class="tx.contractRet === 'SUCCESS' ? 'success' : 'failed'">
                {{ tx.contractRet }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const address = ref('TFGqVkQCdHxMEZd7Ys6MbvTh8MwPuB7Lkh')
const loading = ref(false)
const addressData = ref(null)
const addressType = ref('')
const chartRef = ref(null)
const chartType = ref('line')
let chart = null
const transactions = ref([])
const error = ref(null)
const analysisResult = ref(null)

const ETHERSCAN_API_KEY = 'YOUR_API_KEY'
const TRONSCAN_API_KEY = 'f63c8a63-e0d6-4a04-a9b5-1d41b5e668cc'

const getProfileType = (type) => {
  const types = {
    '大户': 'whale',
    '活跃用户': 'active',
    '低频用户': 'inactive',
    '普通用户': 'normal'
  }
  return types[type] || 'normal'
}

const initChart = (transactions, type) => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  const dates = transactions.map(tx => {
    const timestamp = type === 'ETH' ? tx.timeStamp : tx.block_timestamp / 1000
    return new Date(timestamp * 1000).toLocaleDateString()
  })
  const values = transactions.map(tx => {
    if (type === 'ETH') {
      return parseFloat(tx.value)
    } else {
      const amount = tx.value || 0
      return parseFloat(amount)
    }
  })

  const option = {
    title: {
      text: '交易金额趋势',
      textStyle: {
        color: '#333',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: type === 'ETH' ? 'ETH' : 'TRX',
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#eee'
        }
      }
    },
    series: [{
      data: values,
      type: chartType.value,
      smooth: true,
      itemStyle: {
        color: type === 'ETH' ? '#409EFF' : '#67C23A'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: type === 'ETH' ? 'rgba(64,158,255,0.3)' : 'rgba(103,194,58,0.3)'
          },
          {
            offset: 1,
            color: 'rgba(255,255,255,0)'
          }
        ])
      }
    }]
  }

  chart.setOption(option)
}

watch(chartType, () => {
  if (addressData.value) {
    initChart(addressData.value.transactions, addressType.value)
  }
})

const detectAddressType = (address) => {
  // 以太坊地址格式：0x开头的40位十六进制字符
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  // 波场地址格式：T开头的33位字符
  const tronRegex = /^T[a-zA-Z0-9]{33}$/
  
  if (ethRegex.test(address)) {
    return 'ETH'
  } else if (tronRegex.test(address)) {
    return 'TRON'
  }
  return null
}

const analyzeAddress = async () => {
  if (!address.value) {
    error.value = '请输入地址'
    return
  }

  loading.value = true
  error.value = null
  analysisResult.value = null

  try {
    const addressType = detectAddressType(address.value)
    if (!addressType) {
      throw new Error('无效的地址格式')
    }

    let response
    if (addressType === 'ETH') {
      response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address.value}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`)
    } else {
      response = await fetch(`https://apilist.tronscanapi.com/api/filter/trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&filterTokenValue=0&relatedAddress=${address.value}`)
    }

    if (!response.ok) {
      throw new Error('获取数据失败')
    }

    const data = await response.json()
    
    if (addressType === 'ETH') {
      if (data.status !== '1') {
        throw new Error(data.message || '获取数据失败')
      }
      transactions.value = data.result
    } else {
      if (!data.token_transfers) {
        throw new Error('获取数据失败')
      }
      transactions.value = data.token_transfers
    }

    // 计算分析结果
    const totalTransactions = transactions.value.length
    const totalValue = calculateTotalValue(transactions.value, addressType)
    const firstTransactionTime = getFirstTransactionTimestamp(transactions.value)
    const transactionFrequency = analyzeProfile(transactions.value)

    analysisResult.value = {
      totalTransactions,
      totalValue: formatAmount(totalValue),
      firstTransactionTime: formatDate(firstTransactionTime),
      transactionFrequency
    }

    // 绘制图表
    nextTick(() => {
      drawTransactionChart(transactions.value, addressType)
    })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const calculateTotalValue = (transactions, type) => {
  if (type === 'ETH') {
    return transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0)
  } else {
    return transactions.reduce((sum, tx) => {
      const amount = tx.amount || 0
      return sum + parseFloat(amount) / 1e6 // USDT 有 6 位小数
    }, 0)
  }
}

const getFirstTransactionTimestamp = (transactions, type) => {
  if (type === 'ETH') {
    return transactions[0]?.timeStamp
  } else {
    return transactions[0]?.block_timestamp / 1000
  }
}

const analyzeProfile = (transactions, chainType) => {
  const totalValue = calculateTotalValue(transactions, chainType)
  const firstTx = getFirstTransactionTimestamp(transactions, chainType)
  const frequency = transactions.length / (Date.now() / 1000 - firstTx)
  
  let profileType = '普通用户'
  let description = ''

  const threshold = chainType === 'ETH' ? 1000 : 100000 // TRON 使用不同的阈值

  if (totalValue > threshold) {
    profileType = '大户'
    description = '该地址交易频繁，交易金额较大，可能是机构投资者或专业交易者。'
  } else if (frequency > 0.1) {
    profileType = '活跃用户'
    description = '该地址交易较为频繁，但单笔交易金额较小，可能是普通用户。'
  } else {
    profileType = '低频用户'
    description = '该地址交易频率较低，可能是普通散户投资者。'
  }

  return { type: profileType, description }
}

const formatAmount = (value) => {
  return (value / (addressType.value === 'ETH' ? 1e18 : 1e6)).toFixed(4)
}

const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString()
}

const drawTransactionChart = (transactions, type) => {
  // Implementation of drawTransactionChart function
}
</script>

<style scoped>
.address-analysis {
  padding: 20px;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 60px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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

.chain-tag.tron {
  background: #10b981;
  color: white;
}

.loading {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #3b82f6;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.analysis-result {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 24px;
  margin-top: 20px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.result-card {
  text-align: center;
}

.result-card h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.result-card p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.chart-container {
  height: 400px;
  width: 100%;
  margin-bottom: 20px;
}

.transaction-list {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.transaction-list h3 {
  margin: 0 0 20px;
  color: #333;
  font-size: 1.2em;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-weight: 600;
  color: #666;
}

.transaction-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background-color: #f8f9fa;
}

.col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.in {
  color: #4caf50;
  font-weight: 500;
}

.out {
  color: #f44336;
  font-weight: 500;
}

.success {
  color: #4caf50;
  font-weight: 500;
}

.failed {
  color: #f44336;
  font-weight: 500;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 20px;
  }
  
  .hero-section h1 {
    font-size: 2em;
  }
  
  .hero-section p {
    font-size: 1em;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .analyze-btn {
    width: 100%;
  }
}
</style>