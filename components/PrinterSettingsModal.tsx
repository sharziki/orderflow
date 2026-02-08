'use client'

import React, { useState, useEffect } from 'react'
import { X, Printer, Usb, Wifi, Monitor, Check, AlertCircle } from 'lucide-react'
import { browserPrint, PrinterSettings } from '@/lib/browser-print'
import toast from 'react-hot-toast'

interface PrinterSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const [settings, setSettings] = useState<PrinterSettings>({
    printerType: 'browser',
    autoPrint: false,
    copies: 1,
  })
  const [isPairing, setIsPairing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [webSerialSupported, setWebSerialSupported] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const savedSettings = browserPrint.getPrinterSettings()
      setSettings(savedSettings)
      setWebSerialSupported(browserPrint.isWebSerialSupported())
    }
  }, [isOpen])

  const handleSave = () => {
    browserPrint.savePrinterSettings(settings)
    toast.success('Printer settings saved!')
    onClose()
  }

  const handlePairUSB = async () => {
    setIsPairing(true)
    try {
      const result = await browserPrint.pairPrinter()
      if (result.success) {
        toast.success('Printer paired successfully!')
        setSettings(prev => ({ ...prev, printerType: 'webserial' }))
      } else {
        toast.error(result.error || 'Failed to pair printer')
      }
    } catch (error) {
      toast.error('Failed to pair printer')
    } finally {
      setIsPairing(false)
    }
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    browserPrint.savePrinterSettings(settings) // Save before testing
    try {
      const result = await browserPrint.testPrint('Kitchen Printer')
      if (result.success) {
        toast.success('Test print sent!')
      } else {
        toast.error(result.error || 'Test print failed')
      }
    } catch (error) {
      toast.error('Test print failed')
    } finally {
      setIsTesting(false)
    }
  }

  const handleForgetPrinter = async () => {
    if (confirm('Forget paired printer and reset settings?')) {
      await browserPrint.forgetPrinter()
      setSettings({
        printerType: 'browser',
        autoPrint: false,
        copies: 1,
      })
      toast.success('Printer settings reset')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Printer Settings</h2>
                <p className="text-sm text-slate-500">Configure kitchen ticket printing</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Printer Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Printer Type</label>
              <div className="space-y-2">
                {/* USB Thermal Printer */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, printerType: 'webserial' }))}
                  disabled={!webSerialSupported}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    settings.printerType === 'webserial'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${!webSerialSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    settings.printerType === 'webserial' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Usb className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">USB Thermal Printer</p>
                    <p className="text-sm text-slate-500">Direct USB connection (Chrome/Edge only)</p>
                  </div>
                  {settings.printerType === 'webserial' && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </button>

                {/* Star Network Printer */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, printerType: 'star' }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    settings.printerType === 'star'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    settings.printerType === 'star' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">Star Network Printer</p>
                    <p className="text-sm text-slate-500">Star printers via WiFi/Ethernet</p>
                  </div>
                  {settings.printerType === 'star' && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </button>

                {/* Browser Print Dialog */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, printerType: 'browser' }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    settings.printerType === 'browser'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    settings.printerType === 'browser' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-900">Browser Print Dialog</p>
                    <p className="text-sm text-slate-500">Works with any printer (manual)</p>
                  </div>
                  {settings.printerType === 'browser' && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </button>
              </div>
            </div>

            {/* USB Pairing Button */}
            {settings.printerType === 'webserial' && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-3">
                  Connect your USB thermal printer. Make sure it's plugged in before pairing.
                </p>
                <button
                  onClick={handlePairUSB}
                  disabled={isPairing || !webSerialSupported}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Usb className="w-4 h-4" />
                  {isPairing ? 'Pairing...' : 'Pair USB Printer'}
                </button>
                {!webSerialSupported && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Web Serial not supported. Use Chrome or Edge browser.
                  </p>
                )}
              </div>
            )}

            {/* Star Printer IP */}
            {settings.printerType === 'star' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Star Printer IP Address</label>
                <input
                  type="text"
                  value={settings.starPrinterIP || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, starPrinterIP: e.target.value }))}
                  placeholder="192.168.1.100"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Find this in your Star printer's network settings
                </p>
              </div>
            )}

            {/* Auto-Print Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Auto-Print New Orders</p>
                <p className="text-sm text-slate-500">Automatically print tickets when new orders come in</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, autoPrint: !prev.autoPrint }))}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.autoPrint ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.autoPrint ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Number of Copies */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Copies per Order</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, copies: Math.max(1, prev.copies - 1) }))}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center text-xl font-bold text-slate-900">{settings.copies}</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, copies: Math.min(5, prev.copies + 1) }))}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Test Print */}
            <div className="border-t pt-6">
              <button
                onClick={handleTestPrint}
                disabled={isTesting}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                {isTesting ? 'Printing...' : 'Print Test Ticket'}
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={handleForgetPrinter}
              className="w-full text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              Reset Printer Settings
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t bg-slate-50">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
