'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform, AnimatePresence, type Variants } from 'framer-motion'
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
  X,
  Monitor,
  Smartphone
} from 'lucide-react'
import { MenuLayoutRenderer, MENU_LAYOUTS, type MenuLayoutId } from '@/components/menu-layouts'
import { FallingPattern } from '@/components/ui/falling-pattern'

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
}

const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0 }
}

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0 }
}

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0 }
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
}

const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
}

// Reusable scroll-triggered wrapper
function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  distance = 40
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  
  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: distance }
      case 'down': return { opacity: 0, y: -distance }
      case 'left': return { opacity: 0, x: distance }
      case 'right': return { opacity: 0, x: -distance }
      default: return { opacity: 0 }
    }
  }
  
  const getAnimate = () => {
    switch (direction) {
      case 'up': 
      case 'down': return { opacity: 1, y: 0 }
      case 'left':
      case 'right': return { opacity: 1, x: 0 }
      default: return { opacity: 1 }
    }
  }
  
  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={isInView ? getAnimate() : getInitial()}
      transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

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

const DEMO_CATEGORIES = [
  { id: 'popular', name: 'Popular' },
  { id: 'mains', name: 'Mains' },
  { id: 'sides', name: 'Sides' },
  { id: 'drinks', name: 'Drinks' },
]

