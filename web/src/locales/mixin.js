import util from '@/libs/util'

export default {
  methods: {
    onChangeLocale (command) {
      if (this.$i18n.locale === command) return
      this.$i18n.locale = command
      util.cookies.set('lang', command)
      const currentLang = this.$languages.find(l => l.value === command)
      const langName = currentLang ? currentLang.label : command
      const isEn = this.$i18n.locale === 'en'
      let message = isEn
        ? `Current language: ${langName} [ ${this.$i18n.locale} ]`
        : `当前语言：${langName} [ ${this.$i18n.locale} ]`
      if (process.env.VUE_APP_BUILD_MODE === 'PREVIEW') {
        message = isEn
          ? [
              `Current language: ${this.$t('_name')} [ ${this.$i18n.locale} ]`,
              'Preview mode only provides language switching without full locale data.',
              'Docs: <a class="el-link el-link--primary is-underline" target="_blank" href="https://d2.pub/zh/doc/d2-admin/locales">Internationalization | D2Admin</a>'
            ].join('<br/>')
          : [
              `当前语言：${this.$t('_name')} [ ${this.$i18n.locale} ]`,
              '仅提供切换功能，没有配置具体的语言数据 ',
              '文档参考：<a class="el-link el-link--primary is-underline" target="_blank" href="https://d2.pub/zh/doc/d2-admin/locales">《国际化 | D2Admin》</a>'
            ].join('<br/>')
      }
      this.$notify({
        title: isEn ? 'Language Changed' : '语言变更',
        dangerouslyUseHTMLString: true,
        message
      })
      setTimeout(() => {
        window.location.reload()
      }, 120)
    }
  }
}
