import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import * as dnsPacket from 'dns-packet'

// Helper function to resolve SRV records
async function resolveSRVRecords(domain: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const query = dnsPacket.encode({
      type: 'query',
      id: Math.floor(Math.random() * 65535),
      questions: [
        {
          type: 'SRV',
          name: domain
        }
      ]
    })

    const socket = require('dgram').createSocket('udp4')
    let isResolved = false
    
    const closeSocket = () => {
      if (!isResolved) {
        isResolved = true
        try {
          socket.close()
        } catch (error) {
          // Socket already closed, ignore
        }
      }
    }
    
    socket.on('message', (message: Buffer) => {
      try {
        const response = dnsPacket.decode(message)
        const srvRecords: any[] = []
        
        if (response.answers) {
          response.answers.forEach((answer: any) => {
            if (answer.type === 'SRV') {
              srvRecords.push({
                name: answer.name,
                port: answer.data.port,
                priority: answer.data.priority,
                weight: answer.data.weight,
                target: answer.data.target
              })
            }
          })
        }
        
        closeSocket()
        resolve(srvRecords)
      } catch (error) {
        closeSocket()
        reject(error)
      }
    })

    socket.on('error', (error: Error) => {
      closeSocket()
      reject(error)
    })

    // Send query to Google DNS
    socket.send(query, 0, query.length, 53, '8.8.8.8')
    
    // Timeout after 5 seconds
    setTimeout(() => {
      closeSocket()
      if (!isResolved) {
        resolve([])
      }
    }, 5000)
  })
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    console.log(`[pagerodeo] DNS check for ${domain}`)

    // TEST MODE: Special domains to simulate errors
    if (domain.startsWith('test-')) {
      const errorType = domain.replace('test-', '').replace(/\..+$/, '')
      console.log(`[DNS API] TEST MODE: Simulating ${errorType} error`)
      
      switch (errorType) {
        case '403':
        case 'forbidden':
          return NextResponse.json(
            { error: 'Access forbidden. The server blocked this request.' },
            { status: 403 }
          )
        case '404':
        case 'notfound':
          return NextResponse.json(
            { error: 'Resource not found' },
            { status: 404 }
          )
        case '429':
        case 'ratelimit':
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          )
        case '500':
        case 'server':
          return NextResponse.json(
            { error: 'Internal server error occurred' },
            { status: 500 }
          )
        case '401':
        case 'auth':
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        case '408':
        case 'timeout':
          return NextResponse.json(
            { error: 'Request timeout' },
            { status: 408 }
          )
        case 'network':
          throw new Error('ECONNREFUSED: Connection refused')
        case 'parse':
          // Return invalid JSON to trigger parse error
          return new Response('{ invalid json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
      }
    }

    const resolver = new dns.Resolver()
    resolver.setServers(['8.8.8.8', '1.1.1.1'])

    const results: any = {
      domain,
      timestamp: new Date().toISOString(),
      dns: {
        ipv4: [],
        ipv6: [],
        mx: [],
        txt: [],
        ns: [],
        soa: null,
        cname: [],
        srv: []
      }
    }

    // A Records (IPv4)
    try {
      const aRecords = await promisify(resolver.resolve4.bind(resolver))(domain)
      results.dns.ipv4 = aRecords
      console.log(`[pagerodeo] Found ${aRecords.length} A records`)
    } catch (error) {
      console.log(`[pagerodeo] No A records found: ${error}`)
    }

    // AAAA Records (IPv6)
    try {
      const aaaaRecords = await promisify(resolver.resolve6.bind(resolver))(domain)
      results.dns.ipv6 = aaaaRecords
    } catch (error) {
      // Keep empty array for no records
    }

    // MX Records
    try {
      const mxRecords = await promisify(resolver.resolveMx.bind(resolver))(domain)
      results.dns.mx = mxRecords.map((mx: any) => `${mx.priority} ${mx.exchange}`)
    } catch (error) {
      // Keep empty array for no records
    }

    // TXT Records
    try {
      const txtRecords = await promisify(resolver.resolveTxt.bind(resolver))(domain)
      results.dns.txt = txtRecords.flat()
    } catch (error) {
      // Keep empty array for no records
    }

    // NS Records
    try {
      const nsRecords = await promisify(resolver.resolveNs.bind(resolver))(domain)
      results.dns.ns = nsRecords
    } catch (error) {
      // Keep empty array for no records
    }

    // SOA Record
    try {
      const soa = await promisify(resolver.resolveSoa.bind(resolver))(domain)
      results.dns.soa = soa
    } catch (error) {
      // Keep null for no SOA record
    }

    // CNAME Records
    try {
      const cnameRecords = await promisify(resolver.resolveCname.bind(resolver))(domain)
      results.dns.cname = cnameRecords
    } catch (error) {
      // Keep empty array for no CNAME records
    }

    // SRV Records - Using dns-packet for SRV resolution
    try {
      const srvRecords = await resolveSRVRecords(domain)
      results.dns.srv = srvRecords
    } catch (error) {
      // Keep empty array for no SRV records
    }

    // Check if domain has ANY DNS records - if not, it likely doesn't exist
    const hasAnyRecords = results.dns.ipv4.length > 0 ||
                          results.dns.ipv6.length > 0 ||
                          results.dns.mx.length > 0 ||
                          results.dns.ns.length > 0

    if (!hasAnyRecords) {
      console.log(`[pagerodeo] Domain ${domain} has no DNS records - likely doesn't exist`)
      return NextResponse.json({
        success: false,
        code: 'DNS_NOT_FOUND',
        message: `Domain ${domain} cannot be resolved.`,
        domain
      }, { status: 200 })
    }

    console.log(`[pagerodeo] DNS results:`, JSON.stringify(results, null, 2))
    return NextResponse.json(results)

  } catch (error) {
    console.error('[pagerodeo] DNS check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform DNS check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'DNS Checker API is running',
    timestamp: new Date().toISOString()
  })
}