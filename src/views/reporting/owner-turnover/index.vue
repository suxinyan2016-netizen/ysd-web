<template>
  <div class="owner-turnover">
    <h2>{{ $t('menu.reporting.ownerTurnover') }}</h2>
    
    <!-- Filter Section -->
    <div style="margin: 10px 0; padding: 12px; background: #f5f5f5; border: 1px solid #e6e6e6; border-radius: 4px;">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <el-select v-model="filters.keeperId" :placeholder="$t('menu.reporting.warehouse') || 'Warehouse'" clearable style="width: 180px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        
        <el-select v-model="filters.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width: 160px">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="monthrange"
          :start-placeholder="$t('menu.reporting.startMonth') || 'Start Month'"
          :end-placeholder="$t('menu.reporting.endMonth') || 'End Month'"
          format="YYYY-MM"
          value-format="YYYY-MM"
          style="width: 140px"
        />
        
        <el-checkbox v-model="filters.cumulative">{{ $t('menu.reporting.cumulative') || 'Cumulative' }}</el-checkbox>
        
        <el-button type="primary" @click="handleSearch">{{ $t('menu.item.buttons.search') }}</el-button>
        <el-button type="info" @click="handleClear">{{ $t('menu.item.buttons.clear') }}</el-button>
      </div>
    </div>

    <!-- Charts Section -->
    <div v-if="chartData.length > 0" style="margin-top: 20px;">
      <div v-for="(group, groupName) in groupedData" :key="groupName" style="margin-bottom: 30px;">
        <h3>{{ groupName }}</h3>
        <div ref="chartRefs" :style="{ width: '100%', height: '400px' }"></div>
      </div>
    </div>
    
    <div v-else-if="loading" style="text-align: center; padding: 40px;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p style="margin-top: 10px;">Loading...</p>
    </div>
    
    <div v-else style="text-align: center; padding: 40px; color: #999;">
      <p>No data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { inventoryTurnoverApi } from '@/api/report'
import { queryAllApi } from '@/api/user'
import { findByGroupApi } from '@/api/dict'
import { useUser } from '@/composables/useUser'

const { t } = useI18n()
const { currentUser, getCurrentUser } = useUser()

// Filter state
const filters = ref({
  keeperId: null,
  dictId: null,
  cumulative: false
})

const dateRange = ref([])
const loading = ref(false)
const chartData = ref([])
const users = ref([])
const dictOptions = ref([])
const chartRefs = ref([])
const chartInstances = ref([])

// Load users for warehouse dropdown
const loadUsers = async () => {
  try {
    const res = await queryAllApi()
    if (res && res.code === 1) {
      users.value = res.data || []
    } else if (Array.isArray(res)) {
      users.value = res
    }
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

// Load dict options for category dropdown
const loadDictOptions = async () => {
  try {
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res
    
    if (!list || list.length === 0) {
      const res2 = await findByGroupApi(2)
      if (res2 && res2.code === 1) list = res2.data || []
      else if (Array.isArray(res2)) list = res2
    }
    
    dictOptions.value = (list || []).map(d => ({
      dictId: d.dictId ?? d.id ?? d.value,
      dictName: d.dictName ?? d.name ?? d.label
    }))
  } catch (err) {
    console.error('Failed to load dict options:', err)
    dictOptions.value = []
  }
}

// Get default date range (past 12 months)
const getDefaultDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 11)
  
  const formatMonth = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }
  
  return [formatMonth(start), formatMonth(end)]
}

