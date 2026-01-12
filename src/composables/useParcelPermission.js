import { computed } from 'vue'

export function useParcelPermission(currentUser) {
  // 检查是否有查看权限
  const hasViewPermission = (parcel) => {
    // user_id = 1 不受限制
    if (currentUser.value.userId === 1) return true

    const userId = currentUser.value.userId
    return (
      parcel &&
      (parcel.ownerId === userId ||
        parcel.senderId === userId ||
        parcel.receiverId === userId)
    )
  }

  // 检查是否有删除权限
  const hasDeletePermission = (parcel) => {
    // user_id = 1 有删除权限
    if (currentUser.value.userId === 1) return true

    // 只有owner可以删除
    if (!parcel) return false
    return parcel.ownerId === currentUser.value.userId && parcel.status !== 2
  }

  // 检查是否有编辑权限
  const hasEditPermission = (parcel) => {
    // user_id = 1 有编辑权限
    if (currentUser.value.userId === 1) return true

    // status = 2 (Received)时，普通用户不能编辑
    if (parcel.status === 2) return false

    // 当前用户是owner、sender或receiver时有编辑权限
    const userId = currentUser.value.userId
    return (
      parcel.ownerId === userId ||
      parcel.senderId === userId ||
      parcel.receiverId === userId
    )
  }

  // 批量删除权限检查
  const hasBatchDeletePermission = (parcels) => {
    // user_id = 1 有权限
    if (currentUser.value.userId === 1) return true

    // 检查所有选中的parcel是否都可以删除
    return parcels.every(
      (parcel) =>
        parcel.ownerId === currentUser.value.userId && parcel.status !== 2
    )
  }

  // 添加一个辅助方法：检查是否显示操作按钮
  const showOperationButtons = (parcel) => {
    return (
      hasViewPermission(parcel) &&
      (hasEditPermission(parcel) || hasDeletePermission(parcel))
    )
  }

  return {
    hasViewPermission,
    hasDeletePermission,
    hasEditPermission,
    hasBatchDeletePermission,
    showOperationButtons
  }
}