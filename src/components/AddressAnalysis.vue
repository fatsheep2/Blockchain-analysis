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
          <div class="card-icon">📊</div>
          <h3>交易总数</h3>
          <p>{{ analysisResult.totalTransactions }}</p>
        </div>
        <div class="result-card">
          <div class="card-icon">💰</div>
          <h3>转入金额</h3>
          <p>{{ analysisResult.totalInValue }} USDT</p>
        </div>
        <div class="result-card">
          <div class="card-icon">💸</div>
          <h3>转出金额</h3>
          <p>{{ analysisResult.totalOutValue }} USDT</p>
        </div>
        <div class="result-card">
          <div class="card-icon">⏰</div>
          <h3>首次交易时间</h3>
          <p>{{ analysisResult.firstTransactionTime }}</p>
        </div>
        <div class="result-card">
          <div class="card-icon">📈</div>
          <h3>交易频率</h3>
          <p>{{ analysisResult.transactionFrequency }}</p>
        </div>
        <div class="result-card">
          <div class="card-icon">💎</div>
          <h3>TRX余额</h3>
          <p>{{ analysisResult.trxBalance }} TRX</p>
          <div class="sub-info">
            <span>钱包: {{ analysisResult.balancePercentage }}%</span>
            <span>质押: {{ analysisResult.stakedPercentage }}%</span>
          </div>
        </div>
        <div class="result-card">
          <div class="card-icon">🔒</div>
          <h3>TRX质押</h3>
          <p>{{ analysisResult.trxStaked }} TRX</p>
        </div>
        <div class="result-card">
          <div class="card-icon">⚡</div>
          <h3>能量</h3>
          <p>{{ analysisResult.energy.available === '--' ? '暂无数据' : `${analysisResult.energy.available} / ${analysisResult.energy.total}` }}</p>
        </div>
        <div class="result-card">
          <div class="card-icon">🌐</div>
          <h3>带宽</h3>
          <p>{{ analysisResult.bandwidth.available === '--' ? '暂无数据' : `${analysisResult.bandwidth.available} / ${analysisResult.bandwidth.total}` }}</p>
        </div>
        <div class="result-card">
          <div class="card-icon">🗳️</div>
          <h3>投票</h3>
          <p>{{ analysisResult.votes.voted === '--' ? '暂无数据' : `${analysisResult.votes.voted} / ${analysisResult.votes.total}` }}</p>
          <div class="sub-info">
            <span>未领取奖励: {{ analysisResult.votes.rewards === '--' ? '暂无数据' : `${analysisResult.votes.rewards} TRX` }}</span>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <div ref="transactionChart" class="chart"></div>
      </div>

      <div class="chart-container">
        <div ref="addressStatsChart" class="chart"></div>
      </div>

      <div class="transaction-list">               
        <div class="list-header">
          <h3>交易记录</h3>
          <div class="list-stats">
            <span>共 {{ transactions.length }} 笔交易</span>
          </div>
        </div>
        <div class="list-content">
          <div class="list-columns">
            <div class="col">时间</div>
            <div class="col">类型</div>
            <div class="col">地址</div>
            <div class="col">金额</div>
            <div class="col">状态</div>
          </div>
          <div v-for="tx in transactions" :key="tx.transaction_id" class="transaction-item">
            <div class="col" data-label="时间">{{ formatDate(tx.block_ts / 1000) }}</div>
            <div class="col" data-label="类型">
              <span :class="['tx-type', tx.from_address === address ? 'out' : 'in']">
                {{ tx.from_address === address ? '转出' : '转入' }}
              </span>
            </div>
            <div class="col" data-label="地址">
              <span class="address-text">
                {{ tx.from_address === address ? formatAddress(tx.to_address) : formatAddress(tx.from_address) }}
              </span>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const address = ref('TFGqVkQCdHxMEZd7Ys6MbvTh8MwPuB7Lkh')
const loading = ref(false)
const addressData = ref(null)
const addressType = ref('')
const transactionChart = ref(null)
const addressStatsChart = ref(null)
const chartType = ref('line')
const transactions = ref([])
const error = ref(null)
const analysisResult = ref(null)
const addressInfo = ref(null)

