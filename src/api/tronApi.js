const TRONSCAN_API_KEY = 'f63c8a63-e0d6-4a04-a9b5-1d41b5e668cc'
const BASE_URL = 'https://apilist.tronscanapi.com/api'

// 通用请求头
const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Origin': 'https://tronscan.org',
  'Referer': 'https://tronscan.org/'
})

export const getTokenBalances = async (address, start = 0, limit = 50) => {
  const response = await fetch(`${BASE_URL}/account/tokens?address=${address}&start=${start}&limit=${limit}`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('获取代币余额失败')
  return response.json()
}

export const getTransactions = async (address, start = 0, limit = 50) => {
  const response = await fetch(`${BASE_URL}/filter/trc20/transfers?limit=${limit}&start=${start}&sort=-timestamp&count=true&filterTokenValue=0&relatedAddress=${address}`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('获取交易数据失败')
  return response.json()
}

// 获取所有交易记录（分页获取）
export const getAllTransactions = async (address, batchSize = 50) => {
  let allTransactions = []
  let start = 0
  let hasMore = true
  
  while (hasMore) {
    try {
      const response = await getTransactions(address, start, batchSize)
      
      if (response.token_transfers && response.token_transfers.length > 0) {
        allTransactions = allTransactions.concat(response.token_transfers)
        start += batchSize
        
        // 如果返回的数据少于batchSize，说明已经获取完所有数据
        if (response.token_transfers.length < batchSize) {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    } catch (error) {
      console.error(`获取第${start/batchSize + 1}页交易数据失败:`, error)
      hasMore = false
    }
  }
  
  return allTransactions
}

export const getAccountInfo = async (address) => {
  const response = await fetch(`${BASE_URL}/account?address=${address}`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('获取账户信息失败')
  return response.json()
}

export const getResourceInfo = async (address) => {
  const response = await fetch(`${BASE_URL}/account/resourcev2?address=${address}&resourceType=0`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('获取资源信息失败')
  return response.json()
}

export const detectAddressType = (address) => {
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

export const analyzeProfile = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return '无交易'
  }

  const totalTransactions = transactions.length
  const firstTx = transactions[transactions.length - 1]?.block_ts / 1000
  const now = Date.now() / 1000
  const days = Math.max(1, (now - firstTx) / (24 * 60 * 60)) // 至少1天
  const frequency = totalTransactions / days

  if (frequency > 10) {
    return `高频用户 (${frequency.toFixed(2)}笔/天)`
  } else if (frequency > 3) {
    return `活跃用户 (${frequency.toFixed(2)}笔/天)`
  } else if (frequency > 0.1) {
    return `普通用户 (${frequency.toFixed(2)}笔/天)`
  } else {
    return `低频用户 (${frequency.toFixed(2)}笔/天)`
  }
}

export const calculateInOutValues = (transactions, address) => {
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