import './globals.css'
import type { Metadata } from 'next'
import { RootProvider } from '@/components/providers/root-provider'

export const metadata: Metadata = {
  title: 'Chat Application',
  description: 'A modern chat application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}