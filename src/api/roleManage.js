import request from '@/utils/request'

export default {
  getRoleList(searchModel) {
    return request({
      url: '/role/getList',
      method: 'get',
      params: {
        pageNo: searchModel.pageNo,
        pageSize: searchModel.pageSize,
        roleName: searchModel.roleName
      }

    })
  },
  addRole(role) {
    return request({
      url: '/role/addRole',
      method: 'post',
      data: role

    })
  },
  getRoleById(id) {
    return request({
      url: `/role/getRoleById/${id}`,
      method: 'get'
    })
  },
  updateRole(role) {
    return request({
      url: '/role/updateRole',
      method: 'put',
      data: role
    })
  },
  saveRole(role) {
    if (role.roleId == null && role.roleId === undefined) {
      return this.addRole(role)
    }
    return this.updateRole(role)
  },
  deleteRoleById(id) {
    return request({
      url: `/role/deleteRoleById/${id}`,
      method: 'delete'
    })
  },
  getAllRoleList() {
    return request({
      url: '/role/getAllRole',
      method: 'get'
    })
  },
}
