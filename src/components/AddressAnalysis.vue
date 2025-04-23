<template>
  <div class="animate-fade-in">
    <div class="hero-section animate-slide-in-left">
      <AddressHeader
        v-model:address="address"
        :loading="loading"
        :address-type="addressType"
        :show-screenshot="!!analysisResult"
        :show-options="showOptions"
        @search="analyzeAddress"
        @screenshot-click="showShareOptions"
        @capture="captureScreenshot"
      />
    </div>

    <div v-if="loading" class="animate-bounce-in">
      <LoadingError :loading="true" />
    </div>
    <div v-else-if="error" class="animate-fade-in">
      <LoadingError :error="error" />
    </div>
    <div v-else class="analysis-results relative">
      <!-- 未分析状态遮罩 -->
      <div v-if="!analysisResult" class="absolute inset-x-0 top-0 bottom-0 bg-gray-900/50 backdrop-blur-sm flex items-start justify-center z-50 pointer-events-auto">
        <div class="text-center text-white p-6 rounded-xl bg-gray-900/80 backdrop-blur shadow-xl max-w-md mx-4 mt-8 md:mt-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-bold mb-2">开始分析</h3>
          <p class="text-gray-300 text-sm">请在上方输入区块链地址，点击"生成报告"开始分析</p>
        </div>
      </div>

      <!-- 截图选项菜单 -->
      <div v-if="showOptions" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center" @click.self="showOptions = false">
        <div class="bg-white rounded-xl shadow-2xl p-4 w-full max-w-sm mx-4 animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">分享分析报告</h3>
            <button @click="showOptions = false" class="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            <!-- 分享部分 -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-500">分享方式</h4>
              <div class="flex flex-col gap-2">
                <!-- 系统分享（仅安卓显示） -->
                <button 
                  v-if="isAndroid"
                  @click="shareViaSystem"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  系统分享
                </button>
                <!-- 复制链接 -->
                <button 
                  @click="copyShareLink"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  复制链接
                </button>
              </div>
            </div>
            
            <!-- 保存部分 -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-500">保存方式</h4>
              <div class="flex flex-col gap-2">
                <!-- 保存到剪贴板 -->
                <button 
                  @click="captureScreenshot('clipboard')"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  保存到剪贴板
                </button>
                <!-- 保存为文件 -->
                <button 
                  @click="captureScreenshot('file')"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  保存为文件
                </button>
              </div>
            </div>

            <!-- 截图区域选择 -->
            <div class="space-y-2 pt-2 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-500">选择保存内容</h4>
              <div class="grid grid-cols-3 gap-2">
                <label class="relative flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    v-model="captureArea"
                    value="summary"
                    class="sr-only peer"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 peer-checked:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span class="text-xs text-center text-gray-600 peer-checked:text-blue-500 font-medium">概要信息</span>
                  <div class="absolute inset-0 border-2 border-transparent rounded-lg peer-checked:border-blue-500"></div>
                </label>
                <label class="relative flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    v-model="captureArea"
                    value="charts"
                    class="sr-only peer"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 peer-checked:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span class="text-xs text-center text-gray-600 peer-checked:text-blue-500 font-medium">概要+图表</span>
                  <div class="absolute inset-0 border-2 border-transparent rounded-lg peer-checked:border-blue-500"></div>
                </label>
                <label class="relative flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    v-model="captureArea"
                    value="full"
                    class="sr-only peer"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 peer-checked:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span class="text-xs text-center text-gray-600 peer-checked:text-blue-500 font-medium">完整报告</span>
                  <div class="absolute inset-0 border-2 border-transparent rounded-lg peer-checked:border-blue-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-6">
        <div class="animate-slide-in-left [animation-delay:200ms] bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
          <AddressSummary :data="analysisResult" />
        </div>
        <div class="animate-slide-in-right [animation-delay:200ms] bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
          <WalletBalance
            :tokens="tokenBalances"
            :total-value="totalWalletValue"
          />
        </div>
      </div>
      
      <div class="mt-8 px-4 md:px-6 animate-fade-in-up [animation-delay:400ms]">
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 p-6">
          <TransactionCharts
            :transactions="transactions"
            :address-stats="addressStats"
          />
        </div>
      </div>
      
      <div class="mt-8 px-4 md:px-6 pb-8 animate-fade-in-up [animation-delay:600ms]">
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
          <TransactionList
            :transactions="transactions"
            :user-address="address"
            @copy-address="copyToClipboard"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { ref, computed } from 'vue'
