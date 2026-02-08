'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Utensils, Loader2, MapPin, Phone, Store, Camera, X, Check, ArrowRight, Sparkles, Clock, CreditCard, BarChart3 } from 'lucide-react'
import AddressAutocomplete, { AddressDetails } from '@/components/AddressAutocomplete'

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
    city: '',
    state: '',
    zip: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    phone: '',
    email: '',
    password: '',
  })

  // Handle address selection from autocomplete
  const handleAddressSelect = (details: AddressDetails) => {
    setForm(prev => ({
      ...prev,
      address: details.address,
      city: details.city,
      state: details.state,
      zip: details.zip,
      lat: details.lat,
      lng: details.lng,
    }))
  }

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
          city: form.city,
          state: form.state,
          zip: form.zip,
          latitude: form.lat,
          longitude: form.lng,
          primaryColor: '#2563eb',
          secondaryColor: '#2563eb',
          template: 'modern',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">DerbyFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Get your restaurant online
          </h1>
          <p className="text-slate-600 mb-8">
            Set up in under 5 minutes. Start accepting orders today.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Name */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Restaurant Name *
              </Label>
              <div className="relative mt-1.5">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Joe's Pizza"
                  className="pl-10 h-12 text-base"
                />
              </div>
              {slug && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Your store URL: <span className="font-medium text-blue-600">orderflow.co/{slug}</span>
                </p>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Restaurant Logo <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <div className="mt-1.5 flex items-center gap-4">
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
                      className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-0.5 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Upload</span>
                  </button>
                )}
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB<br/>You can add this later</p>
              </div>
            </div>

            {/* Address with Autocomplete */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Restaurant Address *
              </Label>
              <div className="mt-1.5">
                <AddressAutocomplete
                  value={form.address}
                  onChange={(value) => setForm({ ...form, address: value })}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                />
              </div>
              {form.city && form.state && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {form.city}, {form.state} {form.zip}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Phone Number <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 mt-6">
              <p className="text-sm font-medium text-slate-700 mb-4">Create your account</p>

              {/* Email */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-slate-700">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@restaurant.com"
                  className="mt-1.5 h-12 text-base"
                />
              </div>

              {/* Password */}
              <div>
                <Label className="text-sm font-medium text-slate-700">Password *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a password (min 6 characters)"
                  className="mt-1.5 h-12 text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating your store...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
            </p>
          </form>
        </div>
      </div>

      {/* Right - Features & Progress */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 items-center justify-center p-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-10">
          {/* Store URL preview */}
          <motion.div
            key={slug ? 'with-slug' : 'no-slug'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {slug ? (
              <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-3">
                <p className="text-white/60 text-xs mb-1">Your store will live at</p>
                <p className="text-white font-semibold text-lg">orderflow.co/{slug}</p>
              </div>
            ) : (
              <p className="text-white/60 text-sm">Fill in your details to get started</p>
            )}
          </motion.div>

          {/* Feature highlights */}
          <div className="w-full space-y-4 text-white">
            <h2 className="text-2xl font-bold text-center mb-6">Everything you need to sell online</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Sparkles, title: 'Beautiful Menus', desc: 'Mobile-first design' },
                { icon: CreditCard, title: 'Easy Payments', desc: 'Stripe integration' },
                { icon: Clock, title: 'Real-time Orders', desc: 'Instant notifications' },
                { icon: BarChart3, title: 'Analytics', desc: 'Track your growth' },
              ].map((feature) => (
                <div key={feature.title} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <feature.icon className="w-7 h-7 mb-2 text-blue-300" />
                  <div className="font-semibold text-sm">{feature.title}</div>
                  <div className="text-white/60 text-xs">{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress checklist */}
          <div className="w-full max-w-sm space-y-3">
            <h3 className="text-white font-semibold text-sm text-center mb-4">Setup progress</h3>
            {[
              { done: !!form.name, label: 'Restaurant name' },
              { done: !!form.address && !!form.city, label: 'Address (with autocomplete)' },
              { done: !!form.email, label: 'Email' },
              { done: !!form.password && form.password.length >= 6, label: 'Password (6+ chars)' },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={false}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-sm"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: item.done ? 1 : 0.9,
                    backgroundColor: item.done ? 'rgb(34, 197, 94)' : 'rgba(255,255,255,0.2)',
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  {item.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </motion.div>
                <span className={item.done ? 'text-white' : 'text-white/60'}>{item.label}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-white/50 text-xs text-center">
            No credit card required • Free to start • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
