/**
 * Health Service
 * خدمة فحص الصحة
 */

import type { HealthResponse } from '@/models/health.model'

export const healthService = {
  /**
   * فحص صحة التطبيق
   */
  async check(): Promise<HealthResponse> {
    return {
      message: 'Hello, world!',
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  },

  /**
   * فحص صحة التطبيق مع قاعدة البيانات
   */
  async checkWithDatabase(): Promise<HealthResponse & { database: boolean }> {
    const { healthRepository } = await import('@/repositories/health.repository')
    const dbConnected = await healthRepository.checkDatabaseConnection()
    
    return {
      message: dbConnected ? 'All systems operational' : 'Database connection failed',
      status: dbConnected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: dbConnected
    }
  }
}
