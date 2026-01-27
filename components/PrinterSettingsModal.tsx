'use client'

import { useState, useEffect } from 'react'
import { X, Printer, Wifi, Usb, Globe, CheckCircle, AlertCircle } from 'lucide-react'
import { browserPrint, PrinterSettings } from '@/lib/browser-print'
import toast from 'react-hot-toast'

interface PrinterSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const [settings, setSettings] = useState<PrinterSettings>(browserPrint.getPrinterSettings())
  const [isTesting, setIsTesting] = useState(false)
  const [isPairing, setIsPairing] = useState(false)
  const [isWebSerialSupported, setIsWebSerialSupported] = useState(false)

  useEffect(() => {
    // Check Web Serial API support
    setIsWebSerialSupported(browserPrint.isWebSerialSupported())

    // Load current settings
    setSettings(browserPrint.getPrinterSettings())
  }, [isOpen])

  const handleSave = () => {
    browserPrint.savePrinterSettings(settings)
    toast.success('Printer settings saved')
    onClose()
  }

  const handlePairPrinter = async () => {
    setIsPairing(true)

    try {
      const result = await browserPrint.pairPrinter()

      if (result.success) {
        toast.success('Printer paired successfully! Click Save to confirm.')
        setSettings({ ...settings, printerType: 'webserial' })
      } else {
        toast.error(result.error || 'Failed to pair printer')
      }
    } catch (error) {
      console.error('Pairing error:', error)
      toast.error('Unexpected error while pairing printer')
    } finally {
      setIsPairing(false)
    }
  }

  const handleTestPrint = async () => {
    setIsTesting(true)

    try {
      // Save settings first
      browserPrint.savePrinterSettings(settings)

      const result = await browserPrint.testPrint('Kitchen Printer')

      if (result.success) {
        toast.success('Test print sent! Check your printer.')
      } else {
        toast.error(result.error || 'Test print failed')
      }
    } catch (error) {
      console.error('Test print error:', error)
      toast.error('Unexpected error during test print')
    } finally {
      setIsTesting(false)
    }
  }

  const handleForgetPrinter = async () => {
    if (confirm('Are you sure you want to forget the paired printer?')) {
      await browserPrint.forgetPrinter()
      setSettings(browserPrint.getPrinterSettings())
      toast.success('Printer forgotten. You will need to pair again.')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 border-b border-gray-200 p-6 flex items-start justify-between text-white">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Printer className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Printer Settings</h2>
              </div>
              <p className="text-sm text-blue-100">
                Configure your kitchen printer for automatic order printing
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Printer Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Printer Type
              </label>
              <div className="space-y-3">
                {/* Web Serial API (USB) */}
                <div
                  onClick={() => isWebSerialSupported && setSettings({ ...settings, printerType: 'webserial' })}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    settings.printerType === 'webserial'
                      ? 'border-[rgb(var(--color-primary))] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!isWebSerialSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Usb className={`w-5 h-5 mt-0.5 ${settings.printerType === 'webserial' ? 'text-[rgb(var(--color-primary))]' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">USB Thermal Printer (Recommended)</h3>
                        {settings.printerType === 'webserial' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Direct USB connection using Web Serial API. Works with most thermal printers.
                      </p>
                      {!isWebSerialSupported && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Not supported in your browser. Please use Chrome or Edge.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Star WebPRNT (Network) */}
                <div
                  onClick={() => setSettings({ ...settings, printerType: 'star' })}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    settings.printerType === 'star'
                      ? 'border-[rgb(var(--color-primary))] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Wifi className={`w-5 h-5 mt-0.5 ${settings.printerType === 'star' ? 'text-[rgb(var(--color-primary))]' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">Star Micronics Network Printer</h3>
                        {settings.printerType === 'star' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Network printer with CloudPRNT/WebPRNT support (Star TSP650/700, etc.)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Browser Print Dialog (Fallback) */}
                <div
                  onClick={() => setSettings({ ...settings, printerType: 'browser' })}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    settings.printerType === 'browser'
                      ? 'border-[rgb(var(--color-primary))] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Globe className={`w-5 h-5 mt-0.5 ${settings.printerType === 'browser' ? 'text-[rgb(var(--color-primary))]' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">Browser Print Dialog (Fallback)</h3>
                        {settings.printerType === 'browser' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Use your browser's native print dialog. Works with any printer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Star Printer IP (if Star selected) */}
            {settings.printerType === 'star' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Star Printer IP Address
                </label>
                <input
                  type="text"
                  value={settings.starPrinterIP || ''}
                  onChange={(e) => setSettings({ ...settings, starPrinterIP: e.target.value })}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the IP address of your Star network printer. You can find this in your printer's network settings.
                </p>
              </div>
            )}

            {/* Pair Printer Button (for Web Serial) */}
            {settings.printerType === 'webserial' && isWebSerialSupported && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  USB Printer Connection
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handlePairPrinter}
                    disabled={isPairing}
                    className="flex-1 bg-[rgb(var(--color-primary))] hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Usb className="w-5 h-5" />
                    {isPairing ? 'Pairing...' : 'Pair USB Printer'}
                  </button>
                  <button
                    onClick={handleForgetPrinter}
                    className="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Forget
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Pair USB Printer" to connect your thermal printer via USB. You only need to do this once.
                </p>
              </div>
            )}

            {/* Auto-Print Toggle */}
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-gray-700">Auto-Print Orders</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically print orders when they are confirmed by restaurant
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.autoPrint}
                    onChange={(e) => setSettings({ ...settings, autoPrint: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
                </div>
              </label>
            </div>

            {/* Number of Copies */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Copies
              </label>
              <select
                value={settings.copies}
                onChange={(e) => setSettings({ ...settings, copies: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
              >
                <option value={1}>1 copy</option>
                <option value={2}>2 copies</option>
                <option value={3}>3 copies</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Print multiple copies of each ticket (e.g., one for kitchen, one for expo)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6 flex gap-3">
              <button
                onClick={handleTestPrint}
                disabled={isTesting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                {isTesting ? 'Printing...' : 'Test Print'}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-[rgb(var(--color-primary))] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
