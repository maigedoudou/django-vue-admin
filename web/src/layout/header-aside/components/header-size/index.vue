<template>
  <el-dropdown placement="bottom" size="small" @command="handleChange">
    <el-button class="d2-mr btn-text can-hover" type="text">
      <d2-icon name="font" style="font-size: 16px;"/>
    </el-button>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item v-for="item in options" :key="item.value" :command="item.value">
        <d2-icon :name="iconName(item.value)" class="d2-mr-5"/>{{item.label}}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'
export default {
  name: 'd2-header-size',
  data () {
    return {
      options: [
        { label: this.$t('header.sizeDefault'), value: 'default' },
        { label: this.$t('header.sizeMedium'), value: 'medium' },
        { label: this.$t('header.sizeSmall'), value: 'small' },
        { label: this.$t('header.sizeMini'), value: 'mini' }
      ]
    }
  },
  computed: {
    ...mapState('d2admin/size', [
      'value'
    ])
  },
  methods: {
    ...mapMutations({
      pageKeepAliveClean: 'd2admin/page/keepAliveClean'
    }),
    ...mapActions({
      sizeSet: 'd2admin/size/set'
    }),
    handleChange (value) {
      this.sizeSet(value)
      this.$notify({
        title: this.$t('header.hint'),
        dangerouslyUseHTMLString: true,
        message: this.$t('header.sizeChanged'),
        type: 'success'
      })
    },
    iconName (name) {
      return name === this.value ? 'dot-circle-o' : 'circle-o'
    }
  }
}
</script>