// Group data by keeper_name
const groupedData = computed(() => {
  let dataToGroup = [...chartData.value]
  
  // If dictId is not selected, merge data by month first
  if (!filters.value.dictId) {
    const monthMap = {}
    dataToGroup.forEach(item => {
      const monthKey = item.yyyymm
      const keeperKey = item.keeper_name || 'Unknown'
      const groupKey = `${monthKey}_${keeperKey}`
      
      if (!monthMap[groupKey]) {
        monthMap[groupKey] = {
          yyyymm: item.yyyymm,
          ownerid: item.ownerid,
          owner_name: item.owner_name,
          keeperid: item.keeperid,
          keeper_name: item.keeper_name,
          total_rec_cnt: 0,
          total_send_cnt: 0,
          diff_cnt: 0
        }
      }
      
      monthMap[groupKey].total_rec_cnt += (item.total_rec_cnt || 0)
      monthMap[groupKey].total_send_cnt += (item.total_send_cnt || 0)
      monthMap[groupKey].diff_cnt += (item.diff_cnt || 0)
    })
    
    dataToGroup = Object.values(monthMap)
  }
  
  const groups = {}
  dataToGroup.forEach(item => {
    const key = item.keeper_name || 'Unknown'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })
  return groups
})

// Create chart for each group
const renderCharts = async () => {
  // Destroy existing charts
  chartInstances.value.forEach(chart => chart.dispose())
  chartInstances.value = []
  
  await nextTick()
  
  const groups = groupedData.value
  const refs = chartRefs.value
  let refIndex = 0
  
  Object.keys(groups).forEach((groupName, index) => {
    const groupData = groups[groupName]
    const chartRef = refs[refIndex++]
    
    if (!chartRef) return
    
    const chart = echarts.init(chartRef)
    chartInstances.value.push(chart)
    
    // Sort by yyyymm
    groupData.sort((a, b) => a.yyyymm.localeCompare(b.yyyymm))
    
    const months = groupData.map(item => item.yyyymm)
    let recData = groupData.map(item => item.total_rec_cnt || 0)
    let sendData = groupData.map(item => -(item.total_send_cnt || 0))
    let diffData = groupData.map(item => item.diff_cnt || 0)
    
    // Apply cumulative calculation if checkbox is checked
    if (filters.value.cumulative) {
      for (let i = 1; i < recData.length; i++) {
        recData[i] += recData[i - 1]
        sendData[i] += sendData[i - 1]
        diffData[i] += diffData[i - 1]
      }
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['Inbound', 'Outbound', 'Net'],
        top: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Inbound',
          type: 'bar',
          data: recData,
          itemStyle: {
            color: '#67C23A'
          }
        },
        {
          name: 'Outbound',
          type: 'bar',
          data: sendData,
          itemStyle: {
            color: '#F56C6C'
          }
        },
        {
          name: 'Net',
          type: 'line',
          data: diffData,
          itemStyle: {
            color: '#409EFF'
          },
          lineStyle: {
            width: 2
          }
        }
      ]
    }
    
    chart.setOption(option)
  })
}

// Handle search
const handleSearch = async () => {
  loading.value = true
  try {
    const params = {
      ownerid: currentUser.value?.userId
    }
    
    if (filters.value.keeperId) {
      params.keeperid = filters.value.keeperId
    }
    
    if (filters.value.dictId) {
      params.dictid = filters.value.dictId
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.startMonth = dateRange.value[0]
      params.endMonth = dateRange.value[1]
    }
    
    const res = await inventoryTurnoverApi(params)
    
    if (res && res.code === 1) {
      chartData.value = res.data || []
      await renderCharts()
    } else {
      ElMessage.error(res?.msg || 'Failed to load data')
      chartData.value = []
    }
  } catch (err) {
    console.error('Failed to fetch inventory turnover data:', err)
    ElMessage.error('Failed to load data')
    chartData.value = []
  } finally {
    loading.value = false
  }
}

// Handle clear
const handleClear = () => {
  filters.value = {
    keeperId: null,
    dictId: null
  }
  dateRange.value = getDefaultDateRange()
  handleSearch()
}

onMounted(async () => {
  getCurrentUser()
  await Promise.all([
    loadUsers(),
    loadDictOptions()
  ])
  
  dateRange.value = getDefaultDateRange()
  handleSearch()
})
</script>

<style scoped>
.owner-turnover {
  padding: 20px;
}
</style>
