import type { Metadata } from 'next'
import { Lato, Open_Sans } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/toast-provider'

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-lato'
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-opensans'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://orderflow.io'),
  title: 'OrderFlow - Online Ordering for Restaurants | Launch in 5 Minutes',
  description: 'Give your restaurant a beautiful online ordering system. No coding required. Set up in minutes, start taking orders today.',
  keywords: ['restaurant ordering', 'online ordering', 'food ordering system', 'restaurant software', 'menu management', 'Stripe payments'],
  icons: {
    icon: '/icon.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'OrderFlow - Online Ordering Made Simple',
    description: 'Give your restaurant a beautiful online ordering system. No coding required.',
    type: 'website',
    images: ['/og-image.png'],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lato.variable} ${openSans.variable}`}>
      <body className={`${openSans.className} antialiased bg-white`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
