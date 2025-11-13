// Uptime Kuma Integration Library
// This provides utilities to integrate with Uptime Kuma self-hosted monitoring

interface UptimeKumaConfig {
  baseUrl: string
  username?: string
  password?: string
  apiKey?: string
}

interface UptimeKumaMonitor {
  id?: number
  name: string
  type: 'http' | 'https' | 'tcp' | 'ping' | 'dns'
  url?: string
  hostname?: string
  port?: number
  interval: number
  retryInterval?: number
  maxRetries?: number
  upside_down?: boolean
  notification_id_list?: number[]
  httpBodyEncoding?: string
  description?: string
  keyword?: string
  ignoreTls?: boolean
  accepted_statuscodes?: string[]
}

interface UptimeKumaStatus {
  id: number
  name: string
  url: string
  status: 0 | 1 | 2 // 0 = down, 1 = up, 2 = pending
  uptime: number
  ping: number
  avg_ping: number
  cert_exp?: number
  cert_info?: {
    valid: boolean
    validTo: string
    daysRemaining: number
  }
}

export class UptimeKumaClient {
  private config: UptimeKumaConfig
  private token?: string

  constructor(config: UptimeKumaConfig) {
    this.config = config
  }

  // Login to Uptime Kuma and get token
  async login(): Promise<void> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username and password required for Uptime Kuma login')
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.token = data.token
    } catch (error) {
      throw new Error(`Failed to login to Uptime Kuma: ${error}`)
    }
  }

  // Add a new monitor
  async addMonitor(monitor: UptimeKumaMonitor): Promise<number> {
    const response = await this.request('/api/monitor', 'POST', monitor)
    return response.monitorID
  }

  // Get monitor status
  async getMonitorStatus(monitorId: number): Promise<UptimeKumaStatus> {
    return await this.request(`/api/monitor/${monitorId}`)
  }

  // Get all monitors
  async getMonitors(): Promise<UptimeKumaStatus[]> {
    const response = await this.request('/api/monitor')
    return response.monitors
  }

  // Update monitor
  async updateMonitor(monitorId: number, updates: Partial<UptimeKumaMonitor>): Promise<void> {
    await this.request(`/api/monitor/${monitorId}`, 'PATCH', updates)
  }

  // Delete monitor
  async deleteMonitor(monitorId: number): Promise<void> {
    await this.request(`/api/monitor/${monitorId}`, 'DELETE')
  }

  // Get uptime statistics
  async getUptimeStats(monitorId: number, period: '24h' | '7d' | '30d' | '1y' = '30d'): Promise<{
    uptime: number
    incidents: number
    avgResponseTime: number
  }> {
    const response = await this.request(`/api/monitor/${monitorId}/uptime?period=${period}`)
    return {
      uptime: response.uptime,
      incidents: response.incidents,
      avgResponseTime: response.avgResponseTime
    }
  }

  // Private method to make authenticated requests
  private async request(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    } else if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Uptime Kuma API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }
}

// Utility function to create monitor from URL
export function createMonitorFromUrl(url: string, name?: string): UptimeKumaMonitor {
  const parsedUrl = new URL(url)
  
  return {
    name: name || parsedUrl.hostname,
    type: parsedUrl.protocol === 'https:' ? 'https' : 'http',
    url: url,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port ? parseInt(parsedUrl.port) : (parsedUrl.protocol === 'https:' ? 443 : 80),
    interval: 60, // Check every 60 seconds
    retryInterval: 60,
    maxRetries: 3,
    upside_down: false,
    ignoreTls: false,
    accepted_statuscodes: ['200-299'],
    description: `Monitor for ${url} created by PageRodeo`
  }
}

// Example usage:
/*
const kumaClient = new UptimeKumaClient({
  baseUrl: 'http://localhost:3001', // Your Uptime Kuma instance
  username: 'admin',
  password: 'your_password'
})

// Login and add monitor
await kumaClient.login()
const monitor = createMonitorFromUrl('https://example.com')
const monitorId = await kumaClient.addMonitor(monitor)

// Get status
const status = await kumaClient.getMonitorStatus(monitorId)
console.log('Monitor status:', status)
*/
