'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Utensils, Loader2, MapPin, Phone, Store, Camera, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'

const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#000000', // Black
]

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimal design',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional restaurant feel',
  },
  {
    id: 'slice',
    name: 'Slice',
    description: 'Pizza shop style',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast, impactful',
  },
]

const DEFAULT_HOURS = {
  monday: { open: '11:00', close: '21:00', closed: false },
  tuesday: { open: '11:00', close: '21:00', closed: false },
  wednesday: { open: '11:00', close: '21:00', closed: false },
  thursday: { open: '11:00', close: '21:00', closed: false },
  friday: { open: '11:00', close: '22:00', closed: false },
  saturday: { open: '11:00', close: '22:00', closed: false },
  sunday: { open: '12:00', close: '20:00', closed: false },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    brandColor: '#2563eb',
    template: 'modern',
    email: '',
    password: '',
  })

  const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo must be less than 5MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.address || !form.email || !form.password) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: form.name,
          slug,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          city: '',
          state: '',
          zip: '',
          primaryColor: form.brandColor,
          secondaryColor: form.brandColor,
          template: form.template,
          businessHours: DEFAULT_HOURS,
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // Upload logo if provided
      if (logoFile) {
        try {
          const formData = new FormData()
          formData.append('file', logoFile)
          formData.append('type', 'logo')
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            await fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo: uploadData.url }),
            })
          }
        } catch (e) {
          console.error('Logo upload failed:', e)
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Failed to create account')
      setLoading(false)
    }
  }

  // Preview Components for different templates
  const ModernPreview = () => (
    <div className="p-4" style={{ minHeight: 480 }}>
      {/* Header */}
      <div 
        className="rounded-xl p-4 text-white mb-4"
        style={{ backgroundColor: form.brandColor }}
      >
        <div className="flex items-center gap-3">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
              {form.name ? form.name.charAt(0).toUpperCase() : 'R'}
            </div>
          )}
          <div>
            <h3 className="font-bold">{form.name || "Your Restaurant"}</h3>
            <p className="text-white/70 text-xs">Open until 10pm</p>
          </div>
        </div>
      </div>

      {/* Order type */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-white border-2 rounded-lg p-3 text-center" style={{ borderColor: form.brandColor }}>
          <p className="font-semibold text-slate-900">Pickup</p>
          <p className="text-xs text-slate-500">15 min</p>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <p className="font-semibold text-slate-400">Delivery</p>
          <p className="text-xs text-slate-400">30-45 min</p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-4">
        {['Appetizers', 'Mains', 'Drinks'].map((cat, i) => (
          <div 
            key={cat}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              i === 0 ? 'text-white' : 'bg-slate-100 text-slate-600'
            }`}
            style={i === 0 ? { backgroundColor: form.brandColor } : {}}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {[
          { name: 'Garlic Bread', price: '$6.99' },
          { name: 'Caesar Salad', price: '$12.99' },
        ].map((item) => (
          <div key={item.name} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-slate-900 text-sm">{item.name}</p>
              <p className="text-xs text-slate-500">Delicious description</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm" style={{ color: form.brandColor }}>{item.price}</p>
              <button 
                className="text-xs text-white px-2 py-1 rounded mt-1"
                style={{ backgroundColor: form.brandColor }}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const SlicePreview = () => (
    <div style={{ minHeight: 480 }}>
      {/* Hero banner */}
      <div 
        className="h-32 flex items-end p-4"
        style={{ backgroundColor: form.brandColor }}
      >
        <div className="flex items-center gap-3">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
          ) : (
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{ color: form.brandColor }}>
              {form.name ? form.name.charAt(0).toUpperCase() : 'R'}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 -mt-4 bg-white rounded-t-3xl">
        <h3 className="font-bold text-lg text-slate-900">{form.name || "Your Restaurant"}</h3>
        <p className="text-sm text-slate-500 mb-1">Pizza • Italian • Wings</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <span className="text-yellow-500">★</span> 4.8
          </span>
          <span>•</span>
          <span>15-25 min</span>
          <span>•</span>
          <span className="text-green-600 font-medium">Open</span>
        </div>

        {/* Promo banner */}
        <div 
          className="rounded-lg p-3 mb-4 text-white text-sm font-medium"
          style={{ backgroundColor: form.brandColor }}
        >
          🎉 5% off your first online order!
        </div>

        {/* Menu sections */}
        <div className="space-y-3">
          {['🍕 Pizzas', '🥗 Salads', '🍝 Pasta'].map((section, i) => (
            <div 
              key={section}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <span className="font-medium text-slate-900">{section}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const ClassicPreview = () => (
    <div style={{ minHeight: 480 }}>
      {/* Classic header with logo centered */}
      <div className="text-center py-6 border-b-2" style={{ borderColor: form.brandColor }}>
        {logoPreview ? (
          <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-lg object-cover mx-auto mb-2" />
        ) : (
          <div 
            className="w-20 h-20 rounded-lg mx-auto mb-2 flex items-center justify-center text-3xl font-serif text-white"
            style={{ backgroundColor: form.brandColor }}
          >
            {form.name ? form.name.charAt(0).toUpperCase() : 'R'}
          </div>
        )}
        <h3 className="font-serif text-xl font-bold text-slate-900">{form.name || "Your Restaurant"}</h3>
        <p className="text-sm text-slate-500">Est. 2024</p>
      </div>

      <div className="p-4">
        {/* Classic menu style */}
        <h4 className="font-serif text-sm uppercase tracking-widest text-slate-500 mb-3" style={{ color: form.brandColor }}>
          — Menu —
        </h4>
        
        <div className="space-y-4">
          {[
            { name: 'House Salad', desc: 'Fresh greens, tomatoes, croutons', price: '12' },
            { name: 'Grilled Salmon', desc: 'Atlantic salmon, lemon butter', price: '28' },
            { name: 'Ribeye Steak', desc: '12oz prime cut, herb butter', price: '42' },
          ].map((item) => (
            <div key={item.name} className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <p className="font-serif font-bold" style={{ color: form.brandColor }}>${item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const BoldPreview = () => (
    <div style={{ minHeight: 480, backgroundColor: form.brandColor }}>
      {/* Bold full-color header */}
      <div className="p-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
              {form.name ? form.name.charAt(0).toUpperCase() : 'R'}
            </div>
          )}
          <div>
            <h3 className="font-black text-xl uppercase tracking-tight">{form.name || "YOUR RESTAURANT"}</h3>
            <p className="text-white/70 text-sm">Order Now</p>
          </div>
        </div>

        {/* Big CTA */}
        <button className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl mb-4">
          START ORDER →
        </button>
      </div>

      {/* Menu on white */}
      <div className="bg-white rounded-t-3xl p-4 min-h-[200px]">
        <div className="flex gap-2 mb-4">
          {['Popular', 'New', 'Deals'].map((cat, i) => (
            <div 
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                i === 0 ? 'text-white' : 'bg-slate-100 text-slate-600'
              }`}
              style={i === 0 ? { backgroundColor: form.brandColor } : {}}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Burger', price: '$14' },
            { name: 'Fries', price: '$6' },
          ].map((item) => (
            <div key={item.name} className="bg-slate-50 rounded-xl p-3">
              <div className="w-full h-16 bg-slate-200 rounded-lg mb-2" />
              <p className="font-bold text-sm">{item.name}</p>
              <p className="font-bold" style={{ color: form.brandColor }}>{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPreview = () => {
    switch (form.template) {
      case 'slice': return <SlicePreview />
      case 'classic': return <ClassicPreview />
      case 'bold': return <BoldPreview />
      default: return <ModernPreview />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">OrderFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Get your restaurant online
          </h1>
          <p className="text-slate-600 mb-8">
            Set up in under 10 minutes. No credit card required.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Name */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Restaurant Name *
              </Label>
              <div className="relative mt-1">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Joe's Pizza"
                  className="pl-10 h-12"
                />
              </div>
              {slug && (
                <p className="text-xs text-slate-500 mt-1">
                  orderflow.co/<span className="font-medium text-slate-700">{slug}</span>
                </p>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Restaurant Logo
              </Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-500">Upload</span>
                  </button>
                )}
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Store Template
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setForm({ ...form, template: template.id })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.template === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-900">{template.name}</span>
                      {form.template === template.id && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Color */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Brand Color
              </Label>
              <div className="flex items-center gap-2 mt-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, brandColor: color })}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      form.brandColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-slate-200"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Address *
              </Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main Street, New York, NY 10001"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Phone Number
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500 mb-4">Create your account</p>
              
              {/* Email */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-slate-700">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@restaurant.com"
                  className="mt-1 h-12"
                />
              </div>

              {/* Password */}
              <div>
                <Label className="text-sm font-medium text-slate-700">Password *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a password"
                  className="mt-1 h-12"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating your store...
                </>
              ) : (
                'Create My Store →'
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              By creating an account, you agree to our Terms of Service
            </p>
          </form>
        </div>
      </div>

      {/* Right - Preview */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 to-slate-800 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Phone mockup */}
          <div className="bg-white rounded-[2.5rem] p-3 shadow-2xl">
            <div className="bg-slate-100 rounded-[2rem] overflow-hidden">
              {/* Status bar */}
              <div className="h-6 bg-slate-200 flex items-center justify-center">
                <div className="w-20 h-1 bg-slate-400 rounded-full" />
              </div>
              
              {/* Store preview */}
              {renderPreview()}
            </div>
          </div>
          
          <p className="text-center text-slate-400 text-sm mt-6">
            Live preview • {TEMPLATES.find(t => t.id === form.template)?.name} template
          </p>
        </div>
      </div>
    </div>
  )
}
