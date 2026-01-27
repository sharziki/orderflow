import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Online',
  description: 'Order delicious food online for pickup or delivery',
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
