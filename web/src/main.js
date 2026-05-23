/*
 * @创建文件时间: 2021-06-01 22:41:19
 * @Auther: 猿小天
 * @最后修改人: 猿小天
 * @最后修改时间: 2021-08-12 00:57:05
 * 联系Qq:1638245306
 * @文件介绍:
 */
// Vue
import Vue from 'vue'
import i18n from './i18n'
import App from './App'
// 核心插件
import d2Admin from '@/plugin/d2admin'
// store
import store from '@/store/index'

// 菜单和路由设置
import router from './router'
import { menuHeader } from '@/menu'

// 按钮权限
import '@/plugin/permission' // 加载permission

// d2-crud-plus 安装与初始化
import './install'
// 配置vxe-table
import 'xe-utils'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

// md5加密
import md5 from 'js-md5'

// websocket
import websocket from '@/api/websocket'
import util from '@/libs/util'
// 引入echarts
import * as echarts from 'echarts' // 注册echarts组件
// 第三方组件
import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)
// 核心插件
Vue.use(d2Admin)
Vue.use(VXETable)
Vue.prototype.$md5 = md5
Vue.prototype.$util = util
Vue.prototype.$websocket = websocket
Vue.prototype.$echarts = echarts

// Force-translate hardcoded Chinese UI text to English
const ZH_EN_MAP = {
  '查询': 'Search', '重置': 'Reset', '搜索': 'Search',
  '确认': 'Confirm', '取消': 'Cancel', '提交': 'Submit',
  '删除': 'Delete', '新增': 'Add', 'Edit': 'Edit',
  '导入': 'Import', '导出': 'Export', '保存': 'Save',
  '关闭': 'Close', '确定': 'OK', '返回': 'Back',
  '刷新': 'Refresh', '上传': 'Upload', '下载': 'Download',
  '详情': 'Detail', '查看': 'View', '复制': 'Copy',
  '批量删除': 'Delete Selected', '全部': 'All',
  '展开': 'Expand', '收起': 'Collapse', '更多': 'More',
  '操作': 'Actions', '状态': 'Status', '排序': 'Sort',
}
function translateEl (root) {
  root.querySelectorAll('button span, .el-button span, .el-dropdown-menu__item, .el-table__header th .cell, .el-table__header th .cell span, .d2-crud-header span').forEach(el => {
    const t = el.textContent.trim()
    if (ZH_EN_MAP[t]) el.textContent = ZH_EN_MAP[t]
  })
  // Also handle text nodes inside .cell directly
  root.querySelectorAll('.el-table__header th .cell').forEach(el => {
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      const t = el.textContent.trim()
      if (ZH_EN_MAP[t]) el.childNodes[0].textContent = ZH_EN_MAP[t]
    }
  })
}
const _observer = new MutationObserver(() => translateEl(document.body))
document.addEventListener('DOMContentLoaded', () => {
  translateEl(document.body)
  _observer.observe(document.body, { childList: true, subtree: true })
})

new Vue({
  router,
  store,
  i18n,
  render: h => h(App),
  beforeCreate () {
    // 初始化配置
    this.$store.dispatch('d2admin/settings/load')
    this.$store.dispatch('d2admin/dictionary/load')
  },
  created () {

    // 处理路由 得到每一级的路由设置
    // this.$store.commit('d2admin/page/init', frameInRoutes)
    // 设置顶栏菜单
    // this.$store.commit('d2admin/menu/headerSet', menuHeader)
    // 设置侧边栏菜单
    // this.$store.commit('d2admin/menu/asideSet', menuAside)
    // 初始化菜单搜索功能
    // this.$store.commit('d2admin/search/init', menuAside)
  },
  mounted () {
    // 展示系统信息
    this.$store.commit('d2admin/releases/versionShow')
    // 用户登录后从数据库加载一系列的设置
    this.$store.dispatch('d2admin/account/load')
    // 获取并记录用户 UA
    this.$store.commit('d2admin/ua/get')
    // 初始化全屏监听
    this.$store.dispatch('d2admin/fullscreen/listen')
  },
  watch: {
    // 检测路由变化切换侧边栏内容
    '$route.matched': {
      handler (matched) {
        if (matched.length > 0) {
          const _side = menuHeader.filter(menu => menu.path === matched[0].path)
          if (_side.length > 0) {
            this.$store.commit('d2admin/menu/asideSet', _side[0].children)
          }
        }
      },
      immediate: true
    }
  }
}).$mount('#app')
