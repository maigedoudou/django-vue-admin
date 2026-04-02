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
      title="AI Assistant"
      :visible.sync="drawerVisible"
      direction="rtl"
      :size="drawerSize"
      :append-to-body="true"
    >
      <div class="drawer-body">
        <el-form label-position="top" size="small">
          <el-form-item label="Message">
            <el-input
              v-model="form.message"
              type="textarea"
              :rows="5"
              placeholder="Type your message..."
            />
          </el-form-item>

          <el-form-item label="Model">
            <el-input v-model="form.model" placeholder="qwen2.5:3b (optional)" />
          </el-form-item>

          <el-form-item label="Temperature">
            <el-input-number
              v-model="form.temperature"
              :min="0"
              :max="1"
              :step="0.1"
              :precision="1"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>

          <div class="action-row">
            <el-button type="primary" :loading="loading" @click="onSend">Send</el-button>
            <el-button :disabled="loading" @click="onReset">Reset</el-button>
          </div>
        </el-form>

        <el-divider></el-divider>

        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />

        <el-card v-if="reply" shadow="hover">
          <div slot="header" class="reply-header">
            <span>Reply</span>
            <span class="meta">{{ usedModel }} | {{ elapsedMs }} ms</span>
          </div>
          <div class="reply-content">{{ reply }}</div>
        </el-card>
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
      reply: '',
      usedModel: '',
      elapsedMs: 0,
      form: {
        message: '',
        model: '',
        temperature: 0.7
      }
    }
  },
  computed: {
    drawerSize () {
      return this.windowWidth <= 992 ? '100%' : '420px'
    }
  },
  methods: {
    onResize () {
      this.windowWidth = window.innerWidth
    },
    buildPayload () {
      const payload = {
        message: (this.form.message || '').trim()
      }
      if ((this.form.model || '').trim()) {
        payload.model = this.form.model.trim()
      }
      if (this.form.temperature !== null && this.form.temperature !== undefined) {
        payload.temperature = this.form.temperature
      }
      return payload
    },
    async onSend () {
      if (!this.form.message || !this.form.message.trim()) {
        this.$message.warning('Please input message first')
        return
      }
      this.loading = true
      this.errorMsg = ''
      this.reply = ''

      try {
        const res = await chatWithAI(this.buildPayload())
        const data = res.data || {}
        this.reply = data.reply || ''
        this.usedModel = data.used_model || ''
        this.elapsedMs = data.elapsed_ms || 0
      } catch (error) {
        this.errorMsg = (error && error.message) || 'Request failed'
      } finally {
        this.loading = false
      }
    },
    onReset () {
      this.form.message = ''
      this.form.model = ''
      this.form.temperature = 0.7
      this.errorMsg = ''
      this.reply = ''
      this.usedModel = ''
      this.elapsedMs = 0
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

.drawer-body {
  padding: 8px 8px 20px;
  height: calc(100vh - 70px);
  overflow-y: auto;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reply-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.meta {
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}

.reply-content {
  white-space: pre-wrap;
  line-height: 1.7;
  word-break: break-word;
}
</style>
