'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StripeAccountStatus {
  success: boolean
  accountId: string | null
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirements?: {
    currentlyDue: string[]
    eventuallyDue: string[]
    pastDue: string[]
    disabledReason: string | null
  }
  capabilities?: {
    cardPayments: string
    transfers: string
  }
  country?: string
  email?: string
  businessProfile?: {
    name?: string
    mcc?: string
  }
}

export default function StripeConnectPage() {
  const [status, setStatus] = useState<StripeAccountStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    fetchStatus()

    // Check if returning from Stripe onboarding
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      // Refresh status after successful onboarding
      setTimeout(fetchStatus, 2000)
    } else if (urlParams.get('refresh') === 'true') {
      // User needs to refresh/restart onboarding
      setError('The onboarding session expired. Please start a new one.')
    }
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch account status')
        return
      }

      setStatus(data)
    } catch (err) {
      setError('Failed to connect to server')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async () => {
    try {
      setOnboarding(true)
      setError(null)

      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'restaurant@blubentonville.com', // Replace with actual restaurant email
          businessName: 'Blu Fish House',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create onboarding session')
        setOnboarding(false)
        return
      }

      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      } else {
        setError('No onboarding URL received')
        setOnboarding(false)
      }
    } catch (err) {
      setError('Failed to start onboarding')
      console.error(err)
      setOnboarding(false)
    }
  }

  const refreshOnboarding = async () => {
    try {
      setOnboarding(true)
      setError(null)

      const response = await fetch('/api/stripe/connect/onboard')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate new onboarding link')
        setOnboarding(false)
        return
      }

      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      } else {
        setError('No onboarding URL received')
        setOnboarding(false)
      }
    } catch (err) {
      setError('Failed to refresh onboarding')
      console.error(err)
      setOnboarding(false)
    }
  }

  const syncStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/connect/status', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to sync status')
        return
      }

      setStatus(data)

      // Also refresh the full status
      await fetchStatus()
    } catch (err) {
      setError('Failed to sync status')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--color-primary))] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Stripe Connect status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm text-[rgb(var(--color-primary))] hover:underline mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stripe Connect Setup</h1>
          <p className="text-gray-600">
            Configure your Stripe Connect account to receive payments from customers.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Account Status</h2>
                {status?.accountId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Account ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{status.accountId}</code>
                  </p>
                )}
              </div>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh status"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {!status?.accountId ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Stripe Connect Account
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You need to create and connect a Stripe account to start accepting payments from customers.
                </p>
                <button
                  onClick={startOnboarding}
                  disabled={onboarding}
                  className="btn-primary"
                >
                  {onboarding ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Start Stripe Connect Setup
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* Status Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatusIndicator
                    label="Onboarding Complete"
                    value={status.onboardingComplete}
                  />
                  <StatusIndicator
                    label="Charges Enabled"
                    value={status.chargesEnabled}
                  />
                  <StatusIndicator
                    label="Payouts Enabled"
                    value={status.payoutsEnabled}
                  />
                </div>

                {/* Capabilities */}
                {status.capabilities && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <CapabilityBadge
                        label="Card Payments"
                        status={status.capabilities.cardPayments}
                      />
                      <CapabilityBadge
                        label="Transfers"
                        status={status.capabilities.transfers}
                      />
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {status.requirements && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>

                    {status.requirements.currentlyDue?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-orange-700 mb-2">Currently Due:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {status.requirements.currentlyDue.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-orange-500">•</span>
                              <span>{req.replace(/_/g, ' ')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {status.requirements.pastDue?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-red-700 mb-2">Past Due:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {status.requirements.pastDue.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500">•</span>
                              <span>{req.replace(/_/g, ' ')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {status.requirements.disabledReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-900 mb-1">Account Disabled</p>
                        <p className="text-sm text-red-700">
                          {status.requirements.disabledReason.replace(/_/g, ' ')}
                        </p>
                      </div>
                    )}

                    {!status.requirements.currentlyDue?.length &&
                     !status.requirements.pastDue?.length &&
                     !status.requirements.disabledReason && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        All requirements met
                      </p>
                    )}
                  </div>
                )}

                {/* Business Info */}
                {(status.businessProfile || status.email || status.country) && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {status.businessProfile?.name && (
                        <div>
                          <dt className="text-gray-500">Business Name</dt>
                          <dd className="text-gray-900 font-medium">{status.businessProfile.name}</dd>
                        </div>
                      )}
                      {status.email && (
                        <div>
                          <dt className="text-gray-500">Email</dt>
                          <dd className="text-gray-900 font-medium">{status.email}</dd>
                        </div>
                      )}
                      {status.country && (
                        <div>
                          <dt className="text-gray-500">Country</dt>
                          <dd className="text-gray-900 font-medium">{status.country}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4 mt-4 flex flex-col sm:flex-row gap-3">
                  {!status.onboardingComplete && (
                    <button
                      onClick={refreshOnboarding}
                      disabled={onboarding}
                      className="btn-primary flex-1"
                    >
                      {onboarding ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Continue Stripe Onboarding
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={syncStatus}
                    disabled={loading}
                    className="btn-secondary flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Sync Status
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            About Stripe Connect
          </h3>
          <p className="text-blue-800 text-sm mb-3">
            Stripe Connect allows you to receive payments directly to your own Stripe account.
            The platform will handle payment processing and automatically transfer funds to you minus a small platform fee.
          </p>
          <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
            <li>Platform fee: $1.00 flat per order</li>
            <li>Stripe processing fee: 2.9% + $0.30 per transaction (deducted from your transfer)</li>
            <li>Automatic payouts to your bank account</li>
            <li>Full transaction history in your Stripe dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatusIndicator({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
      {value ? (
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      )}
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </div>
  )
}

function CapabilityBadge({ label, status }: { label: string; status: string }) {
  const getColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className={`px-3 py-2 rounded-lg border ${getColor()} text-sm font-medium`}>
      {label}: {status}
    </div>
  )
}
