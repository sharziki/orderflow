/**
 * Browser-Based Printer Service
 * Direct thermal printer control via Web Serial API (USB) and Star WebPRNT (Network)
 * Fallback to native browser print dialog for unsupported browsers
 */

import { formatOrderTicket, formatTestTicket, formatHTMLTicket } from './ticket-formatter'

// Web Serial API type declarations
declare global {
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>
      getPorts(): Promise<SerialPort[]>
    }
  }

  interface SerialPort {
    readonly readable: ReadableStream | null
    readonly writable: WritableStream | null
    open(options: { baudRate: number }): Promise<void>
    close(): Promise<void>
  }
}

// Printer Settings stored in localStorage
export interface PrinterSettings {
  printerType: 'webserial' | 'star' | 'browser'
  autoPrint: boolean
  copies: number
  starPrinterIP?: string
  lastPairedDeviceId?: string
}

const DEFAULT_SETTINGS: PrinterSettings = {
  printerType: 'browser',
  autoPrint: false,
  copies: 1
}

const SETTINGS_KEY = 'orderflow-printer-settings'

class BrowserPrintService {
  private port: SerialPort | null = null
  private writer: WritableStreamDefaultWriter | null = null

  getPrinterSettings(): PrinterSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS

    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('[BrowserPrint] Error loading settings:', error)
    }

    return DEFAULT_SETTINGS
  }

  savePrinterSettings(settings: Partial<PrinterSettings>): void {
    if (typeof window === 'undefined') return

    try {
      const current = this.getPrinterSettings()
      const updated = { ...current, ...settings }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('[BrowserPrint] Error saving settings:', error)
    }
  }

  isWebSerialSupported(): boolean {
    return typeof window !== 'undefined' && 'serial' in navigator
  }

  async pairPrinter(): Promise<{ success: boolean; error?: string }> {
    if (!this.isWebSerialSupported()) {
      return {
        success: false,
        error: 'Web Serial API not supported. Please use Chrome or Edge browser.'
      }
    }

    if (!navigator.serial) {
      return { success: false, error: 'Serial API not available' }
    }

    try {
      this.port = await navigator.serial.requestPort()
      await this.port.open({ baudRate: 9600 })
      console.log('[BrowserPrint] Printer paired successfully')
      return { success: true }
    } catch (error) {
      console.error('[BrowserPrint] Pairing failed:', error)
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          return { success: false, error: 'No printer selected' }
        }
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Unknown error occurred' }
    }
  }

  private async connectToUSBPrinter(): Promise<boolean> {
    if (!this.isWebSerialSupported() || !navigator.serial) return false

    try {
      if (this.port && this.port.readable) return true

      const ports = await navigator.serial.getPorts()
      if (ports.length === 0) {
        console.warn('[BrowserPrint] No paired printers found')
        return false
      }

      this.port = ports[0]
      if (!this.port.readable) {
        await this.port.open({ baudRate: 9600 })
      }

      if (this.port.writable) {
        this.writer = this.port.writable.getWriter()
      } else {
        console.error('[BrowserPrint] Port not writable')
        return false
      }

      console.log('[BrowserPrint] Connected to USB printer')
      return true
    } catch (error) {
      console.error('[BrowserPrint] USB connection failed:', error)
      return false
    }
  }

  private async disconnectUSBPrinter(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.releaseLock()
        this.writer = null
      }
      if (this.port) {
        await this.port.close()
        this.port = null
      }
    } catch (error) {
      console.error('[BrowserPrint] Disconnect error:', error)
    }
  }

  private async printViaWebSerial(content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connected = await this.connectToUSBPrinter()
      if (!connected || !this.writer) {
        return { success: false, error: 'Printer not connected. Please pair your printer first.' }
      }

      const encoder = new TextEncoder()
      const data = encoder.encode(content)
      await this.writer.write(data)

      console.log('[BrowserPrint] Printed via Web Serial')
      return { success: true }
    } catch (error) {
      console.error('[BrowserPrint] Web Serial print failed:', error)
      await this.disconnectUSBPrinter()
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Unknown error occurred' }
    }
  }

  private async printViaStar(content: string, printerIP: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `http://${printerIP}/StarWebPRNT/SendMessage`
      const base64Content = btoa(content)

      const request = {
        request: [{
          appendEncoding: 'US-ASCII',
          appendRawData: base64Content
        }]
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Star printer returned ${response.status}`)
      }

      console.log('[BrowserPrint] Printed via Star WebPRNT')
      return { success: true }
    } catch (error) {
      console.error('[BrowserPrint] Star WebPRNT print failed:', error)
      if (error instanceof Error) {
        return { success: false, error: `Star printer error: ${error.message}` }
      }
      return { success: false, error: 'Star printer communication failed' }
    }
  }

  async printViaBrowser(htmlContent: string): Promise<{ success: boolean; error?: string }> {
    try {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.top = '-9999px'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve()
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc && iframeDoc.readyState === 'complete') {
          resolve()
        } else {
          setTimeout(() => resolve(), 100)
        }
      })

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not access iframe document')
      }

      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      await new Promise(resolve => setTimeout(resolve, 500))

      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()

      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 2000)

      console.log('[BrowserPrint] Triggered browser print dialog')
      return { success: true }
    } catch (error) {
      console.error('[BrowserPrint] Browser print failed:', error)
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Browser print failed' }
    }
  }

  async printTicket(order: any): Promise<{ success: boolean; error?: string }> {
    const settings = this.getPrinterSettings()
    const ticketContent = formatOrderTicket(order)

    let result: { success: boolean; error?: string } | null = null

    switch (settings.printerType) {
      case 'webserial':
        result = await this.printViaWebSerial(ticketContent)
        if (!result.success) {
          console.warn('[BrowserPrint] Web Serial failed, falling back to browser print')
          const htmlContent = formatHTMLTicket(order)
          result = await this.printViaBrowser(htmlContent)
        }
        break

      case 'star':
        if (!settings.starPrinterIP) {
          return { success: false, error: 'Star printer IP address not configured' }
        }
        result = await this.printViaStar(ticketContent, settings.starPrinterIP)
        break

      case 'browser':
        const htmlContent = formatHTMLTicket(order)
        result = await this.printViaBrowser(htmlContent)
        break

      default:
        return { success: false, error: 'Invalid printer type configured' }
    }

    if (result.success && settings.copies > 1) {
      for (let i = 1; i < settings.copies; i++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        await this.printTicket(order)
      }
    }

    return result
  }

  async testPrint(printerName: string = 'Kitchen Printer'): Promise<{ success: boolean; error?: string }> {
    const settings = this.getPrinterSettings()
    const testContent = formatTestTicket(printerName)

    switch (settings.printerType) {
      case 'webserial':
        return await this.printViaWebSerial(testContent)

      case 'star':
        if (!settings.starPrinterIP) {
          return { success: false, error: 'Star printer IP address not configured' }
        }
        return await this.printViaStar(testContent, settings.starPrinterIP)

      case 'browser':
        const testHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Test Print</title>
            <style>
              @media print { @page { size: 80mm auto; margin: 0; } }
              body { font-family: monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10mm; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="center bold">TEST PRINT</div>
            <div class="center">================================</div>
            <div>Printer: ${printerName}</div>
            <div>Time: ${new Date().toLocaleString()}</div>
            <br>
            <div>If you can read this message,</div>
            <div>your printer is configured</div>
            <div>correctly!</div>
            <br>
            <div class="center">ORDER FLOW</div>
            <div class="center">Kitchen Printer System</div>
          </body>
          </html>
        `
        return await this.printViaBrowser(testHTML)

      default:
        return { success: false, error: 'Invalid printer type configured' }
    }
  }

  async forgetPrinter(): Promise<void> {
    if (this.port) {
      await this.disconnectUSBPrinter()
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SETTINGS_KEY)
    }
    console.log('[BrowserPrint] Printer forgotten')
  }
}

export const browserPrint = new BrowserPrintService()
