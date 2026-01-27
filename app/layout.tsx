import type { Metadata } from 'next'
import { Lato, Open_Sans } from 'next/font/google'
import './globals.css'

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://blubentonville.com'),
  title: 'Blu Fish House - Fresh Seafood & Sushi | Bentonville, AR',
  description: 'Order fresh seafood, premium sushi, and coastal cuisine online for pickup or delivery. The closest thing to eating by the ocean in Arkansas.',
  keywords: ['seafood', 'sushi', 'fresh fish', 'Bentonville', 'Arkansas', 'restaurant', 'food delivery'],
  icons: {
    icon: '/bluefishlogo.png',
    apple: '/bluefishlogo.png',
  },
  openGraph: {
    title: 'Blu Fish House - Fresh Seafood & Sushi',
    description: 'The closest thing to eating by the ocean in Arkansas',
    type: 'website',
    images: ['/bluefishlogo.png'],
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
        {children}
      </body>
    </html>
  )
}
