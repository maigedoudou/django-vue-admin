<template>
  <div class="ai-assistant">
    <el-button
      class="ai-toolbar-btn"
      type="primary"
      size="mini"
      icon="el-icon-chat-dot-round"
      @click="drawerVisible = true"
    >
      AI
    </el-button>

    <el-drawer
      :visible.sync="drawerVisible"
      direction="rtl"
      :size="drawerSize"
      :append-to-body="true"
      :show-close="false"
      :with-header="false"
    >
      <div class="chat-container">
        <!-- 顶部标题栏 -->
        <div class="chat-header">
          <div class="chat-header-left">
            <div class="ai-avatar"><i class="el-icon-cpu"></i></div>
            <div>
            <div class="chat-title">{{ $t('ai.title') }}</div>
            <div class="chat-subtitle">{{ $t('ai.subtitle') }} {{ currentModel || 'qwen2.5' }}</div>
            </div>
          </div>
          <div class="chat-header-right">
            <el-tooltip :content="$t('ai.clear')" placement="bottom">
              <i class="el-icon-delete header-icon" @click="onClear"></i>
            </el-tooltip>
            <el-tooltip :content="$t('ai.settings')" placement="bottom">
              <i class="el-icon-setting header-icon" @click="showSettings = !showSettings"></i>
            </el-tooltip>
            <el-tooltip :content="$t('ai.close')" placement="bottom">
              <i class="el-icon-close header-icon" @click="drawerVisible = false"></i>
            </el-tooltip>
          </div>
        </div>

        <!-- 设置面板（折叠） -->
        <div v-if="showSettings" class="settings-panel">
          <el-input
            v-model="form.model"
            size="mini"
            :placeholder="$t('ai.modelLabel')"
            prefix-icon="el-icon-cpu"
          />
          <div class="temp-row">
            <span class="temp-label">Temperature: {{ form.temperature }}</span>
            <el-slider
              v-model="form.temperature"
              :min="0" :max="1" :step="0.1"
              :show-tooltip="false"
              style="flex:1; margin-left: 12px"
            />
          </div>
          <div class="lang-row">
            <span class="temp-label">Reply Language:</span>
            <el-radio-group v-model="form.lang" size="mini" style="margin-left: 10px">
              <el-radio-button label="auto">{{ $t('ai.langAuto') }}</el-radio-button>
              <el-radio-button label="en">English</el-radio-button>
              <el-radio-button label="zh">中文</el-radio-button>
              <el-radio-button label="ja">日本語</el-radio-button>
            </el-radio-group>
          </div>
          <div class="lang-row">
            <span class="temp-label">Agent Mode:</span>
            <el-switch
              v-model="form.agentMode"
              active-color="#13ce66"
              inactive-color="#c0c4cc"
              style="margin-left: 10px"
            />
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="messageList">
          <!-- 欢迎提示 -->
          <div v-if="messages.length === 0" class="chat-welcome">
            <div class="welcome-icon"><i class="el-icon-chat-dot-round"></i></div>
            <div class="welcome-title">{{ $t('ai.welcome') }}</div>
            <div class="welcome-desc">{{ $t('ai.welcomeDesc') }}</div>
            <div class="welcome-examples">
              <div class="example-chip" @click="quickAsk($t('ai.q1'))">👥 {{ $t('ai.q1') }}</div>
              <div class="example-chip" @click="quickAsk($t('ai.q2'))">📊 {{ $t('ai.q2') }}</div>
              <div class="example-chip" @click="quickAsk($t('ai.q3'))">🏢 {{ $t('ai.q3') }}</div>
            </div>
          </div>

          <!-- 消息气泡 -->
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="['message-row', msg.role === 'user' ? 'message-user' : 'message-ai']"
          >
            <div v-if="msg.role === 'ai'" class="bubble-avatar ai-bubble-avatar">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="bubble-wrap">
              <div v-if="msg.toolsUsed && msg.toolsUsed.length" class="tools-badge">
                <i class="el-icon-connection"></i>
                {{ $t('ai.dataQueried') }}
                <span v-for="tool in msg.toolsUsed" :key="tool" class="tool-tag">{{ toolLabels[tool] || tool }}</span>
              </div>
              <div :class="['bubble', msg.role === 'user' ? 'bubble-user' : 'bubble-ai']">
                {{ msg.content }}
              </div>
              <div class="bubble-meta">
                <span v-if="msg.role === 'ai'">{{ msg.model }} · {{ msg.elapsed }}ms</span>
                <span v-else>{{ msg.time }}</span>
              </div>
            </div>
            <div v-if="msg.role === 'user'" class="bubble-avatar user-bubble-avatar">
              <i class="el-icon-user"></i>
            </div>
          </div>

          <!-- 加载动画 -->
          <div v-if="loading" class="message-row message-ai">
            <div class="bubble-avatar ai-bubble-avatar"><i class="el-icon-cpu"></i></div>
            <div class="bubble bubble-ai bubble-loading">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMsg" class="error-msg">
            <i class="el-icon-warning-outline"></i> {{ errorMsg }}
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <el-input
            v-model="form.message"
            type="textarea"
            :rows="3"
            :placeholder="$t('ai.placeholder')"
            resize="none"
            @keydown.enter.native="onEnterKey"
          />
          <div class="input-actions">
            <span class="input-hint">{{ form.message.length }} 字</span>
            <el-button
              type="primary"
              size="small"
              :loading="loading"
              :disabled="!form.message.trim()"
              icon="el-icon-s-promotion"
              @click="onSend"
            >{{ $t('ai.send') }}</el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { chatWithAI } from '@/views/system/aiChat/api'

