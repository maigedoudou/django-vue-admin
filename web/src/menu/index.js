import { uniqueId } from 'lodash'
import { request } from '@/api/service'
import XEUtils from 'xe-utils'
import { frameInRoutes, frameOutRoutes } from '@/router/routes'
import i18n from '@/i18n'
const _import = require('@/libs/util.import.' + process.env.NODE_ENV)
const pluginImport = require('@/libs/util.import.plugin')

// Portfolio mode keeps only core modules for a clean demo-ready UI.
const PORTFOLIO_MODE = true
const PORTFOLIO_COMPONENT_WHITELIST = new Set([
  'user',
  'role',
  'dept',
  'operationLog'
])

const PORTFOLIO_COMPONENT_BLOCKLIST = new Set([
  'menu',
  'menuButton',
  'messageCenter',
  'whiteList',
  'dictionary',
  'areas',
  'file',
  'loginLog',
  'frontendLog',
  'config'
])

const menuTitleMap = {
  '控制台': 'Dashboard',
  '系统管理': 'System Management',
  '菜单管理': 'Menu Management',
  '菜单按钮': 'Menu Buttons',
  '部门管理': 'Department Management',
  '角色管理': 'Role Management',
  '用户管理': 'User Management',
  '消息中心': 'Message Center',
  '接口白名单': 'API Whitelist',
  '常规配置': 'General Settings',
  '系统配置': 'System Settings',
  '字典管理': 'Dictionary Management',
  '地区管理': 'Region Management',
  '附件管理': 'Attachment Management',
  '日志管理': 'Log Management',
  '登录日志': 'Login Logs',
  '操作日志': 'Operation Logs',
  '前端错误日志': 'Frontend Error Logs',
  'DVAdmin官网': 'DVAdmin Website',
  '查询': 'Query',
  '详情': 'Detail',
  '新增': 'Create',
  'Edit': 'Edit',
  '删除': 'Delete',
  '保存': 'Save',
  '导出': 'Export',
  '导入': 'Import',
  '重设密码': 'Reset Password',
  '重置密码': 'Reset Password'
}

export function translateMenuTitle (title) {
  if (i18n.locale !== 'en') return title
  return menuTitleMap[title] || title
}

function hasChinese (text) {
  return /[\u4e00-\u9fff]/.test(text || '')
}

