/**
 * Health Repository
 * مستودع فحص الصحة
 */

// No database operations needed for health check
export const healthRepository = {
  // يمكن إضافة فحص قاعدة البيانات هنا إذا لزم الأمر
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { db } = await import('@/lib/db')
      await db.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
