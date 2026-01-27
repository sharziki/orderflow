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
  Rocket, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Loader2,
  Utensils,
  Clock,
  Gift,
  Truck,
  Sparkles,
  CreditCard,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

const steps = [
  { id: 1, title: 'Restaurant', icon: Store },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Layout', icon: Layout },
  { id: 4, title: 'Branding', icon: Palette },
  { id: 5, title: 'Payments', icon: CreditCard },
  { id: 6, title: 'Launch', icon: Rocket },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showStripeKey, setShowStripeKey] = useState(false)
  const [stripeKeyError, setStripeKeyError] = useState('')
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
    pickupEnabled: true,
    deliveryEnabled: false,
    scheduledOrdersEnabled: true,
    giftCardsEnabled: true,
    stripePublishableKey: '',
    stripeSecretKey: '',
    skipStripeSetup: false,
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
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to create restaurant')
      const { tenant } = await res.json()
      router.push('/dashboard?setup=complete')
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 6) * 100

  const validateStripeKey = (key: string, type: 'publishable' | 'secret') => {
    if (!key) return true // Empty is ok (can skip)
    if (type === 'publishable') {
      return /^pk_(live|test)_[a-zA-Z0-9]{20,}$/.test(key)
    }
    return /^sk_(live|test)_[a-zA-Z0-9]{20,}$/.test(key)
  }

  const canProceed = () => {
    switch(step) {
      case 1: return formData.restaurantName && formData.slug && formData.email && formData.password
      case 2: return formData.address && formData.city && formData.state
      case 3: return formData.template
      case 4: return true
      case 5: return formData.skipStripeSetup || (
        formData.stripePublishableKey && 
        formData.stripeSecretKey &&
        validateStripeKey(formData.stripePublishableKey, 'publishable') &&
        validateStripeKey(formData.stripeSecretKey, 'secret')
      )
      case 6: return true
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-6">
            <Utensils className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">OrderFlow</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Launch your online ordering
          </h1>
          <p className="text-slate-600 text-lg">
            Get your restaurant online in just a few minutes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
              {step === 4 && 'Make it yours'}
              {step === 5 && (
                <>
                  <CreditCard className="w-5 h-5 text-green-500" />
                  Connect payments
                </>
              )}
              {step === 6 && 'Ready to launch!'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Basic information to get started'}
              {step === 2 && 'Your customers need to find you'}
              {step === 3 && 'Select a template that fits your brand'}
              {step === 4 && 'Customize your brand colors'}
              {step === 5 && 'Set up Stripe to accept payments (you can skip and do this later)'}
              {step === 6 && 'Review and choose your features'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 stagger-children">
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
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="joes-pizza"
                      className="rounded-r-none h-12"
                    />
                    <div className="flex items-center px-4 bg-slate-100 border border-l-0 border-input rounded-r-lg text-slate-500 text-sm">
                      .orderflow.io
                    </div>
                  </div>
                  {formData.slug && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Your store will be at {formData.slug}.orderflow.io
                    </p>
                  )}
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
              <div className="space-y-4 stagger-children">
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
              <div className="stagger-children">
                <TemplateSelector
                  selected={formData.template}
                  onSelect={(id) => updateField('template', id)}
                  primaryColor={formData.primaryColor}
                />
              </div>
            )}

            {/* Step 4: Branding */}
            {step === 4 && (
              <div className="space-y-6 stagger-children">
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
                    {/* Color presets */}
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
                        <p className="text-white/70 text-sm">
                          {formData.template.charAt(0).toUpperCase() + formData.template.slice(1)} Template
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className="px-6 py-3 rounded-lg text-white font-semibold transition-transform hover:scale-105"
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
              </div>
            )}

            {/* Step 5: Payments / Stripe Setup */}
            {step === 5 && (
              <div className="space-y-6 stagger-children">
                {!formData.skipStripeSetup ? (
                  <>
                    {/* Stripe Key Inputs */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripePublishable" className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-slate-400" />
                          Stripe Publishable Key
                        </Label>
                        <Input
                          id="stripePublishable"
                          value={formData.stripePublishableKey}
                          onChange={(e) => {
                            updateField('stripePublishableKey', e.target.value)
                            setStripeKeyError('')
                          }}
                          placeholder="pk_live_... or pk_test_..."
                          className={`h-12 font-mono text-sm ${
                            formData.stripePublishableKey && !validateStripeKey(formData.stripePublishableKey, 'publishable')
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                        {formData.stripePublishableKey && !validateStripeKey(formData.stripePublishableKey, 'publishable') && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Key must start with pk_live_ or pk_test_
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stripeSecret" className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-slate-400" />
                          Stripe Secret Key
                        </Label>
                        <div className="relative">
                          <Input
                            id="stripeSecret"
                            type={showStripeKey ? 'text' : 'password'}
                            value={formData.stripeSecretKey}
                            onChange={(e) => {
                              updateField('stripeSecretKey', e.target.value)
                              setStripeKeyError('')
                            }}
                            placeholder="sk_live_... or sk_test_..."
                            className={`h-12 font-mono text-sm pr-12 ${
                              formData.stripeSecretKey && !validateStripeKey(formData.stripeSecretKey, 'secret')
                                ? 'border-red-500'
                                : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowStripeKey(!showStripeKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showStripeKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {formData.stripeSecretKey && !validateStripeKey(formData.stripeSecretKey, 'secret') && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Key must start with sk_live_ or sk_test_
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Help Link */}
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-600 mb-2">
                        Don't have Stripe keys yet?
                      </p>
                      <a 
                        href="https://dashboard.stripe.com/apikeys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Get your API keys from Stripe Dashboard
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Skip Option */}
                    <button
                      type="button"
                      onClick={() => updateField('skipStripeSetup', true)}
                      className="w-full p-4 text-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      Skip for now — I'll set this up later
                    </button>
                  </>
                ) : (
                  <>
                    {/* Skipped State */}
                    <div className="p-6 bg-amber-50 rounded-xl text-center">
                      <CreditCard className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-slate-900 mb-2">Payment setup skipped</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        No worries! You can set up Stripe anytime from your dashboard settings.
                        Your store will be created without payment processing for now.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateField('skipStripeSetup', false)}
                        className="gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Actually, let me add my keys
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 6: Features & Launch */}
            {step === 6 && (
              <div className="space-y-6 stagger-children">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'pickupEnabled', icon: Store, title: 'Pickup Orders', desc: 'Customers order and pick up' },
                    { key: 'deliveryEnabled', icon: Truck, title: 'Delivery', desc: 'DoorDash Drive integration' },
                    { key: 'scheduledOrdersEnabled', icon: Clock, title: 'Scheduled Orders', desc: 'Order ahead of time' },
                    { key: 'giftCardsEnabled', icon: Gift, title: 'Gift Cards', desc: 'Sell and redeem gift cards' },
                  ].map(feature => {
                    const Icon = feature.icon
                    const enabled = formData[feature.key as keyof typeof formData]
                    return (
                      <button
                        key={feature.key}
                        type="button"
                        onClick={() => updateField(feature.key, !enabled)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          enabled 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            enabled ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{feature.title}</p>
                            <p className="text-sm text-slate-500">{feature.desc}</p>
                          </div>
                          {enabled && (
                            <Check className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mt-6">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Ready to launch!
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {formData.restaurantName || 'Your restaurant'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {formData.slug}.orderflow.io
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {formData.city}, {formData.state}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {formData.template.charAt(0).toUpperCase() + formData.template.slice(1)} template
                    </li>
                    <li className="flex items-center gap-2">
                      {formData.skipStripeSetup ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-600">Stripe setup pending</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          Stripe payments configured
                        </>
                      )}
                    </li>
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

              {step < 6 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  className="gap-2" 
                  size="lg"
                  disabled={!canProceed()}
                >
                  {step === 5 && formData.skipStripeSetup ? 'Skip & Continue' : 'Continue'}
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
                      <Rocket className="w-4 h-4" />
                      Launch My Store
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trust badges */}
        <div className="mt-8 text-center text-sm text-slate-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p>Trusted by 500+ restaurants • No credit card required • Free 14-day trial</p>
        </div>
      </div>
    </div>
  )
}
