export const crudOptions = (vm) => {
  return {
    pageOptions: {
      compact: true
    },
    options: {
      tableType: 'vxe-table',
      rowKey: true, // 必须设置，true or false
      rowId: 'id',
      height: '100%', // 表格高度100%, 使用toolbar必须设置
      highlightCurrentRow: false

    },
    rowHandle: {
      title: 'Actions',
      fixed: 'right',
      view: {
        thin: true,
        text: '',
        disabled () {
          return !vm.hasPermissions('Retrieve')
        }
      },
      width: 70,
      edit: {
        thin: true,
        text: '',
        show: false,
        disabled () {
          return !vm.hasPermissions('Update')
        }
      },
      remove: {
        thin: true,
        text: vm.$t('operationLog.delete'),
        show: false,
        disabled () {
          return !vm.hasPermissions('Delete')
        }
      }
    },
    viewOptions: {
      componentType: 'form'
    },
    formOptions: {
      disabled: true,
      defaultSpan: 12,
      editTitle: 'Edit'
    },
    indexRow: {
      title: vm.$t('operationLog.index'),
      align: 'center',
      width: 70
    },
    columns: [
      {
        title: vm.$t('operationLog.keyword'),
        key: 'search',
        show: false,
        disabled: true,
        search: {
          disabled: false
        },
        form: {
          show: false,
          component: {
            placeholder: vm.$t('operationLog.enterKeyword')
          }
        }
      },
      {
        title: 'ID',
        key: 'id',
        width: 90,
        disabled: true,
        form: {
          disabled: true
        }
      },
      {
        title: vm.$t('operationLog.requestModule'),
        key: 'request_modular',
        search: {
          disabled: false
        },
        width: 140,
        type: 'input',
        form: {
          disabled: true,
          component: {
            placeholder: vm.$t('operationLog.enterRequestModule')
          }
        }
      },
      {
        title: vm.$t('operationLog.requestPath'),
        key: 'request_path',
        search: {
          disabled: false
        },
        width: 220,
        type: 'input',
        form: {
          disabled: true,
          component: {
            placeholder: vm.$t('operationLog.enterRequestPath')
          }
        }
      },
      {
        title: vm.$t('operationLog.requestBody'),
        key: 'request_body',
        search: {
          disabled: true
        },
        disabled: true,
        type: 'textarea',
        form: {
          disabled: true,
          component: {
            props: {
              type: 'textarea'
            },
            autosize: {
              minRows: 2, maxRows: 8
            },
            placeholder: vm.$t('operationLog.enterKeyword')
          }
        }
      },
      {
        title: vm.$t('operationLog.requestMethod'),
        key: 'request_method',
        width: 80,
        type: 'input',
        search: {
          disabled: false
        },
        form: {
          disabled: true,
          component: {
            placeholder: vm.$t('operationLog.enterRequestMethod')
          }
        },
        component: { props: { color: 'auto' } }
      },
      {
        title: vm.$t('operationLog.requestMsg'),
        key: 'request_msg',
        disabled: true,
        form: {
          component: {
            span: 12
          }
        }
      },
      {
        title: vm.$t('operationLog.requestIp'),
        key: 'request_ip',
        search: {
          disabled: false
        },
        width: 130,
        type: 'input',
        form: {
          disabled: true,
          component: {
            placeholder: vm.$t('operationLog.enterRequestIp')
          }
        },
        component: { props: { color: 'auto' } }
      },
      {
        title: vm.$t('operationLog.requestBrowser'),
        key: 'request_browser',
        width: 180,
        type: 'input',
        form: {
          disabled: true
        },
        component: { props: { color: 'auto' } }
      },
      {
        title: vm.$t('operationLog.responseCode'),
        key: 'response_code',
        search: {
          disabled: true
        },
        width: 80,
        type: 'input',
        form: {
          disabled: true
        },
        component: { props: { color: 'auto' } }
      },
      {
        title: vm.$t('operationLog.requestOs'),
        key: 'request_os',
        disabled: true,
        search: {
          disabled: true
        },
        type: 'input',
        form: {
          disabled: true
        },
        component: { props: { color: 'auto' } }
      },
      {
        title: vm.$t('operationLog.jsonResult'),
        key: 'json_result',
        search: {
          disabled: true
        },
        minWidth: 240,
        type: 'input',
        form: {
          disabled: true
        },
        component: { props: { color: 'auto' } }
      }, {
        title: vm.$t('operationLog.operator'),
        width: 100,
        key: 'creator_name',
        form: {
          disabled: true
        }
      },
      {
        title: vm.$t('operationLog.updateDatetime'),
        key: 'update_datetime',
        width: 160,
        show: false,
        type: 'datetime',
        form: {
          disabled: true
        }
      },
      {
        fixed: 'right',
        title: vm.$t('operationLog.createDatetime'),
        key: 'create_datetime',
        width: 160,
        type: 'datetime',
        form: {
          disabled: true
        }
      }
    ]
  }
}
