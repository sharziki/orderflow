'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  Upload,
  MapPin,
  Phone,
  Clock,
  Palette,
  Layout,
  Store,
  ExternalLink,
  Check
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  logo: string | null
  template: string
  menuLayout: string
  primaryColor: string
  secondaryColor: string
  businessHours: any
  taxRate: number
  deliveryEnabled: boolean
  deliveryFee: number
  minOrderAmount: number
}

const LAYOUTS = [
  { id: 'sidebar', name: 'Sidebar', description: 'Left sidebar with categories, like Blu Bentonville' },
  { id: 'modern', name: 'Modern', description: 'Centered layout with sticky nav' },
  { id: 'wide', name: 'Wide', description: 'Full-width with desktop cart sidebar' },
  { id: 'slice', name: 'Slice', description: 'Pizza-shop style cards' },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState('store')
  
  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [menuLayout, setMenuLayout] = useState('sidebar')
  const [taxRate, setTaxRate] = useState(0)
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [minOrderAmount, setMinOrderAmount] = useState(0)
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      const t = data.tenant
      setTenant(t)
      
      // Populate form
      setName(t.name || '')
      setPhone(t.phone || '')
      setAddress(t.address || '')
      setCity(t.city || '')
      setState(t.state || '')
      setZip(t.zip || '')
      setLogo(t.logo)
      setPrimaryColor(t.primaryColor || '#2563eb')
      setMenuLayout(t.menuLayout || 'sidebar')
      setTaxRate(t.taxRate || 0)
      setDeliveryEnabled(t.deliveryEnabled || false)
      setDeliveryFee(t.deliveryFee || 0)
      setMinOrderAmount(t.minOrderAmount || 0)
      
      // Business hours
      const hours = t.businessHours || {}
      const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {}
      DAYS.forEach(day => {
        defaultHours[day] = hours[day] || { open: '09:00', close: '21:00', closed: false }
      })
      setBusinessHours(defaultHours)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          address,
          city,
          state,
          zip,
          logo,
          primaryColor,
          menuLayout,
          taxRate,
          deliveryEnabled,
          deliveryFee,
          minOrderAmount,
          businessHours,
        })
      })
      
      if (res.ok) {
        alert('Settings saved!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setLogo(data.url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                OrderFlow
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Dashboard
                </Link>
                <Link href="/dashboard/menu" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Menu
                </Link>
                <Link href="/dashboard/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  Orders
                </Link>
                <Link href="/dashboard/settings" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  Settings
                </Link>
              </nav>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {[
            { id: 'store', label: 'Store Info', icon: Store },
            { id: 'hours', label: 'Hours', icon: Clock },
            { id: 'layout', label: 'Layout', icon: Layout },
            { id: 'orders', label: 'Orders & Fees', icon: Phone },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Store Info Tab */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            {/* Logo */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
              <div className="flex items-center gap-6">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-24 h-24 rounded-xl object-cover" />
                ) : (
                  <div 
                    className="w-24 h-24 rounded-xl flex items-center justify-center text-white text-3xl font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {name.charAt(0)}
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG or JPG, max 2MB</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Color */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Color</h2>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg font-mono"
                />
                <div 
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Preview
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h2>
            <div className="space-y-4">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-28 font-medium text-gray-900 capitalize">{day}</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!businessHours[day]?.closed}
                      onChange={e => updateHours(day, 'closed', !e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Open</span>
                  </label>
                  {!businessHours[day]?.closed && (
                    <>
                      <input
                        type="time"
                        value={businessHours[day]?.open || '09:00'}
                        onChange={e => updateHours(day, 'open', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={businessHours[day]?.close || '21:00'}
                        onChange={e => updateHours(day, 'close', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </>
                  )}
                  {businessHours[day]?.closed && (
                    <span className="text-gray-500 text-sm">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Layout</h2>
            <p className="text-gray-600 mb-6">Choose how your menu appears to customers</p>
            <div className="grid grid-cols-2 gap-4">
              {LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setMenuLayout(layout.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    menuLayout === layout.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{layout.name}</span>
                    {menuLayout === layout.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{layout.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Link 
                href={`/store/${tenant?.slug}`}
                target="_blank"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Preview your store with this layout
              </Link>
            </div>
          </div>
        )}

        {/* Orders & Fees Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & Fees</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={e => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={e => setDeliveryEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">Enable Delivery</span>
                </label>
                {deliveryEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryFee}
                      onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
