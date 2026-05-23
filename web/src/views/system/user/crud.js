import { request } from '@/api/service'

export const crudOptions = (vm) => {
  // util.filterParams(vm, ['dept_name', 'role_info{name}', 'dept_name_all'])
  return {
    pageOptions: {
      compact: true
    },
    options: {
      height: '100%',
      // tableType: 'vxe-table',
      // rowKey: true,
      rowId: 'id'
    },
    selectionRow: {
      align: 'center',
      width: 46
    },
    rowHandle: {
      title: 'Actions',
      width: 240,
      fixed: 'right',
      view: {
        thin: true,
        text: '',
        disabled () {
          return !vm.hasPermissions('Retrieve')
        }
      },
      edit: {
        thin: true,
        text: '',
        disabled () {
          return !vm.hasPermissions('Update')
        }
      },
      remove: {
        thin: true,
        text: '',
        disabled () {
          return !vm.hasPermissions('Delete')
        }
      },
      custom: [
        {
          thin: true,
          text: vm.$t('systemUser.passwordReset'),
          size: 'small',
          type: 'warning',
          icon: 'el-icon-refresh-left',
          show () {
            return vm.hasPermissions('ResetPassword')
          },
          emit: 'resetPassword'
        }
      ]
    },
    viewOptions: {
      componentType: 'form'
    },
    formOptions: {
      defaultSpan: 12,
      editTitle: 'Edit'
    },
    indexRow: { // 或者直接传true,不显示title，不居中
      title: vm.$t('systemUser.index'),
      align: 'center',
      width: 60
    },
    columns: [
      {
        title: vm.$t('systemUser.keyword'),
        key: 'search',
        show: false,
        disabled: true,
        search: {
          disabled: false
        },
        form: {
          disabled: true,
          component: {
            placeholder: vm.$t('systemUser.enterKeyword')
          }
        },
        view: {
          disabled: true
        }
      },
      {
        title: 'ID',
        key: 'id',
        disabled: true,
        form: {
          disabled: true
        }
      },
      {
        title: vm.$t('systemUser.departmentName'),
        key: 'dept__name',
        treeNode: true, // 设置为树形列
        search: {
          disabled: false,
          component: {
            props: {
              clearable: true
            }
          }
        },
        show: false,
        form: {
          disabled: true
        }
      },
      {
        title: vm.$t('systemUser.account'),
        key: 'username',
        search: {
          disabled: false
        },
        minWidth: 100,
        type: 'input',
        form: {
          rules: [ // 表单校验规则
            {
              required: true,
              message: vm.$t('systemUser.accountRequired')
            }
          ],
          component: {
            placeholder: vm.$t('systemUser.enterAccount')
          },
          itemProps: {
            class: { yxtInput: true }
          }
        }
      },
      {
        title: vm.$t('systemUser.password'),
        key: 'password',
        minWidth: 90,
        type: 'input',
        form: {
          rules: [ // 表单校验规则
            {
              required: true,
              message: vm.$t('systemUser.passwordRequired')
            }
          ],
          component: {
            span: 12,
            showPassword: true,
            placeholder: vm.$t('systemUser.enterPassword')
          },
          value: vm.systemConfig('base.default_password'),
          editDisabled: true,
          itemProps: {
            class: { yxtInput: true }
          }
        },
        disabled: true,
        valueResolve (row, key) {
          if (row.password) {
            row.password = vm.$md5(row.password)
          }
        }
      },
      {
        title: vm.$t('systemUser.name'),
        key: 'name',
        sortable: 'custom',
        minWidth: 90,
        search: {
          disabled: false
        },
        type: 'input',
        form: {
          rules: [ // 表单校验规则
            {
              required: true,
              message: vm.$t('systemUser.nameRequired')
            }
          ],
          component: {
            span: 12,
            placeholder: vm.$t('systemUser.enterName')
          },
          itemProps: {
            class: { yxtInput: true }
          }
        }
      },
      {
        title: vm.$t('systemUser.department'),
        key: 'dept',
        search: {
          disabled: false
        },
        minWidth: 140,
        type: 'tree-selector',
        dict: {
          cache: true,
          isTree: true,
          url: '/api/system/dept/all_dept/',
          value: 'id', // 数据字典中value字段的属性名
          label: 'name' // 数据字典中label字段的属性名
        },
        form: {
          rules: [ // 表单校验规则
            {
              required: true,
              message: vm.$t('systemUser.required')
            }
          ],
          itemProps: {
            class: { yxtInput: true }
          },
          component: {
            span: 12,
            pagination: true,
            props: { multiple: false }
          }
        },
        component: {
          name: 'foreignKey',
          valueBinding: 'dept_name'
        }
      },
      {
        title: vm.$t('systemUser.role'),
        key: 'role',
        search: {
          disabled: true
        },
        minWidth: 130,
        type: 'table-selector',
        dict: {
          cache: false,
          url: '/api/system/role/',
          value: 'id', // 数据字典中value字段的属性名
          label: 'name', // 数据字典中label字段的属性名
          getData: (url, dict, {
            form,
            component
          }) => {
            return request({
              url: url,
              params: {
                page: 1,
                limit: 10
              }
            }).then(ret => {
              component._elProps.page = ret.data.page
              component._elProps.limit = ret.data.limit
              component._elProps.total = ret.data.total
              return ret.data.data
            })
          }
        },
        form: {
          rules: [ // 表单校验规则
            {
              required: true,
              message: vm.$t('systemUser.required')
            }
          ],
          itemProps: {
            class: { yxtInput: true }
          },
          component: {
            span: 12,
            pagination: true,
            props: { multiple: true },
            elProps: {
              columns: [
                {
                  field: 'name',
                  title: vm.$t('systemUser.roleName')
                },
                {
                  field: 'key',
                  title: vm.$t('systemUser.permissionKey')
                }
              ]
            }
          }
        },
        component: {
          name: 'manyToMany',
          valueBinding: 'role_info',
          children: 'name'
        }
      },
      {
        title: vm.$t('systemUser.mobile'),
        key: 'mobile',
        search: {
          disabled: false
        },
        minWidth: 110,
        type: 'input',
        form: {
          rules: [
            {
              max: 20,
              message: vm.$t('systemUser.invalidMobile'),
              trigger: 'blur'
            },
            {
              pattern: /^1[3-9]\d{9}$/,
              message: vm.$t('systemUser.invalidMobile')
            }
          ],
          itemProps: {
            class: { yxtInput: true }
          },
          component: {
            placeholder: vm.$t('systemUser.enterMobile')
          }
        }
      }, {
        title: vm.$t('systemUser.email'),
        key: 'email',
        minWidth: 180,
        form: {
          rules: [
            {
              type: 'email',
              message: vm.$t('systemUser.invalidEmail'),
              trigger: ['blur', 'change']
            }
          ],
          component: {
            placeholder: vm.$t('systemUser.enterEmail')
          }
        }
      },
      {
        title: vm.$t('systemUser.gender'),
        key: 'gender',
        type: 'radio',
        width: 70,
        dict: {
          data: vm.dictionary('gender')
        },
        form: {
          value: 1,
          component: {
            span: 12
          }
        },
        component: { props: { color: 'auto' } } // 自动染色
      }, {
        title: vm.$t('systemUser.status'),
        key: 'is_active',
        search: {
          disabled: false
        },
        width: 70,
        type: 'radio',
        dict: {
          data: vm.dictionary('button_status_bool')
        },
        form: {
          value: true,
          component: {
            span: 12
          }
        }
      },
      {
        title: vm.$t('systemUser.avatar'),
        key: 'avatar',
        type: 'avatar-cropper',
        width: 60,
        align: 'left',
        form: {
          component: {
            props: {
              elProps: { // 与el-uploader 配置一致
                multiple: false,
                limit: 1 // 限制5个文件
              },
              sizeLimit: 500 * 1024 // 不能超过限制
            },
            span: 24
          },
          helper: vm.$t('systemUser.avatarLimit')
        }
      }
    ].concat(vm.commonEndColumns({
      create_datetime: { showTable: false },
      update_datetime: { showTable: false }
    }))
  }
}