export default {
  name: 'd2-header-ai-assistant',
  data () {
    return {
      windowWidth: window.innerWidth,
      drawerVisible: false,
      loading: false,
      errorMsg: '',
      showSettings: false,
      currentModel: '',
      messages: [],
      toolLabels: {
        get_user_stats: '用户统计',
        get_login_stats: '登录统计',
        get_dept_stats: '部门统计',
        get_role_stats: '角色统计'
      },
      form: {
        message: '',
        model: '',
        temperature: 0.7,
        lang: 'auto',
        agentMode: true
      }
    }
  },
  computed: {
    drawerSize () {
      return this.windowWidth <= 992 ? '100%' : '440px'
    }
  },
  methods: {
    onResize () {
      this.windowWidth = window.innerWidth
    },
    onEnterKey (e) {
      if (!e.shiftKey) {
        e.preventDefault()
        this.onSend()
      }
    },
    quickAsk (text) {
      this.form.message = text
      this.onSend()
    },
    scrollToBottom () {
      this.$nextTick(() => {
        const el = this.$refs.messageList
        if (el) el.scrollTop = el.scrollHeight
      })
    },
    buildPayload () {
      const payload = { message: (this.form.message || '').trim() }
      if ((this.form.model || '').trim()) payload.model = this.form.model.trim()
      if (this.form.temperature !== null && this.form.temperature !== undefined) {
        payload.temperature = this.form.temperature
      }
      if (this.form.lang && this.form.lang !== 'auto') payload.lang = this.form.lang
      payload.agent_mode = !!this.form.agentMode
      return payload
    },
    async onSend () {
      const text = (this.form.message || '').trim()
      if (!text) return

      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      const payload = this.buildPayload()
      this.messages.push({ role: 'user', content: text, time: timeStr })
      this.form.message = ''
      this.errorMsg = ''
      this.loading = true
      this.scrollToBottom()

      try {
        const res = await chatWithAI(payload)
        const data = res.data || {}
        this.currentModel = data.used_model || ''
        this.messages.push({
          role: 'ai',
          content: data.reply || '',
          model: data.used_model || '',
          elapsed: data.elapsed_ms || 0,
          toolsUsed: data.tools_used || []
        })
      } catch (error) {
        this.errorMsg = (error && error.message) || '请求失败，请检查 Ollama 服务是否运行'
      } finally {
        this.loading = false
        this.scrollToBottom()
      }
    },
    onClear () {
      this.messages = []
      this.errorMsg = ''
      this.currentModel = ''
    }
  },
  mounted () {
    window.addEventListener('resize', this.onResize)
  },
  destroyed () {
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style scoped>
.ai-toolbar-btn {
  margin-right: 8px;
}

/* 整体容器 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

/* 顶部标题栏 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  flex-shrink: 0;
}
.chat-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.chat-title {
  font-size: 15px;
  font-weight: 600;
}
.chat-subtitle {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 1px;
}
.chat-header-right {
  display: flex;
  gap: 14px;
}
.header-icon {
  font-size: 16px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}
.header-icon:hover { opacity: 1; }

.lang-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.settings-panel {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}
.temp-row {
  display: flex;
  align-items: center;
}
.temp-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 欢迎区域 */
.chat-welcome {
  text-align: center;
  padding: 40px 20px 20px;
  color: #909399;
}
.welcome-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.welcome-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.welcome-desc {
  font-size: 13px;
  margin-bottom: 16px;
}
.welcome-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.example-chip {
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 18px;
  padding: 7px 16px;
  font-size: 13px;
  cursor: pointer;
  color: #409eff;
  transition: all 0.2s;
  width: fit-content;
}
.example-chip:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

/* 消息行 */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.message-user { flex-direction: row-reverse; }

.bubble-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.ai-bubble-avatar {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
}
.user-bubble-avatar {
  background: #e1f0ff;
  color: #409eff;
}

.bubble-wrap {
  max-width: 78%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.message-user .bubble-wrap { align-items: flex-end; }

/* 工具标签 */
.tools-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #67c23a;
  flex-wrap: wrap;
}
.tool-tag {
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 10px;
  padding: 1px 7px;
  color: #67c23a;
}

/* 气泡 */
.bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
  white-space: pre-wrap;
}
.bubble-ai {
  background: #fff;
  color: #303133;
  border-radius: 4px 16px 16px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.bubble-user {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  border-radius: 16px 4px 16px 16px;
}

/* 加载动画 */
.bubble-loading {
  padding: 14px 18px;
  display: flex;
  gap: 5px;
  align-items: center;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.bubble-meta {
  font-size: 11px;
  color: #c0c4cc;
  padding: 0 4px;
}

/* 错误提示 */
.error-msg {
  text-align: center;
  font-size: 12px;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 8px;
  padding: 8px 12px;
}

/* 输入区域 */
.chat-input-area {
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 12px 16px;
  flex-shrink: 0;
}
.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.input-hint {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
