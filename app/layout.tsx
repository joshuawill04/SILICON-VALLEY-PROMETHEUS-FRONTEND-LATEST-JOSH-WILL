import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import localFont from 'next/font/local'
import { RootClientEffects } from '@/components/root-client-effects'
import { WorkspaceFrame } from '@/components/workspace-frame'
import './globals.css'
import './premium-vignette.css'

const vogueDisplay = localFont({
  src: '../Vogue.ttf',
  variable: '--font-vogue-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prometheus',
  description: 'Premium creator infrastructure for cinematic editing, music selection, and export polish.',
  generator: 'Prometheus',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${vogueDisplay.variable} bg-[#05060a] font-sans text-foreground antialiased`}>
        <WorkspaceFrame>{children}</WorkspaceFrame>
        <RootClientEffects />
        <Analytics />
      </body>
    </html>
  )
}
