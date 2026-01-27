'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Utensils, Loader2, Upload, MapPin, Clock, Phone, Store } from 'lucide-react'

const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
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
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    brandColor: '#2563eb',
    // Auth fields
    email: '',
    password: '',
  })

  const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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
          city: '', // Extracted from address in real implementation
          state: '',
          zip: '',
          primaryColor: form.brandColor,
          secondaryColor: form.brandColor,
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

      router.push('/dashboard')
    } catch (err) {
      setError('Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
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

            {/* Brand Color */}
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Brand Color
              </Label>
              <div className="flex items-center gap-3 mt-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, brandColor: color })}
                    className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                      form.brandColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-slate-200"
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
              <div className="p-4" style={{ minHeight: 480 }}>
                {/* Header */}
                <div 
                  className="rounded-xl p-4 text-white mb-4"
                  style={{ backgroundColor: form.brandColor }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
                      {form.name ? form.name.charAt(0).toUpperCase() : 'J'}
                    </div>
                    <div>
                      <h3 className="font-bold">{form.name || "Joe's Pizza"}</h3>
                      <p className="text-white/70 text-xs">Open until 10pm</p>
                    </div>
                  </div>
                </div>

                {/* Order type */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-white border-2 border-slate-200 rounded-lg p-3 text-center">
                    <p className="font-semibold text-slate-900">Pickup</p>
                    <p className="text-xs text-slate-500">15 min</p>
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="font-semibold text-slate-400">Delivery</p>
                    <p className="text-xs text-slate-400">30-45 min</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {['Appetizers', 'Mains', 'Drinks'].map((cat, i) => (
                    <div 
                      key={cat}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        i === 0 
                          ? 'text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      style={i === 0 ? { backgroundColor: form.brandColor } : {}}
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                {/* Sample items */}
                <div className="space-y-3">
                  {[
                    { name: 'Garlic Bread', price: '$6.99' },
                    { name: 'Caesar Salad', price: '$12.99' },
                    { name: 'Margherita Pizza', price: '$16.99' },
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
            </div>
          </div>
          
          <p className="text-center text-slate-400 text-sm mt-6">
            Live preview of your store
          </p>
        </div>
      </div>
    </div>
  )
}
