export const formatAmount = (value) => {
  if (!value) return '0.0000'
  return parseFloat(value).toFixed(4)
}

export const formatDate = (timestamp) => {
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

export const formatAddress = (address) => {
  if (!address) return '--'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const getTokenIcon = (symbol) => {
  const icons = {
    'TRX': '🌐',
    'USDT': '💵',
    'USDC': '💵',
    'BTT': '🎮',
    'JST': '🎮',
    'SUN': '☀️',
    'WIN': '🎰',
    'NFT': '🖼️',
    // ... 其他代币图标
  }
  return icons[symbol] || '💎'
} 