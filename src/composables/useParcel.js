import { ref } from 'vue'
import {
  queryPageApi,
  addApi,
  queryInfoApi,
  updateApi,
  deleteApi,
} from "@/api/parcel"
import { ElMessage } from "element-plus"

export function useParcel(searchParams, currentPage, pageSize, currentUser) {
  const parcelList = ref([])
  const total = ref(0)

  // 搜索包裹列表
  const search = async (resetPage = false) => {
    if (resetPage) currentPage.value = 1

    // Pass searchParams values directly. Do NOT default owner/sender/receiver to current user.
    // If no filter values are provided, queryPageApi will only include page and pageSize.
    const result = await queryPageApi(
      searchParams.value.packageNo,
      searchParams.value.status,
      searchParams.value.processId,
      searchParams.value.beginProcessDate,
      searchParams.value.endProcessDate,
      searchParams.value.owner,
      searchParams.value.beginCreateDate,
      searchParams.value.endCreateDate,
      searchParams.value.itemNo,
      searchParams.value.sellerPart,
      searchParams.value.sender,
      null, // senderId
      searchParams.value.beginSendDate,
      searchParams.value.endSendDate,
      searchParams.value.receiver,
      null, // receiverId
      searchParams.value.beginReceivedDate,
      searchParams.value.endReceivedDate,
      searchParams.value.isPaid,
      currentPage.value,
      pageSize.value
    )

    // DEBUG: log API result to help diagnose empty UI
    console.debug('useParcel.search result:', result)

    if (result?.code === 1) {
      parcelList.value = result.data?.rows || []
      total.value = result.data?.total || 0
    } else {
      parcelList.value = []
      total.value = 0
    }
  }

  // 获取包裹详情
  const getParcelDetail = async (parcelId) => {
    const result = await queryInfoApi(parcelId)
    if (result.code && result.data) {
      const data = result.data
      
      // 处理打包单数据
      if (data.packingList && Array.isArray(data.packingList)) {
        data.packingList = data.packingList.map((url) => ({
          url: url,
          name: url.split("/").pop(),
          type: url.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "image/*",
        }))
      }

      // 处理 itemList 中的 itemImages
      if (data.itemList && Array.isArray(data.itemList)) {
        data.itemList.forEach((item) => {
          // 规范化 itemImages：确保是对象数组
          if (item.itemImages && Array.isArray(item.itemImages)) {
            item.itemImages = item.itemImages.map((img) => {
              // 如果是字符串（URL），转换为对象
              if (typeof img === 'string') {
                return {
                  url: img,
                  name: img.split("/").pop(),
                  type: img.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*",
                }
              }
              // 已经是对象，直接返回
              return img
            })
          } else {
            // 确保 itemImages 存在
            item.itemImages = []
          }

          // 清理空字符串日期
          const dateFields = ["receivedDate", "sendDate", "dealerReceivedDate"]
          dateFields.forEach((field) => {
            if (item[field] === "") {
              item[field] = null
            }
          })
        })
      }

      return data
    }
    return null
  }

  // 保存包裹
  const saveParcel = async (parcelData) => {
    const saveData = {
      ...parcelData,
      // 确保包含senderName和receiverName
      senderName: parcelData.senderName || '',
      receiverName: parcelData.receiverName || '',
      packingList: parcelData.packingList
        ? parcelData.packingList.map((file) => ({
            id: file.id || null, // 保留 ID 以便后端识别
            url: file.url || file, // 兼容 URL 字符串和对象
            name: file.name,
            type: file.type,
          }))
        : [],
    }

    // 处理 itemList 中的 itemImages
    if (parcelData.itemList && Array.isArray(parcelData.itemList)) {
      saveData.itemList = parcelData.itemList.map(item => ({
        ...item,
        itemImages: (item.itemImages && Array.isArray(item.itemImages))
          ? item.itemImages.map(img => ({
              id: img.id || null,
              url: img.url || img,
              name: img.name,
              type: img.type,
            }))
          : [],
        // 移除 _images 这个临时字段（用于编辑界面预览）
        _images: undefined,
      }))
    }

    console.log('[useParcel] saveParcel - 原始 parcelData.packingList:', parcelData.packingList);
    console.log('[useParcel] saveParcel - 处理后 saveData.packingList:', saveData.packingList);
    console.log('[useParcel] saveParcel - 处理后 saveData.itemList itemImages:', saveData.itemList?.map(item => ({ itemId: item.itemId, itemImages: item.itemImages })));
    console.log('[useParcel] saveParcel - senderName:', saveData.senderName, 'receiverName:', saveData.receiverName);

    let result
    if (parcelData.parcelId) {
      result = await updateApi(saveData)
    } else {
      result = await addApi(saveData)
    }

    return result
  }

  // 删除包裹
  const deleteParcel = async (parcelId) => {
    const result = await deleteApi(parcelId)
    return result
  }

  return {
    parcelList,
    total,
    search,
    getParcelDetail,
    saveParcel,
    deleteParcel
  }
}
