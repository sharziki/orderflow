'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          maxWidth: '400px',
        },
        // Success
        success: {
          style: {
            background: '#059669',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#059669',
          },
        },
        // Error
        error: {
          style: {
            background: '#dc2626',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#dc2626',
          },
          duration: 5000,
        },
      }}
    />
  )
}
