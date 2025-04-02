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

    <div v-if="addressData" class="analysis-results">
      <div class="cards-grid">
        <div class="card info-card">
          <div class="card-header">
            <h3>基本信息</h3>
            <span class="icon">📊</span>
          </div>
          <div class="info-container">
            <div class="info-item">
              <div class="info-icon">📝</div>
              <div class="info-content">
                <span class="label">总交易次数</span>
                <span class="value">{{ addressData.totalTransactions }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">💰</div>
              <div class="info-content">
                <span class="label">总交易金额</span>
                <span class="value highlight">{{ formatAmount(addressData.totalValue) }} {{ addressType === 'ETH' ? 'ETH' : 'TRX' }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">⏰</div>
              <div class="info-content">
                <span class="label">首次交易时间</span>
                <span class="value">{{ formatDate(addressData.firstTransaction) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <h3>交易趋势</h3>
            <div class="chart-controls">
              <button 
                :class="['chart-btn', chartType === 'line' ? 'active' : '']"
                @click="chartType = 'line'"
              >
                折线图
              </button>
              <button 
                :class="['chart-btn', chartType === 'bar' ? 'active' : '']"
                @click="chartType = 'bar'"
              >
                柱状图
              </button>
            </div>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="card profile-card">
        <div class="card-header">
          <h3>用户画像</h3>
          <span class="icon">👤</span>
        </div>
        <div class="profile-container">
          <div class="profile-header">
            <span :class="['profile-tag', getProfileType(addressData.profile.type)]">
              {{ addressData.profile.type }}
            </span>
          </div>
          <div class="profile-content">
            <p>{{ addressData.profile.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const address = ref('TFGqVkQCdHxMEZd7Ys6MbvTh8MwPuB7Lkh')
const loading = ref(false)
const addressData = ref(null)
const addressType = ref('')
const chartRef = ref(null)
const chartType = ref('line')
let chart = null

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
    alert('请输入地址')
    return
  }

  const type = detectAddressType(address.value)
  if (!type) {
    alert('无效的地址格式')
    return
  }

  addressType.value = type
  loading.value = true

  try {
    let response
    if (type === 'ETH') {
      response = await axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address.value,
          startblock: 0,
          endblock: 99999999,
          sort: 'asc',
          apikey: ETHERSCAN_API_KEY
        }
      })
    } else {
      response = await axios.get(`https://apilist.tronscanapi.com/api/token_trc20/transfers-with-status`, {
        params: {
          address: address.value,
          limit: 50,
          start: 0,
          sort: '-timestamp',
          count: true,
          trc20Id: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // USDT 合约地址
        },
        headers: {
          'TRON-PRO-API-KEY': TRONSCAN_API_KEY
        }
      })
    }

    if (type === 'ETH' ? response.data.status === '1' : response.data.data) {
      const transactions = type === 'ETH' ? response.data.result : response.data.data
      addressData.value = {
        totalTransactions: transactions.length,
        totalValue: calculateTotalValue(transactions, type),
        firstTransaction: getFirstTransactionTimestamp(transactions, type),
        transactions: transactions,
        profile: analyzeProfile(transactions, type)
      }
      
      initChart(transactions, type)
    } else {
      alert('获取数据失败')
    }
  } catch (error) {
    console.error(error)
    alert('请求出错')
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

.cards-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.icon {
  font-size: 24px;
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: #f1f5f9;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.info-content {
  flex: 1;
}

.label {
  display: block;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.value.highlight {
  color: #3b82f6;
  font-size: 24px;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.chart-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.profile-container {
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
}

.profile-header {
  text-align: center;
  margin-bottom: 20px;
}

.profile-tag {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 500;
  color: white;
}

.profile-tag.whale {
  background: #ef4444;
}

.profile-tag.active {
  background: #f59e0b;
}

.profile-tag.inactive {
  background: #64748b;
}

.profile-tag.normal {
  background: #3b82f6;
}

.profile-content {
  text-align: center;
  color: #64748b;
  line-height: 1.6;
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
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .analyze-btn {
    width: 100%;
  }
}
</style>