import AddressHeader from './AddressHeader.vue'
import AddressSummary from './AddressSummary.vue'
import WalletBalance from './WalletBalance.vue'
import TransactionCharts from './TransactionCharts.vue'
import TransactionList from './TransactionList.vue'
import LoadingError from './LoadingError.vue'
import { captureScreenshot as capture } from '../utils/screenshot'
import { formatDate, formatAmount } from '../utils/formatter'
import { useRoute } from 'vue-router'
import html2canvas from 'html2canvas'

const props = defineProps({
  startAddressAnalysis: {
    type: String,
    default: ''
  }
})

const route = useRoute()

// 状态
const address = ref('')
const loading = ref(false)
const error = ref(null)
const addressType = ref('TRX')
const transactions = ref([])
const addressInfo = ref(null)
const tokenBalances = ref([])
const totalWalletValue = ref(0)
const showOptions = ref(false)
const addressStats = ref({ in: {}, out: {} })

// 分析结果
const analysisResult = ref(null)

// 截图区域选择
const captureArea = ref('summary')

// 检测地址类型
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

// 分析地址
const analyzeAddress = async () => {
  if (!address.value) {
    error.value = '请输入地址'
    return
  }

  loading.value = true
  error.value = null
  analysisResult.value = null
  addressInfo.value = null
  tokenBalances.value = [] 
  showOptions.value = false

  try {
    const detectedType = detectAddressType(address.value)
    if (!detectedType) {
      throw new Error('无效的地址格式')
    }

    addressType.value = detectedType

    // 更新URL以包含分析地址（使用hash模式）
    const baseUrl = window.location.origin
    const newUrl = `${baseUrl}/Blockchain-analysis/#/${address.value}`
    // 只有当URL不同时才更新
    if (window.location.href !== newUrl) {
      window.history.replaceState({ path: newUrl }, '', newUrl)
    }

    if (detectedType === 'TRX') {
        // 获取代币余额
        const tokenResponse = await fetch(`https://apilist.tronscanapi.com/api/account/tokens?address=${address.value}&start=0&limit=20`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Origin': 'https://tronscan.org',
            'Referer': 'https://tronscan.org/'
          }
        })
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
        const txResponse = await fetch(`https://apilist.tronscanapi.com/api/filter/trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&filterTokenValue=0&relatedAddress=${address.value}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Origin': 'https://tronscan.org',
            'Referer': 'https://tronscan.org/'
          }
        })
        if (!txResponse.ok) {
            console.error('交易数据响应状态:', txResponse.status)
            throw new Error('获取交易数据失败')
        }
        const txData = await txResponse.json()
        console.log('交易数据:', txData)
        if (!txData.token_transfers) {
            console.error('交易数据格式错误:', txData)
            throw new Error('交易数据格式错误')
        }
        transactions.value = txData.token_transfers

        // 获取地址信息
        const infoResponse = await fetch(`https://apilist.tronscanapi.com/api/account?address=${address.value}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Origin': 'https://tronscan.org',
            'Referer': 'https://tronscan.org/'
          }
        })
        
        // 获取资源信息
        let resourceData = null
        try {
            const resourceResponse = await fetch(`https://apilist.tronscanapi.com/api/account/resourcev2?address=${address.value}&resourceType=0`, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Origin': 'https://tronscan.org',
                'Referer': 'https://tronscan.org/'
              }
            })
            if (resourceResponse.ok) {
                resourceData = await resourceResponse.json()
            }
        } catch (err) {
            console.log('获取资源信息失败:', err)
        }

        // 处理地址信息
        if (infoResponse.ok) {
            const infoData = await infoResponse.json()
            addressInfo.value = infoData
            if (resourceData) {
                addressInfo.value.resources = resourceData
            }
        }

        // 计算转入转出统计
        const { totalIn, totalOut, addressStats: stats } = calculateInOutValues(transactions.value, address.value)
        addressStats.value = { in: {}, out: {} }  // 先重置
        addressStats.value = stats
        console.log('地址统计:', addressStats.value)

        // 计算分析结果
        const totalTransactions = transactions.value.length
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
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 辅助函数
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

  if (frequency > 10) {
    profileType = '高频用户'
  } else if (frequency > 3) {
    profileType = '活跃用户'
  } else if (frequency > 0.1) {
    profileType = '普通用户'
  } else {
    profileType = '低频用户'
  }

  return `${profileType} (${frequency.toFixed(2)}笔/天)`
}

