import { ref } from 'vue'
import { queryAllApi as queryAllUserApi } from "@/api/user"

export function useUser() {
  const users = ref([])
  const currentUser = ref({
    userId: null,
    name: "",
    token: "",
  })

  // 获取当前用户信息
  const getCurrentUser = () => {
    const loginUser = JSON.parse(localStorage.getItem("loginUser"))
    console.log("从localStorage获取的loginUser:", loginUser)

    if (loginUser) {
      // 优先使用 userId，如果没有则使用 id
      currentUser.value.userId = loginUser.userId || loginUser.id || null
      currentUser.value.name = loginUser.name || ""
      currentUser.value.token = loginUser.token || ""

      console.log("设置后的currentUser:", currentUser.value)
      console.log(
        "最终userId:",
        currentUser.value.userId,
        "类型:",
        typeof currentUser.value.userId
      )
    } else {
      console.warn("未找到loginUser")
    }

    return currentUser.value.token
  }

  // 查询所有用户数据
  const queryAllUsers = async () => {
    try {
      const result = await queryAllUserApi()
      if (result && result.code === 1) {
        users.value = result.data || []
      } else {
        console.error("API返回数据异常:", result)
        users.value = []
      }
    } catch (error) {
      console.error("请求失败:", error)
      users.value = []
    }
  }

  // 通用方法：根据 userId 获取用户姓名
  const getUserName = (userId) => {
    if (!userId) return "-"
    const user = users.value.find((user) => user.userId === userId)
    return user ? user.name : "Unknown"
  }

  return {
    users,
    currentUser,
    getCurrentUser,
    queryAllUsers,
    getUserName
  }
}
