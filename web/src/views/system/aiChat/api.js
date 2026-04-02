import { request } from '@/api/service'

export function chatWithAI (data) {
  return request({
    url: '/api/system/ai/chat/',
    method: 'post',
    data
  })
}
