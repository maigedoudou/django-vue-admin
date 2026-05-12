import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ElementLocale from 'element-ui/lib/locale'
import util from '@/libs/util'

Vue.use(VueI18n)

function loadLocaleMessages () {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  for (const key of locales.keys()) {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      // 只加载我们自己的 JSON，element-ui 通过 ElementLocale.i18n() 桥接
      const localeElementUI = require(`element-ui/lib/locale/lang/${locales(key)._element}`)
      messages[locale] = {
        ...locales(key),
        el: localeElementUI ? localeElementUI.default.el : {}
      }
    }
  }
  return messages
}

const messages = loadLocaleMessages()

Vue.prototype.$languages = Object.keys(messages).map(langlage => ({
  label: messages[langlage]._name,
  value: langlage
}))

const i18n = new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

// 让 element-ui 通过 vue-i18n 获取翻译，不再 spread 到顶层
ElementLocale.i18n((key, value) => i18n.t(key, value))

export default i18n
