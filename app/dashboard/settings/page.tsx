'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Save,
  Store,
  Clock,
  Bell,
  CreditCard,
  Trash2,
  Pause,
  ExternalLink,
  Loader2,
  Check,
  AlertTriangle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

interface Hours {
  [day: string]: { open: string; close: string; closed: boolean }
}

interface Settings {
  name: string
  slug: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  taxRate: number
  primaryColor: string
  businessHours: Hours
  stripeOnboardingComplete: boolean
  isActive: boolean
  // Notifications
  emailNotifications: boolean
  smsNotifications: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (err) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (res.ok) {
        toast.success('Settings saved!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePauseStore = async () => {
    if (!settings) return
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, isActive: !settings.isActive })
      })
      
      if (res.ok) {
        setSettings({ ...settings, isActive: !settings.isActive })
        toast.success(settings.isActive ? 'Store paused' : 'Store is now live!')
      }
    } catch (err) {
      toast.error('Failed to update store status')
    }
  }

  const handleDeleteStore = async () => {
    if (deleteInput !== settings?.name) {
      toast.error('Please type the store name correctly')
      return
    }

    try {
      const res = await fetch('/api/settings', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Store deleted. Redirecting...')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    } catch (err) {
      toast.error('Failed to delete store')
    }
  }

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      businessHours: {
        ...settings.businessHours,
        [day]: {
          ...settings.businessHours[day],
          [field]: value
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              Store Information
            </CardTitle>
            <CardDescription>Basic details about your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Restaurant Name</Label>
                <Input
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Store URL</Label>
                <div className="flex mt-1">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-md text-slate-500 text-sm">
                    orderflow.co/store/
                  </span>
                  <Input
                    value={settings.slug}
                    onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  maxLength={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={settings.zip}
                  onChange={(e) => setSettings({ ...settings, zip: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.taxRate * 100}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) / 100 || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Brand Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Business Hours
            </CardTitle>
            <CardDescription>When is your restaurant open?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const hours = settings.businessHours?.[day] || { open: '11:00', close: '21:00', closed: false }
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-12 font-medium text-slate-700">{DAY_LABELS[day]}</div>
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => updateHours(day, 'closed', !checked)}
                    />
                    {!hours.closed ? (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateHours(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-slate-400">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateHours(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm">Closed</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Notifications
            </CardTitle>
            <CardDescription>How do you want to be notified about new orders?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Email notifications</p>
                <p className="text-sm text-slate-500">Receive an email for each new order</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">SMS notifications</p>
                <p className="text-sm text-slate-500">Get a text message for new orders</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payments
            </CardTitle>
            <CardDescription>Manage your Stripe connection</CardDescription>
          </CardHeader>
          <CardContent>
            {settings.stripeOnboardingComplete ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Stripe connected</p>
                    <p className="text-sm text-slate-500">You're ready to accept payments</p>
                  </div>
                </div>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Stripe Dashboard <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Stripe not connected</p>
                    <p className="text-sm text-slate-500">Connect Stripe to accept payments</p>
                  </div>
                </div>
                <Link href="/dashboard/go-live">
                  <Button>Connect Stripe</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pause Store */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">
                  {settings.isActive ? 'Pause Store' : 'Resume Store'}
                </p>
                <p className="text-sm text-slate-500">
                  {settings.isActive 
                    ? 'Temporarily stop accepting orders' 
                    : 'Your store is currently paused'}
                </p>
              </div>
              <Button 
                variant={settings.isActive ? 'outline' : 'default'}
                onClick={handlePauseStore}
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                {settings.isActive ? 'Pause' : 'Resume'}
              </Button>
            </div>

            {/* Delete Store */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Delete Store</p>
                <p className="text-sm text-red-700">Permanently delete your store and all data</p>
              </div>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Store</CardTitle>
              <CardDescription>
                This action cannot be undone. All your data will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type "{settings.name}" to confirm</Label>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={settings.name}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteInput('')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDeleteStore}
                  disabled={deleteInput !== settings.name}
                >
                  Delete Forever
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
