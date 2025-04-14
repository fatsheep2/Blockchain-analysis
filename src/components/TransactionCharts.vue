<template>
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

const initCharts = () => {
  // 检查数据是否存在
  if (!props.transactions || props.transactions.length === 0 ||
      !props.addressStats || !props.addressStats.in || !props.addressStats.out) {
    console.log('图表数据不足，无法渲染')
    return
  }

  // 初始化交易趋势图
  if (transactionChart.value) {
    chartInstances.transaction = echarts.init(transactionChart.value)
    chartInstances.transaction.setOption(getTransactionChartOption(props.transactions))
  }

  // 初始化地址统计图
  if (addressStatsChart.value) {
    chartInstances.addressStats = echarts.init(addressStatsChart.value)
    const addressData = prepareAddressStatsData()
    chartInstances.addressStats.setOption(addressData)
  }

  // 初始化转入饼图
  if (incomingPieChart.value) {
    // 确保容器尺寸已设置
    incomingPieChart.value.style.width = '100%'
    incomingPieChart.value.style.height = '100%'
    
    chartInstances.incomingPie = echarts.init(incomingPieChart.value)
    const inData = prepareIncomingPieData()
    
    // 确保有数据才设置选项
    if (inData && inData.length > 0) {
      chartInstances.incomingPie.setOption(getPieChartOption(inData, '转入地址分布', true))
    }
  }

  // 初始化转出饼图
  if (outgoingPieChart.value) {
    // 确保容器尺寸已设置
    outgoingPieChart.value.style.width = '100%'
    outgoingPieChart.value.style.height = '100%'
    chartInstances.outgoingPie = echarts.init(outgoingPieChart.value)
    const outData = prepareOutgoingPieData()
    
    // 确保有数据才设置选项
    if (outData && outData.length > 0) {
      chartInstances.outgoingPie.setOption(getPieChartOption(outData, '转出地址分布', false))
    }
  }
}

const prepareAddressStatsData = () => {
  // 检查数据完整性
  if (!props.addressStats || !props.addressStats.in || !props.addressStats.out) {
    console.warn('地址统计数据不完整')
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
  initCharts()
  window.addEventListener('resize', handleResize)
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  overflow-x: auto;
  max-width: 100%;
  padding: 10px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 350px;
}

@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 350px;
  }

  .chart {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .charts-container {
    padding: 5px;
    gap: 15px;
  }

  .chart-container {
    padding: 15px;
    height: 300px;
  }

  .chart {
    min-height: 250px;
  }
}
</style> 