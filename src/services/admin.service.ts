/**
 * Admin Service
 * خدمات الإدارة
 */

import { adminRepository } from '@/repositories/admin.repository'
import type { AdminStatsParams } from '@/models/admin.model'

export const adminService = {
  async getStats(params: AdminStatsParams) {
    return adminRepository.getStats(params)
  },

  async getRecentActivity(limit?: number) {
    return adminRepository.getRecentActivity(limit)
  },

  async getSystemHealth() {
    return adminRepository.getSystemHealth()
  },

  async getBackups() {
    return adminRepository.getBackups()
  },

  async createBackup(data: { type: string; description?: string }) {
    return adminRepository.createBackup(data)
  },

  async restoreBackup(backupId: string) {
    return adminRepository.restoreBackup(backupId)
  }
}
