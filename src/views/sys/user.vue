<template>
  <div>
    <!--  搜索框    -->
    <el-card id="search">
      <!-- 栅栏布局 -->
      <el-row>
        <el-col :span="20">
          <el-input v-model="searchModel.username" placeholder="用户名" clearable/>
          <el-input v-model="searchModel.phone" placeholder="电话" clearable/>
          <el-button type="primary" round icon="el-icon-search" @click="getUserList">搜索</el-button>
          <el-button type="primary" round @click="chongZhi">重置</el-button>
        </el-col>
        <el-col :span="4" align="right">
          <el-button @click="openEditUI(null)" type="primary" icon="el-icon-plus" circle/>
        </el-col>
      </el-row>
    </el-card>

    <!-- 结果列表 -->
    <el-card>
      <el-table :data="userList" stripe style="width: 100%">
        <el-table-column label="序号" width="180">
          <template slot-scope="scope">
            {{ (searchModel.pageNo - 1) * searchModel.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="180"/>
        <el-table-column prop="phone" label="电话" width="180"/>
        <el-table-column prop="status" label="状态">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 1">正常</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="电子邮件"/>
        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button @click="openEditUI(scope.row.id)" type="primary" size="mini" plain>修改</el-button>
            <el-button @click="deleteUser(scope.row)" type="danger" size="mini" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页组件 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="searchModel.pageNo"
      :page-sizes="[10, 20, 30, 40]"
      :page-size="searchModel.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    >
    </el-pagination>

    <!-- 用户信息编辑对话框 -->
    <el-dialog @close="clearForm" :title="title" :visible.sync="dialogFormVisible">
      <el-form :model="userForm" ref="userFormRef" :rules="rules">
        <el-form-item label="用户名" prop="username" :label-width="formLabelWidth">
          <el-input v-model="userForm.username" placeholder="请输入用户名" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item v-if="userForm.id == null || userForm.id == undefined" label="密码" prop="password"
                      :label-width="formLabelWidth"
        >
          <el-input v-model="userForm.password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="电话" :label-width="formLabelWidth">
          <el-input v-model="userForm.phone" placeholder="请输入电话" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="用户状态" :label-width="formLabelWidth">
          <el-switch
            v-model="userForm.status"
            :active-value="1"
            :inactive-value="0"
          >
          </el-switch>
        </el-form-item>
        <el-form-item label="用户角色" :label-width="formLabelWidth">
          <!--      :min="1" 最少选一条  :max="2" 最多选两条   -->
          <el-checkbox-group
            style="width: 85%"
            v-model="userForm.roleIdList"
            :max="2"
          >
            <el-checkbox v-for="role in roleList" :label="role.roleId" :key="role.roleId">{{ role.roleDesc }}
            </el-checkbox>
          </el-checkbox-group>
          <!--          {{userForm.roleIdList}}-->
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email" :label-width="formLabelWidth">
          <el-input v-model="userForm.email" placeholder="请输入电子邮箱" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveUser">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import userApi from '@/api/userManage'
import roleApi from '@/api/roleManage'

export default {
  data() {
    // 邮箱校验规则
    var checkEmail = (rule, value, callback) => {
      var reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
      if (!reg.test(value)) {
        return callback(new Error('邮箱格式错误'))
      }
      callback()
    }
    return {
      // 定义角色列表,数组
      roleList: [],
      formLabelWidth: '140px',
      userForm: {
        roleIdList: []
      },
      dialogFormVisible: false,
      title: '',
      total: 0,
      searchModel: {
        pageNo: 1,
        pageSize: 10
      },
      userList: [],
      // 校验
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入电子邮箱', trigger: 'blur' },
          // checkEmail 不能加括号,因为 checkEmail 不是一个方法
          { validator: checkEmail, trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getUserList()
    this.getAllRoleList()
  },
  methods: {
    // 获取数据库中所有角色信息
    getAllRoleList() {
      roleApi.getAllRoleList().then(response => {
        this.roleList = response.data
        console.log(this.roleList)
      })
    },
    // 删除用户
    deleteUser(user) {
      this.$confirm(`您确定删除用户${user.username}吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 点确定后会进入这个方法
        userApi.deleteUserById(user.id).then(response => {
          this.$message({
            type: 'success',
            message: response.message
          })
          this.getUserList()
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    saveUser() {
      // 触发表单验证
      this.$refs.userFormRef.validate((valid) => {
        if (valid) {
          // 请求提交后台
          userApi.saveUser(this.userForm).then(response => {
            // 成功提示
            this.$message({
              message: response.message,
              type: 'success'
            })
            // 关闭对话框
            this.dialogFormVisible = false
            // 刷新表格
            this.getUserList()
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    // 关闭时清理窗口数据
    clearForm() {
      this.userForm = {
        roleIdList: []
      }
      this.$refs.userFormRef.clearValidate()
    },
    openEditUI(id) {
      if (id == null) {
        this.title = '新增用户'
      } else {
        this.title = '修改用户'
        // 根据 id 查询用户数据
        userApi.getUserById(id).then(response => {
          this.userForm = response.data
        })
      }
      // 使得弹窗可见
      this.dialogFormVisible = true
    },
    chongZhi() {
      this.searchModel = {
        pageNo: 1,
        pageSize: 10
      }
      userApi.getUserList(this.searchModel).then(response => {
        this.userList = response.data.rows
        this.total = response.data.total
      })
    },
    handleSizeChange(pageSize) {
      this.searchModel.pageSize = pageSize
      this.getUserList()
    },
    handleCurrentChange(pageNo) {
      this.searchModel.pageNo = pageNo
      this.getUserList()
    },
    // 获取后端传过来的值
    getUserList() {
      // 回调
      userApi.getUserList(this.searchModel).then(response => {
        this.userList = response.data.rows
        this.total = response.data.total
      })
    }
  }
}
</script>

<style>
#search .el-input {
  width: 200px;
  margin-right: 10px;
}

.el-dialog .el-input {
  width: 60%;
}
</style>

