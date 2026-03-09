import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ERP أقساطي - نظام إدارة الموارد",
    template: "%s | ERP أقساطي"
  },
  description: "نظام متكامل لإدارة موارد المؤسسات مع نظام الأقساط - Multi-Company Multi-Branch ERP Management System",
  keywords: ["ERP", "Enterprise", "أقساط", "Installments", "Arabic", "RTL", "Accounting", "Inventory", "Sales"],
  authors: [{ name: "ERP Aqsati Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" }
    ],
    shortcut: "/icons/icon-192x192.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP أقساطي"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    siteName: "ERP أقساطي",
    title: "ERP أقساطي - نظام إدارة الموارد",
    description: "نظام متكامل لإدارة موارد المؤسسات مع نظام الأقساط",
    images: [{ url: "/icons/icon-512x512.svg" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "ERP أقساطي - نظام إدارة الموارد",
    description: "نظام متكامل لإدارة موارد المؤسسات مع نظام الأقساط",
    images: [{ url: "/icons/icon-512x512.svg" }]
  },
  applicationName: "ERP أقساطي",
  generator: "Next.js 16",
  referrer: "origin-when-cross-origin",
  creator: "ERP Aqsati Team",
  publisher: "ERP Aqsati",
  category: "business"
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a5f" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="أقساطي" />
        <meta name="apple-mobile-web-app-title" content="أقساطي" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // تسجيل Service Worker للعمل أوفلاين
              (function() {
                try {
                  // التحقق من دعم Service Worker (مع معالجة sandbox)
                  if (!navigator.serviceWorker) {
                    console.log('[PWA] Service Worker not supported or disabled in sandbox');
                    return;
                  }
                  
                  window.addEventListener('load', async function() {
                    try {
                      const registration = await navigator.serviceWorker.register('/sw.js');
                      console.log('[PWA] Service Worker registered:', registration.scope);

                      // التحقق من التحديثات
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // يوجد تحديث جديد
                              if (confirm('🔄 يوجد تحديث جديد للتطبيق. هل تريد التحديث الآن؟')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                              }
                            }
                          });
                        }
                      });

                      // طلب إذن الإشعارات
                      if ('Notification' in window && Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        console.log('[PWA] Notification permission:', permission);
                      }

                    } catch (error) {
                      console.log('[PWA] Service Worker registration skipped:', error.message);
                    }
                  });

                  // مراقبة حالة الاتصال
                  window.addEventListener('online', () => {
                    console.log('[PWA] Back online');
                    document.dispatchEvent(new CustomEvent('connection-changed', { detail: { online: true } }));
                  });
                  
                  window.addEventListener('offline', () => {
                    console.log('[PWA] Gone offline');
                    document.dispatchEvent(new CustomEvent('connection-changed', { detail: { online: false } }));
                  });
                } catch (e) {
                  // Service Worker غير مدعوم أو معطل في sandbox
                  console.log('[PWA] Service Worker disabled in this environment');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
        style={{ fontFamily: "'Noto Sans Arabic', var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
