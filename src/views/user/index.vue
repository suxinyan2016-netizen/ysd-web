<script setup>
import { ref, watch, onMounted } from 'vue';
import { queryPageApi, addApi, queryInfoApi, updateApi, deleteApi } from '@/api/user';
import { ElMessage, ElMessageBox } from 'element-plus'

//元数据
//是否状态有效
const isvalid = ref([{ name: 'valid', value: 1 }, { name: 'invalid', value: 0 }])


const token = ref('')
//搜索表单对象
const searchUser = ref({ username: '', name: '',address: '', isValid: ''})


//钩子函数
onMounted(() => {
 
  search(); //查询用户列表数据
  getToken(); //获取token
})

//获取token
const getToken = () => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'));
  if(loginUser && loginUser.token){
    token.value = loginUser.token;
  }
}

//查询用户列表
const search = async () => {
  const result = await queryPageApi(searchUser.value.username, searchUser.value.name,
                         searchUser.value.address, searchUser.value.isValid, currentPage.value, pageSize.value);
  if(result.code){
    userList.value = result.data.rows;
    total.value = result.data.total;
  }
}

//清空
const clear = () => {
  searchUser.value = {username: '', name: '', address: '', isValid: ''};
  search();
}

//员工列表数据
const userList = ref([])

//分页
const currentPage = ref(1); //页码
const pageSize = ref(10); //每页展示记录数
const background = ref(true); //背景色
const total = ref(0); //总记录数

//每页展示记录数变化
const handleSizeChange = (val) => {
  search();
}
//页码变化时触发
const handleCurrentChange = (val) => {
  search();
}

//新增员工
const addUser = () => {
  dialogVisible.value = true;
  dialogTitle.value = 'Add User';
  user.value = {
    username: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    zipcode: '',
    email: '',
    isValid: 1
  }

  //重置表单的校验规则-提示信息
  if (userFormRef.value){
    userFormRef.value.resetFields();
  }
}

