<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { useUser } from '@/composables/useUser'
import * as echarts from 'echarts'

const router = useRouter()
const { currentUser, getCurrentUser } = useUser()

const stats = ref({})

const incomingCount = ref(0) // 待收
const outgoingCount = ref(0) // 待发
const pendingReceive = ref(0)
const pendingPay = ref(0)

// chart DOM refs
const itemsCatEl = ref(null)
const itemsKeeperEl = ref(null)
const invCatEl = ref(null)
const invOwnerEl = ref(null)

// modal to show enlarged chart
const modalVisible = ref(false)
const modalTitle = ref('')
const modalChartEl = ref(null)
let modalChart = null
const modalSeriesData = ref([])

let itemsCatChart = null
let itemsKeeperChart = null
let invCatChart = null
let invOwnerChart = null

const goReceive = () => router.push({ name: 'parcelReceive' })
const goSend = () => router.push({ name: 'parcelSend' })

const formatPieData = (list) => {
  if (!list || !Array.isArray(list)) return []
  return list.map(it => {
    const val = (it.cnt !== undefined && it.cnt !== null) ? it.cnt : ((it.value !== undefined && it.value !== null) ? it.value : 0)
    return { value: Number(val), name: it.name || it.dictname || '' }
  })
}

const formatCurrency = (num) => {
  const n = Number(num || 0)
  return `$${n.toFixed(2)}`
}

const formatInteger = (v) => {
  const n = Number(v || 0)
  return Math.round(n).toString()
}

// get userId from currentUser or localStorage; ensure currentUser is populated
const getUserId = () => {
  try {
    getCurrentUser()
  } catch (e) { /* ignore */ }
  const fromCurrent = currentUser.value?.userId || currentUser.value?.id
  if (fromCurrent) return Number(fromCurrent)
  try {
    const loginUser = JSON.parse(localStorage.getItem('loginUser') || '{}')
    return Number(loginUser.userId || loginUser.id || null) || null
  } catch (e) {
    return null
  }
}

// --- per-card refresh handlers ---
const refreshParcels = async () => {
  const userId = getUserId()
  if (!userId) return
  try {
    const res = await request.get('/home/stats', { params: { userId } })
    if (res && res.code === 1) {
      const pendingParcels = (res.data || {}).pendingParcels || {}
      incomingCount.value = pendingParcels.rcvCnt || 0
      outgoingCount.value = pendingParcels.sntCnt || 0
    }
  } catch (err) { console.error('refreshParcels error', err) }
}

const refreshStatements = async () => {
  const userId = getUserId()
  if (!userId) return
  try {
    const res = await request.get('/home/stats', { params: { userId } })
    if (res && res.code === 1) {
      const pendingSettlement = (res.data || {}).pendingSettlement || {}
      pendingReceive.value = Number(pendingSettlement.pendingReceive || 0)
      pendingPay.value = Number(pendingSettlement.pendingPay || 0)
    }
  } catch (err) { console.error('refreshStatements error', err) }
}

const refreshItems = async () => {
  const userId = getUserId()
  if (!userId) return
  try {
    const res = await request.get('/home/stats', { params: { userId } })
    if (res && res.code === 1) {
      const data = (res.data || {}).myItems || {}
      const itemsByCategory = formatPieData(data.byCategory)
      const keeperDistribution = formatPieData(data.keeperDistribution)
      await nextTick()
      itemsCatChart = itemsCatChart || initChart(itemsCatEl.value, itemsByCategory, 'Categories', 'bottom')
      itemsKeeperChart = itemsKeeperChart || initChart(itemsKeeperEl.value, keeperDistribution, 'Warehouses', 'bottom')
      itemsCatChart.setOption({ series: [{ data: itemsByCategory }] })
      itemsKeeperChart.setOption({ series: [{ data: keeperDistribution }] })
      // ensure canvas sizes update
      itemsCatChart.resize()
      itemsKeeperChart.resize()
    }
  } catch (err) { console.error('refreshItems error', err) }
}

