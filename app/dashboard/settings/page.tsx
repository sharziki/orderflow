'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Save,
  Upload,
  Check,
  ExternalLink,
  AlertTriangle,
  Pause,
  Trash2,
  RefreshCw,
  Loader2,
  Truck
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
  pickupEnabled: boolean
  scheduledOrdersEnabled: boolean
  giftCardsEnabled: boolean
  loyaltyEnabled: boolean
  isActive: boolean
  stripeOnboardingComplete: boolean
  platformFeePercent: number
  // DoorDash configuration
  doordashDeveloperId: string | null
  doordashKeyId: string | null
  doordashSigningSecret: string | null
}

const LAYOUTS = [
  { id: 'sidebar', name: 'Sidebar', description: 'Left sidebar with categories' },
  { id: 'modern', name: 'Modern', description: 'Centered narrow layout' },
  { id: 'wide', name: 'Wide', description: 'Full-width with cart sidebar' },
  { id: 'slice', name: 'Slice', description: 'Pizza-shop card style' },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState('store')
  const [previewKey, setPreviewKey] = useState(0)
  
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
  const [pickupEnabled, setPickupEnabled] = useState(true)
  const [scheduledOrdersEnabled, setScheduledOrdersEnabled] = useState(true)
  const [giftCardsEnabled, setGiftCardsEnabled] = useState(false)
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({})
  const [gaId, setGaId] = useState('')
  const [fbPixelId, setFbPixelId] = useState('')

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
      setPickupEnabled(t.pickupEnabled !== false)
      setScheduledOrdersEnabled(t.scheduledOrdersEnabled !== false)
      setGiftCardsEnabled(t.giftCardsEnabled || false)
      setLoyaltyEnabled(t.loyaltyEnabled || false)
      setIsActive(t.isActive !== false)
      
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
          pickupEnabled,
          scheduledOrdersEnabled,
          giftCardsEnabled,
          loyaltyEnabled,
          isActive,
          businessHours,
        })
      })
      
      if (res.ok) {
        setPreviewKey(k => k + 1) // Refresh preview
        alert('Settings saved!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const [uploading, setUploading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use JPEG, PNG, WebP, or GIF.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'logo')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }
      
      setLogo(data.url)
      
      if (data.storage === 'placeholder') {
        toast('Logo uploaded (placeholder mode)\nConfigure S3 or Supabase for production', {
          icon: '⚠️',
          duration: 5000,
        })
      } else {
        toast.success('Logo uploaded!')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handlePauseStore = async () => {
    if (!confirm('This will temporarily disable ordering. Continue?')) return
    setIsActive(false)
    await handleSave()
  }

  const handleDeleteStore = async () => {
    const confirmText = prompt('Type "DELETE" to permanently delete this store:')
    if (confirmText !== 'DELETE') return
    
    try {
      const res = await fetch('/api/tenants', { method: 'DELETE' })
      if (res.ok) {
        router.push('/login')
      }
    } catch (error) {
      alert('Failed to delete store')
    }
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
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">OrderFlow</Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Dashboard</Link>
                <Link href="/dashboard/menu" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Menu</Link>
                <Link href="/dashboard/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Orders</Link>
                <Link href="/dashboard/settings" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Settings</Link>
              </nav>
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {['store', 'hours', 'layout', 'fees', 'features', 'integrations', 'danger'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'danger' ? '⚠️ Danger' : tab}
            </button>
          ))}
        </div>

        {/* Store Info Tab */}
        {activeTab === 'store' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Logo */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Logo</h2>
                <div className="flex items-center gap-6">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: primaryColor }}>
                      {name.charAt(0)}
                    </div>
                  )}
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    uploading 
                      ? 'bg-gray-200 text-gray-500 cursor-wait' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp,image/gif" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      disabled={uploading}
                    />
                  </label>
                  {logo && (
                    <button 
                      onClick={() => setLogo(null)} 
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="px-4 py-2 border rounded-lg" />
                    <input type="text" placeholder="State" value={state} onChange={e => setState(e.target.value)} className="px-4 py-2 border rounded-lg" />
                    <input type="text" placeholder="ZIP" value={zip} onChange={e => setZip(e.target.value)} className="px-4 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Brand Color */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Brand Color</h2>
                <div className="flex items-center gap-4">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                  <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-28 px-3 py-2 border rounded-lg font-mono text-sm" />
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>Preview</div>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Live Preview</h2>
                <button onClick={() => setPreviewKey(k => k + 1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
              <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '500px' }}>
                <iframe
                  key={previewKey}
                  src={`/store/${tenant?.slug}?preview=1`}
                  className="w-full h-full"
                  title="Store Preview"
                />
              </div>
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Business Hours</h2>
            <div className="space-y-3">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="w-24 font-medium capitalize">{day}</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!businessHours[day]?.closed} onChange={e => updateHours(day, 'closed', !e.target.checked)} className="rounded text-blue-600" />
                    <span className="text-sm">Open</span>
                  </label>
                  {!businessHours[day]?.closed && (
                    <>
                      <input type="time" value={businessHours[day]?.open || '09:00'} onChange={e => updateHours(day, 'open', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                      <span>to</span>
                      <input type="time" value={businessHours[day]?.close || '21:00'} onChange={e => updateHours(day, 'close', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                    </>
                  )}
                  {businessHours[day]?.closed && <span className="text-gray-400 text-sm">Closed</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Choose Layout</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {LAYOUTS.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => { setMenuLayout(layout.id); setPreviewKey(k => k + 1) }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      menuLayout === layout.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Mini layout icon */}
                    <div className="w-full h-16 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 text-xs">
                      {layout.id === 'sidebar' && <div className="flex w-full h-full"><div className="w-1/4 bg-gray-300 rounded-l"></div><div className="w-3/4 p-1"><div className="w-full h-full bg-gray-200 rounded"></div></div></div>}
                      {layout.id === 'modern' && <div className="w-1/2 h-full bg-gray-300 rounded"></div>}
                      {layout.id === 'wide' && <div className="flex w-full h-full"><div className="w-3/4 p-1"><div className="w-full h-full bg-gray-300 rounded"></div></div><div className="w-1/4 bg-gray-200 rounded-r"></div></div>}
                      {layout.id === 'slice' && <div className="grid grid-cols-2 gap-1 p-1 w-full h-full"><div className="bg-gray-300 rounded"></div><div className="bg-gray-300 rounded"></div><div className="bg-gray-300 rounded"></div><div className="bg-gray-300 rounded"></div></div>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{layout.name}</span>
                      {menuLayout === layout.id && <Check className="w-5 h-5 text-blue-600" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{layout.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Side-by-side preview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Preview with YOUR store</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Phone Preview */}
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2 text-center">📱 Phone</div>
                  <div className="mx-auto w-[375px] h-[667px] border-8 border-gray-800 rounded-[3rem] overflow-hidden bg-white shadow-xl">
                    <iframe key={`phone-${previewKey}-${menuLayout}`} src={`/store/${tenant?.slug}?layout=${menuLayout}`} className="w-full h-full" title="Phone Preview" />
                  </div>
                </div>
                {/* Desktop Preview */}
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2 text-center">🖥️ Desktop</div>
                  <div className="border rounded-lg overflow-hidden bg-white shadow-lg" style={{ height: '667px' }}>
                    <iframe key={`desktop-${previewKey}-${menuLayout}`} src={`/store/${tenant?.slug}?layout=${menuLayout}`} className="w-full h-full" style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.67%', height: '166.67%' }} title="Desktop Preview" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Fees & Taxes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-32 px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee ($)</label>
                <input type="number" step="0.01" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} className="w-32 px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order for Delivery ($)</label>
                <input type="number" step="0.01" value={minOrderAmount} onChange={e => setMinOrderAmount(parseFloat(e.target.value) || 0)} className="w-32 px-4 py-2 border rounded-lg" />
              </div>
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-500 mb-1">Platform Fee (read-only)</label>
                <div className="text-lg font-semibold text-gray-700">{tenant?.platformFeePercent || 2.9}%</div>
                <p className="text-xs text-gray-400 mt-1">Contact support to discuss enterprise pricing</p>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6 max-w-lg">
            {/* Order Types */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Order Types</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 py-2">
                  <input type="checkbox" checked={pickupEnabled} onChange={e => setPickupEnabled(e.target.checked)} className="rounded text-blue-600 w-5 h-5" />
                  <span className="font-medium">Enable Pickup</span>
                </label>
                
                {/* Delivery with DoorDash status */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={deliveryEnabled} 
                      onChange={e => setDeliveryEnabled(e.target.checked)} 
                      className="rounded text-blue-600 w-5 h-5" 
                    />
                    <span className="font-medium">Enable Delivery</span>
                  </label>
                  
                  {/* DoorDash status indicator */}
                  {deliveryEnabled && (
                    <div className={`mt-3 ml-8 p-3 rounded-lg text-sm ${
                      tenant?.doordashDeveloperId && tenant?.doordashKeyId && tenant?.doordashSigningSecret
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}>
                      {tenant?.doordashDeveloperId && tenant?.doordashKeyId && tenant?.doordashSigningSecret ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="w-4 h-4" />
                          <span>DoorDash is configured — delivery is available to customers</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 text-amber-700 font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            <span>DoorDash not configured</span>
                          </div>
                          <p className="text-amber-600 mt-1">
                            Delivery requires DoorDash Drive integration. Customers won't see delivery option until configured.
                          </p>
                          <Link 
                            href="/dashboard/settings/doordash" 
                            className="inline-flex items-center gap-1 text-amber-800 font-medium mt-2 hover:underline"
                          >
                            Configure DoorDash →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Other Features */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Additional Features</h2>
              <div className="space-y-4">
                {[
                  { id: 'scheduled', label: 'Enable Scheduled Orders', desc: 'Let customers order ahead', value: scheduledOrdersEnabled, setter: setScheduledOrdersEnabled },
                  { id: 'giftcards', label: 'Enable Gift Cards', desc: 'Sell and redeem gift cards', value: giftCardsEnabled, setter: setGiftCardsEnabled },
                  { id: 'loyalty', label: 'Enable Loyalty Program', desc: 'Reward repeat customers', value: loyaltyEnabled, setter: setLoyaltyEnabled },
                ].map(feature => (
                  <label key={feature.id} className="flex items-start gap-3 py-2">
                    <input type="checkbox" checked={feature.value} onChange={e => feature.setter(e.target.checked)} className="rounded text-blue-600 w-5 h-5 mt-0.5" />
                    <div>
                      <span className="font-medium block">{feature.label}</span>
                      <span className="text-sm text-gray-500">{feature.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6 max-w-2xl">
            {/* Stripe */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Stripe Payments</h3>
                  <p className="text-sm text-gray-500">Accept credit card payments</p>
                </div>
                {tenant?.stripeOnboardingComplete ? (
                  <span className="flex items-center gap-2 text-green-600"><Check className="w-5 h-5" /> Connected</span>
                ) : (
                  <Link href="/api/stripe/connect/onboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Connect Stripe</Link>
                )}
              </div>
            </div>

            {/* DoorDash */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">DoorDash Drive</h3>
                    <p className="text-sm text-gray-500">On-demand delivery for your orders</p>
                    {tenant?.doordashDeveloperId && tenant?.doordashKeyId && tenant?.doordashSigningSecret ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600 mt-1">
                        <Check className="w-3.5 h-3.5" /> Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Not configured
                      </span>
                    )}
                  </div>
                </div>
                <Link href="/dashboard/settings/doordash" className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                  {tenant?.doordashDeveloperId ? 'Manage' : 'Set Up'}
                </Link>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold mb-4">Analytics</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                  <input type="text" placeholder="G-XXXXXXXXXX" value={gaId} onChange={e => setGaId(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                  <input type="text" placeholder="123456789" value={fbPixelId} onChange={e => setFbPixelId(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="space-y-6 max-w-lg">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Pause className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Pause Store</h3>
                  <p className="text-sm text-yellow-700 mt-1">Temporarily disable ordering. Customers will see "Closed" but your menu stays intact.</p>
                  <button onClick={handlePauseStore} className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">
                    {isActive ? 'Pause Store' : 'Store is Paused — Click Save to Unpause'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Trash2 className="w-6 h-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-800">Delete Store</h3>
                  <p className="text-sm text-red-700 mt-1">Permanently delete this store and all data. This cannot be undone.</p>
                  <button onClick={handleDeleteStore} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                    Delete Store
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
