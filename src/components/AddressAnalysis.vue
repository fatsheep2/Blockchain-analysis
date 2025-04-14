<template>
  <div class="address-analysis">
    <div class="hero-section">
      <h1>波场区块链地址分析</h1>
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
      <div class="screenshot-btn" @click="showScreenshotOptions">
        <i class="icon-camera"></i>
        截图
      </div>
      <div v-if="showOptions" class="screenshot-options">
        <div class="option-item" @click="captureScreenshot('clipboard')">
          <i class="icon-clipboard"></i>
          复制到剪贴板
        </div>
        <div class="option-item" @click="captureScreenshot('download')">
          <i class="icon-download"></i>
          保存到本地
        </div>
      </div>
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
          <p>{{ analysisResult.votes.voted === '- -' ? '- -' : `${analysisResult.votes.voted} / ${analysisResult.votes.total}` }}</p>
          <div class="sub-info">
            <span>未领取奖励: {{ analysisResult.votes.rewards === '- -' ? '- -' : `${analysisResult.votes.rewards} TRX` }}</span>
          </div>
        </div>
      </div>

      <div class="wallet-balance">
        <div class="section-header">
          <h3>钱包余额</h3>
          <div class="total-value">
            <span class="label">总价值</span>
            <span class="amount">{{ formatAmount(totalWalletValue) }} USDT</span>
          </div>
        </div>
        <div class="token-list">
          <div class="token-item" v-for="token in tokenBalances" :key="token.symbol">
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

      <div class="charts-container">
        <div class="chart-container">
          <div ref="transactionChart" class="chart"></div>
        </div>
        <div class="chart-container">
          <div ref="addressStatsChart" class="chart"></div>
        </div>
        <div class="chart-container">
          <div ref="incomingPieChart" class="chart"></div>
        </div>
        <div class="chart-container">
          <div ref="outgoingPieChart" class="chart"></div>
        </div>
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
            <div class="col sortable" @click="sortTransactions('time')">
              时间 {{ getSortIcon('time') }}
            </div>
            <div class="col sortable" @click="sortTransactions('type')">
              类型 {{ getSortIcon('type') }}
            </div>
            <div class="col sortable" @click="sortTransactions('address')">
              地址 {{ getSortIcon('address') }}
            </div>
            <div class="col sortable" @click="sortTransactions('amount')">
              金额 {{ getSortIcon('amount') }}
            </div>
            <div class="col sortable" @click="sortTransactions('status')">
              状态 {{ getSortIcon('status') }}
            </div>
          </div>
          <div v-for="tx in transactions" :key="tx.transaction_id" class="transaction-item">
            <div class="col" data-label="时间">{{ formatDate(tx.block_ts / 1000) }}</div>
            <div class="col" data-label="类型">
              <span :class="['tx-type', tx.from_address === address ? 'out' : 'in']">
                {{ tx.from_address === address ? '转出' : '转入' }}
              </span>
            </div>
            <div class="col" data-label="地址">
              <div class="address-container">
                <span class="address-text">
                  {{ tx.from_address === address ? formatAddress(tx.to_address) : formatAddress(tx.from_address) }}
                </span>
                <button 
                  class="copy-btn"
                  @click="copyToClipboard(tx.from_address === address ? tx.to_address : tx.from_address)"
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import html2canvas from 'html2canvas'

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  PieChart,
  CanvasRenderer
])

const address = ref('TYH9hdjkhctttSmzDkNhuPwgtBWYzNfQ1Y')
const loading = ref(false)
const addressData = ref(null)
const addressType = ref('TRX')
const transactionChart = ref(null)
const addressStatsChart = ref(null)
const incomingPieChart = ref(null)
const outgoingPieChart = ref(null)
const chartType = ref('line')
const transactions = ref([])
const sortConfig = ref({
  key: 'time',
  direction: 'desc'
})
const error = ref(null)
const analysisResult = ref({
  balance: '- -',
  transactions: '- -',
  totalAssets: '- -',
  walletPercentage: '- -',
  portfolioPercentage: '- -',
  trxStaked: '- -',
  bandwidth: {
    total: '- -',
    available: '- -'
  },
  energy: {
    total: '- -',
    available: '- -'
  },
  votes: {
    voted: '- -',
    total: '- -',
    rewards: '- -'
  }
})
const addressInfo = ref(null)
const showOptions = ref(false)
const tokenBalances = ref([])
const totalWalletValue = ref(0)

