<template>
  <div class="animate-fade-in">
    <div class="hero-section animate-slide-in-left">
      <AddressHeader
        v-model:address="address"
        v-model:fetchAllTransactions="fetchAllTransactions"
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
import { formatDate, formatAmount } from '../utils/formatter'
import { useRoute } from 'vue-router'
import html2canvas from 'html2canvas'
// 导入API模块
import { 
  getTokenBalances, 
  getAllTransactions, 
  getTransactions,
  getAccountInfo, 
  getResourceInfo, 
  detectAddressType as apiDetectAddressType,
  analyzeProfile as apiAnalyzeProfile,
  calculateInOutValues as apiCalculateInOutValues
} from '../api/tronApi'

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

// 获取所有交易记录的选项
const fetchAllTransactions = ref(false)

// 检测地址类型
const detectAddressType = (address) => {
  return apiDetectAddressType(address)
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

    if (detectedType === 'TRX') {
        // 获取代币余额
        try {
            const tokenData = await getTokenBalances(address.value)
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
                
                tokenBalances.value = tokens
                totalWalletValue.value = tokens.reduce((sum, token) => sum + (token.usdtValue || 0), 0)
            }
        } catch (err) {
            console.error('获取代币余额失败:', err)
            // 不抛出错误，继续执行
        }

        // 获取交易数据
        try {
            if (fetchAllTransactions.value) {
                // 获取所有交易记录
                console.log('正在获取所有交易记录...')
                transactions.value = await getAllTransactions(address.value)
                console.log(`成功获取 ${transactions.value.length} 条交易记录`)
            } else {
                // 获取前20条交易记录
                const txData = await getTransactions(address.value, 0, 20)
                if (!txData.token_transfers) {
                    throw new Error('交易数据格式错误')
                }
                transactions.value = txData.token_transfers
                console.log(`获取了 ${transactions.value.length} 条交易记录`)
            }
        } catch (err) {
            console.error('获取交易数据失败:', err)
            throw new Error('获取交易数据失败')
        }

        // 获取地址信息
        try {
            const infoData = await getAccountInfo(address.value)
            addressInfo.value = infoData
            
            // 获取资源信息
            try {
                const resourceData = await getResourceInfo(address.value)
                if (resourceData) {
                    addressInfo.value.resources = resourceData
                }
            } catch (err) {
                console.log('获取资源信息失败:', err)
            }
        } catch (err) {
            console.error('获取地址信息失败:', err)
            // 不抛出错误，继续执行
        }

        // 添加 TRX 代币到余额列表
        if (addressInfo.value && !tokenBalances.value.find(t => t.symbol === 'TRX')) {
            const trxToken = tokenBalances.value.find(t => t.tokenAbbr === 'trx')
            const trxPrice = trxToken?.tokenPriceInUsd || 0
            tokenBalances.value.unshift({
                symbol: 'TRX',
                name: 'TRON',
                balance: addressInfo.value.balance / 1e6 || 0,
                usdtValue: (addressInfo.value.balance / 1e6) * trxPrice,
                price: trxPrice,
                logo: 'https://static.tronscan.org/production/logo/trx.png',
                type: 'trc10',
                holders: 0,
                transfers: 0,
                isContract: false,
                contractInfo: null
            })
            totalWalletValue.value = tokenBalances.value.reduce((sum, token) => sum + (token.usdtValue || 0), 0)
        }

        // 计算转入转出统计
        const { totalIn, totalOut, addressStats: stats } = apiCalculateInOutValues(transactions.value, address.value)
        addressStats.value = stats
        console.log('地址统计:', addressStats.value)

        // 计算分析结果
        const totalTransactions = transactions.value.length
        const firstTransactionTime = getFirstTransactionTimestamp(transactions.value)
        const transactionFrequency = apiAnalyzeProfile(transactions.value)

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
const getFirstTransactionTimestamp = (transactions) => {
  if (!transactions || transactions.length === 0) return null
  // 获取最早的交易时间
  return transactions[transactions.length - 1]?.block_ts / 1000
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
  const shareText = `${baseUrl}/#/${address.value}`
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

    // 设置背景色确保截图效果
    element.style.background = 'white'

    // 调整图表大小以适应截图
    charts.forEach(chart => {
      chart.style.width = '100%'
      chart.style.height = '300px'
    })

    // 等待图表重新渲染
    await new Promise(resolve => setTimeout(resolve, 500))

    // 生成截图
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight
    })

    // 恢复原始样式
    element.style.background = originalBackground
    charts.forEach((chart, index) => {
      chart.style.width = originalChartSizes[index].width
      chart.style.height = originalChartSizes[index].height
    })

    // 移除加载提示
    document.body.removeChild(loadingToast)

    // 处理截图结果
    if (type === 'clipboard') {
      try {
        canvas.toBlob(async (blob) => {
          if (navigator.clipboard && navigator.clipboard.write) {
            const item = new ClipboardItem({ 'image/png': blob })
            await navigator.clipboard.write([item])
            showToast('截图已保存到剪贴板', 'top')
          } else {
            // 回退方案：下载文件
            downloadCanvas(canvas, 'blockchain-analysis.png')
          }
        })
      } catch (err) {
        console.error('保存到剪贴板失败:', err)
        downloadCanvas(canvas, 'blockchain-analysis.png')
      }
    } else {
      downloadCanvas(canvas, 'blockchain-analysis.png')
    }

  } catch (err) {
    console.error('截图失败:', err)
    showToast('截图失败，请重试', 'top', 'error')
    
    // 移除加载提示
    const loadingToast = document.querySelector('.screenshot-loading')
    if (loadingToast) {
      document.body.removeChild(loadingToast)
    }
  }
}

const downloadCanvas = (canvas, filename) => {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL()
  link.click()
  showToast('截图已下载', 'top')
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('地址已复制', 'top')
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败，请重试', 'top', 'error')
  }
}

const showToast = (message, position = 'top', type = 'success') => {
  // 创建toast元素
  const toast = document.createElement('div')
  toast.className = `fixed ${position === 'top' ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // 3秒后自动移除
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 3000)
}

// 监听路由变化
watch(() => props.startAddressAnalysis, (newAddress) => {
  if (newAddress && newAddress !== address.value) {
    address.value = newAddress
    analyzeAddress()
  }
}, { immediate: true })

// 监听地址变化
watch(address, (newAddress) => {
  if (newAddress) {
    // 更新URL
    const baseUrl = window.location.origin
    const newUrl = `${baseUrl}/#/${newAddress}`
    if (window.location.href !== newUrl) {
      window.history.replaceState({ path: newUrl }, '', newUrl)
    }
  }
})

onMounted(() => {
  // 如果有初始地址，开始分析
  if (props.startAddressAnalysis) {
    address.value = props.startAddressAnalysis
    analyzeAddress()
  }
})

onBeforeUnmount(() => {
  // 清理工作
})
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