const refreshInventory = async () => {
  const userId = getUserId()
  if (!userId) return
  try {
    const res = await request.get('/home/stats', { params: { userId } })
    if (res && res.code === 1) {
      const data = (res.data || {}).myInventory || {}
      const invByCategory = formatPieData(data.byCategory)
      const invOwnerDist = formatPieData(data.ownerDistribution)
      await nextTick()
      invCatChart = invCatChart || initChart(invCatEl.value, invByCategory, 'Categories')
      invOwnerChart = invOwnerChart || initChart(invOwnerEl.value, invOwnerDist, 'Owners')
      invCatChart.setOption({ series: [{ data: invByCategory }] })
      invOwnerChart.setOption({ series: [{ data: invOwnerDist }] })
      invCatChart.resize()
      invOwnerChart.resize()
    }
  } catch (err) { console.error('refreshInventory error', err) }
}

const initChart = (el, data, title, legendPos = 'vertical') => {
  if (!el) return null
  const chart = echarts.init(el)
  // build legend config without null values
  // hide legend; use tooltip on hover to show details
  const legendObj = { show: false }
  const option = {
    title: { text: title || '', left: 'center', top: 6, textStyle: { fontSize: 12 } },
    tooltip: { trigger: 'item' },
    legend: legendObj,
    series: [
      {
        name: title || '',
        type: 'pie',
        radius: ['30%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: data
      }
    ]
  }
  // no special left-legend layout adjustments (use default vertical placement)
  // no legend; tooltip will show item details on hover
  chart.setOption(option)
  // open enlarged view when user clicks a slice
  try {
    chart.on('click', (params) => {
      try {
        const seriesData = chart.getOption().series?.[0]?.data || []
        openModal(title, seriesData, legendPos === 'left' ? 'left' : 'right')
      } catch (e) { /* ignore */ }
    })
  } catch (e) { /* ignore if event attach fails */ }
  // ensure chart canvas updates to container size
  setTimeout(() => { try { chart.resize() } catch (e) { /* ignore */ } }, 0)
  return chart
}

const openModal = async (title, data, legendPos = 'right') => {
  modalTitle.value = title || ''
  modalSeriesData.value = Array.isArray(data) ? data : []
  modalVisible.value = true
  await nextTick()
  try {
    if (modalChart) { modalChart.dispose(); modalChart = null }
    modalChart = echarts.init(modalChartEl.value)
    const option = {
      title: { text: modalTitle.value || '', left: 'center', top: 8, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      legend: { show: true, orient: legendPos === 'left' ? 'vertical' : 'vertical', left: legendPos === 'left' ? 'left' : 'right', top: 'middle' },
      series: [
        {
          name: modalTitle.value || '',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          labelLine: { show: false },
          data: modalSeriesData.value
        }
      ]
    }
    modalChart.setOption(option)
    setTimeout(() => { try { modalChart.resize() } catch (e) { /* ignore */ } }, 0)
  } catch (e) { console.error('openModal error', e) }
}

const handleModalClose = () => {
  modalVisible.value = false
  try { if (modalChart) { modalChart.dispose(); modalChart = null } } catch (e) { /* ignore */ }
}

const resizeAll = () => {
  itemsCatChart?.resize()
  itemsKeeperChart?.resize()
  invCatChart?.resize()
  invOwnerChart?.resize()
}

const loadStats = async () => {
  const userId = getUserId()
  if (!userId) return
  try {
    const res = await request.get('/home/stats', { params: { userId } })
    if (res && res.code === 1) {
      stats.value = res.data || {}

      // pending parcels
      const pendingParcels = stats.value.pendingParcels || {}
      incomingCount.value = pendingParcels.rcvCnt || 0
      outgoingCount.value = pendingParcels.sntCnt || 0

      // pending settlement
      const pendingSettlement = stats.value.pendingSettlement || {}
      pendingReceive.value = Number(pendingSettlement.pendingReceive || 0)
      pendingPay.value = Number(pendingSettlement.pendingPay || 0)

      // init/update charts
      const itemsByCategory = formatPieData(stats.value.myItems?.byCategory)
      const keeperDistribution = formatPieData(stats.value.myItems?.keeperDistribution)
      const invByCategory = formatPieData(stats.value.myInventory?.byCategory)
      const invOwnerDist = formatPieData(stats.value.myInventory?.ownerDistribution)

      // init charts if not yet (ensure DOM ready)
      await nextTick()
      itemsCatChart = itemsCatChart || initChart(itemsCatEl.value, itemsByCategory, 'Categories', 'bottom')
      itemsKeeperChart = itemsKeeperChart || initChart(itemsKeeperEl.value, keeperDistribution, 'Warehouses', 'bottom')
      invCatChart = invCatChart || initChart(invCatEl.value, invByCategory, 'Categories', 'left')
      invOwnerChart = invOwnerChart || initChart(invOwnerEl.value, invOwnerDist, 'Owners', 'left')

      // update data (setOption will merge)
      itemsCatChart.setOption({ series: [{ data: itemsByCategory }] })
      itemsKeeperChart.setOption({ series: [{ data: keeperDistribution }] })
      invCatChart.setOption({ series: [{ data: invByCategory }] })
      invOwnerChart.setOption({ series: [{ data: invOwnerDist }] })
      // trigger resize so canvas updates to new container size
      resizeAll()
    }
  } catch (err) {
    console.error('loadStats error', err)
  }
}

onMounted(async () => {
  await loadStats()
  window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  itemsCatChart?.dispose()
  itemsKeeperChart?.dispose()
  invCatChart?.dispose()
  invOwnerChart?.dispose()
})
</script>

<template>
  <div class="home-root">
    <div class="card-grid">
      <el-card class="home-card" shadow="hover">
        <div class="card-content">
          <div class="card-header">
            <h3>待处理包裹 Processing Parcel</h3>
            <button class="refresh-btn" @click="refreshParcels" title="刷新">⟲</button>
          </div>
          <div class="counts-row stmt-row parcel-row">
            <div class="count-box stmt parcel" @click="goReceive" role="button">
              <div class="count-label">待收包裹</div>
              <div class="amount-number receive">{{ formatInteger(incomingCount) }}</div>
            </div>
            <div class="count-box stmt parcel" @click="goSend" role="button">
              <div class="count-label">待发包裹</div>
              <div class="amount-number send">{{ formatInteger(outgoingCount) }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="home-card" shadow="hover">
        <div class="card-content">
          <div class="card-header">
            <h3>货主统计 My Items</h3>
            <button class="refresh-btn" @click="refreshItems" title="刷新">⟲</button>
          </div>
          <div class="charts-row">
            <div class="chart-wrapper">
              <div ref="itemsCatEl" class="chart-box"></div>
            </div>
            <div class="chart-wrapper">
              <div ref="itemsKeeperEl" class="chart-box"></div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="home-card" shadow="hover">
        <div class="card-content">
          <div class="card-header">
            <h3>我的结算 My Statements</h3>
            <button class="refresh-btn" @click="refreshStatements" title="刷新">⟲</button>
          </div>
          <div class="counts-row stmt-row">
            <div class="count-box stmt">
              <div class="count-label">待收总额</div>
              <div class="amount-number receive">{{ formatCurrency(pendingReceive) }}</div>
            </div>
            <div class="count-box stmt">
              <div class="count-label">待付总额</div>
              <div class="amount-number send">{{ formatCurrency(pendingPay) }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="home-card" shadow="hover">
        <div class="card-content">
          <div class="card-header">
            <h3>仓库统计 My Stocks</h3>
            <button class="refresh-btn" @click="refreshInventory" title="刷新">⟲</button>
          </div>
          <div class="charts-row">
            <div class="chart-wrapper">
              <div ref="invCatEl" class="chart-box"></div>
            </div>
            <div class="chart-wrapper">
              <div ref="invOwnerEl" class="chart-box"></div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model:visible="modalVisible" :title="modalTitle" width="60%" @close="handleModalClose">
      <div ref="modalChartEl" class="modal-chart-box"></div>
    </el-dialog>
  </div>
</template>

<style scoped>
.home-root {
  padding: 24px;
  background-image: url('../../assets/bg.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}
  .home-card {
    border-radius: 12px;
    overflow: visible;
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    transition: transform .18s ease, box-shadow .18s ease;
    height: 300px; /* increased height (approx. 100% taller) */
    background-color: rgba(255,255,255,0.48); /* increased transparency */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.08);
  }
.home-card:hover { transform: translateY(-6px); box-shadow: 0 14px 30px rgba(0,0,0,0.18); }
.card-content { padding: 6px; display:flex; flex-direction:column; justify-content:center; height:20%; }
.card-content { padding: 6px; display:flex; flex-direction:column; justify-content:flex-start; align-items:flex-start; height:100%; }
.card-content h3 { margin: 0 0 8px; font-size: 1.1rem; color: #111 }
.card-content p { margin: 0; color: #333 }

@media (max-width: 720px) {
  .card-grid { grid-template-columns: 1fr; }
}

/* counts styles */
.counts-row { display:flex; gap:16px; margin-top:12px }
.count-box { flex:1; background:rgba(255,255,255,0.9); border-radius:8px; padding:14px; cursor:pointer; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; border:1px solid rgba(0,0,0,0.04) }
.count-label { color:#666; font-size:14px; margin-bottom:6px }
.count-number { font-size:28px; font-weight:700 }
.count-number.receive { color:#f56c6c }
.count-number.send { color:#409eff }

  /* parcel large centered counts */
  .count-box.parcel { align-items:center; justify-content:center; padding:28px; height:160px; box-sizing:border-box }
  .counts-row.parcel-row { justify-content:space-between; flex-wrap:nowrap }
  /* keep two parcel boxes side-by-side, each ~50% minus gap */
  .count-box.parcel { flex:0 0 calc(50% - 8px); max-width:calc(50% - 8px); margin:0 }
  .count-box.parcel .count-label { text-align:center }
  .big-number { font-size:88px !important; line-height:1; text-align:center }
  /* when parcel also has stmt, keep same side-by-side width */
  .count-box.stmt.parcel { flex:0 0 calc(50% - 8px); max-width:calc(50% - 8px); margin:0 }

@media (max-width: 720px) {
  .counts-row.parcel-row { flex-wrap:wrap }
  .count-box.parcel { flex:0 0 96%; max-width:96%; margin:0 2% }
}

.count-box:active { transform:translateY(1px) }
  .charts-row { display:flex; gap:12px; width:100%; margin-top:12px }
  .chart-wrapper { flex:1; background:rgba(255,255,255,0.9); border-radius:8px; padding:0; border:1px solid rgba(0,0,0,0.04) }
  .chart-box { width:100%; height:207px }
  /* force the internal echarts canvas to follow container height */
  .chart-box > canvas { width:100% !important; height:207px !important; }

  /* modal chart sizing */
  .modal-chart-box { width:100%; height:420px; padding:8px; box-sizing:border-box }
  .modal-chart-box > canvas { width:100% !important; height:420px !important; }
    
  .amount-small { font-size:14px; color:#666 }
  .card-header { display:flex; align-items:center; justify-content:space-between; width:100% }
  .refresh-btn { background:transparent; border:0; font-size:16px; cursor:pointer; color:#666; padding:4px }
  .refresh-btn:hover { color:#333 }
  /* statement amount styles */
  .stmt-row { align-items:center }
  .count-box.stmt { display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:default }
  .amount-number { font-size:48px; font-weight:800; text-align:center; margin-top:6px }
  .amount-number.receive { color:#f56c6c }
  .amount-number.send { color:#409eff }
</style>