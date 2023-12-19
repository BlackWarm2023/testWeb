import request from '@/utils/request'

export function login(data) {
  return request({
    // 框架自带的路径
    // url: '/vue-admin-template/user/login',
    // 适应项目的路径
    url: '/user/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    // 框架自带的路径
    // url: '/vue-admin-template/user/info',
    // 适应项目的路径
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    // 框架自带的路径
    // url: '/vue-admin-template/user/logout',
    // 适应项目的路径
    url: '/user/logout',
    method: 'post'
  })
}
