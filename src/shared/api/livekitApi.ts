import { apiClient } from './axios'

export type LivekitWebhookPayload = Record<string, unknown>

export const livekitApi = {
  postWebhook: async (payload: LivekitWebhookPayload) => {
    const response = await apiClient.post('/livekit/webhook', payload)
    return response.data
  }
}
