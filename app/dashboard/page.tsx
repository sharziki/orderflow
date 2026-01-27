'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Utensils,
  ShoppingBag,
  DollarSign,
  Clock,
  Palette,
  Settings,
  ExternalLink,
  TrendingUp,
  Check,
  ChevronRight,
  Bell,
  CreditCard,
  Printer,
  Menu,
  Users,
  BarChart3
} from 'lucide-react'

export default function DashboardPage() {
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayOrders: 12,
    todayRevenue: 487.50,
    pendingOrders: 3,
    menuItems: 45
  })

  const setupSteps = [
    { id: 'account', label: 'Create account', complete: true },
    { id: 'details', label: 'Add restaurant details', complete: true },
    { id: 'branding', label: 'Upload logo & set colors', complete: false },
    { id: 'menu', label: 'Add menu items', complete: false },
    { id: 'stripe', label: 'Connect Stripe', complete: false },
    { id: 'deploy', label: 'Deploy store', complete: false },
  ]

  const completedSteps = setupSteps.filter(s => s.complete).length
  const setupProgress = (completedSteps / setupSteps.length) * 100

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">OrderFlow</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View Store
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-blue-100">
                Your store is almost ready. Complete the setup to go live.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-blue-100 text-sm">Setup Progress</p>
                <p className="text-2xl font-bold">{Math.round(setupProgress)}%</p>
              </div>
              <div className="w-24">
                <Progress value={setupProgress} className="h-3 bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Today's Orders</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.todayOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +12% from yesterday
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-slate-900">${stats.todayRevenue.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +8% from yesterday
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Orders need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Menu Items</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.menuItems}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Menu className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Active items</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: '/dashboard/menu', icon: Menu, title: 'Manage Menu', desc: 'Add, edit, or remove items', color: 'blue' },
                { href: '/dashboard/orders', icon: ShoppingBag, title: 'View Orders', desc: 'Manage incoming orders', color: 'green' },
                { href: '/dashboard/branding', icon: Palette, title: 'Branding', desc: 'Logo, colors, and style', color: 'purple' },
                { href: '/dashboard/settings', icon: Settings, title: 'Settings', desc: 'Hours, fees, and more', color: 'slate' },
              ].map(action => {
                const Icon = action.icon
                const colors = {
                  blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
                  green: 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white',
                  purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
                  slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-600 group-hover:text-white',
                }
                return (
                  <Link key={action.href} href={action.href}>
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${colors[action.color as keyof typeof colors]}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-slate-500">{action.desc}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Integrations */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Integrations</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700">Connect Stripe</p>
                    <p className="text-xs text-slate-500 mt-1">Accept payments</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Printer className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700">Setup Printer</p>
                    <p className="text-xs text-slate-500 mt-1">Print receipts</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700">Analytics</p>
                    <p className="text-xs text-slate-500 mt-1">Track performance</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Setup Checklist */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Checklist</CardTitle>
                <CardDescription>Complete these steps to launch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {setupSteps.map((step, i) => (
                    <div 
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        step.complete ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.complete 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}>
                        {step.complete ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${step.complete ? 'text-green-700' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-6 gap-2" size="lg">
                  Continue Setup
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Need Help? */}
            <Card className="mt-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Our team is here to help you get started.
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