// 声明图表实例
let chartInstance = null
let addressStatsChartInstance = null
let incomingPieChartInstance = null
let outgoingPieChartInstance = null

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
    return 'TRX'
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
  tokenBalances.value = [] // 清空之前的代币数据

  try {
    const detectedType = detectAddressType(address.value)
    if (!detectedType) {
      throw new Error('无效的地址格式')
    }

    addressType.value = detectedType  // 更新地址类型

    if (detectedType === 'TRX') {
      // 获取代币余额
      const tokenResponse = await fetch(`https://apilist.tronscanapi.com/api/account/tokens?address=${address.value}&start=0&limit=20`)
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        if (tokenData.data) {
          // 处理代币数据
          const tokens = tokenData.data.map(token => ({
            symbol: token.tokenAbbr.toUpperCase(),
            name: token.tokenName,
            balance: token.balance / Math.pow(10, token.tokenDecimal),
            usdtValue: token.amountInUsd || 0,
            price: token.tokenPriceInUsd || 0,
            logo: token.tokenLogo,
            type: token.tokenType,
            holders: token.nrOfTokenHolders,
            transfers: token.transferCount,
            isContract: tokenData.contractMap[token.tokenId] || false,
            contractInfo: tokenData.contractInfo[token.tokenId] || null
          }))
          
          // 添加 TRX 代币
          const trxToken = tokens.find(t => t.symbol === 'TRX')
          if (!trxToken) {
            tokens.unshift({
              symbol: 'TRX',
              name: 'TRON',
              balance: addressInfo.value?.balance / 1e6 || 0,
              usdtValue: (addressInfo.value?.balance / 1e6) * (tokenData.data.find(t => t.tokenAbbr === 'trx')?.tokenPriceInUsd || 0),
              price: tokenData.data.find(t => t.tokenAbbr === 'trx')?.tokenPriceInUsd || 0,
              logo: 'https://static.tronscan.org/production/logo/trx.png',
              type: 'trc10',
              holders: 0,
              transfers: 0,
              isContract: false,
              contractInfo: null
            })
          }
          
          tokenBalances.value = tokens
          totalWalletValue.value = tokens.reduce((sum, token) => sum + (token.usdtValue || 0), 0)
        }
      }

      // 获取交易数据
      const txResponse = await fetch(`https://apilist.tronscanapi.com/api/filter/trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&filterTokenValue=0&relatedAddress=${address.value}`)
      
      // 获取地址信息
      const infoResponse = await fetch(`https://apilist.tronscanapi.com/api/account?address=${address.value}`)
      
      // 获取资源信息
      let resourceData = null
      try {
        const resourceResponse = await fetch(`https://apilist.tronscanapi.com/api/account/resourcev2?address=${address.value}&resourceType=0`)
        if (resourceResponse.ok) {
          resourceData = await resourceResponse.json()
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
      trxBalance: formatAmount(trxBalance),
      trxStaked: formatAmount(trxStaked),
      stakedPercentage,
      balancePercentage,
      bandwidth: {
        available: addressInfo.value?.resources?.bandwidth?.available ?? '--',
        total: addressInfo.value?.resources?.bandwidth?.total ?? '--'
      },
      energy: {
        available: addressInfo.value?.resources?.energy?.available ?? '--',
        total: addressInfo.value?.resources?.energy?.total ?? '--'
      },
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
          drawTransactionChart(transactions.value, detectedType)
          drawAddressStatsChart(addressStats)
          drawPieCharts(addressStats)
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
          fontSize: 18,
          fontWeight: 'normal'
        },
        left: 'center',
        top: 20
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 14
        },
        formatter: function(params) {
          return `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>
                  <div style="color: #3b82f6">金额: ${formatAmount(params[0].value)} USDT</div>`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: 'USDT',
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#3b82f6',
          borderWidth: 2
        },
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(59, 130, 246, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(59, 130, 246, 0.1)'
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
  
  const container = addressStatsChart.value
  container.style.width = '100%'
  container.style.height = '400px'
  
  if (addressStatsChartInstance) {
    addressStatsChartInstance.dispose()
  }
  
  try {
    addressStatsChartInstance = echarts.init(container)
    
    // 合并转入和转出数据，计算每个地址的总交易量
    const addressData = {}
    
    // 处理转入数据
    Object.entries(addressStats.in).forEach(([addr, amount]) => {
      addressData[addr] = {
        in: amount,
        out: 0,
        total: amount
      }
    })
    
    // 处理转出数据
    Object.entries(addressStats.out).forEach(([addr, amount]) => {
      if (addressData[addr]) {
        addressData[addr].out = amount
        addressData[addr].total += amount
      } else {
        addressData[addr] = {
          in: 0,
          out: amount,
          total: amount
        }
      }
    })
    
    // 按照总交易量排序
    const sortedAddresses = Object.entries(addressData)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10) // 只取前10个地址
    
    // 准备图表数据
    const data = sortedAddresses.map(([addr, data]) => ({
      name: formatAddress(addr),
      fullAddress: addr,
      value: data.total,
      inPercentage: (data.in / data.total * 100).toFixed(2),
      outPercentage: (data.out / data.total * 100).toFixed(2),
      inValue: data.in,
      outValue: data.out
    }))
    
    const option = {
      title: {
        text: '交易地址统计',
        textStyle: {
          color: '#333',
          fontSize: 18,
          fontWeight: 'normal'
        },
        left: 'center',
        top: 20
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: 14
        },
        formatter: function(params) {
          const data = params[0].data
          return `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].name}</div>
                  <div style="color: #4caf50">转入: ${formatAmount(data.inValue)} USDT (${data.inPercentage}%)</div>
                  <div style="color: #f44336">转出: ${formatAmount(data.outValue)} USDT (${data.outPercentage}%)</div>
                  <div style="margin-top: 5px; color: #666; font-size: 12px;">点击地址可复制</div>`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'USDT',
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          formatter: function(value, index) {
            return value
          }
        }
      },
      series: [{
        name: '交易总额',
        type: 'bar',
        data: data,
        itemStyle: {
          color: function(params) {
            const data = params.data
            const inPercentage = parseFloat(data.inPercentage)
            const outPercentage = parseFloat(data.outPercentage)
            
            // 根据转入转出比例生成渐变色
            return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#4caf50' },
              { offset: inPercentage / 100, color: '#4caf50' },
              { offset: inPercentage / 100, color: '#f44336' },
              { offset: 1, color: '#f44336' }
            ])
          },
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '40%'
      }]
    }

    addressStatsChartInstance.setOption(option)
    addressStatsChartInstance.resize()

    // 添加点击事件
    addressStatsChartInstance.on('click', function(params) {
      if (params.componentType === 'yAxis') {
        const index = params.value
        const fullAddress = data[index].fullAddress
        copyToClipboard(fullAddress)
      } else if (params.componentType === 'series') {
        const index = params.dataIndex
        const fullAddress = data[index].fullAddress
        copyToClipboard(fullAddress)
      }
    })
  } catch (error) {
    console.error('Error initializing address stats chart:', error)
  }
}

