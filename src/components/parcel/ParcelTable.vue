<template>
  <div class="parcel-table">
    <el-table
      :data="filteredParcels"
      stripe
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center" />
      
      <el-table-column
        prop="packageNo"
        label="Packageno"
        width="175"
        align="left"
      />

      <el-table-column prop="status" label="Status" width="100" align="center">
        <template #default="scope">
          <span v-if="scope.row.status == 0">Planed</span>
          <span v-else-if="scope.row.status == 1">inDelivery</span>
          <span v-else-if="scope.row.status == 2">Received</span>
          <span v-else-if="scope.row.status == 9">Exception</span>
        </template>
      </el-table-column>

      <el-table-column
        prop="processId"
        label="Processid"
        width="100"
        align="left"
      />

      <el-table-column
        prop="processDate"
        label="Processdate"
        width="110"
        align="center"
      />

      <!-- 显示 owner 姓名 -->
      <el-table-column label="Owner" width="120" align="center">
        <template #default="scope">
          {{ getUserName(scope.row.ownerId) }}
        </template>
      </el-table-column>

      <!-- 显示 sender 姓名 -->
      <el-table-column label="Sender" width="120" align="center">
        <template #default="scope">
          {{ getUserName(scope.row.senderId) }}
        </template>
      </el-table-column>

      <el-table-column
        prop="sendDate"
        label="senddate"
        width="110"
        align="center"
      />

      <!-- 显示 receiver 姓名 -->
      <el-table-column label="Receiver" width="110" align="center">
        <template #default="scope">
          {{ getUserName(scope.row.receiverId) }}
        </template>
      </el-table-column>

      <el-table-column
        prop="receivedDate"
        label="receiveddate"
        width="120"
        align="left"
      />

      <el-table-column label="Operation" align="center" width="200">
        <template #default="scope">
          <!-- 只有有权限时才显示操作按钮 -->
          <template v-if="hasViewPermission(scope.row)">
            <!-- Edit按钮 -->
            <el-button
              v-if="hasEditPermission(scope.row)"
              type="primary"
              size="small"
              @click="handleEdit(scope.row.parcelId)"
            >
              <el-icon><EditPen /></el-icon> Edit
            </el-button>

            <!-- Delete按钮 -->
            <el-button
              v-if="hasDeletePermission(scope.row)"
              type="danger"
              size="small"
              @click="handleDelete(scope.row.parcelId)"
            >
              <el-icon><Delete /></el-icon> Delete
            </el-button>

            <!-- 如果没有操作权限，显示提示 -->
            <span
              v-if="
                !hasEditPermission(scope.row) && !hasDeletePermission(scope.row)
              "
              style="color: #909399; font-size: 12px"
            >
              No permission
            </span>
          </template>
          <template v-else>
            <span style="color: #909399; font-size: 12px">No permission</span>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { EditPen, Delete } from "@element-plus/icons-vue";

const props = defineProps({
  parcels: {
    type: Array,
    required: true,
    default: () => [],
  },
  users: {
    type: Array,
    required: true,
    default: () => [],
  },
  currentUser: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["edit", "delete", "selection-change"]);

// 权限检查函数
const hasViewPermission = (parcel) => {
  if (!props.currentUser) return false;
  // user_id = 1 不受限制
  if (props.currentUser.userId === 1) return true;

  const userId = props.currentUser.userId;
  return (
    parcel &&
    (parcel.ownerId === userId ||
      parcel.senderId === userId ||
      parcel.receiverId === userId)
  );
};

const hasDeletePermission = (parcel) => {
  if (!props.currentUser) return false;
  // user_id = 1 有删除权限
  if (props.currentUser.userId === 1) return true;

  // 只有owner可以删除
  if (!parcel) return false;
  return parcel.ownerId === props.currentUser.userId && parcel.status !== 2;
};

const hasEditPermission = (parcel) => {
  if (!props.currentUser) return false;
  // user_id = 1 有编辑权限
  if (props.currentUser.userId === 1) return true;

  // status = 2 (Received)时，普通用户不能编辑
  if (parcel.status === 2) return false;

  // 当前用户是owner、sender或receiver时有编辑权限
  const userId = props.currentUser.userId;
  return (
    parcel.ownerId === userId ||
    parcel.senderId === userId ||
    parcel.receiverId === userId
  );
};

// 过滤当前用户有权限查看的数据
const filteredParcels = computed(() => {
  if (!props.currentUser) return [];
  // 如果当前用户是 user_id = 1，则显示所有记录
  if (props.currentUser.userId === 1) {
    return props.parcels;
  }
  // 否则只显示有权限的记录
  return props.parcels.filter((parcel) => hasViewPermission(parcel));
});

// 通用方法：根据 userId 获取用户姓名
const getUserName = (userId) => {
  if (!userId) return "-";
  const user = props.users.find((user) => user.userId === userId);
  return user ? user.name : "Unknown";
};

const handleEdit = (parcelId) => {
  emit("edit", parcelId);
};

const handleDelete = (parcelId) => {
  emit("delete", parcelId);
};

const handleSelectionChange = (selection) => {
  emit("selection-change", selection);
};
</script>

<style scoped>
.parcel-table {
  margin-top: 20px;
}
</style>
