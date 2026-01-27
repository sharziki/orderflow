'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Utensils, 
  ArrowRight, 
  Check, 
  Star, 
  Zap, 
  CreditCard, 
  Truck, 
  Clock,
  ChevronDown,
  Play,
  Menu,
  X
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Live in 10 minutes',
    description: 'No technical skills needed. Add your menu, connect payments, go live.'
  },
  {
    icon: CreditCard,
    title: 'Built-in payments',
    description: 'Accept cards instantly with Stripe. Money goes directly to your bank.'
  },
  {
    icon: Truck,
    title: 'Delivery ready',
    description: 'Optional DoorDash integration. Your customers get real-time tracking.'
  },
  {
    icon: Clock,
    title: 'Real-time orders',
    description: 'Get notified instantly. Update order status. Keep customers informed.'
  },
]

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Unlimited menu items',
      'Up to 50 orders/month',
      'Basic templates',
      'Pickup orders',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For growing restaurants',
    features: [
      'Everything in Starter',
      'Unlimited orders',
      'All premium templates',
      'Delivery with DoorDash',
      'Priority support',
      'Custom domain',
      'Remove OrderFlow branding',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For chains & franchises',
    features: [
      'Everything in Pro',
      'Multi-location support',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'How long does it take to set up?',
    a: 'Most restaurants are live within 10 minutes. Just add your menu items, connect Stripe, and you\'re ready to accept orders.'
  },
  {
    q: 'What are the fees?',
    a: 'We charge a flat $1 per order for payment processing. Stripe\'s standard 2.9% + $0.30 also applies. No hidden fees.'
  },
  {
    q: 'Do I need my own delivery drivers?',
    a: 'Nope! We integrate with DoorDash Drive. They handle the delivery, you focus on the food.'
  },
  {
    q: 'Can I use my existing Stripe account?',
    a: 'Yes! During setup, you\'ll connect your existing Stripe account or create a new one. Either way, payments go directly to you.'
  },
  {
    q: 'What if I need help?',
    a: 'We offer email support for all plans, and priority support for Pro users. Most questions are answered within a few hours.'
  },
]

const TESTIMONIALS = [
  {
    quote: "We went from zero online orders to 200/week in the first month. Game changer.",
    author: "Maria S.",
    role: "Owner, Maria's Kitchen",
    rating: 5,
  },
  {
    quote: "Setup took 15 minutes. My other POS took 3 weeks. Never going back.",
    author: "James T.",
    role: "Owner, J's BBQ",
    rating: 5,
  },
  {
    quote: "The delivery integration is seamless. Customers love the real-time tracking.",
    author: "Sarah L.",
    role: "Manager, Fresh Bites",
    rating: 5,
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">OrderFlow</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Pricing</a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900 text-sm font-medium">FAQ</a>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Log in</Link>
              <Link 
                href="/dashboard/onboarding" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 py-4 px-4 space-y-4">
            <a href="#features" className="block text-slate-600 hover:text-slate-900 font-medium">Features</a>
            <a href="#pricing" className="block text-slate-600 hover:text-slate-900 font-medium">Pricing</a>
            <a href="#faq" className="block text-slate-600 hover:text-slate-900 font-medium">FAQ</a>
            <Link href="/login" className="block text-slate-600 hover:text-slate-900 font-medium">Log in</Link>
            <Link 
              href="/dashboard/onboarding" 
              className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-semibold"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Launch your online ordering in 10 minutes
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Online ordering for <span className="text-blue-600">restaurants</span> that just works
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Build your menu, accept payments, offer delivery. No coding, no contracts, no headaches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
              >
                Start Free <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#demo"
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
              >
                <Play className="w-5 h-5" /> Watch Demo
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              No credit card required • Free plan available
            </p>
          </div>

          {/* Hero Image / Demo */}
          <div id="demo" className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-2xl">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-600 rounded-lg px-4 py-1.5 text-slate-400 text-sm text-center">
                      orderflow.co/joes-pizza
                    </div>
                  </div>
                </div>
                {/* Screenshot placeholder */}
                <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Utensils className="w-10 h-10 text-blue-600" />
                    </div>
                    <p className="text-slate-600 font-medium">Dashboard Preview</p>
                    <p className="text-slate-400 text-sm">Split-panel menu builder with live preview</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">New Order!</p>
                  <p className="text-sm text-slate-500">#1042 • $24.50</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-slate-500 text-sm mb-8">TRUSTED BY RESTAURANTS EVERYWHERE</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60">
            {['🍕 Pizza Palace', '🍔 Burger Barn', '🍣 Sushi Station', '🌮 Taco Town', '🥗 Salad Stop'].map((name) => (
              <span key={name} className="text-xl font-bold text-slate-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to sell online
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From menu management to delivery tracking, we've got you covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Loved by restaurant owners
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-slate-900">{t.author}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600">
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <div 
                key={i} 
                className={`rounded-2xl p-8 ${
                  plan.highlighted 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-4' 
                    : 'bg-white border border-slate-200'
                }`}
              >
                <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlighted ? 'text-blue-100' : 'text-slate-500'}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-200' : 'text-green-600'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/onboarding"
                  className={`block w-full py-3 rounded-xl text-center font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-600">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ready to grow your restaurant?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join thousands of restaurants already using OrderFlow.
          </p>
          <Link 
            href="/dashboard/onboarding"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
          >
            Get Started for Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">OrderFlow</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
            <p className="text-sm text-slate-400">
              © 2024 OrderFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