// 图表实例
let chartInstance = null
let addressStatsChartInstance = null

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
  if (!transactionChart.value) return
  
  chartInstance = echarts.init(transactionChart.value)
  const dates = transactions.map(tx => {
    const timestamp = type === 'ETH' ? tx.timeStamp : tx.block_timestamp / 1000
    return new Date(timestamp * 1000).toLocaleDateString()
  })
  const values = transactions.map(tx => {
    if (type === 'ETH') {
      return parseFloat(tx.value)
    } else {
      const amount = tx.quant || 0
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

  chartInstance.setOption(option)
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
  addressInfo.value = null

  try {
    const addressType = detectAddressType(address.value)
    if (!addressType) {
      throw new Error('无效的地址格式')
    }

    let response
    if (addressType === 'ETH') {
      response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address.value}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`)
    } else {
      // 获取交易数据
      const txResponse = await fetch(`https://apilist.tronscanapi.com/api/filter/trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&filterTokenValue=0&relatedAddress=${address.value}`)
      
      // 获取地址信息
      const infoResponse = await fetch(`https://apilist.tronscanapi.com/api/account?address=${address.value}`)
      
      // 获取资源信息（使用try-catch单独处理）
      let resourceData = null
      try {
        const resourceResponse = await fetch(`https://apilist.tronscanapi.com/api/account/resourcev2?address=${address.value}&resourceType=0`)
        if (resourceResponse.ok) {
          resourceData = await resourceResponse.json()
          // 处理能量数据
          if (resourceData.data && resourceData.data.length > 0) {
            const energyData = resourceData.data.find(item => item.resource === 1) // 1 表示能量
            if (energyData) {
              addressInfo.value = addressInfo.value || {}
              addressInfo.value.resources = addressInfo.value.resources || {}
              addressInfo.value.resources.energy = {
                available: energyData.resourceValue,
                total: energyData.resourceValue
              }
            }
          }
        }
      } catch (err) {
        console.log('获取资源信息失败:', err)
      }

      // 处理交易数据
      if (!txResponse.ok) {
        throw new Error('获取交易数据失败')
      }
      const txData = await txResponse.json()
      if (!txData.token_transfers) {
        throw new Error('获取交易数据失败')
      }
      transactions.value = txData.token_transfers

      // 处理地址信息
      if (infoResponse.ok) {
        const infoData = await infoResponse.json()
        addressInfo.value = infoData
        if (resourceData) {
          addressInfo.value.resources = resourceData
        }
      }
    }

    // 计算分析结果
    const totalTransactions = transactions.value.length
    const { totalIn, totalOut, addressStats } = calculateInOutValues(transactions.value, address.value)
    const firstTransactionTime = getFirstTransactionTimestamp(transactions.value)
    const transactionFrequency = analyzeProfile(transactions.value)

    // 计算TRX余额和质押比例
    const trxBalance = addressInfo.value ? addressInfo.value.balance / 1e6 : 0
    const trxStaked = addressInfo.value ? (addressInfo.value.power?.totalFrozen || 0) / 1e6 : 0
    const totalTrx = trxBalance + trxStaked
    const stakedPercentage = totalTrx > 0 ? (trxStaked / totalTrx * 100).toFixed(2) : 0
    const balancePercentage = totalTrx > 0 ? (trxBalance / totalTrx * 100).toFixed(2) : 0

    analysisResult.value = {
      totalTransactions,
      totalInValue: formatAmount(totalIn),
      totalOutValue: formatAmount(totalOut),
      firstTransactionTime: formatDate(firstTransactionTime),
      transactionFrequency,
      // TRX信息
      trxBalance: formatAmount(trxBalance),
      trxStaked: formatAmount(trxStaked),
      stakedPercentage,
      balancePercentage,
      // 资源信息（添加默认值和占位符）
      bandwidth: {
        available: addressInfo.value?.resources?.bandwidth?.available ?? '--',
        total: addressInfo.value?.resources?.bandwidth?.total ?? '--'
      },
      energy: {
        available: addressInfo.value?.resources?.energy?.available ?? '--',
        total: addressInfo.value?.resources?.energy?.total ?? '--'
      },
      // 投票信息（添加默认值和占位符）
      votes: {
        voted: addressInfo.value?.votes ?? '--',
        total: 30,
        rewards: addressInfo.value?.rewards ?? '--'
      }
    }

    // 绘制图表
    nextTick(() => {
      if (transactions.value && transactions.value.length > 0) {
        setTimeout(() => {
          drawTransactionChart(transactions.value, addressType)
          drawAddressStatsChart(addressStats)
        }, 300)
      }
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
      const amount = tx.quant || 0
      return sum + parseFloat(amount)
    }, 0)
  }
}

const calculateInOutValues = (transactions, address) => {
  let totalIn = 0
  let totalOut = 0
  const addressStats = {
    in: {},
    out: {}
  }
  
  transactions.forEach(tx => {
    const amount = parseFloat(tx.quant || 0) / 1e6
    if (tx.from_address === address) {
      totalOut += amount
      addressStats.out[tx.to_address] = (addressStats.out[tx.to_address] || 0) + amount
    } else {
      totalIn += amount
      addressStats.in[tx.from_address] = (addressStats.in[tx.from_address] || 0) + amount
    }
  })
  
  return { totalIn, totalOut, addressStats }
}

const getFirstTransactionTimestamp = (transactions) => {
  if (!transactions || transactions.length === 0) return null
  // 获取最早的交易时间
  return transactions[transactions.length - 1]?.block_ts / 1000
}

const analyzeProfile = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return '无交易'
  }

  const totalTransactions = transactions.length
  const firstTx = getFirstTransactionTimestamp(transactions)
  const now = Date.now() / 1000
  const days = Math.max(1, (now - firstTx) / (24 * 60 * 60)) // 至少1天
  const frequency = totalTransactions / days

  let profileType = '普通用户'
  let description = ''

  if (frequency > 10) {
    profileType = '高频用户'
    description = '该地址交易非常频繁，可能是专业交易者或机器人。'
  } else if (frequency > 3) {
    profileType = '活跃用户'
    description = '该地址交易较为频繁，可能是普通用户。'
  } else if (frequency > 0.1) {
    profileType = '普通用户'
    description = '该地址交易频率正常，可能是普通散户投资者。'
  } else {
    profileType = '低频用户'
    description = '该地址交易频率较低，可能是长期持有者。'
  }

  return `${profileType} (${frequency.toFixed(2)}笔/天)`
}

