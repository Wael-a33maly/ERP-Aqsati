// ============================================
// Two-Factor Authentication Model - نموذج المصادقة الثنائية
// ============================================

export interface TwoFactorStatus {
  enabled: boolean
  hasSecret: boolean
  backupCodesCount: number
}

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

// Input Types
export interface TwoFactorActionInput {
  action: TwoFactorAction
  token?: string
}

export type TwoFactorAction = 
  | 'enable'
  | 'confirm'
  | 'disable'
  | 'verify'
  | 'regenerate-backup'

// Response Types
export interface TwoFactorActionResponse {
  success: boolean
  data?: TwoFactorSetup | { valid: boolean } | { backupCodes: string[] }
  message?: string
  error?: string
}