//新增/修改表单
const user = ref({
  username: '',
  password: '',
  name: '',
  phone: '',
  address: '',
  zipcode: '',
  email: '',
  isValid: 1
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('Add User')



//保存用户
const save = async () => {
  //表单校验
  if(!userFormRef.value) return;
 userFormRef.value.validate(async (valid) => { //valid 表示是否校验通过: true 通过 / false  不通过
    if(valid){ //通过

      let result;
      if(user.value.userId){ //修改
        result = await updateApi(user.value);
      }else { //新增
        result = await addApi(user.value);
      }
      
      if(result.code) {//成功
        ElMessage.success('Saved');
        dialogVisible.value = false;
        search();
      }else { //失败了
        ElMessage.error(result.msg);
      }
    }else { //不通过
      ElMessage.error('Cannot save, data error');
    }
  })
}
//表单引用
const userFormRef = ref();

//表单校验规则
const rules = ref({
  username: [
    { required: true, message: 'Username', trigger: 'blur' },
    { min: 2, max: 40, message: 'Length between 2-40', trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Realname', trigger: 'blur' },
    { min: 2, max: 40, message: 'Length between 2-40', trigger: 'blur' }
  ],
  isValid: [
    { required: true, message: 'isvalid', trigger: 'change' }
  ],
  phone: [
   
    /**
     * 正则表达式: / ..... / ;  ^ : 以...开始 ;  $ : 以 ... 结束
     * [3-9] : 范围 3-9 之间
     * \d : 数字, [0-9]
     * {9} : 量词
     */
    {
    pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/,
    message: 'Please enter a valid North American phone number.',
    trigger: 'blur'
    }
  ]
});

//编辑
const edit = async (userId) => {
  const result = await queryInfoApi(userId);
  if(result.code){
    dialogVisible.value = true;
    dialogTitle.value = 'Edit User';
    user.value = { ...result.data };
    // 重置表单的校验规则-提示信息
    if (userFormRef.value){
      userFormRef.value.resetFields();
    }
    
  }
}

//删除员工
const deleteById = (userId) => {

  //弹出确认框
  ElMessageBox.confirm('Do you delete the data?','note',
    { confirmButtonText: 'Yes',cancelButtonText: 'Cancel',type: 'warning'}
  ).then(async () => { //确认
    const result = await deleteApi(userId);
    if(result.code){
      ElMessage.success('Deleted');
      search();
    }else{
      ElMessage.error(result.msg);
    }
  }).catch(() => { //取消
    ElMessage.info('Canceled');
  })
}
//记录勾选的员工的id
const selectedIds = ref([]);
//复选框勾选发生变化时触发 - selection: 当前选中的记录 (数组)
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map( item => item.userId);
}

//批量删除
const deleteByIds = () => {
  // 检查是否有选中的数据
  if(!selectedIds.value || selectedIds.value.length === 0){
    ElMessage.info('No data is selected');
    return;
  }
  
  console.log('批量删除 IDs:', selectedIds.value);
  
  // 弹出确认框
  ElMessageBox.confirm('Do you delete these data?','note',
    { confirmButtonText: 'Yes',cancelButtonText: 'Cancel',type: 'warning'}
  ).then(async () => { //确认
    // 确保传递正确的 ID 数组
    const result = await deleteApi(selectedIds.value);
    if(result.code){
      ElMessage.success('Deleted');
      search();
      selectedIds.value = []; // 清空选中状态
    }else{
      ElMessage.error(result.msg);
    }
  }).catch(() => { //取消
    ElMessage.info('Canceled');
  })
}

</script>

<template>
  <h1>User Management</h1>

  <!-- 搜索栏 -->
  <div class="container">
    <el-form :inline="true" :model="searchUser" class="demo-form-inline">
      <el-form-item label="Username">
        <el-input v-model="searchUser.username" placeholder="Username" />
      </el-form-item>

      <el-form-item label="Realname">
        <el-input v-model="searchUser.name" placeholder="Realname" />
      </el-form-item>

      <el-form-item label="Address">
        <el-input v-model="searchUser.address" placeholder="Address" />
      </el-form-item>

      <el-form-item label="isvalid" style="min-width: 180px;">
        <el-select v-model="searchUser.isValid" placeholder="Choose"  style="width: 100%;">
          <el-option label="Valid" value="1" />
          <el-option label="Invalid" value="0" />
        </el-select>
      </el-form-item>

      

      <el-form-item>
        <el-button type="primary" @click="search">Search</el-button>
        <el-button type="info" @click="clear">Clean</el-button>
      </el-form-item>
    </el-form>
  </div>
  
  <!-- 功能按钮 -->
  <div class="container">
    <el-button type="primary" @click="addUser">+ AddUser</el-button>
    <el-button type="danger" @click="deleteByIds">- Delete</el-button>
  </div>

  <!-- 数据展示表格 -->
  <div class="container">
    <el-table :data="userList" border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column prop="username" label="username" width="120" align="center"/>
      <el-table-column prop="name" label="realname" width="120" align="center"/>
      <el-table-column prop="phone" label="phone" width="120" align="center"/>
      <el-table-column label="isvalid" width="120"  align="center">
        <template #default="scope">
          {{ scope.row.isValid == 1 ? 'valid' : 'invalid' }}
        </template>
      </el-table-column>
      <el-table-column prop="address" label="address" width="720" align="left"/>
      
      
      
      
      <el-table-column label="Operation" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="edit(scope.row.userId)"><el-icon><EditPen /></el-icon> Edit</el-button>
          <el-button type="danger" size="small" @click="deleteById(scope.row.userId)"><el-icon><Delete /></el-icon> Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 分页条 -->
  <div class="container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  
  <!-- 新增员工/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form :model="user" :rules="rules" ref="userFormRef" label-width="80px">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="username" prop="username">
            <el-input v-model="user.username" placeholder="input username length 2-40"></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="password" prop="password">
            <el-input v-model="user.password" placeholder="input password length 6-40"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="name" prop="name">
            <el-input v-model="user.name" placeholder="input realname length 2-40"></el-input>
          </el-form-item>
        </el-col>
        

        <el-col :span="12">
          <el-form-item label="phone" prop="phone">
            <el-input v-model="user.phone" placeholder="input phone number"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="20">
        <el-col :span="18">
          <el-form-item label="address" prop="address">
            <el-input v-model="user.address" placeholder="input address"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="zipcode" prop="zipcode">
            <el-input v-model="user.zipcode" placeholder="input zipcode"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="email" prop="email">
            <el-input v-model="user.email" placeholder="input email"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="isvalid"  prop="isValid">
            <el-select v-model="user.isValid" placeholder="Choose" style="width: 100%;">
              <el-option v-for="g in isvalid" :key="g.value" :label="g.name" :value="g.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
    
    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="save">Save</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>
.container {
  margin: 10px 0px;
}

.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  border-radius: 10px;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>