// 截图相关
const showShareOptions = () => {
  showOptions.value = !showOptions.value
}

const isAndroid = computed(() => {
  return /Android/i.test(navigator.userAgent)
})

const copyShareLink = () => {
  const baseUrl = window.location.origin
  const shareText = `${baseUrl}/Blockchain-analysis/#/${address.value}`
  try {
    navigator.clipboard.writeText(shareText)
    showToast('链接已复制，去分享吧', 'top')
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败，请重试', 'top', 'error')
  }
  showOptions.value = false
}

const shareViaSystem = async () => {
  try {
    const baseUrl = window.location.origin
    // const shareText = `${baseUrl}/Blockchain-analysis/#/${address.value}`
    const shareText = `${baseUrl}/#/${address.value}`
    
    if (navigator.share) {
      await navigator.share({
        title: '区块链地址分析报告',
        text: `🚀 我刚刚查看了地址 ${address.value.slice(0, 6)}...${address.value.slice(-4)} 的分析报告。这个地址的交易情况和活跃度真的很有意思，值得看看！快来了解更多详情吧！🔍💰`,
        url: shareText
      })
    }
  } catch (err) {
    console.error('分享失败:', err)
    // 如果系统分享失败，回退到复制链接
    copyShareLink()
  } finally {
    showOptions.value = false
  }
}

