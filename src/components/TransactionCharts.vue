<template>
  <div class="charts-container">
    <div class="chart-wrapper">
      <div class="chart-box">
        <div ref="transactionChart" class="chart"></div>
      </div>
      <div class="chart-box">
        <div ref="addressStatsChart" class="chart"></div>
      </div>
      <div class="chart-box">
        <div ref="incomingPieChart" class="chart"></div>
      </div>
      <div class="chart-box">
        <div ref="outgoingPieChart" class="chart"></div>
      </div>
    </div>
    <!-- Toast 提示 -->
    <div v-if="showToast" class="fixed top-5 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
      <span>地址已复制</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getTransactionChartOption, getPieChartOption } from '../utils/chartOptions'
import { formatAddress } from '../utils/formatter'

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

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  addressStats: {
    type: Object,
    required: true
  }
})

const transactionChart = ref(null)
const addressStatsChart = ref(null)
const incomingPieChart = ref(null)
const outgoingPieChart = ref(null)

let chartInstances = {
  transaction: null,
  addressStats: null,
  incomingPie: null,
  outgoingPie: null
}

const showToast = ref(false)
let toastTimer = null

const showCopyToast = () => {
  showToast.value = true
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const initCharts = () => {
  // 检查数据是否存在
  if (!props.transactions || props.transactions.length === 0) {
    console.log('图表数据不足，无法渲染')
    return
  }

  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    // 初始化交易趋势图
    if (transactionChart.value) {
      console.log('初始化交易趋势图')
      if (chartInstances.transaction) {
        chartInstances.transaction.dispose()
      }
      chartInstances.transaction = echarts.init(transactionChart.value)
      chartInstances.transaction.setOption(getTransactionChartOption(props.transactions))
    }

    // 初始化地址统计图
    if (addressStatsChart.value && props.addressStats) {
      console.log('初始化地址统计图')
      if (chartInstances.addressStats) {
        chartInstances.addressStats.dispose()
      }
      chartInstances.addressStats = echarts.init(addressStatsChart.value)
      const addressData = prepareAddressStatsData()
      chartInstances.addressStats.setOption(addressData)
      
      // 添加点击事件
      chartInstances.addressStats.on('click', (params) => {
        if (params.data && params.data.fullAddress) {
          navigator.clipboard.writeText(params.data.fullAddress)
            .then(() => {
              showCopyToast()
            })
            .catch(err => {
              console.error('复制失败:', err)
            })
        }
      })
    }

    // 初始化转入饼图
    if (incomingPieChart.value && props.addressStats && props.addressStats.in) {
      console.log('初始化转入饼图')
      if (chartInstances.incomingPie) {
        chartInstances.incomingPie.dispose()
      }
      chartInstances.incomingPie = echarts.init(incomingPieChart.value)
      const inData = prepareIncomingPieData()
      
      if (inData && inData.length > 0) {
        chartInstances.incomingPie.setOption(getPieChartOption(inData, '转入地址分布', true))
        
        chartInstances.incomingPie.on('click', (params) => {
          if (params.data && params.data.fullAddress) {
            navigator.clipboard.writeText(params.data.fullAddress)
              .then(() => {
                showCopyToast()
              })
              .catch(err => {
                console.error('复制失败:', err)
              })
          }
        })
      }
    }

    // 初始化转出饼图
    if (outgoingPieChart.value && props.addressStats && props.addressStats.out) {
      console.log('初始化转出饼图')
      if (chartInstances.outgoingPie) {
        chartInstances.outgoingPie.dispose()
      }
      chartInstances.outgoingPie = echarts.init(outgoingPieChart.value)
      const outData = prepareOutgoingPieData()
      
      if (outData && outData.length > 0) {
        chartInstances.outgoingPie.setOption(getPieChartOption(outData, '转出地址分布', false))
        
        chartInstances.outgoingPie.on('click', (params) => {
          if (params.data && params.data.fullAddress) {
            navigator.clipboard.writeText(params.data.fullAddress)
              .then(() => {
                showCopyToast()
              })
              .catch(err => {
                console.error('复制失败:', err)
              })
          }
        })
      }
    }
  })
}

const prepareAddressStatsData = () => {
  // 检查数据完整性
  if (!props.addressStats || !props.addressStats.in || !props.addressStats.out) {
    console.warn('地址统计数据不完整:', props.addressStats)
    return {}
  }

  const addressData = {}
  
  // 处理转入数据
  Object.entries(props.addressStats.in || {}).forEach(([addr, amount]) => {
    addressData[addr] = {
      in: amount,
      out: 0,
      total: amount
    }
  })
  
  // 处理转出数据
  Object.entries(props.addressStats.out || {}).forEach(([addr, amount]) => {
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
    .slice(0, 10)
  
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

  console.log('处理后的地址统计数据:', data)

  return {
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
                <div style="color: #4caf50">转入: ${data.inValue.toFixed(4)} USDT (${data.inPercentage}%)</div>
                <div style="color: #f44336">转出: ${data.outValue.toFixed(4)} USDT (${data.outPercentage}%)</div>
                <div style="margin-top: 5px; color: #666; font-size: 12px;">点击地址可复制</div>`
      }
    },
    grid: {
      left: '20%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'USDT',
      nameTextStyle: {
        color: '#666',
        fontSize: 12,
        padding: [0, 0, 0, 20]
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        margin: 14
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
        margin: 20
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
}

const prepareIncomingPieData = () => {
  if (!props.addressStats || !props.addressStats.in) {
    return []
  }
  
  return Object.entries(props.addressStats.in)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([addr, amount]) => ({
      name: formatAddress(addr),
      value: amount,
      fullAddress: addr
    }))
}

const prepareOutgoingPieData = () => {
  return Object.entries(props.addressStats.out)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([addr, amount]) => ({
      name: formatAddress(addr),
      value: amount,
      fullAddress: addr
    }))
}

const handleResize = () => {
  Object.values(chartInstances).forEach(chart => {
    if (chart) {
      chart.resize()
    }
  })
}

onMounted(() => {
  // 等待一帧以确保 DOM 已完全加载
  window.requestAnimationFrame(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(chartInstances).forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
})

watch(() => props.transactions, () => {
  console.log('交易数据变化:', props.transactions)
  nextTick(() => {
    initCharts()
  })
}, { deep: true })

watch(() => props.addressStats, () => {
  console.log('地址统计变化:', props.addressStats)
  nextTick(() => {
    initCharts()
  })
}, { deep: true })
</script>

<style scoped>
.charts-container {
  @apply w-full p-4;
}

.chart-wrapper {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.chart-box {
  @apply bg-white rounded-xl shadow-lg p-6 min-h-[500px];
  height: calc(100vh - 400px);
  min-height: 500px;
  max-height: 800px;
}

.chart {
  @apply w-full h-full;
}

/* 平板电脑布局 */
@media screen and (max-width: 1200px) {
  .chart-wrapper {
    @apply grid-cols-1 gap-4;
  }

  .chart-box {
    @apply p-4 min-h-[400px];
    height: calc(100vh - 300px);
    min-height: 400px;
    max-height: 600px;
  }
}

/* 手机布局 */
@media screen and (max-width: 768px) {
  .charts-container {
    @apply p-2;
  }

  .chart-wrapper {
    @apply gap-3;
  }

  .chart-box {
    @apply p-3 min-h-[300px];
    height: calc(100vh - 200px);
    min-height: 300px;
    max-height: 400px;
  }
}
</style> 