function toReadableTitle (value) {
  if (!value) return ''
  const normalized = String(value)
    .replace(/^\//, '')
    .replace(/[\/_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
  if (!normalized) return ''
  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function normalizeMenuTitle (title, fallback) {
  const translated = translateMenuTitle(title)
  if (i18n.locale !== 'en') return translated
  if (!hasChinese(translated)) return translated
  return toReadableTitle(fallback) || translated
}
/**
 * @description 给菜单数据补充上 path 字段
 * @description https://github.com/d2-projects/d2-admin/issues/209
 * @param {Array} menu 原始的菜单数据
 */
function supplementPath (menu) {
  return menu.map(e => ({
    ...e,
    path: e.path || uniqueId('d2-menu-empty-'),
    ...e.children ? {
      children: supplementPath(e.children)
    } : {}
  }))
}

export const menuHeader = supplementPath([])

export const menuAside = supplementPath([])

function filterMenuForPortfolio (menuData) {
  if (!PORTFOLIO_MODE || !Array.isArray(menuData)) return menuData
  const byId = new Map()
  menuData.forEach(item => byId.set(item.id, item))

  const keepIds = new Set()
  const descendantRoots = new Set()

  // 1) Keep whitelisted pages.
  menuData.forEach(item => {
    if (PORTFOLIO_COMPONENT_WHITELIST.has(item.component_name)) {
      keepIds.add(item.id)
      descendantRoots.add(item.id)
    }
  })

  // 2) Keep all ancestors so tree structure remains valid.
  const queue = [...keepIds]
  while (queue.length) {
    const current = byId.get(queue.shift())
    if (!current) continue
    const parentId = current.parent
    if (parentId && byId.has(parentId) && !keepIds.has(parentId)) {
      keepIds.add(parentId)
      queue.push(parentId)
    }
  }

  // 3) Keep descendants (e.g. button permissions) only under whitelisted pages.
  let changed = true
  while (changed) {
    changed = false
    menuData.forEach(item => {
      if (item.parent && descendantRoots.has(item.parent) && !keepIds.has(item.id)) {
        keepIds.add(item.id)
        descendantRoots.add(item.id)
        changed = true
      }
    })
  }

  return menuData.filter(item => keepIds.has(item.id))
}

function flattenMenu (list = []) {
  const out = []
  const walk = (arr) => {
    arr.forEach(item => {
      out.push(item)
      if (Array.isArray(item.children) && item.children.length) {
        walk(item.children)
      }
    })
  }
  walk(list)
  return out
}

export function portfolioMenuNeedsRefresh (aside = []) {
  if (!PORTFOLIO_MODE || !Array.isArray(aside)) return false
  const flat = flattenMenu(aside)
  return flat.some(item => {
    const comp = item && item.component_name
    if (!comp) return false
    return PORTFOLIO_COMPONENT_BLOCKLIST.has(comp)
  })
}

// 请求菜单数据,用于解析路由和侧边栏菜单
export const getMenu = function () {
  return request({
    url: '/api/system/menu/web_router/',
    method: 'get',
    params: {}
  }).then((res) => {
    // 设置动态路由
    const menuData = filterMenuForPortfolio(res.data.data)
    sessionStorage.setItem('menuData', JSON.stringify(menuData))
    return menuData
  })
}

/**
 * 校验路由是否有效
 */
export const checkRouter = function (menuData) {
  const result = []
  for (const item of menuData) {
    try {
      if (item.path !== '' && item.component) {
        (item.component && item.component.substr(0, 8) === 'plugins/') ? pluginImport(item.component.replace('plugins/', '')) : _import(item.component)
      }
      result.push(item)
    } catch (err) {
      console.log(`导入菜单错误，会导致页面无法访问，请检查文件是否存在：${item.component}`)
    }
  }
  return result
}
/**
 * 将获取到的后端菜单数据,解析为前端路由
 */
export const handleRouter = function (menuData) {
  const result = []
  for (const item of menuData) {
    if (item.path !== '' && item.component) {
      const obj = {
        path: item.path,
        name: item.component_name,
        component: (item.component && item.component.substr(0, 8) === 'plugins/') ? pluginImport(item.component.replace('plugins/', '')) : _import(item.component),
        meta: {
          title: normalizeMenuTitle(item.name, item.component_name || item.path),
          auth: true,
          cache: item.cache,
          openInNewWindow: item.frame_out
        }
      }
      if (item.frame_out) {
        frameOutRoutes.push(obj)
      } else {
        result.push(obj)
      }
    } else {
      if (item.is_link === 0) {
        delete item.path
      }
    }
  }
  frameInRoutes[0].children = [...result]
  return { routes: frameInRoutes, frameOut: frameOutRoutes }
}

/**
 * 将前端的侧边菜单进行处理
 */
export const handleAsideMenu = function (menuData) {
  // 将列表数据转换为树形数据
  const data = XEUtils.toArrayTree(menuData, {
    parentKey: 'parent',
    strict: true
  })

  const mapMenuTitle = (list) => {
    return list.map(item => ({
      ...item,
      title: normalizeMenuTitle(item.name || item.title, item.component_name || item.web_path || item.path),
      children: item.children ? mapMenuTitle(item.children) : item.children
    }))
  }

  const menu = [
    { path: '/index', title: translateMenuTitle('控制台'), icon: 'home' },
    ...mapMenuTitle(data)
  ]
  return supplementPath(menu)
}
