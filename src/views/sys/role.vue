<template>
  <div>
    <!--  搜索框    -->
    <el-card id="search">
      <!-- 栅栏布局 -->
      <el-row>
        <el-col :span="20">
          <el-input v-model="searchModel.roleName" placeholder="角色名称" clearable/>
          <el-button type="primary" round icon="el-icon-search" @click="getRoleList">搜索</el-button>
          <el-button type="primary" round @click="chongZhi">重置</el-button>
        </el-col>
        <el-col :span="4" align="right">
          <el-button @click="openEditUI(null)" type="primary" icon="el-icon-plus" circle/>
        </el-col>
      </el-row>
    </el-card>

    <!-- 结果列表 -->
    <el-card>
      <el-table :data="roleList" stripe style="width: 100%">
        <el-table-column label="序号" width="180">
          <template slot-scope="scope">
            {{ (searchModel.pageNo - 1) * searchModel.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="roleId" label="角色ID" width="200"/>
        <el-table-column prop="roleName" label="角色名称" width="260"/>
        <el-table-column prop="roleDesc" label="角色描述"/>
        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button @click="openEditUI(scope.row.roleId)" type="primary" size="mini" plain>修改</el-button>
            <el-button @click="deleteRole(scope.row)" type="danger" size="mini" plain>删除</el-button>
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

    <!-- 角色信息编辑对话框 -->
    <el-dialog @close="clearForm" :title="title" :visible.sync="dialogFormVisible">
      <el-form :model="roleForm" ref="roleFormRef" :rules="rules">
        <el-form-item label="角色名称" prop="roleName" :label-width="formLabelWidth">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" autocomplete="off"/>
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc" :label-width="formLabelWidth">
          <el-input v-model="roleForm.roleDesc" placeholder="请输入角色描述" autocomplete="off"/>
        </el-form-item>
        <el-form-item label="权限设置" prop="menuIdList" :label-width="formLabelWidth">
<!--          default-expand-all 默认打开下级菜单  node-key="menuId" 唯一标识  ref="menuRef" 命名-->
          <el-tree
            ref="menuRef"
            :data="menuList"
            :props="menuProps"
            show-checkbox
            node-key="menuId"
            default-expand-all
            style="width: 85%"
          ></el-tree>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveRole">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import roleApi from '@/api/roleManage'
import menuApi from '@/api/menuManage'

export default {
  data() {
    return {
      // 权限设置数据
      menuList: [],
      menuProps: {
        children: 'children',
        // 数据库对应字段 title
        label: 'title'
      },
      formLabelWidth: '120px',
      roleForm: {},
      dialogFormVisible: false,
      title: '',
      total: 0,
      searchModel: {
        pageNo: 1,
        pageSize: 10
      },
      roleList: [],
      rules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        roleDesc: [
          { required: true, message: '请输入角色描述', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getRoleList()
    this.getAllMenu()
  },
  methods: {
    getAllMenu() {
      menuApi.getAllMenu().then(response => {
        this.menuList = response.data
      })
    },
    deleteRole(role) {
      this.$confirm(`您确定删除角色${role.roleName}吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 点确定后会进入这个方法
        roleApi.deleteRoleById(role.roleId).then(response => {
          this.$message({
            type: 'success',
            message: response.message
          })
          this.getRoleList()
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    saveRole() {
      // 触发表单验证
      this.$refs.roleFormRef.validate((valid) => {
        if (valid) {
          // 全选 通过 getCheckedKeys() 获取 menuRef 中选中的 key 值,是一个数组
          let checkedKeys = this.$refs.menuRef.getCheckedKeys()
          // 通过 getHalfCheckedKeys() 获取 menuRef 中选中的 key 值,是一个数组
          let halfCheckedKeys = this.$refs.menuRef.getHalfCheckedKeys()
          // 半选 在 roleForm 新增一个字段 menuIdList ,并将 checkedKeys 和 halfCheckedKeys 拼接起来填入 menuIdList
          this.roleForm.menuIdList = checkedKeys.concat(halfCheckedKeys)

          // 请求提交后台
          roleApi.saveRole(this.roleForm).then(response => {
            // 成功提示
            this.$message({
              message: response.message,
              type: 'success'
            })
            // 关闭对话框
            this.dialogFormVisible = false
            // 刷新表格
            this.getRoleList()
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    clearForm() {
      this.roleForm = {}
      this.$refs.roleFormRef.clearValidate()
      this.$refs.menuRef.setCheckedKeys([])
    },
    openEditUI(id) {
      if (id == null) {
        this.title = '新增角色'
      } else {
        this.title = '修改角色'
        // 根据 id 查询角色数据
        roleApi.getRoleById(id).then(response => {
          this.roleForm = response.data
          this.$refs.menuRef.setCheckedKeys(response.data.menuIdList)
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
      roleApi.getRoleList(this.searchModel).then(response => {
        this.roleList = response.data.rows
        this.total = response.data.total
      })
    },
    handleSizeChange(pageSize) {
      this.searchModel.pageSize = pageSize
      this.getRoleList()
    },
    handleCurrentChange(pageNo) {
      this.searchModel.pageNo = pageNo
      this.getRoleList()
    },
    // 获取后端传过来的值
    getRoleList() {
      // 回调
      roleApi.getRoleList(this.searchModel).then(response => {
        this.roleList = response.data.rows
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

