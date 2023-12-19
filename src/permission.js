import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
// 引入 Layout 组件
import Layout from '@/layout'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasGetUserInfo = store.getters.name
      if (hasGetUserInfo) {
        next()
      } else {
        try {
          // get user info
          await store.dispatch('user/getInfo')

          // 路由转换
          // store.getters.menuList 是后台传来的菜单数据
          // myFilterAsyncRoutes 是前端函数转换
          let myRoutes = myFilterAsyncRoutes(store.getters.menuList)
          // 404
          myRoutes.push({
            path: '*',
            redirect: '/404',
            hidden: true
          })
          // 动态添加路由
          router.addRoutes(myRoutes)
          // 存至全局变量
          global.myRoutes = myRoutes

          // next({ ...to, replace: true }) // 防止刷新后页面空白
          next()
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

function myFilterAsyncRoutes(menuList) {
  menuList.filter(menu => {
    // 判断从 menu 数据表中读取的 component 字段的值是否为 Layout ,
    // 如果是,就将前端对应的 component 的值设置为 Layout
    // Layout 布局对象
    if (menu.component === 'Layout') {
      menu.component = Layout
      console.log(menu.component)
    } else {
      // 将从后端读取的路由名称拼接成新路由后保存到前端对应的 component 中
      // @/views/${menu.component}.vue 是动态路由拼接的方式
      menu.component = require(`@/views/${menu.component}.vue`).default
    }
    // 递归处理子菜单
    if (menu.children && menu.children.length) {
      menu.children = myFilterAsyncRoutes(menu.children)
    }
    return true
  })
  return menuList
}
