<template>
  <el-card shadow="hover" :header="config?.showHeader?.value ? $t('dashboard.about') : ''" class="card-view" :style="{backgroundColor:randomColor(),color: config?.fontColor?.value}">
    <p :style="{color: config?.fontColor?.value}">{{ $t('dashboard.aboutDesc') }}
      <a href='https://gitee.com/liqianglog/django-vue-admin'>
        <img src='https://gitee.com/liqianglog/django-vue-admin/badge/star.svg?theme=dark' alt='star'
             style="position: absolute;right: 20px;bottom: 10px;"/>
      </a>
    </p>
  </el-card>
</template>

<script>
export default {
  sort: 9,
  title: '关于项目',
  name: 'about',
  icon: 'el-icon-setting',
  description: '点个星星支持一下',
  height: 20,
  width: 16,
  isResizable: true,
  config: {
    showHeader: {
      label: '显示头部信息',
      type: 'boot',
      value: true,
      placeholder: '颜色为空则随机变换颜色'
    },
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
    }
  },
  data () {
    return {}
  },
  methods: {
    // 生成一个颜色
    randomColor () {
      if (this.config?.color?.value) {
        return this.config.color.value
      }
      return this.$util.randomColor()
    }
  }
}
</script>

<style scoped lang="scss">
.card-view {
  color: $color-primary;

  p {
    font-size: 0.8em;
    color: $color-primary;
  }
}
.el-card{
  height: 100%;
}
::v-deep .el-card__body {
  height: 110px;

}
</style>
