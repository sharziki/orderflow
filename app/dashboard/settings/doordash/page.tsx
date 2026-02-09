'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { 
  ArrowLeft, 
  Truck, 
  Save, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react'

export default function DoorDashSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  
  const [developerId, setDeveloperId] = useState('')
  const [keyId, setKeyId] = useState('')
  const [signingSecret, setSigningSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  
  const [isConfigured, setIsConfigured] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to load settings')
      }
      
      const data = await res.json()
      const settings = data.settings
      
      // Only show if configured (we don't send actual secrets back)
      setIsConfigured(settings.doordashConfigured || false)
      
      // If configured, show placeholders
      if (settings.doordashDeveloperId) {
        setDeveloperId(settings.doordashDeveloperId)
      }
      if (settings.doordashKeyId) {
        setKeyId(settings.doordashKeyId)
      }
      // Never show the actual signing secret
    } catch (err) {
      console.error('Error loading settings:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!developerId || !keyId || !signingSecret) {
      toast.error('Please fill in all fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doordashDeveloperId: developerId,
          doordashKeyId: keyId,
          doordashSigningSecret: signingSecret,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      
      setIsConfigured(true)
      toast.success('DoorDash credentials saved!')
    } catch (err: any) {
      console.error('Error saving:', err)
      toast.error(err.message || 'Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      // Test with a sample address
      const res = await fetch('/api/doordash/health')
      const data = await res.json()
      
      if (data.success) {
        setTestResult({ success: true, message: 'Connection successful! DoorDash Drive is ready.' })
        toast.success('DoorDash connection verified!')
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' })
        toast.error('Connection test failed')
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Failed to test connection' })
      toast.error('Test failed')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/settings"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DoorDash Drive</h1>
                <p className="text-sm text-gray-500">Configure on-demand delivery</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 ${isConfigured ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">DoorDash Drive is configured</p>
                  <p className="text-sm text-green-700">Delivery orders will be dispatched to DoorDash</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">DoorDash Drive not configured</p>
                  <p className="text-sm text-amber-700">Enter your credentials to enable delivery</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Getting Your DoorDash Drive Credentials</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">1</span>
              <span>Go to the <a href="https://developer.doordash.com" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline inline-flex items-center gap-1">DoorDash Developer Portal <ExternalLink className="w-3 h-3" /></a></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">2</span>
              <span>Create or sign into your developer account</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
              <span>Navigate to <strong>Credentials</strong> in the sidebar</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">4</span>
              <span>Copy your <strong>Developer ID</strong>, <strong>Key ID</strong>, and <strong>Signing Secret</strong></span>
            </li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> For testing, use sandbox credentials. Switch to production credentials when you're ready to go live.
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">API Credentials</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Developer ID
              </label>
              <input
                type="text"
                value={developerId}
                onChange={e => setDeveloperId(e.target.value)}
                placeholder="e.g., 12345678-1234-1234-1234-123456789abc"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key ID
              </label>
              <input
                type="text"
                value={keyId}
                onChange={e => setKeyId(e.target.value)}
                placeholder="e.g., abcd1234-abcd-1234-abcd-1234567890ab"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signing Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={signingSecret}
                  onChange={e => setSigningSecret(e.target.value)}
                  placeholder={isConfigured ? '••••••••••••••••' : 'Enter your signing secret'}
                  className="w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isConfigured ? 'Enter a new secret to update, or leave blank to keep existing' : 'Required for API authentication'}
              </p>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t">
            {isConfigured && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Test Connection
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || (!signingSecret && !isConfigured)}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Credentials
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? Check the{' '}
            <a 
              href="https://developer.doordash.com/docs/drive/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              DoorDash Drive documentation
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
