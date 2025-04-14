const TRONSCAN_API_KEY = 'f63c8a63-e0d6-4a04-a9b5-1d41b5e668cc'
const BASE_URL = 'https://apilist.tronscanapi.com/api'

export const getTokenBalances = async (address) => {
  const response = await fetch(`${BASE_URL}/account/tokens?address=${address}&start=0&limit=20`)
  if (!response.ok) throw new Error('获取代币余额失败')
  return response.json()
}

export const getTransactions = async (address) => {
  const response = await fetch(`${BASE_URL}/filter/trc20/transfers?limit=20&start=0&sort=-timestamp&count=true&filterTokenValue=0&relatedAddress=${address}`)
  if (!response.ok) throw new Error('获取交易数据失败')
  return response.json()
}

export const getAccountInfo = async (address) => {
  const response = await fetch(`${BASE_URL}/account?address=${address}`)
  if (!response.ok) throw new Error('获取账户信息失败')
  return response.json()
}

export const getResourceInfo = async (address) => {
  const response = await fetch(`${BASE_URL}/account/resourcev2?address=${address}&resourceType=0`)
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