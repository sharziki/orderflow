'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Search,
  Users,
  DollarSign,
  ShoppingBag,
  CreditCard,
  ExternalLink,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCcw
} from 'lucide-react'

interface Tenant {
  id: string
  slug: string
  name: string
  email: string
  phone: string | null
  city: string | null
  state: string | null
  isActive: boolean
  isOnboarded: boolean
  stripeOnboardingComplete: boolean
  createdAt: string
  _count: {
    orders: number
    menuItems: number
  }
}

interface Stats {
  totalTenants: number
  activeTenants: number
  stripeConnected: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(search)}`)
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Admin access required.')
          return
        }
        throw new Error('Failed to fetch tenants')
      }
      const data = await res.json()
      setTenants(data.tenants)
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTenants()
  }

  if (error === 'Unauthorized. Admin access required.') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">You don't have admin access.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Platform overview</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchTenants} disabled={loading}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Restaurants</p>
                    <p className="text-2xl font-bold">{stats.totalTenants}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeTenants}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Stripe Connected</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.stripeConnected}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-100">Total Revenue</p>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search restaurants..."
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No restaurants found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Restaurant</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Items</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Orders</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{tenant.name}</p>
                            <p className="text-sm text-slate-500">{tenant.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {tenant.city && tenant.state ? `${tenant.city}, ${tenant.state}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {tenant.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {tenant.stripeOnboardingComplete && (
                              <Badge variant="default" className="bg-purple-100 text-purple-700">Stripe</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{tenant._count.menuItems}</td>
                        <td className="py-3 px-4 text-slate-600">{tenant._count.orders}</td>
                        <td className="py-3 px-4 text-slate-500 text-sm">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <a 
                            href={`/store/${tenant.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