const drawPieCharts = (addressStats) => {
  // 绘制转入地址饼图
  if (incomingPieChart.value) {
    const container = incomingPieChart.value
    container.style.width = '100%'
    container.style.height = '400px'
    
    if (incomingPieChartInstance) {
      incomingPieChartInstance.dispose()
    }
    
    try {
      incomingPieChartInstance = echarts.init(container)
      
      // 处理转入数据
      const inData = Object.entries(addressStats.in)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([addr, amount]) => ({
          name: formatAddress(addr),
          value: amount,
          fullAddress: addr
        }))
      
      const option = {
        title: {
          text: '转入地址分布',
          textStyle: {
            color: '#333',
            fontSize: 18,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 20
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          textStyle: {
            color: '#333',
            fontSize: 14
          },
          formatter: function(params) {
            const percentage = ((params.value / Object.values(addressStats.in).reduce((a, b) => a + b, 0)) * 100).toFixed(2)
            return `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                    <div style="color: #4caf50">金额: ${formatAmount(params.value)} USDT</div>
                    <div style="color: #666">占比: ${percentage}%</div>
                    <div style="margin-top: 5px; color: #666; font-size: 12px;">点击地址可复制</div>`
          }
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 50,
          bottom: 20,
          textStyle: {
            color: '#666',
            fontSize: 12
          }
        },
        series: [{
          name: '转入地址',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: false
          },
          data: inData
        }]
      }

      incomingPieChartInstance.setOption(option)
      incomingPieChartInstance.resize()

      // 添加点击事件
      incomingPieChartInstance.on('click', function(params) {
        if (params.data.fullAddress) {
          copyToClipboard(params.data.fullAddress)
        }
      })
    } catch (error) {
      console.error('Error initializing incoming pie chart:', error)
    }
  }

  // 绘制转出地址饼图
  if (outgoingPieChart.value) {
    const container = outgoingPieChart.value
    container.style.width = '100%'
    container.style.height = '400px'
    
    if (outgoingPieChartInstance) {
      outgoingPieChartInstance.dispose()
    }
    
    try {
      outgoingPieChartInstance = echarts.init(container)
      
      // 处理转出数据
      const outData = Object.entries(addressStats.out)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([addr, amount]) => ({
          name: formatAddress(addr),
          value: amount,
          fullAddress: addr
        }))
      
      const option = {
        title: {
          text: '转出地址分布',
          textStyle: {
            color: '#333',
            fontSize: 18,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 20
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          textStyle: {
            color: '#333',
            fontSize: 14
          },
          formatter: function(params) {
            const percentage = ((params.value / Object.values(addressStats.out).reduce((a, b) => a + b, 0)) * 100).toFixed(2)
            return `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                    <div style="color: #f44336">金额: ${formatAmount(params.value)} USDT</div>
                    <div style="color: #666">占比: ${percentage}%</div>
                    <div style="margin-top: 5px; color: #666; font-size: 12px;">点击地址可复制</div>`
          }
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 10,
          top: 50,
          bottom: 20,
          textStyle: {
            color: '#666',
            fontSize: 12
          }
        },
        series: [{
          name: '转出地址',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: false
          },
          data: outData
        }]
      }

      outgoingPieChartInstance.setOption(option)
      outgoingPieChartInstance.resize()

      // 添加点击事件
      outgoingPieChartInstance.on('click', function(params) {
        if (params.data.fullAddress) {
          copyToClipboard(params.data.fullAddress)
        }
      })
    } catch (error) {
      console.error('Error initializing outgoing pie chart:', error)
    }
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
  if (incomingPieChartInstance) {
    incomingPieChartInstance.resize()
  }
  if (outgoingPieChartInstance) {
    outgoingPieChartInstance.resize()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  if (addressStatsChartInstance) {
    addressStatsChartInstance.dispose()
    addressStatsChartInstance = null
  }
  if (incomingPieChartInstance) {
    incomingPieChartInstance.dispose()
    incomingPieChartInstance = null
  }
  if (outgoingPieChartInstance) {
    outgoingPieChartInstance.dispose()
    outgoingPieChartInstance = null
  }
})

