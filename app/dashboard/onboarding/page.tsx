'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TemplateSelector } from '@/components/ui/templates'
import { 
  Store, 
  MapPin, 
  Palette, 
  Layout,
  ArrowRight, 
  ArrowLeft,
  Check,
  Loader2,
  Utensils,
  Sparkles
} from 'lucide-react'

const steps = [
  { id: 1, title: 'Restaurant', icon: Store },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Layout', icon: Layout },
  { id: 4, title: 'Branding', icon: Palette },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    restaurantName: '',
    slug: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    timezone: 'America/Chicago',
    template: 'modern',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
  })

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'restaurantName') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create restaurant')
        setLoading(false)
        return
      }
      router.push('/dashboard?welcome=true')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 4) * 100

  const canProceed = () => {
    switch(step) {
      case 1: return formData.restaurantName && formData.slug && formData.email && formData.password
      case 2: return formData.address && formData.city && formData.state
      case 3: return formData.template
      case 4: return true
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-6">
            <Utensils className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">OrderFlow</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Create your online menu
          </h1>
          <p className="text-slate-600 text-lg">
            Set up your restaurant in 2 minutes, add menu items, then go live
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {steps.map((s) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isComplete = step > s.id
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' :
                    'bg-white text-slate-400 border-2 border-slate-200'
                  }`}>
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden md:block ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              {step === 1 && 'Tell us about your restaurant'}
              {step === 2 && 'Where are you located?'}
              {step === 3 && (
                <>
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Choose your store layout
                </>
              )}
              {step === 4 && 'Customize your brand'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Basic information to get started'}
              {step === 2 && 'Your pickup address for customers'}
              {step === 3 && 'Select a template that fits your brand'}
              {step === 4 && 'Pick your brand colors'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.restaurantName}
                    onChange={(e) => updateField('restaurantName', e.target.value)}
                    placeholder="Joe's Amazing Pizza"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Your Store URL</Label>
                  <div className="flex">
                    <div className="flex items-center px-4 bg-slate-100 border border-r-0 border-input rounded-l-lg text-slate-500 text-sm">
                      orderflow.io/store/
                    </div>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="joes-pizza"
                      className="rounded-l-none h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="owner@restaurant.com"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Create a secure password"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Main Street"
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="New York"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="NY"
                      maxLength={2}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => updateField('zip', e.target.value)}
                      placeholder="10001"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Template Selection */}
            {step === 3 && (
              <TemplateSelector
                selected={formData.template}
                onSelect={(id) => updateField('template', id)}
                primaryColor={formData.primaryColor}
              />
            )}

            {/* Step 4: Branding */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Primary Color</Label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="w-14 h-12 rounded-lg cursor-pointer border-2 border-slate-200"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="h-12 font-mono"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateField('primaryColor', color)}
                          className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                            formData.primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => updateField('secondaryColor', e.target.value)}
                        className="w-14 h-12 rounded-lg cursor-pointer border-2 border-slate-200"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => updateField('secondaryColor', e.target.value)}
                        className="h-12 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mt-6">
                  <Label className="mb-3 block">Live Preview</Label>
                  <div 
                    className="rounded-xl p-6 transition-all duration-300"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white text-xl font-bold">
                          {formData.restaurantName || 'Your Restaurant'}
                        </h3>
                        <p className="text-white/70 text-sm">Online Ordering</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className="px-6 py-3 rounded-lg text-white font-semibold"
                        style={{ backgroundColor: formData.secondaryColor }}
                      >
                        Order Now
                      </button>
                      <button className="px-6 py-3 rounded-lg bg-white/20 text-white font-semibold">
                        View Menu
                      </button>
                    </div>
                  </div>
                </div>

                {/* What's Next */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                  <h4 className="font-semibold text-blue-900 mb-2">What's next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>→ Add your menu items and prices</li>
                    <li>→ Preview your store</li>
                    <li>→ Connect Stripe to go live</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  className="gap-2" 
                  size="lg"
                  disabled={!canProceed()}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create My Store
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
