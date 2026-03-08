/**
 * Health Model
 * نموذج الصحة والفحص
 */

export interface HealthResponse {
  message: string
  status: 'ok' | 'error'
  timestamp?: string
  version?: string
}
