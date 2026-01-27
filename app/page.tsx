'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Utensils, 
  Rocket, 
  CreditCard, 
  Truck, 
  Palette, 
  BarChart3,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Play,
  Star
} from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">OrderFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#templates" className="text-slate-600 hover:text-slate-900 transition-colors">Templates</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/dashboard/onboarding">
                <Button className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div 
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4" />
              Launch your online ordering in 5 minutes
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight"
            >
              Online ordering
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> made simple</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
            >
              Give your restaurant a beautiful online ordering system. No coding required. 
              Set up in minutes, start taking orders today.
            </motion.p>
            
            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/dashboard/onboarding">
                <Button size="lg" className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Rocket className="w-5 h-5" />
                  Start Free Trial
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.p 
              variants={fadeIn}
              className="text-sm text-slate-500 mt-6"
            >
              No credit card required • Free 14-day trial • Cancel anytime
            </motion.p>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-4 shadow-2xl max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="h-8 bg-slate-100 flex items-center gap-2 px-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-md px-4 py-1 text-xs text-slate-400">
                      demo-restaurant.orderflow.io
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Today's Orders", value: '47', trend: '+12%' },
                      { label: 'Revenue', value: '$1,284', trend: '+8%' },
                      { label: 'Pending', value: '5', trend: '' },
                      { label: 'Menu Items', value: '86', trend: '' },
                    ].map((stat, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-white rounded-lg p-4 shadow-sm"
                      >
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        {stat.trend && <p className="text-xs text-green-600">{stat.trend}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-slate-600 text-center">
              Trusted by <span className="font-semibold text-slate-900">500+</span> restaurants
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-xl text-slate-600">Powerful features to run your online ordering</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Palette, title: 'Beautiful Templates', desc: 'Choose from 4 stunning designs. Customize colors and branding to match your restaurant.' },
              { icon: CreditCard, title: 'Stripe Payments', desc: 'Accept credit cards securely. Get paid directly to your bank account.' },
              { icon: Truck, title: 'DoorDash Delivery', desc: 'Offer delivery through DoorDash Drive. No need to hire drivers.' },
              { icon: Clock, title: 'Scheduled Orders', desc: 'Let customers order ahead. Perfect for catering and busy periods.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track orders, revenue, and popular items. Make data-driven decisions.' },
              { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security. 99.9% uptime guarantee.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Beautiful templates</h2>
            <p className="text-xl text-slate-600">Pick a style that matches your brand</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Modern', desc: 'Clean & minimal', color: 'from-blue-500 to-indigo-600' },
              { name: 'Classic', desc: 'Traditional elegance', color: 'from-amber-500 to-orange-600' },
              { name: 'Bold', desc: 'Dark & dramatic', color: 'from-slate-700 to-slate-900' },
              { name: 'Compact', desc: 'Mobile-first', color: 'from-green-500 to-emerald-600' },
            ].map((template, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
              >
                <div className={`aspect-[3/4] rounded-2xl bg-gradient-to-br ${template.color} p-4 mb-4 shadow-lg`}>
                  <div className="h-full bg-white/10 rounded-xl backdrop-blur-sm" />
                </div>
                <h3 className="font-semibold text-slate-900">{template.name}</h3>
                <p className="text-sm text-slate-500">{template.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Live in 5 minutes</h2>
            <p className="text-xl text-slate-600">Three simple steps to online ordering</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign Up', desc: 'Enter your restaurant details and choose your URL' },
              { step: '2', title: 'Customize', desc: 'Pick a template, set your colors, add your menu' },
              { step: '3', title: 'Launch', desc: 'Connect Stripe and start taking orders' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6"
                >
                  {item.step}
                </motion.div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple pricing</h2>
            <p className="text-xl text-slate-600">No hidden fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                name: 'Starter', 
                price: '$49', 
                desc: 'Perfect for small restaurants',
                features: ['Up to 50 menu items', 'Pickup orders', 'Basic analytics', 'Email support'],
              },
              { 
                name: 'Pro', 
                price: '$99', 
                desc: 'For growing restaurants',
                features: ['Unlimited menu items', 'Delivery integration', 'Advanced analytics', 'Priority support', 'Custom domain'],
                popular: true
              },
              { 
                name: 'Enterprise', 
                price: 'Custom', 
                desc: 'For restaurant groups',
                features: ['Multiple locations', 'API access', 'Dedicated support', 'Custom integrations'],
              },
            ].map((plan, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`p-8 rounded-2xl ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white scale-105' 
                    : 'bg-white border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="text-sm font-medium bg-white/20 rounded-full px-3 py-1 inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? '' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.popular ? '' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.price !== 'Custom' && <span className={plan.popular ? 'text-white/70' : 'text-slate-500'}>/month</span>}
                </div>
                <p className={`mb-6 ${plan.popular ? 'text-white/80' : 'text-slate-600'}`}>{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${plan.popular ? '' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-white/90' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-white text-blue-600 hover:bg-white/90' : ''}`}
                  variant={plan.popular ? 'secondary' : 'default'}
                >
                  Start Free Trial
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to grow your restaurant?
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Join 500+ restaurants already using OrderFlow.
          </p>
          <Link href="/dashboard/onboarding">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                <Rocket className="w-5 h-5" />
                Start Your Free Trial
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">OrderFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </div>
          <p className="text-sm text-slate-500">© 2026 OrderFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
