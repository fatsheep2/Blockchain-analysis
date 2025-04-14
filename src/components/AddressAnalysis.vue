<template>
  <div class="address-analysis animate-fade-in">
    <!-- 头部区域 -->
    <AddressHeader
      v-model:address="address"
      :loading="loading"
      :address-type="addressType"
      :show-screenshot="!!analysisResult"
      :show-options="showOptions"
      @search="analyzeAddress"
      @screenshot-click="showScreenshotOptions"
      @capture="captureScreenshot"
    />

    <!-- 加载和错误提示 -->
    <LoadingError 
      :loading="loading"
      :error="error"
    />

    <!-- 分析结果区域 -->
    <div v-if="analysisResult" class="analysis-content animate-fade-in">
        <!-- 地址总结卡片 -->
        <AddressSummary :data="analysisResult" />

        <!-- 分享按钮 -->
        <button @click="shareAnalysis" class="share-button">分享</button>

        <!-- 钱包余额 -->
        <WalletBalance
            :tokens="tokenBalances"
            :total-value="totalWalletValue"
        />

        <!-- 交易图表 -->
        <TransactionCharts
            :transactions="transactions"
            :address-stats="addressStats"
        />

        <!-- 交易列表 -->
        <TransactionList
            :transactions="transactions"
            :user-address="address"
            @copy-address="copyToClipboard"
        />
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
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

const props = defineProps({
  startAddressAnalysis: {
    type: String,
    default: ''
  }
})

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

    // 更新URL以包含分析地址
    const baseUrl = `${window.location.origin}/Blockchain-analysis`
    const newUrl = `${baseUrl}/${address.value}`
    window.history.replaceState({ path: newUrl }, '', newUrl)

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
const showScreenshotOptions = () => {
  showOptions.value = !showOptions.value
}

const captureScreenshot = async (type) => {
  const element = document.querySelector('.address-analysis')
  await capture(element, type, address.value)
  showOptions.value = false
}

// 复制功能
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

// 处理地址参数
const handleAddress = (newAddress) => {
  if (!newAddress) return
  console.log('处理地址:', newAddress)
  address.value = newAddress
  analyzeAddress()
}

// 初始加载
onMounted(() => {
  // 处理路由参数
  if (props.startAddressAnalysis) {
    console.log('从路由获取到地址:', props.startAddressAnalysis)
    handleAddress(props.startAddressAnalysis)
  }
})

// 监听路由参数变化
watch(() => props.startAddressAnalysis, (newAddress) => {
  if (newAddress) {
    console.log('路由地址变化:', newAddress)
    handleAddress(newAddress)
  }
})

const shareAnalysis = () => {
    const shareText = `${window.location.origin}/Blockchain-analysis/${address.value}`
    copyToClipboard(shareText)
    alert('分享链接已复制到剪贴板')
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
  @apply fixed bottom-5 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up;
}

/* 截图加载样式 */
:global(.screenshot-loading) {
  @apply fixed inset-0 bg-black/80 flex items-center justify-center text-white text-lg z-50;
}
</style>