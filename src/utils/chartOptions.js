import * as echarts from 'echarts/core'
import { formatAmount } from './formatter'

export const getTransactionChartOption = (transactions) => {
  // 按日期对交易进行分组和汇总
  const transactionsByDate = {}
  transactions.forEach(tx => {
    const timestamp = tx.block_ts / 1000
    const date = new Date(timestamp * 1000).toLocaleDateString()
    const amount = parseFloat(tx.quant || 0) / 1e6
    
    if (!transactionsByDate[date]) {
      transactionsByDate[date] = amount
    } else {
      transactionsByDate[date] += amount
    }
  })
  
  // 转换为数组并按日期排序
  const sortedData = Object.entries(transactionsByDate)
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
  
  const dates = sortedData.map(([date]) => date)
  const values = sortedData.map(([, amount]) => amount)

  return {
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
      left: '10%',
      right: '5%',
      bottom: '20%',
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
        fontSize: 12,
        rotate: 45,
        margin: 16,
        formatter: function(value) {
          return value.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$2-$3')
        }
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
        fontSize: 12,
        formatter: function(value) {
          if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k'
          }
          return value
        }
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
}

export const getPieChartOption = (data, title, isIncoming = true) => {
  return {
    title: {
      text: title,
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
        const percentage = ((params.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(2)
        return `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                <div style="color: ${isIncoming ? '#4caf50' : '#f44336'}">金额: ${formatAmount(params.value)} USDT</div>
                <div style="color: #666">占比: ${percentage}%</div>
                <div style="margin-top: 5px; color: #666; font-size: 12px;">点击地址可复制</div>`
      }
    },
    legend: {
      show: false
    },
    series: [{
      name: isIncoming ? '转入地址' : '转出地址',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
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
      data: data
    }]
  }
} 