const showScreenshotOptions = () => {
  showOptions.value = !showOptions.value
}

const captureScreenshot = async (type) => {
  try {
    // 获取整个页面内容
    const element = document.documentElement
    if (!element) return

    // 显示加载提示
    const loading = document.createElement('div')
    loading.className = 'screenshot-loading'
    loading.innerHTML = '正在生成截图...'
    document.body.appendChild(loading)

    // 创建截图
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: true,
      height: element.scrollHeight,
      windowHeight: element.scrollHeight,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        // 确保克隆的文档中包含所有样式
        const style = clonedDoc.createElement('style')
        style.textContent = `
          html, body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .address-analysis {
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            min-height: 100vh;
            padding: 20px;
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
          .result-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .result-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            min-width: 200px;
            overflow: hidden;
          }
          .result-card h3 {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .result-card p {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            padding: 12px;
            background: #f8fafc;
            border-radius: 12px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .chart-container {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          .transaction-list {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          .screenshot-btn, .screenshot-options {
            display: none;
          }
        `
        clonedDoc.head.appendChild(style)
      }
    })

    if (type === 'clipboard') {
      // 复制到剪贴板
      canvas.toBlob((blob) => {
        const item = new ClipboardItem({ 'image/png': blob })
        navigator.clipboard.write([item])
          .then(() => {
            alert('截图已复制到剪贴板')
          })
          .catch(() => {
            alert('复制失败，请尝试保存到本地')
          })
          .finally(() => {
            document.body.removeChild(loading)
            showOptions.value = false
          })
      }, 'image/png')
    } else {
      // 保存到本地
      canvas.toBlob((blob) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `区块链地址分析_${address.value.slice(0, 6)}...${address.value.slice(-4)}.png`
        link.click()
        URL.revokeObjectURL(link.href)
        document.body.removeChild(loading)
        showOptions.value = false
      }, 'image/png')
    }
  } catch (error) {
    console.error('截图失败:', error)
    alert('截图失败，请重试')
    document.body.removeChild(loading)
    showOptions.value = false
  }
}

