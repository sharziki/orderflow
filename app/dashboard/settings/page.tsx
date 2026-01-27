'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  CreditCard,
  Truck,
  Store,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react'

const DEFAULT_HOURS = {
  monday: { open: '11:00', close: '21:00', closed: false },
  tuesday: { open: '11:00', close: '21:00', closed: false },
  wednesday: { open: '11:00', close: '21:00', closed: false },
  thursday: { open: '11:00', close: '21:00', closed: false },
  friday: { open: '11:00', close: '22:00', closed: false },
  saturday: { open: '11:00', close: '22:00', closed: false },
  sunday: { open: '12:00', close: '20:00', closed: false },
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showDoorDashKey, setShowDoorDashKey] = useState(false)
  
  const [settings, setSettings] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    hours: DEFAULT_HOURS,
    stripeConfigured: false,
    doordashDeveloperId: '',
    doordashKeyId: '',
    doordashSigningSecret: '',
    doordashConfigured: false,
    pickupInstructions: '',
    pickupEnabled: true,
    deliveryEnabled: false,
    scheduledOrdersEnabled: true,
    taxRate: 0,
    deliveryFee: 0,
    minOrderAmount: 0,
  })

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Failed to load settings')
        const data = await res.json()
        
        setSettings(prev => ({
          ...prev,
          name: data.settings.name || '',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          address: data.settings.address || '',
          city: data.settings.city || '',
          state: data.settings.state || '',
          zip: data.settings.zip || '',
          hours: data.settings.businessHours || DEFAULT_HOURS,
          stripeConfigured: data.settings.stripeConfigured,
          doordashDeveloperId: data.settings.doordashDeveloperId || '',
          doordashKeyId: data.settings.doordashKeyId || '',
          doordashConfigured: data.settings.doordashConfigured,
          pickupInstructions: data.settings.pickupInstructions || '',
          pickupEnabled: data.settings.pickupEnabled,
          deliveryEnabled: data.settings.deliveryEnabled,
          scheduledOrdersEnabled: data.settings.scheduledOrdersEnabled,
          taxRate: data.settings.taxRate || 0,
          deliveryFee: data.settings.deliveryFee || 0,
          minOrderAmount: data.settings.minOrderAmount || 0,
        }))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  const updateSettings = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          phone: settings.phone,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zip: settings.zip,
          businessHours: settings.hours,
          doordashDeveloperId: settings.doordashDeveloperId || undefined,
          doordashKeyId: settings.doordashKeyId || undefined,
          doordashSigningSecret: settings.doordashSigningSecret || undefined,
          pickupInstructions: settings.pickupInstructions,
          pickupEnabled: settings.pickupEnabled,
          deliveryEnabled: settings.deliveryEnabled,
          scheduledOrdersEnabled: settings.scheduledOrdersEnabled,
          taxRate: settings.taxRate,
          deliveryFee: settings.deliveryFee,
          minOrderAmount: settings.minOrderAmount,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }
      
      setSuccess(true)
      // Update configured status
      if (data.settings?.doordashConfigured !== undefined) {
        setSettings(prev => ({ ...prev, doordashConfigured: data.settings.doordashConfigured }))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStripeConnect = async () => {
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start Stripe onboarding')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              {success && (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" /> Saved
                </Badge>
              )}
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
        
        {/* Stripe Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Stripe Payments</CardTitle>
                  <CardDescription>Accept credit card payments</CardDescription>
                </div>
              </div>
              {settings.stripeConfigured ? (
                <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <AlertCircle className="w-3 h-3 mr-1" /> Not connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {settings.stripeConfigured ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                <div>
                  <p className="font-medium text-green-800">Stripe is connected!</p>
                  <p className="text-sm text-green-700">You can accept credit card payments.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleStripeConnect}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Update
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Connect your Stripe account to start accepting payments. We use Stripe Connect 
                  so you maintain full control of your funds.
                </p>
                <Button onClick={handleStripeConnect} className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Connect with Stripe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Restaurant Information</CardTitle>
                <CardDescription>Your business details and pickup address</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input
                  value={settings.name}
                  onChange={(e) => updateSettings('name', e.target.value)}
                  placeholder="Your Restaurant Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => updateSettings('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-slate-900 mb-3">Pickup Address</h4>
              <p className="text-sm text-slate-500 mb-4">
                Used for customer pickups and as the origin for DoorDash deliveries.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input
                    value={settings.address}
                    onChange={(e) => updateSettings('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={settings.city}
                      onChange={(e) => updateSettings('city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={settings.state}
                      onChange={(e) => updateSettings('state', e.target.value)}
                      placeholder="NY"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input
                      value={settings.zip}
                      onChange={(e) => updateSettings('zip', e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DoorDash Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">DoorDash Drive</CardTitle>
                  <CardDescription>Enable delivery with DoorDash drivers</CardDescription>
                </div>
              </div>
              {settings.doordashConfigured ? (
                <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline">Optional</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
              <p className="text-slate-700 mb-3">
                DoorDash Drive lets you offer delivery using DoorDash's driver network. 
                Apply for access at the DoorDash Developer Portal.
              </p>
              <a 
                href="https://developer.doordash.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
              >
                DoorDash Developer Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Developer ID</Label>
                <Input
                  value={settings.doordashDeveloperId}
                  onChange={(e) => updateSettings('doordashDeveloperId', e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key ID</Label>
                  <Input
                    value={settings.doordashKeyId}
                    onChange={(e) => updateSettings('doordashKeyId', e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Signing Secret</Label>
                  <div className="relative">
                    <Input
                      type={showDoorDashKey ? 'text' : 'password'}
                      value={settings.doordashSigningSecret}
                      onChange={(e) => updateSettings('doordashSigningSecret', e.target.value)}
                      placeholder={settings.doordashConfigured ? '••••••••••••' : 'Your signing secret'}
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDoorDashKey(!showDoorDashKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showDoorDashKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">Pickup Instructions for Drivers</h4>
                <Input
                  value={settings.pickupInstructions}
                  onChange={(e) => updateSettings('pickupInstructions', e.target.value)}
                  placeholder="e.g., Enter through side door, orders on counter"
                />
                <p className="text-xs text-slate-500 mt-1">
                  These instructions help DoorDash drivers find and pick up orders.
                </p>
              </div>
              
              {/* Enable Delivery Toggle */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">Enable Delivery</h4>
                  <p className="text-sm text-slate-500">Allow customers to order delivery</p>
                </div>
                <Switch
                  checked={settings.deliveryEnabled}
                  onCheckedChange={(checked) => updateSettings('deliveryEnabled', checked)}
                  disabled={!settings.doordashConfigured && !settings.doordashDeveloperId}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Business Hours</CardTitle>
                <CardDescription>Set when you're open for orders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {days.map(day => {
                const dayHours = settings.hours[day as keyof typeof settings.hours] || { open: '11:00', close: '21:00', closed: false }
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-28">
                      <span className="font-medium text-slate-700 capitalize">{day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!dayHours.closed}
                        onCheckedChange={(checked) => {
                          const newHours = { ...settings.hours }
                          newHours[day as keyof typeof settings.hours] = { ...dayHours, closed: !checked }
                          updateSettings('hours', newHours)
                        }}
                      />
                      <span className="text-sm text-slate-500 w-12">{dayHours.closed ? 'Closed' : 'Open'}</span>
                    </div>
                    {!dayHours.closed && (
                      <>
                        <Input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => {
                            const newHours = { ...settings.hours }
                            newHours[day as keyof typeof settings.hours] = { ...dayHours, open: e.target.value }
                            updateSettings('hours', newHours)
                          }}
                          className="w-32"
                        />
                        <span className="text-slate-400">to</span>
                        <Input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => {
                            const newHours = { ...settings.hours }
                            newHours[day as keyof typeof settings.hours] = { ...dayHours, close: e.target.value }
                            updateSettings('hours', newHours)
                          }}
                          className="w-32"
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fees & Order Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Fees & Order Settings</CardTitle>
                <CardDescription>Configure tax, fees, and order options</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => updateSettings('taxRate', parseFloat(e.target.value) || 0)}
                  placeholder="9.25"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Fee ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.deliveryFee}
                  onChange={(e) => updateSettings('deliveryFee', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Order ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.minOrderAmount}
                  onChange={(e) => updateSettings('minOrderAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-slate-900">Order Options</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700">Pickup Orders</p>
                  <p className="text-sm text-slate-500">Allow customers to pick up orders</p>
                </div>
                <Switch
                  checked={settings.pickupEnabled}
                  onCheckedChange={(checked) => updateSettings('pickupEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700">Scheduled Orders</p>
                  <p className="text-sm text-slate-500">Allow customers to schedule orders in advance</p>
                </div>
                <Switch
                  checked={settings.scheduledOrdersEnabled}
                  onCheckedChange={(checked) => updateSettings('scheduledOrdersEnabled', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
