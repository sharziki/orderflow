'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Rocket,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Store,
  Utensils,
  PartyPopper
} from 'lucide-react'

interface LaunchStatus {
  hasMenuItems: boolean
  menuItemCount: number
  stripeConnected: boolean
  stripeOnboardingComplete: boolean
  doordashConfigured: boolean
  storeSlug: string
  storeName: string
  isLive: boolean
}

export default function GoLivePage() {
  const router = useRouter()
  const [status, setStatus] = useState<LaunchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [savingDoordash, setSavingDoordash] = useState(false)
  const [showDoorDashKeys, setShowDoorDashKeys] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)
  
  const [doordashKeys, setDoordashKeys] = useState({
    developerId: '',
    keyId: '',
    signingSecret: '',
  })

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      // Get launch status from API
      const res = await fetch('/api/dashboard/launch-status')
      if (!res.ok) throw new Error('Failed to load status')
      const data = await res.json()
      setStatus(data)
      setLaunched(data.isLive)
    } catch (err) {
      console.error('Error loading status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start Stripe setup')
      }
    } catch (err) {
      console.error('Error connecting Stripe:', err)
      alert('Failed to connect Stripe')
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleSaveDoordash = async () => {
    if (!doordashKeys.developerId || !doordashKeys.keyId || !doordashKeys.signingSecret) {
      alert('Please fill in all DoorDash fields')
      return
    }

    setSavingDoordash(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doordashDeveloperId: doordashKeys.developerId,
          doordashKeyId: doordashKeys.keyId,
          doordashSigningSecret: doordashKeys.signingSecret,
          deliveryEnabled: true,
        })
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      await loadStatus()
      setDoordashKeys({ developerId: '', keyId: '', signingSecret: '' })
    } catch (err) {
      console.error('Error saving DoorDash:', err)
      alert('Failed to save DoorDash settings')
    } finally {
      setSavingDoordash(false)
    }
  }

  const handleLaunch = async () => {
    if (!status?.stripeOnboardingComplete) {
      alert('Please connect Stripe first')
      return
    }
    if (!status?.hasMenuItems) {
      alert('Please add at least one menu item')
      return
    }

    setLaunching(true)
    try {
      const res = await fetch('/api/dashboard/launch', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to launch')
      
      setLaunched(true)
      await loadStatus()
    } catch (err) {
      console.error('Error launching:', err)
      alert('Failed to launch store')
    } finally {
      setLaunching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (launched && status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <PartyPopper className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            You're Live! 🎉
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Your store is now accepting orders
          </p>
          
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <p className="text-sm text-slate-500 mb-2">Your store URL</p>
            <a 
              href={`/store/${status.storeSlug}`}
              target="_blank"
              className="text-2xl font-semibold text-blue-600 hover:underline flex items-center justify-center gap-2"
            >
              orderflow.io/store/{status.storeSlug}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <a href={`/store/${status.storeSlug}`} target="_blank">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Store className="w-4 h-4" />
                View My Store
              </Button>
            </a>
          </div>
        </div>
      </div>
    )
  }

  const canLaunch = status?.stripeOnboardingComplete && status?.hasMenuItems

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Go Live</h1>
              <p className="text-sm text-slate-500">Complete these steps to launch your store</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Step 1: Menu Items */}
        <Card className={status?.hasMenuItems ? 'border-green-200 bg-green-50/50' : ''}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status?.hasMenuItems ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {status?.hasMenuItems ? <CheckCircle className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle className="text-lg">Menu Items</CardTitle>
                  <CardDescription>Add items to your menu</CardDescription>
                </div>
              </div>
              {status?.hasMenuItems ? (
                <span className="text-sm text-green-600 font-medium">
                  {status.menuItemCount} items ✓
                </span>
              ) : (
                <Link href="/dashboard/menu">
                  <Button size="sm" className="gap-2">
                    Add Items
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Step 2: Stripe Connect */}
        <Card className={status?.stripeOnboardingComplete ? 'border-green-200 bg-green-50/50' : ''}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status?.stripeOnboardingComplete ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {status?.stripeOnboardingComplete ? <CheckCircle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle className="text-lg">Accept Payments</CardTitle>
                  <CardDescription>Connect your Stripe account to receive payments</CardDescription>
                </div>
              </div>
              {status?.stripeOnboardingComplete ? (
                <span className="text-sm text-green-600 font-medium">Connected ✓</span>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="gap-2"
                >
                  {connectingStripe ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Connect Stripe
                </Button>
              )}
            </div>
          </CardHeader>
          {!status?.stripeOnboardingComplete && (
            <CardContent className="pt-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Click "Connect Stripe" to securely link your account</li>
                  <li>Payments go directly to your bank</li>
                  <li>A small platform fee ($1) is deducted per order</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Step 3: DoorDash (Optional) */}
        <Card className={status?.doordashConfigured ? 'border-green-200 bg-green-50/50' : ''}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status?.doordashConfigured ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {status?.doordashConfigured ? <CheckCircle className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Delivery (Optional)
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Optional</span>
                  </CardTitle>
                  <CardDescription>Enable delivery with DoorDash Drive</CardDescription>
                </div>
              </div>
              {status?.doordashConfigured && (
                <span className="text-sm text-green-600 font-medium">Configured ✓</span>
              )}
            </div>
          </CardHeader>
          {!status?.doordashConfigured && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-slate-600">
                Skip this if you only want pickup orders. You can enable delivery later.
              </p>
              
              <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">DoorDash Drive API Keys</span>
                  <a 
                    href="https://developer.doordash.com" 
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Get keys <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="grid gap-3">
                  <div>
                    <Label className="text-sm">Developer ID</Label>
                    <Input
                      value={doordashKeys.developerId}
                      onChange={(e) => setDoordashKeys({ ...doordashKeys, developerId: e.target.value })}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Key ID</Label>
                    <Input
                      value={doordashKeys.keyId}
                      onChange={(e) => setDoordashKeys({ ...doordashKeys, keyId: e.target.value })}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Signing Secret</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showDoorDashKeys ? 'text' : 'password'}
                        value={doordashKeys.signingSecret}
                        onChange={(e) => setDoordashKeys({ ...doordashKeys, signingSecret: e.target.value })}
                        placeholder="Your signing secret"
                        className="font-mono text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDoorDashKeys(!showDoorDashKeys)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showDoorDashKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveDoordash} 
                  disabled={savingDoordash || !doordashKeys.developerId}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {savingDoordash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  Enable Delivery
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Launch Button */}
        <div className="pt-4">
          <Button
            size="lg"
            className="w-full gap-2 h-14 text-lg"
            disabled={!canLaunch || launching}
            onClick={handleLaunch}
          >
            {launching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Launch My Store
              </>
            )}
          </Button>
          
          {!canLaunch && (
            <p className="text-sm text-center text-slate-500 mt-3">
              {!status?.hasMenuItems && "Add menu items to continue • "}
              {!status?.stripeOnboardingComplete && "Connect Stripe to accept payments"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
