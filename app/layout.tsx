import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'MessPass',
  description: 'Digital meal tracking for mess owners',
  manifest: '/manifest.json',
  themeColor: '#0F6E56',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MessPass',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body style={{margin:0,padding:0,background:'#f5f5f0'}}>
        {children}
        <Analytics />
        <Analytics />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(){})
            })
          }
        `}} />
      </body>
    </html>
  )
}
