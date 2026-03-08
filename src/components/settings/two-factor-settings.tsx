'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield, ShieldCheck, ShieldX, Smartphone, Key, Copy, Check, AlertTriangle,
  Loader2, RefreshCw, Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorStatus {
  enabled: boolean
  hasSecret: boolean
  backupCodesCount: number
}

interface SetupData {
  secret: string
  qrUri: string
  backupCodes: string[]
}

// QR Code component using Google Charts API
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(value)}&choe=UTF-8`
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-xl shadow-inner border">
        <img 
          src={qrUrl} 
          alt="QR Code" 
          width={size} 
          height={size}
          className="rounded-lg"
        />
      </div>
    </div>
  )
}

// Backup Codes Display Component
function BackupCodesDisplay({ codes, onCopyAll }: { codes: string[]; onCopyAll: () => void }) {
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('تم نسخ الكود')
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(codes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopyAll()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">أكواد الطوارئ</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopyAll}
          className="gap-2"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'تم النسخ' : 'نسخ الكل'}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border font-mono text-sm"
          >
            <span>{code}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyCode(code)}
            >
              {copiedCode === code ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))}
      </div>
      
      <Alert className="bg-amber-500/10 border-amber-500/20">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
          احتفظ بهذه الأكواد في مكان آمن. يمكن استخدام كل كود مرة واحدة فقط في حال فقدان الوصول لتطبيق المصادقة.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [setupStep, setSetupStep] = useState<'initial' | 'qr' | 'verify' | 'backup'>('initial')
  const [verifyCode, setVerifyCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  // Load 2FA status
  const loadStatus = async () => {
    try {
      const res = await fetch('/api/2fa')
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  // Start setup process
  const handleStartSetup = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable' })
      })
      const data = await res.json()
      if (data.success) {
        setSetupData(data.data)
        setSetupStep('qr')
      } else {
        toast.error(data.error || 'فشل بدء الإعداد')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء بدء الإعداد')
    } finally {
      setProcessing(false)
    }
  }

  // Verify and confirm setup
  const handleVerifySetup = async () => {
    if (!verifyCode || verifyCode.length < 6) {
      toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', token: verifyCode })
      })
      const data = await res.json()
      if (data.success) {
        setBackupCodes(setupData?.backupCodes || [])
        setSetupStep('backup')
        toast.success('تم تفعيل المصادقة الثنائية بنجاح')
      } else {
        toast.error(data.error || 'رمز التحقق غير صحيح')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحقق')
    } finally {
      setProcessing(false)
    }
  }

  // Complete setup
  const handleCompleteSetup = () => {
    loadStatus()
    setSetupStep('initial')
    setSetupData(null)
    setVerifyCode('')
  }

  // Disable 2FA
  const handleDisable = async () => {
    if (!disableCode || disableCode.length < 6) {
      toast.error('يرجى إدخال رمز التحقق')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', token: disableCode })
      })
      const data = await res.json()
      if (data.success) {
        setShowDisableDialog(false)
        setDisableCode('')
        loadStatus()
        toast.success('تم تعطيل المصادقة الثنائية')
      } else {
        toast.error(data.error || 'رمز التحقق غير صحيح')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التعطيل')
    } finally {
      setProcessing(false)
    }
  }

  // Regenerate backup codes
  const handleRegenerateCodes = async () => {
    if (!confirm('هل أنت متأكد من إعادة توليد أكواد الطوارئ؟ الأكواد الحالية ستصبح غير صالحة.')) {
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-backup' })
      })
      const data = await res.json()
      if (data.success) {
        setBackupCodes(data.data.backupCodes)
        loadStatus()
        toast.success('تم إنشاء أكواد طوارئ جديدة')
      } else {
        toast.error(data.error || 'فشل إعادة توليد الأكواد')
      }
    } catch (error) {
      toast.error('حدث خطأ')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-l from-red-500/5 to-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-red-500" />
            المصادقة الثنائية
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Setup flow
  if (setupStep !== 'initial') {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-l from-red-500/5 to-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-red-500" />
            إعداد المصادقة الثنائية
          </CardTitle>
          <CardDescription>
            اتبع الخطوات التالية لتفعيل المصادقة الثنائية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupStep === 'qr' && setupData && (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 justify-center">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && <div className="w-8 h-0.5 bg-muted" />}
                  </div>
                ))}
              </div>

              <div className="text-center space-y-2">
                <p className="font-medium">الخطوة 1: مسح رمز QR</p>
                <p className="text-sm text-muted-foreground">
                  استخدم تطبيق المصادقة (Google Authenticator, Authy) لمسح الرمز
                </p>
              </div>

              <div className="flex justify-center">
                <QRCodeDisplay value={setupData.qrUri} size={180} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">أو أدخل الكود يدوياً:</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <code className="flex-1 text-sm font-mono break-all">{setupData.secret}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret)
                      toast.success('تم نسخ السر')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>أدخل رمز التحقق من التطبيق</Label>
                <Input
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSetupStep('initial')
                    setSetupData(null)
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-l from-red-500 to-orange-500"
                  onClick={handleVerifySetup}
                  disabled={processing || verifyCode.length !== 6}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'تحقق'
                  )}
                </Button>
              </div>
            </>
          )}

          {setupStep === 'backup' && (
            <>
              <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium text-lg">تم تفعيل المصادقة الثنائية!</p>
                <p className="text-sm text-muted-foreground">
                  احتفظ بأكواد الطوارئ في مكان آمن
                </p>
              </div>

              <BackupCodesDisplay 
                codes={backupCodes}
                onCopyAll={() => toast.success('تم نسخ جميع الأكواد')}
              />

              <Button
                className="w-full bg-gradient-to-l from-green-500 to-emerald-500"
                onClick={handleCompleteSetup}
              >
                <Check className="h-4 w-4 ml-2" />
                إنهاء الإعداد
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Status view
  return (
    <>
      <Card className="border-0 shadow-md bg-gradient-to-l from-red-500/5 to-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-red-500" />
              المصادقة الثنائية (2FA)
            </div>
            {status?.enabled ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <ShieldCheck className="h-3 w-3 ml-1" />
                مفعلة
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted/50">
                <ShieldX className="h-3 w-3 ml-1" />
                معطلة
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            حماية إضافية لحسابك باستخدام تطبيق المصادقة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <>
              {/* Status info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">حالة التفعيل</span>
                  </div>
                  <p className="text-xs text-muted-foreground">مفعلة ومتصلة</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">أكواد الطوارئ</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{status.backupCodesCount} كود متبقي</p>
                </div>
              </div>

              {/* Apps info */}
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Smartphone className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-xs">
                  تطبيقات مدعومة: Google Authenticator, Authy, Microsoft Authenticator
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleRegenerateCodes}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  إعادة توليد أكواد الطوارئ
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => setShowDisableDialog(true)}
                >
                  <ShieldX className="h-4 w-4" />
                  تعطيل المصادقة الثنائية
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not enabled */}
              <Alert className="bg-amber-500/10 border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-xs">
                  حسابك غير محمي بالمصادقة الثنائية. ننصح بتفعيلها لزيادة الأمان.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  المصادقة الثنائية تضيف طبقة أمان إضافية لحسابك عن طريق طلب رمز تحقق من تطبيق على هاتفك.
                </p>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">كيف تعمل؟</p>
                    <p className="text-xs text-muted-foreground">
                      عند تسجيل الدخول، ستحتاج لإدخال رمز من تطبيق المصادقة على هاتفك بالإضافة لكلمة المرور.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-l from-red-500 to-orange-500"
                onClick={handleStartSetup}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Shield className="h-4 w-4 ml-2" />
                )}
                تفعيل المصادقة الثنائية
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <ShieldX className="h-5 w-5" />
              تعطيل المصادقة الثنائية
            </DialogTitle>
            <DialogDescription>
              سيؤدي هذا إلى إزالة الحماية الإضافية من حسابك. أدخل رمز التحقق للمتابعة.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-xs">
                تحذير: سيصبح حسابك أقل أماناً بعد التعطيل
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>رمز التحقق</Label>
              <Input
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={processing || disableCode.length !== 6}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تعطيل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
