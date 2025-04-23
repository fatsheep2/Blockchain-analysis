<template>
  <div class="charts-container">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <div class="chart-card">
        <h3 class="text-xl font-semibold mb-4">交易金额分布</h3>
        <div ref="transactionChart" class="chart-container h-[400px]"></div>
      </div>
      
      <div class="chart-card">
        <h3 class="text-xl font-semibold mb-4">地址统计</h3>
        <div ref="addressStatsChart" class="chart-container h-[400px]"></div>
      </div>

      <div class="chart-card">
        <h3 class="text-xl font-semibold mb-4">转入地址分布</h3>
        <div ref="incomingPieChart" class="chart-container h-[400px]"></div>
      </div>

      <div class="chart-card">
        <h3 class="text-xl font-semibold mb-4">转出地址分布</h3>
        <div ref="outgoingPieChart" class="chart-container h-[400px]"></div>
      </div>
    </div>
  </div>
  <!-- Toast 提示 -->
  <Transition name="fade">
    <div v-if="showToast" class="toast-message">
      <span>地址已复制</span>
    </div>
  </Transition>
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
    default: () => []
  },
  addressStats: {
    type: Object,
    default: () => ({
      in: {},
      out: {}
    })
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
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  showToast.value = true
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const initCharts = () => {
  if (!props.transactions || props.transactions.length === 0) {
    console.log('图表数据不足，无法渲染')
    return
  }

  nextTick(() => {
    // 初始化交易金额趋势图
    if (transactionChart.value) {
      if (chartInstances.transaction) {
        chartInstances.transaction.dispose()
      }
      chartInstances.transaction = echarts.init(transactionChart.value)
      const option = {
        title: {
          text: '交易金额趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        xAxis: {
          type: 'category',
          data: props.transactions
            .sort((a, b) => new Date(a.block_ts) - new Date(b.block_ts))
            .map(tx => new Date(tx.block_ts).toLocaleDateString())
        },
        yAxis: {
          type: 'value',
          name: 'USDT'
        },
        series: [{
          data: props.transactions
            .sort((a, b) => new Date(a.block_ts) - new Date(b.block_ts))
            .map(tx => parseFloat(tx.quant) / 1e6),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 141, 240, 0.3)' },
              { offset: 1, color: 'rgba(24, 141, 240, 0.1)' }
            ])
          }
        }]
      }
      chartInstances.transaction.setOption(option)
    }

    // 初始化地址统计图
    if (addressStatsChart.value && props.addressStats) {
      if (chartInstances.addressStats) {
        chartInstances.addressStats.dispose()
      }
      chartInstances.addressStats = echarts.init(addressStatsChart.value)
      const addressData = prepareAddressStatsData()
      chartInstances.addressStats.setOption(addressData)
      
      chartInstances.addressStats.on('click', (params) => {
        if (params.data && params.data.fullAddress) {
          navigator.clipboard.writeText(params.data.fullAddress)
            .then(() => showCopyToast())
            .catch(err => console.error('复制失败:', err))
        }
      })
    }

    // 初始化转入饼图
    if (incomingPieChart.value && props.addressStats.in) {
      if (chartInstances.incomingPie) {
        chartInstances.incomingPie.dispose()
      }
      chartInstances.incomingPie = echarts.init(incomingPieChart.value)
      const inData = prepareIncomingPieData()
      
      if (inData && inData.length > 0) {
        const option = {
          title: {
            // text: '转入地址分布',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} USDT ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 10,
            top: 'middle',
            itemWidth: 10,
            itemHeight: 10,
            textStyle: {
              fontSize: 12,
              width: 60,
              overflow: 'truncate'
            }
          },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['65%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: inData
          }]
        }
        chartInstances.incomingPie.setOption(option)
        
        chartInstances.incomingPie.on('click', (params) => {
          if (params.data && params.data.fullAddress) {
            navigator.clipboard.writeText(params.data.fullAddress)
              .then(() => showCopyToast())
              .catch(err => console.error('复制失败:', err))
          }
        })
      }
    }

    // 初始化转出饼图
    if (outgoingPieChart.value && props.addressStats.out) {
      if (chartInstances.outgoingPie) {
        chartInstances.outgoingPie.dispose()
      }
      chartInstances.outgoingPie = echarts.init(outgoingPieChart.value)
      const outData = prepareOutgoingPieData()
      
      if (outData && outData.length > 0) {
        const option = {
          title: {
            // text: '转出地址分布',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} USDT ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 10,
            top: 'middle',
            itemWidth: 10,
            itemHeight: 10,
            textStyle: {
              fontSize: 12,
              width: 60,
              overflow: 'truncate'
            }
          },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['65%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: outData
          }]
        }
        chartInstances.outgoingPie.setOption(option)
        
        chartInstances.outgoingPie.on('click', (params) => {
          if (params.data && params.data.fullAddress) {
            navigator.clipboard.writeText(params.data.fullAddress)
              .then(() => showCopyToast())
              .catch(err => console.error('复制失败:', err))
          }
        })
      }
    }
  })
}

const prepareAddressStatsData = () => {
  if (!props.addressStats || !props.addressStats.in || !props.addressStats.out) {
    return {}
  }

  const addressData = {}
  
  Object.entries(props.addressStats.in || {}).forEach(([addr, amount]) => {
    addressData[addr] = {
      in: amount,
      out: 0,
      total: amount
    }
  })
  
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
  
  const sortedAddresses = Object.entries(addressData)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
  
  const data = sortedAddresses.map(([addr, data]) => ({
    name: formatAddress(addr),
    fullAddress: addr,
    value: data.total,
    inPercentage: (data.in / data.total * 100).toFixed(2),
    outPercentage: (data.out / data.total * 100).toFixed(2),
    inValue: data.in,
    outValue: data.out
  }))

  return {
    title: {
      text: '交易地址统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
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
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'USDT'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name)
    },
    series: [{
      name: '交易总额',
      type: 'bar',
      data: data,
      itemStyle: {
        color: function(params) {
          const data = params.data
          const inPercentage = parseFloat(data.inPercentage)
          return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#4caf50' },
            { offset: inPercentage / 100, color: '#4caf50' },
            { offset: inPercentage / 100, color: '#f44336' },
            { offset: 1, color: '#f44336' }
          ])
        }
      }
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
  if (!props.addressStats || !props.addressStats.out) {
    return []
  }

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
  window.addEventListener('resize', handleResize)
  initCharts()
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
  nextTick(() => {
    initCharts()
  })
}, { deep: true })

watch(() => props.addressStats, () => {
  nextTick(() => {
    initCharts()
  })
}, { deep: true })
</script>

<style scoped>
.charts-container {
  @apply w-full p-4;
}

.chart-card {
  @apply bg-white rounded-xl shadow-lg p-6;
}

.chart-container {
  @apply w-full;
}

.toast-message {
  @apply fixed top-5 left-1/2 transform -translate-x-1/2 
         bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg z-50;
}

.fade-enter-active,
.fade-leave-active {
  @apply transition-all duration-300 ease-out;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0 -translate-y-4;
}
</style> 