/**
 * PrintNode Service Integration
 * Handles communication with PrintNode cloud printing API
 * Documentation: https://www.printnode.com/en/docs/api/curl
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { formatOrderTicket, formatTestTicket } from './ticket-formatter'
import { supabase } from './supabase'

const PRINTNODE_API_KEY = process.env.PRINTNODE_API_KEY
const PRINTNODE_BASE_URL = process.env.PRINTNODE_BASE_URL || 'https://api.printnode.com'

// PrintNode API Types
export interface PrintNodePrinter {
  id: number
  computer: {
    id: number
    name: string
  }
  name: string
  description: string
  capabilities: string[]
  default: boolean
  createTimestamp: string
  state: 'online' | 'offline' | 'error'
}

export interface PrintNodePrintJob {
  id: number
  printer: number
  title: string
  contentType: string
  source: string
  createTimestamp: string
  state: 'new' | 'sent' | 'done' | 'error'
}

export interface PrintJobOptions {
  title?: string
  contentType?: 'raw_base64' | 'pdf_base64' | 'raw_uri' | 'pdf_uri'
  source?: string
  qty?: number
}

class PrintNodeService {
  private client: AxiosInstance

  constructor() {
    if (!PRINTNODE_API_KEY) {
      console.warn('[PrintNode] API key not configured. Printer functionality will be disabled.')
    }

    this.client = axios.create({
      baseURL: PRINTNODE_BASE_URL,
      auth: {
        username: PRINTNODE_API_KEY || '',
        password: ''
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Check if PrintNode is configured and accessible
   */
  async isConfigured(): Promise<boolean> {
    if (!PRINTNODE_API_KEY) {
      return false
    }

    try {
      await this.getAccount()
      return true
    } catch (error) {
      console.error('[PrintNode] Configuration check failed:', error)
      return false
    }
  }

  /**
   * Get PrintNode account information
   */
  async getAccount() {
    try {
      const response = await this.client.get('/whoami')
      return response.data
    } catch (error) {
      this.handleError(error, 'getAccount')
      throw error
    }
  }

  /**
   * List all available printers
   */
  async listPrinters(): Promise<PrintNodePrinter[]> {
    try {
      const response = await this.client.get<PrintNodePrinter[]>('/printers')
      return response.data
    } catch (error) {
      this.handleError(error, 'listPrinters')
      throw error
    }
  }

  /**
   * Get a specific printer by ID
   */
  async getPrinter(printerId: number): Promise<PrintNodePrinter> {
    try {
      const response = await this.client.get<PrintNodePrinter>(`/printers/${printerId}`)
      return response.data
    } catch (error) {
      this.handleError(error, 'getPrinter')
      throw error
    }
  }

  /**
   * Send a print job to PrintNode
   */
  async createPrintJob(
    printerId: number,
    content: string,
    options: PrintJobOptions = {}
  ): Promise<number> {
    const {
      title = 'Kitchen Order',
      contentType = 'raw_base64',
      qty = 1
    } = options

    // Convert content to base64 if using raw_base64
    const encodedContent = contentType === 'raw_base64'
      ? Buffer.from(content).toString('base64')
      : content

    const payload = {
      printerId,
      title,
      contentType,
      content: encodedContent,
      source: 'Blu Fish House',
      qty
    }

    try {
      const response = await this.client.post('/printjobs', payload)

      // PrintNode returns the job ID directly as a number
      const jobId = typeof response.data === 'number' ? response.data : response.data.id

      console.log(`[PrintNode] Print job created: ${jobId} for printer ${printerId}`)
      return jobId
    } catch (error) {
      this.handleError(error, 'createPrintJob')
      throw error
    }
  }

  /**
   * Get print job status
   */
  async getPrintJobStatus(jobId: number): Promise<PrintNodePrintJob> {
    try {
      const response = await this.client.get<PrintNodePrintJob>(`/printjobs/${jobId}`)
      return response.data
    } catch (error) {
      this.handleError(error, 'getPrintJobStatus')
      throw error
    }
  }

  /**
   * Print an order ticket
   */
  async printOrderTicket(
    orderId: string,
    printNodePrinterId: number,
    retryCount: number = 0
  ): Promise<{ success: boolean; jobId?: number; error?: string }> {
    const MAX_RETRIES = 3
    const RETRY_DELAYS = [2000, 4000, 8000] // Exponential backoff: 2s, 4s, 8s

    try {
      // Fetch the full order with items and customer info
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .eq('id', orderId)
        .single()

      const order = orderData as any

      if (error || !order) {
        throw new Error(`Order ${orderId} not found`)
      }

      // Transform order to expected format for ticket formatter
      const formattedOrder = {
        id: order.id,
        orderType: order.order_type,
        deliveryAddress: order.delivery_address,
        notes: order.notes,
        scheduledPickupTime: order.scheduled_pickup_time,
        createdAt: order.created_at,
        customer: order.customer,
        items: order.items?.map((item: any) => ({
          quantity: item.quantity,
          menuItem: item.menu_item
        }))
      }

      // Format the ticket
      const ticketContent = formatOrderTicket(formattedOrder as any)

      // Send to PrintNode
      const jobId = await this.createPrintJob(printNodePrinterId, ticketContent, {
        title: `Order #${order.id.slice(-6).toUpperCase()}`,
        contentType: 'raw_base64'
      })

      return { success: true, jobId }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[PrintNode] Print failed for order ${orderId} (attempt ${retryCount + 1}):`, errorMessage)

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount]
        console.log(`[PrintNode] Retrying in ${delay}ms...`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return this.printOrderTicket(orderId, printNodePrinterId, retryCount + 1)
      }

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Send a test print to verify printer is working
   */
  async sendTestPrint(printerId: number, printerName: string): Promise<{ success: boolean; jobId?: number; error?: string }> {
    try {
      const ticketContent = formatTestTicket(printerName)

      const jobId = await this.createPrintJob(printerId, ticketContent, {
        title: 'Test Print',
        contentType: 'raw_base64'
      })

      return { success: true, jobId }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[PrintNode] Test print failed:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleError(error: unknown, method: string) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error(`[PrintNode][${method}] Error:`, {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      })
    } else {
      console.error(`[PrintNode][${method}] Unexpected error:`, error)
    }
  }
}

// Export singleton instance
export const printNodeService = new PrintNodeService()

/**
 * Helper function to print order to all enabled printers of a specific type
 */
export async function printOrderToKitchen(orderId: string): Promise<{
  printed: number
  failed: number
  results: Array<{ printerId: string; success: boolean; error?: string }>
}> {
  try {
    // Get all enabled kitchen printers
    const { data: printersData, error } = await supabase
      .from('printers')
      .select('*')
      .eq('enabled', true)
      .in('type', ['KITCHEN', 'RECEIPT'])

    const printers = (printersData || []) as any[]

    if (error || printers.length === 0) {
      console.warn('[PrintNode] No enabled kitchen printers found')
      return { printed: 0, failed: 0, results: [] }
    }

    const results: Array<{ printerId: string; success: boolean; error?: string }> = []
    let printed = 0
    let failed = 0

    // Print to each printer
    for (const printer of printers) {
      const result = await printNodeService.printOrderTicket(orderId, printer.printnode_id)

      // Create print job record in database
      await (supabase
        .from('print_jobs') as any)
        .insert({
          order_id: orderId,
          printer_id: printer.id,
          status: result.success ? 'PRINTED' : 'FAILED',
          attempts: 1,
          last_error: result.error,
          printnode_job_id: result.jobId
        })

      results.push({
        printerId: printer.id,
        success: result.success,
        error: result.error
      })

      if (result.success) {
        printed++
      } else {
        failed++
      }
    }

    return { printed, failed, results }

  } catch (error) {
    console.error('[PrintNode] Error printing order to kitchen:', error)
    throw error
  }
}