const formatAmount = (value) => {
  if (!value) return '0.0000'
  return parseFloat(value).toFixed(4)
}

const formatDate = (timestamp) => {
  if (!timestamp) return '暂无数据'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  })
}

const drawTransactionChart = (transactions, type) => {
  if (!transactionChart.value) {
    console.error('Transaction chart container not found')
    return
  }
  
  // 确保容器有尺寸
  const container = transactionChart.value
  container.style.width = '100%'
  container.style.height = '400px'
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  try {
    chartInstance = echarts.init(container)
    const dates = transactions.map(tx => {
      const timestamp = tx.block_ts / 1000
      return new Date(timestamp * 1000).toLocaleDateString()
    })
    const values = transactions.map(tx => {
      const amount = tx.quant || 0
      return parseFloat(amount) / 1e6
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
        },
        formatter: function(params) {
          return `${params[0].axisValue}<br/>金额: ${formatAmount(params[0].value)} USDT`
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
        name: 'USDT',
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
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(59, 130, 246, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(255,255,255,0)'
            }
          ])
        }
      }]
    }

    chartInstance.setOption(option)
    chartInstance.resize()
  } catch (error) {
    console.error('Error initializing transaction chart:', error)
  }
}

const drawAddressStatsChart = (addressStats) => {
  if (!addressStatsChart.value) {
    console.error('Address stats chart container not found')
    return
  }
  
  // 确保容器有尺寸
  const container = addressStatsChart.value
  container.style.width = '100%'
  container.style.height = '400px'
  
  if (addressStatsChartInstance) {
    addressStatsChartInstance.dispose()
  }
  
  try {
    addressStatsChartInstance = echarts.init(container)
    // 处理转入数据
    const inData = Object.entries(addressStats.in)
      .map(([addr, amount]) => ({
        name: formatAddress(addr),
        value: amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // 只显示前10个

    // 处理转出数据
    const outData = Object.entries(addressStats.out)
      .map(([addr, amount]) => ({
        name: formatAddress(addr),
        value: amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // 只显示前10个

    // 合并所有地址作为Y轴数据
    const allAddresses = [...new Set([
      ...inData.map(item => item.name),
      ...outData.map(item => item.name)
    ])]

    const option = {
      title: {
        text: '交易地址统计',
        textStyle: {
          color: '#333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = params[0].name + '<br/>'
          params.forEach(param => {
            if (param.value > 0) {
              result += `${param.seriesName}: ${formatAmount(param.value)} USDT<br/>`
            }
          })
          return result
        }
      },
      legend: {
        data: ['转入', '转出'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'USDT',
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
      yAxis: {
        type: 'category',
        data: allAddresses,
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      series: [
        {
          name: '转入',
          type: 'bar',
          data: allAddresses.map(addr => {
            const found = inData.find(item => item.name === addr)
            return found ? found.value : 0
          }),
          itemStyle: {
            color: '#4caf50'
          }
        },
        {
          name: '转出',
          type: 'bar',
          data: allAddresses.map(addr => {
            const found = outData.find(item => item.name === addr)
            return found ? found.value : 0
          }),
          itemStyle: {
            color: '#f44336'
          }
        }
      ]
    }

    addressStatsChartInstance.setOption(option)
    addressStatsChartInstance.resize()
  } catch (error) {
    console.error('Error initializing address stats chart:', error)
  }
}

const formatAddress = (address) => {
  if (!address) return '--'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 窗口大小变化时的重绘
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
  if (addressStatsChartInstance) {
    addressStatsChartInstance.resize()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
  }
  if (addressStatsChartInstance) {
    addressStatsChartInstance.dispose()
  }
})
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
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.result-card {
  text-align: center;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-color: #3b82f6;
}

.card-icon {
  font-size: 32px;
  margin-bottom: 16px;
  background: #fff;
  width: 64px;
  height: 64px;
  line-height: 64px;
  border-radius: 50%;
  margin: 0 auto 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.result-card h3 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

.result-card p {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* 添加暂无数据的样式 */
.result-card p:empty::before {
  content: '暂无数据';
  color: #94a3b8;
  font-size: 16px;
  font-weight: normal;
}

.sub-info {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.sub-info span:empty::before {
  content: '暂无数据';
  color: #94a3b8;
  font-size: 12px;
  font-weight: normal;
}

.chart-container {
  height: 400px;
  width: 100%;
  margin-bottom: 20px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.transaction-list {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-top: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.list-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
  font-weight: 600;
}

.list-stats {
  color: #64748b;
  font-size: 14px;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 20px;
}

.list-columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.transaction-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  border-radius: 8px;
}

.transaction-item:hover {
  background-color: #f8fafc;
  transform: translateX(4px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.tx-type, .tx-status {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
}

.tx-type.in {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.tx-type.out {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.tx-status.success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.tx-status.failed {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.address-text {
  font-family: monospace;
  font-size: 14px;
  color: #64748b;
  word-break: break-all;
}

@media (max-width: 768px) {
  .address-analysis {
    padding: 10px;
  }

  .hero-section {
    padding: 20px 15px;
    margin-bottom: 20px;
  }
  
  .hero-section h1 {
    font-size: 1.8em;
  }
  
  .hero-section p {
    font-size: 0.9em;
  }
  
  .input-group {
    flex-direction: column;
    gap: 8px;
  }
  
  .analyze-btn {
    width: 100%;
  }

  .result-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 15px;
  }

  .result-card {
    padding: 12px;
  }

  .result-card h3 {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .result-card p {
    font-size: 18px;
    padding: 8px;
  }

  .card-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
    line-height: 48px;
    margin-bottom: 8px;
  }

  .chart-container {
    height: 300px;
    padding: 15px;
  }

  .transaction-list {
    padding: 12px;
    margin-top: 15px;
  }

  .list-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
  }

  .list-header h3 {
    font-size: 16px;
  }

  .transaction-item {
    padding: 12px;
    margin-bottom: 8px;
    gap: 6px;
  }

  .transaction-item .col {
    padding: 6px 0;
    font-size: 13px;
  }

  .transaction-item .col:before {
    font-size: 13px;
  }

  .tx-type, .tx-status {
    min-width: 50px;
    padding: 3px 10px;
    font-size: 12px;
  }

  .sub-info {
    font-size: 11px;
  }

  .address-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .address-analysis {
    padding: 8px;
  }

  .hero-section {
    padding: 15px 10px;
  }

  .hero-section h1 {
    font-size: 1.5em;
  }

  .result-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .result-card {
    padding: 10px;
  }

  .result-card h3 {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .result-card p {
    font-size: 16px;
    padding: 6px;
  }

  .card-icon {
    font-size: 20px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    margin-bottom: 6px;
  }

  .chart-container {
    height: 250px;
    padding: 10px;
  }

  .transaction-list {
    padding: 10px;
    margin-top: 12px;
  }

  .list-header {
    margin-bottom: 10px;
    padding-bottom: 6px;
  }

  .list-header h3 {
    font-size: 15px;
  }

  .transaction-item {
    padding: 10px;
    margin-bottom: 6px;
    gap: 4px;
  }

  .transaction-item .col {
    padding: 4px 0;
    font-size: 12px;
  }

  .transaction-item .col:before {
    font-size: 12px;
  }

  .tx-type, .tx-status {
    min-width: 45px;
    padding: 2px 8px;
    font-size: 11px;
  }

  .sub-info {
    font-size: 10px;
  }

  .address-text {
    font-size: 11px;
  }
}
</style>