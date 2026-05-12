<template>
  <div>
    <el-drawer
      :visible.sync="deviceUpgradeDrawer"
      :size="500">
      <div slot="title">
        <span>{{ $t('dashboard.widgetConfig') }}</span>
        <el-tag size="small" style="margin-left: 10px">{{ myComp.title }}</el-tag>
      </div>
      <!--   组件内容   -->
      <el-form ref="ruleForm" label-width="100px" class="demo-ruleForm">
        <el-form-item
          v-for="(item,index) in items.config"
          :label="normalizeLabel(item.label)"
          :key="index"
          :rules="item.rules">
          <el-input v-if="item.type==='input'" v-model="item.value" :placeholder="normalizePlaceholder(item.placeholder) || $t('common.pleaseInput')"></el-input>
          <el-switch v-if="item.type==='boot'" v-model="item.value" active-color="#13ce66" inactive-color="#ff4949"></el-switch>
          <el-color-picker v-if="item.type==='color'" v-model="item.value" show-alpha :predefine="predefineColors"></el-color-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig">{{ $t('common.save') }}</el-button>
          <el-button @click="deviceUpgradeDrawer = false">{{ $t('common.close') }}</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script>
export default {
  name: 'dashboardConfig',
  data () {
    return {
      deviceUpgradeDrawer: false,
      myComp: {},
      items: {},
      predefineColors: [
        '#ff4500',
        '#ff8c00',
        '#ffd700',
        '#90ee90',
        '#00ced1',
        '#1e90ff',
        '#c71585',
        'rgba(255, 69, 0, 0.68)',
        'rgb(255, 120, 0)',
        'hsv(51, 100, 98)',
        'hsva(120, 40, 94, 0.5)',
        'hsl(181, 100%, 37%)',
        'hsla(209, 100%, 56%, 0.73)',
        '#c7158577'
      ]
    }
  },
  mounted () {
  },
  methods: {
    normalizeLabel (label) {
      if (this.$i18n.locale !== 'en') return label
      const map = {
        '显示头部信息': 'Show Header',
        '背景颜色': 'Background Color',
        '字体颜色': 'Font Color',
        '图片地址': 'Image URL',
        '跳转地址': 'Redirect URL'
      }
      return map[label] || label
    },
    normalizePlaceholder (placeholder) {
      if (this.$i18n.locale !== 'en') return placeholder
      const map = {
        '颜色为空则随机变换颜色': 'Leave empty for random color',
        '请选择字体颜色': 'Please select font color',
        '请输入图片地址': 'Please enter image URL',
        '请输入跳转地址': 'Please enter redirect URL'
      }
      return map[placeholder] || placeholder
    },
    normalizeRuleMessage (message) {
      if (this.$i18n.locale !== 'en') return message
      const map = {
        '不能为空': 'This field is required'
      }
      return map[message] || message
    },
    initData (myComp, items) {
      this.myComp = myComp
      if (items && items.config) {
        Object.keys(items.config).forEach(key => {
          const configItem = items.config[key]
          if (!configItem) return
          configItem.label = this.normalizeLabel(configItem.label)
          configItem.placeholder = this.normalizePlaceholder(configItem.placeholder)
          if (Array.isArray(configItem.rules)) {
            configItem.rules = configItem.rules.map(rule => ({
              ...rule,
              message: this.normalizeRuleMessage(rule.message)
            }))
          }
        })
      }
      this.items = items
      console.log(1112, this.myComp, this.items)
    },
    saveConfig () {
      this.deviceUpgradeDrawer = false
      this.$emit('saveConfig', this.myComp, this.items)
    }
  }

}
</script>

<style scoped>

</style>
