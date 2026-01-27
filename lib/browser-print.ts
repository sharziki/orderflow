/**
 * Browser-Based Printer Service
 * Direct thermal printer control via Web Serial API (USB) and Star WebPRNT (Network)
 * Fallback to native browser print dialog for unsupported browsers
 *
 * Browser Support:
 * - Web Serial API: Chrome 89+, Edge 89+ (USB thermal printers)
 * - Star WebPRNT: All modern browsers (Star network printers)
 * - Browser Print: All browsers (fallback)
 */

import { formatOrderTicket, formatTestTicket } from './ticket-formatter'

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
  printerType: 'webserial',
  autoPrint: true,
  copies: 1
}

const SETTINGS_KEY = 'blu-fish-printer-settings'

class BrowserPrintService {
  private port: SerialPort | null = null
  private writer: WritableStreamDefaultWriter | null = null

  /**
   * Get printer settings from localStorage
   */
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

  /**
   * Save printer settings to localStorage
   */
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

  /**
   * Check if Web Serial API is supported
   */
  isWebSerialSupported(): boolean {
    return typeof window !== 'undefined' && 'serial' in navigator
  }

  /**
   * Pair a USB thermal printer using Web Serial API
   */
  async pairPrinter(): Promise<{ success: boolean; error?: string }> {
    if (!this.isWebSerialSupported()) {
      return {
        success: false,
        error: 'Web Serial API not supported. Please use Chrome or Edge browser.'
      }
    }

    if (!navigator.serial) {
      return {
        success: false,
        error: 'Serial API not available'
      }
    }

    try {
      // Request user to select a USB serial device
      this.port = await navigator.serial.requestPort()

      // Open the port with standard thermal printer baud rate
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

  /**
   * Connect to previously paired USB printer
   */
  private async connectToUSBPrinter(): Promise<boolean> {
    if (!this.isWebSerialSupported() || !navigator.serial) {
      return false
    }

    try {
      // If already connected, return true
      if (this.port && this.port.readable) {
        return true
      }

      // Get list of previously paired devices
      const ports = await navigator.serial.getPorts()

      if (ports.length === 0) {
        console.warn('[BrowserPrint] No paired printers found')
        return false
      }

      // Use the first paired port (in production, you might want to let user select)
      this.port = ports[0]

      // Open the port if not already open
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

  /**
   * Disconnect from USB printer
   */
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

  /**
   * Print via Web Serial API (USB thermal printer)
   */
  private async printViaWebSerial(content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connected = await this.connectToUSBPrinter()

      if (!connected || !this.writer) {
        return { success: false, error: 'Printer not connected. Please pair your printer first.' }
      }

      // Convert string to Uint8Array
      const encoder = new TextEncoder()
      const data = encoder.encode(content)

      // Write to printer
      await this.writer.write(data)

      console.log('[BrowserPrint] Printed via Web Serial')

      // Keep connection open for next print
      // await this.disconnectUSBPrinter()

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

  /**
   * Print via Star WebPRNT (Network thermal printer)
   */
  private async printViaStar(content: string, printerIP: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Star WebPRNT uses HTTP POST to send print jobs
      const url = `http://${printerIP}/StarWebPRNT/SendMessage`

      // Convert content to base64
      const base64Content = btoa(content)

      const request = {
        request: [{
          appendEncoding: 'US-ASCII',
          appendRawData: base64Content
        }]
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

  /**
   * Print via native browser print dialog (fallback)
   */
  private async printViaBrowser(htmlContent: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not access iframe document')
      }

      // Write content to iframe
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 250))

      // Trigger print
      iframe.contentWindow?.print()

      // Clean up after print (wait a bit for dialog to open)
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)

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

  /**
   * Main print method - automatically selects best printing method
   */
  async printTicket(order: any): Promise<{ success: boolean; error?: string }> {
    const settings = this.getPrinterSettings()
    const ticketContent = formatOrderTicket(order)

    let result: { success: boolean; error?: string } | null = null

    // Print based on configured printer type
    switch (settings.printerType) {
      case 'webserial':
        result = await this.printViaWebSerial(ticketContent)

        // Fallback to browser print if Web Serial fails
        if (!result.success) {
          console.warn('[BrowserPrint] Web Serial failed, falling back to browser print')
          const { formatHTMLTicket } = await import('./ticket-formatter')
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
        const { formatHTMLTicket } = await import('./ticket-formatter')
        const htmlContent = formatHTMLTicket(order)
        result = await this.printViaBrowser(htmlContent)
        break

      default:
        return { success: false, error: 'Invalid printer type configured' }
    }

    // Print multiple copies if configured
    if (result.success && settings.copies > 1) {
      for (let i = 1; i < settings.copies; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait between copies
        await this.printTicket(order)
      }
    }

    return result
  }

  /**
   * Send test print
   */
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
              @media print {
                @page { size: 80mm auto; margin: 0; }
              }
              body {
                font-family: monospace;
                font-size: 12px;
                width: 80mm;
                margin: 0;
                padding: 10mm;
              }
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
            <div class="center">BLU FISH HOUSE</div>
            <div class="center">Kitchen Printer System</div>
          </body>
          </html>
        `
        return await this.printViaBrowser(testHTML)

      default:
        return { success: false, error: 'Invalid printer type configured' }
    }
  }

  /**
   * Forget paired printer
   */
  async forgetPrinter(): Promise<void> {
    if (this.port) {
      await this.disconnectUSBPrinter()
    }

    // Clear settings
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SETTINGS_KEY)
    }

    console.log('[BrowserPrint] Printer forgotten')
  }
}

// Export singleton instance
export const browserPrint = new BrowserPrintService()
