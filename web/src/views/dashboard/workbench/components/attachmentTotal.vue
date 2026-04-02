<template>
  <el-card
    class="card-view"
    :class="{ compact: isCompact, tiny: isTiny }"
    :style="{ backgroundColor: randomColor() }"
    shadow="always"
  >
    <div :style="{color: config?.fontColor?.value}">
      <div class="card-header-row">
        <div class="card-content-label">附件统计</div>
        <i class="real-time">实时</i>
      </div>
      <div class="stats-row">
        <div class="card-content stat-item">
          <div class="card-content-value">{{ count }}</div>
          <div class="el-icon-document-copy">
            附件数量
          </div>
        </div>
        <div class="card-content-time stat-item stat-item-right">
          <div class="attachment-value">{{ occupy_space }}</div>
          <div class="el-icon-s-flag">
            附件大小
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import { request } from '@/api/service'

export default {
  sort: 3,
  title: '附件统计',
  name: 'attachmentTotal',
  icon: 'el-icon-s-order',
  description: '总附件数以及附件占用大小',
  height: 14,
  width: 16,
  isResizable: true,
  config: {
    color: {
      label: '背景颜色',
      type: 'color',
      value: '',
      placeholder: '颜色为空则随机变换颜色'
    },
    fontColor: {
      label: '字体颜色',
      type: 'color',
      value: '',
      placeholder: '请选择字体颜色'
    }
  },
  props: {
    config: {
      type: Object,
      required: false
    },
    width: {
      type: [Number, String],
      required: false,
      default: 16
    }
  },
  data () {
    return {
      count: '',
      occupy_space: ''
    }
  },
  computed: {
    widthUnits () {
      const num = Number(this.width)
      return Number.isNaN(num) ? 16 : num
    },
    isCompact () {
      return this.widthUnits <= 14
    },
    isTiny () {
      return this.widthUnits <= 8
    }
  },
  methods: {
    initGet () {
      request({
        url: '/api/system/datav/attachment_total/'
      }).then((res) => {
        this.count = res.data.count
        this.occupy_space = this.$util.formatBytes(res.data.occupy_space)
      })
    },
    // 生成一个随机整数
    randomColor () {
      if (this.config?.color?.value) {
        return this.config.color.value
      }
      return this.$util.randomColor()
    }
  },
  mounted () {
    this.initGet()
  }
}
</script>

<style scoped lang="scss">
.card-view {
  //border-radius: 10px;
  color: $color-primary;

  .card-content {
    .card-content-label {
      font-size: 0.8em;
    }

    .card-content-value {
      margin-top: 5px;
      font-size: 26px;
      font-weight: bold;
      line-height: 1.1;
      white-space: nowrap;
    }
  }

  .attachment-value {
    margin-top: 5px;
    font-size: 26px;
    font-weight: bold;
    line-height: 1.1;
    white-space: nowrap;
  }

  .el-icon-document-copy {
    font-size: 12px;
  }

  .el-icon-s-flag {
    font-size: 12px;
  }
}

.real-time {
  background: rgb(53, 59, 86);
  color: #ffffff;
  font-size: 14px;
  font-style: normal;
  padding: 0 7px 0 7px;
  border-radius: 4px;
}

.el-card {
  height: 100%;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  margin-top: 12px;
}

.stat-item {
  min-width: 0;
  width: 100%;
}

.stat-item-right {
  text-align: right;
}

.el-icon-document-copy,
.el-icon-s-flag {
  white-space: nowrap;
}

.card-view.compact .card-content .card-content-value,
.card-view.compact .attachment-value {
  font-size: 22px;
}

.card-view.tiny .real-time {
  font-size: 12px;
  padding: 0 6px;
}

.card-view.tiny .card-content .card-content-value,
.card-view.tiny .attachment-value {
  font-size: 18px;
}

.card-view.tiny .el-icon-document-copy,
.card-view.tiny .el-icon-s-flag {
  font-size: 11px;
}

.card-view.tiny .stats-row {
  gap: 8px;
}

.card-view.tiny .stat-item-right {
  text-align: left;
}

.card-view.tiny .stats-row {
  grid-template-columns: 1fr;
  gap: 8px;
}
</style>
