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
  Truck,
  Store,
  Clock,
  Palette,
  DollarSign,
  Settings,
  Link2,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  CreditCard,
  Rocket,
  Users,
  FlaskConical,
  Play,
  TestTube,
  Megaphone
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
  doordashDeveloperId: string | null
  doordashKeyId: string | null
  doordashSigningSecret: string | null
  ghlApiKey: string | null
  ghlLocationId: string | null
  ghlConfigured?: boolean
  demoModeEnabled?: boolean
  demoModeCompletedAt?: string | null
  demoOrderCount?: number
}

const LAYOUTS = [
  { id: 'blu-bentonville', name: 'Modern Cards', description: 'Vertical cards with hover effects' },
  { id: 'slice', name: 'Slice', description: 'Horizontal cards, collapsible' },
  { id: 'minimal', name: 'Minimal', description: 'Clean, text-focused' },
  { id: 'grid-compact', name: 'Compact Grid', description: 'Mobile-first grid' },
  { id: 'classic', name: 'Classic', description: 'Elegant traditional' },
  { id: 'dark-mode', name: 'Dark Mode', description: 'Modern dark theme' },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const SECTIONS = [
  { id: 'store', label: 'Store Info', icon: Store, required: true },
  { id: 'hours', label: 'Hours', icon: Clock, required: true },
  { id: 'layout', label: 'Appearance', icon: Palette, required: false },
  { id: 'fees', label: 'Fees & Taxes', icon: DollarSign, required: true },
  { id: 'features', label: 'Features', icon: Settings, required: false },
  { id: 'integrations', label: 'Integrations', icon: Link2, required: true },
  { id: 'demo', label: 'Demo Mode', icon: FlaskConical, required: false },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, required: false },
]

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeSection, setActiveSection] = useState('store')
  const [previewKey, setPreviewKey] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [menuLayout, setMenuLayout] = useState('blu-bentonville')
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
  
  // GHL state
  const [ghlApiKey, setGhlApiKey] = useState('')
  const [ghlLocationId, setGhlLocationId] = useState('')
  const [ghlTesting, setGhlTesting] = useState(false)
  const [showGhlForm, setShowGhlForm] = useState(false)

  // Demo Mode state
  const [demoModeEnabled, setDemoModeEnabled] = useState(false)
  const [demoModeCompletedAt, setDemoModeCompletedAt] = useState<string | null>(null)
  const [demoOrderCount, setDemoOrderCount] = useState(0)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoTestLoading, setDemoTestLoading] = useState(false)
  const [demoTestResult, setDemoTestResult] = useState<any>(null)

  // Fetch demo mode status (defined before useEffect so it's available)
  const fetchDemoModeStatus = async () => {
    try {
      const res = await fetch('/api/settings/demo-mode')
      if (res.ok) {
        const data = await res.json()
        setDemoModeEnabled(data.demoModeEnabled || false)
        setDemoModeCompletedAt(data.demoModeCompletedAt)
        setDemoOrderCount(data.demoOrderCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch demo mode status:', error)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchDemoModeStatus()
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
      
      setName(t.name || '')
      setPhone(t.phone || '')
      setAddress(t.address || '')
      setCity(t.city || '')
      setState(t.state || '')
      setZip(t.zip || '')
      setLogo(t.logo)
      setPrimaryColor(t.primaryColor || '#2563eb')
      setMenuLayout(t.menuLayout || 'blu-bentonville')
      setTaxRate(t.taxRate || 0)
      setDeliveryEnabled(t.deliveryEnabled || false)
      setDeliveryFee(t.deliveryFee || 0)
      setMinOrderAmount(t.minOrderAmount || 0)
      setPickupEnabled(t.pickupEnabled !== false)
      setScheduledOrdersEnabled(t.scheduledOrdersEnabled !== false)
      setGiftCardsEnabled(t.giftCardsEnabled || false)
      setLoyaltyEnabled(t.loyaltyEnabled || false)
      setIsActive(t.isActive !== false)
      
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

  // Toggle demo mode
  const handleToggleDemoMode = async () => {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/settings/demo-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !demoModeEnabled }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setDemoModeEnabled(data.demoModeEnabled)
        setDemoModeCompletedAt(data.demoModeCompletedAt)
        setDemoOrderCount(data.demoOrderCount || 0)
        setDemoTestResult(null)
        toast.success(data.message)
      } else {
        toast.error('Failed to toggle demo mode')
      }
    } catch (error) {
      toast.error('Failed to toggle demo mode')
    } finally {
      setDemoLoading(false)
    }
  }

  // Place demo test order
  const handlePlaceDemoTestOrder = async () => {
    setDemoTestLoading(true)
    setDemoTestResult(null)
    try {
      const res = await fetch('/api/orders/demo-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await res.json()
      setDemoTestResult(data)
      
      if (data.success) {
        setDemoOrderCount(prev => prev + 1)
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to create demo order')
      }
    } catch (error) {
      toast.error('Failed to create demo order')
    } finally {
      setDemoTestLoading(false)
    }
  }

  // Complete demo test and optionally disable
  const handleCompleteDemoTest = async (autoDisable: boolean = false) => {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/settings/demo-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDisable }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setDemoModeEnabled(data.demoModeEnabled)
        setDemoModeCompletedAt(data.demoModeCompletedAt)
        toast.success(data.message)
      } else {
        toast.error('Failed to complete demo test')
      }
    } catch (error) {
      toast.error('Failed to complete demo test')
    } finally {
      setDemoLoading(false)
    }
  }

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!name.trim()) newErrors.name = 'Restaurant name is required'
    if (!phone.trim()) newErrors.phone = 'Phone number is required'
    if (!address.trim()) newErrors.address = 'Address is required'
    if (!city.trim()) newErrors.city = 'City is required'
    if (!state.trim()) newErrors.state = 'State is required'
    if (!zip.trim()) newErrors.zip = 'ZIP code is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if ready to launch
  const getReadinessChecks = () => {
    return [
      { id: 'name', label: 'Restaurant name', passed: !!name.trim() },
      { id: 'phone', label: 'Phone number', passed: !!phone.trim() },
      { id: 'address', label: 'Complete address', passed: !!(address.trim() && city.trim() && state.trim() && zip.trim()) },
      { id: 'hours', label: 'Business hours set', passed: Object.values(businessHours).some(h => !h.closed) },
      { id: 'stripe', label: 'Stripe payments connected', passed: !!tenant?.stripeOnboardingComplete },
      { id: 'orderType', label: 'At least one order type enabled', passed: pickupEnabled || deliveryEnabled },
    ]
  }

  const isReadyToLaunch = () => getReadinessChecks().every(c => c.passed)

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      setActiveSection('store')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, address, city, state, zip, logo, primaryColor, menuLayout,
          taxRate, deliveryEnabled, deliveryFee, minOrderAmount, pickupEnabled,
          scheduledOrdersEnabled, giftCardsEnabled, loyaltyEnabled, isActive, businessHours
        }),
      })

      if (res.ok) {
        toast.success('Settings saved!')
        setPreviewKey(k => k + 1)
        // Refresh tenant data
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const data = await meRes.json()
          setTenant(data.tenant)
        }
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setLogo(data.url)
        toast.success('Logo uploaded!')
      } else {
        toast.error('Failed to upload logo')
      }
    } catch (error) {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const updateHours = (day: string, field: string, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handlePauseStore = () => {
    setIsActive(!isActive)
    toast.success(isActive ? 'Store will be paused after saving' : 'Store will be active after saving')
  }

  const handleDeleteStore = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this store? This action cannot be undone.')
    if (!confirmed) return
    
    const doubleConfirm = window.prompt('Type "DELETE" to confirm:')
    if (doubleConfirm !== 'DELETE') {
      toast.error('Deletion cancelled')
      return
    }

    try {
      const res = await fetch('/api/settings', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Store deleted')
        router.push('/')
      } else {
        toast.error('Failed to delete store')
      }
    } catch (error) {
      toast.error('Failed to delete store')
    }
  }

  const handleTestGHL = async () => {
    if (!ghlApiKey || !ghlLocationId) {
      toast.error('Please enter both API key and Location ID')
      return
    }

    setGhlTesting(true)
    try {
      const res = await fetch('/api/settings/ghl/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: ghlApiKey, locationId: ghlLocationId }),
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success('GHL connection successful!')
      } else {
        toast.error(data.error || 'Connection failed')
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setGhlTesting(false)
    }
  }

  const handleSaveGHL = async () => {
    if (!ghlApiKey || !ghlLocationId) {
      toast.error('Please enter both API key and Location ID')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghlApiKey, ghlLocationId }),
      })

      if (res.ok) {
        toast.success('GHL settings saved!')
        setShowGhlForm(false)
        // Refresh tenant data
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const data = await meRes.json()
          setTenant(data.tenant)
        }
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const getSectionStatus = (sectionId: string) => {
    switch (sectionId) {
      case 'store':
        return !!(name && phone && address && city && state && zip)
      case 'hours':
        return Object.values(businessHours).some(h => !h.closed)
      case 'fees':
        return true // Always valid
      case 'integrations':
        return !!tenant?.stripeOnboardingComplete
      default:
        return true
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const readinessChecks = getReadinessChecks()
  const passedChecks = readinessChecks.filter(c => c.passed).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">OrderFlow</Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-lg font-semibold text-gray-900">Store Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href={`/store/${tenant?.slug}`} 
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ExternalLink className="w-4 h-4" />
                Preview Store
              </Link>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border shadow-sm sticky top-24">
              <nav className="p-2">
                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isComplete = getSectionStatus(section.id)
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${section.id === 'danger' ? 'text-red-500' : ''}`} />
                      <span className="flex-1 font-medium text-sm">{section.label}</span>
                      {section.required && (
                        isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                        )
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Launch Readiness */}
              <div className="border-t p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Launch Ready</span>
                  <span className="text-xs text-gray-500">{passedChecks}/{readinessChecks.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all ${isReadyToLaunch() ? 'bg-green-500' : 'bg-amber-400'}`}
                    style={{ width: `${(passedChecks / readinessChecks.length) * 100}%` }}
                  />
                </div>
                {!isReadyToLaunch() && (
                  <div className="space-y-1.5">
                    {readinessChecks.filter(c => !c.passed).slice(0, 3).map(check => (
                      <div key={check.id} className="flex items-center gap-2 text-xs text-amber-600">
                        <XCircle className="w-3 h-3" />
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isReadyToLaunch() && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Rocket className="w-4 h-4" />
                    <span className="font-medium">Ready to launch!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Store Info Section */}
            {activeSection === 'store' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Store Information</h2>
                  <p className="text-gray-500 mt-1">Basic details about your restaurant</p>
                </div>

                {/* Logo */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Logo</h3>
                  <div className="flex items-center gap-6">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover border" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold border" style={{ backgroundColor: primaryColor }}>
                        {name.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                        uploading ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                      </label>
                      {logo && (
                        <button onClick={() => setLogo(null)} className="ml-3 text-sm text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, max 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Basic Info</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restaurant Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300 bg-red-50' : ''}`}
                        placeholder="e.g. Joe's Pizza"
                      />
                      {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-300 bg-red-50' : ''}`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Address</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={address} 
                        onChange={e => setAddress(e.target.value)} 
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-300 bg-red-50' : ''}`}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={city} 
                          onChange={e => setCity(e.target.value)} 
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-300 bg-red-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={state} 
                          onChange={e => setState(e.target.value)} 
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.state ? 'border-red-300 bg-red-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={zip} 
                          onChange={e => setZip(e.target.value)} 
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.zip ? 'border-red-300 bg-red-50' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hours Section */}
            {activeSection === 'hours' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Business Hours</h2>
                  <p className="text-gray-500 mt-1">Set when customers can place orders</p>
                </div>

                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <div className="space-y-4">
                    {DAYS.map(day => (
                      <div key={day} className="flex items-center gap-4 py-3 border-b last:border-0">
                        <div className="w-28 font-medium capitalize text-gray-900">{day}</div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!businessHours[day]?.closed} 
                            onChange={e => updateHours(day, 'closed', !e.target.checked)} 
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-600">Open</span>
                        </label>
                        {!businessHours[day]?.closed ? (
                          <div className="flex items-center gap-2 ml-4">
                            <input 
                              type="time" 
                              value={businessHours[day]?.open || '09:00'} 
                              onChange={e => updateHours(day, 'open', e.target.value)} 
                              className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                            />
                            <span className="text-gray-400">to</span>
                            <input 
                              type="time" 
                              value={businessHours[day]?.close || '21:00'} 
                              onChange={e => updateHours(day, 'close', e.target.value)} 
                              className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm ml-4">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t flex gap-3">
                    <button 
                      onClick={() => {
                        const newHours = { ...businessHours }
                        DAYS.forEach(day => { newHours[day] = { open: '09:00', close: '21:00', closed: false } })
                        setBusinessHours(newHours)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Set all to 9am-9pm
                    </button>
                    <button 
                      onClick={() => {
                        const newHours = { ...businessHours }
                        DAYS.forEach(day => { newHours[day] = { open: '11:00', close: '22:00', closed: false } })
                        setBusinessHours(newHours)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Set all to 11am-10pm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'layout' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
                  <p className="text-gray-500 mt-1">Customize how your store looks</p>
                </div>

                {/* Brand Color */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Brand Color</h3>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={primaryColor} 
                      onChange={e => setPrimaryColor(e.target.value)} 
                      className="w-14 h-14 rounded-lg cursor-pointer border-2 border-gray-200" 
                    />
                    <div>
                      <input 
                        type="text" 
                        value={primaryColor} 
                        onChange={e => setPrimaryColor(e.target.value)} 
                        className="w-28 px-3 py-2 border rounded-lg font-mono text-sm" 
                      />
                      <p className="text-xs text-gray-500 mt-1">Used for buttons, links, and accents</p>
                    </div>
                    <div className="px-6 py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: primaryColor }}>
                      Preview Button
                    </div>
                  </div>
                </div>

                {/* Menu Layout */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Menu Layout</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <span className="font-medium text-gray-900">{layout.name}</span>
                          {menuLayout === layout.id && <Check className="w-5 h-5 text-blue-600" />}
                        </div>
                        <p className="text-sm text-gray-500">{layout.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Live Preview</h3>
                    <button onClick={() => setPreviewKey(k => k + 1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '500px' }}>
                    <iframe
                      key={previewKey}
                      src={`/store/${tenant?.slug}?layout=${menuLayout}&preview=1`}
                      className="w-full h-full"
                      title="Store Preview"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fees Section */}
            {activeSection === 'fees' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Fees & Taxes</h2>
                  <p className="text-gray-500 mt-1">Configure pricing for your orders</p>
                </div>

                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <div className="grid gap-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="0.01" 
                          value={taxRate} 
                          onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                          className="w-24 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Applied to all orders</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={deliveryFee} 
                          onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} 
                          className="w-24 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Charged on delivery orders</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order (Delivery)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={minOrderAmount} 
                          onChange={e => setMinOrderAmount(parseFloat(e.target.value) || 0)} 
                          className="w-24 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum subtotal for delivery orders</p>
                    </div>

                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Platform Fee</label>
                      <div className="text-xl font-semibold text-gray-700">{tenant?.platformFeePercent || 2.9}%</div>
                      <p className="text-xs text-gray-400 mt-1">Contact support for enterprise pricing</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Section */}
            {activeSection === 'features' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Features</h2>
                  <p className="text-gray-500 mt-1">Enable or disable store features</p>
                </div>

                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Order Types</h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        checked={pickupEnabled} 
                        onChange={e => setPickupEnabled(e.target.checked)} 
                        className="w-5 h-5 rounded text-blue-600 mt-0.5" 
                      />
                      <div>
                        <span className="font-medium text-gray-900">Pickup</span>
                        <p className="text-sm text-gray-500">Customers order ahead and pick up at your location</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        checked={deliveryEnabled} 
                        onChange={e => setDeliveryEnabled(e.target.checked)} 
                        className="w-5 h-5 rounded text-blue-600 mt-0.5" 
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Delivery</span>
                        <p className="text-sm text-gray-500">Deliver orders to customers via DoorDash Drive</p>
                        {deliveryEnabled && !(tenant?.doordashDeveloperId && tenant?.doordashKeyId && tenant?.doordashSigningSecret) && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                              <AlertTriangle className="w-4 h-4" />
                              DoorDash not configured
                            </div>
                            <p className="text-xs text-amber-600 mt-1">Customers won't see delivery until DoorDash is set up.</p>
                            <Link href="#" onClick={() => setActiveSection('integrations')} className="text-xs text-amber-800 font-medium hover:underline">
                              Configure in Integrations →
                            </Link>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">Additional Features</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'scheduled', label: 'Scheduled Orders', desc: 'Let customers order ahead for a specific time', value: scheduledOrdersEnabled, setter: setScheduledOrdersEnabled },
                      { id: 'giftcards', label: 'Gift Cards', desc: 'Sell and redeem digital gift cards', value: giftCardsEnabled, setter: setGiftCardsEnabled },
                      { id: 'loyalty', label: 'Loyalty Program', desc: 'Reward repeat customers with points', value: loyaltyEnabled, setter: setLoyaltyEnabled },
                    ].map(feature => (
                      <label key={feature.id} className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          checked={feature.value} 
                          onChange={e => feature.setter(e.target.checked)} 
                          className="w-5 h-5 rounded text-blue-600 mt-0.5" 
                        />
                        <div>
                          <span className="font-medium text-gray-900">{feature.label}</span>
                          <p className="text-sm text-gray-500">{feature.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Section */}
            {activeSection === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
                  <p className="text-gray-500 mt-1">Connect third-party services</p>
                </div>

                {/* Stripe */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Stripe Payments</h3>
                        <p className="text-sm text-gray-500 mt-1">Accept credit card payments securely</p>
                        {tenant?.stripeOnboardingComplete ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 mt-2">
                            <CheckCircle2 className="w-4 h-4" /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-red-600 mt-2">
                            <XCircle className="w-4 h-4" /> Required to accept payments
                          </span>
                        )}
                      </div>
                    </div>
                    {tenant?.stripeOnboardingComplete ? (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">Active</span>
                    ) : (
                      <Link 
                        href="/api/stripe/connect/onboard" 
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                      >
                        Connect Stripe
                      </Link>
                    )}
                  </div>
                </div>

                {/* DoorDash */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">DoorDash Drive</h3>
                        <p className="text-sm text-gray-500 mt-1">On-demand delivery for your orders</p>
                        {tenant?.doordashDeveloperId && tenant?.doordashKeyId && tenant?.doordashSigningSecret ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 mt-2">
                            <CheckCircle2 className="w-4 h-4" /> Configured
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                            <AlertCircle className="w-4 h-4" /> Optional - for delivery orders
                          </span>
                        )}
                      </div>
                    </div>
                    <Link 
                      href="/dashboard/settings/doordash" 
                      className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      {tenant?.doordashDeveloperId ? 'Manage' : 'Set Up'}
                    </Link>
                  </div>
                </div>

                {/* Go High Level */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Go High Level</h3>
                        <p className="text-sm text-gray-500 mt-1">Sync customers to your GHL CRM after orders</p>
                        {tenant?.ghlConfigured ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 mt-2">
                            <CheckCircle2 className="w-4 h-4" /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                            <AlertCircle className="w-4 h-4" /> Optional - sync orders to CRM
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowGhlForm(!showGhlForm)}
                      className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      {tenant?.ghlConfigured ? 'Manage' : 'Set Up'}
                    </button>
                  </div>

                  {/* GHL Configuration Form */}
                  {showGhlForm && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={ghlApiKey}
                            onChange={e => setGhlApiKey(e.target.value)}
                            placeholder="Enter your GHL API key"
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Find this in GHL Settings → Business Profile → API Key
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location ID
                          </label>
                          <input
                            type="text"
                            value={ghlLocationId}
                            onChange={e => setGhlLocationId(e.target.value)}
                            placeholder="Enter your GHL Location ID"
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Find this in GHL Settings → Business Profile
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={handleTestGHL}
                            disabled={ghlTesting || !ghlApiKey || !ghlLocationId}
                            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                          >
                            {ghlTesting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Test Connection
                          </button>
                          <button
                            onClick={handleSaveGHL}
                            disabled={saving || !ghlApiKey || !ghlLocationId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Settings
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">What gets synced?</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Customer contact info (name, email, phone, address)</li>
                          <li>• Order notes with items, total, and order number</li>
                          <li>• Order count tracking ("Order 3 of 5 total orders")</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Demo Mode Section */}
            {activeSection === 'demo' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Demo Mode</h2>
                  <p className="text-gray-500 mt-1">Test delivery orders without real charges</p>
                </div>

                {/* Demo Mode Status Card */}
                <div className={`rounded-xl p-6 border shadow-sm ${demoModeEnabled ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${demoModeEnabled ? 'bg-amber-100' : 'bg-gray-100'}`}>
                        <FlaskConical className={`w-6 h-6 ${demoModeEnabled ? 'text-amber-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Demo Mode</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {demoModeEnabled 
                            ? 'Demo mode is active. Orders will use sandbox credentials and Stripe test mode.'
                            : 'Enable demo mode to test your delivery integration without real charges.'}
                        </p>
                        {demoModeEnabled && (
                          <div className="flex items-center gap-4 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                              <TestTube className="w-4 h-4" />
                              DEMO ACTIVE
                            </span>
                            <span className="text-sm text-gray-500">
                              {demoOrderCount} test order{demoOrderCount !== 1 ? 's' : ''} placed
                            </span>
                          </div>
                        )}
                        {demoModeCompletedAt && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 mt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Last successful test: {new Date(demoModeCompletedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleDemoMode}
                      disabled={demoLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        demoModeEnabled
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      } disabled:opacity-50`}
                    >
                      {demoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : demoModeEnabled ? (
                        'Disable'
                      ) : (
                        'Enable Demo Mode'
                      )}
                    </button>
                  </div>
                </div>

                {/* What Demo Mode Does */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">What Demo Mode Does</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">DoorDash Sandbox</p>
                        <p className="text-sm text-gray-500">Uses DoorDash sandbox credentials for simulated delivery quotes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CreditCard className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">No Real Charges</p>
                        <p className="text-sm text-gray-500">Orders use Stripe test mode - no real money changes hands</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TestTube className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Test Orders Marked</p>
                        <p className="text-sm text-gray-500">All demo orders are prefixed with "TEST-" and visible on your dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Place Demo Test Order */}
                {demoModeEnabled && (
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-4">
                      <Play className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-800">Place a Test Order</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Create a demo order to test your entire order pipeline including DoorDash delivery quotes.
                        </p>
                        <button
                          onClick={handlePlaceDemoTestOrder}
                          disabled={demoTestLoading}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {demoTestLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating test order...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Place Test Order
                            </>
                          )}
                        </button>
                        
                        {/* Test Result */}
                        {demoTestResult && (
                          <div className={`mt-4 p-4 rounded-lg ${demoTestResult.success ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
                            <div className="flex items-start gap-2">
                              {demoTestResult.success ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              )}
                              <div>
                                <p className={`font-medium ${demoTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                  {demoTestResult.message || demoTestResult.error}
                                </p>
                                {demoTestResult.order && (
                                  <div className="mt-2 text-sm text-green-700">
                                    <p>Order Number: <span className="font-mono">{demoTestResult.order.orderNumber}</span></p>
                                    <p>Total: ${demoTestResult.order.total.toFixed(2)}</p>
                                    {demoTestResult.doordash?.success && (
                                      <p>DoorDash Fee: ${demoTestResult.doordash.quote.fee.toFixed(2)}</p>
                                    )}
                                  </div>
                                )}
                                {demoTestResult.nextSteps && (
                                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                                    {demoTestResult.nextSteps.map((step: string, i: number) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Complete Demo Test */}
                {demoModeEnabled && demoOrderCount > 0 && (
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800">Ready to Go Live?</h3>
                        <p className="text-sm text-green-700 mt-1">
                          If you're satisfied with your testing, you can mark the demo as complete and disable demo mode.
                        </p>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleCompleteDemoTest(true)}
                            disabled={demoLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            Complete & Disable Demo Mode
                          </button>
                          <button
                            onClick={() => handleCompleteDemoTest(false)}
                            disabled={demoLoading}
                            className="px-4 py-2 border border-green-600 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-50"
                          >
                            Mark Complete (Keep Demo On)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info about demo orders */}
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <p className="text-sm text-gray-600">
                    <strong>Note:</strong> Demo orders appear in your Orders dashboard with a "TEST-" prefix. 
                    They don't affect your real order count or revenue statistics.
                  </p>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeSection === 'danger' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
                  <p className="text-gray-500 mt-1">Irreversible actions</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <Pause className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800">Pause Store</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Temporarily stop accepting orders. Your menu stays intact and you can resume anytime.
                      </p>
                      <button 
                        onClick={handlePauseStore} 
                        className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                      >
                        {isActive ? 'Pause Store' : 'Resume Store'}
                      </button>
                      {!isActive && (
                        <p className="text-xs text-amber-600 mt-2">Store is paused. Click Save to apply changes.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <Trash2 className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800">Delete Store</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete this store and all associated data. This cannot be undone.
                      </p>
                      <button 
                        onClick={handleDeleteStore} 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Delete Store
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