const DEMO_ITEMS = [
  { id: '1', name: 'Classic Cheeseburger', description: 'Angus beef patty with aged cheddar, lettuce, tomato, and our secret sauce', price: 12.99, category: 'popular', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop', available: true },
  { id: '2', name: 'Crispy Chicken Sandwich', description: 'Buttermilk fried chicken, coleslaw, pickles on a brioche bun', price: 11.99, category: 'popular', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=600&fit=crop', available: true },
  { id: '3', name: 'Garden Salad', description: 'Fresh mixed greens, cherry tomatoes, cucumber, red onion', price: 8.99, category: 'popular', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop', available: true },
  { id: '4', name: 'BBQ Bacon Burger', description: 'Smoky BBQ sauce, crispy bacon, onion rings, pepper jack cheese', price: 14.99, category: 'mains', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&h=600&fit=crop', available: true },
  { id: '5', name: 'Truffle Fries', description: 'Hand-cut fries with truffle oil and parmesan', price: 6.99, category: 'sides', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&h=600&fit=crop', available: true },
  { id: '6', name: 'Fresh Lemonade', description: 'House-made with fresh lemons and a hint of mint', price: 4.99, category: 'drinks', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop', available: true },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<MenuLayoutId>('blu-bentonville')
  const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('desktop')
  
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-50 border-b border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                <Utensils className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-bold text-xl text-slate-900">OrderFlow</span>
            </motion.div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {['features', 'demo', 'pricing', 'faq'].map((item, i) => (
                <motion.a 
                  key={item}
                  href={`#${item}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium capitalize transition-colors relative group"
                >
                  {item}
                  <motion.span 
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Log in</Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/dashboard/onboarding" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>

            <motion.button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white border-t border-slate-200 overflow-hidden"
            >
              <motion.div 
                className="py-4 px-4 space-y-4"
                variants={staggerFast}
                initial="hidden"
                animate="visible"
              >
                {['features', 'demo', 'pricing', 'faq'].map((item) => (
                  <motion.a 
                    key={item}
                    href={`#${item}`}
                    variants={fadeInLeft}
                    className="block text-slate-600 hover:text-slate-900 font-medium capitalize"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </motion.a>
                ))}
                <motion.div variants={fadeInLeft}>
                  <Link href="/login" className="block text-slate-600 hover:text-slate-900 font-medium">Log in</Link>
                </motion.div>
                <motion.div variants={fadeInUp}>
                  <Link href="/dashboard/onboarding" className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-semibold">
                    Get Started
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 relative min-h-screen flex items-center overflow-hidden bg-white">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0 z-0">
          <FallingPattern 
            color="rgba(37, 99, 235, 0.25)"
            backgroundColor="transparent"
            duration={100}
            blurIntensity="0.3em"
            density={1}
          />
        </div>
        
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="max-w-6xl mx-auto w-full relative z-10"
        >
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-100"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              Launch your online ordering in 10 minutes
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="inline-block"
              >
                Online ordering for{' '}
              </motion.span>
              <motion.span 
                className="text-blue-600 inline-block"
                initial={{ opacity: 0, y: 40, rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: 0.7, type: "spring" }}
              >
                restaurants
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="inline-block"
              >
                {' '}that just works
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-xl text-slate-600 mb-8"
            >
              Build your menu, accept payments, offer delivery. No coding, no contracts, no headaches.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Link 
                  href="/dashboard/onboarding"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-xl shadow-blue-600/25"
                >
                  Start Free 
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
              </motion.div>
              <motion.a 
                href="#demo"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="inline-flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-900 px-8 py-4 rounded-xl text-lg font-semibold transition-colors border border-slate-200"
              >
                <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Play className="w-5 h-5" />
                </motion.span>
                Try Demo
              </motion.a>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="text-sm text-slate-500 mt-4"
            >
              No credit card required • Free plan available
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <p className="text-center text-slate-500 text-sm mb-8 uppercase tracking-wider">Trusted by restaurants everywhere</p>
          </ScrollReveal>
          <motion.div 
            className="flex justify-center items-center gap-8 sm:gap-16 flex-wrap"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {['🍕 Pizza Palace', '🍔 Burger Barn', '🍣 Sushi Station', '🌮 Taco Town', '🥗 Salad Stop'].map((name, i) => (
              <motion.span 
                key={name} 
                variants={fadeInUp}
                whileHover={{ scale: 1.1, opacity: 1 }}
                className="text-xl font-bold text-slate-400 opacity-60 transition-all cursor-default"
              >
                {name}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Everything you need to sell online
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                From menu management to delivery tracking, we've got you covered.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 0.1} direction={i % 2 === 0 ? 'left' : 'right'}>
                <motion.div 
                  whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 h-full"
                >
                  <motion.div 
                    className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                  >
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <ScrollReveal>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Choose your perfect template
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                6 beautiful layouts to match your brand. Preview them live below.
              </p>
            </ScrollReveal>
          </div>

          {/* Layout Selector */}
          <ScrollReveal delay={0.2}>
            <motion.div 
              className="flex flex-wrap justify-center gap-2 mb-8"
              variants={staggerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {Object.values(MENU_LAYOUTS).map((layout) => (
                <motion.button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id as MenuLayoutId)}
                  variants={scaleIn}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedLayout === layout.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow'
                  }`}
                >
                  <span>{layout.thumbnail}</span>
                  <span>{layout.name}</span>
                </motion.button>
              ))}
            </motion.div>
          </ScrollReveal>

          {/* Device Toggle */}
          <ScrollReveal delay={0.3} className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1">
              {['mobile', 'desktop'].map((device) => (
                <motion.button
                  key={device}
                  onClick={() => setDeviceView(device as 'mobile' | 'desktop')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    deviceView === device
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {device === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  {device}
                </motion.button>
              ))}
            </div>
          </ScrollReveal>

          {/* Layout Info */}
          <AnimatePresence mode="wait">
            <motion.p 
              key={selectedLayout}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-sm text-slate-500 mb-6"
            >
              <span className="font-medium text-slate-700">Best for:</span>{' '}
              {MENU_LAYOUTS[selectedLayout].recommended.join(', ')}
            </motion.p>
          </AnimatePresence>

          {/* Preview Container */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              {deviceView === 'mobile' ? (
                <motion.div 
                  key="mobile"
                  initial={{ opacity: 0, x: -100, rotateY: -15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 100, rotateY: 15 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="relative"
                >
                  <div className="relative bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-10" />
                    <div className="w-[375px] h-[700px] bg-white rounded-[2.5rem] overflow-hidden relative">
                      <div className="absolute top-0 left-0 right-0 h-12 bg-black/5 z-10 flex items-center justify-between px-8 pt-2">
                        <span className="text-xs font-medium">9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-2.5 border border-current rounded-sm relative">
                            <div className="absolute inset-0.5 bg-current rounded-sm" style={{ width: '70%' }} />
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        key={selectedLayout}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full overflow-auto pt-8"
                      >
                        <MenuLayoutRenderer
                          layout={selectedLayout}
                          restaurantName="Demo Kitchen"
                          logoUrl="https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&h=200&fit=crop"
                          storeHours={{ open: '11:00 AM', close: '10:00 PM', isOpen: true }}
                          primaryColor="#2563eb"
                          secondaryColor="#4f46e5"
                          menuItems={DEMO_ITEMS}
                          categories={DEMO_CATEGORIES}
                        />
                      </motion.div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full" />
                </motion.div>
              ) : (
                <motion.div 
                  key="desktop"
                  initial={{ opacity: 0, x: 100, rotateY: 15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -100, rotateY: -15 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-full"
                  style={{ maxWidth: '1440px' }}
                >
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-2xl">
                    <div className="bg-slate-800 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-700">
                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.3 }} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" />
                          <motion.div whileHover={{ scale: 1.3 }} className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer" />
                          <motion.div whileHover={{ scale: 1.3 }} className="w-3 h-3 rounded-full bg-green-500 cursor-pointer" />
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-slate-600 rounded-lg px-4 py-1.5 text-slate-400 text-sm text-center">
                            orderflow.co/demo-kitchen
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        key={selectedLayout}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-[600px] overflow-auto bg-white"
                      >
                        <MenuLayoutRenderer
                          layout={selectedLayout}
                          restaurantName="Demo Kitchen"
                          logoUrl="https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&h=200&fit=crop"
                          storeHours={{ open: '11:00 AM', close: '10:00 PM', isOpen: true }}
                          primaryColor="#2563eb"
                          secondaryColor="#4f46e5"
                          menuItems={DEMO_ITEMS}
                          categories={DEMO_CATEGORIES}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <ScrollReveal delay={0.2} className="text-center mt-12">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/dashboard/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-xl shadow-blue-600/25"
              >
                Start Building Your Menu <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Loved by restaurant owners
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.15} direction={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow"
                >
                  <motion.div 
                    className="flex gap-1 mb-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerFast}
                  >
                    {[...Array(t.rating)].map((_, j) => (
                      <motion.div key={j} variants={scaleIn}>
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                  <p className="text-slate-700 mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold text-slate-900">{t.author}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600">Start free, upgrade when you're ready.</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <ScrollReveal key={i} delay={i * 0.15} direction={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
                <motion.div 
                  whileHover={{ y: -12, scale: plan.highlighted ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`rounded-2xl p-8 h-full ${
                    plan.highlighted 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-4 shadow-2xl' 
                      : 'bg-white border border-slate-200 hover:shadow-xl'
                  }`}
                >
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <motion.span 
                      className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                    >
                      {plan.price}
                    </motion.span>
                    <span className={plan.highlighted ? 'text-blue-100' : 'text-slate-500'}>
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <motion.li 
                        key={j} 
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + j * 0.05 }}
                      >
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-200' : 'text-green-600'}`} />
                        <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-600'}`}>
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
                  </motion.div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
          </ScrollReveal>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <motion.div 
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                >
                  <motion.button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <p className="text-slate-600">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-70" />
        </motion.div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Ready to grow your restaurant?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of restaurants already using OrderFlow.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Link 
                href="/dashboard/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-xl shadow-blue-600/25"
              >
                Get Started for Free 
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-20 pb-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <ScrollReveal direction="right">
                <motion.div 
                  className="flex items-center gap-2 mb-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-2xl">OrderFlow</span>
                </motion.div>
                <p className="text-slate-400 mb-6 max-w-sm">
                  The easiest way for restaurants to accept online orders. Launch in minutes, not months.
                </p>
                {/* Social Links */}
                <div className="flex gap-4">
                  {[
                    { icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z', name: 'Twitter' },
                    { icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z', name: 'GitHub' },
                    { icon: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z', name: 'LinkedIn' },
                  ].map((social) => (
                    <motion.a
                      key={social.name}
                      href="#"
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                      aria-label={social.name}
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d={social.icon} />
                      </svg>
                    </motion.a>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Product Links */}
            <div>
              <ScrollReveal delay={0.1}>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-3">
                  {['Features', 'Pricing', 'Templates', 'Integrations', 'API'].map((item) => (
                    <li key={item}>
                      <motion.a 
                        href="#" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>

            {/* Company Links */}
            <div>
              <ScrollReveal delay={0.2}>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-3">
                  {['About', 'Blog', 'Careers', 'Press', 'Partners'].map((item) => (
                    <li key={item}>
                      <motion.a 
                        href="#" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>

            {/* Support Links */}
            <div>
              <ScrollReveal delay={0.3}>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-3">
                  {['Help Center', 'Contact Us', 'Status', 'Documentation', 'Community'].map((item) => (
                    <li key={item}>
                      <motion.a 
                        href="#" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>
          </div>

          {/* Newsletter */}
          <ScrollReveal>
            <div className="border-t border-slate-800 pt-10 mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-1">Subscribe to our newsletter</h4>
                  <p className="text-slate-400 text-sm">Get product updates, tips, and restaurant industry insights.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 md:w-64 px-4 py-3 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Subscribe
                  </motion.button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} OrderFlow. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                {[
                  { name: 'Privacy Policy', href: '#' },
                  { name: 'Terms of Service', href: '#' },
                  { name: 'Cookie Policy', href: '#' },
                  { name: 'Sitemap', href: '#' },
                ].map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors"
                    whileHover={{ y: -1 }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
