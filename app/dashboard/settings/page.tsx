'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [showStripeKey, setShowStripeKey] = useState(false)
  const [showDoorDashKey, setShowDoorDashKey] = useState(false)
  
  const [settings, setSettings] = useState({
    // Restaurant Info
    name: 'Demo Restaurant',
    phone: '(555) 123-4567',
    email: 'owner@restaurant.com',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    
    // Hours
    hours: {
      monday: { open: '11:00', close: '21:00', closed: false },
      tuesday: { open: '11:00', close: '21:00', closed: false },
      wednesday: { open: '11:00', close: '21:00', closed: false },
      thursday: { open: '11:00', close: '21:00', closed: false },
      friday: { open: '11:00', close: '22:00', closed: false },
      saturday: { open: '11:00', close: '22:00', closed: false },
      sunday: { open: '12:00', close: '20:00', closed: false },
    },
    
    // Stripe
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeConnected: false,
    
    // DoorDash
    doordashDeveloperId: '',
    doordashKeyId: '',
    doordashSigningSecret: '',
    doordashConnected: false,
    pickupInstructions: '',
    
    // Features
    pickupEnabled: true,
    deliveryEnabled: false,
    scheduledOrdersEnabled: true,
    
    // Fees
    taxRate: 9.25,
    deliveryFee: 0,
    minOrderAmount: 0,
  })

  const updateSettings = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save to API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

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
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
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
              {settings.stripeSecretKey ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" /> Not configured
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800 mb-2">
                <strong>Don't have a Stripe account?</strong>
              </p>
              <p className="text-blue-700 mb-3">
                Create one for free at stripe.com. You'll need your API keys from the Stripe Dashboard.
              </p>
              <a 
                href="https://dashboard.stripe.com/apikeys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                Get your Stripe API keys <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Publishable Key</Label>
                <Input
                  value={settings.stripePublishableKey}
                  onChange={(e) => updateSettings('stripePublishableKey', e.target.value)}
                  placeholder="pk_live_..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showStripeKey ? 'text' : 'password'}
                    value={settings.stripeSecretKey}
                    onChange={(e) => updateSettings('stripeSecretKey', e.target.value)}
                    placeholder="sk_live_..."
                    className="font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeKey(!showStripeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showStripeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Info & Address */}
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
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => updateSettings('email', e.target.value)}
                placeholder="contact@restaurant.com"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-slate-900 mb-3">Pickup Address</h4>
              <p className="text-sm text-slate-500 mb-4">
                This address is used for customer pickups and as the origin for DoorDash deliveries.
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
              {settings.doordashSigningSecret ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-slate-400">
                  Optional
                </span>
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
                      placeholder="Your signing secret"
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
                  value={settings.pickupInstructions || ''}
                  onChange={(e) => updateSettings('pickupInstructions', e.target.value)}
                  placeholder="e.g., Enter through side door, orders on counter"
                />
                <p className="text-xs text-slate-500 mt-1">
                  These instructions help DoorDash drivers find and pick up orders.
                </p>
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
            <div className="space-y-3">
              {days.map(day => {
                const dayHours = settings.hours[day as keyof typeof settings.hours]
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-28">
                      <span className="font-medium text-slate-700 capitalize">{day}</span>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!dayHours.closed}
                        onChange={(e) => {
                          const newHours = { ...settings.hours }
                          newHours[day as keyof typeof settings.hours].closed = !e.target.checked
                          updateSettings('hours', newHours)
                        }}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-slate-500">Open</span>
                    </label>
                    {!dayHours.closed && (
                      <>
                        <Input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => {
                            const newHours = { ...settings.hours }
                            newHours[day as keyof typeof settings.hours].open = e.target.value
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
                            newHours[day as keyof typeof settings.hours].close = e.target.value
                            updateSettings('hours', newHours)
                          }}
                          className="w-32"
                        />
                      </>
                    )}
                    {dayHours.closed && (
                      <span className="text-slate-400 text-sm">Closed</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fees & Minimums */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Fees & Minimums</CardTitle>
                <CardDescription>Configure tax and order settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
