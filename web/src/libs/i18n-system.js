const COMMON_MAP_EN = {
  '添加': 'Create',
  '新增': 'Create',
  'Edit': 'Edit',
  '删除': 'Delete',
  '批量删除': 'Batch Delete',
  '导出': 'Export',
  '导入': 'Import',
  '详情': 'Detail',
  '查询': 'Query',
  '重置': 'Reset',
  '关键词': 'Keyword',
  '请输入关键词': 'Please enter keyword',
  '序号': 'No.',
  '状态': 'Status',
  '排序': 'Sort',
  '角色': 'Role',
  '角色名称': 'Role Name',
  '权限标识': 'Permission Key',
  '部门标识': 'Department Key',
  '负责人': 'Owner',
  '联系电话': 'Phone',
  '上级部门': 'Parent Department',
  '默认留空为创建者的部门': 'Leave empty to use creator department',
  '部门名称必填项': 'Department name is required',
  '请输入部门名称': 'Please enter department name',
  '请输入负责人': 'Please enter owner',
  '请输入联系电话': 'Please enter phone',
  '请选择序号': 'Please select order',
  '操作': 'Actions',
  '更新时间': 'Update Time',
  '创建时间': 'Create Time',
  '操作时间': 'Operation Time',
  '请求模块': 'Request Module',
  '请求地址': 'Request Path',
  '请求方法': 'Request Method',
  '请求参数': 'Request Body',
  '操作说明': 'Description',
  'IP地址': 'IP Address',
  '请求浏览器': 'Browser',
  '响应码': 'Response Code',
  '操作系统': 'OS',
  '返回信息': 'Response Body',
  '操作人': 'Operator',
  '是否管理员': 'Is Admin',
  '请选择状态': 'Please select status',
  '请选择': 'Please select',
  '账号': 'Account',
  '请输入账号': 'Please enter account',
  '账号必填项': 'Account is required',
  '密码': 'Password',
  '请输入密码': 'Please enter password',
  '密码必填项': 'Password is required',
  '姓名': 'Name',
  '请输入姓名': 'Please enter name',
  '姓名必填项': 'Name is required',
  '手机号码': 'Mobile',
  '请输入手机号码': 'Please enter mobile number',
  '请输入正确的手机号码': 'Please enter a valid mobile number',
  '邮箱': 'Email',
  '请输入邮箱': 'Please enter email',
  '请输入正确的邮箱地址': 'Please enter a valid email address',
  '性别': 'Gender',
  '用户类型': 'User Type',
  '部门': 'Department',
  '部门名称': 'Department Name',
  '权限管理': 'Permissions',
  '密码重置': 'Reset Password',
  '必填项': 'Required',
  '请输入标识字符': 'Please enter permission key',
  '权限标识必填项': 'Permission key is required',
  '角色名称必填项': 'Role name is required',
  '请输入角色名称': 'Please enter role name',
  '请选择是否管理员': 'Please select admin option',
  '限制文件大小不能超过500k': 'File size must not exceed 500k',
  '头像': 'Avatar',
  'ID': 'ID'
}

function isEnglishLocale (locale) {
  return typeof locale === 'string' && locale.toLowerCase().startsWith('en')
}

const TRANSLATABLE_KEYS = new Set([
  'title',
  'text',
  'label',
  'placeholder',
  'message',
  'helper',
  'name'
])

function translateText (vm, text) {
  if (typeof text !== 'string') return text
  if (!vm || !vm.$i18n || !isEnglishLocale(vm.$i18n.locale)) return text
  if (COMMON_MAP_EN[text]) return COMMON_MAP_EN[text]

  const trimmed = text.trim()
  if (COMMON_MAP_EN[trimmed]) {
    const prefix = text.slice(0, text.indexOf(trimmed))
    const suffix = text.slice(text.indexOf(trimmed) + trimmed.length)
    return `${prefix}${COMMON_MAP_EN[trimmed]}${suffix}`
  }

  const compact = trimmed.replace(/\s+/g, '')
  if (COMMON_MAP_EN[compact]) {
    return COMMON_MAP_EN[compact]
  }

  return text
}

function deepLocalize (vm, value, keyName = '') {
  if (Array.isArray(value)) {
    return value.map(item => deepLocalize(vm, item, keyName))
  }
  if (value && typeof value === 'object') {
    const out = {}
    Object.keys(value).forEach(k => {
      out[k] = deepLocalize(vm, value[k], k)
    })
    return out
  }
  if (typeof value === 'string' && TRANSLATABLE_KEYS.has(keyName)) {
    return translateText(vm, value)
  }
  return value
}

export function localizeCrudSchema (vm, schema) {
  return deepLocalize(vm, schema)
}
