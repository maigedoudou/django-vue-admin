<template>
  <d2-container>
    <div class="ai-chat-page">
      <el-card shadow="never" class="ai-chat-card">
        <div slot="header" class="clearfix">
          <span>AI Assistant (Local Ollama)</span>
        </div>

        <el-form label-width="110px" size="small">
          <el-form-item label="Message">
            <el-input
              v-model="form.message"
              type="textarea"
              :rows="4"
              placeholder="Type your message..."
            />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Model (optional)">
                <el-input v-model="form.model" placeholder="qwen2.5:3b" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
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
            </el-col>
          </el-row>

          <el-button type="primary" :loading="loading" @click="onSend">Send</el-button>
          <el-button :disabled="loading" @click="onReset">Reset</el-button>
        </el-form>

        <el-divider></el-divider>

        <el-alert
          v-if="errorMsg"
          type="error"
          :title="errorMsg"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-card v-if="reply" shadow="hover" class="reply-card">
          <div slot="header" class="clearfix">
            <span>Reply</span>
            <span class="meta">model: {{ usedModel }} | {{ elapsedMs }} ms</span>
          </div>
          <div class="reply-content">{{ reply }}</div>
        </el-card>
      </el-card>
    </div>
  </d2-container>
</template>

<script>
import { chatWithAI } from './api'

export default {
  name: 'aiChat',
  data () {
    return {
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
  methods: {
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
  }
}
</script>

<style scoped>
.ai-chat-page {
  padding: 8px;
}

.reply-card {
  margin-top: 8px;
}

.reply-content {
  white-space: pre-wrap;
  line-height: 1.7;
}

.meta {
  float: right;
  color: #909399;
  font-size: 12px;
}
</style>