// 点击其他地方关闭选项
const handleClickOutside = (event) => {
  if (!event.target.closest('.screenshot-btn') && !event.target.closest('.screenshot-options')) {
    showOptions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const copyToClipboard = async (text) => {
  try {
    // 创建一个临时的textarea元素
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    
    // 选择文本
    textarea.select()
    textarea.setSelectionRange(0, 99999)
    
    // 执行复制命令
    document.execCommand('copy')
    
    // 移除临时元素
    document.body.removeChild(textarea)
    
    // 移除已存在的提示框（如果有）
    const existingToast = document.querySelector('.copy-toast')
    if (existingToast) {
      document.body.removeChild(existingToast)
    }
    
    // 创建新的提示框
    const toast = document.createElement('div')
    toast.className = 'copy-toast'
    toast.textContent = '地址已复制'
    document.body.appendChild(toast)
    
    // 2秒后移除提示框
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast)
      }
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

const getTokenIcon = (symbol) => {
  const icons = {
    'TRX': '🌐',
    'USDT': '💵',
    'USDC': '💵',
    'BTT': '🎮',
    'JST': '🎮',
    'SUN': '☀️',
    'WIN': '🎰',
    'NFT': '🖼️',
    'BTC': '₿',
    'ETH': 'Ξ',
    'BNB': '🔶',
    'LTC': 'Ł',
    'DOGE': 'Ð',
    'XRP': '✕',
    'ADA': '₳',
    'DOT': '●',
    'LINK': '🔗',
    'UNI': '🦄',
    'AAVE': '👻',
    'CAKE': '🥞',
    'SUSHI': '🍣',
    'YFI': '💰',
    'COMP': '💱',
    'MKR': '🏦',
    'SNX': '⚡',
    'CRV': '🔄',
    'BAL': '⚖️',
    'REN': '🔄',
    'KNC': '🔧',
    'ZRX': '0x',
    'BAT': '🦇',
    'REP': '🏛️',
    'OMG': '💎',
    'ENJ': '🎮',
    'MANA': '🎮',
    'SAND': '🏖️',
    'AXS': '🎮',
    'CHZ': '⚽',
    'GRT': '🌐',
    'MATIC': '🔷',
    'AVAX': '❄️',
    'FTM': '👻',
    'ONE': '1️⃣',
    'SOL': '🔆',
    'ATOM': '⚛️',
    'NEAR': '🌐',
    'ALGO': '🔷',
    'VET': '🔋',
    'THETA': '🎥',
    'XTZ': 'ꜩ',
    'EOS': 'ε',
    'TRX': '🌐',
    'XLM': '★',
    'HBAR': '⚡',
    'IOTA': 'ι',
    'NEO': '👾',
    'ONT': '🔷',
    'QTUM': 'Ⓠ',
    'WAVES': '🌊',
    'ZIL': 'ⓩ',
    'RVN': '🦊',
    'SC': '💎',
    'HNT': '📡',
    'FIL': '🗄️',
    'AR': '🗄️',
    'STORJ': '🗄️',
    'ANKR': '🔗',
    'COTI': '💎',
    'OCEAN': '🌊',
    'BAND': '🎸',
    'NMR': '💎',
    'UMA': '⚖️',
    'API3': '🔗',
    'PHA': '🔒',
    'POLS': '🎮',
    'DIA': '📊',
    'RAMP': '🔄',
    'PLA': '🎮',
    'TVK': '🎮',
    'BADGER': '🦡',
    'FIS': '🎣',
    'BOND': '🔗',
    'KP3R': '🔧',
    'ALPHA': 'α',
    'COVER': '🛡️',
    'PICKLE': '🥒',
    'CREAM': '🍦',
    'SWRV': '🔄',
    'SUSHI': '🍣',
    'YAM': '🍠',
    'SPELL': '✨',
    'ICE': '❄️',
    'TRU': '🔍',
    'LON': '🔍',
    'MASK': '🎭',
    'API3': '🔗',
    'PHA': '🔒',
    'POLS': '🎮',
    'DIA': '📊',
    'RAMP': '🔄',
    'PLA': '🎮',
    'TVK': '🎮',
    'BADGER': '🦡',
    'FIS': '🎣',
    'BOND': '🔗',
    'KP3R': '🔧',
    'ALPHA': 'α',
    'COVER': '🛡️',
    'PICKLE': '🥒',
    'CREAM': '🍦',
    'SWRV': '🔄',
    'SUSHI': '🍣',
    'YAM': '🍠',
    'SPELL': '✨',
    'ICE': '❄️',
    'TRU': '🔍',
    'LON': '🔍',
    'MASK': '🎭'
  }
  return icons[symbol] || '💎'
}

// 添加排序函数
const sortTransactions = (key) => {
  if (sortConfig.value.key === key) {
    // 如果点击的是当前排序的列，则切换排序方向
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    // 如果点击的是新列，则设置新的排序键和默认降序
    sortConfig.value.key = key
    sortConfig.value.direction = 'desc'
  }

  // 执行排序
  transactions.value.sort((a, b) => {
    let valueA, valueB

    switch (key) {
      case 'time':
        valueA = a.block_ts
        valueB = b.block_ts
        break
      case 'type':
        valueA = a.from_address === address.value ? 'out' : 'in'
        valueB = b.from_address === address.value ? 'out' : 'in'
        break
      case 'address':
        valueA = a.from_address === address.value ? a.to_address : a.from_address
        valueB = b.from_address === address.value ? b.to_address : b.from_address
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
}

// 获取排序图标
const getSortIcon = (key) => {
  if (sortConfig.value.key !== key) {
    return '↕️'
  }
  return sortConfig.value.direction === 'asc' ? '↑' : '↓'
}
</script>

<style scoped>
.address-analysis {
  padding: 20px;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  animation: loadingPulse 1.5s infinite;
}

@keyframes loadingPulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
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

.screenshot-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  animation: buttonFloat 2s infinite;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes buttonFloat {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

.screenshot-btn:hover {
  background: #2563eb;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.screenshot-btn .icon-camera {
  width: 16px;
  height: 16px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-10c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
}

.screenshot-options {
  position: fixed;
  top: 60px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  z-index: 1000;
}

.option-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: #f8fafc;
}

.option-item .icon-clipboard {
  width: 16px;
  height: 16px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
}

.option-item .icon-download {
  width: 16px;
  height: 16px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
}

.screenshot-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  z-index: 1001;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  min-width: 200px;
  overflow: hidden;
}

.result-card h3 {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-card p {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  overflow-x: auto;
  max-width: 100%;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  min-width: 300px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.pie-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.transaction-list {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-top: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
  max-width: 100%;
}

.list-content {
  min-width: 800px;
}

.list-columns {
  display: grid;
  grid-template-columns: 160px 100px 240px 140px 100px;
  gap: 12px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 8px;
}

.transaction-item {
  display: grid;
  grid-template-columns: 160px 100px 240px 140px 100px;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.3s ease;
}

.transaction-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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

@media (max-width: 768px) {
  .wallet-balance {
    padding: 12px;
    margin-bottom: 15px;
  }

  .token-list {
    min-width: 500px;
  }

  .token-item {
    padding: 12px;
    gap: 8px;
    min-width: 450px;
  }

  .token-info {
    min-width: 200px;
    max-width: 250px;
  }

  .token-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .token-details {
    max-width: 150px;
  }

  .token-name {
    font-size: 14px;
  }

  .token-symbol {
    font-size: 12px;
    padding: 2px 6px;
  }

  .token-balance {
    min-width: 150px;
    max-width: 200px;
  }

  .token-balance .amount {
    font-size: 16px;
  }

  .token-balance .usdt-value {
    font-size: 12px;
  }

  .charts-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .chart-container {
    height: 350px;
    padding: 15px;
  }

  .pie-chart {
    min-height: 300px;
  }

  .transaction-list {
    padding: 12px;
    margin-top: 15px;
  }

  .list-content {
    min-width: 700px;
  }

  .list-columns {
    grid-template-columns: 140px 80px 200px 120px 80px;
  }

  .transaction-item {
    grid-template-columns: 140px 80px 200px 120px 80px;
  }

  .tx-type, .tx-status {
    padding: 3px 8px;
    font-size: 11px;
  }

  .address-container {
    padding: 6px;
  }

  .address-text {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .wallet-balance {
    padding: 8px;
    margin-bottom: 12px;
  }

  .token-list {
    min-width: 450px;
  }

  .token-item {
    padding: 8px;
    gap: 6px;
    min-width: 400px;
  }

  .token-info {
    min-width: 180px;
    max-width: 220px;
  }

  .token-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .token-details {
    max-width: 120px;
  }

  .token-name {
    font-size: 13px;
  }

  .token-symbol {
    font-size: 11px;
    padding: 1px 4px;
  }

  .token-balance {
    min-width: 120px;
    max-width: 180px;
  }

  .token-balance .amount {
    font-size: 14px;
  }

  .token-balance .usdt-value {
    font-size: 11px;
  }

  .chart-container {
    height: 300px;
    padding: 10px;
  }

  .pie-chart {
    min-height: 250px;
  }

  .transaction-list {
    padding: 8px;
    margin-top: 12px;
  }

  .list-content {
    min-width: 600px;
  }

  .list-columns {
    grid-template-columns: 120px 70px 180px 100px 70px;
  }

  .transaction-item {
    grid-template-columns: 120px 70px 180px 100px 70px;
  }

  .tx-type, .tx-status {
    padding: 2px 6px;
    font-size: 10px;
  }

  .address-container {
    padding: 4px;
  }

  .address-text {
    font-size: 10px;
  }
}
</style>