const captureScreenshot = async (type) => {
  let element
  switch (captureArea.value) {
    case 'summary':
      // 只截取概要信息（地址概要和钱包余额部分）
      element = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
      break
    case 'charts':
      // 截取到图表部分
      element = document.querySelector('.analysis-results')
      const transactionList = element.querySelector('.mt-8:last-child')
      if (transactionList) {
        transactionList.style.display = 'none'
      }
      break
    case 'full':
    default:
      // 截取完整报告
      element = document.querySelector('.analysis-results')
      break
  }

  if (!element) return
  
  try {
    // 创建加载提示
    const loadingToast = document.createElement('div')
    loadingToast.className = 'screenshot-loading'
    loadingToast.innerHTML = `
      <div class="flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span>正在生成图片...</span>
      </div>
    `
    document.body.appendChild(loadingToast)

    // 等待下一帧确保 DOM 更新
    await nextTick()

    // 处理图片加载错误
    const images = element.getElementsByTagName('img')
    const defaultTokenLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIgOHYxNm0tOC04aDE2TTMuMyA1LjNsMTcuNyAxNy43TTIwLjcgNS4zTDMgMjMiLz48L3N2Zz4='

    // 保存原始src和样式
    const originalSrcs = Array.from(images).map(img => img.src)
    const originalStyles = window.getComputedStyle(element)
    const originalBackground = element.style.background
    const charts = element.querySelectorAll('.echarts')
    const originalChartSizes = Array.from(charts).map(chart => ({
      width: chart.style.width,
      height: chart.style.height
    }))

    // 替换可能失败的图片
    for (const img of images) {
      if (img.src.includes('tronscan.org')) {
        img.onerror = () => {
          img.src = defaultTokenLogo
        }
      }
    }

    // 等待所有图片加载完成
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve) => {
        img.onload = resolve
        img.onerror = () => {
          img.src = defaultTokenLogo
          resolve()
        }
      })
    }))

    // 等待图表重绘
    const echartsInstances = charts.length ? Array.from(charts).map(chart => echarts.getInstanceByDom(chart)) : []
    echartsInstances.forEach(instance => {
      if (instance) {
        instance.resize()
      }
    })
    await new Promise(resolve => setTimeout(resolve, 100))

    // 截图配置
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f9fafb',
      logging: false,
      allowTaint: true,
      width: element.offsetWidth,
      height: element.offsetHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.analysis-results')
        if (clonedElement) {
          // 复制原始样式
          clonedElement.style.background = originalBackground
          clonedElement.style.padding = originalStyles.padding
          clonedElement.style.margin = originalStyles.margin
          clonedElement.style.borderRadius = originalStyles.borderRadius
          clonedElement.style.boxShadow = originalStyles.boxShadow

          // 处理图片
          const clonedImages = clonedElement.getElementsByTagName('img')
          Array.from(clonedImages).forEach((img, index) => {
            if (img.src.includes('tronscan.org')) {
              img.src = defaultTokenLogo
            }
          })

          // 处理图表
          const clonedCharts = clonedElement.querySelectorAll('.echarts')
          Array.from(clonedCharts).forEach((chart, index) => {
            if (originalChartSizes[index]) {
              chart.style.width = originalChartSizes[index].width
              chart.style.height = originalChartSizes[index].height
            }
          })
        }
      }
    })

    // 恢复原始图片src
    Array.from(images).forEach((img, index) => {
      img.src = originalSrcs[index]
    })

    // 移除加载提示
    document.body.removeChild(loadingToast)

    if (type === 'clipboard') {
      // 保存到剪贴板
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        showToast('图片已保存到剪贴板', 'top')
      } catch (err) {
        console.error('保存到剪贴板失败:', err)
        showToast('保存到剪贴板失败，请重试', 'top', 'error')
      }
    } else {
      // 保存为文件
      const link = document.createElement('a')
      link.download = `blockchain-analysis-${address.value}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToast('图片已保存', 'top')
    }

    // 如果是 charts 模式，恢复交易列表显示
    if (captureArea.value === 'charts') {
      const transactionList = document.querySelector('.analysis-results .mt-8:last-child')
      if (transactionList) {
        transactionList.style.display = ''
      }
    }

  } catch (err) {
    console.error('截图失败:', err)
    showToast('保存失败，请重试', 'top', 'error')
  } finally {
    showOptions.value = false
  }
}

const showToast = (message, position = 'top', type = 'success') => {
  // 移除已存在的提示框
  const existingToast = document.querySelector('.copy-toast')
  if (existingToast) {
    document.body.removeChild(existingToast)
  }

  const toast = document.createElement('div')
  toast.className = `copy-toast ${type === 'error' ? 'bg-red-500' : 'bg-black/80'} ${position === 'top' ? 'top-5' : 'bottom-5'}`
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => {
    if (toast.parentNode) {
      document.body.removeChild(toast)
    }
  }, 2000)
}

// 复制功能
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('地址已复制', 'top')
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败，请手动复制', 'top', 'error')
  }
}

// 监听URL变化
const handleUrlChange = () => {
  const hash = window.location.hash
  if (hash) {
    const newAddress = hash.replace('#/', '')
    if (newAddress && newAddress !== address.value) {
      address.value = newAddress
      analyzeAddress()
    }
  }
}

// 添加事件监听器
onMounted(() => {
  // 处理路由参数
  if (props.startAddressAnalysis) {
    console.log('从路由获取到地址:', props.startAddressAnalysis)
    handleAddress(props.startAddressAnalysis)
  }
  
  // 添加hashchange事件监听
  window.addEventListener('hashchange', handleUrlChange)
})

// 移除事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleUrlChange)
})

// 修改handleAddress方法
const handleAddress = (newAddress) => {
  if (!newAddress) return
  console.log('处理地址:', newAddress)
  address.value = newAddress
  analyzeAddress()
}
</script>

<style scoped>
.address-analysis {
  @apply p-5 bg-gray-100 min-h-screen font-sans;
}

.share-button {
  @apply inline-block mb-5 py-2 px-4 bg-blue-500 text-white rounded cursor-pointer transition-colors duration-300;
}

.share-button:hover {
  @apply bg-blue-700;
}

/* 复制提示样式 */
:global(.copy-toast) {
  @apply fixed left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg z-50;
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

/* 截图加载样式 */
:global(.screenshot-loading) {
  @apply fixed inset-0 bg-black/80 flex items-center justify-center text-white text-lg z-50;
}

.analysis-results {
  min-height: calc(100vh - 180px);
  @apply bg-gray-50;
}

/* 添加响应式容器最大宽度 */
.analysis-results > div {
  @apply max-w-7xl mx-auto;
}

/* 添加渐变背景 */
.hero-section {
  @apply bg-gradient-to-br from-blue-500 to-indigo-600;
}
</style>